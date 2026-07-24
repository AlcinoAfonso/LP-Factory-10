import type {
  LandingPageRootLifecycleStatus,
  LandingPageRootSemanticRoleKey,
} from "../index";

export const landingPageModuleKeys = [
  "hero",
  "trust_bar",
  "problem_solution",
  "offer",
  "benefits",
  "comparison",
  "process",
  "technical_assurance",
  "social_proof",
  "faq",
  "final_cta",
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

export const landingPageVariantCapabilities = [
  "primary_action",
  "image_asset",
  "accordion_interaction",
  "embedded_form",
] as const;

export const landingPageInteractionKinds = ["form", "accordion"] as const;

export const landingPageFormFieldValueTypes = ["text", "email", "phone"] as const;
export const landingPageFormFieldObligations = ["required", "optional"] as const;

export const landingPageResearchItemKeys = [
  "positioning_opportunity", "trigger", "desire", "pain", "objection",
  "proof_type", "belief", "fear", "narrative_arc", "awareness_level",
  "search_intent", "commercial_keywords", "faq_questions",
] as const;

export const landingPageFunnelProfileKeys = ["bofu", "mofu", "tofu"] as const;
export const landingPageCtaModes = ["direct_next_step", "non_coercive_direct", "low_pressure"] as const;
export const landingPageFunnelTreatmentKeysByProfile = {
  bofu: [
    "direct_next_step", "objection_response", "supported_proof",
    "supported_urgency", "supported_commercial_condition", "supported_price",
    "supported_deadline", "supported_guarantee", "supported_availability",
    "coercion", "unsupported_scarcity", "unsupported_promise",
    "unsupported_credential", "unsupported_result",
  ],
  mofu: [
    "education", "problem_solution_relation", "process", "technical_assurance", "faq",
    "direct_cta", "supported_offer", "supported_proof", "invented_price",
    "invented_urgency", "invented_guarantee", "invented_comparison", "invented_result",
  ],
  tofu: [
    "context", "problem_recognition", "desire", "introductory_education",
    "low_pressure_offer", "low_pressure_cta", "supported_factual_proof",
    "scarcity", "urgency", "guarantee", "commercial_condition", "result_promise",
  ],
} as const;

export type LandingPageModuleFamily = "landing_page";
export type LandingPageModuleCatalogVersion = 1;
export type LandingPageCompatibleRootVersion = 1;
export type LandingPageModuleKey = (typeof landingPageModuleKeys)[number];
export type LandingPageModuleVersion = 1;
export type LandingPageModuleLifecycleStatus = LandingPageRootLifecycleStatus;
export type LandingPageModulePurpose = "controlled_test";
export type LandingPageVariantFieldContractKey =
  `${LandingPageModuleKey}.${string}@v1`;
export type LandingPageFieldKind = (typeof landingPageFieldKinds)[number];
export type LandingPageFieldPolicy =
  (typeof landingPageFieldPolicies)[number];
export type LandingPageFieldSupport =
  (typeof landingPageFieldSupports)[number];
export type LandingPageVariantKey = LandingPageVariantFieldContractKey;
export type LandingPageVariantName = string;
export type LandingPageVariantVersion = 1;
export type LandingPageVariantCapability =
  (typeof landingPageVariantCapabilities)[number];
export type LandingPageVariantLifecycleStatus = LandingPageRootLifecycleStatus;
export type LandingPageResearchItemKey = (typeof landingPageResearchItemKeys)[number];
export type LandingPageFunnelProfileKey = (typeof landingPageFunnelProfileKeys)[number];
export type LandingPageCtaMode = (typeof landingPageCtaModes)[number];
export type LandingPageFunnelTreatmentKeyByProfile<
  ProfileKey extends LandingPageFunnelProfileKey,
> = (typeof landingPageFunnelTreatmentKeysByProfile)[ProfileKey][number];
export type LandingPageFunnelTreatmentKey =
  LandingPageFunnelTreatmentKeyByProfile<LandingPageFunnelProfileKey>;

export type LandingPageFunnelCopyProfile<
  ProfileKey extends LandingPageFunnelProfileKey = LandingPageFunnelProfileKey,
> = Readonly<{
  profileKey: ProfileKey;
  prioritizedSources: readonly LandingPageResearchItemKey[];
  permittedTreatments: readonly LandingPageFunnelTreatmentKeyByProfile<ProfileKey>[];
  restrictedTreatments: readonly LandingPageFunnelTreatmentKeyByProfile<ProfileKey>[];
  prohibitedTreatments: readonly LandingPageFunnelTreatmentKeyByProfile<ProfileKey>[];
  emphasizeTreatments: readonly [];
  ctaMode: LandingPageCtaMode;
}>;

export type LandingPageFunnelProfileDelta<
  ProfileKey extends LandingPageFunnelProfileKey = LandingPageFunnelProfileKey,
> = Readonly<{
  emphasizeTreatments: readonly [];
  restrictTreatments: readonly LandingPageFunnelTreatmentKeyByProfile<ProfileKey>[];
  prohibitTreatments: readonly LandingPageFunnelTreatmentKeyByProfile<ProfileKey>[];
}>;

// @ts-expect-error v1 rejects every non-empty emphasizeTreatments tuple.
type _LandingPageFunnelProfileDeltaV1RejectsEmphasis<Candidate extends LandingPageFunnelProfileDelta<"bofu">["emphasizeTreatments"] = readonly ["direct_next_step"]> = Candidate;

export type LandingPageFunnelCopyProfiles = Readonly<{
  [ProfileKey in LandingPageFunnelProfileKey]: LandingPageFunnelCopyProfile<ProfileKey>;
}>;

export type LandingPageFunnelProfileDeltas = Readonly<{
  [ProfileKey in LandingPageFunnelProfileKey]: LandingPageFunnelProfileDelta<ProfileKey>;
}>;

export type LandingPageCopySourceMap =
  | Readonly<{
      sourceMode: "research";
      researchPath: "endCustomer.researches[].items[]";
      primaryItemKeys: readonly [LandingPageResearchItemKey, LandingPageResearchItemKey?];
      auxiliaryItemKey?: LandingPageResearchItemKey;
    }>
  | Readonly<{
      sourceMode: "research_with_operational_support";
      researchPath: "endCustomer.researches[].items[]";
      primaryItemKeys: readonly [LandingPageResearchItemKey, LandingPageResearchItemKey?];
      auxiliaryItemKey?: LandingPageResearchItemKey;
      operationalSupport: Readonly<{
        requirement: "required_when_claimed";
        referenceKeys: readonly [string, ...string[]];
      }>;
    }>
  | Readonly<{
      sourceMode: "operational_evidence";
      evidencePath: string;
    }>;

export type LandingPageTextRangeRestriction = Readonly<{
  semanticRole: LandingPageRootSemanticRoleKey;
  recommended?: Readonly<{ min: number; max: number }>;
  absoluteMax?: number;
}>;

export type LandingPageRootSpecializationDelta = Readonly<{
  textRanges: readonly LandingPageTextRangeRestriction[];
}>;

export type LandingPageFormFieldDefinition = Readonly<{
  fieldKey: string;
  valueType: (typeof landingPageFormFieldValueTypes)[number];
  obligation: (typeof landingPageFormFieldObligations)[number];
  purposeKey: string;
}>;

export type LandingPageFormInteractionContract = Readonly<{
  kind: "form";
  fields: readonly [LandingPageFormFieldDefinition, ...LandingPageFormFieldDefinition[]];
  consent: Readonly<{
    required: true;
    fieldKey: "privacyConsent";
    purposeKey: "privacy_policy_consent";
    privacyPolicyInputFieldKey: "privacy_policy_url";
  }>;
  accessibility: Readonly<{
    baseline: "WCAG 2.2";
    labelsProgrammaticallyAssociated: true;
    instructionsProgrammaticallyAssociated: true;
    errorsProgrammaticallyAssociated: true;
    keyboardOperable: true;
    focusMovesToFirstInvalidField: true;
  }>;
  operationalBinding: Readonly<{
    inputCatalogFieldKey: "primary_conversion_channel";
    requiredValue: "form";
  }>;
}>;

export type LandingPageAccordionInteractionContract = Readonly<{
  kind: "accordion";
  baseline: "WCAG 2.2";
  keyboardOperable: true;
  exposesExpandedState: true;
  associatesControlAndRegion: true;
  preservesFocus: true;
  initiallyCollapsed: true;
  singleExpandedItem: true;
}>;

export type LandingPageInteractionKind =
  (typeof landingPageInteractionKinds)[number];

export type LandingPageInteractionContract =
  | LandingPageFormInteractionContract
  | LandingPageAccordionInteractionContract;

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
    copySourceMap: LandingPageCopySourceMap;
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
  compatibleRootVersion: LandingPageCompatibleRootVersion;
  rootDelta: LandingPageRootSpecializationDelta;
  capabilities: readonly LandingPageVariantCapability[];
  interactionContracts: readonly LandingPageInteractionContract[];
}>;

export type LandingPageModuleDefinition = Readonly<{
  family: LandingPageModuleFamily;
  moduleKey: LandingPageModuleKey;
  moduleVersion: LandingPageModuleVersion;
  lifecycleStatus: LandingPageModuleLifecycleStatus;
  purpose: LandingPageModulePurpose;
  compatibleRootVersion: LandingPageCompatibleRootVersion;
  rootDelta: LandingPageRootSpecializationDelta;
  funnelProfileDeltas: LandingPageFunnelProfileDeltas;
  structuralFunction: string;
  invariants: readonly string[];
  boundaries: readonly string[];
  permittedInteractionKinds: readonly LandingPageInteractionKind[];
}>;

export type LandingPageModuleCatalogRegistry = Readonly<{
  family: LandingPageModuleFamily;
  moduleCatalogVersion: LandingPageModuleCatalogVersion;
  compatibleRootVersions: readonly [LandingPageCompatibleRootVersion];
  funnelCopyProfiles: LandingPageFunnelCopyProfiles;
  modules: Readonly<
    Record<LandingPageModuleKey, LandingPageModuleDefinition>
  >;
  variantFieldContracts: Readonly<
    Record<LandingPageVariantFieldContractKey, LandingPageVariantFieldContract>
  >;
  variants: Readonly<Record<LandingPageVariantKey, LandingPageVariantDefinition>>;
}>;

export type LandingPageModuleCatalogErrorCode =
  | "UNKNOWN_MODULE_CATALOG_VERSION"
  | "INCOMPATIBLE_ROOT_VERSION"
  | "UNKNOWN_MODULE"
  | "UNKNOWN_MODULE_VERSION"
  | "UNKNOWN_VARIANT"
  | "UNKNOWN_FUNNEL_PROFILE"
  | "UNKNOWN_ROOT_PRESET"
  | "INVALID_INPUT"
  | "INVALID_MODULE_CATALOG_CONTRACT";

export type LandingPageModuleCatalogError = Readonly<{
  code: LandingPageModuleCatalogErrorCode;
  message: string;
}>;

export type ResolveLandingPageModuleCatalogInput = Readonly<{
  moduleCatalogVersion: number;
  rootVersion: number;
  rootPresetKey?: string;
  moduleKey: string;
  moduleVersion: number;
  variantName: string;
  variantVersion: number;
  funnelProfileKey: string;
}>;

export type ResolvedLandingPageModuleCatalog = Readonly<{
  family: LandingPageModuleFamily;
  moduleCatalogVersion: LandingPageModuleCatalogVersion;
  root: import("../index").LandingPageRootParameters;
  effectiveRoot: import("../index").LandingPageRootParameters;
  module: LandingPageModuleDefinition;
  variant: LandingPageVariantDefinition;
  fieldContract: LandingPageVariantFieldContract;
  funnelCopyProfile: LandingPageFunnelCopyProfile;
}>;

export type ResolveLandingPageModuleCatalogResult =
  | Readonly<{ ok: true; value: ResolvedLandingPageModuleCatalog }>
  | Readonly<{ ok: false; error: LandingPageModuleCatalogError }>;
