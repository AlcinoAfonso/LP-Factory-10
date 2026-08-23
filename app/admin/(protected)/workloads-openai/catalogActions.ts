"use server";

import { revalidatePath } from "next/cache";

import { requirePlatformAdmin } from "@/lib/access/guards";
import {
  addOpenAiModelCatalogModel,
  setOpenAiModelCatalogModelAvailability,
  setOpenAiModelCatalogParameterAvailability,
} from "@/openai-workloads/adapters/modelCatalogAdapter";
import { openAiImageQualities, openAiReasoningEfforts } from "@/openai-workloads";

const ADMIN_PATH = "/admin/workloads-openai";

export type OpenAiModelCatalogActionState = Readonly<{
  status: "idle" | "success" | "error";
  code: string | null;
  message: string;
}>;

export async function addOpenAiModelCatalogModelAction(
  _previous: OpenAiModelCatalogActionState,
  formData: FormData,
): Promise<OpenAiModelCatalogActionState> {
  const actor = await authorizedActor();
  if (!actor.ok) return actor.state;
  const apiKind = parseApiKind(formData.get("apiKind"));
  const model = parseTechnicalValue(formData.get("model"), 128);
  const rawValues = formData.getAll("parameterValues");
  const parameterValues = apiKind
    ? parseParameterValues(apiKind, rawValues)
    : null;
  if (!apiKind || !model || !parameterValues?.length) {
    return validationFailure("Informe modalidade, modelo e ao menos um parâmetro suportado.");
  }

  const { error } = await addOpenAiModelCatalogModel({
    apiKind,
    model,
    parameterValues,
    actorUserId: actor.actorUserId,
  });
  if (error) return databaseFailure(error);
  revalidatePath(ADMIN_PATH);
  return success("Modelo adicionado indisponível; revise os parâmetros antes de liberá-lo.");
}

export async function setOpenAiModelCatalogModelAvailabilityAction(
  _previous: OpenAiModelCatalogActionState,
  formData: FormData,
): Promise<OpenAiModelCatalogActionState> {
  const actor = await authorizedActor();
  if (!actor.ok) return actor.state;
  const apiKind = parseApiKind(formData.get("apiKind"));
  const model = parseTechnicalValue(formData.get("model"), 128);
  const availableForSelection = parseBoolean(formData.get("availableForSelection"));
  const expectedVersion = parsePositiveInteger(formData.get("expectedVersion"));
  if (!apiKind || !model || availableForSelection === null || expectedVersion === null) {
    return validationFailure("Modelo ou versão do catálogo inválida.");
  }

  const { error } = await setOpenAiModelCatalogModelAvailability({
    apiKind,
    model,
    availableForSelection,
    expectedVersion,
    actorUserId: actor.actorUserId,
  });
  if (error) return databaseFailure(error);
  revalidatePath(ADMIN_PATH);
  return success(
    availableForSelection
      ? "Modelo liberado para novas candidatas."
      : "Modelo indisponibilizado para novas candidatas e provas.",
  );
}

export async function setOpenAiModelCatalogParameterAvailabilityAction(
  _previous: OpenAiModelCatalogActionState,
  formData: FormData,
): Promise<OpenAiModelCatalogActionState> {
  const actor = await authorizedActor();
  if (!actor.ok) return actor.state;
  const apiKind = parseApiKind(formData.get("apiKind"));
  const model = parseTechnicalValue(formData.get("model"), 128);
  const parameterKind = formData.get("parameterKind");
  const parameterValue = parseTechnicalValue(formData.get("parameterValue"), 32);
  const availableForSelection = parseBoolean(formData.get("availableForSelection"));
  const expectedVersion = parsePositiveInteger(formData.get("expectedVersion"));
  const validParameter = apiKind && parameterValue &&
    ((apiKind === "responses_text" &&
      parameterKind === "reasoning_effort" &&
      openAiReasoningEfforts.includes(parameterValue as never)) ||
      (apiKind === "image_generation" &&
        parameterKind === "quality" &&
        openAiImageQualities.includes(parameterValue as never)));
  if (
    !apiKind ||
    !model ||
    !validParameter ||
    availableForSelection === null ||
    expectedVersion === null
  ) {
    return validationFailure("Parâmetro ou versão do catálogo inválida.");
  }

  const { error } = await setOpenAiModelCatalogParameterAvailability({
    apiKind,
    model,
    parameterKind: parameterKind as "reasoning_effort" | "quality",
    parameterValue,
    availableForSelection,
    expectedVersion,
    actorUserId: actor.actorUserId,
  });
  if (error) return databaseFailure(error);
  revalidatePath(ADMIN_PATH);
  return success(
    availableForSelection
      ? "Parâmetro liberado para novas candidatas."
      : "Parâmetro indisponibilizado para novas candidatas e provas.",
  );
}

async function authorizedActor(): Promise<
  | Readonly<{ ok: true; actorUserId: string }>
  | Readonly<{ ok: false; state: OpenAiModelCatalogActionState }>
> {
  const gate = await requirePlatformAdmin();
  return gate.allowed
    ? { ok: true, actorUserId: gate.actorUserId }
    : { ok: false, state: failure("unauthorized", "Acesso administrativo não autorizado.") };
}

function parseApiKind(value: FormDataEntryValue | null) {
  return value === "responses_text" || value === "image_generation" ? value : null;
}

function parseParameterValues(
  apiKind: "responses_text" | "image_generation",
  values: readonly FormDataEntryValue[],
) {
  const allowed = apiKind === "responses_text"
    ? openAiReasoningEfforts
    : openAiImageQualities;
  const normalized = [...new Set(values.filter((value): value is string =>
    typeof value === "string" && allowed.includes(value as never),
  ))];
  return normalized.length === values.length ? normalized : null;
}

function parseTechnicalValue(value: FormDataEntryValue | null, maximum: number) {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  return normalized.length > 0 && normalized.length <= maximum &&
    /^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(normalized)
    ? normalized
    : null;
}

function parseBoolean(value: FormDataEntryValue | null) {
  return value === "true" ? true : value === "false" ? false : null;
}

function parsePositiveInteger(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || !/^[1-9]\d*$/.test(value)) return null;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) ? parsed : null;
}

function databaseFailure(error: Readonly<{ code?: string; message?: string }>) {
  const message = error.message ?? "";
  if (error.code === "40001" || message.includes("stale_version")) {
    return failure("concurrency", "O catálogo mudou em outra sessão. Recarregue e tente novamente.");
  }
  if (error.code === "23505" || message.includes("already_exists")) {
    return validationFailure("Este modelo já existe no catálogo.");
  }
  if (error.code === "22023" || error.code === "22004") {
    return validationFailure("A alteração foi rejeitada pelo contrato do catálogo.");
  }
  return failure("operation_failed", "A alteração do catálogo não pôde ser concluída.");
}

function success(message: string): OpenAiModelCatalogActionState {
  return { status: "success", code: null, message };
}

function validationFailure(message: string) {
  return failure("validation", message);
}

function failure(code: string, message: string): OpenAiModelCatalogActionState {
  return { status: "error", code, message };
}
