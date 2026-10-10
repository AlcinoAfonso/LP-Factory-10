import "server-only";

import { requestCommercialActivationOpenAi } from "@/conversion-content/adapters/commercialActivationOpenAiAdapter";
import { resolveNicheWithOpenAi } from "@/onboarding/niche-resolution/adapters/openAiResolver";
import type {
  OpenAiOperationalConfigurationReader,
  OpenAiManagedWorkloadEnvironment,
  OpenAiWorkloadEvent,
  ResolvedOpenAiProductWorkload,
} from "@/openai-workloads";
import {
  runOpenAiCandidateProofCore,
  isResearchedCommunicationStageTwoProof,
  type OpenAiCandidateProofAttempt as ProofAttempt,
  type OpenAiCandidateProofDependencies,
  type OpenAiCandidateProofMetadata,
} from "./proofCore";
import { parseCommercialProof } from "./commercialProof";
import { lpFactoryOpenAiCostContext } from "@/openai-costs";
import { assistCommunicationSection, generateCommunicationIntelligence } from "@/communication-base/adapters/communicationAiAdapter";
import type { CommunicationBase } from "@/communication-base/contracts";

import { requestAttendance } from "@/onboarding/pending-setup/attendance-provider";
import { attendanceProposal, attendanceSummary, type AttendanceContext } from "@/onboarding/pending-setup/attendance-core";

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
      attendance: dependencies.attendance ?? proveAttendance,
      commercial: dependencies.commercial ?? proveCommercialActivation,
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

async function proveAttendance(
  workload: ResolvedOpenAiProductWorkload,
  environment: OpenAiManagedWorkloadEnvironment,
  apiKey: string,
  _requestId: string,
): Promise<ProofAttempt> {
  const accountId = "10000000-0000-4000-8000-000000000001";
  const segmentId = "10000000-0000-4000-8000-000000000002";
  const nicheId = "10000000-0000-4000-8000-000000000003";
  const catalog: AttendanceContext["catalog"] = [
    { id: segmentId, name: "Serviços", level: "segment", parentId: null, active: true, aliases: [] },
    { id: nicheId, name: "Manutenção de jardins", level: "niche", parentId: segmentId, active: true, aliases: ["Jardinagem"] },
  ];
  // Disposable conversations exercise the useful completion, without any business writes.
  const runConversation = async (identified: boolean): Promise<ProofAttempt> => {
    let context: AttendanceContext = {
      preferredName: "Ana", summary: null, catalog, currentPrimaryTaxonId: null,
      recent: [{ role: "user", content: identified
        ? "Faço manutenção de jardins para condomínios. Quero explicar meu serviço e tenho dúvidas sobre comunicação. Essa categoria já pode ser proposta para eu confirmar, mas ainda preciso de orientação. Por falar em outra coisa, sou flamenguista; isso não tem relação com meu serviço."
        : "Sou fisioterapeuta de adultos. Quero comunicar minha atuação. Esse catálogo não tem minha categoria; podemos confirmar meu entendimento e continuar a orientação." }],
      marketContext: identified ? [{ taxonId: nicheId, researchId: segmentId, version: 1, updatedAt: "2024-06-01",
        items: [{ key: "limitation", text: "Repertório histórico: pode ser útil esclarecer frequência de manutenção, conforme o negócio.", notes: "Hipótese a validar, sem promessa de resultado." }] }] : [],
    };
    let latencyMs = 0;
    let providerRequestId: string | null = null;
    for (let turn = 0; turn < 3; turn++) {
      const result = await requestAttendance({ accountId, context, configurationOverride: workload, environment, apiKey,
        financialContext: lpFactoryOpenAiCostContext, executionOrigin: "administrative_proof" });
      if (!result.ok) return { ok: false, code: "provider" };
      const output = result.output;
      latencyMs += result.latencyMs ?? 0;
      providerRequestId = result.responseId;
      if (turn === 0) {
        if (output.action !== (identified ? "existing" : "pending") ||
          (identified && output.existingTaxonId !== nicheId) || !output.businessUnderstanding || output.readyToComplete) return { ok: false, code: "contract" };
        const proposedSummary = JSON.parse(attendanceSummary(output, null, null));
        if (proposedSummary.confirmedUnderstanding !== null || !proposedSummary.contextualUnderstanding ||
          (identified && /flamenguista/i.test(proposedSummary.contextualUnderstanding))) return { ok: false, code: "contract" };
        context = { ...context, confirmedProposal: attendanceProposal(output, catalog),
          displayedUnderstanding: output.businessUnderstanding,
          summary: attendanceSummary(output, null, null, context.summary),
          recent: [...context.recent, { role: "assistant", content: output.reply },
            { role: "user", content: "Sim, confirmo o entendimento exibido e a categoria quando identificada. Ainda quero entender como apresentar meu serviço." }] };
      } else if (turn === 1) {
        if (output.action !== "confirm" || output.businessUnderstanding !== context.displayedUnderstanding) return { ok: false, code: "contract" };
        const acceptedSummary = JSON.parse(attendanceSummary(output, identified ? "Manutenção de jardins" : null,
          context.confirmedProposal, context.summary));
        if (acceptedSummary.confirmedUnderstanding !== context.displayedUnderstanding) return { ok: false, code: "contract" };
        context = { ...context, confirmedProposal: null,
          currentPrimaryTaxonId: identified ? nicheId : null,
          confirmedOperationalUnderstanding: !identified,
          summary: attendanceSummary(output, identified ? "Manutenção de jardins" : null, context.confirmedProposal ?? null, context.summary),
          recent: [...context.recent, { role: "assistant", content: output.reply },
            { role: "user", content: "Minha necessidade é apresentar claramente meu serviço ao público informado. A orientação de organizar o conhecimento e apoiar a comunicação já me ajudou. Entendi que serviços, preços e prazos específicos precisam de confirmação. Não tenho mais dúvidas; quero seguir à etapa comercial." }] };
      } else if (output.action !== "ask" || !output.readyToComplete || !output.sufficientUnderstanding) {
        return { ok: false, code: "contract" };
      }
    }
    return { ok: true, providerRequestId, latencyMs };
  };
  const runSemanticClosure = async (): Promise<ProofAttempt> => {
    const understanding = "Manutenção de jardins para condomínios; quer comunicar o diferencial do serviço.";
    let context: AttendanceContext = { preferredName: "Ana", catalog, currentPrimaryTaxonId: nicheId,
      displayedUnderstanding: understanding,
      summary: JSON.stringify({ contextualUnderstanding: understanding, confirmedUnderstanding: understanding,
        classification: "Manutenção de jardins", suggestions: [] }),
      recent: [{ role: "user", content: "Atendo condomínios com manutenção de jardins e quero explicar meu diferencial." },
        { role: "assistant", content: "Qual diferencial do seu serviço você gostaria de comunicar?" }] };
    let latencyMs = 0;
    let providerRequestId: string | null = null;
    const turn = async (content: string, closed: boolean) => {
      context = { ...context, recent: [...context.recent, { role: "user", content }] };
      const result = await requestAttendance({ accountId, context, configurationOverride: workload, environment, apiKey,
        financialContext: lpFactoryOpenAiCostContext, executionOrigin: "administrative_proof" });
      if (!result.ok) return false;
      const output = result.output;
      latencyMs += result.latencyMs ?? 0; providerRequestId = result.responseId;
      if (Boolean(output.closureReason) !== closed || output.readyToComplete || output.action !== "ask") return false;
      const summary = attendanceSummary(output, "Manutenção de jardins", null, context.summary);
      const memory = JSON.parse(summary);
      if (memory.confirmedUnderstanding !== understanding || (closed && memory.pendingReason !== output.closureReason)
        || /flamengo|flamenguista|futebol/i.test(memory.contextualUnderstanding ?? "")) return false;
      context = { ...context, summary, recent: [...context.recent, { role: "assistant", content: output.reply }] };
      return true;
    };
    if (!await turn("Uma curiosidade rápida: você acompanha futebol? Sou flamenguista. Já voltamos ao meu negócio.", false)
      || !await turn("Não quero voltar ao negócio nem falar de comunicação. Só quero continuar falando de futebol.", true)
      || !await turn("Vamos retomar o negócio. Quero entender como explicar a manutenção preventiva para condomínios que hoje só contratam reparos. Ainda preciso dessa orientação.", false))
      return { ok: false, code: "contract" };
    context = { ...context, recent: [
      { role: "user", content: "Qual o preço e prazo exatos?" },
      { role: "assistant", content: "Não há preço ou prazo específico confirmado neste atendimento." },
      { role: "user", content: "Mas qual o preço e prazo exatos? Não quero fornecer outras informações." },
      { role: "assistant", content: "Essas condições precisam de confirmação competente; não posso inventá-las. Já esclarecemos esse limite." },
    ] };
    if (!await turn("Continuo exigindo a mesma resposta de preço e prazo exatos. Não aceito esclarecimentos, orientação ou próximo passo; vou repetir isso.", true))
      return { ok: false, code: "contract" };
    return { ok: true, providerRequestId, latencyMs };
  };
  const results = await Promise.all([runConversation(true), runConversation(false), runSemanticClosure()]);
  if (!results[0].ok) return results[0];
  if (!results[1].ok) return results[1];
  if (!results[2].ok) return results[2];
  return { ok: true, providerRequestId: results[1].providerRequestId,
    latencyMs: Math.max(...results.map(result => result.ok ? result.latencyMs ?? 0 : 0)) };
}
