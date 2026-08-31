import { buildDynamicLandingPageMarketRequest } from "@/conversion-content/adapters/dynamicMarketResearchOpenAiAdapter";
import { requestOpenAiResponses } from "@/conversion-content/adapters/openAiResponsesAdapter";
import type { LandingPageKnowledgeResolutionValue } from "@/conversion-content/landing-page/knowledge-resolution";
import type { OpenAiManagedWorkloadEnvironment, ResolvedOpenAiProductWorkload } from "@/openai-workloads";
import type { OpenAiCandidateProofAttempt } from "./proofCore";

/** Admin lifecycle canary: synthetic data, no persistence, no runtime revision override. */
export async function proveDynamicMarketResearch(
  configuration: ResolvedOpenAiProductWorkload,
  environment: OpenAiManagedWorkloadEnvironment,
  apiKey: string,
  requestId: string,
  dependencies: Parameters<typeof requestOpenAiResponses>[1] = {},
): Promise<OpenAiCandidateProofAttempt> {
  const prepared = buildDynamicLandingPageMarketRequest({
    configuration, environment, apiKey, requestId,
    resolution: proofResolution,
    safetyIdentifier: "e20_7_admin_operational_canary",
  });
  if (!prepared.ok) return { ok: false, code: "configuration" };
  const result = await requestOpenAiResponses(prepared.value, dependencies);
  if (!result.ok) return { ok: false, code: result.kind === "invalid_response" ? "contract" : "provider" };
  return {
    ok: true,
    providerRequestId: result.providerRequestId,
    latencyMs: result.latencyMs,
  };
}

const proofResolution: LandingPageKnowledgeResolutionValue = {
  status: "dynamic_required",
  mode: "single",
  offeringInvalidated: false,
  servedTaxon: {
    id: "00000000-0000-4000-8000-000000000001",
    name: "Corretor de imóveis",
    slug: "corretor-imoveis",
    level: "niche",
    parentId: "00000000-0000-4000-8000-000000000002",
    isActive: true,
  },
  effectiveInputCatalogVersion: 6,
  researchSource: {
    taxonId: "00000000-0000-4000-8000-000000000001",
    taxonSlug: "corretor-imoveis",
    selectedResearchVersion: 1,
    reviewedInputCatalogVersion: 6,
    effectiveInputCatalogVersion: 6,
    research: {
      taxonSlug: "corretor-imoveis",
      audienceScope: "end_customer",
      researchVersion: 1,
      relativePath: "synthetic-operational-canary",
      content: "Pesquisa-base sintética para prova de transporte: compradores de imóveis buscam clareza sobre critérios de avaliação, custos e riscos antes de decidir. Compare esse contexto geral com fontes atuais, sem afirmar fatos de uma empresa ou cliente.",
    },
  },
  matchProvenance: [],
  fallbackReason: "single_no_match",
  dynamicTarget: { mode: "single", offerings: ["Avaliação de imóveis residenciais"] },
};
