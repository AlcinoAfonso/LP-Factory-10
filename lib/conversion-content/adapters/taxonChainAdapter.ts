import "server-only";

import { createServiceClient } from "@/lib/supabase/service";
import {
  readCompleteTaxonChainForAdminEvaluationFromPages,
  readCompleteTaxonChainFromPages,
  type CompleteTaxonChainResult,
  type ReadTaxonChainPage,
} from "./taxonChainAdapterCore";

export async function readCompleteTaxonChainForTaxon(
  taxonId: string,
): Promise<CompleteTaxonChainResult> {
  const supabase = createServiceClient();
  return readCompleteTaxonChainFromPages(taxonId, createTaxonChainPageReader(supabase));
}

export async function readCompleteTaxonChainForAdminEvaluation(
  taxonId: string,
): Promise<CompleteTaxonChainResult> {
  const supabase = createServiceClient();
  return readCompleteTaxonChainForAdminEvaluationFromPages(
    taxonId,
    createTaxonChainPageReader(supabase),
  );
}

function createTaxonChainPageReader(
  supabase: ReturnType<typeof createServiceClient>,
): ReadTaxonChainPage {
  return async (offset, limit) => {
    const response = await supabase
      .from("business_taxons")
      .select("id,parent_id,level,name,slug,is_active")
      .in("level", ["segment", "niche", "ultra_niche"])
      .order("id", { ascending: true })
      .range(offset, offset + limit - 1);
    return {
      data: response.data,
      error: response.error,
      status: response.status,
    };
  };
}
