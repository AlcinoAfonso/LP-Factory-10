import type {
  OpenAiConfigurationSource,
  OpenAiReasoningEffort,
  OpenAiWorkloadUsage,
} from "../../../openai-workloads";
import type { LandingPageKnowledgeResolutionValue } from "./contracts";
import {
  LANDING_PAGE_DYNAMIC_RESEARCH_CONTRACT_VERSION,
} from "./dynamic-research-schema";
import {
  LANDING_PAGE_DYNAMIC_RESEARCH_PROMPT_VERSION,
} from "./dynamic-research-prompt";

export const landingPageDynamicResearchStatuses = [
  "material_delta",
  "no_material_delta",
  "insufficient_evidence",
] as const;

export const landingPageDynamicResearchDimensions = [
  "situations_jobs",
  "pains_risks",
  "objections",
  "criteria_tradeoffs",
  "alternatives",
  "trust_proof",
  "language_questions",
  "current_volatile_context",
] as const;

export type LandingPageDynamicResearchDimension =
  (typeof landingPageDynamicResearchDimensions)[number];

export type LandingPageDynamicResearchModelOutput = Readonly<{
  schemaVersion: typeof LANDING_PAGE_DYNAMIC_RESEARCH_CONTRACT_VERSION;
  status: (typeof landingPageDynamicResearchStatuses)[number];
  summary: string;
  supplement: Readonly<{
    findings: readonly Readonly<{
      dimension: LandingPageDynamicResearchDimension;
      insight: string;
      sourceUrls: readonly string[];
    }>[];
  }> | null;
}>;

export type LandingPageDynamicResearchSource = Readonly<{
  url: string;
  title: string | null;
}>;

export type LandingPageDynamicResearchExecution = Readonly<{
  status: "material_delta" | "no_material_delta";
  summary: string;
  supplement: LandingPageDynamicResearchModelOutput["supplement"];
  sources: readonly LandingPageDynamicResearchSource[];
  searchedAt: string;
  workload: "landing_page_dynamic_market_research";
  configurationSource: OpenAiConfigurationSource;
  configurationRevision: string;
  model: string;
  reasoningEffort: OpenAiReasoningEffort;
  promptVersion: typeof LANDING_PAGE_DYNAMIC_RESEARCH_PROMPT_VERSION;
  contractVersion: typeof LANDING_PAGE_DYNAMIC_RESEARCH_CONTRACT_VERSION;
  responseId: string | null;
  providerRequestId: string | null;
  latencyMs: number;
  usage: OpenAiWorkloadUsage;
  webSearchCallCount: 1 | 2;
}>;

export type LandingPageResolvedKnowledgeValue = Readonly<
  Omit<LandingPageKnowledgeResolutionValue, "status"> & {
    status: "specialized_deep" | "base_only" | "base_plus_dynamic";
    dynamicResearch: LandingPageDynamicResearchExecution | null;
  }
>;

export type CompleteLandingPageKnowledgeResult =
  | Readonly<{ ok: true; value: LandingPageResolvedKnowledgeValue }>
  | Readonly<{
      ok: false;
      error: Readonly<{
        code: "DYNAMIC_RESEARCH_REQUIRED" | "DYNAMIC_RESEARCH_UNEXPECTED" | "DYNAMIC_RESEARCH_INVALID";
        message: string;
      }>;
    }>;

export function completeLandingPageKnowledge(
  resolution: LandingPageKnowledgeResolutionValue,
  dynamicResearch: LandingPageDynamicResearchExecution | null,
): CompleteLandingPageKnowledgeResult {
  if (resolution.status === "dynamic_required" && dynamicResearch === null) {
    return failure(
      "DYNAMIC_RESEARCH_REQUIRED",
      "A resolução exige complemento dinâmico comprovado.",
    );
  }
  if (resolution.status !== "dynamic_required" && dynamicResearch !== null) {
    return failure(
      "DYNAMIC_RESEARCH_UNEXPECTED",
      "Complemento dinâmico não é autorizado para esta resolução.",
    );
  }
  if (
    dynamicResearch?.status === "material_delta" &&
    (!dynamicResearch.supplement || dynamicResearch.supplement.findings.length === 0)
  ) {
    return failure("DYNAMIC_RESEARCH_INVALID", "O delta material está vazio.");
  }
  if (
    dynamicResearch?.status === "no_material_delta" &&
    dynamicResearch.supplement !== null
  ) {
    return failure("DYNAMIC_RESEARCH_INVALID", "O resultado sem delta contém suplemento.");
  }

  const status = resolution.status === "dynamic_required"
    ? dynamicResearch?.status === "material_delta"
      ? "base_plus_dynamic"
      : "base_only"
    : resolution.status;
  return Object.freeze({
    ok: true,
    value: deepFreeze({
      ...resolution,
      status,
      dynamicResearch,
    }) as LandingPageResolvedKnowledgeValue,
  });
}

function failure(
  code: "DYNAMIC_RESEARCH_REQUIRED" | "DYNAMIC_RESEARCH_UNEXPECTED" | "DYNAMIC_RESEARCH_INVALID",
  message: string,
): CompleteLandingPageKnowledgeResult {
  return Object.freeze({ ok: false, error: Object.freeze({ code, message }) });
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    for (const nested of Object.values(value)) deepFreeze(nested);
    Object.freeze(value);
  }
  return value;
}
