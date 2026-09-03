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
