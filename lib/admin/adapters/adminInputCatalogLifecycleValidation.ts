import { createHash } from "node:crypto";

import type {
  LandingPageInputCatalogPlan,
  LandingPageInputCatalogTaxonChain,
  LandingPageInputCatalogTaxonIdentity,
  ValidateLandingPageInputCatalogDraftResult,
} from "@/conversion-content/landing-page/input-catalog";
import type { AccountLandingPageOnboardingStoredValues } from "@/lp-builder/contracts";
import { resolveAccountLandingPageOnboardingConfiguration } from "@/lp-builder/onboardingConfiguration";

export type InputCatalogOperationalConfiguration = Readonly<{
  accountId: string;
  landingPageId: string | null;
  planKey: LandingPageInputCatalogPlan;
  taxonChain: LandingPageInputCatalogTaxonChain;
  storedValues: AccountLandingPageOnboardingStoredValues;
  authoritativeValues: Readonly<Record<string, unknown>>;
}>;

export function countInvalidInputCatalogOperationalConfigurations(
  candidate: Extract<ValidateLandingPageInputCatalogDraftResult, { ok: true }>["value"],
  configurations: readonly InputCatalogOperationalConfiguration[],
): number {
  return configurations.filter((configuration) => {
    const result = resolveAccountLandingPageOnboardingConfiguration({
      accountId: configuration.accountId,
      landingPageId: configuration.landingPageId,
      catalogVersion: candidate.entry.version,
      revision: 1,
      planKey: configuration.planKey,
      taxonChain: configuration.taxonChain,
      storedValues: configuration.storedValues,
      authoritativeValues: configuration.authoritativeValues,
      registry: candidate.registry,
    });
    return !result.ok;
  }).length;
}

export function fingerprintInputCatalogOperationalContext(input: Readonly<{
  taxons: readonly Readonly<{
    identity: LandingPageInputCatalogTaxonIdentity;
    reviewedVersion: number | null;
    operational: boolean;
  }>[];
  operationalTaxonIds: ReadonlySet<string>;
  operationalConfigurations: readonly InputCatalogOperationalConfiguration[];
}>): string {
  const canonical = stableJson({
    taxons: input.taxons
      .map((taxon) => ({
        identity: taxon.identity,
        reviewedVersion: taxon.reviewedVersion,
        operational: taxon.operational,
      }))
      .sort((left, right) => left.identity.id.localeCompare(right.identity.id)),
    operationalTaxonIds: [...input.operationalTaxonIds].sort(),
    operationalConfigurations: input.operationalConfigurations
      .map((configuration) => ({
        accountId: configuration.accountId,
        landingPageId: configuration.landingPageId,
        planKey: configuration.planKey,
        taxonChain: configuration.taxonChain,
        storedValues: configuration.storedValues,
        authoritativeValues: configuration.authoritativeValues,
      }))
      .sort((left, right) =>
        `${left.accountId}:${left.landingPageId ?? ""}`.localeCompare(
          `${right.accountId}:${right.landingPageId ?? ""}`,
        ),
      ),
  });
  return createHash("sha256").update(canonical).digest("hex");
}

function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (isRecord(value)) {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableJson(value[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
