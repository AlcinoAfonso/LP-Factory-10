import "server-only";

import { createServiceClient } from "@/lib/supabase/service";
import {
  isEndCustomerResearchSelectionEnabled,
  isInputCatalogReviewEnabled,
  classifyRequiredInputCatalogVersion,
  deriveTaxonPreparationForVersion,
  type LoadSelectedEndCustomerResearchResult,
  type TaxonPreparationResult,
} from "../landing-page/taxon-preparation";
import { loadSelectedEndCustomerResearchFromClient } from "./selectedEndCustomerResearchAdapterCore";

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

export async function loadTaxonPreparationForVersion(input: {
  taxonId: string;
  requiredInputCatalogVersion: number;
}): Promise<TaxonPreparationResult> {
  if (!isInputCatalogReviewEnabled()) {
    return {
      ok: false,
      error: {
        code: "INPUT_CATALOG_REVIEW_DISABLED",
        message: "A preparação E20.6 está desabilitada.",
      },
    };
  }
  if (!isEndCustomerResearchSelectionEnabled()) {
    return {
      ok: false,
      error: {
        code: "FEATURE_DISABLED",
        message: "A leitura da pesquisa selecionada está desabilitada.",
      },
    };
  }
  const versionFailure = classifyRequiredInputCatalogVersion(
    input.requiredInputCatalogVersion,
  );
  if (versionFailure) return versionFailure;

  const supabase = createServiceClient();
  const selectedResearch = await loadSelectedEndCustomerResearchFromClient(
    { taxonId: input.taxonId, includeInputCatalogReview: true },
    supabase,
  );
  return deriveTaxonPreparationForVersion({
    selectedResearch,
    requiredInputCatalogVersion: input.requiredInputCatalogVersion,
  });
}
