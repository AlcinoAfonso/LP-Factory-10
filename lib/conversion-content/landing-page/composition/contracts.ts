export const landingPageCompositionStatuses = [
  "draft",
  "active",
  "archived",
] as const;

export const landingPageCompositionOrigins = [
  "ai_proposal",
  "human_created",
  "human_adjusted",
] as const;

export const landingPageCompositionGapKinds = ["module", "variant"] as const;
export const landingPageCompositionGapDecisions = [
  "blocking",
  "deferred",
] as const;

export type LandingPageCompositionStatus =
  (typeof landingPageCompositionStatuses)[number];
export type LandingPageCompositionOrigin =
  (typeof landingPageCompositionOrigins)[number];
export type LandingPageCompositionGapKind =
  (typeof landingPageCompositionGapKinds)[number];
export type LandingPageCompositionGapDecision =
  (typeof landingPageCompositionGapDecisions)[number];
export type LandingPageCompositionValidationMode = "draft" | "activation";

export type LandingPageCompositionTaxon = Readonly<{
  id: string;
  name: string;
  slug: string;
  level: "segment" | "niche" | "ultra_niche";
  isActive: boolean;
  parentId: string | null;
}>;

export type LandingPageCompositionSourceSnapshots = Readonly<{
  root: Readonly<{
    rootVersion: number;
    presetKey: string;
  }>;
  moduleCatalog: Readonly<{
    moduleCatalogVersion: number;
  }>;
  research: Readonly<{
    servedTaxonId: string;
    versions: Readonly<{
      endCustomer: number;
      businessBuyer: number;
    }>;
    sourceTaxonIds: Readonly<{
      endCustomer: string;
      businessBuyer: string;
    }>;
  }>;
  inputCatalog: Readonly<{
    version: number;
  }>;
}>;

export type LandingPageCompositionItem = Readonly<{
  moduleKey: string;
  moduleVersion: number;
  variantName: string;
  variantVersion: number;
  order: number;
  required: boolean;
  options?: Readonly<{
    spacing?: "compact" | "default" | "spacious";
  }>;
  justification: string;
}>;

export type LandingPageCompositionGap = Readonly<{
  kind: LandingPageCompositionGapKind;
  structuralFunction: string;
  justification: string;
  impact: string;
  blocking: boolean;
  humanDecision: LandingPageCompositionGapDecision;
  deferralReason?: string;
  resumeCondition?: string;
}>;

export type LandingPageCompositionProvenance = Readonly<{
  origin: LandingPageCompositionOrigin;
  proposalSchemaVersion: number;
  model?: string;
  requestId?: string;
}>;

export type LandingPageCompositionDraft = Readonly<{
  ownerTaxon: LandingPageCompositionTaxon;
  version: number;
  status: "draft";
  sourceSnapshots: LandingPageCompositionSourceSnapshots;
  items: readonly LandingPageCompositionItem[];
  gaps: readonly LandingPageCompositionGap[];
  provenance: LandingPageCompositionProvenance;
}>;

export type ValidateLandingPageCompositionInput = Readonly<{
  mode: LandingPageCompositionValidationMode;
  funnelProfileKey: "bofu" | "mofu" | "tofu";
  ownerPolicy?: Readonly<{ ownCompositionAllowed: boolean }>;
  composition: unknown;
}>;

export type ValidatedLandingPageComposition = Readonly<{
  composition: LandingPageCompositionDraft;
  validationFingerprint: string;
  activationReady: boolean;
  formInteractionCount: number;
}>;

export type LandingPageCompositionValidationErrorCode =
  | "INVALID_INPUT"
  | "INACTIVE_OWNER_TAXON"
  | "UNAUTHORIZED_ULTRA_NICHE_OWNER"
  | "INVALID_SOURCE_SNAPSHOT"
  | "EMPTY_COMPOSITION"
  | "DUPLICATE_MODULE"
  | "INVALID_ORDER"
  | "UNKNOWN_CATALOG_REFERENCE"
  | "INCOMPATIBLE_LIFECYCLE"
  | "INVALID_OPTION"
  | "MULTIPLE_FORM_INTERACTIONS"
  | "BLOCKING_GAP";

export type ValidateLandingPageCompositionResult =
  | Readonly<{ ok: true; value: ValidatedLandingPageComposition }>
  | Readonly<{
      ok: false;
      error: Readonly<{
        code: LandingPageCompositionValidationErrorCode;
        message: string;
      }>;
    }>;
