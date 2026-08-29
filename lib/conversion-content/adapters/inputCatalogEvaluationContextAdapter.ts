import "server-only";

import {
  resolveLandingPageInputCatalogFromRegistry,
  type LandingPageInputCatalogRegistry,
} from "../landing-page/input-catalog";
import {
  buildInputCatalogEvaluationContext,
  resolveInputCatalogReview,
  type BuildInputCatalogEvaluationContextResult,
  type InputCatalogEvaluationReconstructionInput,
} from "../landing-page/taxon-preparation";
import { loadSelectedEndCustomerResearchForTaxon } from "./selectedEndCustomerResearchAdapter";
import { readCompleteTaxonChainForTaxon } from "./taxonChainAdapter";

export async function reconstructCanonicalInputCatalogEvaluationContext(
  input: InputCatalogEvaluationReconstructionInput,
): Promise<BuildInputCatalogEvaluationContextResult> {
  const selectedResearch = await loadSelectedEndCustomerResearchForTaxon({
    taxonId: input.taxonId,
  });
  if (!selectedResearch.ok) {
    return failure(
      "AUTHORIZED_RESEARCH_INVALID",
      selectedResearch.error.message,
    );
  }
  const taxonChain = await readCompleteTaxonChainForTaxon(input.taxonId);
  if (!taxonChain.ok) {
    return failure("CONTEXT_IDENTITY_INVALID", taxonChain.error.message);
  }

  return buildInputCatalogEvaluationContext({
    selectedResearch,
    taxonChain: taxonChain.value.chain,
    inputCatalogVersion: input.inputCatalogVersion,
  });
}

export async function reconstructDraftInputCatalogEvaluationContext(
  input: InputCatalogEvaluationReconstructionInput,
  registry: LandingPageInputCatalogRegistry,
): Promise<BuildInputCatalogEvaluationContextResult> {
  const selectedResearch = await loadSelectedEndCustomerResearchForTaxon({
    taxonId: input.taxonId,
  });
  if (!selectedResearch.ok) {
    return failure("AUTHORIZED_RESEARCH_INVALID", selectedResearch.error.message);
  }
  const taxonChain = await readCompleteTaxonChainForTaxon(input.taxonId);
  if (!taxonChain.ok) return failure("CONTEXT_IDENTITY_INVALID", taxonChain.error.message);
  return buildInputCatalogEvaluationContext(
    {
      selectedResearch,
      taxonChain: taxonChain.value.chain,
      inputCatalogVersion: input.inputCatalogVersion,
    },
    {
      allowNonPublishedVersion: true,
      resolveReview: (reviewInput) => resolveInputCatalogReview(
        reviewInput,
        (catalogInput) => resolveLandingPageInputCatalogFromRegistry(catalogInput, registry),
      ),
    },
  );
}


function failure(
  code: Extract<BuildInputCatalogEvaluationContextResult, { ok: false }>["error"]["code"],
  message: string,
): BuildInputCatalogEvaluationContextResult {
  return Object.freeze({ ok: false, error: Object.freeze({ code, message }) });
}
