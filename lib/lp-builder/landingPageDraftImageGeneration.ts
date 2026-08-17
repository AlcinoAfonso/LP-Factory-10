import {
  LANDING_PAGE_VISUAL_BRIEF_VERSION,
  buildLandingPageVisualPrompt,
} from "../conversion-content/landing-page/presentation";
import {
  createOpenAiImageWorkloadFailureEvent,
  createOpenAiImageWorkloadSuccessEvent,
  emitOpenAiImageWorkloadEvent,
  resolveOpenAiImageWorkload,
  type OpenAiImageWorkloadEvent,
  type OpenAiWorkloadFailureCategory,
} from "../openai-workloads";

export const LANDING_PAGE_DRAFT_IMAGE_TIMEOUT_MS = 120_000;

export type LandingPageDraftImageResult =
  | Readonly<{
      ok: true;
      bytes: Uint8Array;
      mimeType: "image/webp";
      width: 1536;
      height: 1024;
      providerRequestId: string | null;
      visualBriefVersion: typeof LANDING_PAGE_VISUAL_BRIEF_VERSION;
      latencyMs: number;
      configuration: Readonly<{
        workload: "landing_page_draft_image_generation";
        source: "repo_catalog";
        revision: string;
        model: string;
        size: "1536x1024";
        quality: "medium";
        format: "webp";
        compression: 80;
        moderation: "auto";
      }>;
    }>
  | Readonly<{
      ok: false;
      kind:
        | "configuration_invalid"
        | "timeout"
        | "http_error"
        | "provider_error"
        | "invalid_response";
    }>;

type Dependencies = Readonly<{
  apiKey?: string;
  attemptId?: string;
  requestId?: string;
  fetchImpl?: typeof fetch;
  emitEvent?: (event: OpenAiImageWorkloadEvent) => void;
  now?: () => number;
  timeoutMs?: number;
  signal?: AbortSignal;
}>;

export async function generateLandingPageDraftImage(
  input: Readonly<{ mediaBrief: string; semanticFacts: unknown }>,
  dependencies: Dependencies = {},
): Promise<LandingPageDraftImageResult> {
  const resolved = resolveOpenAiImageWorkload(
    "landing_page_draft_image_generation",
  );
  const apiKey = dependencies.apiKey?.trim();
  if (!resolved.ok || !apiKey || !input.mediaBrief.trim()) {
    if (resolved.ok) emitFailure(resolved.value, "configuration_invalid", dependencies);
    return { ok: false, kind: "configuration_invalid" };
  }
  const workload = resolved.value;
  const prompt = buildLandingPageVisualPrompt(
    input.mediaBrief.trim(),
    input.semanticFacts,
  );
  const controller = new AbortController();
  const fetchImpl = dependencies.fetchImpl ?? fetch;
  const now = dependencies.now ?? Date.now;
  const startedAt = now();
  const timeoutMs = boundedTimeout(
    dependencies.timeoutMs,
    LANDING_PAGE_DRAFT_IMAGE_TIMEOUT_MS,
  );
  if (timeoutMs <= 0 || dependencies.signal?.aborted) {
    emitFailure(workload, "timeout", dependencies, { latencyMs: 0 });
    return { ok: false, kind: "timeout" };
  }
  const abortFromParent = () => controller.abort();
  dependencies.signal?.addEventListener("abort", abortFromParent, { once: true });
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetchImpl("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: workload.model,
        prompt,
        n: 1,
        size: workload.size,
        quality: workload.quality,
        output_format: workload.format,
        output_compression: workload.compression,
        moderation: workload.moderation,
      }),
      signal: controller.signal,
      cache: "no-store",
    });
    const latencyMs = now() - startedAt;
    const providerRequestId = nonEmptyString(response.headers.get("x-request-id"));
    if (!response.ok) {
      emitFailure(workload, "http_error", dependencies, { providerRequestId, latencyMs });
      return { ok: false, kind: "http_error" };
    }

    let payload: unknown;
    try {
      payload = await response.json();
    } catch {
      emitFailure(workload, "invalid_response", dependencies, { providerRequestId, latencyMs });
      return { ok: false, kind: "invalid_response" };
    }
    if (!isRecord(payload) || payload.error || !Array.isArray(payload.data)) {
      emitFailure(
        workload,
        isRecord(payload) && payload.error ? "provider_error" : "invalid_response",
        dependencies,
        { providerRequestId, latencyMs },
      );
      return {
        ok: false,
        kind: isRecord(payload) && payload.error ? "provider_error" : "invalid_response",
      };
    }
    const image = payload.data[0];
    if (payload.data.length !== 1 || !isRecord(image) || typeof image.b64_json !== "string") {
      emitFailure(workload, "invalid_response", dependencies, { providerRequestId, latencyMs });
      return { ok: false, kind: "invalid_response" };
    }
    const bytes = Uint8Array.from(Buffer.from(image.b64_json, "base64"));
    if (!isWebP(bytes)) {
      emitFailure(workload, "invalid_response", dependencies, { providerRequestId, latencyMs });
      return { ok: false, kind: "invalid_response" };
    }

    (dependencies.emitEvent ?? emitOpenAiImageWorkloadEvent)(
      createOpenAiImageWorkloadSuccessEvent({
        workload,
        attemptId: dependencies.attemptId,
        requestId: dependencies.requestId,
        providerRequestId,
        latencyMs,
        imageCount: 1,
        width: 1536,
        height: 1024,
        estimatedCost: null,
        costStatus: "unavailable",
        visualBriefVersion: LANDING_PAGE_VISUAL_BRIEF_VERSION,
      }),
    );
    return {
      ok: true,
      bytes,
      mimeType: "image/webp",
      width: 1536,
      height: 1024,
      providerRequestId,
      visualBriefVersion: LANDING_PAGE_VISUAL_BRIEF_VERSION,
      latencyMs,
      configuration: {
        workload: "landing_page_draft_image_generation",
        source: workload.source,
        revision: workload.revision,
        model: workload.model,
        size: workload.size,
        quality: workload.quality,
        format: workload.format,
        compression: workload.compression,
        moderation: workload.moderation,
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
    return { ok: false, kind: timedOut ? "timeout" : "http_error" };
  } finally {
    clearTimeout(timeout);
    dependencies.signal?.removeEventListener("abort", abortFromParent);
  }
}

function emitFailure(
  workload: Extract<ReturnType<typeof resolveOpenAiImageWorkload>, { ok: true }>["value"],
  category: OpenAiWorkloadFailureCategory,
  dependencies: Dependencies,
  metadata: Readonly<{ providerRequestId?: unknown; latencyMs?: unknown }> = {},
) {
  (dependencies.emitEvent ?? emitOpenAiImageWorkloadEvent)(
    createOpenAiImageWorkloadFailureEvent(
      {
        workload,
        attemptId: dependencies.attemptId,
        requestId: dependencies.requestId,
        visualBriefVersion: LANDING_PAGE_VISUAL_BRIEF_VERSION,
        ...metadata,
      },
      category,
    ),
  );
}

function isWebP(bytes: Uint8Array) {
  return (
    bytes.length > 12 &&
    Buffer.from(bytes.subarray(0, 4)).toString("ascii") === "RIFF" &&
    Buffer.from(bytes.subarray(8, 12)).toString("ascii") === "WEBP"
  );
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
