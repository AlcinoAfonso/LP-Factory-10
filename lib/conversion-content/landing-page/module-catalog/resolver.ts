import { resolveLandingPageRootParameters } from "../index";
import type {
  LandingPageFunnelProfileKey,
  LandingPageModuleCatalogErrorCode,
  LandingPageModuleKey,
  LandingPageVariantKey,
  ResolveLandingPageModuleCatalogInput,
  ResolveLandingPageModuleCatalogResult,
} from "./contracts";
import { landingPageModuleCatalogRegistry } from "./registry";
import { landingPageModuleCatalogSchema } from "./schema";

export function resolveLandingPageModuleCatalog(
  input: ResolveLandingPageModuleCatalogInput,
): ResolveLandingPageModuleCatalogResult {
  if (input.moduleCatalogVersion !== 1) return failure("UNKNOWN_MODULE_CATALOG_VERSION", "Unknown landing-page module catalog version.");
  if (!landingPageModuleCatalogRegistry.compatibleRootVersions.includes(input.rootVersion as 1)) {
    return failure("INCOMPATIBLE_ROOT_VERSION", "Root version is incompatible with this module catalog.");
  }
  const parsed = landingPageModuleCatalogSchema.safeParse(landingPageModuleCatalogRegistry);
  if (!parsed.success) return failure("INVALID_MODULE_CATALOG_CONTRACT", "Landing-page module catalog contract is invalid.");

  const root = resolveLandingPageRootParameters({ rootVersion: input.rootVersion });
  if (!root.ok) return failure("INCOMPATIBLE_ROOT_VERSION", "Compatible root contract is unavailable or invalid.");

  if (!Object.hasOwn(landingPageModuleCatalogRegistry.modules, input.moduleKey)) {
    return failure("UNKNOWN_MODULE", "Unknown landing-page module.");
  }
  const moduleDefinition = landingPageModuleCatalogRegistry.modules[input.moduleKey as LandingPageModuleKey];
  if (moduleDefinition.moduleVersion !== input.moduleVersion) return failure("UNKNOWN_MODULE_VERSION", "Unknown landing-page module version.");

  const variantKey = `${input.moduleKey}.${input.variantName}@v${input.variantVersion}` as LandingPageVariantKey;
  if (!Object.hasOwn(landingPageModuleCatalogRegistry.variants, variantKey)) {
    return failure("UNKNOWN_VARIANT", "Unknown landing-page module variant.");
  }
  const variant = landingPageModuleCatalogRegistry.variants[variantKey];
  if (variant.moduleKey !== moduleDefinition.moduleKey || variant.moduleVersion !== moduleDefinition.moduleVersion) {
    return failure("INVALID_MODULE_CATALOG_CONTRACT", "Variant and module identities are incompatible.");
  }
  if (!Object.hasOwn(landingPageModuleCatalogRegistry.funnelCopyProfiles, input.funnelProfileKey)) {
    return failure("UNKNOWN_FUNNEL_PROFILE", "Unknown landing-page funnel profile.");
  }
  const profileKey = input.funnelProfileKey as LandingPageFunnelProfileKey;
  const fieldContract = landingPageModuleCatalogRegistry.variantFieldContracts[variant.fieldContractKey];
  if (!fieldContract) return failure("INVALID_MODULE_CATALOG_CONTRACT", "Variant field contract is unavailable.");

  return {
    ok: true,
    value: deepFreeze(structuredClone({
      family: landingPageModuleCatalogRegistry.family,
      moduleCatalogVersion: landingPageModuleCatalogRegistry.moduleCatalogVersion,
      root: root.value,
      module: moduleDefinition,
      variant,
      fieldContract,
      copySourceMaps: landingPageModuleCatalogRegistry.copySourceMaps,
      funnelCopyProfile: landingPageModuleCatalogRegistry.funnelCopyProfiles[profileKey],
      funnelProfileDelta: moduleDefinition.funnelProfileDeltas[profileKey],
    })),
  };
}

function failure(code: LandingPageModuleCatalogErrorCode, message: string): ResolveLandingPageModuleCatalogResult {
  return { ok: false, error: { code, message } };
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === "object") {
    for (const nested of Object.values(value)) deepFreeze(nested);
    Object.freeze(value);
  }
  return value;
}
