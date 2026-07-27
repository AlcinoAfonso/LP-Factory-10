import { validateLandingPageModuleIdentity } from "../module-catalog";
import type {
  LandingPageGenerationProfile,
  LandingPageGenerationProfileSource,
  ResolveLandingPageGenerationProfileResult,
  ResolvedLandingPageGenerationProfile,
} from "./contracts";
import {
  landingPageGenerationProfileSchema,
  landingPageGenerationProfileSourceSchema,
  landingPageGenerationProfileTaxonChainSchema,
} from "./schema";

export function resolveLandingPageGenerationProfile(
  source: unknown,
): ResolveLandingPageGenerationProfileResult {
  if (!isRecord(source)) {
    return failure("INVALID_TAXON_CHAIN", "Generation profile taxon chain is invalid.");
  }

  const parsedChain = landingPageGenerationProfileTaxonChainSchema.safeParse(
    source.taxonChain,
  );
  if (!parsedChain.success) {
    return failure("INVALID_TAXON_CHAIN", "Generation profile taxon chain is invalid.");
  }

  if (!Array.isArray(source.profiles)) {
    return failure("INVALID_PROFILE", "Generation profile collection is invalid.");
  }
  const parsedProfiles: LandingPageGenerationProfile[] = [];
  for (const profile of source.profiles) {
    const parsedProfile = landingPageGenerationProfileSchema.safeParse(profile);
    if (!parsedProfile.success) {
      return failure("INVALID_PROFILE", "Generation profile is invalid.");
    }
    parsedProfiles.push(parsedProfile.data);
  }

  const parsedSource = landingPageGenerationProfileSourceSchema.safeParse({
    taxonChain: parsedChain.data,
    profiles: parsedProfiles,
  });
  if (!parsedSource.success) {
    return failure("INVALID_PROFILE", "Generation profile source is invalid.");
  }

  const selectedProfile = selectNearestActiveProfile(parsedSource.data);
  if (!selectedProfile) {
    return {
      ok: true,
      value: deepFreeze({
        kind: "absent",
        servedTaxonId: parsedSource.data.taxonChain.servedTaxonId,
      }),
    };
  }

  for (const recommendation of selectedProfile.items) {
    const identity = validateLandingPageModuleIdentity({
      moduleKey: recommendation.moduleKey,
      moduleVersion: recommendation.moduleVersion,
      ...(recommendation.variantKey === undefined
        ? {}
        : {
            variantKey: recommendation.variantKey,
            variantVersion: recommendation.variantVersion,
          }),
    });
    if (!identity.ok) {
      return failure(
        "INVALID_PROFILE",
        `Generation profile contains an invalid module identity: ${identity.error.code}.`,
      );
    }
  }

  const resolved: ResolvedLandingPageGenerationProfile = {
    kind: "resolved",
    servedTaxonId: parsedSource.data.taxonChain.servedTaxonId,
    ownerTaxonId: selectedProfile.ownerTaxonId,
    profileId: selectedProfile.id,
    profileVersion: selectedProfile.version,
    relation:
      selectedProfile.ownerTaxonId === parsedSource.data.taxonChain.servedTaxonId
        ? "own"
        : "inherited",
    generationGuidance: selectedProfile.generationGuidance,
    recommendations: [...selectedProfile.items]
      .sort((left, right) => left.recommendedOrder - right.recommendedOrder)
      .map((item) => ({ ...item })),
  };

  return { ok: true, value: deepFreeze(resolved) };
}

function selectNearestActiveProfile(
  source: LandingPageGenerationProfileSource,
): LandingPageGenerationProfile | undefined {
  for (const node of source.taxonChain.nodes) {
    const profile = source.profiles.find(
      (candidate) =>
        candidate.ownerTaxonId === node.taxonId && candidate.status === "active",
    );
    if (profile) return profile;
  }
  return undefined;
}

function failure(
  code: Extract<ResolveLandingPageGenerationProfileResult, { ok: false }>[
    "error"
  ]["code"],
  message: string,
): Extract<ResolveLandingPageGenerationProfileResult, { ok: false }> {
  return { ok: false, error: { code, message } };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const nested of Object.values(value)) deepFreeze(nested);
  }
  return value;
}
