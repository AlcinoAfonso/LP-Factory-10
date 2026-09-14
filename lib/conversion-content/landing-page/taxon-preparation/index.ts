export * from "./contracts";
export { loadEndCustomerResearchCandidate } from "./research";
export { inputCatalogEvaluationCandidateSchema, inputCatalogEvaluationOutputJsonSchema, inputCatalogEvaluationOutputSchema, parseInputCatalogEvaluationOutput } from "./input-catalog-evaluation-schema";
export { INPUT_CATALOG_EVALUATION_PROMPT_VERSION, buildInputCatalogEvaluationContext, buildInputCatalogEvaluationPrompt, validateInputCatalogEvaluationBinding } from "./input-catalog-evaluation";
export function isEndCustomerResearchSelectionEnabled(): boolean { return process.env.E20_5_SELECTED_RESEARCH_ENABLED === "true"; }
