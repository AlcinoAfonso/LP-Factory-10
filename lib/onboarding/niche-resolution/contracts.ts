export type TaxonLevel = "segment" | "niche" | "ultra_niche";

export type TaxonMatchCandidate = {
  taxonId: string;
  name: string;
  slug: string;
  level: TaxonLevel;
  parentId: string | null;
  parentName: string | null;
  matchedAliases: string[];
  matchSource: string;
  score: number;
};

export type DeterministicMatchConfidence = "high" | "medium" | "low";

export type AiEscalationMode =
  | "none"
  | "rerank_candidates"
  | "infer_existing_segment"
  | "suggest_alias_for_review"
  | "suggest_new_taxon_for_review";

export type DeterministicMatchReason =
  | "no_candidates"
  | "high_confidence_strong_match"
  | "medium_confidence_close_candidates"
  | "medium_confidence_below_high_threshold"
  | "medium_confidence_weak_match_source"
  | "low_confidence_insufficient_score";

export type DeterministicMatchDecision = {
  confidence: DeterministicMatchConfidence;
  selectedCandidate: TaxonMatchCandidate | null;
  shouldUseDeterministicMatch: boolean;
  shouldEscalateToAi: boolean;
  aiEscalationMode: AiEscalationMode;
  needsAdminReview: boolean;
  reason: DeterministicMatchReason;
};

export type AccountNicheResolutionStatus =
  | "deterministic_high_confidence"
  | "review_required"
  | "unclassified";

export type UpsertAccountNicheResolutionInput = {
  accountId: string;
  rawInput: string;
  selectedTaxonId: string | null;
  confidence: DeterministicMatchConfidence;
  shouldUseDeterministicMatch: boolean;
  shouldEscalateToAi: boolean;
  aiEscalationMode: AiEscalationMode;
  needsAdminReview: boolean;
  reason: DeterministicMatchReason;
  resolutionStatus: AccountNicheResolutionStatus;
  matchSource: string | null;
  score: number | null;
};
