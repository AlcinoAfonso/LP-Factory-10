export const factualTaxonLevels = ["segment", "niche", "ultra_niche"] as const;
export const factualFieldValueTypes = [
  "string", "phone", "email", "url", "enum", "string_list", "boolean",
  "number_range", "keyword_map", "asset_reference", "color_palette", "offering_scope",
] as const;
export const factualFieldValueScopes = ["account", "business", "offer", "campaign", "landing_page"] as const;
export const factualFieldExpectedOrigins = [
  "account_provided", "business_provided", "offer_provided", "campaign_provided", "landing_page_provided",
] as const;
export const factualFieldObligations = ["required", "optional", "conditional"] as const;

export type FactualTaxonLevel = (typeof factualTaxonLevels)[number];
export type FactualFieldValueType = (typeof factualFieldValueTypes)[number];
export type FactualFieldValueScope = (typeof factualFieldValueScopes)[number];
export type FactualFieldExpectedOrigin = (typeof factualFieldExpectedOrigins)[number];
export type FactualFieldObligation = (typeof factualFieldObligations)[number];

export type FactualTaxonIdentity = Readonly<{
  id: string; name: string; slug: string; level: FactualTaxonLevel; isActive: boolean; parentId: string | null;
}>;

export type FactualTaxonChain = Readonly<{
  segment: FactualTaxonIdentity; niche?: FactualTaxonIdentity; ultraNiche?: FactualTaxonIdentity;
}>;

export type FactualFieldCondition = Readonly<{
  fieldKey: string; operator: "equals" | "in"; value: string | boolean | readonly string[];
}>;

export type FactualFieldValidation =
  | Readonly<{ kind: "type_only" }>
  | Readonly<{ kind: "enum"; allowedValues: readonly string[] }>
  | Readonly<{ kind: "string_list"; allowedValues?: readonly string[]; minItems?: number; maxItems?: number }>
  | Readonly<{ kind: "number_range"; currency: "BRL"; minimum?: number; maximum?: number }>
  | Readonly<{ kind: "e164" | "email" | "https_url" | "keyword_map" | "asset_reference" | "color_palette" | "offering_scope" }>;

export type FactualFieldDefinition = Readonly<{
  purpose: string;
  valueType: FactualFieldValueType;
  valueScope: FactualFieldValueScope;
  expectedValueOrigin: FactualFieldExpectedOrigin;
  obligation: FactualFieldObligation;
  requiredWhen?: FactualFieldCondition;
  applicableWhen?: FactualFieldCondition;
  validation: FactualFieldValidation;
}>;

export type FactualFieldRow = Readonly<{
  id: string; fieldKey: string; taxonId: string | null; definition: FactualFieldDefinition; isActive: boolean;
  createdBy: string | null; updatedBy: string | null; createdAt: string; updatedAt: string;
}>;

export type ResolvedFactualField = FactualFieldDefinition & Readonly<{
  id: string; fieldKey: string; taxonId: string | null;
  originLayer: "universal" | FactualTaxonLevel; originTaxon: FactualTaxonIdentity | null;
  ownership: "own" | "inherited"; isActive: boolean; updatedAt: string;
}>;

export type ResolvedFactualCoverage = Readonly<{
  servedTaxon: FactualTaxonIdentity;
  appliedLayers: readonly Readonly<{ level: "universal" | FactualTaxonLevel; taxon: FactualTaxonIdentity | null }>[];
  fields: readonly ResolvedFactualField[];
}>;

export type FactualCoverageErrorCode =
  | "INVALID_TAXON_CHAIN" | "DUPLICATE_FIELD_KEY" | "INVALID_FIELD_ROW"
  | "INVALID_FIELD_DEFINITION" | "FIELD_OUTSIDE_CHAIN" | "MISSING_CONDITION_REFERENCE";

export type ResolveFactualCoverageResult =
  | Readonly<{ ok: true; value: ResolvedFactualCoverage }>
  | Readonly<{ ok: false; error: Readonly<{ code: FactualCoverageErrorCode; message: string }> }>;

export type BuildFactualTaxonChainResult =
  | Readonly<{ ok: true; value: FactualTaxonChain }>
  | Readonly<{ ok: false; error: Readonly<{ code: "INVALID_TAXON_CHAIN"; message: string }> }>;
