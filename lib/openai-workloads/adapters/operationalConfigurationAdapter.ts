import "server-only";

import { createServiceClient } from "../../supabase/service";
import type {
  OpenAiAdministrativeConfigurationReader,
  OpenAiAdministrativeConfigurationReadResult,
  OpenAiOperationalConfigurationReader,
  OpenAiOperationalConfigurationReadResult,
} from "../contracts";
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
        supabase
          .from("openai_workload_operational_configurations")
          .select(
            "environment,workload,modality,active_revision_id,pending_revision_id,candidate_model,candidate_reasoning_effort,candidate_quality,candidate_saved_by,candidate_saved_at,configuration_version",
          ),
        supabase
          .from("openai_workload_configuration_revisions")
          .select(
            "id,environment,workload,modality,revision_number,model,reasoning_effort,quality,validated_by,validated_at",
          ),
        supabase
          .from("openai_workload_configuration_activations")
          .select(
            "id,environment,workload,modality,activation_number,event_type,previous_revision_id,target_revision_id,actor_user_id,created_at",
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
