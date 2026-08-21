"use server";

import { revalidatePath } from "next/cache";

import { requirePlatformAdmin } from "@/lib/access/guards";
import {
  openAiImageQualities,
  openAiReasoningEfforts,
  resolveOpenAiImageWorkload,
  resolveOpenAiProductWorkload,
  type OpenAiImageQuality,
  type OpenAiManagedWorkloadEnvironment,
  type OpenAiProductWorkloadId,
  type OpenAiReasoningEffort,
  type OpenAiWorkloadId,
  type ResolvedOpenAiImageWorkload,
  type ResolvedOpenAiProductWorkload,
} from "@/openai-workloads";
import { createServiceClient } from "@/lib/supabase/service";
import { runOpenAiCandidateProof } from "./_proof";

const ADMIN_PATH = "/admin/workloads-openai";

const productWorkloads = [
  "niche_resolution",
  "commercial_activation_draft_generation",
  "landing_page_draft_generation",
] as const;

export type OpenAiOperationalActionState = Readonly<{
  status: "idle" | "success" | "error";
  code: string | null;
  message: string;
  configurationVersion: number | null;
}>;

type UnitInput = Readonly<{
  environment: OpenAiManagedWorkloadEnvironment;
  workload: Exclude<OpenAiWorkloadId, "supabase_inspect">;
  expectedVersion: number;
}>;

export async function saveOpenAiConfigurationCandidateAction(
  _previous: OpenAiOperationalActionState,
  formData: FormData,
): Promise<OpenAiOperationalActionState> {
  const authorized = await authorizedUnit(formData);
  if (!authorized.ok) return authorized.state;

  const candidate = await parseCandidate(formData, authorized.unit);
  if (!candidate.ok) return candidate.state;

  const supabase = createServiceClient();
  const { data, error } = await supabase.rpc(
    "save_openai_workload_configuration_candidate_v1",
    {
      p_environment: authorized.unit.environment,
      p_workload: authorized.unit.workload,
      p_model: candidate.model,
      p_reasoning_effort: candidate.reasoningEffort,
      p_quality: candidate.quality,
      p_actor_user_id: authorized.actorUserId,
      p_expected_version: authorized.unit.expectedVersion,
    },
  );

  if (error) return databaseFailure(error);
  revalidatePath(ADMIN_PATH);
  return success("Candidata salva. Ela ainda não altera o runtime.", data);
}

export async function discardOpenAiConfigurationCandidateAction(
  _previous: OpenAiOperationalActionState,
  formData: FormData,
): Promise<OpenAiOperationalActionState> {
  const authorized = await authorizedUnit(formData);
  if (!authorized.ok) return authorized.state;

  const supabase = createServiceClient();
  const { data, error } = await supabase.rpc(
    "discard_openai_workload_configuration_candidate_v1",
    {
      p_environment: authorized.unit.environment,
      p_workload: authorized.unit.workload,
      p_actor_user_id: authorized.actorUserId,
      p_expected_version: authorized.unit.expectedVersion,
    },
  );

  if (error) return databaseFailure(error);
  revalidatePath(ADMIN_PATH);
  return success("Candidata descartada sem alterar a configuração ativa.", data);
}

export async function proveAndPromoteOpenAiConfigurationCandidateAction(
  _previous: OpenAiOperationalActionState,
  formData: FormData,
): Promise<OpenAiOperationalActionState> {
  const authorized = await authorizedUnit(formData);
  if (!authorized.ok) return authorized.state;

  const supabase = createServiceClient();
  const candidateRead = await supabase
    .from("openai_workload_operational_configurations")
    .select(
      "environment,workload,configuration_version,candidate_model,candidate_reasoning_effort,candidate_quality",
    )
    .eq("environment", authorized.unit.environment)
    .eq("workload", authorized.unit.workload)
    .limit(2);
  if (candidateRead.error) {
    return failure("read", "A candidata não pôde ser lida para a prova.");
  }
  if (!Array.isArray(candidateRead.data) || candidateRead.data.length !== 1) {
    return failure("read", "A unidade operacional está ausente ou duplicada.");
  }

  const row = candidateRead.data[0] as Record<string, unknown>;
  if (row.configuration_version !== authorized.unit.expectedVersion) {
    return failure(
      "concurrency",
      "A configuração mudou em outra sessão. Recarregue antes de provar.",
    );
  }
  const candidateForm = candidateFormData(row);
  if (!candidateForm) {
    return failure("lifecycle", "Não existe candidata apta para prova.");
  }
  const candidate = await parseCandidate(candidateForm, authorized.unit);
  if (!candidate.ok) return candidate.state;

  const requestId = crypto.randomUUID();
  const proof = await runOpenAiCandidateProof(
    candidate.configuration,
    authorized.unit.environment,
    process.env.OPENAI_API_KEY ?? "",
    requestId,
  );
  if (!proof.ok) {
    return failure(
      "proof",
      proof.code === "configuration"
        ? "A prova não pôde iniciar por configuração server-side inválida."
        : "A prova operacional falhou; a candidata permaneceu sem efeito no runtime.",
    );
  }

  const { data, error } = await supabase.rpc(
    "promote_openai_workload_configuration_candidate_v1",
    {
      p_environment: authorized.unit.environment,
      p_workload: authorized.unit.workload,
      p_proof_metadata: proof.metadata,
      p_actor_user_id: authorized.actorUserId,
      p_expected_version: authorized.unit.expectedVersion,
    },
  );
  if (error) return databaseFailure(error);
  revalidatePath(ADMIN_PATH);
  const result = Array.isArray(data) && data.length === 1
    ? (data[0] as Record<string, unknown>)
    : null;
  return success(
    "Prova aprovada. A revisão validada aguarda ativação humana.",
    result?.configuration_version,
  );
}

export async function activateOpenAiConfigurationRevisionAction(
  _previous: OpenAiOperationalActionState,
  formData: FormData,
): Promise<OpenAiOperationalActionState> {
  const authorized = await authorizedUnit(formData);
  if (!authorized.ok) return authorized.state;
  const targetRevisionId = parseUuid(formData.get("targetRevisionId"));
  if (!targetRevisionId) return validationFailure("Revisão pendente inválida.");

  const supabase = createServiceClient();
  const { data, error } = await supabase.rpc(
    "activate_openai_workload_configuration_revision_v1",
    {
      p_environment: authorized.unit.environment,
      p_workload: authorized.unit.workload,
      p_target_revision_id: targetRevisionId,
      p_actor_user_id: authorized.actorUserId,
      p_expected_version: authorized.unit.expectedVersion,
    },
  );

  if (error) return databaseFailure(error);
  revalidatePath(ADMIN_PATH);
  return success("Revisão ativada por decisão administrativa explícita.", data);
}

export async function rollbackOpenAiConfigurationRevisionAction(
  _previous: OpenAiOperationalActionState,
  formData: FormData,
): Promise<OpenAiOperationalActionState> {
  const authorized = await authorizedUnit(formData);
  if (!authorized.ok) return authorized.state;
  const targetRevisionId = parseUuid(formData.get("targetRevisionId"));
  if (!targetRevisionId) return validationFailure("Revisão de rollback inválida.");

  const supabase = createServiceClient();
  const { data, error } = await supabase.rpc(
    "rollback_openai_workload_configuration_revision_v1",
    {
      p_environment: authorized.unit.environment,
      p_workload: authorized.unit.workload,
      p_target_revision_id: targetRevisionId,
      p_actor_user_id: authorized.actorUserId,
      p_expected_version: authorized.unit.expectedVersion,
    },
  );

  if (error) return databaseFailure(error);
  revalidatePath(ADMIN_PATH);
  return success("Rollback concluído para uma revisão previamente ativa.", data);
}

async function authorizedUnit(formData: FormData): Promise<
  | Readonly<{ ok: true; actorUserId: string; unit: UnitInput }>
  | Readonly<{ ok: false; state: OpenAiOperationalActionState }>
> {
  const gate = await requirePlatformAdmin();
  if (!gate.allowed) {
    return {
      ok: false,
      state: failure(
        "unauthorized",
        "Acesso administrativo não autorizado.",
      ),
    };
  }

  const environment = parseEnvironment(formData.get("environment"));
  const workload = parseProductWorkload(formData.get("workload"));
  const expectedVersion = parsePositiveInteger(formData.get("expectedVersion"));
  if (!environment || !workload || expectedVersion === null) {
    return {
      ok: false,
      state: validationFailure("Unidade ou versão de configuração inválida."),
    };
  }

  return {
    ok: true,
    actorUserId: gate.actorUserId,
    unit: { environment, workload, expectedVersion },
  };
}

async function parseCandidate(
  formData: FormData,
  unit: UnitInput,
): Promise<
  | Readonly<{
      ok: true;
      model: string;
      reasoningEffort: OpenAiReasoningEffort | null;
      quality: OpenAiImageQuality | null;
      configuration:
        | ResolvedOpenAiProductWorkload
        | ResolvedOpenAiImageWorkload;
    }>
  | Readonly<{ ok: false; state: OpenAiOperationalActionState }>
> {
  const model = parseTechnicalValue(formData.get("model"), 64);
  if (!model) return { ok: false, state: validationFailure("Modelo inválido.") };

  if (unit.workload === "landing_page_draft_image_generation") {
    const imageWorkload = unit.workload;
    const quality = parseImageQuality(formData.get("quality"));
    if (!quality || parseOptionalValue(formData.get("reasoningEffort")) !== null) {
      return {
        ok: false,
        state: validationFailure("Configuração de imagem inválida."),
      };
    }
    const resolved = await resolveOpenAiImageWorkload(
      imageWorkload,
      unit.environment,
      {
        operationalConfigurationEnabled: "true",
        readOperationalConfiguration: async () => ({
          ok: true,
          value: {
            environment: unit.environment,
            workload: imageWorkload,
            apiKind: "image_generation",
            model,
            quality,
            revision: "1",
          },
        }),
      },
    );
    if (!resolved.ok) {
      return {
        ok: false,
        state: validationFailure("Combinação de imagem fora da allowlist."),
      };
    }
    return {
      ok: true,
      model,
      reasoningEffort: null,
      quality,
      configuration: resolved.value,
    };
  }

  const reasoningEffort = parseReasoningEffort(formData.get("reasoningEffort"));
  if (!reasoningEffort || parseOptionalValue(formData.get("quality")) !== null) {
    return {
      ok: false,
      state: validationFailure("Configuração textual inválida."),
    };
  }
  const resolved = await resolveOpenAiProductWorkload(
    unit.workload as OpenAiProductWorkloadId,
    unit.environment,
    {
      operationalConfigurationEnabled: "true",
      readOperationalConfiguration: async () => ({
        ok: true,
        value: {
          environment: unit.environment,
          workload: unit.workload as OpenAiProductWorkloadId,
          apiKind: "responses_text",
          model,
          reasoningEffort,
          revision: "1",
        },
      }),
    },
  );
  if (!resolved.ok) {
    return {
      ok: false,
      state: validationFailure("Combinação textual fora da allowlist."),
    };
  }
  return {
    ok: true,
    model,
    reasoningEffort,
    quality: null,
    configuration: resolved.value,
  };
}

function candidateFormData(row: Record<string, unknown>) {
  if (typeof row.candidate_model !== "string" || !row.candidate_model.trim()) {
    return null;
  }
  const formData = new FormData();
  formData.set("model", row.candidate_model);
  if (typeof row.candidate_reasoning_effort === "string") {
    formData.set("reasoningEffort", row.candidate_reasoning_effort);
  }
  if (typeof row.candidate_quality === "string") {
    formData.set("quality", row.candidate_quality);
  }
  return formData;
}

function parseEnvironment(value: FormDataEntryValue | null) {
  return value === "production" || value === "preview" ? value : null;
}

function parseProductWorkload(value: FormDataEntryValue | null) {
  return typeof value === "string" &&
    ([...productWorkloads, "landing_page_draft_image_generation"] as const)
      .includes(value as never)
    ? (value as UnitInput["workload"])
    : null;
}

function parseReasoningEffort(value: FormDataEntryValue | null) {
  return typeof value === "string" &&
    openAiReasoningEfforts.includes(value as OpenAiReasoningEffort)
    ? (value as OpenAiReasoningEffort)
    : null;
}

function parseImageQuality(value: FormDataEntryValue | null) {
  return typeof value === "string" &&
    openAiImageQualities.includes(value as OpenAiImageQuality)
    ? (value as OpenAiImageQuality)
    : null;
}

function parseOptionalValue(value: FormDataEntryValue | null) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function parseTechnicalValue(value: FormDataEntryValue | null, maximum: number) {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  return normalized.length > 0 && normalized.length <= maximum &&
    /^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(normalized)
    ? normalized
    : null;
}

function parsePositiveInteger(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || !/^[1-9]\d*$/.test(value)) return null;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) ? parsed : null;
}

function parseUuid(value: FormDataEntryValue | null) {
  return typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
    ? value
    : null;
}

function databaseFailure(error: Readonly<{ code?: string; message?: string }>) {
  const message = error.message ?? "";
  if (error.code === "40001" || message.includes("stale_version")) {
    return failure(
      "concurrency",
      "A configuração mudou em outra sessão. Recarregue antes de tentar novamente.",
    );
  }
  if (error.code === "22023" || error.code === "22004") {
    return validationFailure("A configuração foi rejeitada pelo contrato operacional.");
  }
  if (error.code === "55000") {
    return failure(
      "lifecycle",
      "A ação não é permitida no estado atual da configuração.",
    );
  }
  if (error.code === "P0002") {
    return failure("read", "A unidade de configuração não foi encontrada.");
  }
  return failure("operation_failed", "A operação não pôde ser concluída.");
}

function success(message: string, version: unknown): OpenAiOperationalActionState {
  return {
    status: "success",
    code: null,
    message,
    configurationVersion:
      typeof version === "number" && Number.isSafeInteger(version) && version > 0
        ? version
        : null,
  };
}

function validationFailure(message: string) {
  return failure("validation", message);
}

function failure(code: string, message: string): OpenAiOperationalActionState {
  return {
    status: "error",
    code,
    message,
    configurationVersion: null,
  };
}
