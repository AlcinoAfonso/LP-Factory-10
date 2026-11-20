import "server-only";

import { createServiceClient } from "../../supabase/service";
import type { OpenAiCostTrackingAdapter } from "../active-contracts";
import {
  executionFinishRpc,
  executionStartRpc,
  isExpectedMissingRpcError,
  legacyExecutionStartRpc,
  operationFinishRpc,
  operationFinancialTerminal,
  operationStartRpc,
  OpenAiCostTrackingPersistenceError,
} from "./activeCostTrackingAdapterCore";

type ServiceClient = ReturnType<typeof createServiceClient>;

async function invoke(client: ServiceClient, name: string, args: Record<string, unknown>) {
  const { error } = await client.rpc(name, args);
  if (error) {
    throw new OpenAiCostTrackingPersistenceError(
      error.code === "23505" ? "conflict" : "unavailable",
    );
  }
}

async function startExecutionWithRollout(
  client: ServiceClient,
  input: Parameters<OpenAiCostTrackingAdapter["startExecution"]>[0],
) {
  const payload = executionStartRpc(input);
  const { error } = await client.rpc("start_openai_cost_execution_v2", payload);
  if (!error) return;
  if (error.code === "23514" && error.message.includes('"openai_cost_executions_economic_event_chk"') &&
      payload.p_economic_event_kind === "category_3_generation" && payload.p_workload === "communication_base_stage2_intelligence" &&
      payload.p_execution_origin === "runtime" && payload.p_universe === "client" && payload.p_attribution_status === "attributed" &&
      payload.p_account_id && payload.p_economic_event_id && payload.p_economic_event_id !== payload.p_id) {
    // The prior constraint rejects the new kind. Keep the account's financial record during rollout.
    await invoke(client, "start_openai_cost_execution_v2", { ...payload, p_economic_event_kind: null, p_economic_event_id: null });
    return;
  }
  if (isExpectedMissingRpcError(error, "start_openai_cost_execution_v2")) {
    await invoke(client, "start_openai_cost_execution_v1", legacyExecutionStartRpc(input));
    return;
  }
  throw new OpenAiCostTrackingPersistenceError(error.code === "23505" ? "conflict" : "unavailable");
}

export const activeCostTrackingAdapter: OpenAiCostTrackingAdapter = Object.freeze({
  startExecution: (input) => startExecutionWithRollout(createServiceClient(), input),
  startOperation: (input) => invoke(createServiceClient(), "start_openai_cost_operation_v1", operationStartRpc(input)),
  finishOperation: async (input) => {
    const client = createServiceClient();
    const { data, error } = await client
      .from("openai_cost_operations")
      .select("model,started_at,finished_at,cost_status,cost_unavailable_reason,cost_usd::text,pricing_version,pricing_effective_at,pricing_snapshot,web_search_tool_version,web_search_price_per_call_usd::text")
      .eq("id", input.operationId)
      .limit(2);
    if (error || !Array.isArray(data) || data.length !== 1) {
      throw new OpenAiCostTrackingPersistenceError("unavailable");
    }
    const row = data[0] as Record<string, unknown>;
    const financial = operationFinancialTerminal(row, input);
    await invoke(client, "finish_openai_cost_operation_v2", operationFinishRpc(input, financial));
  },
  finishExecution: (input) => invoke(createServiceClient(), "finish_openai_cost_execution_v1", executionFinishRpc(input)),
});
