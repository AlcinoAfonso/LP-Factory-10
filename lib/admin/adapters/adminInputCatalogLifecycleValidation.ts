import { createHash } from "node:crypto";

import type {
  LandingPageInputCatalogTaxonIdentity,
  ValidateLandingPageInputCatalogDraftResult,
} from "@/conversion-content/landing-page/input-catalog";

export function fingerprintInputCatalogLifecycleContext(input: Readonly<{
  taxons: readonly Readonly<{ identity: LandingPageInputCatalogTaxonIdentity }>[];
}>): string {
  const canonical = stableJson({
    taxons: input.taxons
      .map((taxon) => canonicalTaxonIdentity(taxon.identity))
      .sort((left, right) => left.id.localeCompare(right.id)),
  });
  return createHash("sha256").update(canonical).digest("hex");
}

export function matchesInputCatalogLifecycleConfirmation(input: Readonly<{
  expectedRevision: number;
  expectedContentFingerprint: string;
  expectedLifecycleContextFingerprint: string;
  currentRevision: number;
  currentContentFingerprint: string;
  currentLifecycleContextFingerprint: string;
}>): boolean {
  return input.expectedRevision === input.currentRevision &&
    input.expectedContentFingerprint === input.currentContentFingerprint &&
    input.expectedLifecycleContextFingerprint === input.currentLifecycleContextFingerprint;
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
      hash?.update(stableJson(context.taxons
        .map((taxon) => canonicalTaxonIdentity(taxon.identity))
        .sort((left, right) => left.id.localeCompare(right.id))));
      hash?.update("}");
      return {
        fingerprint: hash?.digest("hex") ?? "",
        candidateContentFingerprint: input.candidate
          ? createHash("sha256").update(input.candidate.canonicalJson).digest("hex") : null,
      };
    },
  };
}

function canonicalTaxonIdentity(identity: LandingPageInputCatalogTaxonIdentity) {
  return {
    id: identity.id,
    parentId: identity.parentId,
    level: identity.level,
    name: identity.name,
    slug: identity.slug,
  };
}
