export {
  LANDING_PAGE_PRESENTATION_CONTRACT_VERSION,
  landingPagePresentationCandidateSchema,
  landingPagePresentationJsonSchema,
  landingPagePresentationPromptRules,
  landingPagePresentationSectionSchema,
  validateLandingPagePresentationCandidate,
  type LandingPagePresentationCandidate,
  type LandingPagePresentationSection,
  type LandingPagePresentationValidationErrorCode,
  type LandingPagePresentationValidationResult,
} from "./authority";
export {
  LANDING_PAGE_DRAFT_PROMPT_VERSION,
  LANDING_PAGE_VISUAL_BRIEF_VERSION,
  buildLandingPageDraftPrompt,
  buildLandingPageVisualPrompt,
} from "./prompt";
