import "server-only";

import { createServiceClient } from "../../supabase/service";
import type {
  OpenAiCostsPeriod,
  OpenAiLpCostReadResult,
} from "../contracts";
import { readOpenAiLpCostPages } from "./lpCostReadModelAdapterCore";

export async function readOpenAiLpCosts(
  period: OpenAiCostsPeriod,
): Promise<OpenAiLpCostReadResult> {
  try {
    const client = createServiceClient();
    return await readOpenAiLpCostPages({
      period,
      readPage: async (from, to) =>
        client
          .rpc("read_openai_lp_cost_events_v1", {
            p_start_at: new Date(period.startTime * 1_000).toISOString(),
            p_end_at: new Date(period.endTime * 1_000).toISOString(),
          })
          .order("attempt_id", { ascending: true })
          .order("workload", { ascending: true })
          .range(from, to),
      readCoverage: async () => client
        .from("openai_lp_cost_coverage")
        .select("activated_at")
        .limit(2),
    });
  } catch {
    return readFailure();
  }
}

function readFailure(): OpenAiLpCostReadResult {
  return {
    ok: false,
    error: {
      code: "READ_FAILED",
      message: "OpenAI LP costs could not be read",
    },
  };
}
