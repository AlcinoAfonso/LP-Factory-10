import { createHash } from "node:crypto";

import {
  createOpenAiWorkloadFailureEvent,
  createOpenAiWorkloadSuccessEvent,
  emitOpenAiWorkloadEvent,
  normalizeOpenAiResponseUsage,
  resolveOpenAiProductWorkload,
  type OpenAiWorkloadEvent,
} from "../../openai-workloads";
import {
  buildLandingPageDraftGenerationRequest,
  validateLandingPageDraftCandidate,
} from "../landingPageGeneration";
import type {
  LandingPageDraftGenerationInput,
  LandingPageDraftGenerationResult,
} from "../landingPageGenerationContracts";

export type LandingPageDraftGenerationOutcome = Readonly<{
  event: "landing_page_draft_generation";
  result: "success" | "failure";
  reason: "generated" | Exclude<LandingPageDraftGenerationResult, { ok: true }>["kind"];
  request_id: string | null;
  latency_ms: number | null;
}>;

type Dependencies = Readonly<{
  apiKey?: string;
  fetchImpl?: typeof fetch;
  resolveWorkload?: typeof resolveOpenAiProductWorkload;
  emitEvent?: (event: OpenAiWorkloadEvent) => void;
  emitOutcome?: (event: LandingPageDraftGenerationOutcome) => void;
  now?: () => number;
}>;

type AdapterInput = LandingPageDraftGenerationInput & Readonly<{ requestId?: string }>;

export async function requestLandingPageDraftCandidate(
  input: AdapterInput,
  dependencies: Dependencies = {},
): Promise<LandingPageDraftGenerationResult> {
  const configuration = (dependencies.resolveWorkload ?? resolveOpenAiProductWorkload)("landing_page_draft_generation");
  const emitEvent = dependencies.emitEvent ?? emitOpenAiWorkloadEvent;
  const emitOutcome = dependencies.emitOutcome ?? ((event) => console.info(event.event, event));
  const requestId = nonEmpty(input?.requestId) ? input.requestId.trim() : null;
  const now = dependencies.now ?? Date.now;

  if (!configuration.ok || !isInputValid(input)) {
    if (configuration.ok) {
      emitEvent(createOpenAiWorkloadFailureEvent(eventContext(configuration.value), "configuration_invalid"));
    }
    safeEmitOutcome(emitOutcome, failureOutcome("configuration_invalid", requestId, null));
    return { ok: false, kind: "configuration_invalid" };
  }

  const workload = configuration.value;
  const commonContext = eventContext(workload);
  const apiKey = (dependencies.apiKey ?? process.env.OPENAI_API_KEY)?.trim();
  if (!apiKey) {
    emitEvent(createOpenAiWorkloadFailureEvent(commonContext, "configuration_invalid"));
    safeEmitOutcome(emitOutcome, failureOutcome("configuration_invalid", requestId, null));
    return { ok: false, kind: "configuration_invalid" };
  }

  const request = buildLandingPageDraftGenerationRequest({
    context: input.context,
    model: workload.model,
    reasoningEffort: workload.reasoningEffort,
    safetyIdentifier: createSafetyIdentifier(input.actorUserId),
  });
  if (!request.ok) {
    const kind = request.kind;
    emitEvent(createOpenAiWorkloadFailureEvent(commonContext, "invalid_response"));
    safeEmitOutcome(emitOutcome, failureOutcome(kind, requestId, null));
    return { ok: false, kind };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);
  const startedAt = now();
  try {
    const response = await (dependencies.fetchImpl ?? fetch)("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: request.serialized,
      signal: controller.signal,
      cache: "no-store",
    });
    const latencyMs = now() - startedAt;
    if (!response.ok) return fail("http_error", "http_error", null, latencyMs);

    let payload: unknown;
    try {
      payload = await response.json();
    } catch {
      return fail("invalid_response", "invalid_response", null, latencyMs);
    }
    if (!isRecord(payload)) return fail("invalid_response", "invalid_response", null, latencyMs);
    const metadata = { responseId: payload.id, latencyMs, usage: payload.usage } as const;
    if (payload.error) return fail("http_error", "provider_error", metadata, latencyMs);
    if (payload.status === "incomplete") return fail("incomplete", "provider_error", metadata, latencyMs);

    const output = readOutputText(payload.output);
    if (output.kind !== "text") {
      return fail(output.kind, output.kind === "refusal" ? "refusal" : "invalid_response", metadata, latencyMs);
    }
    let parsed: unknown;
    try {
      parsed = JSON.parse(output.value);
    } catch {
      return fail("invalid_response", "invalid_response", metadata, latencyMs);
    }
    const validated = validateLandingPageDraftCandidate(parsed, request);
    if (!validated.ok) return fail("candidate_invalid", "invalid_response", metadata, latencyMs);

    emitEvent(createOpenAiWorkloadSuccessEvent({ ...commonContext, ...metadata }));
    safeEmitOutcome(emitOutcome, {
      event: "landing_page_draft_generation",
      result: "success",
      reason: "generated",
      request_id: requestId,
      latency_ms: latencyMs,
    });
    const usage = normalizeOpenAiResponseUsage(payload.usage);
    return {
      ok: true,
      candidate: validated.value,
      exposedGenerationContext: request.exposedGenerationContext,
      responseId: typeof payload.id === "string" && payload.id.trim() ? payload.id.trim() : null,
      inputTokens: usage.inputTokens,
      outputTokens: usage.outputTokens,
    };

    function fail(
      kind: Exclude<LandingPageDraftGenerationResult, { ok: true }>["kind"],
      category: Parameters<typeof createOpenAiWorkloadFailureEvent>[1],
      metadata: Readonly<{ responseId?: unknown; latencyMs?: unknown; usage?: unknown }> | null,
      outcomeLatency: number,
    ): LandingPageDraftGenerationResult {
      emitEvent(createOpenAiWorkloadFailureEvent({ ...commonContext, ...(metadata ?? { latencyMs: outcomeLatency }) }, category));
      safeEmitOutcome(emitOutcome, failureOutcome(kind, requestId, outcomeLatency));
      return { ok: false, kind };
    }
  } catch (error) {
    const latencyMs = now() - startedAt;
    const timedOut = error instanceof Error && error.name === "AbortError";
    const kind = timedOut ? "timeout" : "http_error";
    emitEvent(createOpenAiWorkloadFailureEvent({ ...commonContext, latencyMs }, timedOut ? "timeout" : "transport_error"));
    safeEmitOutcome(emitOutcome, failureOutcome(kind, requestId, latencyMs));
    return { ok: false, kind };
  } finally {
    clearTimeout(timeout);
  }
}

export function createLandingPageDraftSafetyIdentifier(actorUserId: string) {
  return createSafetyIdentifier(actorUserId);
}

function createSafetyIdentifier(actorUserId: string) {
  return createHash("sha256")
    .update(`lp-factory-openai-safety:v1:${actorUserId.trim()}`)
    .digest("hex");
}

function eventContext(workload: Extract<ReturnType<typeof resolveOpenAiProductWorkload>, { ok: true }>["value"]) {
  return {
    workload: workload.id,
    configurationSource: workload.source,
    configurationRevision: workload.revision,
    model: workload.model,
    reasoningEffort: workload.reasoningEffort,
  } as const;
}

function failureOutcome(
  reason: Exclude<LandingPageDraftGenerationResult, { ok: true }>["kind"],
  requestId: string | null,
  latencyMs: number | null,
): LandingPageDraftGenerationOutcome {
  return {
    event: "landing_page_draft_generation",
    result: "failure",
    reason,
    request_id: requestId,
    latency_ms: latencyMs,
  };
}

function safeEmitOutcome(
  emit: (event: LandingPageDraftGenerationOutcome) => void,
  event: LandingPageDraftGenerationOutcome,
) {
  try {
    emit(event);
  } catch {
    // Observability must never change the generation outcome.
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

function isInputValid(input: unknown): input is AdapterInput {
  return isRecord(input) && isRecord(input.context) && nonEmpty(input.actorUserId);
}

function nonEmpty(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
