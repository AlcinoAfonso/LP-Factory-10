import {
  createOpenAiWorkloadFailureEvent,
  createOpenAiWorkloadSuccessEvent,
  emitOpenAiWorkloadEvent,
  resolveOpenAiProductWorkload,
  type OpenAiWorkloadEvent,
  type ResolvedOpenAiProductWorkload,
} from "../../openai-workloads";

type CommercialActivationResponseParser<T> = (
  payload: unknown,
) =>
  | Readonly<{ ok: true; value: T }>
  | Readonly<{
      ok: false;
      kind: "invalid_response" | "refusal";
      reason: string;
    }>;

type CommercialActivationOpenAiInput<T> = Readonly<{
  apiKey?: string;
  configuration: ResolvedOpenAiProductWorkload;
  request: Readonly<Record<string, unknown>>;
  parseResponse: CommercialActivationResponseParser<T>;
}>;

type CommercialActivationOpenAiDependencies = Readonly<{
  fetchImpl?: typeof fetch;
  emitEvent?: (event: OpenAiWorkloadEvent) => void;
  now?: () => number;
}>;

export type CommercialActivationOpenAiResult<T> =
  | Readonly<{
      ok: true;
      value: T;
      responseId: string | null;
    }>
  | Readonly<{
      ok: false;
      reason: string;
    }>;

export async function requestCommercialActivationOpenAi<T>(
  input: CommercialActivationOpenAiInput<T>,
  dependencies: CommercialActivationOpenAiDependencies = {},
): Promise<CommercialActivationOpenAiResult<T>> {
  const canonical = resolveOpenAiProductWorkload(
    "commercial_activation_draft_generation",
  );
  if (!canonical.ok) {
    return { ok: false, reason: "invalid_openai_configuration" };
  }

  const eventContext = {
    workload: canonical.value.id,
    configurationSource: canonical.value.source,
    configurationRevision: canonical.value.revision,
    model: canonical.value.model,
    reasoningEffort: canonical.value.reasoningEffort,
  } as const;
  const emitEvent = dependencies.emitEvent ?? emitOpenAiWorkloadEvent;
  const apiKey = input.apiKey?.trim();

  if (!apiKey || !matchesCanonicalConfiguration(input.configuration, canonical.value)) {
    emitEvent(
      createOpenAiWorkloadFailureEvent(eventContext, "configuration_invalid"),
    );
    return { ok: false, reason: "missing_openai_env" };
  }

  const fetchImpl = dependencies.fetchImpl ?? fetch;
  const now = dependencies.now ?? Date.now;
  const startedAt = now();

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
    });

    if (!response.ok) {
      emitEvent(createOpenAiWorkloadFailureEvent({
        ...eventContext,
        latencyMs: now() - startedAt,
      }, "http_error"));
      return { ok: false, reason: `openai_http_${response.status}` };
    }

    let payload: unknown;
    try {
      payload = await response.json();
    } catch {
      emitEvent(createOpenAiWorkloadFailureEvent({
        ...eventContext,
        latencyMs: now() - startedAt,
      }, "invalid_response"));
      return { ok: false, reason: "openai_invalid_response" };
    }

    const responseRecord = asRecord(payload);
    const responseMetadata = {
      responseId: responseRecord?.id,
      latencyMs: now() - startedAt,
      usage: responseRecord?.usage,
    } as const;
    const providerError = asRecord(responseRecord?.error);
    if (providerError) {
      emitEvent(createOpenAiWorkloadFailureEvent({
        ...eventContext,
        ...responseMetadata,
      }, "provider_error"));
      return {
        ok: false,
        reason: nonEmptyString(providerError.type) ?? "openai_response_error",
      };
    }

    const parsed = input.parseResponse(payload);
    if (!parsed.ok) {
      emitEvent(createOpenAiWorkloadFailureEvent({
        ...eventContext,
        ...responseMetadata,
      }, parsed.kind));
      return { ok: false, reason: parsed.reason };
    }

    emitEvent(createOpenAiWorkloadSuccessEvent({
      ...eventContext,
      ...responseMetadata,
    }));
    return {
      ok: true,
      value: parsed.value,
      responseId: nonEmptyString(responseRecord?.id),
    };
  } catch (error) {
    const timedOut = error instanceof Error && error.name === "AbortError";
    emitEvent(createOpenAiWorkloadFailureEvent({
      ...eventContext,
      latencyMs: now() - startedAt,
    }, timedOut ? "timeout" : "transport_error"));
    return {
      ok: false,
      reason: timedOut ? "openai_timeout" : "openai_transport_error",
    };
  }
}

function matchesCanonicalConfiguration(
  actual: ResolvedOpenAiProductWorkload,
  expected: ResolvedOpenAiProductWorkload,
) {
  return (
    actual.id === expected.id &&
    actual.model === expected.model &&
    actual.reasoningEffort === expected.reasoningEffort &&
    actual.source === expected.source &&
    actual.revision === expected.revision &&
    actual.configurationKind === "effective" &&
    actual.effectiveConfigurationVerified === true
  );
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
