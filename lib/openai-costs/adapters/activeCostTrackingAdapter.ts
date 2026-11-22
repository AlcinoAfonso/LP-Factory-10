import "server-only";

import { createServiceClient } from "../../supabase/service";
import { lpFactoryOpenAiCostContext, type OpenAiCostOccurrenceContext, type OpenAiCostTrackingAdapter } from "../active-contracts";
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

async function closeOccurrence(client: ServiceClient, input: OpenAiCostOccurrenceContext) {
  const { data, error } = await client.rpc("close_openai_cost_occurrence_v1", {
    p_occurrence_id: input.occurrenceId,
    p_environment: input.environment,
    p_execution_origin: input.executionOrigin,
    p_universe: input.economicContext.universe,
    p_account_id: input.economicContext.accountId,
  });
  // An occurrence without a registered execution has no financial state to close.
  if (error?.code === "23503") return false;
  if (error || typeof data !== "string" || !Number.isFinite(Date.parse(data))) {
    throw new OpenAiCostTrackingPersistenceError("unavailable");
  }
  return true;
}

export async function closeSupabaseInspectCostOccurrence(
  executionId: string, occurrenceId: string, environment: OpenAiCostOccurrenceContext["environment"],
) {
  const client = createServiceClient();
  const [execution, foreignWorkload] = await Promise.all([
    client.from("openai_cost_executions").select("id")
      .eq("id", executionId).eq("occurrence_id", occurrenceId).eq("environment", environment)
      .eq("workload", "supabase_inspect").eq("execution_origin", "runtime")
      .eq("universe", "lp_factory").eq("attribution_status", "attributed").is("account_id", null)
      .maybeSingle(),
    client.from("openai_cost_executions").select("id")
      .eq("occurrence_id", occurrenceId).neq("workload", "supabase_inspect").limit(1).maybeSingle(),
  ]);
  if (execution.error || foreignWorkload.error) throw new OpenAiCostTrackingPersistenceError("unavailable");
  return execution.data?.id === executionId && !foreignWorkload.data && closeOccurrence(client, {
    occurrenceId, environment, executionOrigin: "runtime", economicContext: lpFactoryOpenAiCostContext,
  });
}

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
  if (!error) return true;
  if (isExpectedMissingRpcError(error, "start_openai_cost_execution_v2")) {
    await invoke(client, "start_openai_cost_execution_v1", legacyExecutionStartRpc(input));
    return true;
  }
  throw new OpenAiCostTrackingPersistenceError(error.code === "23505" ? "conflict" : "unavailable");
}

export const activeCostTrackingAdapter: OpenAiCostTrackingAdapter = Object.freeze({
  startExecution: async (input) => {
    const dimensions = input.economicContext.occurrenceDimensions;
    if (!input.occurrenceId) return dimensions ? false : startExecutionWithRollout(createServiceClient(), input);
    const client = createServiceClient();
    const args = { ...executionStartRpc(input), p_occurrence_id: input.occurrenceId };
    const { data, error } = dimensions
      ? await client.rpc("start_openai_cost_execution_v4", {
        ...args,
        p_product_type: dimensions.product?.type ?? null,
        p_product_instance_id: dimensions.product?.instanceId ?? null,
        p_action_kind: dimensions.action,
      })
      : await client.rpc("start_openai_cost_execution_v3", args);
    if (error) throw new OpenAiCostTrackingPersistenceError(error.code === "23505" ? "conflict" : "unavailable");
    return data === input.executionId;
  },
  startOperation: async (input) => {
    const client = createServiceClient();
    if (!input.admissionScope) {
      await invoke(client, "start_openai_cost_operation_v1", operationStartRpc(input));
      return true;
    }
    const { data, error } = await client.rpc("admit_openai_cost_operation_v2", {
      ...operationStartRpc(input), p_environment: input.admissionScope.environment, p_workload: input.admissionScope.workload,
    });
    if (error) throw new OpenAiCostTrackingPersistenceError(error.code === "23505" ? "conflict" : "unavailable");
    return data === true;
  },
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
  closeOccurrence: (input) => closeOccurrence(createServiceClient(), input),
});
