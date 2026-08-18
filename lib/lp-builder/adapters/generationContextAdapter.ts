import "server-only";

import { loadTaxonPreparationForReviewedVersion } from "../../conversion-content/adapters/selectedEndCustomerResearchAdapter";
import type {
  CompileLandingPageGenerationContextForDraftInput,
  CompileLandingPageGenerationContextResult,
} from "../generationContextContracts";
import { getAccountLandingPageOnboardingRevalidationAuthority } from "./onboardingConfigurationAdapter";
import { compileLandingPageGenerationContextForDraftWithDependencies } from "./generationContextAdapterCore";
import { readLandingPageDraft } from "./landingPageDraftAdapter";

export function compileLandingPageGenerationContextForDraft(
  input: CompileLandingPageGenerationContextForDraftInput,
): Promise<CompileLandingPageGenerationContextResult> {
  return compileLandingPageGenerationContextForDraftWithDependencies(input, {
    loadRevalidationAuthority: getAccountLandingPageOnboardingRevalidationAuthority,
    loadLandingPage: readLandingPageDraft,
    loadPreparation: loadTaxonPreparationForReviewedVersion,
    log: (payload) => console.log(JSON.stringify(payload)),
  });
}
