import { createHash } from "node:crypto";

import type {
  CommercialContentAction,
  CommercialContentBlock,
  CommercialContentCard,
  CommercialContentValidationResult,
  CommercialGeneratedArtifactDraftResult,
  CommercialGeneratedArtifactIdentity,
  CommercialGeneratedContent,
  CommercialTemplateResolution,
} from "./contracts";

export const COMMERCIAL_CONTENT_SCHEMA_VERSION =
  "account_dashboard.commercial_page.v1" as const;

export function createCommercialGeneratedArtifactDraft(input: {
  resolution: CommercialTemplateResolution;
  locale?: string;
  content: unknown;
}): CommercialGeneratedArtifactDraftResult {
  const validation = validateCommercialGeneratedContent(input.content);

  if (!validation.ok) return validation;

  return {
    ok: true,
    artifact: {
      identity: createCommercialGeneratedArtifactIdentity({
        resolution: input.resolution,
        locale: input.locale,
      }),
      contentSchemaVersion: COMMERCIAL_CONTENT_SCHEMA_VERSION,
      content: validation.content,
    },
  };
}

export function createCommercialGeneratedArtifactIdentity(input: {
  resolution: CommercialTemplateResolution;
  locale?: string;
}): CommercialGeneratedArtifactIdentity {
  return {
    templateKey: input.resolution.template.key,
    templateVersion: input.resolution.template.version,
    audienceScope: input.resolution.template.audienceScope,
    locale: normalizeLocale(input.locale),
    source: input.resolution.source,
    researchTaxonId: input.resolution.researchTaxon?.taxonId ?? null,
    researchSources: [...input.resolution.researchSources],
  };
}

export function createCommercialGeneratedArtifactScopeKey(
  identity: CommercialGeneratedArtifactIdentity,
): string {
  return sha256({
    templateKey: normalizeValue(identity.templateKey),
    audienceScope: normalizeValue(identity.audienceScope),
    locale: normalizeValue(identity.locale),
    scopeType: identity.source === "generic" ? "generic" : "taxon",
    researchTaxonId:
      identity.source === "generic"
        ? null
        : normalizeNullableValue(identity.researchTaxonId),
  });
}

export function createCommercialGeneratedArtifactInputFingerprint(input: {
  identity: CommercialGeneratedArtifactIdentity;
  contentSchemaVersion: string;
}): string {
  return sha256({
    templateVersion: input.identity.templateVersion,
    contentSchemaVersion: normalizeValue(input.contentSchemaVersion),
    researchSources: [...input.identity.researchSources]
      .map((source) => ({
        researchId: normalizeValue(source.researchId),
        taxonId: normalizeValue(source.taxonId),
        block: source.block,
        version: source.version,
        updatedAt: normalizeTimestamp(source.updatedAt),
      }))
      .sort((left, right) => {
        const byBlock = left.block.localeCompare(right.block);
        if (byBlock !== 0) return byBlock;
        const byTaxon = left.taxonId.localeCompare(right.taxonId);
        if (byTaxon !== 0) return byTaxon;
        const byResearch = left.researchId.localeCompare(right.researchId);
        if (byResearch !== 0) return byResearch;
        const byVersion = left.version - right.version;
        if (byVersion !== 0) return byVersion;
        return left.updatedAt.localeCompare(right.updatedAt);
      }),
  });
}

export function validateCommercialGeneratedContent(
  value: unknown,
): CommercialContentValidationResult {
  const errors: string[] = [];

  if (!isRecord(value)) {
    return { ok: false, errors: ["content_must_be_an_object"] };
  }

  const headline = readRequiredString(value, "headline", errors);
  const primaryPromise = readRequiredString(
    value,
    "primaryPromise",
    errors,
  );
  const context = readRequiredString(value, "context", errors);
  const commercialCards = readCards(value.commercialCards, errors);
  const primaryCta = readAction(value.primaryCta, "primaryCta", errors);
  const secondaryCta = readAction(
    value.secondaryCta,
    "secondaryCta",
    errors,
  );
  const proofOrBenefitBlocks = readBlocks(
    value.proofOrBenefitBlocks,
    errors,
  );
  const missingDataAlerts = readStringArray(
    value.missingDataAlerts,
    "missingDataAlerts",
    errors,
  );

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    content: {
      headline,
      primaryPromise,
      context,
      commercialCards,
      primaryCta,
      secondaryCta,
      proofOrBenefitBlocks,
      missingDataAlerts,
    },
  };
}

function readCards(
  value: unknown,
  errors: string[],
): CommercialContentCard[] {
  if (!Array.isArray(value) || value.length === 0) {
    errors.push("commercialCards_must_be_a_non_empty_array");
    return [];
  }

  const cards = value.map((item, index) =>
    readTitledBlock(item, `commercialCards[${index}]`, errors),
  );
  validateUniqueKeys(cards, "commercialCards", errors);
  return cards;
}

function readBlocks(
  value: unknown,
  errors: string[],
): CommercialContentBlock[] {
  if (!Array.isArray(value) || value.length === 0) {
    errors.push("proofOrBenefitBlocks_must_be_a_non_empty_array");
    return [];
  }

  const blocks = value.map((item, index) =>
    readTitledBlock(item, `proofOrBenefitBlocks[${index}]`, errors),
  );
  validateUniqueKeys(blocks, "proofOrBenefitBlocks", errors);
  return blocks;
}

function readTitledBlock(
  value: unknown,
  path: string,
  errors: string[],
): CommercialContentCard {
  if (!isRecord(value)) {
    errors.push(`${path}_must_be_an_object`);
    return { key: "", title: "", body: "" };
  }

  return {
    key: readRequiredString(value, "key", errors, path),
    title: readRequiredString(value, "title", errors, path),
    body: readRequiredString(value, "body", errors, path),
  };
}

function readAction(
  value: unknown,
  path: string,
  errors: string[],
): CommercialContentAction {
  if (!isRecord(value)) {
    errors.push(`${path}_must_be_an_object`);
    return { label: "", supportingText: "" };
  }

  return {
    label: readRequiredString(value, "label", errors, path),
    supportingText: readRequiredString(
      value,
      "supportingText",
      errors,
      path,
    ),
  };
}

function readStringArray(
  value: unknown,
  path: string,
  errors: string[],
): string[] {
  if (!Array.isArray(value)) {
    errors.push(`${path}_must_be_an_array`);
    return [];
  }

  return value.map((item, index) => {
    if (typeof item !== "string" || !item.trim()) {
      errors.push(`${path}[${index}]_must_be_a_non_empty_string`);
      return "";
    }

    return item.trim();
  });
}

function readRequiredString(
  value: Record<string, unknown>,
  key: string,
  errors: string[],
  parent?: string,
): string {
  const path = parent ? `${parent}.${key}` : key;
  const item = value[key];

  if (typeof item !== "string" || !item.trim()) {
    errors.push(`${path}_must_be_a_non_empty_string`);
    return "";
  }

  return item.trim();
}

function validateUniqueKeys(
  values: Array<{ key: string }>,
  path: string,
  errors: string[],
): void {
  const keys = new Set<string>();

  for (const value of values) {
    if (!value.key) continue;
    if (keys.has(value.key)) {
      errors.push(`${path}_keys_must_be_unique`);
      return;
    }
    keys.add(value.key);
  }
}

function normalizeLocale(locale?: string): string {
  const normalized = locale?.trim();
  return normalized || "pt-BR";
}

function normalizeValue(value: string): string {
  return value.trim().toLowerCase();
}

function normalizeNullableValue(value: string | null): string | null {
  return value ? normalizeValue(value) : null;
}

function normalizeTimestamp(value: string): string {
  const normalized = value.trim();
  const timestamp = Date.parse(normalized);
  return Number.isNaN(timestamp)
    ? normalized
    : new Date(timestamp).toISOString();
}

function sha256(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
