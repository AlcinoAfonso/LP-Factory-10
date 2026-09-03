import { createHash } from "node:crypto";

import type {
  LandingPageInputCatalogTaxonIdentity,
  ValidateLandingPageInputCatalogDraftResult,
} from "@/conversion-content/landing-page/input-catalog";
import {
  fingerprintInputCatalogEvaluationContextIdentity,
  sameInputCatalogEvaluationContextIdentity,
  type InputCatalogEvaluationContextIdentity,
} from "@/conversion-content/landing-page/taxon-preparation";

export function planPublishedInputCatalogReviewReconciliation(input: Readonly<{
  currentVersion: number;
  impacts: readonly Readonly<{
    taxonId: string;
    reviewedVersion: number | null;
  }>[];
  validEvidenceTaxonIds: ReadonlySet<string>;
}>): Readonly<{ taxonIdsToAdvance: readonly string[] }> {
  const taxonIdsToAdvance: string[] = [];
  for (const impact of input.impacts) {
    if (impact.reviewedVersion === input.currentVersion) continue;
    if (input.validEvidenceTaxonIds.has(impact.taxonId)) {
      taxonIdsToAdvance.push(impact.taxonId);
    }
  }
  return Object.freeze({
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

export function fingerprintInputCatalogLifecycleContext(input: Readonly<{
  taxons: readonly Readonly<{
    identity: LandingPageInputCatalogTaxonIdentity;
    reviewedVersion: number | null;
    selectedResearchVersion: number | null;
  }>[];
}>): string {
  const canonical = stableJson({
    taxons: input.taxons
      .map((taxon) => ({
        identity: taxon.identity,
        reviewedVersion: taxon.reviewedVersion,
        selectedResearchVersion: taxon.selectedResearchVersion,
      }))
      .sort((left, right) => left.identity.id.localeCompare(right.identity.id)),
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

// Preserve stableJson's original body for the frozen baseline oracle.
export { stableJson as serializeInputCatalogLifecycleValue };

export function createInputCatalogLifecycleProof(input: Readonly<{
  fingerprint: boolean;
  candidate?: Extract<ValidateLandingPageInputCatalogDraftResult, { ok: true }>["value"];
}>) {
  const hash = input.fingerprint ? createHash("sha256") : null;
  return {
    finish(context: Parameters<typeof fingerprintInputCatalogLifecycleContext>[0]) {
      hash?.update('{"taxons":');
      hash?.update(stableJson(context.taxons.map((taxon) => ({
        identity: taxon.identity,
        reviewedVersion: taxon.reviewedVersion,
        selectedResearchVersion: taxon.selectedResearchVersion,
      })).sort((left, right) => left.identity.id.localeCompare(right.identity.id))));
      hash?.update("}");
      return {
        fingerprint: hash?.digest("hex") ?? "",
        candidateContentFingerprint: input.candidate
          ? createHash("sha256").update(input.candidate.canonicalJson).digest("hex") : null,
      };
    },
  };
}
