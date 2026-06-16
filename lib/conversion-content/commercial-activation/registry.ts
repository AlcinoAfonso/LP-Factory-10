import type { ZodType } from "zod";
import {
  benefitsCardsContentSchema,
  differentialsCardsContentSchema,
  faqAccordionContentSchema,
  finalCtaSimpleContentSchema,
  heroDefaultContentSchema,
  howItWorksStepsContentSchema,
  plansCardsContentSchema,
  servicesListContentSchema,
  type CommercialActivationSectionContentByVariant,
  type CommercialActivationSectionVariant,
} from "./schemas";

export type CommercialActivationModuleKey =
  | "hero"
  | "benefits"
  | "services"
  | "plans"
  | "differentials"
  | "how_it_works"
  | "faq"
  | "final_cta";

type RegistryEntry<Variant extends CommercialActivationSectionVariant> = {
  moduleKey: CommercialActivationModuleKey;
  schema: ZodType<CommercialActivationSectionContentByVariant[Variant]>;
};

type Registry = {
  [Variant in CommercialActivationSectionVariant]: RegistryEntry<Variant>;
};

export const commercialActivationSectionRegistry = {
  "hero.default": {
    moduleKey: "hero",
    schema: heroDefaultContentSchema,
  },
  "benefits.cards": {
    moduleKey: "benefits",
    schema: benefitsCardsContentSchema,
  },
  "services.list": {
    moduleKey: "services",
    schema: servicesListContentSchema,
  },
  "plans.cards": {
    moduleKey: "plans",
    schema: plansCardsContentSchema,
  },
  "differentials.cards": {
    moduleKey: "differentials",
    schema: differentialsCardsContentSchema,
  },
  "how_it_works.steps": {
    moduleKey: "how_it_works",
    schema: howItWorksStepsContentSchema,
  },
  "faq.accordion": {
    moduleKey: "faq",
    schema: faqAccordionContentSchema,
  },
  "final_cta.simple": {
    moduleKey: "final_cta",
    schema: finalCtaSimpleContentSchema,
  },
} satisfies Registry;

export function isCommercialActivationSectionVariant(
  value: string,
): value is CommercialActivationSectionVariant {
  return value in commercialActivationSectionRegistry;
}
