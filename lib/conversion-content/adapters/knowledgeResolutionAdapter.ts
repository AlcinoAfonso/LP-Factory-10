import "server-only";

import { createServiceClient } from "@/lib/supabase/service";
import { matchBusinessTaxonsDeterministic } from "../../onboarding/niche-resolution/adapters/taxonMatchAdapter";
import {
  CURRENT_LANDING_PAGE_INPUT_CATALOG_VERSION,
  type LandingPageInputCatalogTaxonChain,
} from "../landing-page/input-catalog";
import {
  deriveEffectiveTaxonPreparation,
  isEndCustomerResearchSelectionEnabled,
  isInputCatalogReviewEnabled,
  type TaxonPreparationResult,
} from "../landing-page/taxon-preparation";
import { resolveLandingPageKnowledge } from "../landing-page/knowledge-resolution";
import { loadSelectedEndCustomerResearchFromClient } from "./selectedEndCustomerResearchAdapterCore";
import { readCompleteTaxonChainForTaxon } from "./taxonChainAdapter";

export async function resolveLandingPageKnowledgeForCurrentCatalog(input: {
  servedTaxonId: string;
  offeringScope: unknown;
}) {
  return resolveLandingPageKnowledge(
    {
      ...input,
      currentInputCatalogVersion: CURRENT_LANDING_PAGE_INPUT_CATALOG_VERSION,
    },
    {
      readTaxonomy: readCompleteTaxonChainForTaxon,
      matchTaxons: matchBusinessTaxonsDeterministic,
      loadPreparation: loadPreparationForChain,
    },
  );
}

async function loadPreparationForChain(
  taxonId: string,
  taxonChain: LandingPageInputCatalogTaxonChain,
): Promise<TaxonPreparationResult> {
  if (!isInputCatalogReviewEnabled()) {
    return preparationFailure(
      "INPUT_CATALOG_REVIEW_DISABLED",
      "A preparação E20.6 está desabilitada.",
    );
  }
  if (!isEndCustomerResearchSelectionEnabled()) {
    return preparationFailure(
      "FEATURE_DISABLED",
      "A leitura da pesquisa selecionada está desabilitada.",
    );
  }
  const supabase = createServiceClient();
  const selectedResearch = await loadSelectedEndCustomerResearchFromClient(
    { taxonId, includeInputCatalogReview: true },
    supabase,
  );
  if (!selectedResearch.ok) return selectedResearch;
  return deriveEffectiveTaxonPreparation({
    selectedResearch,
    currentInputCatalogVersion: CURRENT_LANDING_PAGE_INPUT_CATALOG_VERSION,
    taxonChain,
  });
}

function preparationFailure(
  code: Extract<TaxonPreparationResult, { ok: false }>["error"]["code"],
  message: string,
): Extract<TaxonPreparationResult, { ok: false }> {
  return Object.freeze({ ok: false, error: Object.freeze({ code, message }) });
}
