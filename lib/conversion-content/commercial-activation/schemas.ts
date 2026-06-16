import { z } from "zod";

const nonEmptyText = z.string().trim().min(1).max(220);
const shortText = z.string().trim().min(1).max(96);
const bodyText = z.string().trim().min(1).max(480);
const ctaLabel = z.string().trim().min(1).max(40);

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

export const ctaSchema = z
  .object({
    label: ctaLabel,
    href: safeHref,
  })
  .strict();

export const cardSchema = z
  .object({
    title: shortText,
    description: bodyText,
  })
  .strict();

export const heroDefaultContentSchema = z
  .object({
    eyebrow: shortText,
    title: z.string().trim().min(1).max(140),
    description: bodyText,
    primary_cta: ctaSchema,
    secondary_cta: ctaSchema.optional(),
  })
  .strict();

export const benefitsCardsContentSchema = z
  .object({
    eyebrow: shortText,
    title: nonEmptyText,
    items: z.array(cardSchema).min(2).max(6),
  })
  .strict();

export const servicesListContentSchema = z
  .object({
    eyebrow: shortText,
    title: nonEmptyText,
    items: z.array(shortText).min(3).max(8),
  })
  .strict();

export const plansCardsContentSchema = z
  .object({
    eyebrow: shortText,
    title: nonEmptyText,
    disclaimer: bodyText.optional(),
    plans: z
      .array(
        z
          .object({
            key: z.string().trim().min(1).max(40),
            name: shortText,
            price: shortText,
            period: z.string().trim().min(1).max(24),
            description: bodyText,
            features: z.array(shortText).min(2).max(8),
            highlighted: z.boolean().default(false),
            cta: ctaSchema,
          })
          .strict(),
      )
      .min(1)
      .max(4),
  })
  .strict();

export const differentialsCardsContentSchema = z
  .object({
    eyebrow: shortText,
    title: nonEmptyText,
    items: z.array(cardSchema).min(2).max(6),
  })
  .strict();

export const howItWorksStepsContentSchema = z
  .object({
    eyebrow: shortText,
    title: nonEmptyText,
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
    eyebrow: shortText,
    title: nonEmptyText,
    questions: z
      .array(
        z
          .object({
            question: nonEmptyText,
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
    title: nonEmptyText,
    description: bodyText,
    cta: ctaSchema,
  })
  .strict();

export const commercialActivationSectionEnvelopeSchema = z
  .object({
    composition_item_id: z.string().uuid(),
    content: z.record(z.string(), z.unknown()),
  })
  .strict();

export const commercialActivationContentV1Schema = z
  .object({
    schema_version: z.literal(1),
    sections: z.array(commercialActivationSectionEnvelopeSchema).min(1).max(16),
  })
  .strict();

export type CommercialActivationSectionVariant =
  | "hero.default"
  | "benefits.cards"
  | "services.list"
  | "plans.cards"
  | "differentials.cards"
  | "how_it_works.steps"
  | "faq.accordion"
  | "final_cta.simple";

export type HeroDefaultContent = z.infer<typeof heroDefaultContentSchema>;
export type BenefitsCardsContent = z.infer<typeof benefitsCardsContentSchema>;
export type ServicesListContent = z.infer<typeof servicesListContentSchema>;
export type PlansCardsContent = z.infer<typeof plansCardsContentSchema>;
export type DifferentialsCardsContent = z.infer<
  typeof differentialsCardsContentSchema
>;
export type HowItWorksStepsContent = z.infer<
  typeof howItWorksStepsContentSchema
>;
export type FaqAccordionContent = z.infer<typeof faqAccordionContentSchema>;
export type FinalCtaSimpleContent = z.infer<typeof finalCtaSimpleContentSchema>;
export type CommercialActivationContentV1 = z.infer<
  typeof commercialActivationContentV1Schema
>;

export type CommercialActivationSectionContentByVariant = {
  "hero.default": HeroDefaultContent;
  "benefits.cards": BenefitsCardsContent;
  "services.list": ServicesListContent;
  "plans.cards": PlansCardsContent;
  "differentials.cards": DifferentialsCardsContent;
  "how_it_works.steps": HowItWorksStepsContent;
  "faq.accordion": FaqAccordionContent;
  "final_cta.simple": FinalCtaSimpleContent;
};

export type CommercialActivationSectionContent =
  CommercialActivationSectionContentByVariant[CommercialActivationSectionVariant];
