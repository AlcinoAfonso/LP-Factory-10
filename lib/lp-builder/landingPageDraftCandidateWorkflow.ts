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
      requestId: string | null;
      candidate: LandingPagePresentationCandidate;
      binding: Extract<LandingPageConversionBindingResult, { ok: true }>["value"];
      text: Extract<LandingPageDraftTextResult, { ok: true }>;
      image: Extract<LandingPageDraftImageResult, { ok: true }>;
    }>
  | Readonly<{
      ok: false;
      stage: "binding" | "text" | "image";
      reason: string;
    }>;

type Dependencies = Readonly<{
  apiKey?: string;
  createAttemptId?: () => string;
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
  const binding = resolveLandingPageConversionBinding(input.context.serverContext);
  if (!binding.ok) {
    return { ok: false, stage: "binding", reason: binding.error };
  }

  const text = await (dependencies.generateText ?? generateLandingPageDraftCandidate)(
    input.context,
    { apiKey: dependencies.apiKey },
  );
  if (!text.ok) return { ok: false, stage: "text", reason: text.kind };

  const hero = text.candidate.sections.find((section) => section.kind === "hero");
  if (!hero || hero.kind !== "hero") {
    return { ok: false, stage: "text", reason: "hero_missing_after_validation" };
  }

  const image = await (dependencies.generateImage ?? generateLandingPageDraftImage)(
    {
      mediaBrief: hero.mediaBrief,
      semanticFacts: input.context.modelContext.facts,
    },
    { apiKey: dependencies.apiKey },
  );
  if (!image.ok) return { ok: false, stage: "image", reason: image.kind };

  return {
    ok: true,
    attemptId: (dependencies.createAttemptId ?? randomUUID)(),
    requestId: normalizeRequestId(input.requestId),
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
