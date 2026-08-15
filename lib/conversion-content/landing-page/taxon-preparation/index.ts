export type {
  EndCustomerResearchContent,
  EndCustomerResearchErrorCode,
  EndCustomerResearchTaxonIdentity,
  LoadSelectedEndCustomerResearchResult,
  LoadEndCustomerResearchCandidateInput,
  LoadEndCustomerResearchCandidateResult,
  SelectedEndCustomerResearchErrorCode,
} from "./contracts";
export { END_CUSTOMER_RESEARCH_AUDIENCE_SCOPE } from "./contracts";
export { loadEndCustomerResearchCandidate } from "./research";

export function isEndCustomerResearchSelectionEnabled(): boolean {
  return process.env.E20_5_SELECTED_RESEARCH_ENABLED === "true";
}

export function isInputCatalogReviewEnabled(): boolean {
  return process.env.E20_6_INPUT_CATALOG_REVIEW_ENABLED === "true";
}

export { buildInputCatalogReviewHandoff, resolveInputCatalogReview } from "./input-catalog-review";
