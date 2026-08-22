import "server-only";

import { loadTaxonPreparationForVersion } from "../../conversion-content/adapters/selectedEndCustomerResearchAdapter";
import type {
  CompileLandingPageGenerationContextForDraftInput,
  CompileLandingPageGenerationContextResult,
} from "../generationContextContracts";
import { LANDING_PAGE_WORKSPACE_REQUIRED_INPUT_CATALOG_VERSION } from "../landingPageWorkspace";
import { getAccountLandingPageOperationalRevalidationAuthority } from "./landingPageWorkspaceAdapter";
import { compileLandingPageGenerationContextForDraftWithDependencies } from "./generationContextAdapterCore";
import { readLandingPageDraft } from "./landingPageDraftAdapter";

export function compileLandingPageGenerationContextForDraft(
  input: CompileLandingPageGenerationContextForDraftInput,
): Promise<CompileLandingPageGenerationContextResult> {
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
