import "server-only";

import {
  resolveLandingPageKnowledgeForCurrentCatalog,
  researchDynamicLandingPageMarketWithOpenAi,
} from "../../conversion-content";
import {
  resolveLandingPageGenerationKnowledge,
  type LandingPageGenerationKnowledgeInput,
} from "../landingPageGenerationKnowledge";

export function loadLandingPageGenerationKnowledge(input: LandingPageGenerationKnowledgeInput) {
  return resolveLandingPageGenerationKnowledge(input, {
    resolveKnowledge: resolveLandingPageKnowledgeForCurrentCatalog,
    researchDynamic: researchDynamicLandingPageMarketWithOpenAi,
    apiKey: process.env.OPENAI_API_KEY,
  });
}
