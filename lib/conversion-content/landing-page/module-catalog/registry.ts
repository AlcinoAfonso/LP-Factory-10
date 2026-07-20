import type {
  LandingPageActionFieldDefinition,
  LandingPageCollectionFieldDefinition,
  LandingPageImageFieldDefinition,
  LandingPageCapabilityKey,
  LandingPageCopySourceItemKey,
  LandingPageCopySourceMap,
  LandingPageModuleCatalogRegistry,
  LandingPageModuleFieldCatalogRegistry,
  LandingPageModuleKey,
  LandingPageModuleVariantCatalogRegistry,
  LandingPageModuleVariantDefinition,
  LandingPageReferenceFieldDefinition,
  LandingPageTextFieldDefinition,
} from "./contracts";

export const landingPageModuleCatalogRegistry = deepFreeze({
  1: {
    family: "landing_page",
    moduleCatalogVersion: 1,
    compatibleRootVersions: [1],
    modules: {
      hero: moduleDefinition({
        moduleKey: "hero",
        function: "establish_primary_value_proposition",
        boundaries: [
          "opening_section_only",
          "no_full_offer_detail",
          "no_proof_collection",
        ],
        invariants: [
          "one_primary_value_proposition",
          "one_primary_conversion_intent",
          "no_concrete_destination",
        ],
      }),
      trust_bar: moduleDefinition({
        moduleKey: "trust_bar",
        function: "surface_compact_trust_signals",
        boundaries: [
          "compact_signals_only",
          "no_testimonial_narrative",
          "no_conversion_action",
        ],
        invariants: [
          "support_required_for_every_signal",
          "no_fabricated_signal",
          "no_material_evidence_change",
        ],
      }),
      problem_solution: moduleDefinition({
        moduleKey: "problem_solution",
        function: "connect_problem_to_solution_approach",
        boundaries: [
          "problem_and_solution_only",
          "no_offer_detail",
          "no_conversion_action",
        ],
        invariants: [
          "problem_precedes_solution",
          "no_alarmist_framing",
          "solution_matches_declared_problem",
        ],
      }),
      offer: moduleDefinition({
        moduleKey: "offer",
        function: "present_offer_structure",
        boundaries: [
          "offer_components_only",
          "no_social_evidence",
          "no_conversion_action",
        ],
        invariants: [
          "operational_capacity_required",
          "no_unsupported_commercial_term",
          "no_concrete_destination",
        ],
      }),
      process: moduleDefinition({
        moduleKey: "process",
        function: "explain_ordered_operational_steps",
        boundaries: [
          "process_explanation_only",
          "no_offer_detail",
          "no_conversion_action",
        ],
        invariants: [
          "steps_form_coherent_sequence",
          "no_unverified_step",
          "no_concrete_destination",
        ],
      }),
      technical_assurance: moduleDefinition({
        moduleKey: "technical_assurance",
        function: "clarify_supported_technical_assurances",
        boundaries: [
          "technical_assurance_only",
          "no_testimonial_narrative",
          "no_conversion_action",
        ],
        invariants: [
          "traceable_support_required",
          "no_fabricated_assurance",
          "no_material_evidence_change",
        ],
      }),
      social_proof: moduleDefinition({
        moduleKey: "social_proof",
        function: "present_supported_social_evidence",
        boundaries: [
          "social_evidence_only",
          "no_general_trust_signal",
          "no_conversion_action",
        ],
        invariants: [
          "traceable_evidence_required",
          "no_fabricated_evidence",
          "no_material_evidence_change",
        ],
      }),
      faq: moduleDefinition({
        moduleKey: "faq",
        function: "answer_recurring_questions_and_objections",
        boundaries: [
          "question_and_answer_only",
          "no_offer_expansion",
          "no_conversion_action",
        ],
        invariants: [
          "questions_are_not_duplicated",
          "factual_answers_require_support",
          "answers_match_declared_questions",
        ],
      }),
      final_cta: moduleDefinition({
        moduleKey: "final_cta",
        function: "close_with_primary_conversion_intent",
        boundaries: [
          "closing_section_only",
          "no_new_argument",
          "no_secondary_conversion_action",
        ],
        invariants: [
          "one_primary_conversion_intent",
          "no_concrete_destination",
          "action_matches_preceding_proposition",
        ],
      }),
    },
  },
} satisfies LandingPageModuleCatalogRegistry);

export const landingPageModuleFieldCatalogRegistry = deepFreeze({
  1: {
    moduleCatalogVersion: 1,
    modules: {
      hero: moduleFields("hero", {
        eyebrow: textField(
          "eyebrow",
          "eyebrow",
          0,
          1,
          "research_guided",
          "none",
        ),
        title: textField("title", "h1", 1, 1, "hybrid", "when_factual"),
        subtitle: textField(
          "subtitle",
          "paragraph",
          1,
          1,
          "hybrid",
          "when_factual",
        ),
        primaryCta: actionField("primaryCta", 1, 1),
        "primaryCta.label": textField(
          "primaryCta.label",
          "cta_label",
          1,
          1,
          "hybrid",
          "when_present",
        ),
        proofShort: textField(
          "proofShort",
          "paragraph",
          0,
          1,
          "hybrid",
          "when_present",
        ),
        media: imageField("media", 0, 1),
      }),
      trust_bar: moduleFields("trust_bar", {
        items: collectionField("items", 2, 4),
        "items[].text": textField(
          "items[].text",
          "benefit_item",
          1,
          1,
          "hybrid",
          "when_present",
        ),
      }),
      problem_solution: moduleFields("problem_solution", {
        title: textField("title", "h2", 1, 1, "research_guided", "none"),
        items: collectionField("items", 2, 4),
        "items[].problem": textField(
          "items[].problem",
          "card_title",
          1,
          1,
          "research_guided",
          "none",
        ),
        "items[].solution": textField(
          "items[].solution",
          "card_body",
          1,
          1,
          "hybrid",
          "when_present",
        ),
      }),
      offer: moduleFields("offer", {
        title: textField("title", "h2", 1, 1, "research_guided", "none"),
        items: collectionField("items", 1, 4),
        "items[].itemTitle": textField(
          "items[].itemTitle",
          "card_title",
          1,
          1,
          "hybrid",
          "when_present",
        ),
        "items[].description": textField(
          "items[].description",
          "card_body",
          1,
          1,
          "hybrid",
          "when_present",
        ),
      }),
      process: moduleFields("process", {
        title: textField("title", "h2", 1, 1, "research_guided", "none"),
        steps: collectionField("steps", 2, 6, true),
        "steps[].stepTitle": textField(
          "steps[].stepTitle",
          "step_title",
          1,
          1,
          "hybrid",
          "when_present",
        ),
        "steps[].stepBody": textField(
          "steps[].stepBody",
          "step_body",
          1,
          1,
          "hybrid",
          "when_present",
        ),
      }),
      technical_assurance: moduleFields("technical_assurance", {
        title: textField("title", "h2", 1, 1, "research_guided", "none"),
        items: collectionField("items", 1, 4),
        "items[].assuranceTitle": textField(
          "items[].assuranceTitle",
          "card_title",
          1,
          1,
          "hybrid",
          "when_present",
        ),
        "items[].assuranceBody": textField(
          "items[].assuranceBody",
          "card_body",
          1,
          1,
          "hybrid",
          "when_present",
        ),
      }),
      social_proof: moduleFields("social_proof", {
        title: textField("title", "h2", 1, 1, "research_guided", "none"),
        items: collectionField("items", 1, 3),
        "items[].quote": textField(
          "items[].quote",
          "card_body",
          1,
          1,
          "operational_required",
          "when_present",
        ),
        "items[].attribution": textField(
          "items[].attribution",
          "card_title",
          1,
          1,
          "operational_required",
          "when_present",
        ),
        "items[].evidenceRef": referenceField(
          "items[].evidenceRef",
          1,
          1,
        ),
      }),
      faq: moduleFields("faq", {
        title: textField("title", "h2", 1, 1, "research_guided", "none"),
        items: collectionField("items", 2, 6),
        "items[].question": textField(
          "items[].question",
          "faq_question",
          1,
          1,
          "research_guided",
          "none",
        ),
        "items[].answer": textField(
          "items[].answer",
          "faq_answer",
          1,
          1,
          "hybrid",
          "when_factual",
        ),
      }),
      final_cta: moduleFields("final_cta", {
        title: textField("title", "h2", 1, 1, "hybrid", "when_factual"),
        body: textField(
          "body",
          "paragraph",
          1,
          1,
          "hybrid",
          "when_factual",
        ),
        primaryCta: actionField("primaryCta", 1, 1),
        "primaryCta.label": textField(
          "primaryCta.label",
          "cta_label",
          1,
          1,
          "hybrid",
          "when_present",
        ),
      }),
    },
  },
} satisfies LandingPageModuleFieldCatalogRegistry);

const approvedCopySourceMaps = {
  hero: {
    eyebrow: researchSource(["positioning_opportunity"], "search_intent"),
    title: researchSource(
      ["positioning_opportunity", "desire"],
      "commercial_keywords",
    ),
    subtitle: researchSource(["pain", "desire"], "belief"),
    "primaryCta.label": researchSource(["trigger"], "search_intent"),
    proofShort: researchSource(["proof_type"], "objection"),
  },
  trust_bar: {
    "items[].text": researchSource(["proof_type", "belief"], "objection"),
  },
  problem_solution: {
    title: researchSource(["pain", "desire"], "positioning_opportunity"),
    "items[].problem": researchSource(["pain", "fear"], "objection"),
    "items[].solution": researchSource(
      ["positioning_opportunity", "desire"],
      "belief",
    ),
  },
  offer: {
    title: researchSource(["desire", "trigger"], "positioning_opportunity"),
    "items[].itemTitle": researchSource(["trigger", "desire"]),
    "items[].description": researchSource(
      ["positioning_opportunity", "belief"],
      "objection",
    ),
  },
  process: {
    title: researchSource(["belief", "desire"], "positioning_opportunity"),
    "steps[].stepTitle": researchSource(
      ["trigger", "positioning_opportunity"],
      "desire",
    ),
    "steps[].stepBody": researchSource(["belief", "desire"], "objection"),
  },
  technical_assurance: {
    title: researchSource(["proof_type", "belief"], "objection"),
    "items[].assuranceTitle": researchSource(["proof_type"], "belief"),
    "items[].assuranceBody": researchSource(
      ["proof_type", "positioning_opportunity"],
      "objection",
    ),
  },
  social_proof: {
    title: researchSource(["proof_type", "belief"], "objection"),
    "items[].quote": operationalEvidenceSource(),
    "items[].attribution": operationalEvidenceSource(),
  },
  faq: {
    title: researchSource(["objection", "awareness_level"], "search_intent"),
    "items[].question": researchSource(["objection", "fear"], "faq_questions"),
    "items[].answer": researchSource(
      ["belief", "positioning_opportunity"],
      "desire",
    ),
  },
  final_cta: {
    title: researchSource(["trigger", "desire"], "positioning_opportunity"),
    body: researchSource(["desire", "objection"], "belief"),
    "primaryCta.label": researchSource(["trigger"], "search_intent"),
  },
} satisfies Readonly<Record<LandingPageModuleKey, LandingPageCopySourceMap>>;

export const landingPageModuleVariantCatalogRegistry = deepFreeze({
  1: {
    moduleCatalogVersion: 1,
    capabilities: {
      primary_action: {
        capabilityKey: "primary_action",
        bindingFieldKey: "primary_conversion_channel",
        allowedValues: ["whatsapp", "phone", "email", "external_url"],
      },
      image_asset: {
        capabilityKey: "image_asset",
        modes: ["informative", "decorative"],
        visibility: "all_viewports",
        informativeRequiresAltText: true,
        decorativeRequiresEmptyAltText: true,
      },
      accordion_interaction: {
        capabilityKey: "accordion_interaction",
        initialState: "all_closed",
        expansionMode: "single",
        toggleMode: "own_control",
        keyboardRequired: true,
        stateExposed: true,
        controlContentAssociationRequired: true,
        focusPreserved: true,
        focusVisible: "inherited_from_root",
        wcagBaseline: "2.2",
      },
    },
    modules: {
      hero: moduleVariants("hero", {
        standard: variantDefinition("hero", "standard", [
          "primary_action",
          "image_asset",
        ]),
      }),
      trust_bar: moduleVariants("trust_bar", {
        standard: variantDefinition("trust_bar", "standard"),
      }),
      problem_solution: moduleVariants("problem_solution", {
        standard: variantDefinition("problem_solution", "standard"),
      }),
      offer: moduleVariants("offer", {
        standard: variantDefinition("offer", "standard"),
      }),
      process: moduleVariants("process", {
        standard: variantDefinition("process", "standard"),
      }),
      technical_assurance: moduleVariants("technical_assurance", {
        standard: variantDefinition("technical_assurance", "standard"),
      }),
      social_proof: moduleVariants("social_proof", {
        standard: variantDefinition("social_proof", "standard"),
      }),
      faq: moduleVariants("faq", {
        standard: variantDefinition("faq", "standard"),
        accordion: variantDefinition("faq", "accordion", [
          "accordion_interaction",
        ]),
      }),
      final_cta: moduleVariants("final_cta", {
        standard: variantDefinition("final_cta", "standard", [
          "primary_action",
        ]),
      }),
    },
  },
} satisfies LandingPageModuleVariantCatalogRegistry);

export function resolveLandingPageModuleVariantDefinitionInternal(input: {
  moduleKey: string;
  moduleVersion: number;
  variantKey: string;
  variantVersion: number;
}): LandingPageModuleVariantDefinition | undefined {
  const catalog = landingPageModuleVariantCatalogRegistry[1];
  const moduleEntry = catalog.modules[input.moduleKey as LandingPageModuleKey];
  if (!moduleEntry || moduleEntry.moduleVersion !== input.moduleVersion) {
    return undefined;
  }

  const variant = moduleEntry.variants[input.variantKey];
  if (!variant || variant.variantVersion !== input.variantVersion) {
    return undefined;
  }

  return variant;
}

function moduleDefinition(input: {
  moduleKey: keyof LandingPageModuleCatalogRegistry[1]["modules"];
  function: string;
  boundaries: readonly string[];
  invariants: readonly string[];
}) {
  return {
    moduleKey: input.moduleKey,
    moduleVersion: 1,
    lifecycleStatus: "hypothesis" as const,
    purpose: "controlled_test" as const,
    function: input.function,
    boundaries: input.boundaries,
    invariants: input.invariants,
    rootDelta: {},
  };
}

function moduleFields(
  moduleKey: keyof LandingPageModuleFieldCatalogRegistry[1]["modules"],
  fields: LandingPageModuleFieldCatalogRegistry[1]["modules"][typeof moduleKey]["fields"],
) {
  return { moduleKey, moduleVersion: 1, fields };
}

function moduleVariants(
  moduleKey: LandingPageModuleKey,
  variants: Readonly<Record<string, LandingPageModuleVariantDefinition>>,
) {
  return { moduleKey, moduleVersion: 1, rootDelta: {}, variants };
}

function variantDefinition(
  moduleKey: LandingPageModuleKey,
  variantKey: LandingPageModuleVariantDefinition["variantKey"],
  capabilities: readonly LandingPageCapabilityKey[] = [],
): LandingPageModuleVariantDefinition {
  return {
    variantKey,
    variantVersion: 1,
    lifecycleStatus: "hypothesis",
    purpose: "controlled_test",
    compatibleModuleVersion: 1,
    fields: copyApprovedModuleFields(moduleKey),
    copySourceMap: copyApprovedCopySourceMap(moduleKey),
    capabilities,
    rootDelta: {},
  };
}

function copyApprovedCopySourceMap(
  moduleKey: LandingPageModuleKey,
): LandingPageCopySourceMap {
  return Object.fromEntries(
    Object.entries(approvedCopySourceMaps[moduleKey]).map(([path, source]) => [
      path,
      source.sourceMode === "research"
        ? {
            sourceMode: source.sourceMode,
            primaryItemKeys: [...source.primaryItemKeys],
            ...(source.auxiliaryItemKey === undefined
              ? {}
              : { auxiliaryItemKey: source.auxiliaryItemKey }),
          }
        : { sourceMode: source.sourceMode },
    ]),
  );
}

function researchSource(
  primaryItemKeys: readonly LandingPageCopySourceItemKey[],
  auxiliaryItemKey?: LandingPageCopySourceItemKey,
) {
  return {
    sourceMode: "research" as const,
    primaryItemKeys,
    ...(auxiliaryItemKey === undefined ? {} : { auxiliaryItemKey }),
  };
}

function operationalEvidenceSource() {
  return { sourceMode: "operational_evidence" as const };
}

function copyApprovedModuleFields(moduleKey: LandingPageModuleKey) {
  return Object.fromEntries(
    Object.entries(
      landingPageModuleFieldCatalogRegistry[1].modules[moduleKey].fields,
    ).map(([path, field]) => [
      path,
      { ...field, cardinality: { ...field.cardinality } },
    ]),
  ) as LandingPageModuleVariantDefinition["fields"];
}

function textField(
  path: string,
  semanticRole: LandingPageTextFieldDefinition["semanticRole"],
  min: number,
  max: number,
  policy: LandingPageTextFieldDefinition["policy"],
  support: LandingPageTextFieldDefinition["support"],
): LandingPageTextFieldDefinition {
  return {
    path,
    fieldKind: "text",
    semanticRole,
    cardinality: { min, max },
    policy,
    support,
  };
}

function collectionField(
  path: string,
  min: number,
  max: number,
  ordered?: true,
): LandingPageCollectionFieldDefinition {
  return {
    path,
    fieldKind: "collection",
    cardinality: { min, max },
    policy: "not_copy",
    ...(ordered ? { ordered } : {}),
  };
}

function actionField(
  path: string,
  min: number,
  max: number,
): LandingPageActionFieldDefinition {
  return {
    path,
    fieldKind: "action",
    cardinality: { min, max },
    policy: "not_copy",
  };
}

function imageField(
  path: string,
  min: number,
  max: number,
): LandingPageImageFieldDefinition {
  return {
    path,
    fieldKind: "image",
    cardinality: { min, max },
    policy: "technical_reference",
    visibility: "all_viewports",
  };
}

function referenceField(
  path: string,
  min: number,
  max: number,
): LandingPageReferenceFieldDefinition {
  return {
    path,
    fieldKind: "reference",
    cardinality: { min, max },
    policy: "technical_reference",
    referenceKind: "operational_evidence",
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
