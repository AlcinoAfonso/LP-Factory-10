import "server-only";

import {
  loadTaxonPreparationForCurrentVersion,
} from "../../conversion-content/adapters/selectedEndCustomerResearchAdapter";
import type {
  CompileLandingPageGenerationContextForDraftInput,
  CompileLandingPageGenerationContextResult,
} from "../generationContextContracts";
import { isLandingPageWorkspaceEnabled } from "../landingPageWorkspace";
import { getAccountLandingPageOperationalRevalidationAuthority } from "./landingPageWorkspaceAdapter";
import { getAccountLandingPageOnboardingRevalidationAuthority } from "./onboardingConfigurationAdapter";
import {
  compileLandingPageGenerationContextForDraftWithDependencies,
  compileLegacyLandingPageGenerationContextForDraftWithDependencies,
} from "./generationContextAdapterCore";
import { readLandingPageDraft } from "./landingPageDraftAdapter";

export function compileLandingPageGenerationContextForDraft(
  input: CompileLandingPageGenerationContextForDraftInput,
): Promise<CompileLandingPageGenerationContextResult> {
  if (!isLandingPageWorkspaceEnabled()) {
    return compileLegacyLandingPageGenerationContextForDraftWithDependencies(input, {
      loadRevalidationAuthority: getAccountLandingPageOnboardingRevalidationAuthority,
      loadLandingPage: readLandingPageDraft,
      loadPreparation: loadTaxonPreparationForCurrentVersion,
      log: (payload) => console.log(JSON.stringify(payload)),
    });
  }
  return compileLandingPageGenerationContextForDraftWithDependencies(input, {
    loadRevalidationAuthority: getAccountLandingPageOperationalRevalidationAuthority,
    loadLandingPage: readLandingPageDraft,
    loadPreparation: loadTaxonPreparationForCurrentVersion,
    log: (payload) => console.log(JSON.stringify(payload)),
  });
}
