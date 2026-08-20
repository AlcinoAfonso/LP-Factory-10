import "server-only";

import { createServiceClient } from "../../supabase/service";
import type {
  OpenAiOperationalConfigurationReader,
  OpenAiOperationalConfigurationReadResult,
} from "../contracts";
import {
  translateOperationalConfigurationRows,
  type OperationalConfigurationQueryResult,
} from "./operationalConfigurationAdapterCore";

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
