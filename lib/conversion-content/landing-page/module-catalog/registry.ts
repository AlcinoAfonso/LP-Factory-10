import type {
  LandingPageActionFieldDefinition,
  LandingPageModuleCatalogRegistry,
  LandingPageModuleDefinition,
  LandingPageModuleKey,
  LandingPageCollectionFieldDefinition,
  LandingPageCollectionItemFieldDefinition,
  LandingPageFieldCardinality,
  LandingPageFieldPolicy,
  LandingPageFieldSupport,
  LandingPageImageFieldDefinition,
  LandingPageTechnicalReferenceFieldDefinition,
  LandingPageTextFieldDefinition,
  LandingPageVariantCapability,
  LandingPageVariantDefinition,
  LandingPageVariantFieldContractKey,
  LandingPageVariantKey,
  LandingPageVariantName,
} from "./contracts";
import type { LandingPageRootSemanticRoleKey } from "../index";

const noRootRestrictions = { textRanges: [] } as const;

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
  variantFieldContracts: {
    "hero.standard@v1": {
      fieldContractKey: "hero.standard@v1",
      fields: [
        text("hero.standard.eyebrow", "eyebrow", "eyebrow", 0, 1, "research_guided"),
        text("hero.standard.title", "title", "h1", 1, 1, "hybrid", "when_factual"),
        text("hero.standard.subtitle", "subtitle", "paragraph", 1, 1, "hybrid", "when_factual"),
        action("hero.standard.primaryCta", "primaryCta"),
        text("hero.standard.proofShort", "proofShort", "paragraph", 0, 1, "hybrid", "when_present"),
        image("hero.standard.media", "media", 0, 1),
      ],
    },
    "trust_bar.standard@v1": {
      fieldContractKey: "trust_bar.standard@v1",
      fields: [
        collection("trust_bar.standard.items", "items", 2, 4, [
          text("trust_bar.standard.items[].text", "text", "benefit_item", 1, 1, "hybrid", "when_present"),
        ]),
      ],
    },
    "problem_solution.standard@v1": {
      fieldContractKey: "problem_solution.standard@v1",
      fields: [
        text("problem_solution.standard.title", "title", "h2", 1, 1, "research_guided"),
        collection("problem_solution.standard.items", "items", 2, 4, [
          text("problem_solution.standard.items[].problem", "problem", "card_title", 1, 1, "research_guided"),
          text("problem_solution.standard.items[].solution", "solution", "card_body", 1, 1, "hybrid", "when_present"),
        ]),
      ],
    },
    "offer.standard@v1": {
      fieldContractKey: "offer.standard@v1",
      fields: [
        text("offer.standard.title", "title", "h2", 1, 1, "research_guided"),
        collection("offer.standard.items", "items", 1, 4, [
          text("offer.standard.items[].itemTitle", "itemTitle", "card_title", 1, 1, "hybrid", "when_present"),
          text("offer.standard.items[].description", "description", "card_body", 1, 1, "hybrid", "when_present"),
        ]),
      ],
    },
    "process.standard@v1": {
      fieldContractKey: "process.standard@v1",
      fields: [
        text("process.standard.title", "title", "h2", 1, 1, "research_guided"),
        collection("process.standard.steps", "steps", 2, 6, [
          text("process.standard.steps[].stepTitle", "stepTitle", "step_title", 1, 1, "hybrid", "when_present"),
          text("process.standard.steps[].stepBody", "stepBody", "step_body", 1, 1, "hybrid", "when_present"),
        ]),
      ],
    },
    "technical_assurance.standard@v1": {
      fieldContractKey: "technical_assurance.standard@v1",
      fields: [
        text("technical_assurance.standard.title", "title", "h2", 1, 1, "research_guided"),
        collection("technical_assurance.standard.items", "items", 1, 4, [
          text("technical_assurance.standard.items[].assuranceTitle", "assuranceTitle", "card_title", 1, 1, "hybrid", "when_present"),
          text("technical_assurance.standard.items[].assuranceBody", "assuranceBody", "card_body", 1, 1, "hybrid", "when_present"),
        ]),
      ],
    },
    "social_proof.standard@v1": {
      fieldContractKey: "social_proof.standard@v1",
      fields: [
        text("social_proof.standard.title", "title", "h2", 1, 1, "research_guided"),
        collection("social_proof.standard.items", "items", 1, 3, [
          text("social_proof.standard.items[].quote", "quote", "card_body", 1, 1, "operational_required"),
          text("social_proof.standard.items[].attribution", "attribution", "card_title", 1, 1, "operational_required"),
          technicalReference("social_proof.standard.items[].evidenceRef", "evidenceRef"),
        ]),
      ],
    },
    "faq.standard@v1": {
      fieldContractKey: "faq.standard@v1",
      fields: faqFields("faq.standard"),
    },
    "faq.accordion@v1": {
      fieldContractKey: "faq.accordion@v1",
      fields: faqFields("faq.accordion"),
    },
    "final_cta.standard@v1": {
      fieldContractKey: "final_cta.standard@v1",
      fields: [
        text("final_cta.standard.title", "title", "h2", 1, 1, "hybrid", "when_factual"),
        text("final_cta.standard.body", "body", "paragraph", 1, 1, "hybrid", "when_factual"),
        action("final_cta.standard.primaryCta", "primaryCta"),
      ],
    },
  },
  variants: {
    "hero.standard@v1": variant(
      "hero.standard@v1",
      "standard",
      "hero",
      ["primary_action", "image_asset"],
      { actionCompatibility: { supportsPrimaryConversionForm: false } },
    ),
    "trust_bar.standard@v1": variant(
      "trust_bar.standard@v1",
      "standard",
      "trust_bar",
    ),
    "problem_solution.standard@v1": variant(
      "problem_solution.standard@v1",
      "standard",
      "problem_solution",
    ),
    "offer.standard@v1": variant(
      "offer.standard@v1",
      "standard",
      "offer",
    ),
    "process.standard@v1": variant(
      "process.standard@v1",
      "standard",
      "process",
    ),
    "technical_assurance.standard@v1": variant(
      "technical_assurance.standard@v1",
      "standard",
      "technical_assurance",
    ),
    "social_proof.standard@v1": variant(
      "social_proof.standard@v1",
      "standard",
      "social_proof",
    ),
    "faq.standard@v1": variant(
      "faq.standard@v1",
      "standard",
      "faq",
    ),
    "faq.accordion@v1": variant(
      "faq.accordion@v1",
      "accordion",
      "faq",
      ["accordion_interaction"],
      {
        accordionAccessibility: {
          baseline: "WCAG 2.2",
          keyboardOperable: true,
          exposesExpandedState: true,
          associatesControlAndRegion: true,
          preservesFocus: true,
          initiallyCollapsed: true,
          singleExpandedItem: true,
        },
      },
    ),
    "final_cta.standard@v1": variant(
      "final_cta.standard@v1",
      "standard",
      "final_cta",
      ["primary_action"],
      { actionCompatibility: { supportsPrimaryConversionForm: false } },
    ),
  },
} satisfies LandingPageModuleCatalogRegistry);

function variant(
  variantKey: LandingPageVariantKey,
  variantName: LandingPageVariantName,
  moduleKey: LandingPageModuleKey,
  capabilities: readonly LandingPageVariantCapability[] = [],
  optional: Pick<
    LandingPageVariantDefinition,
    "actionCompatibility" | "accordionAccessibility"
  > = {},
): LandingPageVariantDefinition {
  return {
    variantKey,
    variantName,
    variantVersion: 1,
    moduleKey,
    moduleVersion: 1,
    fieldContractKey: variantKey as LandingPageVariantFieldContractKey,
    lifecycleStatus: "hypothesis",
    purpose: "controlled_test",
    compatibleRootVersion: 1,
    rootDelta: noRootRestrictions,
    capabilities,
    ...optional,
  };
}

function text(
  path: string,
  fieldKey: string,
  semanticRole: LandingPageRootSemanticRoleKey,
  min: number,
  max: number,
  policy: LandingPageFieldPolicy,
  support?: LandingPageFieldSupport,
): LandingPageTextFieldDefinition {
  return {
    fieldKind: "text",
    fieldKey,
    path,
    cardinality: cardinality(min, max),
    policy,
    semanticRole,
    ...(support ? { support } : {}),
  };
}

function collection(
  path: string,
  fieldKey: string,
  min: number,
  max: number,
  itemFields: readonly LandingPageCollectionItemFieldDefinition[],
): LandingPageCollectionFieldDefinition {
  return {
    fieldKind: "collection",
    fieldKey,
    path,
    cardinality: cardinality(min, max),
    policy: "not_copy",
    itemFields,
  };
}

function action(
  path: string,
  fieldKey: string,
): LandingPageActionFieldDefinition {
  return {
    fieldKind: "action",
    fieldKey,
    path,
    cardinality: cardinality(1, 1),
    policy: "not_copy",
    label: text(`${path}.label`, "label", "cta_label", 1, 1, "hybrid", "when_present"),
    operationalBinding: "primary_conversion_channel",
  };
}

function image(
  path: string,
  fieldKey: string,
  min: number,
  max: number,
): LandingPageImageFieldDefinition {
  return {
    fieldKind: "image",
    fieldKey,
    path,
    cardinality: cardinality(min, max),
    policy: "technical_reference",
    alternativeTextRequiredWhenInformative: true,
  };
}

function technicalReference(
  path: string,
  fieldKey: string,
): LandingPageTechnicalReferenceFieldDefinition {
  return {
    fieldKind: "technical_reference",
    fieldKey,
    path,
    cardinality: cardinality(1, 1),
    policy: "technical_reference",
  };
}

function faqFields(prefix: "faq.standard" | "faq.accordion") {
  return [
    text(`${prefix}.title`, "title", "h2", 1, 1, "research_guided"),
    collection(`${prefix}.items`, "items", 2, 6, [
      text(`${prefix}.items[].question`, "question", "faq_question", 1, 1, "research_guided"),
      text(`${prefix}.items[].answer`, "answer", "faq_answer", 1, 1, "hybrid", "when_factual"),
    ]),
  ] as const;
}

function cardinality(min: number, max: number): LandingPageFieldCardinality {
  return { min, max };
}

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
    compatibleRootVersion: 1,
    rootDelta: noRootRestrictions,
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
