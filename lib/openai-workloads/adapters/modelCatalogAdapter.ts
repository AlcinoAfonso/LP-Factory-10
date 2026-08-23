import "server-only";

import { createServiceClient } from "../../supabase/service";
import {
  openAiImageQualities,
  openAiReasoningEfforts,
  type OpenAiImageQuality,
  type OpenAiManagedWorkloadEnvironment,
  type OpenAiModelCatalogReadResult,
  type OpenAiReasoningEffort,
  type OpenAiWorkloadId,
} from "../contracts";
import {
  readCompleteOrderedPages,
  translateOpenAiModelCatalogRows,
} from "./modelCatalogAdapterCore";

export async function readOpenAiModelCatalog(): Promise<OpenAiModelCatalogReadResult> {
  try {
    const supabase = createServiceClient();
    const [models, parameters] = await Promise.all([
      readCompleteOrderedPages(async (from, to) =>
        supabase
          .from("openai_model_catalog_models")
          .select(
            "modality,model,available_for_selection,catalog_version,updated_by,created_at,updated_at",
          )
          .order("modality", { ascending: true })
          .order("model", { ascending: true })
          .range(from, to),
      ),
      readCompleteOrderedPages(async (from, to) =>
        supabase
          .from("openai_model_catalog_parameters")
          .select(
            "modality,model,parameter_kind,parameter_value,available_for_selection,catalog_version,updated_by,created_at,updated_at",
          )
          .order("modality", { ascending: true })
          .order("model", { ascending: true })
          .order("parameter_kind", { ascending: true })
          .order("parameter_value", { ascending: true })
          .range(from, to),
      ),
    ]);
    return translateOpenAiModelCatalogRows(models, parameters);
  } catch {
    return {
      ok: false,
      error: { code: "READ_FAILED", message: "OpenAI model catalog read failed" },
    };
  }
}

export async function checkOpenAiModelCatalogConfigurationAvailable(input: Readonly<{
  environment: OpenAiManagedWorkloadEnvironment;
  workload: Exclude<OpenAiWorkloadId, "supabase_inspect">;
  expectedVersion: number;
}>): Promise<Readonly<{
  ok: true;
  value: Readonly<{
    configurationVersion: number;
    apiKind: "responses_text" | "image_generation";
    model: string;
    reasoningEffort: OpenAiReasoningEffort | null;
    quality: OpenAiImageQuality | null;
  }>;
}> | Readonly<{ ok: false }>> {
  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase.rpc(
      "check_openai_model_catalog_configuration_available_v1",
      {
        p_environment: input.environment,
        p_workload: input.workload,
        p_expected_configuration_version: input.expectedVersion,
      },
    );
    if (error || !Array.isArray(data) || data.length !== 1 || !isRecord(data[0])) {
      return { ok: false };
    }
    const row = data[0];
    const configurationVersion = positiveInteger(row.configuration_version);
    const apiKind = row.candidate_modality;
    const model = technicalValue(row.candidate_model, 128);
    const kind = row.candidate_parameter_kind;
    const value = technicalValue(row.candidate_parameter_value, 32);
    if (
      configurationVersion === null ||
      configurationVersion !== input.expectedVersion ||
      !model ||
      !value ||
      (apiKind !== "responses_text" && apiKind !== "image_generation") ||
      (apiKind === "responses_text" &&
        (kind !== "reasoning_effort" ||
          !openAiReasoningEfforts.includes(value as OpenAiReasoningEffort))) ||
      (apiKind === "image_generation" &&
        (kind !== "quality" || !openAiImageQualities.includes(value as OpenAiImageQuality)))
    ) {
      return { ok: false };
    }
    return {
      ok: true,
      value: {
        configurationVersion,
        apiKind,
        model,
        reasoningEffort: apiKind === "responses_text" ? value as OpenAiReasoningEffort : null,
        quality: apiKind === "image_generation" ? value as OpenAiImageQuality : null,
      },
    };
  } catch {
    return { ok: false };
  }
}

export async function addOpenAiModelCatalogModel(input: Readonly<{
  apiKind: "responses_text" | "image_generation";
  model: string;
  parameterValues: readonly string[];
  actorUserId: string;
}>) {
  const supabase = createServiceClient();
  return supabase.rpc("add_openai_model_catalog_model_v1", {
    p_modality: input.apiKind,
    p_model: input.model,
    p_parameter_kind:
      input.apiKind === "responses_text" ? "reasoning_effort" : "quality",
    p_parameter_values: input.parameterValues,
    p_actor_user_id: input.actorUserId,
  });
}

export async function setOpenAiModelCatalogModelAvailability(input: Readonly<{
  apiKind: "responses_text" | "image_generation";
  model: string;
  availableForSelection: boolean;
  expectedVersion: number;
  actorUserId: string;
}>) {
  const supabase = createServiceClient();
  return supabase.rpc("set_openai_model_catalog_model_availability_v1", {
    p_modality: input.apiKind,
    p_model: input.model,
    p_available_for_selection: input.availableForSelection,
    p_expected_version: input.expectedVersion,
    p_actor_user_id: input.actorUserId,
  });
}

export async function setOpenAiModelCatalogParameterAvailability(input: Readonly<{
  apiKind: "responses_text" | "image_generation";
  model: string;
  parameterKind: "reasoning_effort" | "quality";
  parameterValue: string;
  availableForSelection: boolean;
  expectedVersion: number;
  actorUserId: string;
}>) {
  const supabase = createServiceClient();
  return supabase.rpc("set_openai_model_catalog_parameter_availability_v1", {
    p_modality: input.apiKind,
    p_model: input.model,
    p_parameter_kind: input.parameterKind,
    p_parameter_value: input.parameterValue,
    p_available_for_selection: input.availableForSelection,
    p_expected_version: input.expectedVersion,
    p_actor_user_id: input.actorUserId,
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function positiveInteger(value: unknown) {
  return typeof value === "number" && Number.isSafeInteger(value) && value > 0
    ? value
    : null;
}

function technicalValue(value: unknown, maximum: number) {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  return normalized.length > 0 && normalized.length <= maximum &&
    /^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(normalized)
    ? normalized
    : null;
}
