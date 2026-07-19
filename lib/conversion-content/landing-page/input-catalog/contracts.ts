export const landingPageInputCatalogPlans = [
  "starter",
  "lite",
  "pro",
  "ultra",
] as const;

export const landingPageInputCatalogEvidenceReferences = [
  "decision:lp-planning",
  "decision:e20-2-human",
  "technical:current-contracts",
  "empirical:real-estate-research",
  "context:real-estate-pilot",
] as const;

export type LandingPageInputCatalogPlan =
  (typeof landingPageInputCatalogPlans)[number];
export type LandingPageInputCatalogEvidenceReference =
  (typeof landingPageInputCatalogEvidenceReferences)[number];
export type LandingPageInputCatalogLayerLevel =
  | "universal"
  | "segment"
  | "niche"
  | "ultra_niche";
export type LandingPageInputValueType =
  | "string"
  | "phone"
  | "email"
  | "url"
  | "enum"
  | "string_list"
  | "boolean"
  | "number_range"
  | "keyword_map";
export type LandingPageInputValueScope =
  | "account"
  | "business"
  | "offer"
  | "campaign"
  | "landing_page";
export type LandingPageInputExpectedValueOrigin =
  | "account_provided"
  | "business_provided"
  | "offer_provided"
  | "campaign_provided"
  | "landing_page_provided";
export type LandingPageInputObligation =
  | "required"
  | "optional"
  | "conditional";

export type LandingPageInputCondition = Readonly<{
  fieldKey: string;
  operator: "equals" | "in";
  value: string | boolean | readonly string[];
}>;

export type LandingPageInputValidation =
  | Readonly<{ kind: "type_only" }>
  | Readonly<{ kind: "enum"; allowedValues: readonly string[] }>
  | Readonly<{
      kind: "string_list";
      allowedValues?: readonly string[];
      minItems?: number;
      maxItems?: number;
    }>
  | Readonly<{
      kind: "number_range";
      currency: "BRL";
      minimum?: number;
      maximum?: number;
    }>
  | Readonly<{ kind: "e164" }>
  | Readonly<{ kind: "email" }>
  | Readonly<{ kind: "https_url" }>
  | Readonly<{ kind: "keyword_map" }>;

export type LandingPageInputTypeValidationContract =
  | Readonly<{
      valueType: "string" | "boolean";
      validation: Extract<LandingPageInputValidation, { kind: "type_only" }>;
    }>
  | Readonly<{
      valueType: "phone";
      validation: Extract<LandingPageInputValidation, { kind: "e164" }>;
    }>
  | Readonly<{
      valueType: "email";
      validation: Extract<LandingPageInputValidation, { kind: "email" }>;
    }>
  | Readonly<{
      valueType: "url";
      validation: Extract<LandingPageInputValidation, { kind: "https_url" }>;
    }>
  | Readonly<{
      valueType: "enum";
      validation: Extract<LandingPageInputValidation, { kind: "enum" }>;
    }>
  | Readonly<{
      valueType: "string_list";
      validation: Extract<LandingPageInputValidation, { kind: "string_list" }>;
    }>
  | Readonly<{
      valueType: "number_range";
      validation: Extract<LandingPageInputValidation, { kind: "number_range" }>;
    }>
  | Readonly<{
      valueType: "keyword_map";
      validation: Extract<LandingPageInputValidation, { kind: "keyword_map" }>;
    }>;

export type LandingPageInputEvidence = Readonly<{
  summary: string;
  references: readonly LandingPageInputCatalogEvidenceReference[];
}>;

type LandingPageInputFieldDefinitionBase = Readonly<{
  kind: "field";
  fieldKey: string;
  purpose: string;
  originLayer: LandingPageInputCatalogLayerLevel;
  originTaxon?: LandingPageInputCatalogTaxonIdentity;
  valueScope: LandingPageInputValueScope;
  expectedValueOrigin: LandingPageInputExpectedValueOrigin;
  obligation: LandingPageInputObligation;
  requiredWhen?: LandingPageInputCondition;
  applicableWhen?: LandingPageInputCondition;
  allowedPlans: readonly LandingPageInputCatalogPlan[];
  snapshotPolicy: "include_if_used";
  evidence: LandingPageInputEvidence;
  createdInVersion: number;
}>;

export type LandingPageInputFieldDefinition =
  LandingPageInputFieldDefinitionBase & LandingPageInputTypeValidationContract;

export type LandingPageInputFieldSpecialization = Readonly<{
  kind: "specialization";
  fieldKey: string;
  changes: Readonly<Partial<Omit<LandingPageInputFieldDefinition, "kind" | "fieldKey">>>;
}>;

export type LandingPageInputCatalogLayerEntry =
  | LandingPageInputFieldDefinition
  | LandingPageInputFieldSpecialization;

export type LandingPageInputCatalogTaxonIdentity = Readonly<{
  id: string;
  name: string;
  slug: string;
  level: Exclude<LandingPageInputCatalogLayerLevel, "universal">;
  isActive: boolean;
  parentId: string | null;
}>;

export type LandingPageInputCatalogLayer = Readonly<{
  level: LandingPageInputCatalogLayerLevel;
  taxon?: LandingPageInputCatalogTaxonIdentity;
  entries: readonly LandingPageInputCatalogLayerEntry[];
}>;

export type LandingPageInputCatalogRegistryEntry = Readonly<{
  version: number;
  universal: LandingPageInputCatalogLayer;
  taxonLayers: Readonly<Record<string, LandingPageInputCatalogLayer>>;
}>;

export type LandingPageInputCatalogRegistry = Readonly<
  Record<number, LandingPageInputCatalogRegistryEntry>
>;

export type LandingPageInputCatalogTaxonChain = Readonly<{
  segment: LandingPageInputCatalogTaxonIdentity;
  niche?: LandingPageInputCatalogTaxonIdentity;
  ultraNiche?: LandingPageInputCatalogTaxonIdentity;
}>;

export type ResolveLandingPageInputCatalogInput = Readonly<{
  version: number;
  plan: LandingPageInputCatalogPlan | string;
  taxonChain: LandingPageInputCatalogTaxonChain;
  ultraNicheLayerAuthorized?: boolean;
}>;

export type LandingPageInputFieldProvenance = Readonly<{
  property: "definition" | "obligation" | "allowedPlans" | "validation";
  layer: LandingPageInputCatalogLayerLevel;
  taxon?: LandingPageInputCatalogTaxonIdentity;
}>;

export type ResolvedLandingPageInputField = LandingPageInputFieldDefinition &
  Readonly<{
    provenance: readonly LandingPageInputFieldProvenance[];
  }>;

export type ResolvedLandingPageInputCatalog = Readonly<{
  version: number;
  servedTaxon: LandingPageInputCatalogTaxonIdentity;
  plan: LandingPageInputCatalogPlan;
  appliedLayers: readonly Readonly<{
    level: LandingPageInputCatalogLayerLevel;
    taxon?: LandingPageInputCatalogTaxonIdentity;
  }>[];
  fields: readonly ResolvedLandingPageInputField[];
  valid: true;
}>;

export type LandingPageInputCatalogErrorCode =
  | "UNKNOWN_VERSION"
  | "INVALID_PLAN"
  | "INVALID_TAXON_CHAIN"
  | "INVALID_LAYER"
  | "UNAUTHORIZED_ULTRA_NICHE_LAYER"
  | "DUPLICATE_FIELD"
  | "IMMUTABLE_PROPERTY_CONFLICT"
  | "INVALID_SPECIALIZATION"
  | "INVALID_CONDITION"
  | "INVALID_VALIDATION"
  | "MISSING_EVIDENCE_ORIGIN"
  | "INVALID_PAID_SEARCH_KEYWORD_MAP";

export type ResolveLandingPageInputCatalogResult =
  | Readonly<{ ok: true; value: ResolvedLandingPageInputCatalog }>
  | Readonly<{
      ok: false;
      error: Readonly<{
        code: LandingPageInputCatalogErrorCode;
        message: string;
      }>;
    }>;

export type LandingPageInputValueValidationResult =
  | Readonly<{ ok: true }>
  | Readonly<{
      ok: false;
      error: Readonly<{
        code: "INVALID_VALUE";
        message: string;
      }>;
    }>;

export type LandingPageKeywordMapItem = Readonly<{
  keyword_or_cluster: string;
  message_anchor: string;
  ad_context?: string;
}>;
