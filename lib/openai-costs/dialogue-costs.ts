import { z } from "zod";
import type { OpenAiActiveCostExecution, OpenAiActiveCostReadModel } from "./active-contracts";
import { addDecimal, decimalFromNonNegativeString, decimalZero, formatDecimal } from "./decimal";
import { translateOpenAiActiveCostRows } from "./adapters/activeCostReadModelAdapterCore";

export const dialogueIdentitySchema = z.object({ dialogueId: z.uuid(), accountId: z.uuid() }).strict();
const metadataSchema = z.object({ id: z.uuid(), account_id: z.uuid(), origin: z.enum(["pending_setup", "account_niche"]),
  started_at: z.iso.datetime({ offset: true }), ended_at: z.iso.datetime({ offset: true }).nullable() });
export type OpenAiCostDialogue = Readonly<{ dialogueId: string; accountId: string; origin: "pending_setup" | "account_niche";
  startedAt: string; endedAt: string | null }>;
export type DialogueListResult = Readonly<{ ok: true; dialogues: readonly OpenAiCostDialogue[] }> | Readonly<{ ok: false; code: string }>;
export type DialogueCostDetail = Readonly<{ dialogue: OpenAiCostDialogue; executions: readonly OpenAiActiveCostExecution[];
  calculatedCostUsd: string | null; status: "accumulated" | "final" | "partial" | "unrecorded";
  callCount: number; attemptCount: number; retryCount: number; webSearchCallCount: number; unknownSearchCount: number;
  pendingCount: number; unavailableCount: number; missingOperationCount: number }>;
export type DialogueCostResult = Readonly<{ ok: true; value: DialogueCostDetail }> | Readonly<{ ok: false; code: string }>;
export type DialoguePage = Readonly<{ data: unknown; error: unknown }>;
export const DIALOGUE_PAGE_SIZE = 500;

export function parseCostDialogue(raw: unknown): OpenAiCostDialogue | null {
  const parsed = metadataSchema.safeParse(raw);
  if (!parsed.success || (parsed.data.ended_at && Date.parse(parsed.data.ended_at) < Date.parse(parsed.data.started_at))) return null;
  const row = parsed.data;
  return { dialogueId: row.id, accountId: row.account_id, origin: row.origin, startedAt: row.started_at, endedAt: row.ended_at };
}

// Every page must be exhausted; a truncated or repeating page never becomes a total.
export async function readDialoguePages(readPage: (afterId: string | null) => Promise<DialoguePage>): Promise<Record<string, unknown>[]> {
  const rows: Record<string, unknown>[] = [];
  let cursor: string | null = null;
  for (let page = 0; page < 10_000; page++) {
    const result = await readPage(cursor);
    if (result.error || !Array.isArray(result.data) || result.data.length > DIALOGUE_PAGE_SIZE) throw Error("dialogue_read_failed");
    if (result.data.length === 0) return rows;
    for (const raw of result.data) {
      if (!raw || typeof raw !== "object" || Array.isArray(raw) || !z.uuid().safeParse(raw.id).success || (cursor !== null && raw.id <= cursor))
        throw Error("dialogue_pagination_incomplete");
      rows.push(raw); cursor = raw.id;
    }
  }
  throw Error("dialogue_pagination_incomplete");
}

export function buildDialogueCostDetail(dialogue: OpenAiCostDialogue, model: OpenAiActiveCostReadModel): DialogueCostDetail {
  let total = decimalZero();
  let attemptCount = 0, retryCount = 0, webSearchCallCount = 0, unknownSearchCount = 0;
  let pendingCount = 0, unavailableCount = 0, missingOperationCount = 0;
  const operationIds = new Set<string>();
  const executionIds = new Set<string>();
  for (const execution of model.executions) {
    if (executionIds.has(execution.executionId) || execution.universe !== "client" || execution.attributionStatus !== "attributed" ||
        execution.accountId !== dialogue.accountId || execution.economicEvent?.kind !== "niche_resolution" ||
        execution.economicEvent.eventId !== dialogue.dialogueId ||
        !["pending_setup_conversation", "niche_resolution"].includes(execution.workload)) throw Error("dialogue_link_invalid");
    executionIds.add(execution.executionId);
    if (execution.operations.length === 0) missingOperationCount++;
    if (!execution.finishedAt && execution.operations.every(operation => operation.finishedAt !== null)) pendingCount++;
    for (const operation of execution.operations) {
      if (operationIds.has(operation.operationId)) throw Error("dialogue_operation_duplicate");
      operationIds.add(operation.operationId); attemptCount++;
      if (operation.retryOfOperationId) {
        if (!execution.operations.some(prior => prior.operationId === operation.retryOfOperationId && prior.sequence < operation.sequence))
          throw Error("dialogue_retry_invalid");
        retryCount++;
      }
      if (!operation.finishedAt) pendingCount++;
      else if (operation.costStatus === "unavailable") unavailableCount++;
      if (operation.webSearchCallCount === null) unknownSearchCount++; else webSearchCallCount += operation.webSearchCallCount;
      if (operation.finishedAt && operation.costStatus === "calculated" && operation.costUsd !== null) {
        const cost = decimalFromNonNegativeString(operation.costUsd);
        if (!cost) throw Error("dialogue_cost_invalid");
        total = addDecimal(total, cost);
      }
    }
  }
  const status = attemptCount === 0 ? "unrecorded" : pendingCount || unavailableCount || missingOperationCount ? "partial"
    : dialogue.endedAt ? "final" : "accumulated";
  return { dialogue, executions: model.executions, calculatedCostUsd: attemptCount ? formatDecimal(total) : null, status,
    callCount: attemptCount - retryCount, attemptCount, retryCount, webSearchCallCount, unknownSearchCount,
    pendingCount, unavailableCount, missingOperationCount };
}

// Adapt the existing tables to the already validated financial row contract. No prices are recalculated.
export function translateDialogueLedger(executions: readonly Record<string, unknown>[], operations: readonly Record<string, unknown>[]) {
  const operationExecutions = new Set(executions.map(row => row.id));
  if (operations.some(row => !operationExecutions.has(row.execution_id))) throw Error("dialogue_operation_unlinked");
  const rows = executions.flatMap(execution => {
    const linked = operations.filter(operation => operation.execution_id === execution.id);
    return (linked.length ? linked : [null]).map(operation => ({ ...execution, ...(operation ?? {}),
      cursor_started_at: execution.started_at, execution_id: execution.id, operation_sequence: operation?.sequence ?? 0,
      account_name: "Conta " + execution.account_id,
      landing_page_name: null, taxon_name: null,
      execution_finished_at: execution.finished_at, execution_result: execution.result, execution_failure_category: execution.failure_category,
      operation_id: operation?.id ?? null, operation_started_at: operation?.started_at ?? null,
      operation_finished_at: operation?.finished_at ?? null, operation_result: operation?.result ?? null,
      operation_failure_category: operation?.failure_category ?? null,
    }));
  }).sort((a, b) => String(a.cursor_started_at).localeCompare(String(b.cursor_started_at)) || String(a.execution_id).localeCompare(String(b.execution_id)) || Number(a.operation_sequence) - Number(b.operation_sequence));
  const translated = translateOpenAiActiveCostRows({ period: { startTime: 0, endTime: 253402300799 }, rows, coverageRows: [] });
  if (!translated.ok) throw Error("dialogue_ledger_invalid");
  return translated.value;
}
