import type { ZodType } from "zod";

import { LANDING_PAGE_CHANNEL, type LandingPageModuleKey } from "./contracts";
import {
  benefitsCardsContentSchema,
  faqAccordionContentSchema,
  finalCtaSimpleContentSchema,
  heroLeadCaptureContentSchema,
  howItWorksStepsContentSchema,
  offerSummaryContentSchema,
  socialProofSimpleContentSchema,
  type LandingPageSectionContentByVariant,
  type LandingPageSectionVariant,
} from "./schemas";

type RegistryEntry<Variant extends LandingPageSectionVariant> = {
  channel: typeof LANDING_PAGE_CHANNEL;
  moduleKey: LandingPageModuleKey;
  variantKey: Variant;
  rendererKey: Variant;
  schema: ZodType<LandingPageSectionContentByVariant[Variant]>;
};

type Registry = {
  [Variant in LandingPageSectionVariant]: RegistryEntry<Variant>;
};

export const landingPageSectionRegistry = {
  "hero.lead_capture": {
    channel: LANDING_PAGE_CHANNEL,
    moduleKey: "hero",
    variantKey: "hero.lead_capture",
    rendererKey: "hero.lead_capture",
    schema: heroLeadCaptureContentSchema,
  },
  "benefits.cards": {
    channel: LANDING_PAGE_CHANNEL,
    moduleKey: "benefits",
    variantKey: "benefits.cards",
    rendererKey: "benefits.cards",
    schema: benefitsCardsContentSchema,
  },
  "offer.summary": {
    channel: LANDING_PAGE_CHANNEL,
    moduleKey: "offer",
    variantKey: "offer.summary",
    rendererKey: "offer.summary",
    schema: offerSummaryContentSchema,
  },
  "social_proof.simple": {
    channel: LANDING_PAGE_CHANNEL,
    moduleKey: "social_proof",
    variantKey: "social_proof.simple",
    rendererKey: "social_proof.simple",
    schema: socialProofSimpleContentSchema,
  },
  "how_it_works.steps": {
    channel: LANDING_PAGE_CHANNEL,
    moduleKey: "how_it_works",
    variantKey: "how_it_works.steps",
    rendererKey: "how_it_works.steps",
    schema: howItWorksStepsContentSchema,
  },
  "faq.accordion": {
    channel: LANDING_PAGE_CHANNEL,
    moduleKey: "faq",
    variantKey: "faq.accordion",
    rendererKey: "faq.accordion",
    schema: faqAccordionContentSchema,
  },
  "final_cta.simple": {
    channel: LANDING_PAGE_CHANNEL,
    moduleKey: "final_cta",
    variantKey: "final_cta.simple",
    rendererKey: "final_cta.simple",
    schema: finalCtaSimpleContentSchema,
  },
} satisfies Registry;

export function isLandingPageSectionVariant(
  value: string,
): value is LandingPageSectionVariant {
  return value in landingPageSectionRegistry;
}
