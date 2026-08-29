import "server-only";

import { createServiceClient } from "../../supabase/service";
import type {
  OpenAiCostsPeriod,
  OpenAiLpCostReadResult,
} from "../contracts";
import {
  readCompleteOpenAiLpCostPages,
  translateOpenAiLpCostRows,
} from "./lpCostReadModelAdapterCore";

export async function readOpenAiLpCosts(
  period: OpenAiCostsPeriod,
): Promise<OpenAiLpCostReadResult> {
  try {
    const client = createServiceClient();
    const [events, coverage] = await Promise.all([
      readCompleteOpenAiLpCostPages(async (from, to) =>
        client
          .rpc("read_openai_lp_cost_events_v1", {
            p_start_at: new Date(period.startTime * 1_000).toISOString(),
            p_end_at: new Date(period.endTime * 1_000).toISOString(),
          })
          .range(from, to),
      ),
      client
        .from("openai_lp_cost_coverage")
        .select("activated_at")
        .limit(2),
    ]);
    if (events.error) {
      return events.error instanceof Error && events.error.message === "pagination_incomplete"
        ? paginationFailure()
        : readFailure();
    }
    if (coverage.error) return readFailure();
    return translateOpenAiLpCostRows({
      period,
      eventRows: events.data,
      coverageRows: coverage.data,
    });
  } catch {
    return readFailure();
  }
}

function paginationFailure(): OpenAiLpCostReadResult {
  return {
    ok: false,
    error: {
      code: "PAGINATION_INCOMPLETE",
      message: "OpenAI LP costs pagination is incomplete",
    },
  };
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
