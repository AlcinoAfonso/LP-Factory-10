import type {
  AccountLandingPageOnboardingConfiguration,
  AccountLandingPageOnboardingStoredValues,
  AccountLandingPageWorkspaceState,
} from "./contracts";

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
