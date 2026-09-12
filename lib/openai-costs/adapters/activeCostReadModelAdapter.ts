import "server-only";

import { createServiceClient } from "../../supabase/service";
import type { OpenAiActiveCostReadResult } from "../active-contracts";
import type { OpenAiCostsPeriod } from "../contracts";
import { readOpenAiActiveCostPages } from "./activeCostReadModelAdapterCore";
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
    const initialV2 = await client.rpc(
      "read_openai_active_cost_rows_v2",
      args(null, 500),
    );
    const useV1 = isExpectedMissingRpcError(
      initialV2.error,
      "read_openai_active_cost_rows_v2",
    );
    if (initialV2.error && !useV1) {
      return {
        ok: false,
        error: { code: "READ_FAILED", message: "OpenAI active costs could not be read" },
      };
    }
    let firstPage = useV1 ? null : initialV2;
    const rpcName = useV1
      ? "read_openai_active_cost_rows_v1"
      : "read_openai_active_cost_rows_v2";
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
        .limit(16),
    });
  } catch {
    return {
      ok: false,
      error: { code: "READ_FAILED", message: "OpenAI active costs could not be read" },
    };
  }
}
