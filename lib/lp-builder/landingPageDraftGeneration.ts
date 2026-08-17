import {
  LANDING_PAGE_DRAFT_PROMPT_VERSION,
  buildLandingPageDraftPrompt,
  landingPagePresentationJsonSchema,
  validateLandingPagePresentationCandidate,
  type LandingPagePresentationCandidate,
} from "../conversion-content/landing-page/presentation";
import {
  createOpenAiWorkloadFailureEvent,
  createOpenAiWorkloadSuccessEvent,
  emitOpenAiWorkloadEvent,
  normalizeOpenAiResponseUsage,
  resolveOpenAiProductWorkload,
  type OpenAiWorkloadEvent,
  type OpenAiWorkloadFailureCategory,
  type OpenAiWorkloadUsage,
} from "../openai-workloads";
import type { LandingPageGenerationContextPackage } from "./generationContextContracts";

export const LANDING_PAGE_DRAFT_TEXT_TIMEOUT_MS = 120_000;
export const LANDING_PAGE_DRAFT_MAX_OUTPUT_TOKENS = 12_000;

export type LandingPageDraftTextResult =
  | Readonly<{
      ok: true;
      candidate: LandingPagePresentationCandidate;
      responseId: string | null;
      promptVersion: typeof LANDING_PAGE_DRAFT_PROMPT_VERSION;
      usage: OpenAiWorkloadUsage;
    }>
  | Readonly<{
      ok: false;
      kind:
        | "configuration_invalid"
        | "timeout"
        | "http_error"
        | "provider_error"
        | "incomplete"
        | "refusal"
        | "invalid_response"
        | "invalid_candidate";
    }>;

type Dependencies = Readonly<{
  apiKey?: string;
  attemptId?: string;
  requestId?: string;
  fetchImpl?: typeof fetch;
  emitEvent?: (event: OpenAiWorkloadEvent) => void;
  now?: () => number;
}>;

export async function generateLandingPageDraftCandidate(
  context: LandingPageGenerationContextPackage,
  dependencies: Dependencies = {},
): Promise<LandingPageDraftTextResult> {
  const resolved = resolveOpenAiProductWorkload("landing_page_draft_generation");
  const apiKey = dependencies.apiKey?.trim();
  if (!resolved.ok || !apiKey || context.contractVersion !== 3) {
    if (resolved.ok) emitFailure(resolved.value, "configuration_invalid", dependencies);
    return { ok: false, kind: "configuration_invalid" };
  }

  const workload = resolved.value;
  const request = buildLandingPageDraftResponsesRequest(context, workload.model);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), LANDING_PAGE_DRAFT_TEXT_TIMEOUT_MS);
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
      body: JSON.stringify(request),
      signal: controller.signal,
      cache: "no-store",
    });
    const latencyMs = now() - startedAt;
    if (!response.ok) {
      emitFailure(workload, "http_error", dependencies, { latencyMs });
      return { ok: false, kind: "http_error" };
    }

    let payload: unknown;
    try {
      payload = await response.json();
    } catch {
      emitFailure(workload, "invalid_response", dependencies, { latencyMs });
      return { ok: false, kind: "invalid_response" };
    }
    if (!isRecord(payload)) {
      emitFailure(workload, "invalid_response", dependencies, { latencyMs });
      return { ok: false, kind: "invalid_response" };
    }

    const metadata = {
      responseId: payload.id,
      usage: payload.usage,
      latencyMs,
    } as const;
    if (payload.error) {
      emitFailure(workload, "provider_error", dependencies, metadata);
      return { ok: false, kind: "provider_error" };
    }
    if (payload.status === "incomplete") {
      emitFailure(workload, "provider_error", dependencies, metadata);
      return { ok: false, kind: "incomplete" };
    }
    if (payload.status !== "completed") {
      emitFailure(workload, "provider_error", dependencies, metadata);
      return { ok: false, kind: "provider_error" };
    }

    const output = readOutputText(payload);
    if (output.kind !== "text") {
      emitFailure(
        workload,
        output.kind === "refusal" ? "refusal" : "invalid_response",
        dependencies,
        metadata,
      );
      return { ok: false, kind: output.kind };
    }

    let candidate: unknown;
    try {
      candidate = JSON.parse(output.value);
    } catch {
      emitFailure(workload, "invalid_response", dependencies, metadata);
      return { ok: false, kind: "invalid_response" };
    }
    const validated = validateLandingPagePresentationCandidate(
      candidate,
      context.modelContext,
    );
    if (!validated.ok) {
      emitFailure(workload, "invalid_response", dependencies, metadata);
      return { ok: false, kind: "invalid_candidate" };
    }

    (dependencies.emitEvent ?? emitOpenAiWorkloadEvent)(
      createOpenAiWorkloadSuccessEvent({
        ...eventContext(workload, dependencies),
        ...metadata,
      }),
    );
    return {
      ok: true,
      candidate: validated.value,
      responseId: nonEmptyString(payload.id),
      promptVersion: LANDING_PAGE_DRAFT_PROMPT_VERSION,
      usage: normalizeOpenAiResponseUsage(payload.usage),
    };
  } catch (error) {
    const timedOut = error instanceof Error && error.name === "AbortError";
    emitFailure(
      workload,
      timedOut ? "timeout" : "transport_error",
      dependencies,
      { latencyMs: now() - startedAt },
    );
    return { ok: false, kind: timedOut ? "timeout" : "http_error" };
  } finally {
    clearTimeout(timeout);
  }
}

export function buildLandingPageDraftResponsesRequest(
  context: LandingPageGenerationContextPackage,
  model = "gpt-5.6-luna",
) {
  const prompt = buildLandingPageDraftPrompt(context.modelContext);
  return {
    model,
    reasoning: { effort: "max" },
    store: false,
    tools: [],
    max_output_tokens: LANDING_PAGE_DRAFT_MAX_OUTPUT_TOKENS,
    input: [
      {
        role: "system",
        content: [{ type: "input_text", text: prompt.system }],
      },
      {
        role: "user",
        content: [{ type: "input_text", text: prompt.user }],
      },
    ],
    text: {
      format: {
        type: "json_schema",
        name: "landing_page_presentation_contract_v1",
        strict: true,
        schema: landingPagePresentationJsonSchema,
      },
    },
  } as const;
}

function eventContext(
  workload: Extract<ReturnType<typeof resolveOpenAiProductWorkload>, { ok: true }>["value"],
  dependencies: Dependencies,
) {
  return {
    workload: workload.id,
    configurationSource: workload.source,
    configurationRevision: workload.revision,
    model: workload.model,
    reasoningEffort: workload.reasoningEffort,
    attemptId: dependencies.attemptId,
    requestId: dependencies.requestId,
    promptVersion: LANDING_PAGE_DRAFT_PROMPT_VERSION,
    contractVersion: 1,
  } as const;
}

function emitFailure(
  workload: Extract<ReturnType<typeof resolveOpenAiProductWorkload>, { ok: true }>["value"],
  category: OpenAiWorkloadFailureCategory,
  dependencies: Dependencies,
  metadata: Readonly<{ responseId?: unknown; usage?: unknown; latencyMs?: unknown }> = {},
) {
  (dependencies.emitEvent ?? emitOpenAiWorkloadEvent)(
    createOpenAiWorkloadFailureEvent(
      { ...eventContext(workload, dependencies), ...metadata },
      category,
    ),
  );
}

function readOutputText(payload: Record<string, unknown>):
  | Readonly<{ kind: "text"; value: string }>
  | Readonly<{ kind: "refusal" | "invalid_response" }> {
  if (Array.isArray(payload.output)) {
    for (const item of payload.output) {
      if (!isRecord(item) || !Array.isArray(item.content)) continue;
      for (const content of item.content) {
        if (isRecord(content) && content.type === "refusal") {
          return { kind: "refusal" };
        }
      }
    }
  }
  if (typeof payload.output_text === "string") {
    return { kind: "text", value: payload.output_text };
  }
  if (!Array.isArray(payload.output)) return { kind: "invalid_response" };
  for (const item of payload.output) {
    if (!isRecord(item) || !Array.isArray(item.content)) continue;
    for (const content of item.content) {
      if (
        isRecord(content) &&
        content.type === "output_text" &&
        typeof content.text === "string"
      ) {
        return { kind: "text", value: content.text };
      }
    }
  }
  return { kind: "invalid_response" };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function nonEmptyString(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}
