import "server-only";

import { createServiceClient } from "../../supabase/service";
import type { OpenAiActiveCostReadResult } from "../active-contracts";
import type { OpenAiCostsPeriod } from "../contracts";
import { readOpenAiActiveCostPages } from "./activeCostReadModelAdapterCore";

export async function readOpenAiActiveCosts(
  period: OpenAiCostsPeriod,
): Promise<OpenAiActiveCostReadResult> {
  try {
    const client = createServiceClient();
    return await readOpenAiActiveCostPages({
      period,
      readPage: async (cursor, limit) => await client.rpc("read_openai_active_cost_rows_v1", {
        p_start_at: new Date(period.startTime * 1_000).toISOString(),
        p_end_at: new Date(period.endTime * 1_000).toISOString(),
        p_after_started_at: cursor?.startedAt ?? null,
        p_after_execution_id: cursor?.executionId ?? null,
        p_after_operation_sequence: cursor?.operationSequence ?? null,
        p_limit: limit,
      }),
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
