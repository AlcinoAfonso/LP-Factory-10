import "server-only";

import type { LandingPageGenerationContextPackage } from "../generationContextContracts";
import {
  generateLandingPageDraftCandidate as generateLandingPageDraftCandidateCore,
  type LandingPageDraftTextResult,
} from "../landingPageDraftGeneration";

export function generateLandingPageDraftCandidate(
  context: LandingPageGenerationContextPackage,
): Promise<LandingPageDraftTextResult> {
  return generateLandingPageDraftCandidateCore(context, {
    apiKey: process.env.OPENAI_API_KEY,
  });
}
