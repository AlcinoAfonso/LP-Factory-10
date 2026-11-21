import { z } from "zod";
import type { OpenAiActiveCostExecution, OpenAiActiveCostReadModel, OpenAiCostReadWorkloadId } from "./active-contracts";
import { addDecimal, decimalFromNonNegativeString, decimalZero, formatDecimal } from "./decimal";
export {
  COST_LEDGER_PAGE_SIZE as DIALOGUE_PAGE_SIZE,
  readCostLedgerPages as readDialoguePages,
  translateCostLedger as translateDialogueLedger,
} from "./adapters/costLedgerReadAdapterCore";

export const dialogueIdentitySchema = z.object({ dialogueId: z.uuid(), accountId: z.uuid() }).strict();
const metadataSchema = z.object({ id: z.uuid(), account_id: z.uuid(), origin: z.enum(["pending_setup", "account_niche"]),
  started_at: z.iso.datetime({ offset: true }), ended_at: z.iso.datetime({ offset: true }).nullable() });
export type OpenAiCostDialogue = Readonly<{ dialogueId: string; accountId: string; origin: "pending_setup" | "account_niche";
  startedAt: string; endedAt: string | null; accountName?: string | null; workloads?: readonly OpenAiCostReadWorkloadId[] }>;
export type DialogueListResult = Readonly<{ ok: true; dialogues: readonly OpenAiCostDialogue[] }> | Readonly<{ ok: false; code: string }>;
export type DialogueCostDetail = Readonly<{ dialogue: OpenAiCostDialogue; executions: readonly OpenAiActiveCostExecution[];
  calculatedCostUsd: string | null; status: "accumulated" | "final" | "partial" | "unrecorded";
  callCount: number; attemptCount: number; retryCount: number; webSearchCallCount: number; unknownSearchCount: number;
  pendingCount: number; unavailableCount: number; missingOperationCount: number }>;
export type DialogueCostResult = Readonly<{ ok: true; value: DialogueCostDetail }> | Readonly<{ ok: false; code: string }>;

export function parseCostDialogue(raw: unknown): OpenAiCostDialogue | null {
  const parsed = metadataSchema.safeParse(raw);
  if (!parsed.success || (parsed.data.ended_at && Date.parse(parsed.data.ended_at) < Date.parse(parsed.data.started_at))) return null;
  const row = parsed.data;
  return { dialogueId: row.id, accountId: row.account_id, origin: row.origin, startedAt: row.started_at, endedAt: row.ended_at };
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
