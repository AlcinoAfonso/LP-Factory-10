export type {
  EndCustomerResearchContent,
  EndCustomerResearchErrorCode,
  EndCustomerResearchTaxonIdentity,
  LoadSelectedEndCustomerResearchResult,
  LoadEndCustomerResearchCandidateInput,
  LoadEndCustomerResearchCandidateResult,
  SelectedEndCustomerResearchErrorCode,
  DeriveTaxonPreparationForVersionInput,
  TaxonPreparationErrorCode,
  TaxonPreparationResult,
  BuildInputCatalogEvaluationContextResult,
  CoordinateInputCatalogEvaluationResult,
  InputCatalogEvaluationCandidate,
  InputCatalogEvaluationCandidateConclusion,
  InputCatalogEvaluationCandidateOrigin,
  InputCatalogEvaluationContext,
  InputCatalogEvaluationContextErrorCode,
  InputCatalogEvaluationContextIdentity,
  InputCatalogEvaluationExecutionRequest,
  InputCatalogEvaluationFeedback,
  InputCatalogEvaluationMode,
  InputCatalogEvaluationOutput,
  InputCatalogEvaluationPorts,
  InputCatalogEvaluationPrompt,
  InputCatalogEvaluationProviderRequest,
  InputCatalogEvaluationProviderResult,
  InputCatalogEvaluationReconstructionInput,
  InputCatalogEvaluationStatus,
  InputCatalogEvaluationTaxonChainSnapshot,
  InputCatalogEvaluationTaxonomicLayer,
  ParseInputCatalogEvaluationOutputResult,
  RevalidateInputCatalogEvaluationContextResult,
} from "./contracts";
export {
  END_CUSTOMER_RESEARCH_AUDIENCE_SCOPE,
  INPUT_CATALOG_EVALUATION_SCHEMA_VERSION,
  inputCatalogEvaluationCandidateConclusions,
  inputCatalogEvaluationCandidateOrigins,
  inputCatalogEvaluationModes,
  inputCatalogEvaluationStatuses,
  inputCatalogEvaluationTaxonomicLayers,
} from "./contracts";
export { loadEndCustomerResearchCandidate } from "./research";

export function isEndCustomerResearchSelectionEnabled(): boolean {
  return process.env.E20_5_SELECTED_RESEARCH_ENABLED === "true";
}

export function isInputCatalogReviewEnabled(): boolean {
  return process.env.E20_6_INPUT_CATALOG_REVIEW_ENABLED === "true";
}

export { buildInputCatalogReviewHandoff, resolveInputCatalogReview } from "./input-catalog-review";
export {
  classifyRequiredInputCatalogVersion,
  deriveTaxonPreparationForVersion,
} from "./preparation";
export {
  inputCatalogEvaluationCandidateSchema,
  inputCatalogEvaluationOutputJsonSchema,
  inputCatalogEvaluationOutputSchema,
  parseInputCatalogEvaluationOutput,
} from "./input-catalog-evaluation-schema";
export {
  INPUT_CATALOG_EVALUATION_PROMPT_VERSION,
  buildInputCatalogEvaluationContext,
  buildInputCatalogEvaluationPrompt,
  coordinateInputCatalogEvaluation,
  revalidateInputCatalogEvaluationContext,
  sameInputCatalogEvaluationContextIdentity,
  type BuildInputCatalogEvaluationContextInput,
  type BuildInputCatalogEvaluationContextOptions,
  type BuildInputCatalogEvaluationPromptInput,
} from "./input-catalog-evaluation";
