import {
  createOpenAiWorkloadFailureEvent,
  createOpenAiWorkloadSuccessEvent,
  emitOpenAiWorkloadEvent,
  isValidResolvedOpenAiProductWorkload,
  resolveOpenAiWorkloadEnvironment,
  type OpenAiWorkloadEnvironment,
  type OpenAiWorkloadEvent,
  type OpenAiWorkloadFailureCategory,
  type ResolvedOpenAiProductWorkload,
} from "../../openai-workloads";

export type OpenAiResponsesParser<T> = (
  payload: unknown,
) =>
  | Readonly<{ ok: true; value: T }>
  | Readonly<{
      ok: false;
      kind: "invalid_response" | "refusal" | "provider_error";
      reason: string;
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
  timeoutMs?: number;
  signal?: AbortSignal;
}>;

export type OpenAiResponsesDependencies = Readonly<{
  fetchImpl?: typeof fetch;
  emitEvent?: (event: OpenAiWorkloadEvent) => void;
  now?: () => number;
}>;

export type OpenAiResponsesResult<T> =
  | Readonly<{
      ok: true;
      value: T;
      responseId: string | null;
      providerRequestId: string | null;
      latencyMs: number;
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
  } as const;
  const emitEvent = dependencies.emitEvent ?? emitOpenAiWorkloadEvent;
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

  const timeoutMs = boundedTimeout(input.timeoutMs);
  if (timeoutMs === 0 || input.signal?.aborted) {
    emitEvent(createOpenAiWorkloadFailureEvent(eventContext, "timeout"));
    return { ok: false, kind: "timeout", reason: "openai_timeout" };
  }

  const fetchImpl = dependencies.fetchImpl ?? fetch;
  const now = dependencies.now ?? Date.now;
  const startedAt = now();
  const controller = new AbortController();
  const abortFromParent = () => controller.abort();
  input.signal?.addEventListener("abort", abortFromParent, { once: true });
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

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
      return { ok: false, kind: "invalid_response", reason: "openai_invalid_response" };
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
      }, parsed.kind));
      return { ok: false, kind: parsed.kind, reason: parsed.reason };
    }

    emitEvent(createOpenAiWorkloadSuccessEvent({
      ...eventContext,
      ...responseMetadata,
    }));
    return {
      ok: true,
      value: parsed.value,
      responseId: nonEmptyString(responseRecord?.id),
      providerRequestId,
      latencyMs,
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
      providerErrorCode: error?.code,
      providerErrorType: error?.type,
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
