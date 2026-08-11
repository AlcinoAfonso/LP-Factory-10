import {
  LANDING_PAGE_GENERATION_CONTEXT_SNAPSHOT_VERSION,
  LANDING_PAGE_MATERIALIZED_CONTENT_SCHEMA_VERSION,
  validateLandingPageGenerationContextSnapshotV1,
  validateLandingPageMaterializedContentV1,
  type LandingPageGenerationContextSnapshotV1,
  type LandingPageMaterializedContentV1,
} from "../conversion-content/landing-page";
import type { LandingPageGenerationContextPackage } from "./generationContextContracts";
import type {
  LandingPageDraftCandidate,
  LandingPageDraftFieldValue,
} from "./landingPageGenerationContracts";

export type BuildLandingPageInitialMaterializationResult =
  | Readonly<{
      ok: true;
      content: LandingPageMaterializedContentV1;
      snapshot: LandingPageGenerationContextSnapshotV1;
    }>
  | Readonly<{ ok: false; error: "INVALID_CANDIDATE" | "INVALID_SNAPSHOT" }>;

export function buildLandingPageInitialMaterialization(input: Readonly<{
  context: LandingPageGenerationContextPackage;
  candidate: LandingPageDraftCandidate;
  exposedGenerationContext: Readonly<Record<string, unknown>>;
}>): BuildLandingPageInitialMaterializationResult {
  const { context, candidate } = input;
  if (
    candidate.candidateVersion !== 1 ||
    candidate.modules.length !== context.partA.modules.length
  ) {
    return { ok: false, error: "INVALID_CANDIDATE" };
  }

  const modules: LandingPageMaterializedContentV1["modules"][number][] = [];
  for (const [index, selected] of context.partA.modules.entries()) {
    const candidateModule = candidate.modules[index];
    if (
      !candidateModule ||
      candidateModule.order !== index ||
      candidateModule.moduleKey !== selected.module.moduleKey ||
      candidateModule.moduleVersion !== selected.module.moduleVersion ||
      candidateModule.variantKey !== selected.variant.variantKey ||
      candidateModule.variantVersion !== selected.variant.variantVersion ||
      candidateModule.fieldContractKey !== selected.fieldContract.fieldContractKey ||
      JSON.stringify(candidateModule.interactionContracts) !== JSON.stringify(selected.variant.interactionContracts)
    ) {
      return { ok: false, error: "INVALID_CANDIDATE" };
    }

    const fields: LandingPageMaterializedContentV1["modules"][number]["fields"][number][] = [];
    const allowedKeys = new Set(selected.fieldContract.fields.map((field) => field.fieldKey));
    if (Object.keys(candidateModule.fields).some((fieldKey) => !allowedKeys.has(fieldKey))) {
      return { ok: false, error: "INVALID_CANDIDATE" };
    }
    for (const definition of selected.fieldContract.fields) {
      const candidateValue = candidateModule.fields[definition.fieldKey];
      if (!candidateValue) {
        if (definition.cardinality.min > 0) return { ok: false, error: "INVALID_CANDIDATE" };
        continue;
      }
      const materialized = materializeField(definition, candidateValue);
      if (!materialized) return { ok: false, error: "INVALID_CANDIDATE" };
      fields.push(materialized);
    }
    if (!validateMaterializedFields(fields, selected.fieldContract.fields, selected.effectiveRoot)) {
      return { ok: false, error: "INVALID_CANDIDATE" };
    }
    const interactionContracts = materializeInteractionContracts(
      candidateModule.interactionContracts,
      context.partA.presentation.privacyPolicyUrl,
    );
    if (!interactionContracts) return { ok: false, error: "INVALID_CANDIDATE" };
    modules.push({
      moduleKey: candidateModule.moduleKey,
      moduleVersion: candidateModule.moduleVersion,
      variantKey: candidateModule.variantKey,
      variantVersion: candidateModule.variantVersion,
      fieldContractKey: candidateModule.fieldContractKey,
      interactionContracts,
      fields,
    });
  }

  const contentCandidate = {
    schemaVersion: LANDING_PAGE_MATERIALIZED_CONTENT_SCHEMA_VERSION,
    family: "landing_page" as const,
    root: {
      rootVersion: context.partA.root.rootVersion,
      brandColorPalette: context.partA.presentation.brandColorPalette,
      resolvedPresetKey: context.partA.root.resolvedPresetKey,
      resolvedPreset: context.partA.root.resolvedPreset,
      effectiveSemanticRoles: context.partA.root.semanticRoles,
      visualRoles: context.partA.root.visualRoles,
      visualCriteria: context.partA.root.visualCriteria,
    },
    modules,
  };
  const content = validateLandingPageMaterializedContentV1(contentCandidate);
  if (!content.ok) return { ok: false, error: "INVALID_CANDIDATE" };

  const snapshotCandidate = {
    snapshotVersion: LANDING_PAGE_GENERATION_CONTEXT_SNAPSHOT_VERSION,
    generationContextContractVersion: context.contractVersion,
    structuralIdentities: {
      planKey: context.partA.planKey,
      servedTaxonId: context.partA.servedTaxon.id,
      generationProfileId: context.partA.generationProfile.profileId,
      versions: context.partA.versions,
      modules: context.partA.modules.map((module, index) => ({
        order: index,
        moduleKey: module.module.moduleKey,
        moduleVersion: module.module.moduleVersion,
        variantKey: module.variant.variantKey,
        variantVersion: module.variant.variantVersion,
        fieldContractKey: module.fieldContract.fieldContractKey,
      })),
    },
    exposedGenerationContext: input.exposedGenerationContext,
  };
  const snapshot = validateLandingPageGenerationContextSnapshotV1(snapshotCandidate);
  if (!snapshot.ok) return { ok: false, error: "INVALID_SNAPSHOT" };
  return { ok: true, content: content.value, snapshot: snapshot.value };
}

function materializeInteractionContracts(
  interactions: LandingPageDraftCandidate["modules"][number]["interactionContracts"],
  privacyPolicyUrl: string | undefined,
): LandingPageMaterializedContentV1["modules"][number]["interactionContracts"] | null {
  const materialized: LandingPageMaterializedContentV1["modules"][number]["interactionContracts"][number][] = [];
  for (const interaction of interactions) {
    if (interaction.kind === "form") {
      if (!privacyPolicyUrl) return null;
      materialized.push({
        kind: "form",
        fields: interaction.fields.map((field) => ({ ...field })),
        consent: {
          ...interaction.consent,
          privacyPolicyUrl,
        },
        accessibility: { ...interaction.accessibility },
        operationalBinding: { ...interaction.operationalBinding },
      });
      continue;
    }
    materialized.push(structuredClone(interaction));
  }
  return materialized;
}

type FieldDefinition = LandingPageGenerationContextPackage["partA"]["modules"][number]["fieldContract"]["fields"][number];

function materializeField(
  definition: FieldDefinition,
  value: LandingPageDraftFieldValue,
): LandingPageMaterializedContentV1["modules"][number]["fields"][number] | null {
  if (definition.fieldKind === "text" && value.kind === "text" && value.value) {
    return { kind: "text", fieldKey: definition.fieldKey, value: value.value };
  }
  if (definition.fieldKind === "action" && value.kind === "action") {
    return { kind: "action", fieldKey: definition.fieldKey, label: value.label, binding: value.binding as {
      fieldKey: "primary_conversion_channel";
      channel: string;
      destination: string | null;
    } };
  }
  if (definition.fieldKind === "image" && value.kind === "image" && typeof value.reference === "string") {
    return { kind: "image", fieldKey: definition.fieldKey, reference: value.reference };
  }
  if (definition.fieldKind === "technical_reference" && value.kind === "technical_reference" && typeof value.value === "string") {
    return {
      kind: "technical_reference",
      fieldKey: definition.fieldKey,
      referenceKey: value.referenceKey,
      value: value.value,
    };
  }
  if (definition.fieldKind !== "collection" || value.kind !== "collection") return null;
  if (value.items.length < definition.cardinality.min || value.items.length > definition.cardinality.max) return null;
  const allowedItemKeys = new Set(definition.itemFields.map((field) => field.fieldKey));
  if (value.items.some((item) => Object.keys(item.fields).some((fieldKey) => !allowedItemKeys.has(fieldKey)))) return null;
  type MaterializedCollectionItemField = Extract<
    LandingPageMaterializedContentV1["modules"][number]["fields"][number],
    { kind: "collection" }
  >["items"][number]["fields"][number];
  return {
    kind: "collection",
    fieldKey: definition.fieldKey,
    items: value.items.map((item) => ({
      fields: definition.itemFields.reduce<MaterializedCollectionItemField[]>((materializedFields, itemDefinition) => {
        const itemValue = item.fields[itemDefinition.fieldKey];
        if (itemDefinition.fieldKind === "text" && itemValue?.kind === "text" && itemValue.value) {
          materializedFields.push({ kind: "text", fieldKey: itemDefinition.fieldKey, value: itemValue.value });
        }
        if (itemDefinition.fieldKind === "technical_reference" && itemValue?.kind === "technical_reference" && typeof itemValue.value === "string") {
          materializedFields.push({
            kind: "technical_reference",
            fieldKey: itemDefinition.fieldKey,
            referenceKey: itemValue.referenceKey,
            value: itemValue.value,
          });
        }
        return materializedFields;
      }, []),
    })),
  };
}

type EffectiveRoot = LandingPageGenerationContextPackage["partA"]["modules"][number]["effectiveRoot"];
type MaterializedField = LandingPageMaterializedContentV1["modules"][number]["fields"][number];

function validateMaterializedFields(
  fields: readonly MaterializedField[],
  definitions: readonly FieldDefinition[],
  effectiveRoot: EffectiveRoot,
) {
  const byKey = new Map(fields.map((field) => [field.fieldKey, field]));
  if (byKey.size !== fields.length) return false;
  if (fields.some((field) => !definitions.some((definition) => definition.fieldKey === field.fieldKey))) return false;
  for (const definition of definitions) {
    const field = byKey.get(definition.fieldKey);
    if (!field) {
      if (definition.cardinality.min > 0) return false;
      continue;
    }
    if (field.kind !== definition.fieldKind) return false;
    if (field.kind === "text" && definition.fieldKind === "text" &&
      field.value.length > effectiveRoot.semanticRoles[definition.semanticRole].textRange.absoluteMax) return false;
    if (field.kind === "action" && definition.fieldKind === "action" &&
      field.label.length > effectiveRoot.semanticRoles[definition.label.semanticRole].textRange.absoluteMax) return false;
    if (field.kind === "technical_reference" && definition.fieldKind === "technical_reference" &&
      field.referenceKey !== definition.path) return false;
    if (field.kind !== "collection" || definition.fieldKind !== "collection") continue;
    if (field.items.length < definition.cardinality.min || field.items.length > definition.cardinality.max) return false;
    for (const item of field.items) {
      const itemByKey = new Map(item.fields.map((itemField) => [itemField.fieldKey, itemField]));
      if (itemByKey.size !== item.fields.length ||
        item.fields.some((itemField) => !definition.itemFields.some((itemDefinition) => itemDefinition.fieldKey === itemField.fieldKey))) return false;
      for (const itemDefinition of definition.itemFields) {
        const itemField = itemByKey.get(itemDefinition.fieldKey);
        if (!itemField) {
          if (itemDefinition.cardinality.min > 0) return false;
          continue;
        }
        if (itemField.kind !== itemDefinition.fieldKind) return false;
        if (itemField.kind === "text" && itemDefinition.fieldKind === "text" &&
          itemField.value.length > effectiveRoot.semanticRoles[itemDefinition.semanticRole].textRange.absoluteMax) return false;
        if (itemField.kind === "technical_reference" && itemDefinition.fieldKind === "technical_reference" &&
          itemField.referenceKey !== itemDefinition.path) return false;
      }
    }
  }
  return true;
}
