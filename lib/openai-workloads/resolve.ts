import type {
  OpenAiImageWorkloadDefinition,
  OpenAiOperationalConfiguration,
  OpenAiOperationalConfigurationReader,
  OpenAiProductWorkloadDefinition,
  OpenAiWorkloadDefinition,
  OpenAiWorkloadEnvironment,
  OpenAiWorkloadInventoryItem,
  ResolveOpenAiImageWorkloadResult,
  ResolveOpenAiProductWorkloadResult,
  ResolvedOpenAiImageWorkload,
  ResolvedOpenAiProductWorkload,
} from "./contracts";
import {
  isAllowedOpenAiImageConfiguration,
  isAllowedOpenAiTextConfiguration,
  openAiWorkloadRegistry,
} from "./registry";

export type OpenAiWorkloadResolverDependencies = Readonly<{
  operationalConfigurationEnabled?: string | null;
  readOperationalConfiguration?: OpenAiOperationalConfigurationReader;
}>;

const inventory = deepFreeze(
  openAiWorkloadRegistry.map(toInventoryItem),
) as readonly OpenAiWorkloadInventoryItem[];

export async function resolveOpenAiProductWorkload(
  workloadId: string,
  environment: OpenAiWorkloadEnvironment,
  dependencies: OpenAiWorkloadResolverDependencies = {},
): Promise<ResolveOpenAiProductWorkloadResult> {
  const workload = findWorkload(workloadId);
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

  if (environment === "unknown") return unknownEnvironmentFailure();
  if (
    environment === "development" ||
    !usesOperationalConfiguration(dependencies)
  ) {
    return success(toResolvedProductWorkload(workload));
  }

  const operational = await readOperationalConfiguration(
    { environment, workload: workload.id },
    dependencies,
  );
  if (!operational.ok) return operational.error;
  if (
    operational.value.apiKind !== "responses_text" ||
    operational.value.workload !== workload.id ||
    operational.value.environment !== environment ||
    !isDecimalRevision(operational.value.revision) ||
    !isAllowedOpenAiTextConfiguration(workload, operational.value)
  ) {
    return failure(
      "OPERATIONAL_CONFIGURATION_INVALID",
      `Invalid active operational configuration: ${workload.id}`,
    );
  }

  return success(
    toResolvedProductWorkload(workload, {
      model: operational.value.model,
      reasoningEffort: operational.value.reasoningEffort,
      source: "supabase_operational",
      revision: operational.value.revision,
    }),
  );
}

export async function resolveOpenAiImageWorkload(
  workloadId: string,
  environment: OpenAiWorkloadEnvironment,
  dependencies: OpenAiWorkloadResolverDependencies = {},
): Promise<ResolveOpenAiImageWorkloadResult> {
  const workload = findWorkload(workloadId);
  if (!workload) {
    return failure("UNKNOWN_WORKLOAD", `Unknown OpenAI workload: ${workloadId}`);
  }
  if (!isImageWorkload(workload)) {
    return failure(
      "NOT_IMAGE_GENERATION_WORKLOAD",
      `OpenAI workload is not an image generation workload: ${workloadId}`,
    );
  }

  if (environment === "unknown") return unknownEnvironmentFailure();
  if (
    environment === "development" ||
    !usesOperationalConfiguration(dependencies)
  ) {
    return success(toResolvedImageWorkload(workload));
  }

  const operational = await readOperationalConfiguration(
    { environment, workload: workload.id },
    dependencies,
  );
  if (!operational.ok) return operational.error;
  if (
    operational.value.apiKind !== "image_generation" ||
    operational.value.workload !== workload.id ||
    operational.value.environment !== environment ||
    !isDecimalRevision(operational.value.revision) ||
    !isAllowedOpenAiImageConfiguration(workload, operational.value)
  ) {
    return failure(
      "OPERATIONAL_CONFIGURATION_INVALID",
      `Invalid active operational configuration: ${workload.id}`,
    );
  }

  return success(
    toResolvedImageWorkload(workload, {
      model: operational.value.model,
      quality: operational.value.quality,
      source: "supabase_operational",
      revision: operational.value.revision,
    }),
  );
}

export function listOpenAiWorkloadInventory(): readonly OpenAiWorkloadInventoryItem[] {
  return inventory;
}

function findWorkload(workloadId: string): OpenAiWorkloadDefinition | undefined {
  return openAiWorkloadRegistry.find((candidate) => candidate.id === workloadId);
}

function unknownEnvironmentFailure(): Extract<
  ResolveOpenAiProductWorkloadResult,
  { ok: false }
> {
  return failure(
    "UNKNOWN_ENVIRONMENT",
    "OpenAI workload environment could not be resolved",
  );
}

function usesOperationalConfiguration(
  dependencies: OpenAiWorkloadResolverDependencies,
) {
  const gate = Object.prototype.hasOwnProperty.call(
    dependencies,
    "operationalConfigurationEnabled",
  )
    ? dependencies.operationalConfigurationEnabled
    : process.env.OPENAI_OPERATIONAL_CONFIG_ENABLED;
  return gate === "true";
}

async function readOperationalConfiguration(
  input: Readonly<{
    environment: "production" | "preview";
    workload:
      | OpenAiProductWorkloadDefinition["id"]
      | OpenAiImageWorkloadDefinition["id"];
  }>,
  dependencies: OpenAiWorkloadResolverDependencies,
): Promise<
  | Readonly<{ ok: true; value: OpenAiOperationalConfiguration }>
  | Readonly<{
      ok: false;
      error: Extract<ResolveOpenAiProductWorkloadResult, { ok: false }>;
    }>
> {
  const reader =
    dependencies.readOperationalConfiguration ??
    (await import("./adapters/operationalConfigurationAdapter"))
      .readOpenAiOperationalConfiguration;
  const result = await reader(input);
  if (!result.ok) {
    return {
      ok: false,
      error: failure(
        result.error.code === "READ_FAILED"
          ? "OPERATIONAL_CONFIGURATION_READ_FAILED"
          : "OPERATIONAL_CONFIGURATION_INVALID",
        result.error.message,
      ),
    };
  }
  return { ok: true, value: result.value };
}

function toInventoryItem(
  workload: OpenAiWorkloadDefinition,
): OpenAiWorkloadInventoryItem {
  if (workload.configurationKind === "effective") {
    return isImageWorkload(workload)
      ? toInventoryImageWorkload(workload)
      : toInventoryProductWorkload(
          workload as OpenAiProductWorkloadDefinition,
        );
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

function toInventoryProductWorkload(
  workload: OpenAiProductWorkloadDefinition,
): Extract<OpenAiWorkloadInventoryItem, { apiKind: "responses_text" }> {
  return deepFreeze({
    ...toResolvedProductWorkload(workload),
    source: "repo_catalog" as const,
  });
}

function toInventoryImageWorkload(
  workload: OpenAiImageWorkloadDefinition,
): Extract<OpenAiWorkloadInventoryItem, { apiKind: "image_generation" }> {
  return deepFreeze({
    ...toResolvedImageWorkload(workload),
    source: "repo_catalog" as const,
  });
}

function toResolvedProductWorkload(
  workload: OpenAiProductWorkloadDefinition,
  configuration: Readonly<{
    model: string;
    reasoningEffort: OpenAiProductWorkloadDefinition["configuration"]["reasoningEffort"];
    source: ResolvedOpenAiProductWorkload["source"];
    revision: string;
  }> = workload.configuration,
): ResolvedOpenAiProductWorkload {
  return deepFreeze({
    id: workload.id,
    displayName: workload.displayName,
    classification: workload.classification,
    configurationKind: workload.configurationKind,
    apiKind: workload.configuration.apiKind,
    consumer: workload.consumer,
    fallback: workload.fallback,
    model: configuration.model,
    reasoningEffort: configuration.reasoningEffort,
    source: configuration.source,
    revision: configuration.revision,
    effectiveConfigurationVerified: true,
  });
}

function toResolvedImageWorkload(
  workload: OpenAiImageWorkloadDefinition,
  configuration: Readonly<{
    model: string;
    quality: ResolvedOpenAiImageWorkload["quality"];
    source: ResolvedOpenAiImageWorkload["source"];
    revision: string;
  }> = workload.configuration,
): ResolvedOpenAiImageWorkload {
  return deepFreeze({
    id: workload.id,
    displayName: workload.displayName,
    classification: workload.classification,
    configurationKind: workload.configurationKind,
    apiKind: workload.configuration.apiKind,
    consumer: workload.consumer,
    fallback: workload.fallback,
    model: configuration.model,
    size: workload.configuration.size,
    quality: configuration.quality,
    format: workload.configuration.format,
    compression: workload.configuration.compression,
    moderation: workload.configuration.moderation,
    reasoningEffort: "not_applicable",
    source: configuration.source,
    revision: configuration.revision,
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

function isDecimalRevision(value: string) {
  return /^[1-9]\d*$/.test(value);
}

function success<T>(value: T): Readonly<{ ok: true; value: T }> {
  return deepFreeze({ ok: true, value });
}

function failure(
  code: Extract<ResolveOpenAiProductWorkloadResult, { ok: false }>["error"]["code"],
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
