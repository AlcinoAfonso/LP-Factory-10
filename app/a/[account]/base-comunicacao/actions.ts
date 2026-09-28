"use server";

import { revalidatePath } from "next/cache";

import { requireCommunicationBaseAccess } from "../../../../lib/communication-base/access";
import { assistCommunicationSection, generateCommunicationIntelligence } from "../../../../lib/communication-base/adapters/communicationAiAdapter";
import {
  createCommunicationBase,
  readCommunicationBase,
  readPendingSetupBusinessContext,
  saveCommunicationSection,
} from "../../../../lib/communication-base/adapters/communicationBaseAdapter";
import { parseSectionValue, withSection } from "../../../../lib/communication-base/policy";
import { parseEditorValue } from "../../../../lib/communication-base/editor-value";
import { getCommunicationSection } from "../../../../lib/communication-base/registry";
import { hasConfirmedStageOneInput, type StageTwoDraft, type StageTwoTarget } from "../../../../lib/communication-base/ai-core";

export type CommunicationActionState = Readonly<{
  status: "idle" | "saved" | "error";
  message: string;
}>;

export type CommunicationStageOneAiResult =
  | Readonly<{ ok: true; suggestion: string; missingQuestion: string }>
  | Readonly<{ ok: false; message: string }>;

export type CommunicationStageTwoAiResult =
  | Readonly<{ ok: true; draft: StageTwoDraft }>
  | Readonly<{ ok: false; message: string }>;

const UNAVAILABLE = "Não foi possível salvar agora. Atualize a página e tente novamente.";

export async function startCommunicationBaseAction(
  _previous: CommunicationActionState,
  formData: FormData,
): Promise<CommunicationActionState> {
  const account = readFormString(formData, "account");
  const access = await requireCommunicationBaseAccess(account, true);
  if (!access.ok) return failure(UNAVAILABLE);

  let initialSections: Record<string, unknown> = {};
  if (formData.get("import_pending_setup") === "on") {
    const candidate = await readPendingSetupBusinessContext(access.value.accountId);
    if (!candidate.ok || !candidate.value) {
      return failure("Não foi possível confirmar o contexto anterior. Atualize a página ou inicie sem importar.");
    }
    const imported = withSection({}, "business_context", candidate.value, "pending_setup_confirmed");
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
  const section = getCommunicationSection(key);
  if (!section || !Number.isSafeInteger(version) || version <= 0) {
    return failure("Dados inválidos. Atualize a página e tente novamente.");
  }
  const parsed = parseSectionValue(section, parseEditorValue(section.format, rawValue));
  if (parsed === null) return failure("Revise o conteúdo e respeite os limites indicados.");

  const access = await requireCommunicationBaseAccess(account, true);
  if (!access.ok) return failure(UNAVAILABLE);
  const result = await saveCommunicationSection({
    accountId: access.value.accountId,
    key,
    value: parsed,
    expectedVersion: version,
    origin: section.stage === 1 ? "user_confirmed" : "user_reviewed",
  });
  if (!result.ok) return failure(errorMessage(result.error));

  revalidatePath(`/a/${access.value.accountSubdomain}/base-comunicacao`);
  return { status: "saved", message: "Seção salva." };
}

export async function assistCommunicationSectionAction(input: Readonly<{
  account: string;
  key: string;
  userText: string;
  version: number;
}>): Promise<CommunicationStageOneAiResult> {
  const section = input && typeof input.key === "string" ? getCommunicationSection(input.key) : null;
  if (!section || section.stage !== 1 || typeof input.account !== "string" ||
      !Number.isSafeInteger(input.version) || input.version <= 0 ||
      typeof input.userText !== "string" || !input.userText.trim() || input.userText.length > 10_000 ||
      parseSectionValue(section, parseEditorValue(section.format, input.userText)) === null) {
    return { ok: false, message: "Preencha esta seção com seus dados reais antes de pedir ajuda à IA." };
  }
  const access = await requireCommunicationBaseAccess(input.account, true);
  if (!access.ok) return { ok: false, message: "A assistência não está disponível para este acesso." };
  const base = await readCommunicationBase(access.value.accountId);
  if (!base.ok || !base.value || base.value.version !== input.version) {
    return { ok: false, message: "A Base mudou. Atualize a página antes de pedir ajuda à IA." };
  }
  const result = await assistCommunicationSection({
    accountId: access.value.accountId,
    key: input.key,
    userText: input.userText,
  });
  return result.ok
    ? { ok: true, suggestion: result.value.suggestion, missingQuestion: result.value.missingQuestion }
    : { ok: false, message: "A assistência está indisponível agora. Você pode continuar a edição manual." };
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
  const base = await readCommunicationBase(access.value.accountId);
  if (!base.ok || !base.value || base.value.version !== input.version) {
    return { ok: false, message: "A Base mudou. Atualize a página antes de gerar sugestões." };
  }
  if (!hasConfirmedStageOneInput(base.value, input.target)) {
    return { ok: false, message: "Confirme primeiro ao menos um dado da Etapa 1." };
  }
  const result = await generateCommunicationIntelligence({
    accountId: access.value.accountId,
    base: base.value,
    target: input.target,
    requiresCurrentResearch: input.requiresCurrentResearch,
  });
  return result.ok
    ? { ok: true, draft: result.value }
    : { ok: false, message: "Não foi possível concluir a geração. Seus textos salvos continuam disponíveis." };
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
