import { z } from "zod";

import {
  resolveLandingPageRootParameters,
  type LandingPageRootParameters,
  type LandingPageRootSemanticRoleKey,
} from "../index";
import type {
  LandingPageFunnelCopyProfile,
  LandingPageFunnelProfileDelta,
  LandingPageFunnelProfileKey,
  LandingPageModuleCatalogErrorCode,
  LandingPageModuleCatalogRegistry,
  LandingPageModuleKey,
  LandingPageRootSpecializationDelta,
  LandingPageVariantKey,
  ResolveLandingPageModuleCatalogInput,
  ResolveLandingPageModuleCatalogResult,
} from "./contracts";
import { landingPageModuleCatalogRegistry } from "./registry";
import { landingPageModuleCatalogSchema } from "./schema";

const resolverInputSchema = z.object({
  moduleCatalogVersion: z.number().int(),
  rootVersion: z.number().int(),
  rootPresetKey: z.string().trim().min(1).optional(),
  moduleKey: z.string().trim().min(1),
  moduleVersion: z.number().int(),
  variantName: z.string().trim().min(1),
  variantVersion: z.number().int(),
  funnelProfileKey: z.string().trim().min(1),
}).strict();

export function resolveLandingPageModuleCatalog(
  input: unknown,
): ResolveLandingPageModuleCatalogResult {
  return resolveLandingPageModuleCatalogFromRegistry(
    input,
    landingPageModuleCatalogRegistry,
  );
}

export function resolveLandingPageModuleCatalogFromRegistry(
  input: unknown,
  registry: LandingPageModuleCatalogRegistry,
): ResolveLandingPageModuleCatalogResult {
  const parsedInput = resolverInputSchema.safeParse(input);
  if (!parsedInput.success) {
    return failure("INVALID_INPUT", "Landing-page module catalog input is invalid.");
  }
  const validInput = parsedInput.data satisfies ResolveLandingPageModuleCatalogInput;

  if (validInput.moduleCatalogVersion !== registry.moduleCatalogVersion) {
    return failure("UNKNOWN_MODULE_CATALOG_VERSION", "Unknown landing-page module catalog version.");
  }
  if (!registry.compatibleRootVersions.includes(validInput.rootVersion as 1)) {
    return failure("INCOMPATIBLE_ROOT_VERSION", "Root version is incompatible with this module catalog.");
  }
  const parsedRegistry = landingPageModuleCatalogSchema.safeParse(registry);
  if (!parsedRegistry.success) {
    return failure("INVALID_MODULE_CATALOG_CONTRACT", "Landing-page module catalog contract is invalid.");
  }

  const root = resolveLandingPageRootParameters({
    rootVersion: validInput.rootVersion,
    ...(validInput.rootPresetKey ? { presetKey: validInput.rootPresetKey } : {}),
  });
  if (!root.ok) {
    return root.error.code === "UNKNOWN_PRESET"
      ? failure("UNKNOWN_ROOT_PRESET", root.error.message)
      : failure("INCOMPATIBLE_ROOT_VERSION", "Compatible root contract is unavailable or invalid.");
  }

  if (!Object.hasOwn(registry.modules, validInput.moduleKey)) {
    return failure("UNKNOWN_MODULE", "Unknown landing-page module.");
  }
  const moduleDefinition = registry.modules[validInput.moduleKey as LandingPageModuleKey];
  if (moduleDefinition.moduleVersion !== validInput.moduleVersion) {
    return failure("UNKNOWN_MODULE_VERSION", "Unknown landing-page module version.");
  }

  const variantKey = `${validInput.moduleKey}.${validInput.variantName}@v${validInput.variantVersion}` as LandingPageVariantKey;
  if (!Object.hasOwn(registry.variants, variantKey)) {
    return failure("UNKNOWN_VARIANT", "Unknown landing-page module variant.");
  }
  const variant = registry.variants[variantKey];
  if (variant.moduleKey !== moduleDefinition.moduleKey || variant.moduleVersion !== moduleDefinition.moduleVersion) {
    return failure("INVALID_MODULE_CATALOG_CONTRACT", "Variant and module identities are incompatible.");
  }
  if (!Object.hasOwn(registry.funnelCopyProfiles, validInput.funnelProfileKey)) {
    return failure("UNKNOWN_FUNNEL_PROFILE", "Unknown landing-page funnel profile.");
  }
  const profileKey = validInput.funnelProfileKey as LandingPageFunnelProfileKey;
  const fieldContract = registry.variantFieldContracts[variant.fieldContractKey];
  if (!fieldContract) {
    return failure("INVALID_MODULE_CATALOG_CONTRACT", "Variant field contract is unavailable.");
  }

  const effectiveRoot = applyRootDelta(
    applyRootDelta(root.value, moduleDefinition.rootDelta),
    variant.rootDelta,
  );
  const effectiveProfile = applyFunnelProfileDelta(
    registry.funnelCopyProfiles[profileKey] as LandingPageFunnelCopyProfile,
    moduleDefinition.funnelProfileDeltas[profileKey] as LandingPageFunnelProfileDelta,
  );

  return {
    ok: true,
    value: deepFreeze(structuredClone({
      family: registry.family,
      moduleCatalogVersion: registry.moduleCatalogVersion,
      root: root.value,
      effectiveRoot,
      module: moduleDefinition,
      variant,
      fieldContract,
      funnelCopyProfile: effectiveProfile,
    })),
  };
}

function applyRootDelta(
  parent: LandingPageRootParameters,
  delta: LandingPageRootSpecializationDelta,
): LandingPageRootParameters {
  const semanticRoles = structuredClone(parent.semanticRoles) as Record<
    LandingPageRootSemanticRoleKey,
    LandingPageRootParameters["semanticRoles"][LandingPageRootSemanticRoleKey]
  >;
  for (const restriction of delta.textRanges) {
    const role = restriction.semanticRole as LandingPageRootSemanticRoleKey;
    const parentRole = semanticRoles[role];
    semanticRoles[role] = {
      ...parentRole,
      textRange: {
        recommended: restriction.recommended ?? parentRole.textRange.recommended,
        absoluteMax: restriction.absoluteMax ?? parentRole.textRange.absoluteMax,
      },
    };
  }
  return { ...structuredClone(parent), semanticRoles };
}

function applyFunnelProfileDelta(
  profile: LandingPageFunnelCopyProfile,
  delta: LandingPageFunnelProfileDelta,
): LandingPageFunnelCopyProfile {
  const permitted = new Set<string>(profile.permittedTreatments);
  const restricted = new Set<string>(profile.restrictedTreatments);
  const prohibited = new Set<string>(profile.prohibitedTreatments);

  for (const treatment of delta.restrictTreatments) {
    if (prohibited.has(treatment)) continue;
    permitted.delete(treatment);
    restricted.add(treatment);
  }
  for (const treatment of delta.prohibitTreatments) {
    permitted.delete(treatment);
    restricted.delete(treatment);
    prohibited.add(treatment);
  }

  return {
    ...profile,
    permittedTreatments: [...permitted],
    restrictedTreatments: [...restricted],
    prohibitedTreatments: [...prohibited],
    emphasizeTreatments: [],
  } as LandingPageFunnelCopyProfile;
}

function failure(
  code: LandingPageModuleCatalogErrorCode,
  message: string,
): ResolveLandingPageModuleCatalogResult {
  return { ok: false, error: { code, message } };
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === "object") {
    for (const nested of Object.values(value)) deepFreeze(nested);
    Object.freeze(value);
  }
  return value;
}
