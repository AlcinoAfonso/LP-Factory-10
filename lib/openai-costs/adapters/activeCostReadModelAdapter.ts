import "server-only";

import { createServiceClient } from "../../supabase/service";
import type { OpenAiActiveCostReadResult } from "../active-contracts";
import type { OpenAiCostsPeriod } from "../contracts";
import { OPENAI_ACTIVE_COST_COVERAGE_MAX_ROWS, readOpenAiActiveCostPages } from "./activeCostReadModelAdapterCore";
import { isExpectedMissingRpcError } from "./activeCostTrackingAdapterCore";

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
    let initial = await client.rpc(rpcName, args(null, 500));
    if (isExpectedMissingRpcError(initial.error, rpcName)) {
      rpcName = "read_openai_active_cost_rows_v2";
      initial = await client.rpc(rpcName, args(null, 500));
    }
    const useV1 = rpcName === "read_openai_active_cost_rows_v2" && isExpectedMissingRpcError(initial.error, rpcName);
    if (initial.error && !useV1) {
      return {
        ok: false,
        error: { code: "READ_FAILED", message: "OpenAI active costs could not be read" },
      };
    }
    let firstPage = useV1 ? null : initial;
    if (useV1) rpcName = "read_openai_active_cost_rows_v1";
    return await readOpenAiActiveCostPages({
      period,
      economicDimensionStatus: useV1 ? "v1_fallback" : "v2_active",
      readPage: async (cursor, limit) => {
        if (firstPage && cursor === null) {
          const page = firstPage;
          firstPage = null;
          return page;
        }
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
