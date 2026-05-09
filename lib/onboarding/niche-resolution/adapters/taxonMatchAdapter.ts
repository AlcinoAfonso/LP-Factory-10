import "server-only";

import { createServiceClient } from "@/lib/supabase/service";
import type {
  TaxonLevel,
  TaxonMatchCandidate,
} from "../contracts";

type TaxonMatchRpcRow = {
  taxon_id: string;
  name: string;
  slug: string;
  level: string;
  parent_id: string | null;
  parent_name: string | null;
  matched_aliases: string[] | null;
  match_source: string;
  score: number | string | null;
};

const TAXON_LEVELS = new Set<TaxonLevel>(["segment", "niche", "ultra_niche"]);

function normalizeLimit(limit: number): number {
  const finiteLimit = Number.isFinite(limit) ? limit : 10;
  return Math.min(50, Math.max(1, Math.floor(finiteLimit)));
}

function normalizeTaxonLevel(level: string): TaxonLevel | null {
  return TAXON_LEVELS.has(level as TaxonLevel) ? (level as TaxonLevel) : null;
}

function mapTaxonMatchRpcRow(
  row: TaxonMatchRpcRow
): TaxonMatchCandidate | null {
  const level = normalizeTaxonLevel(row.level);

  if (!level) return null;

  const score = Number(row.score ?? 0);

  return {
    taxonId: row.taxon_id,
    name: row.name,
    slug: row.slug,
    level,
    parentId: row.parent_id,
    parentName: row.parent_name,
    matchedAliases: Array.isArray(row.matched_aliases) ? row.matched_aliases : [],
    matchSource: row.match_source,
    score: Number.isFinite(score) ? score : 0,
  };
}

export async function matchBusinessTaxonsDeterministic(
  query: string,
  limit = 10
): Promise<TaxonMatchCandidate[]> {
  const normalizedQuery = query.trim();

  if (!normalizedQuery) return [];

  const safeLimit = normalizeLimit(limit);
  const supabase = createServiceClient();

  try {
    const { data, error } = await supabase.rpc("match_business_taxons_deterministic", {
      p_query: normalizedQuery,
      p_limit: safeLimit,
    });

    if (error) {
      console.error("matchBusinessTaxonsDeterministic failed:", {
        code: error?.code,
        message: error?.message,
      });
      return [];
    }

    const rows = (Array.isArray(data) ? data : []) as TaxonMatchRpcRow[];
    return rows
      .map(mapTaxonMatchRpcRow)
      .filter((candidate): candidate is TaxonMatchCandidate => candidate !== null);
  } catch (error) {
    console.error("matchBusinessTaxonsDeterministic failed:", {
      code: error instanceof Error ? error.name : undefined,
      message: error instanceof Error ? error.message : String(error),
    });
    return [];
  }
}
