import {
  createOpenAiWorkloadFailureEvent,
  createOpenAiWorkloadSuccessEvent,
  emitOpenAiWorkloadEvent,
  normalizeOpenAiResponseUsage,
  resolveOpenAiProductWorkload,
  type OpenAiWorkloadEvent,
} from "../../openai-workloads";
import {
  buildGenerationProfileResponsesRequest,
  normalizeGenerationProfileIncompleteMetadata,
  type GenerationProfileProviderInput,
  type GenerationProfileProviderResult,
} from "../landing-page/generation-profile/proposal";

type GenerationProfileOpenAiDependencies = Readonly<{
  apiKey?: string;
  fetchImpl?: typeof fetch;
  emitEvent?: (event: OpenAiWorkloadEvent) => void;
  now?: () => number;
}>;

export async function requestGenerationProfileProposal(
  input: GenerationProfileProviderInput,
  dependencies: GenerationProfileOpenAiDependencies = {},
): Promise<GenerationProfileProviderResult> {
  const configuration = resolveOpenAiProductWorkload(
    "landing_page_generation_profile_proposal",
  );
  if (!configuration.ok) return { ok: false, kind: "http_error" };

  const workload = configuration.value;
  const eventContext = {
    workload: workload.id,
    configurationSource: workload.source,
    configurationRevision: workload.revision,
    model: workload.model,
    reasoningEffort: workload.reasoningEffort,
  } as const;
  const emitEvent = dependencies.emitEvent ?? emitOpenAiWorkloadEvent;
  const apiKey = dependencies.apiKey?.trim();

  if (
    !apiKey ||
    input.model !== workload.model ||
    input.reasoningEffort !== workload.reasoningEffort
  ) {
    emitEvent(
      createOpenAiWorkloadFailureEvent(eventContext, "configuration_invalid"),
    );
    return { ok: false, kind: "http_error" };
  }

  const request = buildGenerationProfileResponsesRequest(input);
  if (!request.ok) return { ok: false, kind: "request_too_large" };

  const fetchImpl = dependencies.fetchImpl ?? fetch;
  const now = dependencies.now ?? Date.now;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);
  const startedAt = now();

  try {
    const response = await fetchImpl("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: request.serialized,
      signal: controller.signal,
      cache: "no-store",
    });
    if (!response.ok) {
      emitEvent(createOpenAiWorkloadFailureEvent({
        ...eventContext,
        latencyMs: now() - startedAt,
      }, "http_error"));
      return { ok: false, kind: "http_error" };
    }

    let payload: unknown;
    try {
      payload = await response.json();
    } catch {
      emitEvent(createOpenAiWorkloadFailureEvent({
        ...eventContext,
        latencyMs: now() - startedAt,
      }, "invalid_response"));
      return { ok: false, kind: "invalid_response" };
    }

    if (!isRecord(payload)) {
      emitEvent(createOpenAiWorkloadFailureEvent({
        ...eventContext,
        latencyMs: now() - startedAt,
      }, "invalid_response"));
      return { ok: false, kind: "invalid_response" };
    }

    const responseMetadata = {
      responseId: payload.id,
      latencyMs: now() - startedAt,
      usage: payload.usage,
    } as const;

    if (payload.error) {
      emitEvent(createOpenAiWorkloadFailureEvent({
        ...eventContext,
        ...responseMetadata,
      }, "provider_error"));
      return { ok: false, kind: "http_error" };
    }

    if (payload.status === "incomplete") {
      emitEvent(createOpenAiWorkloadFailureEvent({
        ...eventContext,
        ...responseMetadata,
      }, "provider_error"));
      return {
        ok: false,
        kind: "incomplete",
        ...normalizeGenerationProfileIncompleteMetadata(payload),
      };
    }

    const outputText = readOutputText(payload.output);
    if (outputText.kind !== "text") {
      emitEvent(createOpenAiWorkloadFailureEvent({
        ...eventContext,
        ...responseMetadata,
      }, outputText.kind === "refusal" ? "refusal" : "invalid_response"));
      return { ok: false, kind: outputText.kind };
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(outputText.value);
    } catch {
      emitEvent(createOpenAiWorkloadFailureEvent({
        ...eventContext,
        ...responseMetadata,
      }, "invalid_response"));
      return { ok: false, kind: "invalid_response" };
    }

    emitEvent(createOpenAiWorkloadSuccessEvent({
      ...eventContext,
      ...responseMetadata,
    }));
    const usage = normalizeOpenAiResponseUsage(payload.usage);
    return {
      ok: true,
      payload: parsed,
      responseId: typeof payload.id === "string" ? payload.id : null,
      inputTokens: usage.inputTokens,
      outputTokens: usage.outputTokens,
    };
  } catch (error) {
    const timedOut = error instanceof Error && error.name === "AbortError";
    emitEvent(createOpenAiWorkloadFailureEvent({
      ...eventContext,
      latencyMs: now() - startedAt,
    }, timedOut ? "timeout" : "transport_error"));
    return { ok: false, kind: timedOut ? "timeout" : "http_error" };
  } finally {
    clearTimeout(timeout);
  }
}

function readOutputText(output: unknown):
  | Readonly<{ kind: "text"; value: string }>
  | Readonly<{ kind: "refusal" | "invalid_response" }> {
  if (!Array.isArray(output)) return { kind: "invalid_response" };
  for (const item of output) {
    if (!isRecord(item) || !Array.isArray(item.content)) continue;
    for (const content of item.content) {
      if (!isRecord(content)) continue;
      if (content.type === "refusal") return { kind: "refusal" };
      if (content.type === "output_text" && typeof content.text === "string") {
        return { kind: "text", value: content.text };
      }
    }
  }
  return { kind: "invalid_response" };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
