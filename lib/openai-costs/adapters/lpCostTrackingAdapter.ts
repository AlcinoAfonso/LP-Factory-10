import "server-only";

import { resolveOpenAiWorkloadEnvironment } from "../../openai-workloads";
import { createServiceClient } from "../../supabase/service";
import { OPENAI_LP_COST_PRICE_VERSION, priceOpenAiLpUsage } from "../pricing";
import {
  boundedOpenAiProviderErrorMetadata,
  boundedOpenAiProviderHttpStatus,
} from "../provider-error-metadata";
import type {
  OpenAiLpCostStartInput,
  OpenAiLpCostTracker,
} from "../tracking-contracts";
import { isOpenAiLpCostTrackingEnabled } from "../tracking-gate";

export function createOpenAiLpCostTracker(): OpenAiLpCostTracker | undefined {
  if (
    !isOpenAiLpCostTrackingEnabled({
      environment: resolveOpenAiWorkloadEnvironment(),
      flag: process.env.OPENAI_LP_COST_TRACKING_ENABLED,
    })
  ) {
    return undefined;
  }
  return {
    async start(input) {
      await appendStart(input);
      return {
        async complete(terminal) {
          const priced = priceOpenAiLpUsage(input, terminal);
          const { error } = await createServiceClient().rpc(
            "append_openai_lp_cost_terminal_v1",
            {
              p_attempt_id: input.attemptId,
              p_workload: input.workload,
              p_result: terminal.result,
              p_usage_json: priced?.usage ?? null,
              p_pricing_json: priced?.pricing ?? null,
              p_cost_usd: priced?.costUsd ?? null,
              p_http_status: boundedOpenAiProviderHttpStatus(terminal.httpStatus),
              p_provider_error_code: boundedOpenAiProviderErrorMetadata(
                terminal.providerErrorCode,
              ),
              p_provider_error_type: boundedOpenAiProviderErrorMetadata(
                terminal.providerErrorType,
              ),
            },
          );
          if (error) throw new Error("openai_lp_cost_tracking_terminal_failed");
        },
      };
    },
  };
}

async function appendStart(input: OpenAiLpCostStartInput) {
  const { error } = await createServiceClient().rpc(
    "append_openai_lp_cost_start_v1",
    {
      p_attempt_id: input.attemptId,
      p_account_id: input.accountId,
      p_landing_page_id: input.landingPageId,
      p_workload: input.workload,
      p_model: input.model,
      p_configuration_source: input.source,
      p_configuration_revision: input.revision,
      p_reasoning_effort:
        input.workload === "landing_page_draft_generation"
          ? input.reasoningEffort
          : null,
      p_quality:
        input.workload === "landing_page_draft_image_generation"
          ? input.quality
          : null,
      p_size:
        input.workload === "landing_page_draft_image_generation"
          ? input.size
          : null,
      p_price_version: OPENAI_LP_COST_PRICE_VERSION,
    },
  );
  if (error) throw new Error("openai_lp_cost_tracking_start_failed");
}
