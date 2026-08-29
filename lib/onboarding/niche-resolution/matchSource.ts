import type { DeterministicMatchDecision } from "./contracts";

export const specializedKnowledgeMatchSources = [
  "alias_exact",
  "alias_normalized",
  "taxon_name_exact",
  "taxon_name_normalized",
] as const;

export const weakKnowledgeMatchSources = [
  "fts",
  "trgm",
  "taxon_slug_normalized",
] as const;

const specializedKnowledgeSourceSet = new Set<string>(
  specializedKnowledgeMatchSources,
);
const aliasSourceSet = new Set<string>(["alias_exact", "alias_normalized"]);
const taxonIdentitySourceSet = new Set<string>([
  "taxon_name_exact",
  "taxon_name_normalized",
  "taxon_slug_normalized",
]);

export function splitTaxonMatchSource(matchSource: string): readonly string[] {
  return Object.freeze(
    matchSource
      .split("+")
      .map((source) => source.trim())
      .filter(Boolean),
  );
}

export function canAuthorizeSpecializedKnowledge(
  matchSource: string,
): boolean {
  return splitTaxonMatchSource(matchSource).some((source) =>
    specializedKnowledgeSourceSet.has(source),
  );
}

export function hasDeterministicAliasMatchSource(
  matchSource: string,
): boolean {
  return splitTaxonMatchSource(matchSource).some((source) =>
    aliasSourceSet.has(source),
  );
}

export function shouldConfirmDeterministicAlias(
  decision: DeterministicMatchDecision,
): boolean {
  const candidate = decision.selectedCandidate;
  if (!candidate) return false;
  const sources = splitTaxonMatchSource(candidate.matchSource);

  return (
    decision.confidence === "high" &&
    decision.shouldUseDeterministicMatch === false &&
    decision.shouldEscalateToAi === false &&
    Boolean(candidate.taxonId) &&
    sources.some((source) => aliasSourceSet.has(source)) &&
    !sources.some((source) => taxonIdentitySourceSet.has(source))
  );
}
