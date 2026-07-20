import type {
  LandingPageRootLifecycleStatus,
  LandingPageRootSemanticRoleKey,
} from "../contracts";

export const landingPageModuleKeys = [
  "hero",
  "trust_bar",
  "problem_solution",
  "offer",
  "process",
  "technical_assurance",
  "social_proof",
  "faq",
  "final_cta",
] as const;

export const landingPageVariantFieldContractKeys = [
  "hero.standard@v1",
  "trust_bar.standard@v1",
  "problem_solution.standard@v1",
  "offer.standard@v1",
  "process.standard@v1",
  "technical_assurance.standard@v1",
  "social_proof.standard@v1",
  "faq.standard@v1",
  "faq.accordion@v1",
  "final_cta.standard@v1",
] as const;

export const landingPageFieldKinds = [
  "text",
  "collection",
  "action",
  "image",
  "technical_reference",
] as const;

export const landingPageFieldPolicies = [
  "research_guided",
  "hybrid",
  "operational_required",
  "technical_reference",
  "not_copy",
] as const;

export const landingPageFieldSupports = [
  "when_factual",
  "when_present",
] as const;

export const landingPageVariantKeys = landingPageVariantFieldContractKeys;

export const landingPageVariantCapabilities = [
  "primary_action",
  "image_asset",
  "accordion_interaction",
] as const;

export type LandingPageModuleFamily = "landing_page";
export type LandingPageModuleCatalogVersion = 1;
export type LandingPageCompatibleRootVersion = 1;
export type LandingPageModuleKey = (typeof landingPageModuleKeys)[number];
export type LandingPageModuleVersion = 1;
export type LandingPageModuleLifecycleStatus = LandingPageRootLifecycleStatus;
export type LandingPageModulePurpose = "controlled_test";
export type LandingPageVariantFieldContractKey =
  (typeof landingPageVariantFieldContractKeys)[number];
export type LandingPageFieldKind = (typeof landingPageFieldKinds)[number];
export type LandingPageFieldPolicy =
  (typeof landingPageFieldPolicies)[number];
export type LandingPageFieldSupport =
  (typeof landingPageFieldSupports)[number];
export type LandingPageVariantKey = (typeof landingPageVariantKeys)[number];
export type LandingPageVariantName = "standard" | "accordion";
export type LandingPageVariantVersion = 1;
export type LandingPageVariantCapability =
  (typeof landingPageVariantCapabilities)[number];
export type LandingPageVariantLifecycleStatus = LandingPageRootLifecycleStatus;

export type LandingPageActionCompatibility = Readonly<{
  supportsPrimaryConversionForm: false;
}>;

export type LandingPageAccordionAccessibilityContract = Readonly<{
  baseline: "WCAG 2.2";
  keyboardOperable: true;
  exposesExpandedState: true;
  associatesControlAndRegion: true;
  preservesFocus: true;
  initiallyCollapsed: true;
  singleExpandedItem: true;
}>;

export type LandingPageFieldCardinality = Readonly<{
  min: number;
  max: number;
}>;

type LandingPageFieldBase = Readonly<{
  fieldKey: string;
  path: string;
  cardinality: LandingPageFieldCardinality;
  policy: LandingPageFieldPolicy;
}>;

export type LandingPageTextFieldDefinition = LandingPageFieldBase &
  Readonly<{
    fieldKind: "text";
    semanticRole: LandingPageRootSemanticRoleKey;
    support?: LandingPageFieldSupport;
  }>;

export type LandingPageTechnicalReferenceFieldDefinition =
  LandingPageFieldBase &
    Readonly<{
      fieldKind: "technical_reference";
      policy: "technical_reference";
    }>;

export type LandingPageCollectionItemFieldDefinition =
  | LandingPageTextFieldDefinition
  | LandingPageTechnicalReferenceFieldDefinition;

export type LandingPageCollectionFieldDefinition = LandingPageFieldBase &
  Readonly<{
    fieldKind: "collection";
    policy: "not_copy";
    itemFields: readonly LandingPageCollectionItemFieldDefinition[];
  }>;

export type LandingPageActionFieldDefinition = LandingPageFieldBase &
  Readonly<{
    fieldKind: "action";
    policy: "not_copy";
    label: LandingPageTextFieldDefinition;
    operationalBinding: "primary_conversion_channel";
  }>;

export type LandingPageImageFieldDefinition = LandingPageFieldBase &
  Readonly<{
    fieldKind: "image";
    policy: "technical_reference";
    alternativeTextRequiredWhenInformative: true;
  }>;

export type LandingPageFieldDefinition =
  | LandingPageTextFieldDefinition
  | LandingPageCollectionFieldDefinition
  | LandingPageActionFieldDefinition
  | LandingPageImageFieldDefinition
  | LandingPageTechnicalReferenceFieldDefinition;

export type LandingPageVariantFieldContract = Readonly<{
  fieldContractKey: LandingPageVariantFieldContractKey;
  fields: readonly LandingPageFieldDefinition[];
}>;

export type LandingPageVariantDefinition = Readonly<{
  variantKey: LandingPageVariantKey;
  variantName: LandingPageVariantName;
  variantVersion: LandingPageVariantVersion;
  moduleKey: LandingPageModuleKey;
  moduleVersion: LandingPageModuleVersion;
  fieldContractKey: LandingPageVariantFieldContractKey;
  lifecycleStatus: LandingPageVariantLifecycleStatus;
  purpose: LandingPageModulePurpose;
  capabilities: readonly LandingPageVariantCapability[];
  actionCompatibility?: LandingPageActionCompatibility;
  accordionAccessibility?: LandingPageAccordionAccessibilityContract;
}>;

export type LandingPageModuleDefinition = Readonly<{
  family: LandingPageModuleFamily;
  moduleKey: LandingPageModuleKey;
  moduleVersion: LandingPageModuleVersion;
  lifecycleStatus: LandingPageModuleLifecycleStatus;
  purpose: LandingPageModulePurpose;
  structuralFunction: string;
  invariants: readonly string[];
  boundaries: readonly string[];
}>;

export type LandingPageModuleCatalogRegistry = Readonly<{
  family: LandingPageModuleFamily;
  moduleCatalogVersion: LandingPageModuleCatalogVersion;
  compatibleRootVersions: readonly [LandingPageCompatibleRootVersion];
  modules: Readonly<
    Record<LandingPageModuleKey, LandingPageModuleDefinition>
  >;
  variantFieldContracts: Readonly<
    Record<LandingPageVariantFieldContractKey, LandingPageVariantFieldContract>
  >;
  variants: Readonly<Record<LandingPageVariantKey, LandingPageVariantDefinition>>;
}>;
