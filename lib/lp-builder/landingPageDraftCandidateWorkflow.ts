import { randomUUID } from "node:crypto";

import type { LandingPagePresentationCandidate } from "../conversion-content/landing-page/presentation";
import type { LandingPageGenerationContextPackage } from "./generationContextContracts";
import {
  generateLandingPageDraftCandidate,
  type LandingPageDraftTextResult,
} from "./landingPageDraftGeneration";
import {
  generateLandingPageDraftImage,
  type LandingPageDraftImageResult,
} from "./landingPageDraftImageGeneration";
import {
  resolveLandingPageConversionBinding,
  type LandingPageConversionBindingResult,
} from "./landingPageDraftWorkflow";

export const LANDING_PAGE_DRAFT_TOTAL_TIMEOUT_MS = 270_000;

export type LandingPageDraftCandidateWorkflowResult =
  | Readonly<{
      ok: true;
      attemptId: string;
      requestId: string;
      candidate: LandingPagePresentationCandidate;
      binding: Extract<LandingPageConversionBindingResult, { ok: true }>["value"];
      text: Extract<LandingPageDraftTextResult, { ok: true }>;
      image: Extract<LandingPageDraftImageResult, { ok: true }>;
    }>
  | Readonly<{
      ok: false;
      attemptId: string;
      requestId: string;
      stage: "binding" | "text" | "image" | "budget";
      reason: string;
    }>;

type Dependencies = Readonly<{
  apiKey?: string;
  createAttemptId?: () => string;
  createRequestId?: () => string;
  generateText?: typeof generateLandingPageDraftCandidate;
  generateImage?: typeof generateLandingPageDraftImage;
  now?: () => number;
  deadlineAtMs?: number;
  signal?: AbortSignal;
}>;

export async function prepareLandingPageDraftRevisionCandidate(
  input: Readonly<{
    context: LandingPageGenerationContextPackage;
    requestId?: string | null;
    deadlineAtMs?: number;
    signal?: AbortSignal;
  }>,
  dependencies: Dependencies = {},
): Promise<LandingPageDraftCandidateWorkflowResult> {
  const attemptId = createCorrelationId(dependencies.createAttemptId);
  const requestId =
    normalizeRequestId(input.requestId) ?? createCorrelationId(dependencies.createRequestId);
  const now = dependencies.now ?? Date.now;
  const deadlineAtMs =
    input.deadlineAtMs ??
    dependencies.deadlineAtMs ??
    now() + LANDING_PAGE_DRAFT_TOTAL_TIMEOUT_MS;
  const signal = input.signal ?? dependencies.signal;
  if (isExpired(deadlineAtMs, now, signal)) {
    return failure(attemptId, requestId, "budget", "total_timeout");
  }
  const binding = resolveLandingPageConversionBinding(input.context.serverContext);
  if (!binding.ok) {
    return failure(attemptId, requestId, "binding", binding.error);
  }

  const text = await (dependencies.generateText ?? generateLandingPageDraftCandidate)(
    input.context,
    {
      apiKey: dependencies.apiKey,
      attemptId,
      requestId,
      timeoutMs: remainingMs(deadlineAtMs, now),
      signal,
    },
  );
  if (!text.ok) return failure(attemptId, requestId, "text", text.kind);
  if (isExpired(deadlineAtMs, now, signal)) {
    return failure(attemptId, requestId, "budget", "total_timeout");
  }

  const hero = text.candidate.sections.find((section) => section.kind === "hero");
  if (!hero || hero.kind !== "hero") {
    return failure(
      attemptId,
      requestId,
      "text",
      "hero_missing_after_validation",
    );
  }

  const image = await (dependencies.generateImage ?? generateLandingPageDraftImage)(
    {
      mediaBrief: hero.mediaBrief,
      semanticFacts: input.context.modelContext.facts,
    },
    {
      apiKey: dependencies.apiKey,
      attemptId,
      requestId,
      timeoutMs: remainingMs(deadlineAtMs, now),
      signal,
    },
  );
  if (!image.ok) return failure(attemptId, requestId, "image", image.kind);
  if (isExpired(deadlineAtMs, now, signal)) {
    return failure(attemptId, requestId, "budget", "total_timeout");
  }

  return {
    ok: true,
    attemptId,
    requestId,
    candidate: text.candidate,
    binding: binding.value,
    text,
    image,
  };
}

function normalizeRequestId(value: string | null | undefined) {
  const normalized = value?.trim() ?? "";
  return normalized.length > 0 ? normalized : null;
}

function createCorrelationId(factory: (() => string) | undefined) {
  const value = (factory ?? randomUUID)().trim();
  return value || randomUUID();
}

function failure(
  attemptId: string,
  requestId: string,
  stage: "binding" | "text" | "image" | "budget",
  reason: string,
): LandingPageDraftCandidateWorkflowResult {
  return { ok: false, attemptId, requestId, stage, reason };
}

function remainingMs(deadlineAtMs: number, now: () => number) {
  return Math.max(0, deadlineAtMs - now());
}

function isExpired(
  deadlineAtMs: number,
  now: () => number,
  signal: AbortSignal | undefined,
) {
  return signal?.aborted === true || remainingMs(deadlineAtMs, now) <= 0;
}
