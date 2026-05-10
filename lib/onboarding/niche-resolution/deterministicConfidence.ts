import type {
  DeterministicMatchDecision,
  TaxonMatchCandidate,
} from "./contracts";

const HIGH_CONFIDENCE_SCORE = 0.92;
const MIN_RELEVANT_SCORE = 0.7;
const CLOSE_CANDIDATE_DELTA = 0.05;

const STRONG_MATCH_SOURCES = new Set([
  "alias_exact",
  "alias_normalized",
  "taxon_name_exact",
  "taxon_name_normalized",
  "taxon_slug_normalized",
]);

function hasStrongMatchSource(matchSource: string): boolean {
  return matchSource
    .split("+")
    .some((source) => STRONG_MATCH_SOURCES.has(source.trim()));
}

function hasCloseSecondCandidate(
  best: TaxonMatchCandidate,
  second: TaxonMatchCandidate | undefined
): boolean {
  return second !== undefined && best.score - second.score <= CLOSE_CANDIDATE_DELTA;
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

  const strongMatchSource = hasStrongMatchSource(best.matchSource);

  if (best.score >= HIGH_CONFIDENCE_SCORE && strongMatchSource) {
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

  if (strongMatchSource) {
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
