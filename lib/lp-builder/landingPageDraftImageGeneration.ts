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
      requestId: string | null;
      visualBriefVersion: typeof LANDING_PAGE_VISUAL_BRIEF_VERSION;
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
  fetchImpl?: typeof fetch;
  emitEvent?: (event: OpenAiImageWorkloadEvent) => void;
  now?: () => number;
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
  const timeout = setTimeout(() => controller.abort(), LANDING_PAGE_DRAFT_IMAGE_TIMEOUT_MS);
  const fetchImpl = dependencies.fetchImpl ?? fetch;
  const now = dependencies.now ?? Date.now;
  const startedAt = now();

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
    const requestId = nonEmptyString(response.headers.get("x-request-id"));
    if (!response.ok) {
      emitFailure(workload, "http_error", dependencies, { requestId, latencyMs });
      return { ok: false, kind: "http_error" };
    }

    let payload: unknown;
    try {
      payload = await response.json();
    } catch {
      emitFailure(workload, "invalid_response", dependencies, { requestId, latencyMs });
      return { ok: false, kind: "invalid_response" };
    }
    if (!isRecord(payload) || payload.error || !Array.isArray(payload.data)) {
      emitFailure(
        workload,
        isRecord(payload) && payload.error ? "provider_error" : "invalid_response",
        dependencies,
        { requestId, latencyMs },
      );
      return {
        ok: false,
        kind: isRecord(payload) && payload.error ? "provider_error" : "invalid_response",
      };
    }
    const image = payload.data[0];
    if (payload.data.length !== 1 || !isRecord(image) || typeof image.b64_json !== "string") {
      emitFailure(workload, "invalid_response", dependencies, { requestId, latencyMs });
      return { ok: false, kind: "invalid_response" };
    }
    const bytes = Uint8Array.from(Buffer.from(image.b64_json, "base64"));
    if (!isWebP(bytes)) {
      emitFailure(workload, "invalid_response", dependencies, { requestId, latencyMs });
      return { ok: false, kind: "invalid_response" };
    }

    (dependencies.emitEvent ?? emitOpenAiImageWorkloadEvent)(
      createOpenAiImageWorkloadSuccessEvent({
        workload,
        requestId,
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
      requestId,
      visualBriefVersion: LANDING_PAGE_VISUAL_BRIEF_VERSION,
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

function emitFailure(
  workload: Extract<ReturnType<typeof resolveOpenAiImageWorkload>, { ok: true }>["value"],
  category: OpenAiWorkloadFailureCategory,
  dependencies: Dependencies,
  metadata: Readonly<{ requestId?: unknown; latencyMs?: unknown }> = {},
) {
  (dependencies.emitEvent ?? emitOpenAiImageWorkloadEvent)(
    createOpenAiImageWorkloadFailureEvent({ workload, ...metadata }, category),
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
