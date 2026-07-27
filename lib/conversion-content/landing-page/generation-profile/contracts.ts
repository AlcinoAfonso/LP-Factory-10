export const landingPageGenerationProfileStatuses = [
  "draft",
  "active",
  "archived",
] as const;

export const landingPageGenerationProfilePriorities = ["P1", "P2", "P3"] as const;

export const landingPageGenerationProfileTaxonLevels = [
  "ultra_niche",
  "niche",
  "segment",
] as const;

export type LandingPageGenerationProfileStatus =
  (typeof landingPageGenerationProfileStatuses)[number];
export type LandingPageGenerationProfilePriority =
  (typeof landingPageGenerationProfilePriorities)[number];
export type LandingPageGenerationProfileTaxonLevel =
  (typeof landingPageGenerationProfileTaxonLevels)[number];

export type LandingPageGenerationProfileItem = Readonly<{
  id: string;
  moduleKey: string;
  moduleVersion: number;
  variantKey?: string;
  variantVersion?: number;
  priority: LandingPageGenerationProfilePriority;
  recommendedOrder: number;
  itemGuidance?: string;
}>;

export type LandingPageGenerationProfile = Readonly<{
  id: string;
  ownerTaxonId: string;
  version: number;
  status: LandingPageGenerationProfileStatus;
  generationGuidance: string;
  items: readonly LandingPageGenerationProfileItem[];
}>;

export type LandingPageGenerationProfileTaxonNode = Readonly<{
  taxonId: string;
  level: LandingPageGenerationProfileTaxonLevel;
  parentId: string | null;
  status: "active" | "inactive";
}>;

export type LandingPageGenerationProfileTaxonChain = Readonly<{
  servedTaxonId: string;
  nodes: readonly LandingPageGenerationProfileTaxonNode[];
}>;

export type LandingPageGenerationProfileSource = Readonly<{
  taxonChain: LandingPageGenerationProfileTaxonChain;
  profiles: readonly LandingPageGenerationProfile[];
}>;

export type LandingPageGenerationProfileSourceErrorCode =
  | "INVALID_TAXON_ID"
  | "TAXON_NOT_FOUND"
  | "READ_FAILED"
  | "INVALID_TAXON_CHAIN"
  | "INVALID_PROFILE";

export type LoadLandingPageGenerationProfileSourceResult =
  | Readonly<{ ok: true; value: LandingPageGenerationProfileSource }>
  | Readonly<{
      ok: false;
      error: Readonly<{
        code: LandingPageGenerationProfileSourceErrorCode;
        message: string;
      }>;
    }>;

export type ResolvedLandingPageGenerationProfile = Readonly<{
  kind: "resolved";
  servedTaxonId: string;
  ownerTaxonId: string;
  profileId: string;
  profileVersion: number;
  relation: "own" | "inherited";
  generationGuidance: string;
  recommendations: readonly LandingPageGenerationProfileItem[];
}>;

export type AbsentLandingPageGenerationProfile = Readonly<{
  kind: "absent";
  servedTaxonId: string;
}>;

export type ResolveLandingPageGenerationProfileResult =
  | Readonly<{
      ok: true;
      value:
        | ResolvedLandingPageGenerationProfile
        | AbsentLandingPageGenerationProfile;
    }>
  | Readonly<{
      ok: false;
      error: Readonly<{
        code: LandingPageGenerationProfileSourceErrorCode;
        message: string;
      }>;
    }>;
