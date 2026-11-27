"use server";

import { revalidatePath } from "next/cache";
import { clientOpenAiCostContext, closeOpenAiCostOccurrence } from "../../../../lib/openai-costs";
import { pilotProof, resolveAgentBaseGenerationId, verifiedPilotProof } from "../../../../lib/communication-base/agent-base/generation-proof";
import { createClient } from "../../../../lib/supabase/server";
import { generateAgentBasePilotSection } from "../../../../lib/communication-base/adapters/agentBasePilotAdapter";
import { agentBasePilotOrder, agentBasePilotCatalogState, selectAgentBasePilotInput,
  type AgentBasePilotKey, type AgentBasePilotSection } from "../../../../lib/communication-base/agent-base/pilot";

import { requireCommunicationBaseAccess } from "../../../../lib/communication-base/access";
import { generateCommunicationIntelligence } from "../../../../lib/communication-base/adapters/communicationAiAdapter";
import {
  createCommunicationBase,
  readCommunicationBase,
  readPendingSetupInitialContext,
  saveCommunicationSection,
  saveGeneratedIntelligence,
} from "../../../../lib/communication-base/adapters/communicationBaseAdapter";
import { parseCommunicationFacts, parseReviewedSectionValue, parseSectionValue, withSection, withGeneratedIntelligence } from "../../../../lib/communication-base/policy";
import { parseEditorDraft } from "../../../../lib/communication-base/manual-editor-value";
import { isCommunicationResourcesEnabled, resolveAgentBaseEnvironment, type AgentBaseEnvironment } from "../../../../lib/communication-base/config";
import { readCommunicationDefinitions } from "../../../../lib/communication-base/adapters/communicationCatalogAdapter";
import { getCommunicationSection } from "../../../../lib/communication-base/registry";
import { selectStageTwoInput, type StageTwoDraft, type StageTwoTarget } from "../../../../lib/communication-base/ai-core";
import { isCurrentGenerationNiche, isCurrentGenerationVersion } from "../../../../lib/communication-base/generation-guard";
import { readOfficialNicheContext } from "../../../../lib/onboarding/niche-resolution/adapters/accountOfficialNicheAdapter";
import { isE1011PassageEnabled } from "../../../../lib/onboarding/pending-setup/config";

export type CommunicationActionState = Readonly<{
  status: "idle" | "saved" | "error";
  message: string;
}>;


export type CommunicationStageTwoAiResult =
  | Readonly<{ ok: true; draft: StageTwoDraft; notice?: string }>
  | Readonly<{ ok: false; message: string }>;

const UNAVAILABLE = "Não foi possível salvar agora. Atualize a página e tente novamente.";

export async function startCommunicationBaseAction(
  _previous: CommunicationActionState,
  formData: FormData,
): Promise<CommunicationActionState> {
  const account = readFormString(formData, "account");
  const access = await requireCommunicationBaseAccess(account, true);
  if (!access.ok) return failure(UNAVAILABLE);

  if (isCommunicationResourcesEnabled()) {
    if (formData.get("confirm_base_context") !== "on") return failure("Confirme o nicho ou o entendimento apresentado antes de iniciar a Base.");
    const taxonomy = await readOfficialNicheContext({ accountId: access.value.accountId });
    if (!taxonomy.ok) return failure("Não foi possível conferir o nicho. Atualize a página e tente novamente.");
    if ((taxonomy.niche?.revision ?? "") !== readFormString(formData, "base_niche")) return failure("O nicho mudou. Atualize a página e confirme o contexto atual antes de iniciar a Base.");
  }

  let initialSections: Record<string, unknown> = {};
  const candidate = await readPendingSetupInitialContext(access.value.accountId);
  if (!candidate.ok && (isE1011PassageEnabled() || formData.get("import_pending_setup") === "on")) {
    return failure("Não foi possível consultar a conversa anterior. Atualize a página e tente novamente.");
  }
  if (candidate.ok && candidate.value?.businessName) {
    const named = withSection(initialSections, "business_name", candidate.value.businessName, "pending_setup_confirmed");
    if (!named) return failure("Não foi possível validar o nome público anterior.");
    initialSections = named;
  }
  if (formData.get("import_pending_setup") === "on") {
    if (!candidate.ok || !candidate.value?.businessContext) {
      return failure("Não foi possível confirmar o contexto anterior. Atualize a página ou inicie sem importar.");
    }
    const imported = withSection(initialSections, "business_context", candidate.value.businessContext, "pending_setup_confirmed");
    if (!imported) return failure("Não foi possível validar o contexto anterior.");
    initialSections = imported;
  }

  const result = await createCommunicationBase(access.value.accountId, initialSections);
  if (!result.ok) return failure(errorMessage(result.error));
  revalidatePath(`/a/${access.value.accountSubdomain}/base-comunicacao`);
  return { status: "saved", message: "Base iniciada. Você pode preencher cada seção no seu ritmo." };
}

export async function saveCommunicationSectionAction(
  _previous: CommunicationActionState,
  formData: FormData,
): Promise<CommunicationActionState> {
  const account = readFormString(formData, "account");
  const key = readFormString(formData, "section_key");
  const rawValue = readFormString(formData, "value");
  const version = Number(readFormString(formData, "version"));
  const access = await requireCommunicationBaseAccess(account, true);
  if (!access.ok) return failure(UNAVAILABLE);
  const definitions = await readCommunicationDefinitions();
  if (!definitions.ok) return failure(UNAVAILABLE);
  const section = definitions.value.find(section => section.key === key && section.stage !== 3);
  if (!section || !Number.isSafeInteger(version) || version <= 0) {
    return failure("Dados inválidos. Atualize a página e tente novamente.");
  }
  const freeText = section.stage === 2 && formData.get("free_text") === "true";
  const parseManual = freeText ? parseReviewedSectionValue : parseSectionValue;
  const submittedFormatting = formData.get("text_formatting");
  let formatting: unknown;
  if (submittedFormatting !== null) {
    if (typeof submittedFormatting !== "string") return failure("Revise a formatação do texto.");
    try { formatting = JSON.parse(submittedFormatting); } catch { return failure("Revise a formatação do texto."); }
  }
  const text = submittedFormatting === null ? rawValue : rawValue.replace(/\r\n?/g, "\n");
  const parsed = parseManual(section, parseEditorDraft(section.format, text, isCommunicationResourcesEnabled() && formData.get("structured_value") === "true", freeText));
  let facts: unknown;
  if (isCommunicationResourcesEnabled() && formData.has("facts")) {
    try { facts = JSON.parse(readFormString(formData, "facts")); } catch { return failure("Revise os registros do negócio."); }
    if (section.stage !== 1 || parseCommunicationFacts(facts) === null) return failure("Revise os rótulos, valores e limites dos registros.");
  }
  if (parsed === null) return failure("Revise o conteúdo e respeite os limites indicados.");

  const result = await saveCommunicationSection({
    accountId: access.value.accountId,
    key,
    value: parsed,
    expectedVersion: version,
    definitions: definitions.value,
    facts,
    formatting,
    origin: section.stage === 1 ? "user_confirmed" : "user_reviewed",
  });
  if (!result.ok) return failure(errorMessage(result.error));

  revalidatePath(`/a/${access.value.accountSubdomain}/base-comunicacao`);
  return { status: "saved", message: "Seção salva." };
}


export async function generateCommunicationIntelligenceAction(input: Readonly<{
  account: string;
  target: StageTwoTarget;
  version: number;
  requiresCurrentResearch: boolean;
}>): Promise<CommunicationStageTwoAiResult> {
  if (!input || typeof input.account !== "string" ||
      !Number.isSafeInteger(input.version) || input.version <= 0 ||
      typeof input.requiresCurrentResearch !== "boolean" ||
      !input.target || typeof input.target !== "object" ||
      (input.target.kind !== "section" || getCommunicationSection(input.target.key)?.stage !== 2)) {
    return { ok: false, message: "A solicitação é inválida. Atualize a página e tente novamente." };
  }
  const access = await requireCommunicationBaseAccess(input.account, true);
  if (!access.ok) return { ok: false, message: "A geração não está disponível para este acesso." };
  const taxonomy = await readOfficialNicheContext({ accountId: access.value.accountId });
  if (!taxonomy.ok) return { ok: false, message: "Não foi possível conferir o nicho. Tente novamente." };
  if (!taxonomy.niche?.confirmed) return { ok: false, message: "Defina e confirme um nicho oficial antes de gerar sugestões com IA. A edição manual continua disponível." };
  const base = await readCommunicationBase(access.value.accountId);
  if (!base.ok || !base.value || base.value.version !== input.version) {
    return { ok: false, message: "A Base mudou. Atualize a página antes de gerar sugestões." };
  }
  const selection = selectStageTwoInput(base.value, input.target);
  if (!selection || Object.keys(selection.confirmed).length === 0) {
    return { ok: false, message: selection?.notice
      ? `${selection.notice} Não há outros dados confirmados compatíveis para esta geração.`
      : "Confirme primeiro ao menos um dado da Etapa 1." };
  }
  const result = await generateCommunicationIntelligence({
    accountId: access.value.accountId,
    base: base.value,
    target: input.target,
    requiresCurrentResearch: input.requiresCurrentResearch,
    niche: taxonomy.niche,
  });
  if (!result.ok) {
    return { ok: false, message: result.reason === "configuration_incompatible" ? "A configuração ativa da IA é incompatível com a resposta da OpenAI. Nenhuma configuração alternativa foi usada." : "Não foi possível concluir a geração. Seus textos salvos continuam disponíveis." };
  }
  const latest = await readCommunicationBase(access.value.accountId);
  const latestTaxonomy = await readOfficialNicheContext({ accountId: access.value.accountId });
  if (!latestTaxonomy.ok || !isCurrentGenerationNiche(taxonomy.niche, latestTaxonomy.niche)) {
    return { ok: false, message: "O nicho mudou durante a geração. Confira o nicho atual antes de gerar sugestões novamente." };
  }
  if (!latest.ok || !latest.value || !isCurrentGenerationVersion(input.version, latest.value.version)) {
    return { ok: false, message: "A Base mudou. Atualize a página antes de gerar sugestões." };
  }
  return { ok: true, draft: result.value, notice: selection.notice };
}

function readFormString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function failure(message: string): CommunicationActionState {
  return { status: "error", message };
}

function errorMessage(error: string): string {
  if (error === "conflict") {
    return "A Base mudou em outra edição. Atualize a página antes de salvar novamente.";
  }
  if (error === "invalid") return "Revise o conteúdo e tente novamente.";
  return UNAVAILABLE;
}

export type AgentBasePilotActionResult =
  | Readonly<{ ok: true; section: AgentBasePilotSection; catalogState: string; nicheRevision: string }>
  | Readonly<{ ok: false; message: string; invalidated?: boolean }>;

function closeAgentBaseGenerationCost(occurrenceId: string, accountId: string, environment: AgentBaseEnvironment) {
  return closeOpenAiCostOccurrence({
    occurrenceId, environment, executionOrigin: "runtime", economicContext: clientOpenAiCostContext(accountId),
  });
}

async function closeSupersededAgentBaseGeneration(input: {
  sections: readonly AgentBasePilotSection[];
  accountId: string;
  environment: AgentBaseEnvironment;
  version: number;
  catalogState?: string;
  nicheRevision?: string;
}) {
  const { sections, accountId, environment, version, catalogState, nicheRevision } = input;
  if (!sections.length || typeof catalogState !== "string" || typeof nicheRevision !== "string") return;
  try {
    const occurrenceId = resolveAgentBaseGenerationId(sections);
    if (occurrenceId && sections.every(section => verifiedPilotProof(process.env.OPENAI_API_KEY,
      environment, accountId, version, catalogState, nicheRevision, section))) {
      await closeAgentBaseGenerationCost(occurrenceId, accountId, environment);
    }
  } catch {
    // Unverifiable evidence preserves the existing functional response.
  }
}

async function logAgentBasePilotAccessDenial(phase: "initial" | "revalidation", reason: string): Promise<void> {
  let authState: "authenticated" | "session_missing" | "session_not_found" | "auth_error" = "auth_error";
  try {
    const { data, error } = await (await createClient()).auth.getUser();
    authState = error
      ? error.code === "session_not_found" ? "session_not_found"
        : error.name === "AuthSessionMissingError" ? "session_missing" : "auth_error"
      : data.user ? "authenticated" : "session_missing";
  } catch {
    // O diagnóstico não interfere na recusa original.
  }
  console.warn(JSON.stringify({ event: "agent_base_pilot_access_denied", phase, reason, authState }));
}

export async function runAgentBasePilotAction(input: Readonly<{
  account: string; version: number; previous?: readonly AgentBasePilotSection[];
  catalogState?: string; nicheRevision?: string;
}>): Promise<AgentBasePilotActionResult> {
  const fail = (message: string, invalidated = false) => ({ ok: false as const, message, invalidated });
  const environment = resolveAgentBaseEnvironment();
  if (!environment) return fail("A geração da Categoria 3 não está disponível.");
  if (!input || typeof input.account !== "string" || !Number.isSafeInteger(input.version) || input.version <= 0 ||
      (input.previous !== undefined && !Array.isArray(input.previous))) return fail("Solicitação inválida. Atualize a página.");
  const access = await requireCommunicationBaseAccess(input.account, true);
  if (!access.ok) {
    await logAgentBasePilotAccessDenial("initial", access.error);
    return fail("A geração da Categoria 3 não está disponível para este acesso.");
  }
  const definitions = await readCommunicationDefinitions();
  const order = definitions.ok ? agentBasePilotOrder(definitions.value) : null;
  if (!definitions.ok || !order) return fail("Não foi possível conferir as seções da Categoria 3. A edição manual continua disponível.");
  const previous = input.previous ?? [];
  if (previous.length >= order.length || previous.some((section, index) =>
      !section || section.key !== order[index]?.key ||
      section.basis !== (section.key === "about" ? "confirmed_business_fact" : "strategic_hypothesis") ||
      parseSectionValue(order[index], section.value) === null ||
      !Array.isArray(section.sources) || section.sources.length > 50 ||
      typeof section.researched !== "boolean")) return fail("Sequência do Agente Base inválida. Reinicie a geração.");
  const [base, taxonomy] = await Promise.all([
    readCommunicationBase(access.value.accountId, definitions.value),
    readOfficialNicheContext({ accountId: access.value.accountId }),
  ]);
  if (!base.ok || !base.value || base.value.version !== input.version) {
    if (base.ok && base.value && base.value.version > input.version) {
      await closeSupersededAgentBaseGeneration({ ...input, sections: previous, accountId: access.value.accountId, environment });
    }
    return fail("A Base mudou. Atualize a página antes de gerar a Categoria 3.", true);
  }
  if (!taxonomy.ok || !taxonomy.niche?.confirmed) return fail("Defina e confirme um nicho oficial antes de gerar a Categoria 3.", true);
  const selected = selectAgentBasePilotInput(base.value, definitions.value);
  if (!selected || !Object.keys(selected.confirmed).length) return fail([selected?.notice, "Não há dados confirmados compatíveis para a geração."].filter(Boolean).join(" "));
  if (selected.notice) return fail(selected.notice + " Revise esses dados antes de atualizar toda a Categoria 3.");
  const catalogState = agentBasePilotCatalogState(definitions.value);
  if (previous.length && (input.catalogState !== catalogState || input.nicheRevision !== taxonomy.niche.revision))
    return fail("A Base ou o nicho mudou durante a geração. Atualize a página.", true);
  const generationId = resolveAgentBaseGenerationId(previous);
  if (!generationId)
    return fail("A identidade da geração não pôde ser confirmada. Reinicie a geração.");
  if (previous.some(section => !verifiedPilotProof(process.env.OPENAI_API_KEY, environment, access.value.accountId, input.version,
      catalogState, taxonomy.niche!.revision, section)))
    return fail("Uma etapa da geração não pôde ser autenticada. Nada foi salvo.");
  const target = order[previous.length];
  const result = await generateAgentBasePilotSection({
    base: base.value, niche: taxonomy.niche, definitions: definitions.value,
    key: target.key as AgentBasePilotKey, previous, environment, timeoutMs: 120_000, generationId,
  });
  if (!result.ok) return fail("Não foi possível concluir a geração em " + target.label + ". Nada foi salvo.");
  const [latestAccess, latestBase, latestNiche, latestDefinitions] = await Promise.all([
    requireCommunicationBaseAccess(input.account, true), readCommunicationBase(access.value.accountId, definitions.value),
    readOfficialNicheContext({ accountId: access.value.accountId }), readCommunicationDefinitions(),
  ]);
  if (!latestAccess.ok) await logAgentBasePilotAccessDenial("revalidation", latestAccess.error);
  if (!latestAccess.ok || latestAccess.value.accountId !== access.value.accountId || !latestBase.ok || !latestBase.value ||
      !isCurrentGenerationVersion(input.version, latestBase.value.version) || !latestNiche.ok ||
      !isCurrentGenerationNiche(taxonomy.niche, latestNiche.niche) || !latestDefinitions.ok ||
      agentBasePilotCatalogState(latestDefinitions.value) !== catalogState) {
    if (latestAccess.ok && latestAccess.value.accountId === access.value.accountId &&
        latestBase.ok && latestBase.value && latestBase.value.version > input.version) {
      await closeAgentBaseGenerationCost(generationId, access.value.accountId, environment);
    }
    return fail("A Base, o nicho ou o catálogo mudou durante a geração. Nada foi salvo.", true);
  }
  const section = { ...result.value, generationId };
  const proof = pilotProof(process.env.OPENAI_API_KEY, environment, access.value.accountId, input.version, catalogState, taxonomy.niche.revision, section);
  if (!proof) return fail("Não foi possível validar a geração. Nada foi salvo.");
  return { ok: true, section: { ...section, proof }, catalogState, nicheRevision: taxonomy.niche.revision };
}

export async function saveAgentBasePilotAction(input: Readonly<{
  account: string; version: number; sections: readonly AgentBasePilotSection[];
  catalogState: string; nicheRevision: string;
}>) {
  const fail = (message: string) => ({ ok: false as const, message });
  const environment = resolveAgentBaseEnvironment();
  if (!environment) return fail("A geração da Categoria 3 não está disponível.");
  if (!input || typeof input.account !== "string" || !Number.isSafeInteger(input.version) || input.version <= 0 ||
      !Array.isArray(input.sections)) return fail("Solicitação inválida.");
  const access = await requireCommunicationBaseAccess(input.account, true);
  if (!access.ok) return fail("O acesso à Base mudou. Nada foi salvo.");
  const definitions = await readCommunicationDefinitions();
  const order = definitions.ok ? agentBasePilotOrder(definitions.value) : null;
  if (!definitions.ok || !order || input.catalogState !== agentBasePilotCatalogState(definitions.value)) {
    return fail("O catálogo mudou durante a geração. Nada foi salvo.");
  }
  if (input.sections.length !== order.length || !input.sections.some(section => section.researched) ||
      input.sections.some((section, index) => !section ||
        section.key !== order[index].key ||
        section.basis !== (section.key === "about" ? "confirmed_business_fact" : "strategic_hypothesis"))) {
    return fail("A geração não foi concluída integralmente. Nada foi salvo.");
  }
  const generated = input.sections.map(({ key, value }) => ({ key, value }));
  if (!withGeneratedIntelligence({}, generated, definitions.value)) return fail("Conteúdo inválido. Nada foi salvo.");
  const [base, niche] = await Promise.all([
    readCommunicationBase(access.value.accountId, definitions.value),
    readOfficialNicheContext({ accountId: access.value.accountId }),
  ]);
  if (!base.ok || !base.value || base.value.version !== input.version ||
      !niche.ok || !niche.niche?.confirmed || input.nicheRevision !== niche.niche.revision) {
    if (base.ok && base.value && base.value.version > input.version) {
      await closeSupersededAgentBaseGeneration({ ...input, accountId: access.value.accountId, environment });
    }
    return fail("A Base ou o nicho mudou durante a geração. Nada foi salvo.");
  }
  if (input.sections.some(section => section.generationId !== input.sections[0].generationId || !verifiedPilotProof(process.env.OPENAI_API_KEY, environment, access.value.accountId, input.version,
    input.catalogState, input.nicheRevision, section))) {
    return fail("Uma etapa da geração não pôde ser autenticada. Nada foi salvo.");
  }
  const saved = await saveGeneratedIntelligence({
    accountId: access.value.accountId, expectedVersion: input.version,
    definitions: definitions.value, sections: generated,
    catalogState: input.catalogState, niche: niche.niche,
  });
  const occurrenceId = input.sections[0].generationId;
  if (occurrenceId && (saved.ok || saved.terminalGenerationFailure)) {
    await closeAgentBaseGenerationCost(occurrenceId, access.value.accountId, environment);
  }
  if (!saved.ok) return fail(saved.error === "conflict" ? "A Base foi editada durante a geração. Nada foi salvo." :
    "Não foi possível salvar a Categoria 3. O conteúdo anterior foi preservado.");
  revalidatePath(`/a/${access.value.accountSubdomain}/base-comunicacao`);
  return { ok: true as const };
}
