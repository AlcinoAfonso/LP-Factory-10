import "server-only";

import { createServiceClient } from "@/lib/supabase/service";
import type { FactualTaxonChain } from "../landing-page/input-catalog";
import { readCompleteFactualCoverageFromPages, type ReadCompleteFactualCoverageResult } from "./factualFieldsAdapterCore";
import { readCompleteTaxonChainForTaxon } from "./taxonChainAdapter";

export async function readFactualCoverageForTaxon(
  taxonId: string,
  options: Readonly<{ allowInactiveSelected?: boolean; includeInactive?: boolean }> = {},
): Promise<ReadCompleteFactualCoverageResult> {
  const chain = await readCompleteTaxonChainForTaxon(taxonId, options);
  if (!chain.ok) return { ok: false, error: { code: "READ_FAILED", message: chain.error.message } };
  return readFactualCoverage(chain.value.chain, { includeInactive: options.includeInactive });
}

export async function readFactualCoverage(taxonChain: FactualTaxonChain, options: Readonly<{ includeInactive?: boolean }> = {}): Promise<ReadCompleteFactualCoverageResult> {
  const supabase = createServiceClient();
  const taxonIds = [taxonChain.segment.id, taxonChain.niche?.id, taxonChain.ultraNiche?.id].filter((id): id is string => Boolean(id));
  return readCompleteFactualCoverageFromPages(taxonChain, async (offset, limit) => {
    const response = await supabase
      .from("taxon_factual_fields")
      .select("id,field_key,taxon_id,definition,is_active,created_by,updated_by,created_at,updated_at")
      .or(`taxon_id.is.null,taxon_id.in.(${taxonIds.join(",")})`)
      .order("field_key", { ascending: true })
      .range(offset, offset + limit - 1);
    return { data: response.data, error: response.error, status: response.status };
  }, options);
}
