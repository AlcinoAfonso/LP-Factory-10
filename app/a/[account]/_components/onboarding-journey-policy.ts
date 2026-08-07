import type { MemberRole } from "@/lib/types/status";
import {
  validateLandingPageInputValue,
  type LandingPageInputCondition,
  type ResolvedLandingPageInputField,
} from "../../../../lib/conversion-content/landing-page/input-catalog";
import type { AccountLandingPageOnboardingStoredValues } from "../../../../lib/lp-builder";

export type AccountJourneyMode =
  | "commercial"
  | "waiting"
  | "onboarding"
  | "review"
  | "operational"
  | "blocked";

export type AccountJourneyDecision = Readonly<{
  mode: AccountJourneyMode;
  showFinancialActions: boolean;
}>;

export type AccountOnboardingState =
  | "not_loaded"
  | "unavailable"
  | "incomplete"
  | "complete_unbound"
  | "complete_bound"
  | "blocked";

export type JourneyFormStep = "business" | "landing_page" | "brand_identity";

export function decideAccountJourney(input: Readonly<{
  actorRole: MemberRole;
  isCommerciallyEligible: boolean;
  onboardingState: AccountOnboardingState;
}>): AccountJourneyDecision {
  if (!input.isCommerciallyEligible) {
    if (input.actorRole !== "owner") {
      return { mode: "waiting", showFinancialActions: false };
    }
    return { mode: "commercial", showFinancialActions: true };
  }

  if (input.actorRole !== "owner" && input.actorRole !== "admin") {
    return { mode: "blocked", showFinancialActions: false };
  }

  if (input.onboardingState === "incomplete") {
    return { mode: "onboarding", showFinancialActions: false };
  }
  if (input.onboardingState === "complete_unbound") {
    return { mode: "review", showFinancialActions: false };
  }
  if (input.onboardingState === "complete_bound") {
    return { mode: "operational", showFinancialActions: false };
  }
  if (
    input.onboardingState === "unavailable" ||
    input.onboardingState === "not_loaded"
  ) {
    return { mode: "commercial", showFinancialActions: false };
  }

  return { mode: "blocked", showFinancialActions: false };
}

export function prepareJourneyStoredValues(input: Readonly<{
  fields: readonly ResolvedLandingPageInputField[];
  storedValues: AccountLandingPageOnboardingStoredValues;
  effectiveValues: Readonly<Record<string, unknown>>;
}>): AccountLandingPageOnboardingStoredValues {
  const fieldsByKey = new Map(
    input.fields.map((field) => [field.fieldKey, field]),
  );
  return Object.fromEntries(
    Object.entries(input.storedValues).filter(([fieldKey, stored]) => {
      if (fieldKey === "brand_logo_asset") return false;
      const field = fieldsByKey.get(fieldKey);
      if (!field) return true;
      const applicable = journeyConditionMatches(
        field.applicableWhen,
        input.effectiveValues,
      );
      return applicable || validateLandingPageInputValue(field, stored.value).ok;
    }),
  );
}

export function parseKeywordMapDraft(input: string) {
  const rows = input
    .split("\n")
    .map((line) => line.split("|").map((part) => part.trim()))
    .filter((parts) => parts.some(Boolean))
    .map(([keyword_or_cluster = "", message_anchor = "", ad_context]) => ({
      keyword_or_cluster,
      message_anchor,
      ...(ad_context ? { ad_context } : {}),
    }));
  return rows.length ? rows : undefined;
}

export function parseNumberRangeDraft(
  minimum: string,
  maximum: string,
): unknown | undefined {
  if (!minimum && !maximum) return undefined;
  return {
    minimum: minimum ? Number(minimum) : null,
    maximum: maximum ? Number(maximum) : null,
    currency: "BRL",
  };
}

export function journeyConditionMatches(
  condition: LandingPageInputCondition | undefined,
  values: Readonly<Record<string, unknown>>,
) {
  if (!condition) return true;
  const actual = values[condition.fieldKey];
  if (condition.operator === "equals") return actual === condition.value;
  return Array.isArray(condition.value) && condition.value.includes(actual as never);
}

export function journeyScopeBelongsToStep(
  step: JourneyFormStep,
  scope: ResolvedLandingPageInputField["valueScope"],
) {
  if (step === "business") {
    return ["account", "business", "offer"].includes(scope);
  }
  if (step === "landing_page") {
    return ["campaign", "landing_page"].includes(scope);
  }
  return false;
}
