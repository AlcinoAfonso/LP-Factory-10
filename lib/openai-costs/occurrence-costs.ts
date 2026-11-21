import { z } from "zod";
import type { OpenAiActiveCostExecution } from "./active-contracts";
import { addDecimal, decimalFromNonNegativeString, decimalZero, formatDecimal } from "./decimal";

export const occurrenceCostQuerySchema = z.discriminatedUnion("by", [
  z.object({ by: z.literal("occurrence"), id: z.uuid().transform(id => id.toLowerCase()) }).strict(),
  z.object({ by: z.literal("execution"), id: z.uuid().transform(id => id.toLowerCase()) }).strict(),
]);
export type OccurrenceCostQuery = z.output<typeof occurrenceCostQuerySchema>;

export type OccurrenceCostDetail = Readonly<{
  occurrenceId: string;
  closedAt: string | null;
  status: "complete" | "accumulated" | "partial" | "unavailable";
  calculatedCostUsd: string | null;
  operationCount: number;
  pendingCount: number;
  unavailableCount: number;
  executions: readonly OpenAiActiveCostExecution[];
}>;

export type OccurrenceCostResult =
  | Readonly<{ ok: true; value: OccurrenceCostDetail }>
  | Readonly<{ ok: false; code: "UNAUTHORIZED" | "INVALID_ID" | "NOT_FOUND" | "READ_FAILED" }>;

export function buildOccurrenceCostDetail(
  occurrenceId: string,
  closedAt: string | null,
  executions: readonly OpenAiActiveCostExecution[],
): OccurrenceCostDetail {
  const scope = executions[0];
  if (!scope) throw Error("occurrence_execution_missing");

  const operationIds = new Set<string>();
  let total = decimalZero();
  let calculated = 0;
  let pendingCount = 0;
  let unavailableCount = 0;
  for (const execution of executions) {
    if (execution.attributionStatus !== "attributed" || execution.universe !== scope.universe ||
        execution.accountId !== scope.accountId || execution.environment !== scope.environment ||
        execution.executionOrigin !== scope.executionOrigin) throw Error("occurrence_scope_invalid");

    const previousAttempts = new Set<string>();
    for (const operation of execution.operations) {
      if (operationIds.has(operation.operationId) ||
          (operation.retryOfOperationId && !previousAttempts.has(operation.retryOfOperationId))) {
        throw Error("occurrence_operation_link_invalid");
      }
      operationIds.add(operation.operationId);
      previousAttempts.add(operation.operationId);
      if (!operation.finishedAt) {
        pendingCount++;
      } else if (operation.costStatus === "unavailable") {
        unavailableCount++;
      } else {
        const cost = decimalFromNonNegativeString(operation.costUsd);
        if (!cost) throw Error("occurrence_cost_invalid");
        total = addDecimal(total, cost);
        calculated++;
      }
    }
  }
  return {
    occurrenceId, closedAt, executions,
    status: calculated === 0 ? "unavailable" : pendingCount || unavailableCount ? "partial" : closedAt ? "complete" : "accumulated",
    calculatedCostUsd: calculated === 0 ? null : formatDecimal(total),
    operationCount: operationIds.size,
    pendingCount, unavailableCount,
  };
}
