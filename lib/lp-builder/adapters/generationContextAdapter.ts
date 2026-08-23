import "server-only";

import {
  loadTaxonPreparationForReviewedVersion,
  loadTaxonPreparationForVersion,
} from "../../conversion-content/adapters/selectedEndCustomerResearchAdapter";
import type {
  CompileLandingPageGenerationContextForDraftInput,
  CompileLandingPageGenerationContextResult,
} from "../generationContextContracts";
import { LANDING_PAGE_WORKSPACE_REQUIRED_INPUT_CATALOG_VERSION } from "../landingPageWorkspace";
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
      loadPreparation: loadTaxonPreparationForReviewedVersion,
      log: (payload) => console.log(JSON.stringify(payload)),
    });
  }
  return compileLandingPageGenerationContextForDraftWithDependencies(input, {
    loadRevalidationAuthority: getAccountLandingPageOperationalRevalidationAuthority,
    loadLandingPage: readLandingPageDraft,
    loadPreparation: ({ taxonId }) =>
      loadTaxonPreparationForVersion({
        taxonId,
        requiredInputCatalogVersion:
          LANDING_PAGE_WORKSPACE_REQUIRED_INPUT_CATALOG_VERSION,
      }),
    log: (payload) => console.log(JSON.stringify(payload)),
  });
}
