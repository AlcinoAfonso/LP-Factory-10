import "server-only";

import { createServiceClient } from "@/lib/supabase/service";
import {
  readCompleteTaxonChainFromPages,
  type CompleteTaxonChainResult,
  type ReadTaxonChainPage,
} from "./taxonChainAdapterCore";

export async function readCompleteTaxonChainForTaxon(
  taxonId: string,
): Promise<CompleteTaxonChainResult> {
  const supabase = createServiceClient();
  const readPage: ReadTaxonChainPage = async (offset, limit) => {
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
  return readCompleteTaxonChainFromPages(taxonId, readPage);
}
