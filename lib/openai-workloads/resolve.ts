import type {
  OpenAiProductWorkloadDefinition,
  OpenAiWorkloadDefinition,
  OpenAiWorkloadInventoryItem,
  ResolveOpenAiProductWorkloadResult,
  ResolvedOpenAiProductWorkload,
} from "./contracts";
import { openAiWorkloadRegistry } from "./registry";

const inventory = deepFreeze(
  openAiWorkloadRegistry.map(toInventoryItem),
) as readonly OpenAiWorkloadInventoryItem[];

export function resolveOpenAiProductWorkload(
  workloadId: string,
): ResolveOpenAiProductWorkloadResult {
  const workload = openAiWorkloadRegistry.find(
    (candidate) => candidate.id === workloadId,
  );

  if (!workload) {
    return failure(
      "UNKNOWN_WORKLOAD",
      `Unknown OpenAI workload: ${workloadId}`,
    );
  }

  if (workload.configurationKind !== "effective") {
    return failure(
      "NOT_PRODUCT_RUNTIME_WORKLOAD",
      `OpenAI workload is not available to product runtime: ${workloadId}`,
    );
  }

  return deepFreeze({
    ok: true,
    value: toResolvedProductWorkload(workload),
  });
}

export function listOpenAiWorkloadInventory(): readonly OpenAiWorkloadInventoryItem[] {
  return inventory;
}

function toInventoryItem(
  workload: OpenAiWorkloadDefinition,
): OpenAiWorkloadInventoryItem {
  if (workload.configurationKind === "effective") {
    return toResolvedProductWorkload(workload);
  }

  return deepFreeze({
    id: workload.id,
    displayName: workload.displayName,
    classification: workload.classification,
    configurationKind: workload.configurationKind,
    consumer: workload.consumer,
    fallback: workload.fallback,
    model: workload.configuration.model,
    reasoningEffort: workload.configuration.reasoningEffort,
    source: workload.configuration.source,
    revision: workload.configuration.revision,
    effectiveConfigurationVerified: false,
  });
}

function toResolvedProductWorkload(
  workload: OpenAiProductWorkloadDefinition,
): ResolvedOpenAiProductWorkload {
  return deepFreeze({
    id: workload.id,
    displayName: workload.displayName,
    classification: workload.classification,
    configurationKind: workload.configurationKind,
    consumer: workload.consumer,
    fallback: workload.fallback,
    model: workload.configuration.model,
    reasoningEffort: workload.configuration.reasoningEffort,
    source: workload.configuration.source,
    revision: workload.configuration.revision,
    effectiveConfigurationVerified: true,
  });
}

function failure(
  code: "UNKNOWN_WORKLOAD" | "NOT_PRODUCT_RUNTIME_WORKLOAD",
  message: string,
): ResolveOpenAiProductWorkloadResult {
  return deepFreeze({ ok: false, error: { code, message } });
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    for (const nested of Object.values(value)) deepFreeze(nested);
    Object.freeze(value);
  }
  return value;
}
