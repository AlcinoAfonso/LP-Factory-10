import type {
  OpenAiImageWorkloadDefinition,
  OpenAiProductWorkloadDefinition,
  OpenAiWorkloadDefinition,
  OpenAiWorkloadInventoryItem,
  ResolveOpenAiProductWorkloadResult,
  ResolveOpenAiImageWorkloadResult,
  ResolvedOpenAiImageWorkload,
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

  if (!isTextWorkload(workload)) {
    return failure(
      "NOT_TEXT_PRODUCT_WORKLOAD",
      `OpenAI workload is not a Responses text workload: ${workloadId}`,
    );
  }

  return deepFreeze({
    ok: true,
    value: toResolvedProductWorkload(workload),
  });
}

export function resolveOpenAiImageWorkload(
  workloadId: string,
): ResolveOpenAiImageWorkloadResult {
  const workload = openAiWorkloadRegistry.find(
    (candidate) => candidate.id === workloadId,
  );
  if (!workload) {
    return failure("UNKNOWN_WORKLOAD", `Unknown OpenAI workload: ${workloadId}`);
  }
  if (
    !isImageWorkload(workload)
  ) {
    return failure(
      "NOT_IMAGE_GENERATION_WORKLOAD",
      `OpenAI workload is not an image generation workload: ${workloadId}`,
    );
  }
  return deepFreeze({ ok: true, value: toResolvedImageWorkload(workload) });
}

export function listOpenAiWorkloadInventory(): readonly OpenAiWorkloadInventoryItem[] {
  return inventory;
}

function toInventoryItem(
  workload: OpenAiWorkloadDefinition,
): OpenAiWorkloadInventoryItem {
  if (workload.configurationKind === "effective") {
    return isImageWorkload(workload)
      ? toResolvedImageWorkload(workload)
      : toResolvedProductWorkload(workload as OpenAiProductWorkloadDefinition);
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
    apiKind: workload.configuration.apiKind,
    consumer: workload.consumer,
    fallback: workload.fallback,
    model: workload.configuration.model,
    reasoningEffort: workload.configuration.reasoningEffort,
    source: workload.configuration.source,
    revision: workload.configuration.revision,
    effectiveConfigurationVerified: true,
  });
}

function toResolvedImageWorkload(
  workload: OpenAiImageWorkloadDefinition,
): ResolvedOpenAiImageWorkload {
  return deepFreeze({
    id: workload.id,
    displayName: workload.displayName,
    classification: workload.classification,
    configurationKind: workload.configurationKind,
    apiKind: workload.configuration.apiKind,
    consumer: workload.consumer,
    fallback: workload.fallback,
    model: workload.configuration.model,
    size: workload.configuration.size,
    quality: workload.configuration.quality,
    format: workload.configuration.format,
    compression: workload.configuration.compression,
    moderation: workload.configuration.moderation,
    reasoningEffort: "not_applicable",
    source: workload.configuration.source,
    revision: workload.configuration.revision,
    effectiveConfigurationVerified: true,
  });
}

function isTextWorkload(
  workload: OpenAiWorkloadDefinition,
): workload is OpenAiProductWorkloadDefinition {
  return (
    workload.configurationKind === "effective" &&
    workload.configuration.apiKind === "responses_text"
  );
}

function isImageWorkload(
  workload: OpenAiWorkloadDefinition,
): workload is OpenAiImageWorkloadDefinition {
  return (
    workload.configurationKind === "effective" &&
    workload.configuration.apiKind === "image_generation"
  );
}

function failure(
  code:
    | "UNKNOWN_WORKLOAD"
    | "NOT_PRODUCT_RUNTIME_WORKLOAD"
    | "NOT_TEXT_PRODUCT_WORKLOAD"
    | "NOT_IMAGE_GENERATION_WORKLOAD",
  message: string,
): Extract<ResolveOpenAiProductWorkloadResult, { ok: false }> {
  return deepFreeze({ ok: false, error: { code, message } });
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    for (const nested of Object.values(value)) deepFreeze(nested);
    Object.freeze(value);
  }
  return value;
}
