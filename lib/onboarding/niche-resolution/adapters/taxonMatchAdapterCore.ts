import type {
  MatchBusinessTaxonsResult,
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

export type TaxonMatchRpc = (
  name: "match_business_taxons_deterministic",
  args: Readonly<{ p_query: string; p_limit: number }>,
) => PromiseLike<Readonly<{ data: unknown; error: unknown }>>;

const TAXON_LEVELS = new Set<TaxonLevel>(["segment", "niche", "ultra_niche"]);

export async function matchBusinessTaxonsDeterministicCore(
  query: string,
  limit: number,
  rpc: TaxonMatchRpc,
): Promise<MatchBusinessTaxonsResult> {
  const normalizedQuery = query.trim();
  if (!normalizedQuery) return success([]);

  let response: Readonly<{ data: unknown; error: unknown }>;
  try {
    response = await rpc("match_business_taxons_deterministic", {
      p_query: normalizedQuery,
      p_limit: normalizeLimit(limit),
    });
  } catch {
    return failure("RPC_FAILED", "A consulta determinística de taxons falhou.");
  }

  if (response.error) {
    return failure("RPC_FAILED", "A consulta determinística de taxons falhou.");
  }
  if (!Array.isArray(response.data)) {
    return failure("RESPONSE_INVALID", "A resposta determinística de taxons é inválida.");
  }

  const candidates = response.data.map(mapTaxonMatchRpcRow);
  if (candidates.some((candidate) => candidate === null)) {
    return failure("RESPONSE_INVALID", "A resposta determinística de taxons é inválida.");
  }
  return success(candidates as TaxonMatchCandidate[]);
}

function normalizeLimit(limit: number): number {
  const finiteLimit = Number.isFinite(limit) ? limit : 10;
  return Math.min(50, Math.max(1, Math.floor(finiteLimit)));
}

function mapTaxonMatchRpcRow(value: unknown): TaxonMatchCandidate | null {
  if (!isRecord(value)) return null;
  const row = value as TaxonMatchRpcRow;
  if (
    typeof row.taxon_id !== "string" ||
    typeof row.name !== "string" ||
    typeof row.slug !== "string" ||
    typeof row.level !== "string" ||
    !TAXON_LEVELS.has(row.level as TaxonLevel) ||
    (row.parent_id !== null && typeof row.parent_id !== "string") ||
    (row.parent_name !== null && typeof row.parent_name !== "string") ||
    (row.matched_aliases !== null &&
      (!Array.isArray(row.matched_aliases) ||
        row.matched_aliases.some((alias) => typeof alias !== "string"))) ||
    typeof row.match_source !== "string" ||
    row.match_source.trim().length === 0
  ) {
    return null;
  }
  const score = Number(row.score ?? 0);
  if (!Number.isFinite(score)) return null;

  return Object.freeze({
    taxonId: row.taxon_id,
    name: row.name,
    slug: row.slug,
    level: row.level as TaxonLevel,
    parentId: row.parent_id,
    parentName: row.parent_name,
    matchedAliases: Object.freeze([...(row.matched_aliases ?? [])]),
    matchSource: row.match_source,
    score,
  });
}

function success(
  candidates: readonly TaxonMatchCandidate[],
): MatchBusinessTaxonsResult {
  return Object.freeze({ ok: true, candidates: Object.freeze([...candidates]) });
}

function failure(
  code: "RPC_FAILED" | "RESPONSE_INVALID",
  message: string,
): MatchBusinessTaxonsResult {
  return Object.freeze({ ok: false, error: Object.freeze({ code, message }) });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
