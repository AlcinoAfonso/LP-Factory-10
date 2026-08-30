import type {
  LandingPageInputCatalogPlan,
  LandingPageInputCatalogRegistry,
  LandingPageInputCatalogTaxonChain,
} from "../conversion-content/landing-page/input-catalog";
import type { AccountLandingPageOnboardingStoredValues } from "./contracts";
import { resolveAccountLandingPageOnboardingConfiguration } from "./onboardingConfiguration";

export type AccountLandingPageOperationalCompatibilityInput = Readonly<{
  candidateCatalog: Readonly<{
    version: number;
    registry: LandingPageInputCatalogRegistry;
  }>;
  configuration: Readonly<{
    accountId: string;
    landingPageId: string | null;
    planKey: LandingPageInputCatalogPlan;
    taxonChain: LandingPageInputCatalogTaxonChain;
    storedValues: AccountLandingPageOnboardingStoredValues;
    authoritativeValues: Readonly<Record<string, unknown>>;
  }>;
}>;

/** Compatibility is independent of completeness and never selects a default catalog. */
export function isAccountLandingPageOperationalConfigurationCompatible(
  input: AccountLandingPageOperationalCompatibilityInput,
): boolean {
  // Keep untyped callers from activating the resolver's published-registry fallback.
  if (!input.candidateCatalog.registry) return false;

  return resolveAccountLandingPageOnboardingConfiguration({
    // The resolver freezes taxons and structured values in its output. Copy only
    // operational configuration data, never the candidate registry.
    ...structuredClone(input.configuration),
    catalogVersion: input.candidateCatalog.version,
    registry: input.candidateCatalog.registry,
    // Technical projection metadata, never an operational revision or completeness gate.
    revision: 1,
  }).ok;
}
