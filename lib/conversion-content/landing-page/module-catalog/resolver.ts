import {
  resolveLandingPageRootParameters,
  type ResolveLandingPageRootParametersInput,
  type ResolveLandingPageRootParametersResult,
} from "../index";
import {
  landingPageFunnelStages,
  landingPageModuleLifecycleStatuses,
  type LandingPageEffectiveFunnelCopyProfileRegistry,
  type LandingPageModuleCatalogErrorCode,
  type LandingPageModuleCatalogRegistry,
  type LandingPageModuleFieldCatalogRegistry,
  type LandingPageModuleKey,
  type LandingPageModuleLifecycleStatus,
  type LandingPageModuleVariantCatalogRegistry,
  type LandingPageModuleVariantReference,
  type ResolveLandingPageModuleVariantOptions,
  type ResolveLandingPageModuleVariantResult,
} from "./contracts";
import {
  applyLandingPageFunnelProfileDeltaInternal,
  landingPageModuleCatalogRegistry,
  landingPageModuleFieldCatalogRegistry,
  landingPageModuleVariantCatalogRegistry,
} from "./registry";
import {
  landingPageModuleCatalogEntrySchema,
  landingPageModuleFieldCatalogEntrySchema,
  landingPageModuleVariantCatalogEntrySchema,
  landingPageModuleVariantReferenceSchema,
} from "./schema";

export type LandingPageModuleResolverDependenciesInternal = Readonly<{
  moduleCatalogRegistry: LandingPageModuleCatalogRegistry;
  fieldCatalogRegistry: LandingPageModuleFieldCatalogRegistry;
  variantCatalogRegistry: LandingPageModuleVariantCatalogRegistry;
  resolveRootParameters: (
    input: ResolveLandingPageRootParametersInput,
  ) => ResolveLandingPageRootParametersResult;
}>;

const canonicalDependencies: LandingPageModuleResolverDependenciesInternal = {
  moduleCatalogRegistry: landingPageModuleCatalogRegistry,
  fieldCatalogRegistry: landingPageModuleFieldCatalogRegistry,
  variantCatalogRegistry: landingPageModuleVariantCatalogRegistry,
  resolveRootParameters: resolveLandingPageRootParameters,
};

const safeMessages = {
  UNKNOWN_MODULE_CATALOG_VERSION: "Unknown module catalog version.",
  INVALID_MODULE_CATALOG_CONTRACT: "Invalid module catalog contract.",
  ROOT_RESOLUTION_FAILED: "Landing page root resolution failed.",
  INCOMPATIBLE_ROOT_VERSION: "Incompatible landing page root version.",
  UNKNOWN_MODULE: "Unknown landing page module.",
  UNKNOWN_MODULE_VERSION: "Unknown landing page module version.",
  UNKNOWN_VARIANT: "Unknown landing page module variant.",
  UNKNOWN_VARIANT_VERSION: "Unknown landing page module variant version.",
  INCOMPATIBLE_REFERENCE: "Incompatible landing page module variant reference.",
  INVALID_VARIANT_PAYLOAD: "Invalid landing page variant payload.",
} as const satisfies Readonly<Record<LandingPageModuleCatalogErrorCode, string>>;

export function resolveLandingPageModuleVariant(
  reference: LandingPageModuleVariantReference,
  options: ResolveLandingPageModuleVariantOptions = {},
): ResolveLandingPageModuleVariantResult {
  return resolveLandingPageModuleVariantWithDependenciesInternal(
    reference,
    options,
    canonicalDependencies,
  );
}

export function resolveLandingPageModuleVariantWithDependenciesInternal(
  reference: LandingPageModuleVariantReference,
  options: ResolveLandingPageModuleVariantOptions,
  dependencies: LandingPageModuleResolverDependenciesInternal,
): ResolveLandingPageModuleVariantResult {
  const parsedReference = landingPageModuleVariantReferenceSchema.safeParse(reference);
  if (!parsedReference.success) return failure("INCOMPATIBLE_REFERENCE");

  const requested = parsedReference.data;
  const catalog = dependencies.moduleCatalogRegistry[requested.moduleCatalogVersion];
  const fieldCatalog =
    dependencies.fieldCatalogRegistry[requested.moduleCatalogVersion];
  const variantCatalog =
    dependencies.variantCatalogRegistry[requested.moduleCatalogVersion];
  if (!catalog || !fieldCatalog || !variantCatalog) {
    return failure("UNKNOWN_MODULE_CATALOG_VERSION");
  }

  if (
    !landingPageModuleCatalogEntrySchema.safeParse(catalog).success ||
    !landingPageModuleFieldCatalogEntrySchema.safeParse(fieldCatalog).success ||
    !landingPageModuleVariantCatalogEntrySchema.safeParse(variantCatalog).success ||
    catalog.moduleCatalogVersion !== requested.moduleCatalogVersion ||
    fieldCatalog.moduleCatalogVersion !== requested.moduleCatalogVersion ||
    variantCatalog.moduleCatalogVersion !== requested.moduleCatalogVersion
  ) {
    return failure("INVALID_MODULE_CATALOG_CONTRACT");
  }

  if (!catalog.compatibleRootVersions.includes(requested.rootVersion)) {
    return failure("INCOMPATIBLE_ROOT_VERSION");
  }

  const moduleDefinition = catalog.modules[requested.moduleKey as LandingPageModuleKey];
  const fieldModule = fieldCatalog.modules[requested.moduleKey as LandingPageModuleKey];
  const variantModule = variantCatalog.modules[requested.moduleKey as LandingPageModuleKey];
  if (!moduleDefinition || !fieldModule || !variantModule) {
    return failure("UNKNOWN_MODULE");
  }
  if (
    moduleDefinition.moduleVersion !== requested.moduleVersion ||
    fieldModule.moduleVersion !== requested.moduleVersion ||
    variantModule.moduleVersion !== requested.moduleVersion
  ) {
    return failure("UNKNOWN_MODULE_VERSION");
  }

  const variant = variantModule.variants[requested.variantKey];
  if (!variant) return failure("UNKNOWN_VARIANT");
  if (variant.variantVersion !== requested.variantVersion) {
    return failure("UNKNOWN_VARIANT_VERSION");
  }
  if (
    moduleDefinition.moduleKey !== requested.moduleKey ||
    fieldModule.moduleKey !== requested.moduleKey ||
    variantModule.moduleKey !== requested.moduleKey ||
    variant.variantKey !== requested.variantKey ||
    variant.compatibleModuleVersion !== requested.moduleVersion
  ) {
    return failure("INCOMPATIBLE_REFERENCE");
  }
  const validReference = requested as LandingPageModuleVariantReference;

  const rootResolution = dependencies.resolveRootParameters({
    rootVersion: requested.rootVersion,
    ...(options.presetKey === undefined ? {} : { presetKey: options.presetKey }),
  });
  if (!rootResolution.ok) return failure("ROOT_RESOLUTION_FAILED");
  if (rootResolution.value.rootVersion !== requested.rootVersion) {
    return failure("INCOMPATIBLE_REFERENCE");
  }

  const effectiveLifecycleStatus =
    calculateLandingPageEffectiveLifecycleStatusInternal(
      rootResolution.value.lifecycleStatus,
      moduleDefinition.lifecycleStatus,
      variant.lifecycleStatus,
    );
  if (!effectiveLifecycleStatus) {
    return failure("INVALID_MODULE_CATALOG_CONTRACT");
  }

  const funnelCopyProfile = composeFunnelCopyProfiles(
    variantCatalog.funnelCopyProfiles,
    variantModule.funnelProfileDelta,
    variant.funnelProfileDelta,
  );
  if (!funnelCopyProfile) return failure("INVALID_MODULE_CATALOG_CONTRACT");

  const capabilities = variant.capabilities.map(
    (capabilityKey) => variantCatalog.capabilities[capabilityKey],
  );
  if (capabilities.some((capability) => capability === undefined)) {
    return failure("INVALID_MODULE_CATALOG_CONTRACT");
  }

  return deepFreeze(cloneJson({
    ok: true,
    value: {
      reference: validReference,
      rootParameters: rootResolution.value,
      module: moduleDefinition,
      variant,
      fields: variant.fields,
      capabilities,
      copySourceMap: variant.copySourceMap,
      funnelCopyProfile,
      rootLifecycleStatus: rootResolution.value.lifecycleStatus,
      moduleLifecycleStatus: moduleDefinition.lifecycleStatus,
      variantLifecycleStatus: variant.lifecycleStatus,
      effectiveLifecycleStatus,
      modulePurpose: moduleDefinition.purpose,
      variantPurpose: variant.purpose,
    },
  } satisfies ResolveLandingPageModuleVariantResult));
}

export function calculateLandingPageEffectiveLifecycleStatusInternal(
  rootStatus: string,
  moduleStatus: string,
  variantStatus: string,
): LandingPageModuleLifecycleStatus | undefined {
  const statuses = [rootStatus, moduleStatus, variantStatus];
  if (
    statuses.some(
      (status) =>
        !landingPageModuleLifecycleStatuses.includes(
          status as LandingPageModuleLifecycleStatus,
        ),
    )
  ) {
    return undefined;
  }
  if (statuses.includes("deprecated")) return "deprecated";
  if (statuses.includes("hypothesis")) return "hypothesis";
  return "validated";
}

function composeFunnelCopyProfiles(
  profiles: LandingPageModuleVariantCatalogRegistry[1]["funnelCopyProfiles"],
  moduleDelta: LandingPageModuleVariantCatalogRegistry[1]["modules"][LandingPageModuleKey]["funnelProfileDelta"],
  variantDelta: LandingPageModuleVariantCatalogRegistry[1]["modules"][LandingPageModuleKey]["funnelProfileDelta"],
): LandingPageEffectiveFunnelCopyProfileRegistry | undefined {
  const result = {} as Record<
    (typeof landingPageFunnelStages)[number],
    LandingPageEffectiveFunnelCopyProfileRegistry[(typeof landingPageFunnelStages)[number]]
  >;
  for (const stage of landingPageFunnelStages) {
    const moduleProfile = applyLandingPageFunnelProfileDeltaInternal(
      profiles[stage],
      moduleDelta[stage],
    );
    if (!moduleProfile) return undefined;
    const variantProfile = applyLandingPageFunnelProfileDeltaInternal(
      moduleProfile,
      variantDelta[stage],
    );
    if (!variantProfile) return undefined;

    const emphasized = [...new Set([
      ...moduleDelta[stage].emphasized,
      ...variantDelta[stage].emphasized,
    ])];
    if (emphasized.some((treatment) => variantProfile.prohibited.includes(treatment))) {
      return undefined;
    }
    result[stage] = { ...variantProfile, emphasized };
  }
  return result;
}

function failure(
  code: LandingPageModuleCatalogErrorCode,
): ResolveLandingPageModuleVariantResult {
  return deepFreeze({ ok: false, error: { code, message: safeMessages[code] } });
}

function cloneJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === "object") {
    for (const property of Object.getOwnPropertyNames(value)) {
      const nested = value[property as keyof T];
      if (nested && typeof nested === "object" && !Object.isFrozen(nested)) {
        deepFreeze(nested);
      }
    }
    Object.freeze(value);
  }
  return value;
}
