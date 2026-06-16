import type { CommercialActivationSectionVariant } from "./schemas";

export type CommercialActivationModuleKey =
  | "hero"
  | "benefits"
  | "services"
  | "plans"
  | "differentials"
  | "how_it_works"
  | "faq"
  | "final_cta";

type RegistryEntry = {
  moduleKey: CommercialActivationModuleKey;
  required: boolean;
};

export const commercialActivationSectionRegistry = {
  "hero.default": { moduleKey: "hero", required: true },
  "benefits.cards": { moduleKey: "benefits", required: true },
  "services.list": { moduleKey: "services", required: true },
  "plans.cards": { moduleKey: "plans", required: true },
  "differentials.cards": { moduleKey: "differentials", required: false },
  "how_it_works.steps": { moduleKey: "how_it_works", required: true },
  "faq.accordion": { moduleKey: "faq", required: false },
  "final_cta.simple": { moduleKey: "final_cta", required: true },
} satisfies Record<CommercialActivationSectionVariant, RegistryEntry>;

export function isCommercialActivationSectionVariant(
  value: string,
): value is CommercialActivationSectionVariant {
  return value in commercialActivationSectionRegistry;
}
