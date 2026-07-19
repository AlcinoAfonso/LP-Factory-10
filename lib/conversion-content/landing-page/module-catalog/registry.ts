import type { LandingPageModuleCatalogRegistry } from "./contracts";

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
