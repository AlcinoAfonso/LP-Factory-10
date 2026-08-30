export const LANDING_PAGE_VISUAL_BRIEF_VERSION = "e19.4-visual-brief-v1" as const;

export function buildLandingPageVisualPrompt(mediaBrief: string, semanticFacts: unknown) {
  return [
    `Visual brief version: ${LANDING_PAGE_VISUAL_BRIEF_VERSION}.`,
    "Create one sharp, landscape, representative editorial image for a landing-page hero.",
    "The image is scenic and illustrative, not a claim about a specific available property, client, real person, exact location, credential, result, testimonial, price, or commercial condition.",
    "Do not render logos, badges, legible text, contact details, UI, watermarks, or documents.",
    `Validated media brief: ${mediaBrief}`,
    `Authorized semantic facts: ${JSON.stringify(semanticFacts)}`,
  ].join("\n");
}
