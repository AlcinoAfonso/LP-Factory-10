import type { LandingPageRootSemanticRoleKey } from "../contracts";

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

export const landingPageModuleLifecycleStatuses = [
  "hypothesis",
  "validated",
  "deprecated",
] as const;

export type LandingPageModuleKey = (typeof landingPageModuleKeys)[number];
export type LandingPageModuleLifecycleStatus =
  (typeof landingPageModuleLifecycleStatuses)[number];
export type LandingPageModulePurpose = "controlled_test";
export type LandingPageRootDelta = Readonly<Record<string, never>>;

export type LandingPageModuleDefinition = Readonly<{
  moduleKey: LandingPageModuleKey;
  moduleVersion: number;
  lifecycleStatus: LandingPageModuleLifecycleStatus;
  purpose: LandingPageModulePurpose;
  function: string;
  boundaries: readonly string[];
  invariants: readonly string[];
  rootDelta: LandingPageRootDelta;
}>;

export type LandingPageModuleCatalogEntry = Readonly<{
  family: "landing_page";
  moduleCatalogVersion: number;
  compatibleRootVersions: readonly number[];
  modules: Readonly<Record<LandingPageModuleKey, LandingPageModuleDefinition>>;
}>;

export type LandingPageModuleCatalogRegistry = Readonly<
  Record<number, LandingPageModuleCatalogEntry>
>;

export const landingPageFieldKinds = [
  "text",
  "collection",
  "action",
  "image",
  "reference",
] as const;

export const landingPageFieldPolicies = [
  "research_guided",
  "hybrid",
  "operational_required",
  "technical_reference",
  "not_copy",
] as const;

export const landingPageFieldSupports = [
  "none",
  "when_factual",
  "when_present",
] as const;

export type LandingPageFieldKind = (typeof landingPageFieldKinds)[number];
export type LandingPageFieldPolicy = (typeof landingPageFieldPolicies)[number];
export type LandingPageFieldSupport = (typeof landingPageFieldSupports)[number];
export type LandingPageFieldCardinality = Readonly<{
  min: number;
  max: number;
}>;

type LandingPageFieldDefinitionBase = Readonly<{
  path: string;
  cardinality: LandingPageFieldCardinality;
}>;

export type LandingPageTextFieldDefinition =
  LandingPageFieldDefinitionBase &
    Readonly<{
      fieldKind: "text";
      semanticRole: LandingPageRootSemanticRoleKey;
      policy: "research_guided" | "hybrid" | "operational_required";
      support: LandingPageFieldSupport;
    }>;

export type LandingPageCollectionFieldDefinition =
  LandingPageFieldDefinitionBase &
    Readonly<{
      fieldKind: "collection";
      policy: "not_copy";
      ordered?: true;
    }>;

export type LandingPageActionFieldDefinition =
  LandingPageFieldDefinitionBase &
    Readonly<{
      fieldKind: "action";
      policy: "not_copy";
    }>;

export type LandingPageImageFieldDefinition =
  LandingPageFieldDefinitionBase &
    Readonly<{
      fieldKind: "image";
      policy: "technical_reference";
      visibility: "all_viewports";
    }>;

export type LandingPageReferenceFieldDefinition =
  LandingPageFieldDefinitionBase &
    Readonly<{
      fieldKind: "reference";
      policy: "technical_reference";
      referenceKind: "operational_evidence";
    }>;

export type LandingPageFieldDefinition =
  | LandingPageTextFieldDefinition
  | LandingPageCollectionFieldDefinition
  | LandingPageActionFieldDefinition
  | LandingPageImageFieldDefinition
  | LandingPageReferenceFieldDefinition;

export type LandingPageModuleFieldDefinition = Readonly<{
  moduleKey: LandingPageModuleKey;
  moduleVersion: number;
  fields: Readonly<Record<string, LandingPageFieldDefinition>>;
}>;

export type LandingPageModuleFieldCatalogEntry = Readonly<{
  moduleCatalogVersion: number;
  modules: Readonly<
    Record<LandingPageModuleKey, LandingPageModuleFieldDefinition>
  >;
}>;

export type LandingPageModuleFieldCatalogRegistry = Readonly<
  Record<number, LandingPageModuleFieldCatalogEntry>
>;

export const landingPageVariantKeys = ["standard", "accordion"] as const;

export const landingPageCapabilityKeys = [
  "primary_action",
  "image_asset",
  "accordion_interaction",
] as const;

export const landingPageCopySourceModes = [
  "research",
  "operational_evidence",
] as const;

export const landingPageCopySourceItemKeyCatalog = {
  strategic_core: [
    "pain",
    "objection",
    "desire",
    "belief",
    "fear",
    "awareness_level",
    "trigger",
    "proof_type",
    "positioning_opportunity",
  ],
  seo: ["search_intent", "commercial_keywords", "faq_questions"],
} as const;

export const landingPageCopySourceItemKeys = [
  ...landingPageCopySourceItemKeyCatalog.strategic_core,
  ...landingPageCopySourceItemKeyCatalog.seo,
] as const;

export type LandingPageVariantKey = (typeof landingPageVariantKeys)[number];
export type LandingPageCapabilityKey =
  (typeof landingPageCapabilityKeys)[number];
export type LandingPageCopySourceMode =
  (typeof landingPageCopySourceModes)[number];
export type LandingPageCopySourceItemKey =
  (typeof landingPageCopySourceItemKeys)[number];

export type LandingPageResearchCopySource = Readonly<{
  sourceMode: "research";
  primaryItemKeys: readonly LandingPageCopySourceItemKey[];
  auxiliaryItemKey?: LandingPageCopySourceItemKey;
}>;

export type LandingPageOperationalEvidenceCopySource = Readonly<{
  sourceMode: "operational_evidence";
}>;

export type LandingPageCopySource =
  | LandingPageResearchCopySource
  | LandingPageOperationalEvidenceCopySource;

export type LandingPageCopySourceMap = Readonly<
  Record<string, LandingPageCopySource>
>;

export type LandingPagePrimaryActionCapability = Readonly<{
  capabilityKey: "primary_action";
  bindingFieldKey: "primary_conversion_channel";
  allowedValues: readonly ["whatsapp", "phone", "email", "external_url"];
}>;

export type LandingPageImageAssetCapability = Readonly<{
  capabilityKey: "image_asset";
  modes: readonly ["informative", "decorative"];
  visibility: "all_viewports";
  informativeRequiresAltText: true;
  decorativeRequiresEmptyAltText: true;
}>;

export type LandingPageAccordionInteractionCapability = Readonly<{
  capabilityKey: "accordion_interaction";
  initialState: "all_closed";
  expansionMode: "single";
  toggleMode: "own_control";
  keyboardRequired: true;
  stateExposed: true;
  controlContentAssociationRequired: true;
  focusPreserved: true;
  focusVisible: "inherited_from_root";
  wcagBaseline: "2.2";
}>;

export type LandingPageCapabilityDefinition =
  | LandingPagePrimaryActionCapability
  | LandingPageImageAssetCapability
  | LandingPageAccordionInteractionCapability;

export type LandingPageModuleVariantDefinition = Readonly<{
  variantKey: LandingPageVariantKey;
  variantVersion: number;
  lifecycleStatus: LandingPageModuleLifecycleStatus;
  purpose: LandingPageModulePurpose;
  compatibleModuleVersion: number;
  fields: Readonly<Record<string, LandingPageFieldDefinition>>;
  copySourceMap: LandingPageCopySourceMap;
  capabilities: readonly LandingPageCapabilityKey[];
  rootDelta: LandingPageRootDelta;
}>;

export type LandingPageModuleVariantCatalogModuleEntry = Readonly<{
  moduleKey: LandingPageModuleKey;
  moduleVersion: number;
  rootDelta: LandingPageRootDelta;
  variants: Readonly<Record<string, LandingPageModuleVariantDefinition>>;
}>;

export type LandingPageModuleVariantCatalogEntry = Readonly<{
  moduleCatalogVersion: number;
  capabilities: Readonly<
    Record<LandingPageCapabilityKey, LandingPageCapabilityDefinition>
  >;
  modules: Readonly<
    Record<LandingPageModuleKey, LandingPageModuleVariantCatalogModuleEntry>
  >;
}>;

export type LandingPageModuleVariantCatalogRegistry = Readonly<
  Record<number, LandingPageModuleVariantCatalogEntry>
>;
