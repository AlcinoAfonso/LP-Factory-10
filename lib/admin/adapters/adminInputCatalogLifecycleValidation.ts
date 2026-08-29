import { createHash } from "node:crypto";

import type {
  LandingPageInputCatalogPlan,
  LandingPageInputCatalogTransitionClassification,
  LandingPageInputCatalogTaxonChain,
  LandingPageInputCatalogTaxonIdentity,
  ValidateLandingPageInputCatalogDraftResult,
} from "@/conversion-content/landing-page/input-catalog";
import type { AccountLandingPageOnboardingStoredValues } from "@/lp-builder/contracts";
import { resolveAccountLandingPageOnboardingConfiguration } from "@/lp-builder/onboardingConfiguration";
import {
  fingerprintInputCatalogEvaluationContextIdentity,
  sameInputCatalogEvaluationContextIdentity,
  type InputCatalogEvaluationContextIdentity,
} from "@/conversion-content/landing-page/taxon-preparation";

export type InputCatalogOperationalConfiguration = Readonly<{
  accountId: string;
  landingPageId: string | null;
  planKey: LandingPageInputCatalogPlan;
  taxonChain: LandingPageInputCatalogTaxonChain;
  storedValues: AccountLandingPageOnboardingStoredValues;
  authoritativeValues: Readonly<Record<string, unknown>>;
}>;

export type InputCatalogOperationalAccountAuthority = Readonly<{
  accountId: string;
  accountName: string;
  planKey: LandingPageInputCatalogPlan;
}>;

export function resolveInputCatalogOperationalAccountAuthorities(input: Readonly<{
  candidateAccountIds: ReadonlySet<string>;
  accounts: readonly unknown[];
  entitlements: readonly unknown[];
}>):
  | Readonly<{ ok: true; value: readonly InputCatalogOperationalAccountAuthority[] }>
  | Readonly<{ ok: false }> {
  const accounts = new Map<string, Readonly<{ name: string; status: string }>>();
  for (const row of input.accounts) {
    if (
      !isRecord(row) ||
      typeof row.id !== "string" ||
      typeof row.name !== "string" ||
      typeof row.status !== "string" ||
      accounts.has(row.id)
    ) {
      return { ok: false };
    }
    accounts.set(row.id, { name: row.name, status: row.status });
  }

  const entitlements = new Map<string, Readonly<{
    planKey: string | null;
    commerciallyEligible: boolean;
  }>>();
  for (const row of input.entitlements) {
    if (
      !isRecord(row) ||
      typeof row.account_id !== "string" ||
      typeof row.is_commercially_eligible !== "boolean" ||
      (row.plan_key !== null && typeof row.plan_key !== "string") ||
      entitlements.has(row.account_id)
    ) {
      return { ok: false };
    }
    entitlements.set(row.account_id, {
      planKey: row.plan_key,
      commerciallyEligible: row.is_commercially_eligible,
    });
  }

  const operational: InputCatalogOperationalAccountAuthority[] = [];
  for (const accountId of [...input.candidateAccountIds].sort()) {
    const account = accounts.get(accountId);
    if (!account) return { ok: false };
    if (account.status !== "active") continue;
    const entitlement = entitlements.get(accountId);
    if (!entitlement?.commerciallyEligible) continue;
    if (!isOperationalPlan(entitlement.planKey)) return { ok: false };
    operational.push({
      accountId,
      accountName: account.name,
      planKey: entitlement.planKey,
    });
  }
  return { ok: true, value: Object.freeze(operational) };
}

export function planPublishedInputCatalogReviewReconciliation(input: Readonly<{
  currentVersion: number;
  impacts: readonly Readonly<{
    taxonId: string;
    reviewedVersion: number | null;
    operational: boolean;
    classification: LandingPageInputCatalogTransitionClassification;
  }>[];
  validEvidenceTaxonIds: ReadonlySet<string>;
}>): Readonly<{
  blockingTaxonIds: readonly string[];
  taxonIdsToAdvance: readonly string[];
}> {
  const blockingTaxonIds: string[] = [];
  const taxonIdsToAdvance: string[] = [];
  for (const impact of input.impacts) {
    if (impact.reviewedVersion === input.currentVersion) continue;
    if (input.validEvidenceTaxonIds.has(impact.taxonId)) {
      taxonIdsToAdvance.push(impact.taxonId);
    } else if (
      impact.operational &&
      impact.classification === "review_required"
    ) {
      blockingTaxonIds.push(impact.taxonId);
    }
  }
  return Object.freeze({
    blockingTaxonIds: Object.freeze(blockingTaxonIds.sort()),
    taxonIdsToAdvance: Object.freeze(taxonIdsToAdvance.sort()),
  });
}

export function validatePublishedInputCatalogReviewEvidenceContext(input: Readonly<{
  storedContextFingerprint: string;
  preservedDraftIdentity: InputCatalogEvaluationContextIdentity;
  deployedIdentity: InputCatalogEvaluationContextIdentity;
  expectedTaxonId: string;
  expectedResearchVersion: number;
  expectedInputCatalogVersion: number;
}>): boolean {
  const storedFingerprintMatches =
    fingerprintInputCatalogEvaluationContextIdentity(input.preservedDraftIdentity) ===
      input.storedContextFingerprint ||
    fingerprintLegacyStoredInputCatalogEvaluationContextIdentity(
      input.preservedDraftIdentity,
    ) === input.storedContextFingerprint;
  if (!storedFingerprintMatches) return false;

  if (
    input.preservedDraftIdentity.taxonId !== input.expectedTaxonId ||
    input.deployedIdentity.taxonId !== input.expectedTaxonId ||
    input.preservedDraftIdentity.research.researchVersion !==
      input.expectedResearchVersion ||
    input.deployedIdentity.research.researchVersion !==
      input.expectedResearchVersion ||
    input.preservedDraftIdentity.inputCatalog.version !==
      input.expectedInputCatalogVersion ||
    input.deployedIdentity.inputCatalog.version !==
      input.expectedInputCatalogVersion
  ) {
    return false;
  }

  return sameInputCatalogEvaluationContextIdentity(
    input.preservedDraftIdentity,
    input.deployedIdentity,
  );
}

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
    selectedResearchVersion: number | null;
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
        selectedResearchVersion: taxon.selectedResearchVersion,
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

function fingerprintLegacyStoredInputCatalogEvaluationContextIdentity(
  identity: InputCatalogEvaluationContextIdentity,
): string {
  return createHash("sha256").update(JSON.stringify(identity)).digest("hex");
}

function isOperationalPlan(value: unknown): value is LandingPageInputCatalogPlan {
  return (
    value === "starter" ||
    value === "lite" ||
    value === "pro" ||
    value === "ultra"
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
