import { createHash } from "node:crypto";
import { z } from "zod";
import type { OpenAiActiveCostReadModel } from "./active-contracts";

export const category3CostIdentitySchema = z.object({
  generationId: z.uuid(), accountId: z.uuid(), environment: z.enum(["production", "preview", "development"]),
}).strict();
export type Category3CostIdentity = z.infer<typeof category3CostIdentitySchema>;

export const category3SavedEvent = "category_3_generation_saved";
export const category3SavedTable = "account_communication_bases";
export const category3SavedEvidenceSchema = z.object({
  environment: category3CostIdentitySchema.shape.environment,
  dispatch: z.object({ count: z.number().int().positive(), digest: z.string().regex(/^[a-f0-9]{64}$/) }).strict().optional(),
}).strict();
type Category3SavedEvidence = z.infer<typeof category3SavedEvidenceSchema>;

export function category3DispatchFingerprint(operationIds: ReadonlySet<string>) {
  return { count: operationIds.size, digest: createHash("sha256").update([...operationIds].sort().join("\n")).digest("hex") };
}

export function buildCategory3CostDetail(
  identity: Category3CostIdentity, model: OpenAiActiveCostReadModel, evidence?: Category3SavedEvidence | null,
) {
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
  const saved = evidence?.environment === identity.environment;
  const expected = saved ? evidence?.dispatch : undefined;
  const matchesSavedOperations = expected
    ? expected.count === operations.size && expected.digest === category3DispatchFingerprint(operations).digest
    : null;
  return {
    identity, outcome: saved ? "saved" : "unconfirmed", matchesSavedOperations,
    executions: model.executions, calculatedCostUsd: hasCalculatedCost ? model.totalCalculatedUsd : null,
    attemptCount: operations.size, retryCount, searches, unknownSearchCount, pendingCount,
    unavailableCount: model.unavailableOperationCount, missingCount,
  } as const;
}

export type Category3CostResult =
  | Readonly<{ ok: true; value: ReturnType<typeof buildCategory3CostDetail> }>
  | Readonly<{ ok: false }>;
