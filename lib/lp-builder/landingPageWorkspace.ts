import type {
  AccountLandingPageOnboardingConfiguration,
  AccountLandingPageWorkspaceItem,
} from "./contracts";

export function deriveLandingPageWorkspaceState(input: Readonly<{
  status: AccountLandingPageWorkspaceItem["status"];
  configuration: AccountLandingPageOnboardingConfiguration;
  latestRevisionId: string | null;
  approvedRevisionId: string | null;
}>): AccountLandingPageWorkspaceItem["state"] {
  if (input.status === "archived") return "archived";
  if (!input.configuration.complete) return "configuration_incomplete";
  if (!input.latestRevisionId) return "ready_to_generate";
  if (!input.approvedRevisionId) return "in_review";
  return input.latestRevisionId === input.approvedRevisionId
    ? "delivered"
    : "new_version_in_review";
}

export const landingPageWorkspaceStateLabels: Readonly<
  Record<AccountLandingPageWorkspaceItem["state"], string>
> = Object.freeze({
  configuration_incomplete: "Configuração incompleta",
  ready_to_generate: "Pronta para gerar",
  in_review: "Em análise",
  delivered: "Entregue",
  new_version_in_review: "Nova versão em análise",
  archived: "Arquivada",
});
