import "server-only";

import {
  resolveOpenAiProductWorkload,
  resolveOpenAiWorkloadEnvironment,
} from "../../openai-workloads";
import { resolveInputCatalogEvaluationRuntimeReadinessCore } from "./inputCatalogEvaluationRuntimeGateCore";

export async function resolveInputCatalogEvaluationRuntimeReadiness() {
  const environment = resolveOpenAiWorkloadEnvironment();
  return resolveInputCatalogEvaluationRuntimeReadinessCore(
    {
      environment,
      rolloutGateValue: process.env.E20_6_5_INPUT_CATALOG_EVALUATION_PROVIDER_ENABLED,
    },
    {
      resolveConfiguration: () => resolveOpenAiProductWorkload(
        "taxon_input_catalog_sufficiency_evaluation",
        environment,
      ),
    },
  );
}
