import type {
  LandingPageModuleCatalogRegistry,
  LandingPageModuleDefinition,
  LandingPageModuleKey,
} from "./contracts";

export const landingPageModuleCatalogRegistry = deepFreeze({
  family: "landing_page",
  moduleCatalogVersion: 1,
  compatibleRootVersions: [1],
  modules: {
    hero: moduleDefinition(
      "hero",
      "Present the primary proposition and lead to the priority route.",
      [
        "The proposition is identifiable.",
        "The hierarchy is coherent.",
        "An action remains abstract when present.",
      ],
      [
        "No complete form, gallery, carousel, tour or global navigation.",
        "No detailed offer or extensive proof.",
      ],
    ),
    trust_bar: moduleDefinition(
      "trust_bar",
      "Present short and verifiable trust signals.",
      ["Signals are brief, relevant and supported by real evidence."],
      ["No testimonial, extensive proof, action, form or media."],
    ),
    problem_solution: moduleDefinition(
      "problem_solution",
      "Relate a problem or risk to a practical response.",
      [
        "Each response corresponds directly to its problem.",
        "Problems and responses remain clearly distinct.",
        "The module does not use alarmism.",
      ],
      [
        "No detailed offer, process, proof, FAQ, action, media or interaction.",
      ],
    ),
    offer: moduleDefinition(
      "offer",
      "Present available offers or use cases.",
      ["Every item is real, coherent and operationally supported."],
      [
        "No price, commercial condition, action, media, proof, process or FAQ.",
      ],
    ),
    process: moduleDefinition(
      "process",
      "Explain a real progression through distinct steps.",
      [
        "Steps preserve a real progression.",
        "Steps remain distinct.",
        "No deadline or result is invented.",
      ],
      ["No offer, proof, FAQ, action, price, media or interaction."],
    ),
    technical_assurance: moduleDefinition(
      "technical_assurance",
      "Explain safeguards, criteria, documents, credentials or checks.",
      [
        "Every item is real and verifiable.",
        "No item implies zero risk, approval or a result.",
      ],
      [
        "No trust bar, testimonial, process, offer, FAQ, action or media.",
        "No download or link.",
      ],
    ),
    social_proof: moduleDefinition(
      "social_proof",
      "Present real experiences from third parties.",
      [
        "Proof is real, traceable and authorized.",
        "Proof is not materially altered.",
      ],
      [
        "No trust bar, technical proof, offer, process, FAQ or action.",
        "No rating, metric, logo, detailed case or media.",
      ],
    ),
    faq: moduleDefinition(
      "faq",
      "Answer relevant questions and objections in question-and-answer pairs.",
      [
        "Questions are relevant and answers are direct.",
        "Factual statements require support.",
        "No advice or misleading promise is introduced.",
      ],
      [
        "No offer, process, technical proof, action, media or form.",
        "Interaction belongs to a variant contract.",
      ],
    ),
    final_cta: moduleDefinition(
      "final_cta",
      "Close the journey with a clear and qualified next step.",
      [
        "There is one primary action.",
        "Language is not coercive.",
        "The action link remains abstract and factual claims remain supported.",
      ],
      [
        "No repeated offer, process, FAQ or proof.",
        "No form, media, secondary action or concrete destination.",
      ],
    ),
  },
} satisfies LandingPageModuleCatalogRegistry);

function moduleDefinition(
  moduleKey: LandingPageModuleKey,
  structuralFunction: string,
  invariants: readonly string[],
  boundaries: readonly string[],
): LandingPageModuleDefinition {
  return {
    family: "landing_page",
    moduleKey,
    moduleVersion: 1,
    lifecycleStatus: "hypothesis",
    purpose: "controlled_test",
    structuralFunction,
    invariants,
    boundaries,
  };
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
