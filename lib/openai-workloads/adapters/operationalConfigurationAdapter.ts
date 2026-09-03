import "server-only";

import { createServiceClient } from "../../supabase/service";
import type {
  OpenAiAdministrativeConfigurationReader,
  OpenAiAdministrativeConfigurationReadResult,
  OpenAiOperationalConfigurationReader,
  OpenAiOperationalConfigurationReadResult,
  OpenAiImageQuality,
  OpenAiManagedWorkloadEnvironment,
  OpenAiProductWorkloadId,
  OpenAiReasoningEffort,
  OpenAiWorkloadId,
} from "../contracts";
import {
  openAiImageQualities,
  openAiProductWorkloadIds,
  openAiReasoningEfforts,
} from "../contracts";
import { readCompleteOrderedPages } from "./modelCatalogAdapterCore";
import {
  translateOpenAiAdministrativeConfigurationRows,
  translateOperationalConfigurationRows,
  type OperationalConfigurationQueryResult,
} from "./operationalConfigurationAdapterCore";

export const readOpenAiAdministrativeConfigurations: OpenAiAdministrativeConfigurationReader =
  async (): Promise<OpenAiAdministrativeConfigurationReadResult> => {
    try {
      const supabase = createServiceClient();
      const [unitRead, revisionRead, activationRead] = await Promise.all([
        readCompleteOrderedPages(async (from, to) =>
          supabase
            .from("openai_workload_operational_configurations")
            .select(
              "environment,workload,modality,active_revision_id,pending_revision_id,candidate_model,candidate_reasoning_effort,candidate_quality,candidate_saved_by,candidate_saved_at,configuration_version",
            )
            .in("workload", [...openAiProductWorkloadIds])
            .order("environment", { ascending: true })
            .order("workload", { ascending: true })
            .range(from, to),
        ),
        readCompleteOrderedPages(async (from, to) =>
          supabase
            .from("openai_workload_configuration_revisions")
            .select(
              "id,environment,workload,modality,revision_number,model,reasoning_effort,quality,validated_by,validated_at",
            )
            .in("workload", [...openAiProductWorkloadIds])
            .order("environment", { ascending: true })
            .order("workload", { ascending: true })
            .order("revision_number", { ascending: true })
            .range(from, to),
        ),
        readCompleteOrderedPages(async (from, to) =>
          supabase
            .from("openai_workload_configuration_activations")
            .select(
              "id,environment,workload,modality,activation_number,event_type,previous_revision_id,target_revision_id,actor_user_id,created_at",
            )
            .in("workload", [...openAiProductWorkloadIds])
            .order("environment", { ascending: true })
            .order("workload", { ascending: true })
            .order("activation_number", { ascending: true })
            .range(from, to),
        ),
      ]);

      return translateOpenAiAdministrativeConfigurationRows(
        unitRead as OperationalConfigurationQueryResult,
        revisionRead as OperationalConfigurationQueryResult,
        activationRead as OperationalConfigurationQueryResult,
      );
    } catch {
      return Object.freeze({
        ok: false,
        error: Object.freeze({
          code: "READ_FAILED",
          message: "Administrative configuration read failed",
        }),
      });
    }
  };

type ManagedWorkload = Exclude<OpenAiWorkloadId, "supabase_inspect">;

export type OpenAiCandidateConfigurationReadResult =
  | Readonly<{
      ok: true;
      value: Readonly<{
        configurationVersion: number;
        model: string;
        reasoningEffort: OpenAiReasoningEffort | null;
        quality: OpenAiImageQuality | null;
      }>;
    }>
  | Readonly<{ ok: false; code: "READ_FAILED" | "NOT_FOUND" | "INVALID" }>;

export async function readOpenAiCandidateConfiguration(input: Readonly<{
  environment: OpenAiManagedWorkloadEnvironment;
  workload: ManagedWorkload;
}>): Promise<OpenAiCandidateConfigurationReadResult> {
  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("openai_workload_operational_configurations")
      .select(
        "environment,workload,configuration_version,candidate_model,candidate_reasoning_effort,candidate_quality",
      )
      .eq("environment", input.environment)
      .eq("workload", input.workload)
      .limit(2);
    if (error) return { ok: false, code: "READ_FAILED" };
    if (!Array.isArray(data) || data.length !== 1 || !isRecord(data[0])) {
      return { ok: false, code: "NOT_FOUND" };
    }
    const row = data[0];
    const model = technicalValue(row.candidate_model);
    const version = positiveInteger(row.configuration_version);
    const reasoningEffort = openAiReasoningEfforts.includes(
      row.candidate_reasoning_effort as OpenAiReasoningEffort,
    )
      ? (row.candidate_reasoning_effort as OpenAiReasoningEffort)
      : null;
    const quality = openAiImageQualities.includes(
      row.candidate_quality as OpenAiImageQuality,
    )
      ? (row.candidate_quality as OpenAiImageQuality)
      : null;
    const validShape = reasoningEffort !== null && row.candidate_quality === null;
    return model && version !== null && validShape
      ? {
          ok: true,
          value: {
            configurationVersion: version,
            model,
            reasoningEffort,
            quality,
          },
        }
      : { ok: false, code: "INVALID" };
  } catch {
    return { ok: false, code: "READ_FAILED" };
  }
}

type RpcError = Readonly<{ code?: string; message?: string }>;
export type OpenAiOperationalMutationResult = Promise<Readonly<{
  data: unknown;
  error: RpcError | null;
}>>;

export async function saveOpenAiConfigurationCandidate(input: Readonly<{
  environment: OpenAiManagedWorkloadEnvironment;
  workload: ManagedWorkload;
  model: string;
  reasoningEffort: OpenAiReasoningEffort | null;
  quality: OpenAiImageQuality | null;
  actorUserId: string;
  expectedVersion: number;
}>): OpenAiOperationalMutationResult {
  return await createServiceClient().rpc("save_openai_workload_configuration_candidate_v1", {
    p_environment: input.environment,
    p_workload: input.workload,
    p_model: input.model,
    p_reasoning_effort: input.reasoningEffort,
    p_quality: input.quality,
    p_actor_user_id: input.actorUserId,
    p_expected_version: input.expectedVersion,
  });
}

export async function discardOpenAiConfigurationCandidate(input: Readonly<{
  environment: OpenAiManagedWorkloadEnvironment;
  workload: ManagedWorkload;
  actorUserId: string;
  expectedVersion: number;
}>): OpenAiOperationalMutationResult {
  return await createServiceClient().rpc("discard_openai_workload_configuration_candidate_v1", {
    p_environment: input.environment,
    p_workload: input.workload,
    p_actor_user_id: input.actorUserId,
    p_expected_version: input.expectedVersion,
  });
}

export async function promoteOpenAiConfigurationCandidate(input: Readonly<{
  environment: OpenAiManagedWorkloadEnvironment;
  workload: ManagedWorkload;
  proofMetadata: Readonly<Record<string, unknown>>;
  actorUserId: string;
  expectedVersion: number;
}>): OpenAiOperationalMutationResult {
  return await createServiceClient().rpc("promote_openai_workload_configuration_candidate_v1", {
    p_environment: input.environment,
    p_workload: input.workload,
    p_proof_metadata: input.proofMetadata,
    p_actor_user_id: input.actorUserId,
    p_expected_version: input.expectedVersion,
  });
}

export async function activateOpenAiConfigurationRevision(input: Readonly<{
  environment: OpenAiManagedWorkloadEnvironment;
  workload: ManagedWorkload;
  targetRevisionId: string;
  actorUserId: string;
  expectedVersion: number;
}>): OpenAiOperationalMutationResult {
  return await createServiceClient().rpc("activate_openai_workload_configuration_revision_v1", {
    p_environment: input.environment,
    p_workload: input.workload,
    p_target_revision_id: input.targetRevisionId,
    p_actor_user_id: input.actorUserId,
    p_expected_version: input.expectedVersion,
  });
}

export async function rollbackOpenAiConfigurationRevision(input: Readonly<{
  environment: OpenAiManagedWorkloadEnvironment;
  workload: ManagedWorkload;
  targetRevisionId: string;
  actorUserId: string;
  expectedVersion: number;
}>): OpenAiOperationalMutationResult {
  return await createServiceClient().rpc("rollback_openai_workload_configuration_revision_v1", {
    p_environment: input.environment,
    p_workload: input.workload,
    p_target_revision_id: input.targetRevisionId,
    p_actor_user_id: input.actorUserId,
    p_expected_version: input.expectedVersion,
  });
}

export const readOpenAiOperationalConfiguration: OpenAiOperationalConfigurationReader =
  async (input): Promise<OpenAiOperationalConfigurationReadResult> => {
    try {
      const supabase = createServiceClient();
      const unitRead = await supabase
        .from("openai_workload_operational_configurations")
        .select("environment,workload,modality,active_revision_id")
        .eq("environment", input.environment)
        .eq("workload", input.workload)
        .limit(2);

      if (unitRead.error) {
        return translateOperationalConfigurationRows(
          input,
          unitRead as OperationalConfigurationQueryResult,
          { data: null, error: unitRead.error },
        );
      }

      const unit = Array.isArray(unitRead.data) ? unitRead.data[0] : null;
      const activeRevisionId =
        isRecord(unit) && typeof unit.active_revision_id === "string"
          ? unit.active_revision_id
          : "";
      const revisionRead = await supabase
        .from("openai_workload_configuration_revisions")
        .select(
          "id,environment,workload,modality,revision_number,model,reasoning_effort,quality",
        )
        .eq("id", activeRevisionId)
        .eq("environment", input.environment)
        .eq("workload", input.workload)
        .limit(2);

      return translateOperationalConfigurationRows(
        input,
        unitRead as OperationalConfigurationQueryResult,
        revisionRead as OperationalConfigurationQueryResult,
      );
    } catch {
      return {
        ok: false,
        error: {
          code: "READ_FAILED",
          message: "Operational configuration read failed",
        },
      };
    }
  };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function positiveInteger(value: unknown) {
  return typeof value === "number" && Number.isSafeInteger(value) && value > 0
    ? value
    : null;
}

function technicalValue(value: unknown) {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  return normalized.length > 0 && normalized.length <= 128 &&
    /^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(normalized)
    ? normalized
    : null;
}
