import type {
  OpenAiCostExecutionContext,
  OpenAiCostExecutionTerminal,
  OpenAiCostOperationContext,
  OpenAiCostOperationTerminal,
} from "../active-contracts";

export class OpenAiCostTrackingPersistenceError extends Error {
  constructor(readonly kind: "conflict" | "unavailable") {
    super(`openai_cost_persistence_${kind}`);
  }
}

export function openAiCostPersistenceFailure(error: unknown) {
  return error instanceof OpenAiCostTrackingPersistenceError && error.kind === "conflict"
    ? { status: 409 as const, code: "persistence_conflict" as const }
    : { status: 503 as const, code: "persistence_unavailable" as const };
}

export function executionStartRpc(input: OpenAiCostExecutionContext) {
  return {
    p_id: input.executionId,
    p_workload: input.workload,
    p_environment: input.environment,
    p_execution_origin: input.executionOrigin,
    p_universe: input.economicContext.universe,
    p_attribution_status: input.economicContext.attributionStatus,
    p_account_id: input.economicContext.accountId,
    p_baseline_reference: clean(input.baselineReference),
    p_baseline_version: clean(input.baselineVersion),
    p_started_at: input.startedAt,
  };
}

export function operationStartRpc(input: OpenAiCostOperationContext) {
  return {
    p_id: input.operationId,
    p_execution_id: input.executionId,
    p_sequence: input.sequence,
    p_retry_of_operation_id: input.retryOfOperationId ?? null,
    p_model: input.model,
    p_reasoning_effort: input.reasoningEffort,
    p_configuration_source: input.configurationSource,
    p_configuration_revision: input.configurationRevision,
    p_prompt_version: clean(input.promptVersion),
    p_contract_version: clean(input.contractVersion),
    p_request_id: clean(input.requestId),
    p_started_at: input.startedAt,
  };
}

export function operationFinishRpc(input: OpenAiCostOperationTerminal) {
  const usage = input.usage;
  return {
    p_id: input.operationId,
    p_result: input.result,
    p_failure_category: input.failureCategory ?? null,
    p_http_status: input.httpStatus ?? null,
    p_provider_response_id: clean(input.providerResponseId),
    p_provider_request_id: clean(input.providerRequestId),
    p_provider_error_code: clean(input.providerErrorCode),
    p_provider_error_type: clean(input.providerErrorType),
    p_input_tokens: usage?.inputTokens ?? null,
    p_cached_input_tokens: usage?.cachedInputTokens ?? null,
    p_cache_write_tokens: usage?.cacheWriteTokens ?? null,
    p_output_tokens: usage?.outputTokens ?? null,
    p_reasoning_tokens: usage?.reasoningTokens ?? null,
    p_total_tokens: usage?.totalTokens ?? null,
    p_web_search_call_count: input.webSearchCallCount ?? null,
    p_finished_at: input.finishedAt,
  };
}

export function executionFinishRpc(input: OpenAiCostExecutionTerminal) {
  return {
    p_id: input.executionId,
    p_result: input.result,
    p_failure_category: input.failureCategory ?? null,
    p_finished_at: input.finishedAt,
  };
}

function clean(value: string | null | undefined) {
  const normalized = value?.trim();
  return normalized ? normalized.slice(0, 128) : null;
}
