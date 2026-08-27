import type {
  AccountLandingPageOnboardingConfiguration,
  AccountLandingPageOnboardingStoredValues,
  AccountLandingPageWorkspaceState,
} from "./contracts";
import { areLandingPageOfferingScopesMateriallyEqual } from "../conversion-content/landing-page/input-catalog";

export const landingPageWorkspaceIdentityFieldKeys = Object.freeze([
  "funnel_stage",
  "transaction_intent",
] as const);

export function isLandingPageWorkspaceEnabled(): boolean {
  return process.env.E19_5_WORKSPACE_ENABLED === "true";
}

export function deriveLandingPageWorkspaceState(input: Readonly<{
  configuration: AccountLandingPageOnboardingConfiguration;
  latestRevisionId: string | null;
  approvedRevisionId: string | null;
}>): AccountLandingPageWorkspaceState {
  if (!input.configuration.complete) return "configuration_incomplete";
  if (!input.latestRevisionId) return "ready_to_generate";
  if (!input.approvedRevisionId) return "in_review";
  return input.latestRevisionId === input.approvedRevisionId
    ? "delivered"
    : "new_version_in_review";
}

export const landingPageWorkspaceStateLabels: Readonly<
  Record<AccountLandingPageWorkspaceState, string>
> = Object.freeze({
  configuration_incomplete: "Configuração incompleta",
  ready_to_generate: "Pronta para gerar",
  in_review: "Em análise",
  delivered: "Entregue",
  new_version_in_review: "Nova versão em análise",
});

export function splitLandingPageWorkspaceValues(
  values: AccountLandingPageOnboardingStoredValues,
): Readonly<{
  sharedValues: AccountLandingPageOnboardingStoredValues;
  landingPageValues: AccountLandingPageOnboardingStoredValues;
}> {
  const sharedValues: Record<string, AccountLandingPageOnboardingStoredValues[string]> = {};
  const landingPageValues: Record<string, AccountLandingPageOnboardingStoredValues[string]> = {};
  for (const [fieldKey, stored] of Object.entries(values)) {
    if (stored.scope === "account" || stored.scope === "business") {
      sharedValues[fieldKey] = stored;
    } else {
      landingPageValues[fieldKey] = stored;
    }
  }
  return Object.freeze({
    sharedValues: Object.freeze(sharedValues),
    landingPageValues: Object.freeze(landingPageValues),
  });
}

export function evaluateLandingPageCommercialIdentityMutation(input: Readonly<{
  hasRevision: boolean;
  identityBaselines: ReadonlyMap<string, unknown>;
  baselineOfferingScope: unknown;
  currentOfferingScope: unknown;
  nextValues: AccountLandingPageOnboardingStoredValues;
  sameCommercialWorkConfirmed: boolean;
}>):
  | Readonly<{ ok: true }>
  | Readonly<{
      ok: false;
      error:
        | "identity_change_requires_new_landing_page"
        | "offer_change_confirmation_required";
      fieldKey: string;
    }> {
  for (const fieldKey of landingPageWorkspaceIdentityFieldKeys) {
    const baseline = input.identityBaselines.get(fieldKey);
    const next = input.nextValues[fieldKey]?.value;
    if (baseline !== undefined && next !== undefined && !sameJson(baseline, next)) {
      return {
        ok: false,
        error: "identity_change_requires_new_landing_page",
        fieldKey,
      };
    }
  }

  const nextOfferingScope =
    input.nextValues.landing_page_offering_scope?.value;
  if (
    input.hasRevision &&
    nextOfferingScope !== undefined &&
    !areLandingPageOfferingScopesMateriallyEqual(
      input.currentOfferingScope ?? input.baselineOfferingScope,
      nextOfferingScope,
    ) &&
    !input.sameCommercialWorkConfirmed
  ) {
    return {
      ok: false,
      error: "offer_change_confirmation_required",
      fieldKey: "landing_page_offering_scope",
    };
  }
  return { ok: true };
}

function sameJson(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}
