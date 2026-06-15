import {
  COMMERCIAL_ACTIVATION_AUDIENCE_SCOPE,
  COMMERCIAL_ACTIVATION_RESEARCH_BLOCKS,
  COMMERCIAL_ACTIVATION_TEMPLATE_FAMILY,
  type CommercialActivationResearchBlock,
  type ContentComposition,
  type ContentCompositionItem,
  type ContentResearchSource,
  type ContentTemplate,
  type PublishedContentArtifact,
} from "./contracts";

const VARIANT_KEY_PATTERN = /^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/;

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function mapContentTemplate(value: unknown): ContentTemplate | null {
  if (!isRecord(value)) return null;
  if (
    !isNonEmptyString(value.id) ||
    !isNonEmptyString(value.template_key) ||
    !isNonEmptyString(value.slug) ||
    !isNonEmptyString(value.name) ||
    value.template_family !== COMMERCIAL_ACTIVATION_TEMPLATE_FAMILY ||
    (value.template_scope !== "page" && value.template_scope !== "section") ||
    (value.status !== "draft" &&
      value.status !== "active" &&
      value.status !== "archived") ||
    !isPositiveInteger(value.version) ||
    typeof value.is_active !== "boolean" ||
    !isRecord(value.payload_json)
  ) {
    return null;
  }

  return {
    id: value.id,
    key: value.template_key,
    slug: value.slug,
    name: value.name,
    family: value.template_family,
    scope: value.template_scope,
    status: value.status,
    version: value.version,
    isActive: value.is_active,
    payload: value.payload_json,
  };
}

export function mapCompositionItem(value: unknown): ContentCompositionItem | null {
  if (!isRecord(value)) return null;

  const sectionTemplate = mapContentTemplate(value.module);
  if (
    !isNonEmptyString(value.id) ||
    !sectionTemplate ||
    sectionTemplate.scope !== "section" ||
    sectionTemplate.status !== "active" ||
    !sectionTemplate.isActive ||
    !isNonEmptyString(value.variant_key) ||
    !VARIANT_KEY_PATTERN.test(value.variant_key) ||
    !isNonNegativeInteger(value.sort_order) ||
    typeof value.is_required !== "boolean" ||
    !isRecord(value.config_json)
  ) {
    return null;
  }

  return {
    id: value.id,
    module: sectionTemplate,
    variantKey: value.variant_key,
    sortOrder: value.sort_order,
    isRequired: value.is_required,
    config: value.config_json,
  };
}

export function mapContentComposition(input: {
  composition: unknown;
  template: unknown;
  items: unknown[];
}): ContentComposition | null {
  if (!isRecord(input.composition)) return null;

  const template = mapContentTemplate(input.template);
  const items = input.items.map(mapCompositionItem);

  if (
    !template ||
    template.scope !== "page" ||
    template.status !== "active" ||
    !template.isActive ||
    !isNonEmptyString(input.composition.id) ||
    !isNonEmptyString(input.composition.taxon_id) ||
    !isPositiveInteger(input.composition.version) ||
    (input.composition.status !== "draft" &&
      input.composition.status !== "active" &&
      input.composition.status !== "archived") ||
    items.some((item) => item === null)
  ) {
    return null;
  }

  const validItems = items as ContentCompositionItem[];
  const orderedItems = [...validItems].sort(
    (left, right) => left.sortOrder - right.sortOrder,
  );

  if (
    orderedItems.length === 0 ||
    new Set(orderedItems.map((item) => item.sortOrder)).size !==
      orderedItems.length
  ) {
    return null;
  }

  return {
    id: input.composition.id,
    template,
    taxonId: input.composition.taxon_id,
    version: input.composition.version,
    status: input.composition.status,
    items: orderedItems,
  };
}

export function mapResearchSource(value: unknown): ContentResearchSource | null {
  if (!isRecord(value)) return null;
  const research = isRecord(value.research) ? value.research : null;

  if (
    !research ||
    !isNonEmptyString(value.research_id) ||
    !isCommercialActivationResearchBlock(research.research_block) ||
    !isPositiveInteger(research.version)
  ) {
    return null;
  }

  return {
    researchId: value.research_id,
    block: research.research_block,
    version: research.version,
  };
}

export function mapPublishedContentArtifact(input: {
  artifact: unknown;
  researchSources: unknown[];
}): PublishedContentArtifact | null {
  if (!isRecord(input.artifact)) return null;

  const artifact = input.artifact;
  const sources = input.researchSources.map(mapResearchSource);
  if (
    !isNonEmptyString(artifact.id) ||
    !isNonEmptyString(artifact.template_id) ||
    !isNonEmptyString(artifact.composition_id) ||
    !isNonEmptyString(artifact.taxon_id) ||
    artifact.audience_scope !== COMMERCIAL_ACTIVATION_AUDIENCE_SCOPE ||
    !isPositiveInteger(artifact.template_version) ||
    !isPositiveInteger(artifact.composition_version) ||
    !isPositiveInteger(artifact.research_version) ||
    !isPositiveInteger(artifact.artifact_version) ||
    artifact.status !== "published" ||
    !isRecord(artifact.content_json) ||
    !isRecord(artifact.provenance_json) ||
    !isNonEmptyString(artifact.published_at) ||
    sources.length === 0 ||
    sources.some((source) => source === null)
  ) {
    return null;
  }

  const validSources = sources as ContentResearchSource[];
  if (
    validSources.some(
      (source) => source.version !== artifact.research_version,
    ) ||
    new Set(validSources.map((source) => source.block)).size !==
      validSources.length ||
    !COMMERCIAL_ACTIVATION_RESEARCH_BLOCKS.every((block) =>
      validSources.some((source) => source.block === block),
    )
  ) {
    return null;
  }

  return {
    id: artifact.id,
    templateId: artifact.template_id,
    compositionId: artifact.composition_id,
    taxonId: artifact.taxon_id,
    audienceScope: artifact.audience_scope,
    templateVersion: artifact.template_version,
    compositionVersion: artifact.composition_version,
    researchVersion: artifact.research_version,
    artifactVersion: artifact.artifact_version,
    content: artifact.content_json,
    provenance: artifact.provenance_json,
    researchSources: validSources,
    publishedAt: artifact.published_at,
  };
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isPositiveInteger(value: unknown): value is number {
  return Number.isInteger(value) && Number(value) > 0;
}

function isNonNegativeInteger(value: unknown): value is number {
  return Number.isInteger(value) && Number(value) >= 0;
}

function isCommercialActivationResearchBlock(
  value: unknown,
): value is CommercialActivationResearchBlock {
  return COMMERCIAL_ACTIVATION_RESEARCH_BLOCKS.includes(
    value as CommercialActivationResearchBlock,
  );
}
