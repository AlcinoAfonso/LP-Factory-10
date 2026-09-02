import "server-only";

import { requestCommercialActivationOpenAi } from "@/conversion-content/adapters/commercialActivationOpenAiAdapter";
import { evaluateInputCatalogWithOpenAi } from "@/conversion-content/adapters/inputCatalogEvaluationOpenAiAdapter";
import { generateLandingPageDraftCandidate } from "@/lp-builder/landingPageDraftGeneration";
import { generateLandingPageDraftImage } from "@/lp-builder/landingPageDraftImageGeneration";
import type { LandingPageGenerationContextPackage } from "@/lp-builder/generationContextContracts";
import { resolveNicheWithOpenAi } from "@/onboarding/niche-resolution/adapters/openAiResolver";
import type {
  OpenAiOperationalConfigurationReader,
  OpenAiManagedWorkloadEnvironment,
  OpenAiWorkloadEvent,
  ResolvedOpenAiImageWorkload,
  ResolvedOpenAiProductWorkload,
} from "@/openai-workloads";
import {
  runOpenAiCandidateProofCore,
  type OpenAiCandidateProofAttempt as ProofAttempt,
  type OpenAiCandidateProofDependencies,
  type OpenAiCandidateProofMetadata,
} from "./proofCore";
import { parseCommercialProof } from "./commercialProof";
import { proveDynamicMarketResearch } from "./dynamicResearchProof";

export type { OpenAiCandidateProofMetadata } from "./proofCore";

export async function runOpenAiCandidateProof(
  workload: ResolvedOpenAiProductWorkload | ResolvedOpenAiImageWorkload,
  environment: OpenAiManagedWorkloadEnvironment,
  apiKey: string,
  requestId: string,
  dependencies: Partial<OpenAiCandidateProofDependencies> = {},
): Promise<
  | Readonly<{ ok: true; metadata: OpenAiCandidateProofMetadata }>
  | Readonly<{ ok: false; code: "configuration" | "provider" | "contract" }>
> {
  return runOpenAiCandidateProofCore(
    workload,
    environment,
    apiKey,
    requestId,
    {
      niche: dependencies.niche ?? proveNicheResolution,
      commercial: dependencies.commercial ?? proveCommercialActivation,
      landingPageText: dependencies.landingPageText ?? proveLandingPageText,
      inputCatalogEvaluation:
        dependencies.inputCatalogEvaluation ?? proveInputCatalogEvaluation,
      landingPageImage: dependencies.landingPageImage ?? proveLandingPageImage,
      dynamicMarketResearch: dependencies.dynamicMarketResearch ?? proveDynamicMarketResearch,
    },
  );
}

async function proveNicheResolution(
  workload: Extract<ResolvedOpenAiProductWorkload, { id: "niche_resolution" }> | ResolvedOpenAiProductWorkload,
  environment: OpenAiManagedWorkloadEnvironment,
  apiKey: string,
  requestId: string,
): Promise<ProofAttempt> {
  const candidate = {
    taxonId: "10000000-0000-4000-8000-000000000001",
    name: "Consultoria imobiliária",
    slug: "consultoria-imobiliaria",
    level: "niche" as const,
    parentId: null,
    parentName: null,
    matchedAliases: ["consultoria"],
    matchSource: "alias",
    score: 0.72,
  };
  const events: OpenAiWorkloadEvent[] = [];
  const result = await resolveNicheWithOpenAi(
    {
      rawInput: "consultoria imobiliária",
      decision: {
        confidence: "medium",
        selectedCandidate: candidate,
        shouldUseDeterministicMatch: false,
        shouldEscalateToAi: true,
        aiEscalationMode: "rerank_candidates",
        needsAdminReview: false,
        reason: "medium_confidence_below_high_threshold",
      },
      candidates: [candidate],
      apiKey,
    },
    {
      environment,
      workloadResolver: proofResolver(workload, environment),
      emitEvent: (event: OpenAiWorkloadEvent) => events.push(event),
    },
  );
  const event = events.find((item) => item.result === "success");
  return result.ok && event
    ? {
        ok: true,
        providerRequestId: event.responseId,
        latencyMs: event.latencyMs,
      }
    : { ok: false, code: result.ok ? "contract" : "provider" };
}

async function proveCommercialActivation(
  workload: ResolvedOpenAiProductWorkload,
  environment: OpenAiManagedWorkloadEnvironment,
  apiKey: string,
  _requestId: string,
): Promise<ProofAttempt> {
  const events: OpenAiWorkloadEvent[] = [];
  const result = await requestCommercialActivationOpenAi(
    {
      apiKey,
      configuration: workload,
      environment,
      request: {
        store: false,
        tools: [],
        max_output_tokens: 64,
        input: [
          {
            role: "system",
            content: "Retorne apenas o objeto JSON solicitado para validar o transporte técnico.",
          },
          { role: "user", content: "Confirme a prova técnica segura." },
        ],
        text: {
          format: {
            type: "json_schema",
            name: "commercial_activation_operational_proof_v1",
            strict: true,
            schema: {
              type: "object",
              additionalProperties: false,
              properties: { proof: { type: "string", const: "approved" } },
              required: ["proof"],
            },
          },
        },
      },
      parseResponse: parseCommercialProof,
    },
    { emitEvent: (event) => events.push(event) },
  );
  const event = events.find((item) => item.result === "success");
  return result.ok && event
    ? {
        ok: true,
        providerRequestId: result.responseId,
        latencyMs: event.latencyMs,
      }
    : { ok: false, code: result.ok ? "contract" : "provider" };
}

async function proveLandingPageText(
  workload: ResolvedOpenAiProductWorkload,
  environment: OpenAiManagedWorkloadEnvironment,
  apiKey: string,
  requestId: string,
): Promise<ProofAttempt> {
  const result = await generateLandingPageDraftCandidate(proofLandingPageContext, {
    apiKey,
    attemptId: requestId,
    requestId,
    environment,
    workloadResolver: proofResolver(workload, environment),
  });
  return result.ok
    ? {
        ok: true,
        providerRequestId: result.responseId,
        latencyMs: result.latencyMs,
      }
    : { ok: false, code: result.kind === "invalid_candidate" ? "contract" : "provider" };
}

async function proveInputCatalogEvaluation(
  workload: ResolvedOpenAiProductWorkload,
  environment: OpenAiManagedWorkloadEnvironment,
  apiKey: string,
  requestId: string,
): Promise<ProofAttempt> {
  const result = await evaluateInputCatalogWithOpenAi({
    apiKey,
    configuration: workload,
    environment,
    requestId,
    safetyIdentifier: "platform_admin_operational_proof",
    request: {
      mode: "systematic",
      prompt: {
        version: "e20.6.5-input-catalog-evaluation-v1",
        instructions: "Retorne somente o objeto JSON solicitado para a prova técnica segura.",
        input: "Confirme o contrato do transporte com o valor approved.",
      },
      outputSchema: {
        type: "object",
        additionalProperties: false,
        properties: { proof: { type: "string", const: "approved" } },
        required: ["proof"],
      },
    },
  });
  return result.status === "completed" &&
    isRecord(result.output) &&
    result.output.proof === "approved"
    ? { ok: true, providerRequestId: null, latencyMs: null }
    : { ok: false, code: result.status === "completed" ? "contract" : "provider" };
}

async function proveLandingPageImage(
  workload: ResolvedOpenAiImageWorkload,
  environment: OpenAiManagedWorkloadEnvironment,
  apiKey: string,
  requestId: string,
): Promise<ProofAttempt> {
  const result = await generateLandingPageDraftImage(
    {
      mediaBrief: "Ambiente profissional contemporâneo, acolhedor e sem pessoas identificáveis.",
      semanticFacts: { offer: "Consultoria imobiliária" },
    },
    {
      apiKey,
      attemptId: requestId,
      requestId,
      environment,
      workloadResolver: proofResolver(workload, environment),
    },
  );
  return result.ok
    ? {
        ok: true,
        providerRequestId: result.providerRequestId,
        latencyMs: result.latencyMs,
      }
    : { ok: false, code: result.kind === "invalid_response" ? "contract" : "provider" };
}

function proofResolver(
  workload: ResolvedOpenAiProductWorkload | ResolvedOpenAiImageWorkload,
  environment: OpenAiManagedWorkloadEnvironment,
) {
  const readOperationalConfiguration: OpenAiOperationalConfigurationReader =
    async () => workload.apiKind === "responses_text"
      ? {
          ok: true,
          value: {
            environment,
            workload: workload.id,
            apiKind: workload.apiKind,
            model: workload.model,
            reasoningEffort: workload.reasoningEffort,
            revision: "1",
          },
        }
      : {
          ok: true,
          value: {
            environment,
            workload: workload.id,
            apiKind: workload.apiKind,
            model: workload.model,
            quality: workload.quality,
            revision: "1",
          },
        };
  return {
    operationalConfigurationEnabled: "true",
    readOperationalConfiguration,
  } as const;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

const proofLandingPageContext = {
  contractVersion: 4,
  identities: {
    accountId: "10000000-0000-4000-8000-000000000001",
    landingPage: {
      id: "20000000-0000-4000-8000-000000000002",
      status: "draft",
    },
    planKey: "starter",
    servedTaxon: {
      id: "30000000-0000-4000-8000-000000000003",
      slug: "consultoria-imobiliaria",
      name: "Consultoria imobiliária",
      level: "segment",
      isActive: true,
      parentId: null,
    },
    taxonChain: {
      segment: {
        id: "30000000-0000-4000-8000-000000000003",
        slug: "consultoria-imobiliaria",
        name: "Consultoria imobiliária",
        level: "segment",
        isActive: true,
        parentId: null,
      },
    },
    effectiveInputCatalogVersion: 4,
    sharedCatalogVersion: null,
    landingPageCatalogVersion: 4,
    sharedRevision: null,
    landingPageRevision: 1,
    rootVersion: 1,
    endCustomerResearchVersion: 1,
  },
  modelContext: {
    research: {
      taxonSlug: "consultoria-imobiliaria",
      audienceScope: "end_customer",
      researchVersion: 1,
      content: "Pesquisa segura: clientes buscam orientação clara para avaliar imóveis.",
    },
    facts: [
      {
        fieldKey: "primary_service_or_offer",
        purpose: "offer",
        valueType: "string",
        value: "Consultoria imobiliária",
        source: "configuration",
        provenance: [],
      },
      {
        fieldKey: "primary_conversion_channel",
        purpose: "conversion",
        valueType: "enum",
        value: "whatsapp",
        source: "configuration",
        provenance: [],
      },
    ],
    editorialLimits: {
      semanticRoles: [],
      semanticHierarchy: ["h1", "h2", "h3"],
    },
  },
  serverContext: {
    facts: [
      {
        fieldKey: "whatsapp_destination",
        purpose: "conversion_destination",
        valueType: "phone",
        value: "+5521000000000",
        source: "authoritative",
        provenance: [],
      },
    ],
  },
} as const satisfies LandingPageGenerationContextPackage;
