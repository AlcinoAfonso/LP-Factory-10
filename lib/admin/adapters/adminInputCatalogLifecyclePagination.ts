export type CompletePage = Readonly<{
  rows: readonly unknown[];
  total: number;
}>;

export async function collectCompletePaginatedRows(input: Readonly<{
  pageSize: number;
  readPage: (offset: number, limit: number) => Promise<CompletePage | null>;
}>): Promise<Readonly<{ ok: true; rows: readonly unknown[] }> | Readonly<{ ok: false }>> {
  if (!Number.isSafeInteger(input.pageSize) || input.pageSize <= 0) {
    return { ok: false };
  }
  const rows: unknown[] = [];
  let expectedTotal: number | null = null;

  while (true) {
    const page = await input.readPage(rows.length, input.pageSize);
    if (
      !page ||
      !Number.isSafeInteger(page.total) ||
      page.total < 0 ||
      (expectedTotal !== null && page.total !== expectedTotal)
    ) {
      return { ok: false };
    }
    expectedTotal ??= page.total;
    if (page.rows.length === 0) {
      return rows.length === expectedTotal ? { ok: true, rows } : { ok: false };
    }
    rows.push(...page.rows);
    if (rows.length > expectedTotal) return { ok: false };
    if (rows.length === expectedTotal) return { ok: true, rows };
  }
}

/** One current page and one prefetch; all cursors in a scan share cancellation. */
export class LifecyclePageScan {
  failed = false;
  stopped = false;

  fail(): void {
    this.failed = true;
    this.stopped = true;
  }
}

export class CompleteLifecyclePageCursor {
  private current: readonly unknown[] | null = null;
  private index = 0;
  private pending: Promise<CompletePage | null> | null = null;
  private expectedTotal: number | null = null;
  private received = 0;
  private previousKey: string | null = null;

  constructor(private readonly input: Readonly<{
    pageSize: number;
    scan: LifecyclePageScan;
    readPage: (offset: number, limit: number) => Promise<CompletePage | null>;
    key: (row: unknown) => string | null;
  }>) {
    if (!Number.isSafeInteger(input.pageSize) || input.pageSize <= 0) {
      input.scan.fail();
    } else {
      this.prefetch();
    }
  }

  private prefetch(): void {
    if (this.input.scan.stopped || this.pending ||
        (this.expectedTotal !== null && this.received === this.expectedTotal)) return;
    const offset = this.received;
    // The rejection handler is attached immediately, including synchronous throws.
    this.pending = Promise.resolve().then(() => {
      if (this.input.scan.stopped) return null;
      return this.input.readPage(offset, this.input.pageSize);
    }).then((page) => {
      if (this.input.scan.stopped) return null;
      if (!page || !Array.isArray(page.rows) ||
          !Number.isSafeInteger(page.total) || page.total < 0 ||
          page.rows.length > this.input.pageSize ||
          (this.expectedTotal !== null && page.total !== this.expectedTotal) ||
          offset + page.rows.length > page.total ||
          (page.rows.length === 0 && offset !== page.total)) {
        this.input.scan.fail();
        return null;
      }
      // Reject invalid transport order before installing the page. Malformed keys
      // belong to the reader's semantic validation and retain its legacy message.
      for (const row of page.rows) {
        const key = this.input.key(row);
        if (key !== null) {
          if (this.previousKey !== null && this.previousKey.localeCompare(key) >= 0) {
            this.input.scan.fail();
            return null;
          }
          this.previousKey = key;
        }
      }
      this.expectedTotal ??= page.total;
      this.received = offset + page.rows.length;
      return page;
    }, () => {
      this.input.scan.fail();
      return null;
    }).catch(() => {
      this.input.scan.fail();
      return null;
    });
  }

  async peek(): Promise<unknown | undefined> {
    if (this.input.scan.stopped) return undefined;
    if (this.current && this.index < this.current.length) return this.current[this.index];
    this.current = null;
    this.index = 0;
    if (!this.pending) return undefined;
    const page = await this.pending;
    this.pending = null;
    if (!page || this.input.scan.stopped) return undefined;
    this.current = page.rows;
    this.prefetch();
    return this.current[this.index];
  }

  async take(): Promise<unknown | undefined> {
    const row = await this.peek();
    if (row !== undefined) this.index += 1;
    return row;
  }

  async close(): Promise<void> {
    this.current = null;
    this.index = 0;
    await this.pending;
    this.pending = null;
  }
}
