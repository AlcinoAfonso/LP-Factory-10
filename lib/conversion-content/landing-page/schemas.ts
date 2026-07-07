import { z } from "zod";

const shortText = z.string().trim().min(1).max(96);
const labelText = z.string().trim().min(1).max(48);
const titleText = z.string().trim().min(1).max(140);
const bodyText = z.string().trim().min(1).max(520);

const internalPath = z
  .string()
  .trim()
  .regex(/^\/(?!\/).+/, "href must start with a single slash");

const httpsUrl = z
  .string()
  .trim()
  .url()
  .refine((value) => {
    try {
      const url = new URL(value);
      return url.protocol === "https:" && Boolean(url.hostname);
    } catch {
      return false;
    }
  }, "href must be a valid https URL");

const safeHref = z.union([internalPath, httpsUrl]);

export const landingPageCtaSchema = z
  .object({
    label: labelText,
    href: safeHref,
  })
  .strict();

export const landingPageCardSchema = z
  .object({
    title: shortText,
    description: bodyText,
  })
  .strict();

export const heroLeadCaptureContentSchema = z
  .object({
    eyebrow: shortText.optional(),
    title: titleText,
    description: bodyText,
    primary_cta: landingPageCtaSchema,
    secondary_cta: landingPageCtaSchema.optional(),
    lead_prompt: shortText.optional(),
  })
  .strict();

export const benefitsCardsContentSchema = z
  .object({
    eyebrow: shortText.optional(),
    title: titleText,
    items: z.array(landingPageCardSchema).min(2).max(6),
  })
  .strict();

export const offerSummaryContentSchema = z
  .object({
    eyebrow: shortText.optional(),
    title: titleText,
    description: bodyText,
    bullets: z.array(shortText).min(2).max(6),
    cta: landingPageCtaSchema.optional(),
  })
  .strict();

export const socialProofSimpleContentSchema = z
  .object({
    eyebrow: shortText.optional(),
    title: titleText,
    proof_items: z.array(landingPageCardSchema).min(1).max(4),
  })
  .strict();

export const howItWorksStepsContentSchema = z
  .object({
    eyebrow: shortText.optional(),
    title: titleText,
    steps: z
      .array(
        z
          .object({
            label: z.string().trim().min(1).max(12),
            title: shortText,
            description: bodyText,
          })
          .strict(),
      )
      .min(2)
      .max(6),
  })
  .strict();

export const faqAccordionContentSchema = z
  .object({
    eyebrow: shortText.optional(),
    title: titleText,
    questions: z
      .array(
        z
          .object({
            question: titleText,
            answer: bodyText,
          })
          .strict(),
      )
      .min(2)
      .max(8),
  })
  .strict();

export const finalCtaSimpleContentSchema = z
  .object({
    title: titleText,
    description: bodyText,
    cta: landingPageCtaSchema,
  })
  .strict();

export const landingPageSectionEnvelopeSchema = z
  .object({
    composition_item_id: z.string().uuid(),
    content: z.record(z.string(), z.unknown()),
  })
  .strict();

export const landingPageContentV1Schema = z
  .object({
    schema_version: z.literal(1),
    channel: z.literal("landing_page"),
    sections: z.array(landingPageSectionEnvelopeSchema).min(1).max(12),
  })
  .strict();

export type LandingPageSectionVariant =
  | "hero.lead_capture"
  | "benefits.cards"
  | "offer.summary"
  | "social_proof.simple"
  | "how_it_works.steps"
  | "faq.accordion"
  | "final_cta.simple";

export type HeroLeadCaptureContent = z.infer<typeof heroLeadCaptureContentSchema>;
export type BenefitsCardsContent = z.infer<typeof benefitsCardsContentSchema>;
export type OfferSummaryContent = z.infer<typeof offerSummaryContentSchema>;
export type SocialProofSimpleContent = z.infer<
  typeof socialProofSimpleContentSchema
>;
export type HowItWorksStepsContent = z.infer<
  typeof howItWorksStepsContentSchema
>;
export type FaqAccordionContent = z.infer<typeof faqAccordionContentSchema>;
export type FinalCtaSimpleContent = z.infer<typeof finalCtaSimpleContentSchema>;
export type LandingPageContentV1 = z.infer<typeof landingPageContentV1Schema>;

export type LandingPageSectionContentByVariant = {
  "hero.lead_capture": HeroLeadCaptureContent;
  "benefits.cards": BenefitsCardsContent;
  "offer.summary": OfferSummaryContent;
  "social_proof.simple": SocialProofSimpleContent;
  "how_it_works.steps": HowItWorksStepsContent;
  "faq.accordion": FaqAccordionContent;
  "final_cta.simple": FinalCtaSimpleContent;
};

export type LandingPageSectionContent =
  LandingPageSectionContentByVariant[LandingPageSectionVariant];
