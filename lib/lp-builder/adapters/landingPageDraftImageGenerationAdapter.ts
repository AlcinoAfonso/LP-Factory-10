import "server-only";

import {
  generateLandingPageDraftImage as generateLandingPageDraftImageCore,
  type LandingPageDraftImageResult,
} from "../landingPageDraftImageGeneration";

export function generateLandingPageDraftImage(
  input: Readonly<{ mediaBrief: string; semanticFacts: unknown }>,
): Promise<LandingPageDraftImageResult> {
  return generateLandingPageDraftImageCore(input, {
    apiKey: process.env.OPENAI_API_KEY,
  });
}
