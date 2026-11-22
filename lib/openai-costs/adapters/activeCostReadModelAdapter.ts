import "server-only";

import { createServiceClient } from "../../supabase/service";
import type { OpenAiActiveCostReadResult } from "../active-contracts";
import type { OpenAiCostsPeriod } from "../contracts";
import { OPENAI_ACTIVE_COST_COVERAGE_MAX_ROWS, readOpenAiActiveCostPages } from "./activeCostReadModelAdapterCore";
import { isExpectedMissingRpcError } from "./activeCostTrackingAdapterCore";
import { decimalFromNonNegativeString } from "../decimal";
import type { ProductLifetimeCost } from "../occurrence-period";

export async function readOpenAiProductLifetimeCost(accountId: string): Promise<ProductLifetimeCost | null> {
  const { data, error } = await createServiceClient().rpc("read_openai_product_cost_v1", {
    p_account_id: accountId,
  }).single();
  if (error || !data || typeof data !== "object") return null;
  const row = data as Record<string, unknown>;
  const { calculated_usd: calculatedUsd, pending_count: pendingCount,
    unavailable_count: unavailableCount, open_occurrence_count: openOccurrenceCount } = row;
  if (calculatedUsd !== null && (typeof calculatedUsd !== "string" || !decimalFromNonNegativeString(calculatedUsd))) return null;
  const isCount = (value: unknown): value is number => typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
  if (!isCount(pendingCount) || !isCount(unavailableCount) || !isCount(openOccurrenceCount)) return null;
  return { calculatedUsd, pendingCount, unavailableCount, openOccurrenceCount };
}

export async function readOpenAiActiveCosts(
  period: OpenAiCostsPeriod,
): Promise<OpenAiActiveCostReadResult> {
  try {
    const client = createServiceClient();
    const args = (cursor: Parameters<Parameters<typeof readOpenAiActiveCostPages>[0]["readPage"]>[0], limit: number) => ({
      p_start_at: new Date(period.startTime * 1_000).toISOString(),
      p_end_at: new Date(period.endTime * 1_000).toISOString(),
      p_after_started_at: cursor?.startedAt ?? null,
      p_after_execution_id: cursor?.executionId ?? null,
      p_after_operation_sequence: cursor?.operationSequence ?? null,
      p_limit: limit,
    });
    let rpcName = "read_openai_active_cost_rows_v3";
    let firstPage = await client.rpc(rpcName, args(null, 500));
    if (isExpectedMissingRpcError(firstPage.error, rpcName)) {
      rpcName = "read_openai_active_cost_rows_v2";
      firstPage = await client.rpc(rpcName, args(null, 500));
      if (isExpectedMissingRpcError(firstPage.error, rpcName)) {
        rpcName = "read_openai_active_cost_rows_v1";
        firstPage = await client.rpc(rpcName, args(null, 500));
      }
    }
    if (firstPage.error) {
      return {
        ok: false,
        error: { code: "READ_FAILED", message: "OpenAI active costs could not be read" },
      };
    }
    const economicDimensionStatus = rpcName === "read_openai_active_cost_rows_v3" ? "v3_operation_period"
      : rpcName === "read_openai_active_cost_rows_v2" ? "v2_active" : "v1_fallback";
    return await readOpenAiActiveCostPages({
      period,
      economicDimensionStatus,
      readPage: async (cursor, limit) => {
        if (cursor === null) return firstPage;
        return await client.rpc(rpcName, args(cursor, limit));
      },
      readCoverage: async () => await client
        .from("openai_cost_coverage")
        .select("environment,workload,activated_at,contract_version")
        .order("environment", { ascending: true })
        .order("workload", { ascending: true })
        .limit(OPENAI_ACTIVE_COST_COVERAGE_MAX_ROWS + 1),
    });
  } catch {
    return {
      ok: false,
      error: { code: "READ_FAILED", message: "OpenAI active costs could not be read" },
    };
  }
}
