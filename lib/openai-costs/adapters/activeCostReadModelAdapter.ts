import "server-only";

import { z } from "zod";
import { createServiceClient } from "../../supabase/service";
import type { OpenAiActiveCostExecution, OpenAiActiveCostReadModel, OpenAiActiveCostReadResult } from "../active-contracts";
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
    const initialV2 = await client.rpc("read_openai_active_cost_rows_v2", args(null, 500));
    const useV1 = isExpectedMissingRpcError(initialV2.error, "read_openai_active_cost_rows_v2");
    if (initialV2.error && !useV1) {
      return {
        ok: false,
        error: { code: "READ_FAILED", message: "OpenAI active costs could not be read" },
      };
    }
    let firstPage = useV1 ? null : initialV2;
    const rpcName = useV1 ? "read_openai_active_cost_rows_v1" : "read_openai_active_cost_rows_v2";
    const result = await readOpenAiActiveCostPages({
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
    return result.ok && !useV1 ? { ok: true, value: await attachCategory3Links(client, result.value).catch(() => result.value) } : result;
  } catch {
    return {
      ok: false,
      error: { code: "READ_FAILED", message: "OpenAI active costs could not be read" },
    };
  }
}

const category3Link = z.object({
  id: z.uuid(), account_id: z.uuid(), environment: z.enum(["preview", "production", "development"]),
  economic_event_id: z.uuid(),
});

async function attachCategory3Links(client: ReturnType<typeof createServiceClient>, model: OpenAiActiveCostReadModel) {
  const candidates = model.executions.filter(row => row.workload === "communication_base_stage2_intelligence" &&
    row.executionOrigin === "runtime" && row.universe === "client" && row.attributionStatus === "attributed" &&
    row.accountId && row.economicEvent === null);
  if (!candidates.length) return model;
  const links = new Map<string, OpenAiActiveCostExecution>();
  for (let offset = 0; offset < candidates.length; offset += 100) {
    const batch = candidates.slice(offset, offset + 100);
    const { data, error } = await client.from("openai_cost_executions")
      .select("id,account_id,environment,economic_event_id")
      .eq("economic_event_kind", "category_3_generation").in("id", batch.map(row => row.executionId)).limit(batch.length);
    // Keep the proven financial rows even when the supplementary association cannot be read.
    if (error || !Array.isArray(data)) return model;
    for (const raw of data) {
      const link = category3Link.safeParse(raw);
      if (!link.success) return model;
      const row = batch.find(candidate => candidate.executionId === link.data.id &&
        candidate.accountId === link.data.account_id && candidate.environment === link.data.environment);
      if (!row || link.data.economic_event_id === row.executionId || links.has(row.executionId)) return model;
      links.set(row.executionId, { ...row, economicEvent: { kind: "category_3_generation", eventId: link.data.economic_event_id } });
    }
  }
  return links.size ? { ...model, executions: model.executions.map(row => links.get(row.executionId) ?? row) } : model;
}
