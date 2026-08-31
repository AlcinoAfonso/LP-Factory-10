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
import {
  checkOpenAiModelCatalogConfigurationAvailable,
  readOpenAiModelCatalog,
} from "@/openai-workloads/adapters/modelCatalogAdapter";
import { isOpenAiModelCatalogConfigurationAvailable } from "@/openai-workloads/adapters/modelCatalogAdapterCore";
import {
  activateOpenAiConfigurationRevision,
  discardOpenAiConfigurationCandidate,
  promoteOpenAiConfigurationCandidate,
  readOpenAiCandidateConfiguration,
  rollbackOpenAiConfigurationRevision,
  saveOpenAiConfigurationCandidate,
} from "@/openai-workloads/adapters/operationalConfigurationAdapter";
import { runOpenAiCandidateProof } from "./_proof";

const ADMIN_PATH = "/admin/workloads-openai";

const productWorkloads = [
  "niche_resolution",
  "commercial_activation_draft_generation",
  "landing_page_draft_generation",
  "taxon_input_catalog_sufficiency_evaluation",
  "landing_page_dynamic_market_research",
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
  if (!(await candidateIsEligibleForSave(candidate))) {
    return failure(
      "catalog",
      "A combinação não está disponível no catálogo operacional.",
    );
  }

  const { data, error } = await saveOpenAiConfigurationCandidate({
    environment: authorized.unit.environment,
    workload: authorized.unit.workload,
    model: candidate.model,
    reasoningEffort: candidate.reasoningEffort,
    quality: candidate.quality,
    actorUserId: authorized.actorUserId,
    expectedVersion: authorized.unit.expectedVersion,
  });

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

  const { data, error } = await discardOpenAiConfigurationCandidate({
    environment: authorized.unit.environment,
    workload: authorized.unit.workload,
    actorUserId: authorized.actorUserId,
    expectedVersion: authorized.unit.expectedVersion,
  });

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

  const candidateRead = await readOpenAiCandidateConfiguration({
    environment: authorized.unit.environment,
    workload: authorized.unit.workload,
  });
  if (!candidateRead.ok && candidateRead.code === "READ_FAILED") {
    return failure("read", "A candidata não pôde ser lida para a prova.");
  }
  if (!candidateRead.ok && candidateRead.code === "NOT_FOUND") {
    return failure("read", "A unidade operacional está ausente ou duplicada.");
  }
  if (!candidateRead.ok) {
    return failure("lifecycle", "Não existe candidata apta para prova.");
  }
  if (candidateRead.value.configurationVersion !== authorized.unit.expectedVersion) {
    return failure(
      "concurrency",
      "A configuração mudou em outra sessão. Recarregue antes de provar.",
    );
  }
  const candidateForm = candidateFormData(candidateRead.value);
  const candidate = await parseCandidate(candidateForm, authorized.unit);
  if (!candidate.ok) return candidate.state;

  if (!(await candidateIsStillEligible(candidate, authorized.unit))) {
    return failure(
      "catalog",
      "A combinação deixou de estar disponível no catálogo; a prova não foi iniciada.",
    );
  }

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

  const { data, error } = await promoteOpenAiConfigurationCandidate({
    environment: authorized.unit.environment,
    workload: authorized.unit.workload,
    proofMetadata: { ...proof.metadata },
    actorUserId: authorized.actorUserId,
    expectedVersion: authorized.unit.expectedVersion,
  });
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

  const { data, error } = await activateOpenAiConfigurationRevision({
    environment: authorized.unit.environment,
    workload: authorized.unit.workload,
    targetRevisionId,
    actorUserId: authorized.actorUserId,
    expectedVersion: authorized.unit.expectedVersion,
  });

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

  const { data, error } = await rollbackOpenAiConfigurationRevision({
    environment: authorized.unit.environment,
    workload: authorized.unit.workload,
    targetRevisionId,
    actorUserId: authorized.actorUserId,
    expectedVersion: authorized.unit.expectedVersion,
  });

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

type ParsedCandidate = Readonly<{
  model: string;
  reasoningEffort: OpenAiReasoningEffort | null;
  quality: OpenAiImageQuality | null;
  configuration: ResolvedOpenAiProductWorkload | ResolvedOpenAiImageWorkload;
}>;

async function candidateIsEligibleForSave(candidate: ParsedCandidate) {
  const catalog = await readOpenAiModelCatalog();
  return catalog.ok && isOpenAiModelCatalogConfigurationAvailable(catalog.value, {
    apiKind: candidate.configuration.apiKind,
    model: candidate.model,
    reasoningEffort: candidate.reasoningEffort,
    quality: candidate.quality,
  });
}

async function candidateIsStillEligible(
  candidate: ParsedCandidate,
  unit: UnitInput,
) {
  const current = await checkOpenAiModelCatalogConfigurationAvailable({
    environment: unit.environment,
    workload: unit.workload,
    expectedVersion: unit.expectedVersion,
  });
  return current.ok &&
    current.value.apiKind === candidate.configuration.apiKind &&
    current.value.model === candidate.model &&
    current.value.reasoningEffort === candidate.reasoningEffort &&
    current.value.quality === candidate.quality;
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
  const model = parseTechnicalValue(formData.get("model"), 128);
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

function candidateFormData(value: Readonly<{
  model: string;
  reasoningEffort: OpenAiReasoningEffort | null;
  quality: OpenAiImageQuality | null;
}>) {
  const formData = new FormData();
  formData.set("model", value.model);
  if (value.reasoningEffort) {
    formData.set("reasoningEffort", value.reasoningEffort);
  }
  if (value.quality) {
    formData.set("quality", value.quality);
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
