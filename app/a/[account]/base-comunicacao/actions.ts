"use server";

import { revalidatePath } from "next/cache";

import { requireCommunicationBaseAccess } from "../../../../lib/communication-base/access";
import {
  createCommunicationBase,
  readPendingSetupBusinessContext,
  saveCommunicationSection,
} from "../../../../lib/communication-base/adapters/communicationBaseAdapter";
import { parseSectionValue, withSection } from "../../../../lib/communication-base/policy";
import { getCommunicationSection } from "../../../../lib/communication-base/registry";
import type { CommunicationSectionValue } from "../../../../lib/communication-base/contracts";

export type CommunicationActionState = Readonly<{
  status: "idle" | "saved" | "error";
  message: string;
}>;

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

function parseEditorValue(
  format: "text" | "items" | "faq",
  raw: string,
): CommunicationSectionValue {
  if (format === "text") return raw;
  if (format === "items") return raw.split(/\r?\n/);
  return raw.split(/\r?\n/).filter((line) => line.trim()).map((line) => {
    const separator = line.indexOf("|");
    return separator < 0
      ? { question: line.trim(), answer: "" }
      : { question: line.slice(0, separator).trim(), answer: line.slice(separator + 1).trim() };
  });
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