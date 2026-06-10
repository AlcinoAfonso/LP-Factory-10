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

export function createCommercialGeneratedArtifactIdentityKey(
  identity: CommercialGeneratedArtifactIdentity,
): string {
  const researchSources = [...identity.researchSources]
    .sort((left, right) => {
      const byBlock = left.block.localeCompare(right.block);
      if (byBlock !== 0) return byBlock;
      return left.researchId.localeCompare(right.researchId);
    })
    .map((source) => ({
      researchId: source.researchId,
      taxonId: source.taxonId,
      block: source.block,
      version: source.version,
      updatedAt: source.updatedAt,
    }));

  return JSON.stringify({
    templateKey: identity.templateKey,
    templateVersion: identity.templateVersion,
    audienceScope: identity.audienceScope,
    locale: identity.locale,
    mode: identity.source === "generic" ? "generic" : "taxon_specific",
    researchTaxonId: identity.researchTaxonId,
    researchSources,
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
