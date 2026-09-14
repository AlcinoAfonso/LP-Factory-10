import "server-only";

import {
  buildInputCatalogEvaluationContext,
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
    allowInactiveTaxon: true,
  });
  const taxonChain = await readCompleteTaxonChainForTaxon(input.taxonId, {
    allowInactiveSelected: true,
  });
  if (!taxonChain.ok) {
    return failure("CONTEXT_IDENTITY_INVALID", taxonChain.error.message);
  }

  return buildInputCatalogEvaluationContext({
    selectedResearch,
    taxonChain: taxonChain.value.chain,
    servedTaxon: taxonChain.value.selected,
    inputCatalogVersion: input.inputCatalogVersion,
    mode: input.mode,
  });
}

function failure(
  code: Extract<BuildInputCatalogEvaluationContextResult, { ok: false }>["error"]["code"],
  message: string,
): BuildInputCatalogEvaluationContextResult {
  return Object.freeze({ ok: false, error: Object.freeze({ code, message }) });
}
