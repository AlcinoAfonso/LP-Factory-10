import { z } from "zod";
import type { OpenAiActiveCostReadModel } from "./active-contracts";

export const category3CostIdentitySchema = z.object({
  generationId: z.uuid(), accountId: z.uuid(), environment: z.enum(["production", "preview", "development"]),
}).strict();
export type Category3CostIdentity = z.infer<typeof category3CostIdentitySchema>;

export function buildCategory3CostDetail(identity: Category3CostIdentity, model: OpenAiActiveCostReadModel) {
  const executions = new Set<string>();
  const operations = new Set<string>();
  let hasCalculatedCost = false;
  let retryCount = 0;
  let searches = 0;
  let unknownSearchCount = 0;
  let missingCount = 0;
  let pendingCount = model.pendingOperationCount;
  for (const execution of model.executions) {
    if (executions.has(execution.executionId) || execution.accountId !== identity.accountId || execution.environment !== identity.environment ||
        execution.universe !== "client" || execution.attributionStatus !== "attributed" || execution.executionOrigin !== "runtime" ||
        execution.workload !== "communication_base_stage2_intelligence" || execution.economicEvent?.kind !== "category_3_generation" ||
        execution.economicEvent.eventId !== identity.generationId) throw Error("category_3_execution_scope_invalid");
    executions.add(execution.executionId);
    if (!execution.operations.length) missingCount++;
    if (!execution.finishedAt && !execution.pendingOperationCount) pendingCount++;
    for (const operation of execution.operations) {
      if (operations.has(operation.operationId)) throw Error("category_3_duplicate_operation");
      operations.add(operation.operationId);
      if (operation.retryOfOperationId) retryCount++;
      if (operation.webSearchCallCount === null) unknownSearchCount++;
      else searches += operation.webSearchCallCount;
      if (operation.costStatus === "calculated" && operation.costUsd !== null) hasCalculatedCost = true;
    }
  }
  return {
    outcome: "unconfirmed", executions: model.executions, calculatedCostUsd: hasCalculatedCost ? model.totalCalculatedUsd : null,
    attemptCount: operations.size, retryCount, searches, unknownSearchCount, pendingCount,
    unavailableCount: model.unavailableOperationCount, missingCount,
  } as const;
}

export type Category3CostResult =
  | Readonly<{ ok: true; value: ReturnType<typeof buildCategory3CostDetail> }>
  | Readonly<{ ok: false }>;
