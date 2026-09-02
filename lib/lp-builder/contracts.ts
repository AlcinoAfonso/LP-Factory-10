import type {
  LandingPageInputCatalogPlan,
  LandingPageInputCatalogTaxonChain,
  LandingPageInputValueScope,
  ResolvedLandingPageInputField,
} from "../conversion-content/landing-page/input-catalog";

export type AccountLandingPageOnboardingStoredValue = Readonly<{
  scope: LandingPageInputValueScope;
  value: unknown;
}>;

export type AccountLandingPageOnboardingStoredValues = Readonly<
  Record<string, AccountLandingPageOnboardingStoredValue>
>;

export type AccountLandingPageOnboardingValueSource =
  | "authoritative"
  | "configuration"
  | "missing";

export type AccountLandingPageOnboardingFieldState = Readonly<{
  field: ResolvedLandingPageInputField;
  source: AccountLandingPageOnboardingValueSource;
  value?: unknown;
  applicable: boolean;
  required: boolean;
}>;

export type AccountLandingPageOnboardingConfiguration = Readonly<{
  accountId: string;
  landingPageId: string | null;
  catalogVersion: number;
  revision: number;
  planKey: LandingPageInputCatalogPlan;
  taxonChain: LandingPageInputCatalogTaxonChain;
  storedValues: AccountLandingPageOnboardingStoredValues;
  fields: readonly AccountLandingPageOnboardingFieldState[];
  missingRequiredFieldKeys: readonly string[];
  complete: boolean;
}>;
