import type {
  AccountLandingPageOnboardingConfiguration,
  AccountLandingPageOnboardingFieldState,
  AccountLandingPageOnboardingStoredValues,
  AccountLandingPageWorkspaceState,
} from "./contracts";
import { landingPageInputPresentationLabel } from "./landingPageInputPresentation";

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

const WORKSPACE_IDENTITY_FIELD_KEYS = Object.freeze({
  funnelStage: "funnel_stage",
  transactionIntent: "transaction_intent",
  primaryConversionGoal: "primary_conversion_goal",
  primaryServiceOrOffer: "primary_service_or_offer",
} as const);

export function projectLandingPageWorkspaceIdentity(
  fields: readonly AccountLandingPageOnboardingFieldState[],
) {
  const byKey = new Map(fields.map((field) => [field.field.fieldKey, field]));
  return Object.freeze({
    funnelStage: formatIdentityField(byKey.get(WORKSPACE_IDENTITY_FIELD_KEYS.funnelStage)),
    transactionIntent: formatIdentityField(
      byKey.get(WORKSPACE_IDENTITY_FIELD_KEYS.transactionIntent),
    ),
    primaryConversionGoal: formatIdentityField(
      byKey.get(WORKSPACE_IDENTITY_FIELD_KEYS.primaryConversionGoal),
    ),
    primaryServiceOrOffer: formatIdentityField(
      byKey.get(WORKSPACE_IDENTITY_FIELD_KEYS.primaryServiceOrOffer),
    ),
  });
}

function formatIdentityField(field: AccountLandingPageOnboardingFieldState | undefined) {
  if (!field) return "Não informado";
  if (!field.applicable) return "Não se aplica";
  const value = field.value;
  if (value === undefined || value === null || value === "") return "Não informado";
  if (typeof value === "string") {
    const normalized = value.trim();
    if (!normalized) return "Não informado";
    return field.field.valueType === "enum"
      ? formatResolvedEnumValue(field, normalized)
      : normalized;
  }
  if (typeof value === "boolean") return value ? "Sim" : "Não";
  if (Array.isArray(value)) {
    const items = value.filter((item): item is string => typeof item === "string");
    return items.length > 0 ? items.join(", ") : "Não informado";
  }
  return "Não informado";
}

function formatResolvedEnumValue(
  field: AccountLandingPageOnboardingFieldState,
  value: string,
) {
  if (
    field.field.validation.kind !== "enum" ||
    !field.field.validation.allowedValues.includes(value)
  ) {
    return "Não informado";
  }
  // E20.2 `allowedValues` above remains the sole authority. This helper only
  // presents the already-authorized value with the same labels used by setup.
  const presentationLabel = landingPageInputPresentationLabel(value);
  if (presentationLabel) return presentationLabel;
  const words = value.replace(/[._-]+/g, " ").trim();
  return words ? words.charAt(0).toUpperCase() + words.slice(1) : "Não informado";
}
