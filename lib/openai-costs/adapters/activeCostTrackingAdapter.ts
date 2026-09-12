import "server-only";

import { createServiceClient } from "../../supabase/service";
import type { OpenAiCostTrackingAdapter } from "../active-contracts";
import { calculateOpenAiOperationCost } from "../pricing";
import {
  executionFinishRpc,
  executionStartRpc,
  isExpectedMissingRpcError,
  legacyExecutionStartRpc,
  operationFinishRpc,
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
  const { error } = await client.rpc("start_openai_cost_execution_v2", executionStartRpc(input));
  if (!error) return;
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
      .select("model,started_at")
      .eq("id", input.operationId)
      .limit(2);
    if (error || !Array.isArray(data) || data.length !== 1) {
      throw new OpenAiCostTrackingPersistenceError("unavailable");
    }
    const row = data[0] as Record<string, unknown>;
    const financial = calculateOpenAiOperationCost({
      model: typeof row.model === "string" ? row.model : "",
      startedAt: typeof row.started_at === "string" ? row.started_at : "",
      usage: input.usage,
      webSearchCallCount: input.webSearchCallCount,
    });
    await invoke(client, "finish_openai_cost_operation_v2", operationFinishRpc(input, financial));
  },
  finishExecution: (input) => invoke(createServiceClient(), "finish_openai_cost_execution_v1", executionFinishRpc(input)),
});
