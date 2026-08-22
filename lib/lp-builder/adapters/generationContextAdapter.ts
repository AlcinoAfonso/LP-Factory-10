import "server-only";

import { loadTaxonPreparationForReviewedVersion } from "../../conversion-content/adapters/selectedEndCustomerResearchAdapter";
import type {
  CompileLandingPageGenerationContextForDraftInput,
  CompileLandingPageGenerationContextResult,
} from "../generationContextContracts";
import { getAccountLandingPageOperationalRevalidationAuthority } from "./landingPageWorkspaceAdapter";
import { compileLandingPageGenerationContextForDraftWithDependencies } from "./generationContextAdapterCore";
import { readLandingPageDraft } from "./landingPageDraftAdapter";

export function compileLandingPageGenerationContextForDraft(
  input: CompileLandingPageGenerationContextForDraftInput,
): Promise<CompileLandingPageGenerationContextResult> {
  return compileLandingPageGenerationContextForDraftWithDependencies(input, {
    loadRevalidationAuthority: ({ accountId }) =>
      getAccountLandingPageOperationalRevalidationAuthority({
        accountId,
        landingPageId: input.landingPageId,
      }),
    loadLandingPage: readLandingPageDraft,
    loadPreparation: loadTaxonPreparationForReviewedVersion,
    log: (payload) => console.log(JSON.stringify(payload)),
  });
}
