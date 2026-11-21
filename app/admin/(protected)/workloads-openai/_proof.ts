import "server-only";

import { requestCommercialActivationOpenAi } from "@/conversion-content/adapters/commercialActivationOpenAiAdapter";
import { resolveNicheWithOpenAi } from "@/onboarding/niche-resolution/adapters/openAiResolver";
import type {
  OpenAiManagedWorkloadEnvironment,
  OpenAiWorkloadEvent,
  ResolvedOpenAiProductWorkload,
} from "@/openai-workloads";
import {
  runOpenAiCandidateProofCore,
  proofResolver,
  isResearchedCommunicationStageTwoProof,
  type OpenAiCandidateProofAttempt as ProofAttempt,
  type OpenAiCandidateProofDependencies,
  type OpenAiCandidateProofMetadata,
} from "./proofCore";
import { parseCommercialProof } from "./commercialProof";
import { closeOpenAiCostOccurrence, lpFactoryOpenAiCostContext } from "@/openai-costs";
import { generateCommunicationIntelligence } from "@/communication-base/adapters/communicationAiAdapter";
import type { CommunicationBase } from "@/communication-base/contracts";

import { prepareNicheTurn, type NicheContext } from "@/onboarding/niche-agent";
import { displayedOffer } from "@/onboarding/niche-agent/dialogue";
import { requestOpenAiResponses } from "@/openai-responses/openAiResponsesAdapter";

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
      attendance: dependencies.attendance ?? proveNicheAgent,
      commercial: dependencies.commercial ?? proveCommercialActivation,
      communicationStageOne:
        async () => ({ ok: false, code: "configuration" }),
      communicationStageTwo:
        dependencies.communicationStageTwo ?? proveCommunicationStageTwo,
    },
  );
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
        format: "text", value: "Ofereço manutenção de jardins para condomínios em Recife.", origin: "user_confirmed",
      },
    },
    createdAt: "2026-09-27T00:00:00.000Z",
    updatedAt: "2026-09-27T00:00:00.000Z",
  };
  const result = await generateCommunicationIntelligence({
    accountId,
    base,
    target: { kind: "section", key: "market_insights" },
    requiresCurrentResearch: true,
    niche: { taxonId: "10000000-0000-4000-8000-000000000002", name: "Jardinagem", confirmed: true, revision: "proof" },
    environment,
    apiKey,
    configurationOverride: workload,
    financialContext: lpFactoryOpenAiCostContext,
    executionOrigin: "administrative_proof",
  });
  return result.ok && isResearchedCommunicationStageTwoProof(result.value)
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
      closeOccurrenceOnCompletion: true,
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


async function proveNicheAgent(
  workload: ResolvedOpenAiProductWorkload,
  environment: OpenAiManagedWorkloadEnvironment,
  apiKey: string,
): Promise<ProofAttempt> {
  const run = (context: NicheContext, occurrenceId: string) => {
    const prepared = prepareNicheTurn(context, null);
    return requestOpenAiResponses({
      ...prepared, apiKey, environment, configuration: workload, expectedWorkload: "pending_setup_conversation", occurrenceId,
      request: { ...prepared.request, max_output_tokens: 12_000 }, timeoutMs: 120_000,
      financialContext: lpFactoryOpenAiCostContext, executionOrigin: "administrative_proof",
      baselineReference: "d15e_conversational_niche",
    });
  };
  let providerRequestId: string | null = null;
  let latencyMs = 0;
  for (const pendingSetup of [true, false]) {
    const occurrenceId = crypto.randomUUID();
    try {
      const context: NicheContext = {
        history: [], summary: null, displayed: null,
        businessContext: "Jardins do Vale oferece manutenção de jardins para condomínios residenciais.",
        officialNiche: pendingSetup ? null : "Jardinagem",
        message: "Mantemos jardins de condomínios residenciais. Pode propor um nicho que descreva isso?",
        ...(pendingSetup ? { pendingSetup: { preferredName: "Ana", publicName: "Jardins do Vale", publicNameRequired: true } } : {}),
      };
      const offer = await run(context, occurrenceId);
      if (!offer.ok) return { ok: false, code: "provider" };
      const { reply, offer: proposed, synthesis, summary } = offer.value;
      if (!proposed?.niche || !synthesis.offer || synthesis.accept || summary ||
        !/jardi/i.test(proposed.niche) || !/condom[ií]ni/i.test(proposed.niche)) return { ok: false, code: "contract" };
      const assistant = { id: crypto.randomUUID(), role: "assistant" as const, content: reply };
      const history = [{ id: crypto.randomUUID(), role: "user" as const, content: context.message }, assistant];
      const displayed = displayedOffer({ ...synthesis.offer, messageId: assistant.id }, history, proposed);
      if (!displayed) return { ok: false, code: "contract" };
      const confirmation = await run({ ...context, message: "Sim.", history, displayed }, occurrenceId);
      if (!confirmation.ok) return { ok: false, code: "provider" };
      if (confirmation.value.synthesis.accept !== displayed.id || !confirmation.value.summary)
        return { ok: false, code: "contract" };
      providerRequestId = confirmation.responseId;
      latencyMs += (offer.latencyMs ?? 0) + (confirmation.latencyMs ?? 0);
    } finally {
      await closeOpenAiCostOccurrence({ occurrenceId, environment, executionOrigin: "administrative_proof",
        economicContext: lpFactoryOpenAiCostContext });
    }
  }
  return { ok: true, providerRequestId, latencyMs };
}
