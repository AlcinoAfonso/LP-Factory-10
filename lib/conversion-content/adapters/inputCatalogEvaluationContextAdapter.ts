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
import { loadAdminInputCatalogEvaluationSources } from "@/lib/admin/adapters/adminInputCatalogEvaluationSourceAdapter";

export async function reconstructCanonicalInputCatalogEvaluationContext(
  input: InputCatalogEvaluationReconstructionInput,
): Promise<BuildInputCatalogEvaluationContextResult> {
  const sources = await loadAdminInputCatalogEvaluationSources(input.taxonId);
  if (!sources.ok) return failure("CONTEXT_IDENTITY_INVALID", sources.message);
  if (!sources.selectedResearch.ok && sources.selectedResearch.error.code !== "SELECTION_ABSENT") {
    return failure("AUTHORIZED_RESEARCH_INVALID", sources.selectedResearch.error.message);
  }

  return buildInputCatalogEvaluationContext(
    {
      selectedResearch: sources.selectedResearch,
      taxonChain: sources.taxonChain,
      inputCatalogVersion: input.inputCatalogVersion,
      mode: input.mode,
    },
    { allowInactiveServedTaxon: true },
  );
}

export async function reconstructDraftInputCatalogEvaluationContext(
  input: InputCatalogEvaluationReconstructionInput,
  registry: LandingPageInputCatalogRegistry,
): Promise<BuildInputCatalogEvaluationContextResult> {
  const sources = await loadAdminInputCatalogEvaluationSources(input.taxonId);
  if (!sources.ok) return failure("CONTEXT_IDENTITY_INVALID", sources.message);
  if (!sources.selectedResearch.ok && sources.selectedResearch.error.code !== "SELECTION_ABSENT") {
    return failure("AUTHORIZED_RESEARCH_INVALID", sources.selectedResearch.error.message);
  }
  return buildInputCatalogEvaluationContext(
    {
      selectedResearch: sources.selectedResearch,
      taxonChain: sources.taxonChain,
      inputCatalogVersion: input.inputCatalogVersion,
      mode: input.mode,
    },
    {
      allowNonPublishedVersion: true,
      allowInactiveServedTaxon: true,
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
