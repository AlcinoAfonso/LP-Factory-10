"use server";

import { revalidatePath } from "next/cache";
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
} from "../../../../lib/communication-base/adapters/communicationBaseAdapter";
import { parseCommunicationFacts, parseSectionValue, withSection } from "../../../../lib/communication-base/policy";
import { parseEditorDraft } from "../../../../lib/communication-base/manual-editor-value";
import { isCommunicationResourcesEnabled } from "../../../../lib/communication-base/config";
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
  const parsed = parseSectionValue(section, parseEditorDraft(section.format, rawValue, isCommunicationResourcesEnabled() && formData.get("structured_value") === "true"));
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
      (input.target.kind !== "general" &&
        (input.target.kind !== "section" || getCommunicationSection(input.target.key)?.stage !== 2))) {
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
  | Readonly<{ ok: true; sections: readonly AgentBasePilotSection[]; notice: string }>
  | Readonly<{ ok: false; message: string; invalidated?: boolean }>;

export async function runAgentBasePilotAction(input: Readonly<{ account: string; version: number }>): Promise<AgentBasePilotActionResult> {
  const fail = (message: string, invalidated = false) => ({ ok: false as const, message, invalidated });
  if (process.env.VERCEL_ENV !== "preview" || !isCommunicationResourcesEnabled()) return fail("O piloto está disponível somente no Preview.");
  if (!input || typeof input.account !== "string" || !Number.isSafeInteger(input.version) || input.version <= 0) return fail("Solicitação inválida. Atualize a página.");
  const access = await requireCommunicationBaseAccess(input.account, true);
  if (!access.ok) return fail("O piloto não está disponível para este acesso.");
  const definitions = await readCommunicationDefinitions();
  const order = definitions.ok ? agentBasePilotOrder(definitions.value) : null;
  if (!definitions.ok || !order) return fail("Não foi possível conferir as seções do piloto. A edição manual continua disponível.");
  const [base, taxonomy] = await Promise.all([
    readCommunicationBase(access.value.accountId, definitions.value),
    readOfficialNicheContext({ accountId: access.value.accountId }),
  ]);
  if (!base.ok || !base.value || base.value.version !== input.version) return fail("A Base mudou. Atualize a página antes de executar o piloto.", true);
  if (!taxonomy.ok || !taxonomy.niche?.confirmed) return fail("Defina e confirme um nicho oficial antes de executar o piloto.", true);
  const selected = selectAgentBasePilotInput(base.value, definitions.value);
  if (!selected || !Object.keys(selected.confirmed).length) return fail([selected?.notice, "Não há dados confirmados compatíveis para o piloto."].filter(Boolean).join(" "));
  const catalogState = agentBasePilotCatalogState(definitions.value);
  const sections: AgentBasePilotSection[] = [];
  // Reserva tempo para leituras/revalidação dentro dos 300 s documentados da plataforma.
  const deadline = Date.now() + 270_000;
  for (const definition of order) {
    const remaining = deadline - Date.now();
    if (remaining <= 0) return fail("O piloto excedeu o tempo disponível. Nenhum conteúdo foi salvo.");
    const result = await generateAgentBasePilotSection({
      base: base.value, niche: taxonomy.niche, definitions: definitions.value,
      key: definition.key as AgentBasePilotKey, previous: sections, timeoutMs: Math.min(120_000, remaining),
    });
    if (!result.ok) return fail("Não foi possível concluir o piloto em " + definition.label + ". Seus conteúdos salvos continuam disponíveis.");
    const [latestAccess, latestBase, latestNiche, latestDefinitions] = await Promise.all([
      requireCommunicationBaseAccess(input.account, true), readCommunicationBase(access.value.accountId, definitions.value),
      readOfficialNicheContext({ accountId: access.value.accountId }), readCommunicationDefinitions(),
    ]);
    if (!latestAccess.ok || latestAccess.value.accountId !== access.value.accountId || !latestBase.ok || !latestBase.value ||
        !isCurrentGenerationVersion(input.version, latestBase.value.version) || !latestNiche.ok ||
        !isCurrentGenerationNiche(taxonomy.niche, latestNiche.niche) || !latestDefinitions.ok ||
        agentBasePilotCatalogState(latestDefinitions.value) !== catalogState) {
      return fail("A Base, o nicho ou o acesso às seções mudou durante o piloto. Os resultados foram descartados. Atualize a página.", true);
    }
    sections.push(result.value);
  }
  if (!sections.some(section => section.researched)) return fail("O piloto não registrou pesquisa Web nesta sequência. Nenhum conteúdo foi salvo.");
  return { ok: true, sections, notice: selected.notice };
}
