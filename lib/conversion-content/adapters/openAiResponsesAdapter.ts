import {
  createOpenAiWorkloadFailureEvent,
  createOpenAiWorkloadSuccessEvent,
  emitOpenAiWorkloadEvent,
  isValidResolvedOpenAiProductWorkload,
  normalizeOpenAiResponseUsage,
  resolveOpenAiWorkloadEnvironment,
  type OpenAiWorkloadEnvironment,
  type OpenAiWorkloadEvent,
  type OpenAiWorkloadFailureCategory,
  type OpenAiWorkloadUsage,
  type ResolvedOpenAiProductWorkload,
} from "../../openai-workloads";
import {
  newOpenAiCostId,
  openAiCostRecorder,
  isOpenAiActiveCostTrackingEnabled,
  type OpenAiCostEconomicContext,
  type OpenAiCostExecutionOrigin,
  type OpenAiCostRecorder,
} from "../../openai-costs";

export type OpenAiResponsesParser<T> = (
  payload: unknown,
) =>
  | Readonly<{ ok: true; value: T; telemetry?: OpenAiResponsesTelemetry }>
  | Readonly<{
      ok: false;
      kind: "invalid_response" | "refusal" | "provider_error";
      reason: string;
      telemetry?: OpenAiResponsesTelemetry;
    }>;

export type OpenAiResponsesTelemetry = Readonly<{
  webSearchCallCount?: number;
  webSearchSourceCount?: number;
}>;

export type OpenAiResponsesInput<T> = Readonly<{
  apiKey?: string;
  configuration: ResolvedOpenAiProductWorkload;
  environment?: OpenAiWorkloadEnvironment;
  request: Readonly<Record<string, unknown>>;
  parseResponse: OpenAiResponsesParser<T>;
  expectedWorkload?: ResolvedOpenAiProductWorkload["id"];
  requestId?: string;
  promptVersion?: string;
  contractVersion?: number;
  deadlineAtMs?: number;
  timeoutMs?: number;
  signal?: AbortSignal;
  financialContext: OpenAiCostEconomicContext;
  executionOrigin: OpenAiCostExecutionOrigin;
  sourceStrategy?: "e20_5" | "web_search_fallback" | "web_search_focal";
}>;

export type OpenAiResponsesDependencies = Readonly<{
  fetchImpl?: typeof fetch;
  emitEvent?: (event: OpenAiWorkloadEvent) => void;
  now?: () => number;
  nowIso?: () => string;
  costRecorder?: OpenAiCostRecorder;
  createId?: () => string;
}>;

export type OpenAiResponsesResult<T> =
  | Readonly<{
      ok: true;
      value: T;
      responseId: string | null;
      providerRequestId: string | null;
      latencyMs: number;
      usage: OpenAiWorkloadUsage;
    }>
  | Readonly<{
      ok: false;
      kind:
        | "configuration_invalid"
        | "timeout"
        | "transport_error"
        | "http_error"
        | "provider_error"
        | "invalid_response"
        | "refusal";
      reason: string;
    }>;

const DEFAULT_TIMEOUT_MS = 120_000;

export async function requestOpenAiResponses<T>(
  input: OpenAiResponsesInput<T>,
  dependencies: OpenAiResponsesDependencies = {},
): Promise<OpenAiResponsesResult<T>> {
  const environment = input.environment ?? resolveOpenAiWorkloadEnvironment();
  const eventContext = {
    workload: input.configuration.id,
    configurationSource: input.configuration.source,
    configurationRevision: input.configuration.revision,
    model: input.configuration.model,
    reasoningEffort: input.configuration.reasoningEffort,
    environment,
    requestId: input.requestId,
    promptVersion: input.promptVersion,
    contractVersion: input.contractVersion,
    sourceStrategy: input.sourceStrategy,
  } as const;
  const emitEvent = dependencies.emitEvent ?? emitOpenAiWorkloadEvent;
  const now = dependencies.now ?? Date.now;
  const apiKey = input.apiKey?.trim();
  const validConfiguration =
    isValidResolvedOpenAiProductWorkload(input.configuration) &&
    (!input.expectedWorkload || input.configuration.id === input.expectedWorkload);

  if (!apiKey || !validConfiguration) {
    emitEvent(createOpenAiWorkloadFailureEvent(eventContext, "configuration_invalid"));
    return {
      ok: false,
      kind: "configuration_invalid",
      reason: "missing_or_invalid_openai_configuration",
    };
  }

  const deadlineRemaining = remainingUntilDeadline(input.deadlineAtMs, now());
  const timeoutMs = Math.min(boundedTimeout(input.timeoutMs), deadlineRemaining);
  if (timeoutMs === 0 || input.signal?.aborted) {
    emitEvent(createOpenAiWorkloadFailureEvent(eventContext, "timeout"));
    return { ok: false, kind: "timeout", reason: "openai_timeout" };
  }

  const fetchImpl = dependencies.fetchImpl ?? fetch;
  const nowIso = dependencies.nowIso ?? (() => new Date().toISOString());
  const recorder = dependencies.costRecorder ?? openAiCostRecorder;
  const createId = dependencies.createId ?? newOpenAiCostId;
  const executionId = createId();
  const operationId = createId();
  const financialStartedAt = nowIso();
  const financialTrackingStarted = environment !== "unknown" &&
    (Boolean(dependencies.costRecorder) || isOpenAiActiveCostTrackingEnabled(environment));
  if (financialTrackingStarted) {
    await recorder.startExecution({
      executionId,
      workload: input.configuration.id,
      environment,
      executionOrigin: input.executionOrigin,
      economicContext: input.financialContext,
      startedAt: financialStartedAt,
    });
    if (remainingUntilDeadline(input.deadlineAtMs, now()) === 0) {
      emitEvent(createOpenAiWorkloadFailureEvent(eventContext, "timeout"));
      return { ok: false, kind: "timeout", reason: "openai_timeout" };
    }
    await recorder.startOperation({
      operationId,
      executionId,
      sequence: 1,
      model: input.configuration.model,
      reasoningEffort: input.configuration.reasoningEffort,
      configurationSource: input.configuration.source,
      configurationRevision: input.configuration.revision,
      promptVersion: input.promptVersion,
      contractVersion: input.contractVersion?.toString(),
      requestId: input.requestId,
      startedAt: financialStartedAt,
    });
    if (remainingUntilDeadline(input.deadlineAtMs, now()) === 0) {
      emitEvent(createOpenAiWorkloadFailureEvent(eventContext, "timeout"));
      return { ok: false, kind: "timeout", reason: "openai_timeout" };
    }
  }
  const finishFinancial = async (input: Readonly<{
    result: "success" | "failure";
    failureCategory?: OpenAiWorkloadFailureCategory | null;
    httpStatus?: number | null;
    responseId?: string | null;
    providerRequestId?: string | null;
    providerErrorCode?: string | null;
    providerErrorType?: string | null;
    usage?: unknown;
    webSearchCallCount?: number | null;
  }>) => {
    if (!financialTrackingStarted) return;
    const finishedAt = nowIso();
    await recorder.finishOperation({
      operationId,
      result: input.result,
      failureCategory: input.failureCategory,
      httpStatus: input.httpStatus,
      providerResponseId: input.responseId,
      providerRequestId: input.providerRequestId,
      providerErrorCode: input.providerErrorCode,
      providerErrorType: input.providerErrorType,
      usage: normalizeOpenAiResponseUsage(input.usage),
      webSearchCallCount: input.webSearchCallCount,
      finishedAt,
    });
    await recorder.finishExecution({
      executionId,
      result: input.result,
      failureCategory: input.failureCategory,
      finishedAt,
    });
  };
  const startedAt = now();
  const transportTimeoutMs = Math.min(
    timeoutMs,
    remainingUntilDeadline(input.deadlineAtMs, startedAt),
  );
  if (transportTimeoutMs === 0) {
    emitEvent(createOpenAiWorkloadFailureEvent(eventContext, "timeout"));
    return { ok: false, kind: "timeout", reason: "openai_timeout" };
  }
  const controller = new AbortController();
  const abortFromParent = () => controller.abort();
  input.signal?.addEventListener("abort", abortFromParent, { once: true });
  const timeout = setTimeout(() => controller.abort(), transportTimeoutMs);

  try {
    const response = await fetchImpl("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...input.request,
        model: input.configuration.model,
        reasoning: { effort: input.configuration.reasoningEffort },
      }),
      signal: controller.signal,
      cache: "no-store",
    });
    const latencyMs = now() - startedAt;
    const providerRequestId = nonEmptyString(response.headers.get("x-request-id"));

    if (!response.ok) {
      const providerError = await readProviderErrorMetadata(response);
      emitEvent(createOpenAiWorkloadFailureEvent({
        ...eventContext,
        latencyMs,
        httpStatus: response.status,
        providerRequestId,
        ...providerError,
      }, "http_error"));
      await finishFinancial({
        result: "failure",
        failureCategory: "http_error",
        httpStatus: response.status,
        providerRequestId,
        ...providerError,
      });
      return { ok: false, kind: "http_error", reason: `openai_http_${response.status}` };
    }

    let payload: unknown;
    try {
      payload = await response.json();
    } catch {
      emitEvent(createOpenAiWorkloadFailureEvent({
        ...eventContext,
        latencyMs,
        providerRequestId,
      }, "invalid_response"));
      await finishFinancial({
        result: "failure",
        failureCategory: "invalid_response",
        providerRequestId,
      });
      return { ok: false, kind: "invalid_response", reason: "openai_invalid_response" };
    }
    if (remainingUntilDeadline(input.deadlineAtMs, now()) === 0) {
      emitEvent(createOpenAiWorkloadFailureEvent({
        ...eventContext,
        latencyMs: now() - startedAt,
        providerRequestId,
      }, "timeout"));
      await finishFinancial({ result: "failure", failureCategory: "timeout", providerRequestId });
      return { ok: false, kind: "timeout", reason: "openai_timeout" };
    }

    const responseRecord = asRecord(payload);
    const responseMetadata = {
      responseId: responseRecord?.id,
      providerRequestId,
      latencyMs,
      usage: responseRecord?.usage,
    } as const;
    const providerError = asRecord(responseRecord?.error);
    if (providerError || responseRecord?.status === "incomplete") {
      emitEvent(createOpenAiWorkloadFailureEvent({
        ...eventContext,
        ...responseMetadata,
        providerErrorCode: providerError?.code,
        providerErrorType: providerError?.type,
      }, "provider_error"));
      await finishFinancial({
        result: "failure",
        failureCategory: "provider_error",
        responseId: nonEmptyString(responseRecord?.id),
        providerRequestId,
        providerErrorCode: nonEmptyString(providerError?.code),
        providerErrorType: nonEmptyString(providerError?.type),
        usage: responseRecord?.usage,
      });
      return {
        ok: false,
        kind: "provider_error",
        reason: responseRecord?.status === "incomplete"
          ? "openai_incomplete"
          : nonEmptyString(providerError?.type) ?? "openai_response_error",
      };
    }

    const parsed = input.parseResponse(payload);
    if (!parsed.ok) {
      emitEvent(createOpenAiWorkloadFailureEvent({
        ...eventContext,
        ...responseMetadata,
        ...parsed.telemetry,
      }, parsed.kind));
      await finishFinancial({
        result: "failure",
        failureCategory: parsed.kind,
        responseId: nonEmptyString(responseRecord?.id),
        providerRequestId,
        usage: responseRecord?.usage,
        webSearchCallCount: parsed.telemetry?.webSearchCallCount,
      });
      return { ok: false, kind: parsed.kind, reason: parsed.reason };
    }

    if (remainingUntilDeadline(input.deadlineAtMs, now()) === 0) {
      emitEvent(createOpenAiWorkloadFailureEvent({
        ...eventContext,
        ...responseMetadata,
        ...parsed.telemetry,
      }, "timeout"));
      await finishFinancial({
        result: "failure",
        failureCategory: "timeout",
        responseId: nonEmptyString(responseRecord?.id),
        providerRequestId,
        usage: responseRecord?.usage,
        webSearchCallCount: parsed.telemetry?.webSearchCallCount,
      });
      return { ok: false, kind: "timeout", reason: "openai_timeout" };
    }

    await finishFinancial({
      result: "success",
      responseId: nonEmptyString(responseRecord?.id),
      providerRequestId,
      usage: responseRecord?.usage,
      webSearchCallCount: parsed.telemetry?.webSearchCallCount,
    });
    if (remainingUntilDeadline(input.deadlineAtMs, now()) === 0) {
      emitEvent(createOpenAiWorkloadFailureEvent({
        ...eventContext,
        ...responseMetadata,
        ...parsed.telemetry,
      }, "timeout"));
      return { ok: false, kind: "timeout", reason: "openai_timeout" };
    }
    emitEvent(createOpenAiWorkloadSuccessEvent({
      ...eventContext,
      ...responseMetadata,
      ...("telemetry" in parsed ? parsed.telemetry : undefined),
    }));
    return {
      ok: true,
      value: parsed.value,
      responseId: nonEmptyString(responseRecord?.id),
      providerRequestId,
      latencyMs,
      usage: normalizeOpenAiResponseUsage(responseRecord?.usage),
    };
  } catch (error) {
    const timedOut = error instanceof Error && error.name === "AbortError";
    const failureCategory: OpenAiWorkloadFailureCategory = timedOut
      ? "timeout"
      : "transport_error";
    emitEvent(createOpenAiWorkloadFailureEvent({
      ...eventContext,
      latencyMs: now() - startedAt,
    }, failureCategory));
    await finishFinancial({ result: "failure", failureCategory });
    return {
      ok: false,
      kind: failureCategory,
      reason: timedOut ? "openai_timeout" : "openai_transport_error",
    };
  } finally {
    clearTimeout(timeout);
    input.signal?.removeEventListener("abort", abortFromParent);
  }
}

async function readProviderErrorMetadata(response: Response) {
  try {
    const payload = asRecord(await response.clone().json());
    const error = asRecord(payload?.error);
    return {
      providerErrorCode: nonEmptyString(error?.code),
      providerErrorType: nonEmptyString(error?.type),
    };
  } catch {
    return {};
  }
}

function boundedTimeout(value: number | undefined) {
  if (value === undefined) return DEFAULT_TIMEOUT_MS;
  return Number.isSafeInteger(value) && value >= 0 && value <= DEFAULT_TIMEOUT_MS
    ? value
    : DEFAULT_TIMEOUT_MS;
}

function remainingUntilDeadline(deadlineAtMs: number | undefined, nowMs: number): number {
  if (deadlineAtMs === undefined) return DEFAULT_TIMEOUT_MS;
  if (!Number.isFinite(deadlineAtMs)) return 0;
  return Math.max(0, Math.floor(deadlineAtMs - nowMs));
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function nonEmptyString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : null;
}
