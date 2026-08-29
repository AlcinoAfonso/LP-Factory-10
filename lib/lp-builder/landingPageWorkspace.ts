import type {
  AccountLandingPageOnboardingConfiguration,
  AccountLandingPageOnboardingStoredValues,
  AccountLandingPageWorkspaceState,
  SaveAccountLandingPageOperationalConfigurationResult,
} from "./contracts";
import {
  areLandingPageOfferingScopesMateriallyEqual,
  parseLandingPageOfferingScope,
  projectLegacyLandingPageOfferingScope,
} from "../conversion-content/landing-page/input-catalog";

const COMMERCIAL_IDENTITY_FIELDS = [
  "funnel_stage",
  "transaction_intent",
] as const;

export function evaluateLandingPageCommercialIdentityMutation(input: Readonly<{
  generationContextSnapshots: readonly unknown[];
  currentConfiguredOfferingScope: unknown;
  values: AccountLandingPageOnboardingStoredValues;
  sameCommercialWorkConfirmed: boolean;
}>):
  | Readonly<{ ok: true }>
  | Extract<SaveAccountLandingPageOperationalConfigurationResult, { ok: false }> {
  const baselines = new Map<string, unknown>();
  let firstOfferingScope: unknown = undefined;

  for (const snapshot of input.generationContextSnapshots) {
    for (const fact of readSnapshotFacts(snapshot)) {
      if (
        COMMERCIAL_IDENTITY_FIELDS.includes(
          fact.fieldKey as (typeof COMMERCIAL_IDENTITY_FIELDS)[number],
        ) &&
        !baselines.has(fact.fieldKey)
      ) {
        baselines.set(fact.fieldKey, fact.value);
      }
      if (
        fact.fieldKey === "landing_page_offering_scope" &&
        firstOfferingScope === undefined
      ) {
        const parsed = parseLandingPageOfferingScope(fact.value);
        if (!parsed.ok) return { ok: false, error: "unavailable" };
        firstOfferingScope = parsed.value;
      }
      if (
        fact.fieldKey === "primary_service_or_offer" &&
        firstOfferingScope === undefined
      ) {
        const projected = projectLegacyLandingPageOfferingScope(fact.value);
        if (!projected.ok) return { ok: false, error: "unavailable" };
        firstOfferingScope = projected.value;
      }
    }
  }

  for (const fieldKey of COMMERCIAL_IDENTITY_FIELDS) {
    const baseline = baselines.get(fieldKey);
    const next = input.values[fieldKey]?.value;
    if (baseline !== undefined && next !== undefined && !deepEqual(baseline, next)) {
      return {
        ok: false,
        error: "identity_change_requires_new_landing_page",
        fieldKey,
      };
    }
  }

  const nextOfferingScope = input.values.landing_page_offering_scope?.value;
  if (
    input.generationContextSnapshots.length > 0 &&
    nextOfferingScope !== undefined &&
    !areLandingPageOfferingScopesMateriallyEqual(
      input.currentConfiguredOfferingScope ?? firstOfferingScope,
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

function readSnapshotFacts(
  value: unknown,
): readonly Readonly<{ fieldKey: string; value: unknown }>[] {
  if (!isRecord(value) || !isRecord(value.generationContext)) return [];
  const context = value.generationContext;
  if (!isRecord(context.modelContext) || !Array.isArray(context.modelContext.facts)) {
    return [];
  }
  const serverFacts = Array.isArray(context.bindingFacts) ? context.bindingFacts : [];
  return [...context.modelContext.facts, ...serverFacts].filter(
    (fact): fact is { fieldKey: string; value: unknown } =>
      isRecord(fact) &&
      typeof fact.fieldKey === "string" &&
      Object.hasOwn(fact, "value"),
  );
}

function deepEqual(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
