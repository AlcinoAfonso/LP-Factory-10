import type {
  DeterministicMatchDecision,
  TaxonMatchCandidate,
} from "./contracts";

const HIGH_CONFIDENCE_SCORE = 0.92;
const MIN_RELEVANT_SCORE = 0.7;
const CLOSE_CANDIDATE_DELTA = 0.05;
// RPC trgm scores are weighted as 0.50 + similarity * 0.30, so 0.72 is
// already a strong fuzzy match while still rejecting single-token overlaps.
const SAFE_UNIQUE_TRGM_SCORE = 0.72;

const CANONICAL_STRONG_MATCH_SOURCES = new Set([
  "taxon_name_exact",
  "taxon_name_normalized",
  "taxon_slug_normalized",
]);
const ALIAS_CONFIRMATION_SOURCES = new Set(["alias_exact", "alias_normalized"]);

function hasCanonicalStrongMatchSource(matchSource: string): boolean {
  return matchSource
    .split("+")
    .some((source) => CANONICAL_STRONG_MATCH_SOURCES.has(source.trim()));
}

function hasAliasConfirmationSource(matchSource: string): boolean {
  return matchSource
    .split("+")
    .some((source) => ALIAS_CONFIRMATION_SOURCES.has(source.trim()));
}

function hasCloseSecondCandidate(
  best: TaxonMatchCandidate,
  second: TaxonMatchCandidate | undefined
): boolean {
  return second !== undefined && best.score - second.score <= CLOSE_CANDIDATE_DELTA;
}

function isSafeUniqueTrigramMatch(
  best: TaxonMatchCandidate,
  candidates: TaxonMatchCandidate[],
): boolean {
  return (
    candidates.length === 1 &&
    best.score >= SAFE_UNIQUE_TRGM_SCORE &&
    best.matchSource
      .split("+")
      .some((source) => source.trim() === "trgm")
  );
}

export function evaluateDeterministicTaxonMatch(
  candidates: TaxonMatchCandidate[]
): DeterministicMatchDecision {
  if (candidates.length === 0) {
    return {
      confidence: "low",
      selectedCandidate: null,
      shouldUseDeterministicMatch: false,
      shouldEscalateToAi: true,
      aiEscalationMode: "suggest_new_taxon_for_review",
      needsAdminReview: true,
      reason: "no_candidates",
    };
  }

  const [best, second] = [...candidates].sort((a, b) => b.score - a.score);
  const aliasConfirmationSource = hasAliasConfirmationSource(best.matchSource);
  const canonicalStrongMatchSource = hasCanonicalStrongMatchSource(best.matchSource);

  if (best.score < MIN_RELEVANT_SCORE) {
    return {
      confidence: "low",
      selectedCandidate: best,
      shouldUseDeterministicMatch: false,
      shouldEscalateToAi: true,
      aiEscalationMode: "rerank_candidates",
      needsAdminReview: true,
      reason: "low_confidence_insufficient_score",
    };
  }

  if (aliasConfirmationSource && !canonicalStrongMatchSource) {
    return {
      confidence: "high",
      selectedCandidate: best,
      shouldUseDeterministicMatch: false,
      shouldEscalateToAi: false,
      aiEscalationMode: "none",
      needsAdminReview: false,
      reason: "high_confidence_strong_match",
    };
  }

  if (isSafeUniqueTrigramMatch(best, candidates)) {
    return {
      confidence: "high",
      selectedCandidate: best,
      shouldUseDeterministicMatch: true,
      shouldEscalateToAi: false,
      aiEscalationMode: "none",
      needsAdminReview: false,
      reason: "high_confidence_strong_match",
    };
  }

  const closeSecondCandidate = hasCloseSecondCandidate(best, second);

  if (closeSecondCandidate) {
    return {
      confidence: "medium",
      selectedCandidate: best,
      shouldUseDeterministicMatch: false,
      shouldEscalateToAi: true,
      aiEscalationMode: "rerank_candidates",
      needsAdminReview: true,
      reason: "medium_confidence_close_candidates",
    };
  }

  if (best.score >= HIGH_CONFIDENCE_SCORE && canonicalStrongMatchSource) {
    return {
      confidence: "high",
      selectedCandidate: best,
      shouldUseDeterministicMatch: true,
      shouldEscalateToAi: false,
      aiEscalationMode: "none",
      needsAdminReview: false,
      reason: "high_confidence_strong_match",
    };
  }

  if (canonicalStrongMatchSource) {
    return {
      confidence: "medium",
      selectedCandidate: best,
      shouldUseDeterministicMatch: false,
      shouldEscalateToAi: true,
      aiEscalationMode: "rerank_candidates",
      needsAdminReview: true,
      reason: "medium_confidence_below_high_threshold",
    };
  }

  return {
    confidence: "medium",
    selectedCandidate: best,
    shouldUseDeterministicMatch: false,
    shouldEscalateToAi: true,
    aiEscalationMode: "rerank_candidates",
    needsAdminReview: true,
    reason: "medium_confidence_weak_match_source",
  };
}
