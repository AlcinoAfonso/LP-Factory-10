import { z } from "zod";

const nonEmptyText = z.string().trim().min(1).max(220);
const shortText = z.string().trim().min(1).max(96);
const bodyText = z.string().trim().min(1).max(480);
const ctaLabel = z.string().trim().min(1).max(40);
const safeHref = z
  .string()
  .trim()
  .min(1)
  .max(500)
  .refine(
    (value) =>
      value.startsWith("/") ||
      value.startsWith("#") ||
      value.startsWith("https://"),
    "href must be relative, anchor, or https",
  );

const sectionBase = z.object({
  composition_item_id: z.string().uuid(),
});

const ctaSchema = z.object({
  label: ctaLabel,
  href: safeHref,
});

const cardSchema = z.object({
  title: shortText,
  description: bodyText,
});

const heroDefaultSchema = sectionBase.extend({
  variant_key: z.literal("hero.default"),
  eyebrow: shortText,
  title: z.string().trim().min(1).max(140),
  description: bodyText,
  primary_cta: ctaSchema,
  secondary_cta: ctaSchema.optional(),
});

const benefitsCardsSchema = sectionBase.extend({
  variant_key: z.literal("benefits.cards"),
  eyebrow: shortText.default("Benefits"),
  title: nonEmptyText,
  items: z.array(cardSchema).min(2).max(6),
});

const servicesListSchema = sectionBase.extend({
  variant_key: z.literal("services.list"),
  eyebrow: shortText.default("Services"),
  title: nonEmptyText,
  items: z.array(shortText).min(3).max(8),
});

const plansCardsSchema = sectionBase.extend({
  variant_key: z.literal("plans.cards"),
  eyebrow: shortText.default("Plans"),
  title: nonEmptyText,
  disclaimer: bodyText.optional(),
  plans: z
    .array(
      z.object({
        key: z.string().trim().min(1).max(40),
        name: shortText,
        price: shortText,
        period: z.string().trim().min(1).max(24),
        description: bodyText,
        features: z.array(shortText).min(2).max(8),
        highlighted: z.boolean().default(false),
        cta: ctaSchema,
      }),
    )
    .min(1)
    .max(4),
});

const differentialsCardsSchema = sectionBase.extend({
  variant_key: z.literal("differentials.cards"),
  eyebrow: shortText.default("Differentials"),
  title: nonEmptyText,
  items: z.array(cardSchema).min(2).max(6),
});

const howItWorksStepsSchema = sectionBase.extend({
  variant_key: z.literal("how_it_works.steps"),
  eyebrow: shortText.default("How it works"),
  title: nonEmptyText,
  steps: z
    .array(
      z.object({
        label: z.string().trim().min(1).max(12),
        title: shortText,
        description: bodyText,
      }),
    )
    .min(2)
    .max(6),
});

const faqAccordionSchema = sectionBase.extend({
  variant_key: z.literal("faq.accordion"),
  eyebrow: shortText.default("FAQ"),
  title: nonEmptyText,
  questions: z
    .array(
      z.object({
        question: nonEmptyText,
        answer: bodyText,
      }),
    )
    .min(2)
    .max(8),
});

const finalCtaSimpleSchema = sectionBase.extend({
  variant_key: z.literal("final_cta.simple"),
  title: nonEmptyText,
  description: bodyText,
  cta: ctaSchema,
});

export const commercialActivationSectionSchemas = {
  "hero.default": heroDefaultSchema,
  "benefits.cards": benefitsCardsSchema,
  "services.list": servicesListSchema,
  "plans.cards": plansCardsSchema,
  "differentials.cards": differentialsCardsSchema,
  "how_it_works.steps": howItWorksStepsSchema,
  "faq.accordion": faqAccordionSchema,
  "final_cta.simple": finalCtaSimpleSchema,
} as const;

export const commercialActivationContentV1Schema = z.object({
  schema_version: z.literal(1),
  sections: z
    .array(
      z.discriminatedUnion("variant_key", [
        heroDefaultSchema,
        benefitsCardsSchema,
        servicesListSchema,
        plansCardsSchema,
        differentialsCardsSchema,
        howItWorksStepsSchema,
        faqAccordionSchema,
        finalCtaSimpleSchema,
      ]),
    )
    .min(1)
    .max(16),
});

export type CommercialActivationSectionVariant =
  keyof typeof commercialActivationSectionSchemas;
export type CommercialActivationContentV1 = z.infer<
  typeof commercialActivationContentV1Schema
>;
export type CommercialActivationSectionContent =
  CommercialActivationContentV1["sections"][number];
