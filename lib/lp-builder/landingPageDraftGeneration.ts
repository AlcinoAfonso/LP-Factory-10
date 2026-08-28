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
  listOpenAiWorkloadInventory,
  normalizeOpenAiResponseUsage,
  resolveOpenAiProductWorkload,
  resolveOpenAiWorkloadEnvironment,
  type OpenAiConfigurationSource,
  type OpenAiReasoningEffort,
  type OpenAiWorkloadEnvironment,
  type OpenAiWorkloadEvent,
  type OpenAiWorkloadFailureCategory,
  type OpenAiWorkloadResolverDependencies,
  type OpenAiWorkloadUsage,
  type ResolvedOpenAiProductWorkload,
} from "../openai-workloads";
import type { LandingPageGenerationContextPackage } from "./generationContextContracts";
import type {
  OpenAiLpCostTracker,
  OpenAiLpCostTrackingContext,
  OpenAiLpCostTrackingSession,
} from "../openai-costs";
import { isOpenAiLpPricingSupported } from "../openai-costs";

export const LANDING_PAGE_DRAFT_TEXT_TIMEOUT_MS = 120_000;
export const LANDING_PAGE_DRAFT_MAX_OUTPUT_TOKENS = 12_000;

const landingPageDraftBaseline = resolveLandingPageDraftBaseline();

export type LandingPageDraftTextResult =
  | Readonly<{
      ok: true;
      candidate: LandingPagePresentationCandidate;
      responseId: string | null;
      promptVersion: typeof LANDING_PAGE_DRAFT_PROMPT_VERSION;
      usage: OpenAiWorkloadUsage;
      latencyMs: number;
      configuration: Readonly<{
        workload: "landing_page_draft_generation";
        source: OpenAiConfigurationSource;
        revision: string;
        model: string;
        reasoningEffort: OpenAiReasoningEffort;
      }>;
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
  timeoutMs?: number;
  signal?: AbortSignal;
  environment?: OpenAiWorkloadEnvironment;
  workloadResolver?: OpenAiWorkloadResolverDependencies;
  costTracking?: OpenAiLpCostTrackingContext &
    Readonly<{ tracker: OpenAiLpCostTracker }>;
}>;

export async function generateLandingPageDraftCandidate(
  context: LandingPageGenerationContextPackage,
  dependencies: Dependencies = {},
): Promise<LandingPageDraftTextResult> {
  const environment =
    dependencies.environment ?? resolveOpenAiWorkloadEnvironment();
  const resolved = await resolveOpenAiProductWorkload(
    "landing_page_draft_generation",
    environment,
    dependencies.workloadResolver,
  );
  const apiKey = dependencies.apiKey?.trim();
  if (
    !resolved.ok ||
    !apiKey ||
    context.contractVersion !== 4
  ) {
    if (resolved.ok) emitFailure(resolved.value, "configuration_invalid", dependencies);
    return { ok: false, kind: "configuration_invalid" };
  }

  const workload = resolved.value;
  const request = buildLandingPageDraftResponsesRequest(
    context,
    workload.model,
    workload.reasoningEffort,
  );
  const controller = new AbortController();
  const fetchImpl = dependencies.fetchImpl ?? fetch;
  const now = dependencies.now ?? Date.now;
  const startedAt = now();
  const timeoutMs = boundedTimeout(
    dependencies.timeoutMs,
    LANDING_PAGE_DRAFT_TEXT_TIMEOUT_MS,
  );
  if (timeoutMs <= 0 || dependencies.signal?.aborted) {
    emitFailure(workload, "timeout", dependencies, { latencyMs: 0 });
    return { ok: false, kind: "timeout" };
  }
  let costSession: OpenAiLpCostTrackingSession | undefined;
  const costStart = dependencies.costTracking
    ? {
        accountId: dependencies.costTracking.accountId,
        landingPageId: dependencies.costTracking.landingPageId,
        attemptId: dependencies.attemptId ?? "",
        workload: "landing_page_draft_generation" as const,
        source: workload.source,
        revision: workload.revision,
        model: workload.model,
        reasoningEffort: workload.reasoningEffort,
      }
    : undefined;
  if (costStart && !isOpenAiLpPricingSupported(costStart)) {
    emitFailure(workload, "configuration_invalid", dependencies);
    return { ok: false, kind: "configuration_invalid" };
  }
  try {
    costSession = costStart
      ? await dependencies.costTracking?.tracker.start(costStart)
      : undefined;
  } catch {
    emitFailure(workload, "configuration_invalid", dependencies);
    return { ok: false, kind: "configuration_invalid" };
  }
  const providerTimeoutMs = Math.max(0, timeoutMs - (now() - startedAt));
  if (providerTimeoutMs <= 0 || dependencies.signal?.aborted) {
    emitFailure(workload, "timeout", dependencies, {
      latencyMs: now() - startedAt,
    });
    await completeCost(costSession, "failure");
    return { ok: false, kind: "timeout" };
  }
  const abortFromParent = () => controller.abort();
  dependencies.signal?.addEventListener("abort", abortFromParent, { once: true });
  const timeout = setTimeout(() => controller.abort(), providerTimeoutMs);

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
      const providerError = await readProviderErrorMetadata(response);
      emitFailure(workload, "http_error", dependencies, {
        latencyMs,
        httpStatus: response.status,
        providerRequestId: response.headers.get("x-request-id"),
        ...providerError,
      });
      await completeCost(costSession, "failure");
      return { ok: false, kind: "http_error" };
    }

    let payload: unknown;
    try {
      payload = await response.json();
    } catch {
      emitFailure(workload, "invalid_response", dependencies, { latencyMs });
      await completeCost(costSession, "failure");
      return { ok: false, kind: "invalid_response" };
    }
    if (!isRecord(payload)) {
      emitFailure(workload, "invalid_response", dependencies, { latencyMs });
      await completeCost(costSession, "failure");
      return { ok: false, kind: "invalid_response" };
    }

    const metadata = {
      responseId: payload.id,
      usage: payload.usage,
      latencyMs,
    } as const;
    if (payload.error) {
      emitFailure(workload, "provider_error", dependencies, metadata);
      await completeCost(costSession, "failure", payload);
      return { ok: false, kind: "provider_error" };
    }
    if (payload.status === "incomplete") {
      emitFailure(workload, "provider_error", dependencies, metadata);
      await completeCost(costSession, "failure", payload);
      return { ok: false, kind: "incomplete" };
    }
    if (payload.status !== "completed") {
      emitFailure(workload, "provider_error", dependencies, metadata);
      await completeCost(costSession, "failure", payload);
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
      await completeCost(costSession, "failure", payload);
      return { ok: false, kind: output.kind };
    }

    let candidate: unknown;
    try {
      candidate = JSON.parse(output.value);
    } catch {
      emitFailure(workload, "invalid_response", dependencies, metadata);
      await completeCost(costSession, "failure", payload);
      return { ok: false, kind: "invalid_response" };
    }
    const validated = validateLandingPagePresentationCandidate(
      candidate,
      context.modelContext.facts,
    );
    if (!validated.ok) {
      emitFailure(workload, "invalid_response", dependencies, metadata);
      await completeCost(costSession, "failure", payload);
      return { ok: false, kind: "invalid_candidate" };
    }

    (dependencies.emitEvent ?? emitOpenAiWorkloadEvent)(
      createOpenAiWorkloadSuccessEvent({
        ...eventContext(workload, dependencies),
        ...metadata,
      }),
    );
    await completeCost(costSession, "success", payload);
    return {
      ok: true,
      candidate: validated.value,
      responseId: nonEmptyString(payload.id),
      promptVersion: LANDING_PAGE_DRAFT_PROMPT_VERSION,
      usage: normalizeOpenAiResponseUsage(payload.usage),
      latencyMs,
      configuration: {
        workload: "landing_page_draft_generation",
        source: workload.source,
        revision: workload.revision,
        model: workload.model,
        reasoningEffort: workload.reasoningEffort,
      },
    };
  } catch (error) {
    const timedOut = error instanceof Error && error.name === "AbortError";
    emitFailure(
      workload,
      timedOut ? "timeout" : "transport_error",
      dependencies,
      { latencyMs: now() - startedAt },
    );
    await completeCost(costSession, "failure");
    return { ok: false, kind: timedOut ? "timeout" : "http_error" };
  } finally {
    clearTimeout(timeout);
    dependencies.signal?.removeEventListener("abort", abortFromParent);
  }
}

export function buildLandingPageDraftResponsesRequest(
  context: LandingPageGenerationContextPackage,
  model = landingPageDraftBaseline.model,
  reasoningEffort: OpenAiReasoningEffort =
    landingPageDraftBaseline.reasoningEffort,
) {
  const prompt = buildLandingPageDraftPrompt(context.modelContext);
  return {
    model,
    service_tier: "default",
    reasoning: { effort: reasoningEffort },
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

async function completeCost(
  session: OpenAiLpCostTrackingSession | undefined,
  result: "success" | "failure",
  payload?: Record<string, unknown>,
) {
  if (!session) return;
  try {
    await session.complete({
      result,
      usage: payload?.usage,
      serviceTier: payload?.service_tier,
    });
  } catch {
    // Terminal persistence is best-effort after a durable start.
  }
}

function resolveLandingPageDraftBaseline() {
  const workload = listOpenAiWorkloadInventory().find(
    (item) => item.id === "landing_page_draft_generation",
  );
  if (
    !workload ||
    !("apiKind" in workload) ||
    workload.apiKind !== "responses_text"
  ) {
    throw new Error("landing_page_draft_generation_baseline_missing");
  }
  return {
    model: workload.model,
    reasoningEffort: workload.reasoningEffort,
  } as const;
}

function eventContext(
  workload: ResolvedOpenAiProductWorkload,
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
    environment:
      dependencies.environment ?? resolveOpenAiWorkloadEnvironment(),
  } as const;
}

function emitFailure(
  workload: ResolvedOpenAiProductWorkload,
  category: OpenAiWorkloadFailureCategory,
  dependencies: Dependencies,
  metadata: Readonly<{
    responseId?: unknown;
    usage?: unknown;
    latencyMs?: unknown;
    httpStatus?: unknown;
    providerRequestId?: unknown;
    providerErrorCode?: unknown;
    providerErrorType?: unknown;
  }> = {},
) {
  (dependencies.emitEvent ?? emitOpenAiWorkloadEvent)(
    createOpenAiWorkloadFailureEvent(
      { ...eventContext(workload, dependencies), ...metadata },
      category,
    ),
  );
}

async function readProviderErrorMetadata(response: Response): Promise<
  Readonly<{
    providerErrorCode: unknown;
    providerErrorType: unknown;
  }>
> {
  try {
    const payload: unknown = await response.json();
    if (!isRecord(payload) || !isRecord(payload.error)) {
      return { providerErrorCode: null, providerErrorType: null };
    }
    return {
      providerErrorCode: payload.error.code,
      providerErrorType: payload.error.type,
    };
  } catch {
    return { providerErrorCode: null, providerErrorType: null };
  }
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

function boundedTimeout(value: number | undefined, maximum: number) {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.max(0, Math.min(maximum, Math.floor(value)))
    : maximum;
}
