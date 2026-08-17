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
      stage: "binding" | "text" | "image";
      reason: string;
    }>;

type Dependencies = Readonly<{
  apiKey?: string;
  createAttemptId?: () => string;
  createRequestId?: () => string;
  generateText?: typeof generateLandingPageDraftCandidate;
  generateImage?: typeof generateLandingPageDraftImage;
}>;

export async function prepareLandingPageDraftRevisionCandidate(
  input: Readonly<{
    context: LandingPageGenerationContextPackage;
    requestId?: string | null;
  }>,
  dependencies: Dependencies = {},
): Promise<LandingPageDraftCandidateWorkflowResult> {
  const attemptId = createCorrelationId(dependencies.createAttemptId);
  const requestId =
    normalizeRequestId(input.requestId) ?? createCorrelationId(dependencies.createRequestId);
  const binding = resolveLandingPageConversionBinding(input.context.serverContext);
  if (!binding.ok) {
    return failure(attemptId, requestId, "binding", binding.error);
  }

  const text = await (dependencies.generateText ?? generateLandingPageDraftCandidate)(
    input.context,
    { apiKey: dependencies.apiKey, attemptId, requestId },
  );
  if (!text.ok) return failure(attemptId, requestId, "text", text.kind);

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
    { apiKey: dependencies.apiKey, attemptId, requestId },
  );
  if (!image.ok) return failure(attemptId, requestId, "image", image.kind);

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
  stage: "binding" | "text" | "image",
  reason: string,
): LandingPageDraftCandidateWorkflowResult {
  return { ok: false, attemptId, requestId, stage, reason };
}
