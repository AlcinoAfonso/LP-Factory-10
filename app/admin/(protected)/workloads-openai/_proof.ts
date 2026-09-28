import "server-only";

import { requestCommercialActivationOpenAi } from "@/conversion-content/adapters/commercialActivationOpenAiAdapter";
import { evaluateInputCatalogWithOpenAi } from "@/conversion-content/adapters/inputCatalogEvaluationOpenAiAdapter";
import { resolveNicheWithOpenAi } from "@/onboarding/niche-resolution/adapters/openAiResolver";
import type {
  OpenAiOperationalConfigurationReader,
  OpenAiManagedWorkloadEnvironment,
  OpenAiWorkloadEvent,
  ResolvedOpenAiProductWorkload,
} from "@/openai-workloads";
import {
  runOpenAiCandidateProofCore,
  type OpenAiCandidateProofAttempt as ProofAttempt,
  type OpenAiCandidateProofDependencies,
  type OpenAiCandidateProofMetadata,
} from "./proofCore";
import { parseCommercialProof } from "./commercialProof";
import { lpFactoryOpenAiCostContext } from "@/openai-costs";
import { assistCommunicationSection, generateCommunicationIntelligence } from "@/communication-base/adapters/communicationAiAdapter";
import type { CommunicationBase } from "@/communication-base/contracts";

export type { OpenAiCandidateProofMetadata } from "./proofCore";

export async function runOpenAiCandidateProof(
  workload: ResolvedOpenAiProductWorkload,
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
      inputCatalogEvaluation:
        dependencies.inputCatalogEvaluation ?? proveInputCatalogEvaluation,
      communicationStageOne:
        dependencies.communicationStageOne ?? proveCommunicationStageOne,
      communicationStageTwo:
        dependencies.communicationStageTwo ?? proveCommunicationStageTwo,
    },
  );
}

async function proveCommunicationStageOne(
  workload: ResolvedOpenAiProductWorkload,
  environment: OpenAiManagedWorkloadEnvironment,
  apiKey: string,
  _requestId: string,
): Promise<ProofAttempt> {
  const result = await assistCommunicationSection({
    accountId: "10000000-0000-4000-8000-000000000001",
    key: "business_context",
    userText: "Ofereço manutenção de jardins para condomínios.",
    environment,
    apiKey,
    configurationOverride: workload,
    financialContext: lpFactoryOpenAiCostContext,
    executionOrigin: "administrative_proof",
  });
  return result.ok && (result.value.suggestion || result.value.missingQuestion)
    ? { ok: true, providerRequestId: result.responseId, latencyMs: result.latencyMs }
    : { ok: false, code: result.ok ? "contract" : "provider" };
}

async function proveCommunicationStageTwo(
  workload: ResolvedOpenAiProductWorkload,
  environment: OpenAiManagedWorkloadEnvironment,
  apiKey: string,
  _requestId: string,
): Promise<ProofAttempt> {
  const accountId = "10000000-0000-4000-8000-000000000001";
  const base: CommunicationBase = {
    accountId,
    version: 1,
    sections: {
      business_context: {
        format: "text", value: "Ofereço manutenção de jardins para condomínios.", origin: "user_confirmed",
      },
    },
    createdAt: "2026-09-27T00:00:00.000Z",
    updatedAt: "2026-09-27T00:00:00.000Z",
  };
  const result = await generateCommunicationIntelligence({
    accountId,
    base,
    target: { kind: "section", key: "about" },
    requiresCurrentResearch: false,
    environment,
    apiKey,
    configurationOverride: workload,
    financialContext: lpFactoryOpenAiCostContext,
    executionOrigin: "administrative_proof",
  });
  return result.ok && result.value.suggestions.length === 1
    ? { ok: true, providerRequestId: result.responseId, latencyMs: result.latencyMs }
    : { ok: false, code: result.ok ? "contract" : "provider" };
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
      financialContext: lpFactoryOpenAiCostContext,
      executionOrigin: "administrative_proof",
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
      executionOrigin: "administrative_proof",
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
    executionOrigin: "administrative_proof",
    request: {
      mode: "systematic",
      sourceStrategy: "e20_5",
      prompt: {
        version: "e20.8.7-factual-coverage-evaluation-v3",
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

function proofResolver(
  workload: ResolvedOpenAiProductWorkload,
  environment: OpenAiManagedWorkloadEnvironment,
) {
  const readOperationalConfiguration: OpenAiOperationalConfigurationReader =
    async () => ({
      ok: true,
      value: {
        environment,
        workload: workload.id,
        apiKind: workload.apiKind,
        model: workload.model,
        reasoningEffort: workload.reasoningEffort,
        revision: "1",
      },
    });
  return {
    operationalConfigurationEnabled: "true",
    readOperationalConfiguration,
  } as const;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
