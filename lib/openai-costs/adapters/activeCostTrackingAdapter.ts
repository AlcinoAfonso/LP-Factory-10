import "server-only";

import { createServiceClient } from "../../supabase/service";
import type { OpenAiCostTrackingAdapter } from "../active-contracts";
import {
  executionFinishRpc,
  executionStartRpc,
  operationFinishRpc,
  operationStartRpc,
  OpenAiCostTrackingPersistenceError,
} from "./activeCostTrackingAdapterCore";

async function invoke(name: string, args: Record<string, unknown>) {
  const { error } = await createServiceClient().rpc(name, args);
  if (error) {
    throw new OpenAiCostTrackingPersistenceError(
      error.code === "23505" ? "conflict" : "unavailable",
    );
  }
}

export const activeCostTrackingAdapter: OpenAiCostTrackingAdapter = Object.freeze({
  startExecution: (input) => invoke("start_openai_cost_execution_v1", executionStartRpc(input)),
  startOperation: (input) => invoke("start_openai_cost_operation_v1", operationStartRpc(input)),
  finishOperation: (input) => invoke("finish_openai_cost_operation_v1", operationFinishRpc(input)),
  finishExecution: (input) => invoke("finish_openai_cost_execution_v1", executionFinishRpc(input)),
});
