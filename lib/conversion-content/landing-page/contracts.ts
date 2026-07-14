export type LandingPageRootFamily = "landing_page";
export type LandingPageRootVersion = number;
export type LandingPageRootLifecycleStatus =
  | "hypothesis"
  | "validated"
  | "deprecated";
export type LandingPageRootSpacing = "compact" | "default" | "spacious";
export type LandingPageRootSemanticRoleKey =
  | "eyebrow"
  | "h1"
  | "h2"
  | "h3"
  | "paragraph"
  | "cta_label"
  | "privacy_note"
  | "faq_question"
  | "faq_answer"
  | "card_title"
  | "card_body"
  | "benefit_item"
  | "step_label"
  | "step_title"
  | "step_body";
export type LandingPageRootVisualRoleKey =
  | "primary_action"
  | "focus_indicator"
  | "border"
  | "surface"
  | "text"
  | "state";

export type LandingPageRootErrorCode =
  | "UNKNOWN_ROOT_VERSION"
  | "UNKNOWN_PRESET"
  | "INVALID_ROOT_CONTRACT";

export type LandingPageRootError = Readonly<{
  code: LandingPageRootErrorCode;
  message: string;
}>;

export type LandingPageRootTextRange = Readonly<{
  recommended: Readonly<{
    min: number;
    max: number;
  }>;
  absoluteMax: number;
}>;

export type LandingPageRootSemanticRole = Readonly<{
  key: LandingPageRootSemanticRoleKey;
  textRange: LandingPageRootTextRange;
}>;

export type LandingPageRootPresetTypography = Readonly<{
  h1: Readonly<{ min: string; max: string }>;
  h2: Readonly<{ min: string; max: string }>;
  h3: Readonly<{ min: string; max: string }>;
  body: Readonly<{ base: string; editorialEmphasis?: string }>;
  support: string;
}>;

export type LandingPageRootPreset = Readonly<{
  key: string;
  density: LandingPageRootSpacing;
  defaultSectionSpacing: LandingPageRootSpacing;
  maxPageWidth: string;
  maxReadingWidth: string;
  typography: LandingPageRootPresetTypography;
}>;

export type LandingPageRootCommonOptions = Readonly<{
  spacing: readonly LandingPageRootSpacing[];
}>;

export type LandingPageRootVisualRole = Readonly<{
  key: LandingPageRootVisualRoleKey;
  description: string;
}>;

export type LandingPageRootVisualCriteria = Readonly<{
  accessibilityBaseline: string;
  claimsFullWcagConformance: false;
  mobileFirst: true;
  minViewportPx: number;
  evidenceViewportsPx: readonly number[];
  noTextTruncation: true;
  noHorizontalScrollFromText: true;
  bodyTextMinSize: string;
  supportTextMinSize: string;
  minInteractiveTargetPx: Readonly<{ width: number; height: number }>;
  readingLineWidthCh: Readonly<{ min: number; max: number; target: number }>;
  h1MobileLineTarget: number;
  h2MobileLineTarget: number;
  semanticHierarchy: readonly ["h1", "h2", "h3"];
  visibleFocusRequired: true;
  visualHierarchyFollowsSemantic: true;
  contrastRequired: true;
  legibilityRequired: true;
  accessibleNavigationRequired: true;
  interactiveStatesRequired: true;
}>;

export type LandingPageRootRegistryEntry = Readonly<{
  family: LandingPageRootFamily;
  rootVersion: LandingPageRootVersion;
  lifecycleStatus: LandingPageRootLifecycleStatus;
  defaultPreset: string;
  semanticRoles: Readonly<Record<LandingPageRootSemanticRoleKey, LandingPageRootSemanticRole>>;
  commonOptions: LandingPageRootCommonOptions;
  visualRoles: Readonly<Record<LandingPageRootVisualRoleKey, LandingPageRootVisualRole>>;
  visualCriteria: LandingPageRootVisualCriteria;
  presets: Readonly<Record<string, LandingPageRootPreset>>;
}>;

export type LandingPageRootParameters = LandingPageRootRegistryEntry &
  Readonly<{
    resolvedPresetKey: string;
    resolvedPreset: LandingPageRootPreset;
  }>;

export type ResolveLandingPageRootParametersInput = Readonly<{
  rootVersion: number;
  presetKey?: string;
}>;

export type ResolveLandingPageRootParametersResult =
  | Readonly<{ ok: true; value: LandingPageRootParameters }>
  | Readonly<{ ok: false; error: LandingPageRootError }>;
