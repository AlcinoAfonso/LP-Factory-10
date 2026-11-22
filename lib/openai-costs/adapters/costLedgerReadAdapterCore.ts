import { z } from "zod";
import { translateOpenAiActiveCostRows } from "./activeCostReadModelAdapterCore";

export type CostLedgerPage = Readonly<{ data: unknown; error: unknown }>;
export const COST_LEDGER_PAGE_SIZE = 500;

// Every page must be exhausted; a truncated or repeating page never becomes a total.
export async function readCostLedgerPages(readPage: (afterId: string | null) => Promise<CostLedgerPage>): Promise<Record<string, unknown>[]> {
  const rows: Record<string, unknown>[] = [];
  let cursor: string | null = null;
  for (let page = 0; page < 10_000; page++) {
    const result = await readPage(cursor);
    if (result.error || !Array.isArray(result.data) || result.data.length > COST_LEDGER_PAGE_SIZE) throw Error("cost_ledger_read_failed");
    if (result.data.length === 0) return rows;
    for (const raw of result.data) {
      if (!raw || typeof raw !== "object" || Array.isArray(raw) || !z.uuid().safeParse(raw.id).success || (cursor !== null && raw.id <= cursor))
        throw Error("cost_ledger_pagination_incomplete");
      rows.push(raw); cursor = raw.id;
    }
  }
  throw Error("cost_ledger_pagination_incomplete");
}

// Adapt the existing tables to the already validated financial row contract. No prices are recalculated.
export function translateCostLedger(
  executions: readonly Record<string, unknown>[],
  operations: readonly Record<string, unknown>[],
  accountName?: string,
) {
  const linkedOperations = new Map(executions.map(row => [row.id, [] as Record<string, unknown>[]]));
  for (const operation of operations) {
    const linked = linkedOperations.get(operation.execution_id);
    if (!linked) throw Error("cost_operation_unlinked");
    linked.push(operation);
  }
  const rows = executions.flatMap(execution => {
    const linked = linkedOperations.get(execution.id)!;
    return (linked.length ? linked : [null]).map(operation => ({ ...execution, ...(operation ?? {}),
      cursor_started_at: execution.started_at, execution_id: execution.id, operation_sequence: operation?.sequence ?? 0,
      account_name: execution.account_id === null ? null : accountName ?? "Conta " + execution.account_id,
      landing_page_name: execution.landing_page_id,
      taxon_name: execution.taxon_id,
      execution_finished_at: execution.finished_at, execution_result: execution.result, execution_failure_category: execution.failure_category,
      operation_id: operation?.id ?? null, operation_started_at: operation?.started_at ?? null,
      operation_finished_at: operation?.finished_at ?? null, operation_result: operation?.result ?? null,
      operation_failure_category: operation?.failure_category ?? null,
    }));
  }).sort((a, b) => String(a.cursor_started_at).localeCompare(String(b.cursor_started_at)) || String(a.execution_id).localeCompare(String(b.execution_id)) || Number(a.operation_sequence) - Number(b.operation_sequence));
  const translated = translateOpenAiActiveCostRows({ period: { startTime: 0, endTime: 253402300799 }, rows, coverageRows: [] });
  if (!translated.ok) throw Error("cost_ledger_invalid");
  return translated.value;
}
