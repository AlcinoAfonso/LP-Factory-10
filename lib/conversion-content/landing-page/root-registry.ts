import type { LandingPageRootRegistryEntry } from "./contracts";

export const landingPageRootRegistry = deepFreeze({
  1: {
    family: "landing_page",
    rootVersion: 1,
    lifecycleStatus: "hypothesis",
    defaultPreset: "balanced",
    semanticRoles: {
      eyebrow: textRole("eyebrow", 12, 48, 64),
      h1: textRole("h1", 36, 72, 120),
      h2: textRole("h2", 28, 64, 100),
      h3: textRole("h3", 20, 56, 80),
      paragraph: textRole("paragraph", 80, 240, 420),
      cta_label: textRole("cta_label", 10, 32, 40),
      privacy_note: textRole("privacy_note", 40, 180, 280),
      faq_question: textRole("faq_question", 32, 96, 140),
      faq_answer: textRole("faq_answer", 120, 420, 700),
      card_title: textRole("card_title", 18, 56, 80),
      card_body: textRole("card_body", 70, 220, 360),
      benefit_item: textRole("benefit_item", 24, 96, 140),
      step_label: textRole("step_label", 2, 16, 24),
      step_title: textRole("step_title", 18, 56, 80),
      step_body: textRole("step_body", 60, 180, 320),
    },
    commonOptions: {
      spacing: ["compact", "default", "spacious"],
    },
    visualRoles: {
      primary_action: visualRole(
        "primary_action",
        "Abstract role for the main conversion action treatment.",
      ),
      focus_indicator: visualRole(
        "focus_indicator",
        "Abstract role for visible keyboard focus treatment.",
      ),
      border: visualRole("border", "Abstract role for edge and divider treatment."),
      surface: visualRole(
        "surface",
        "Abstract role for page and section surface treatment.",
      ),
      text: visualRole("text", "Abstract role for text color treatment."),
      state: visualRole("state", "Abstract role for feedback state treatment."),
    },
    visualCriteria: {
      accessibilityBaseline: "WCAG 2.2 reference baseline",
      claimsFullWcagConformance: false,
      mobileFirst: true,
      minViewportPx: 320,
      evidenceViewportsPx: [360, 768, 1280],
      noTextTruncation: true,
      noHorizontalScrollFromText: true,
      bodyTextMinSize: "1rem",
      supportTextMinSize: "0.875rem",
      minInteractiveTargetPx: { width: 44, height: 44 },
      readingLineWidthCh: { min: 45, max: 75, target: 68 },
      h1MobileLineTarget: 4,
      h2MobileLineTarget: 3,
      semanticHierarchy: ["h1", "h2", "h3"],
      visibleFocusRequired: true,
      visualHierarchyFollowsSemantic: true,
      contrastRequired: true,
      legibilityRequired: true,
      accessibleNavigationRequired: true,
      interactiveStatesRequired: true,
    },
    presets: {
      balanced: {
        key: "balanced",
        density: "default",
        defaultSectionSpacing: "default",
        maxPageWidth: "72rem",
        maxReadingWidth: "68ch",
        typography: {
          h1: { min: "2.25rem", max: "3rem" },
          h2: { min: "1.5rem", max: "1.875rem" },
          h3: { min: "1.125rem", max: "1.125rem" },
          body: { base: "1rem", editorialEmphasis: "1.125rem" },
          support: "0.875rem",
        },
      },
      compact: {
        key: "compact",
        density: "compact",
        defaultSectionSpacing: "compact",
        maxPageWidth: "68rem",
        maxReadingWidth: "64ch",
        typography: {
          h1: { min: "2rem", max: "2.5rem" },
          h2: { min: "1.375rem", max: "1.75rem" },
          h3: { min: "1.0625rem", max: "1.125rem" },
          body: { base: "1rem" },
          support: "0.875rem",
        },
      },
    },
  },
} satisfies Readonly<Record<number, LandingPageRootRegistryEntry>>);

export type LandingPageRootRegistry = typeof landingPageRootRegistry;

function textRole(
  key: LandingPageRootRegistryEntry["semanticRoles"][keyof LandingPageRootRegistryEntry["semanticRoles"]]["key"],
  recommendedMin: number,
  recommendedMax: number,
  absoluteMax: number,
) {
  return {
    key,
    textRange: {
      recommended: {
        min: recommendedMin,
        max: recommendedMax,
      },
      absoluteMax,
    },
  };
}

function visualRole(
  key: LandingPageRootRegistryEntry["visualRoles"][keyof LandingPageRootRegistryEntry["visualRoles"]]["key"],
  description: string,
) {
  return { key, description };
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === "object") {
    for (const property of Object.getOwnPropertyNames(value)) {
      const nested = value[property as keyof T];
      if (nested && typeof nested === "object" && !Object.isFrozen(nested)) {
        deepFreeze(nested);
      }
    }
    Object.freeze(value);
  }
  return value;
}
