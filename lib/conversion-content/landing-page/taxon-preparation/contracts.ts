import type { FactualTaxonIdentity, ResolvedFactualCoverage } from "../input-catalog";

export const END_CUSTOMER_RESEARCH_AUDIENCE_SCOPE = "end_customer" as const;
export const INPUT_CATALOG_EVALUATION_SCHEMA_VERSION = 4 as const;
export const inputCatalogEvaluationSourceStrategies = ["e20_5", "web_search_fallback", "web_search_focal"] as const;
export const inputCatalogEvaluationSourceStates = ["e20_5_valid", "not_selected", "feature_disabled"] as const;
export const inputCatalogEvaluationModes = ["systematic", "hypothesis"] as const;
export const inputCatalogEvaluationStatuses = ["sufficient", "candidate_gaps", "inconclusive"] as const;
export const inputCatalogEvaluationCandidateOrigins = ["systematic", "human_hypothesis", "incidental"] as const;
export const inputCatalogEvaluationCandidateConclusions = ["covered", "refine_existing_field", "possible_new_field", "inconclusive"] as const;
export const inputCatalogEvaluationTaxonomicLayers = ["universal", "segment", "niche", "ultra_niche"] as const;

export type EndCustomerResearchTaxonIdentity = Readonly<{ slug: string; isActive: boolean }>;
export type LoadEndCustomerResearchCandidateInput = Readonly<{ taxon: EndCustomerResearchTaxonIdentity; researchVersion: number }>;
export type EndCustomerResearchContent = Readonly<{ taxonSlug: string; audienceScope: typeof END_CUSTOMER_RESEARCH_AUDIENCE_SCOPE; researchVersion: number; relativePath: string; content: string }>;
export type EndCustomerResearchErrorCode = "INVALID_TAXON_SLUG" | "TAXON_INACTIVE" | "INVALID_RESEARCH_VERSION" | "PATH_OUTSIDE_RESEARCH_ROOT" | "FILE_NOT_FOUND" | "READ_FAILED" | "METADATA_INVALID" | "CONTENT_EMPTY";
export type LoadEndCustomerResearchCandidateResult = Readonly<{ ok: true; value: EndCustomerResearchContent }> | Readonly<{ ok: false; error: Readonly<{ code: EndCustomerResearchErrorCode; message: string }> }>;
export type SelectedEndCustomerResearchErrorCode = "FEATURE_DISABLED" | "INVALID_TAXON_ID" | "TAXON_NOT_FOUND" | "TAXON_INACTIVE" | "TAXON_IDENTITY_INVALID" | "SELECTION_ABSENT" | "SELECTED_VERSION_INVALID" | "DATABASE_READ_FAILED" | "FILE_NOT_FOUND" | "FILESYSTEM_READ_FAILED" | "METADATA_INVALID" | "CONTENT_EMPTY";
export type LoadSelectedEndCustomerResearchResult = Readonly<{ ok: true; value: Readonly<{ taxonId: string; taxonSlug: string; taxonName?: string; taxonLevel?: "segment" | "niche" | "ultra_niche"; parentTaxonId?: string | null; selectedResearchVersion: number; selectedResearchValid: true; research: EndCustomerResearchContent }> }> | Readonly<{ ok: false; error: Readonly<{ code: SelectedEndCustomerResearchErrorCode; message: string }> }>;

export type InputCatalogEvaluationMode = (typeof inputCatalogEvaluationModes)[number];
export type InputCatalogEvaluationStatus = (typeof inputCatalogEvaluationStatuses)[number];
export type InputCatalogEvaluationCandidateOrigin = (typeof inputCatalogEvaluationCandidateOrigins)[number];
export type InputCatalogEvaluationCandidateConclusion = (typeof inputCatalogEvaluationCandidateConclusions)[number];
export type InputCatalogEvaluationTaxonomicLayer = (typeof inputCatalogEvaluationTaxonomicLayers)[number];
export type InputCatalogEvaluationSourceStrategy = (typeof inputCatalogEvaluationSourceStrategies)[number];
export type InputCatalogEvaluationSourceState = (typeof inputCatalogEvaluationSourceStates)[number];

export type InputCatalogEvaluationCandidate = Readonly<{
  origin: InputCatalogEvaluationCandidateOrigin; conclusion: InputCatalogEvaluationCandidateConclusion; name: string; shortDescription: string; factualNeed: string;
  relatedFields: readonly string[]; currentCoverage: string; allegedInsufficiency: string | null; evidence: string;
  expectedOperationalSource: string | null; realConsumer: string | null; concreteHarm: string | null;
  suggestedTaxonomyLayer: InputCatalogEvaluationTaxonomicLayer | null; uncertainties: readonly string[]; sourceUrls: readonly string[];
}>;
export type InputCatalogEvaluationOutput = Readonly<{
  schemaVersion: typeof INPUT_CATALOG_EVALUATION_SCHEMA_VERSION; status: InputCatalogEvaluationStatus; mode: InputCatalogEvaluationMode;
  sourceStrategy: InputCatalogEvaluationSourceStrategy; sourceState: InputCatalogEvaluationSourceState; summary: string;
  summarySourceUrls: readonly string[]; candidates: readonly InputCatalogEvaluationCandidate[]; followUpQuestion: string | null;
}>;
export type ParseInputCatalogEvaluationOutputResult = Readonly<{ ok: true; value: InputCatalogEvaluationOutput }> | Readonly<{ ok: false; error: Readonly<{ code: "INVALID_JSON" | "INVALID_SCHEMA" | "INVALID_SEMANTICS"; message: string }> }>;

export type InputCatalogEvaluationContext = Readonly<{
  taxon: FactualTaxonIdentity; coverage: ResolvedFactualCoverage; research: EndCustomerResearchContent | null;
  mode: InputCatalogEvaluationMode; sourceStrategy: InputCatalogEvaluationSourceStrategy; sourceState: InputCatalogEvaluationSourceState;
}>;
export type InputCatalogEvaluationPrompt = Readonly<{ version: "e20.8.7-factual-coverage-evaluation-v3"; instructions: string; input: string }>;
export type InputCatalogEvaluationProviderRequest = Readonly<{ mode: InputCatalogEvaluationMode; sourceStrategy: InputCatalogEvaluationSourceStrategy; deadlineAtMs?: number; timeoutMs?: number; prompt: InputCatalogEvaluationPrompt; outputSchema: Readonly<Record<string, unknown>> }>;
export type InputCatalogEvaluationProviderProvenance = Readonly<{ webSearchCallCount: number; webSources: readonly Readonly<{ title: string | null; url: string }>[] }>;
export type InputCatalogEvaluationProviderResult = Readonly<{ status: "completed"; output: unknown; provenance?: InputCatalogEvaluationProviderProvenance }> | Readonly<{ status: "refusal" | "incomplete" | "timeout" | "failure"; message: string }>;
