import { z } from "zod";
import type { OpenAiActiveCostExecution } from "./active-contracts";
import { addDecimal, decimalFromNonNegativeString, decimalZero, formatDecimal } from "./decimal";

export const category3CostIdentitySchema = z.object({
  generationId: z.uuid(), accountId: z.uuid(), environment: z.enum(["production", "preview", "development"]),
}).strict();
export type Category3CostIdentity = z.infer<typeof category3CostIdentitySchema>;
export type Category3ObservedStart = Readonly<Category3CostIdentity & { accountName: string; startedAt: string }>;
export type Category3Outcome = "saved" | "failed" | "interrupted" | "unconfirmed";

const evidenceSchema = z.object({
  id: z.uuid(),
  event: z.enum(["category_3_generation_attempt", "category_3_generation_saved", "category_3_generation_failed", "category_3_generation_interrupted"]),
  changes_json: z.object({ environment: z.enum(["production", "preview", "development"]), execution_ids: z.array(z.uuid()).optional() }),
});

export function buildCategory3CostDetail(
  identity: Category3CostIdentity, executions: readonly OpenAiActiveCostExecution[], evidence: readonly unknown[],
) {
  const attempts = new Set<string>();
  const observedExecutions = new Set<string>();
  const outcomes = new Set<Exclude<Category3Outcome, "unconfirmed">>();
  for (const raw of evidence) {
    const entry = evidenceSchema.parse(raw);
    if (entry.changes_json.environment !== identity.environment) throw Error("category_3_evidence_scope_invalid");
    if (entry.event === "category_3_generation_attempt") {
      attempts.add(entry.id);
    } else {
      if (!entry.changes_json.execution_ids?.length) throw Error("category_3_evidence_execution_missing");
      entry.changes_json.execution_ids.forEach(id => observedExecutions.add(id));
      outcomes.add(entry.event === "category_3_generation_saved" ? "saved"
        : entry.event === "category_3_generation_failed" ? "failed" : "interrupted");
    }
  }
  const executionsById = new Set<string>();
  const operationIds = new Set<string>();
  let total = decimalZero();
  let calculatedCount = 0;
  let retryCount = 0;
  let searches = 0;
  let unknownSearchCount = 0;
  let pendingCount = 0;
  let unavailableCount = 0;
  let missingCount = 0;
  for (const execution of executions) {
    if (executionsById.has(execution.executionId) || execution.accountId !== identity.accountId || execution.environment !== identity.environment ||
        execution.universe !== "client" || execution.attributionStatus !== "attributed" || execution.executionOrigin !== "runtime" ||
        execution.workload !== "communication_base_stage2_intelligence" || execution.economicEvent?.kind !== "category_3_generation" ||
        execution.economicEvent.eventId !== identity.generationId) throw Error("category_3_execution_scope_invalid");
    executionsById.add(execution.executionId);
    if (!attempts.has(execution.executionId) || execution.operations.length === 0) missingCount++;
    if (!execution.finishedAt && execution.operations.every(operation => operation.finishedAt !== null)) pendingCount++;
    for (const operation of execution.operations) {
      if (operationIds.has(operation.operationId)) throw Error("category_3_duplicate_operation");
      operationIds.add(operation.operationId);
      if (operation.retryOfOperationId) {
        if (!execution.operations.some(prior => prior.operationId === operation.retryOfOperationId && prior.sequence < operation.sequence))
          throw Error("category_3_retry_invalid");
        retryCount++;
      }
      if (operation.webSearchCallCount === null) unknownSearchCount++;
      else searches += operation.webSearchCallCount;
      if (!operation.finishedAt) pendingCount++;
      else if (operation.costStatus === "unavailable") unavailableCount++;
      else {
        const amount = decimalFromNonNegativeString(operation.costUsd ?? "");
        if (!amount) throw Error("category_3_cost_invalid");
        total = addDecimal(total, amount);
        calculatedCount++;
      }
    }
  }
  for (const id of new Set([...attempts, ...observedExecutions])) {
    if (!executionsById.has(id)) missingCount++;
  }
  const uncoveredAttempt = [...attempts, ...executionsById].some(id => !observedExecutions.has(id));
  const outcome: Category3Outcome = outcomes.has("saved") ? "saved"
    : outcomes.size === 1 && !uncoveredAttempt ? outcomes.values().next().value! : "unconfirmed";
  const costStatus = !calculatedCount ? "unavailable"
    : outcome === "unconfirmed" || pendingCount || unavailableCount || missingCount ? "partial" : "complete";
  return {
    identity, outcome, costStatus, executions, calculatedCostUsd: calculatedCount ? formatDecimal(total) : null,
    attemptCount: operationIds.size, retryCount, searches, unknownSearchCount, pendingCount, unavailableCount, missingCount,
  } as const;
}

export type Category3CostResult =
  | Readonly<{ ok: true; value: ReturnType<typeof buildCategory3CostDetail> }>
  | Readonly<{ ok: false }>;
