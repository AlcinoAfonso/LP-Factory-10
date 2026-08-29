import "server-only";

import { createServiceClient } from "@/lib/supabase/service";
import { CURRENT_LANDING_PAGE_INPUT_CATALOG_VERSION } from "../landing-page/input-catalog";
import {
  isEndCustomerResearchSelectionEnabled,
  isInputCatalogReviewEnabled,
  deriveEffectiveTaxonPreparation,
  type LoadSelectedEndCustomerResearchResult,
  type TaxonPreparationResult,
} from "../landing-page/taxon-preparation";
import { loadSelectedEndCustomerResearchFromClient } from "./selectedEndCustomerResearchAdapterCore";
import { readCompleteTaxonChainForTaxon } from "./taxonChainAdapter";

export async function loadSelectedEndCustomerResearchForTaxon(input: {
  taxonId: string;
}): Promise<LoadSelectedEndCustomerResearchResult> {
  if (!isEndCustomerResearchSelectionEnabled()) {
    return {
      ok: false,
      error: {
        code: "FEATURE_DISABLED",
        message: "A leitura da pesquisa selecionada está desabilitada.",
      },
    };
  }

  const supabase = createServiceClient();
  return loadSelectedEndCustomerResearchFromClient(input, supabase);
}

export async function loadTaxonPreparationForCurrentVersion(input: {
  taxonId: string;
}): Promise<TaxonPreparationResult> {
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
    { taxonId: input.taxonId, includeInputCatalogReview: true },
    supabase,
  );
  if (!selectedResearch.ok) return selectedResearch;

  const chain = await readCompleteTaxonChainForTaxon(selectedResearch.value.taxonId);
  if (!chain.ok) {
    return preparationFailure(mapChainError(chain.error.code), chain.error.message);
  }
  return deriveEffectiveTaxonPreparation({
    selectedResearch,
    currentInputCatalogVersion: CURRENT_LANDING_PAGE_INPUT_CATALOG_VERSION,
    taxonChain: chain.value.chain,
  });
}

function mapChainError(
  code: import("./taxonChainAdapterCore").CompleteTaxonChainErrorCode,
): Extract<TaxonPreparationResult, { ok: false }>["error"]["code"] {
  switch (code) {
    case "DATABASE_READ_FAILED":
      return "DATABASE_READ_FAILED";
    case "TAXON_NOT_FOUND":
      return "TAXON_NOT_FOUND";
    case "TAXON_INACTIVE":
      return "TAXON_INACTIVE";
    case "TAXON_IDENTITY_INVALID":
    case "INVALID_TAXON_CHAIN":
      return "TAXON_IDENTITY_INVALID";
  }
}

function preparationFailure(
  code: Extract<TaxonPreparationResult, { ok: false }>["error"]["code"],
  message: string,
): Extract<TaxonPreparationResult, { ok: false }> {
  return Object.freeze({ ok: false, error: Object.freeze({ code, message }) });
}
