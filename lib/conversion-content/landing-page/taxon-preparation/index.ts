export type {
  EndCustomerResearchContent,
  EndCustomerResearchErrorCode,
  EndCustomerResearchTaxonIdentity,
  FactualReviewKind,
  FactualReviewCatalogChangeDecision,
  FactualReviewHumanDecision,
  NormalizedFactualReviewHumanDecision,
  FactualReviewAcceptedCandidate,
  FactualReviewDecisionLayer,
  FactualReviewOwnCandidate,
  FactualReviewRecommendationSelection,
  FactualReviewSession,
  FactualReviewStatus,
  FactualReviewTaxonBaseline,
  FactualReviewTaxonChainSnapshot,
  InheritedInputCatalogCoverage,
  LoadSelectedEndCustomerResearchResult,
  LoadEndCustomerResearchCandidateInput,
  LoadEndCustomerResearchCandidateResult,
  SelectedEndCustomerResearchErrorCode,
  DeriveTaxonPreparationForVersionInput,
  DeriveEffectiveTaxonPreparationInput,
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
  ResolveInheritedInputCatalogCoverageInput,
  ResolveInheritedInputCatalogCoverageResult,
  NormalizeFactualReviewCatalogChangeDecisionResult,
} from "./contracts";
export type {
  InputCatalogEvaluationAdministrativeDecision,
  InputCatalogEvaluationAdministrativeDecisionResult,
} from "./input-catalog-evaluation-decision";
export {
  END_CUSTOMER_RESEARCH_AUDIENCE_SCOPE,
  INPUT_CATALOG_EVALUATION_SCHEMA_VERSION,
  factualReviewKinds,
  factualReviewDecisionLayers,
  factualReviewStatuses,
  inputCatalogEvaluationCandidateConclusions,
  inputCatalogEvaluationCandidateOrigins,
  inputCatalogEvaluationModes,
  inputCatalogEvaluationStatuses,
  inputCatalogEvaluationTaxonomicLayers,
} from "./contracts";
export {
  deriveFactualReviewKind,
  isGenericTaxonActivation,
  normalizeFactualReviewCatalogChangeDecision,
  resolveInheritedInputCatalogCoverage,
} from "./factual-review";
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
  deriveEffectiveTaxonPreparation,
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
  fingerprintInputCatalogEvaluationContextIdentity,
  revalidateInputCatalogEvaluationContext,
  sameInputCatalogEvaluationContextIdentity,
  type BuildInputCatalogEvaluationContextInput,
  type BuildInputCatalogEvaluationContextOptions,
  type BuildInputCatalogEvaluationPromptInput,
} from "./input-catalog-evaluation";
export { executeInputCatalogEvaluationAdministrativeDecision } from "./input-catalog-evaluation-decision";
export { buildInputCatalogEvaluationGapHandoff } from "./input-catalog-evaluation-gap-handoff";
export type { InputCatalogEvaluationDecisionTokenPayload } from "./input-catalog-evaluation-decision-token";
export {
  createInputCatalogEvaluationDecisionToken,
  fingerprintInputCatalogEvaluationOutput,
  readInputCatalogEvaluationDecisionToken,
} from "./input-catalog-evaluation-decision-token";
