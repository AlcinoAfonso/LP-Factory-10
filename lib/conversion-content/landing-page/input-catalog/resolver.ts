import type {
  LandingPageInputCatalogErrorCode,
  LandingPageInputCatalogLayer,
  LandingPageInputCatalogLayerLevel,
  LandingPageInputCatalogPlan,
  LandingPageInputCatalogRegistry,
  LandingPageInputCatalogTaxonChain,
  LandingPageInputFieldDefinition,
  LandingPageInputFieldProvenance,
  LandingPageInputFieldSpecialization,
  LandingPageInputValidation,
  ResolveLandingPageInputCatalogInput,
  ResolveLandingPageInputCatalogResult,
  ResolvedLandingPageInputField,
} from "./contracts";
import { landingPageInputCatalogRegistry } from "./registry";
import {
  landingPageInputCatalogLayerSchema,
  landingPageInputCatalogTaxonIdentitySchema,
  landingPageInputFieldDefinitionSchema,
} from "./schema";

const validPlans = new Set<LandingPageInputCatalogPlan>([
  "starter",
  "lite",
  "pro",
  "ultra",
]);
const mutableSpecializationProperties = new Set([
  "obligation",
  "allowedPlans",
  "validation",
]);

export function resolveLandingPageInputCatalog(
  input: ResolveLandingPageInputCatalogInput,
): ResolveLandingPageInputCatalogResult {
  return resolveLandingPageInputCatalogFromRegistry(
    input,
    landingPageInputCatalogRegistry,
  );
}

export function resolveLandingPageInputCatalogFromRegistry(
  input: ResolveLandingPageInputCatalogInput,
  registry: LandingPageInputCatalogRegistry,
): ResolveLandingPageInputCatalogResult {
  const entry = registry[input.version];
  if (!entry || entry.version !== input.version) {
    return invalid("UNKNOWN_VERSION", `Unknown input catalog version: ${input.version}`);
  }
  if (!validPlans.has(input.plan as LandingPageInputCatalogPlan)) {
    return invalid("INVALID_PLAN", `Unknown input catalog plan: ${input.plan}`);
  }
  const chainError = validateTaxonChain(input.taxonChain);
  if (chainError) return chainError;

  const selectedLayers: LandingPageInputCatalogLayer[] = [entry.universal];
  const chainTaxons = [
    input.taxonChain.segment,
    input.taxonChain.niche,
    input.taxonChain.ultraNiche,
  ].filter((taxon) => taxon !== undefined);

  for (const taxon of chainTaxons) {
    const layer = entry.taxonLayers[taxon.slug];
    if (!layer) continue;
    if (layer.level === "ultra_niche" && !input.ultraNicheLayerAuthorized) {
      return invalid(
        "UNAUTHORIZED_ULTRA_NICHE_LAYER",
        `Ultra-niche layer is not authorized: ${taxon.slug}`,
      );
    }
    if (!sameTaxon(layer.taxon, taxon)) {
      return invalid("INVALID_LAYER", `Layer identity does not match taxon chain: ${taxon.slug}`);
    }
    selectedLayers.push(layer);
  }

  const fields: ResolvedLandingPageInputField[] = [];
  for (const layer of selectedLayers) {
    for (const layerEntry of layer.entries) {
      if (layerEntry.kind === "field") {
        const originError = validateFieldOriginForLayer(layerEntry, layer);
        if (originError) return originError;
        const fieldError = classifyFieldError(layerEntry);
        if (fieldError) return fieldError;
      }
    }
    if (!landingPageInputCatalogLayerSchema.safeParse(layer).success) {
      return invalid("INVALID_LAYER", `Invalid ${layer.level} input catalog layer`);
    }
    for (const layerEntry of layer.entries) {
      if (layerEntry.kind === "field") {
        if (fields.some((field) => field.fieldKey === layerEntry.fieldKey)) {
          return invalid("DUPLICATE_FIELD", `Duplicate field without specialization: ${layerEntry.fieldKey}`);
        }
        fields.push({
          ...cloneJson(layerEntry),
          provenance: [provenance("definition", layer)],
        });
        continue;
      }

      const specializationResult = applySpecialization(fields, layerEntry, layer);
      if (!specializationResult.ok) return specializationResult;
    }
  }

  const conditionError = validateConditions(fields);
  if (conditionError) return conditionError;

  const plan = input.plan as LandingPageInputCatalogPlan;
  const effectiveFields = fields.filter((field) => field.allowedPlans.includes(plan));
  const effectiveConditionError = validateConditions(effectiveFields);
  if (effectiveConditionError) return effectiveConditionError;

  const servedTaxon = input.taxonChain.ultraNiche ?? input.taxonChain.niche ?? input.taxonChain.segment;
  return {
    ok: true,
    value: deepFreeze(cloneJson({
      version: input.version,
      servedTaxon,
      plan,
      appliedLayers: selectedLayers.map((layer) => ({ level: layer.level, taxon: layer.taxon })),
      fields: effectiveFields,
      valid: true as const,
    })),
  };
}

function applySpecialization(
  fields: ResolvedLandingPageInputField[],
  specialization: LandingPageInputFieldSpecialization,
  layer: LandingPageInputCatalogLayer,
): ResolveLandingPageInputCatalogResult | { ok: true } {
  const index = fields.findIndex((field) => field.fieldKey === specialization.fieldKey);
  if (index < 0) {
    return invalid("INVALID_SPECIALIZATION", `Specialization target does not exist: ${specialization.fieldKey}`);
  }
  const changeKeys = Object.keys(specialization.changes);
  const immutableChange = changeKeys.find((key) => !mutableSpecializationProperties.has(key));
  if (immutableChange) {
    return invalid(
      "IMMUTABLE_PROPERTY_CONFLICT",
      `Immutable property cannot be specialized: ${specialization.fieldKey}.${immutableChange}`,
    );
  }
  if (changeKeys.length === 0) {
    return invalid("INVALID_SPECIALIZATION", `Empty specialization: ${specialization.fieldKey}`);
  }

  const inherited = fields[index];
  const latestAppliedLevel = inherited.provenance.reduce(
    (latest, item) => Math.max(latest, layerRank(item.layer)),
    -1,
  );
  if (layerRank(layer.level) <= latestAppliedLevel) {
    return invalid(
      "INVALID_SPECIALIZATION",
      `Specialization must be in a strictly more specific layer: ${specialization.fieldKey}`,
    );
  }
  const provenanceItems = [...inherited.provenance];
  if (specialization.changes.obligation !== undefined) {
    const ranks = { optional: 0, conditional: 1, required: 2 } as const;
    if (
      !Object.hasOwn(ranks, specialization.changes.obligation) ||
      ranks[specialization.changes.obligation] <= ranks[inherited.obligation]
    ) {
      return invalid("INVALID_SPECIALIZATION", `Obligation is not more restrictive: ${specialization.fieldKey}`);
    }
    provenanceItems.push(provenance("obligation", layer));
  }
  if (specialization.changes.allowedPlans !== undefined) {
    const plans = specialization.changes.allowedPlans;
    if (!Array.isArray(plans) || plans.length === 0 || plans.some((plan) => !inherited.allowedPlans.includes(plan))) {
      return invalid("INVALID_SPECIALIZATION", `Plans must be a non-empty inherited subset: ${specialization.fieldKey}`);
    }
    if (new Set(plans).size !== plans.length) {
      return invalid("INVALID_SPECIALIZATION", `Specialized plans must be unique: ${specialization.fieldKey}`);
    }
    provenanceItems.push(provenance("allowedPlans", layer));
  }
  if (specialization.changes.validation !== undefined) {
    if (!isRestrictiveValidation(inherited.validation, specialization.changes.validation)) {
      return invalid("INVALID_SPECIALIZATION", `Validation is not a comparable restriction: ${specialization.fieldKey}`);
    }
    provenanceItems.push(provenance("validation", layer));
  }

  const specialized = {
    ...inherited,
    ...cloneJson(specialization.changes),
    provenance: provenanceItems,
  } as ResolvedLandingPageInputField;
  if (!landingPageInputFieldDefinitionSchema.safeParse(specializedWithoutProvenance(specialized)).success) {
    return invalid("INVALID_SPECIALIZATION", `Specialization produced an invalid field: ${specialization.fieldKey}`);
  }
  fields[index] = specialized;
  return { ok: true };
}

function isRestrictiveValidation(inherited: LandingPageInputValidation, next: LandingPageInputValidation): boolean {
  if (inherited.kind !== next.kind) return false;
  if (inherited.kind === "enum" && next.kind === "enum") {
    return next.allowedValues.length > 0 && next.allowedValues.every((value) => inherited.allowedValues.includes(value));
  }
  if (inherited.kind === "string_list" && next.kind === "string_list") {
    if (JSON.stringify(inherited.allowedValues ?? null) !== JSON.stringify(next.allowedValues ?? null)) return false;
    const inheritedMin = inherited.minItems ?? 1;
    const inheritedMax = inherited.maxItems ?? Number.POSITIVE_INFINITY;
    const nextMin = next.minItems ?? 1;
    const nextMax = next.maxItems ?? Number.POSITIVE_INFINITY;
    return nextMin >= inheritedMin && nextMax <= inheritedMax && nextMin <= nextMax;
  }
  if (inherited.kind === "number_range" && next.kind === "number_range") {
    const inheritedMin = inherited.minimum ?? 0;
    const inheritedMax = inherited.maximum ?? Number.POSITIVE_INFINITY;
    const nextMin = next.minimum ?? 0;
    const nextMax = next.maximum ?? Number.POSITIVE_INFINITY;
    return next.currency === inherited.currency && nextMin >= inheritedMin && nextMax <= inheritedMax && nextMin <= nextMax;
  }
  return false;
}

function validateConditions(fields: readonly LandingPageInputFieldDefinition[]): ResolveLandingPageInputCatalogResult | null {
  const byKey = new Map(fields.map((field) => [field.fieldKey, field]));
  const edges = new Map<string, string[]>();
  for (const field of fields) {
    const conditions = [field.requiredWhen, field.applicableWhen].filter((condition) => condition !== undefined);
    for (const condition of conditions) {
      const referenced = byKey.get(condition.fieldKey);
      if (!referenced || !conditionIsCompatible(referenced, condition)) {
        return invalid("INVALID_CONDITION", `Invalid condition on ${field.fieldKey}`);
      }
      if (field.allowedPlans.some((plan) => !referenced.allowedPlans.includes(plan))) {
        return invalid(
          "INVALID_CONDITION",
          `Conditioned field plans must be a subset of referenced field plans: ${field.fieldKey}`,
        );
      }
      edges.set(field.fieldKey, [...(edges.get(field.fieldKey) ?? []), condition.fieldKey]);
    }
  }
  if (hasCycle(edges)) return invalid("INVALID_CONDITION", "Circular field condition detected");
  return null;
}

function conditionIsCompatible(field: LandingPageInputFieldDefinition, condition: NonNullable<LandingPageInputFieldDefinition["requiredWhen"]>): boolean {
  const values = Array.isArray(condition.value) ? condition.value : [condition.value];
  if (condition.operator === "in" && !Array.isArray(condition.value)) return false;
  if (condition.operator === "equals" && Array.isArray(condition.value)) return false;
  if (field.valueType === "boolean") return values.every((value) => typeof value === "boolean");
  if (field.valueType === "enum" && field.validation.kind === "enum") {
    return values.every((value) => typeof value === "string" && field.validation.kind === "enum" && field.validation.allowedValues.includes(value));
  }
  return field.valueType === "string" && values.every((value) => typeof value === "string");
}

function hasCycle(edges: ReadonlyMap<string, readonly string[]>): boolean {
  const active = new Set<string>();
  const done = new Set<string>();
  const visit = (node: string): boolean => {
    if (active.has(node)) return true;
    if (done.has(node)) return false;
    active.add(node);
    for (const next of edges.get(node) ?? []) if (visit(next)) return true;
    active.delete(node);
    done.add(node);
    return false;
  };
  return [...edges.keys()].some(visit);
}

function classifyFieldError(field: LandingPageInputFieldDefinition): ResolveLandingPageInputCatalogResult | null {
  if (!field.expectedValueOrigin || !field.evidence?.summary || !field.evidence.references.length) {
    return invalid("MISSING_EVIDENCE_ORIGIN", `Missing origin or evidence: ${field.fieldKey}`);
  }
  const parsed = landingPageInputFieldDefinitionSchema.safeParse(field);
  if (parsed.success) return null;
  if (field.fieldKey === "paid_search_keyword_map") {
    return invalid("INVALID_PAID_SEARCH_KEYWORD_MAP", "Invalid paid_search_keyword_map contract");
  }
  const validationIssue = parsed.error.issues.some((issue) => issue.path[0] === "validation");
  return invalid(validationIssue ? "INVALID_VALIDATION" : "INVALID_LAYER", `Invalid field contract: ${field.fieldKey}`);
}

function validateFieldOriginForLayer(
  field: LandingPageInputFieldDefinition,
  layer: LandingPageInputCatalogLayer,
): ResolveLandingPageInputCatalogResult | null {
  if (field.originLayer !== layer.level) {
    return invalid("INVALID_LAYER", `Field origin layer mismatch: ${field.fieldKey}`);
  }
  if (layer.level === "universal") {
    return field.originTaxon
      ? invalid("INVALID_LAYER", `Universal field cannot declare origin taxon: ${field.fieldKey}`)
      : null;
  }
  if (!layer.taxon || !sameTaxon(field.originTaxon, layer.taxon)) {
    return invalid("INVALID_LAYER", `Field origin taxon mismatch: ${field.fieldKey}`);
  }
  return null;
}

function validateTaxonChain(chain: LandingPageInputCatalogTaxonChain): ResolveLandingPageInputCatalogResult | null {
  const taxons = [chain.segment, chain.niche, chain.ultraNiche].filter((taxon) => taxon !== undefined);
  if (chain.segment.level !== "segment" || chain.segment.parentId !== null || (chain.niche && chain.niche.level !== "niche") || (chain.ultraNiche && chain.ultraNiche.level !== "ultra_niche") || (chain.ultraNiche && !chain.niche)) {
    return invalid("INVALID_TAXON_CHAIN", "Taxon chain levels are invalid");
  }
  if (taxons.some((taxon) => !taxon.isActive || !landingPageInputCatalogTaxonIdentitySchema.safeParse(taxon).success)) {
    return invalid("INVALID_TAXON_CHAIN", "Taxon chain contains an inactive or invalid taxon");
  }
  if ((chain.niche && chain.niche.parentId !== chain.segment.id) || (chain.ultraNiche && chain.ultraNiche.parentId !== chain.niche?.id)) {
    return invalid("INVALID_TAXON_CHAIN", "Taxon chain parent-child relation is invalid");
  }
  if (new Set(taxons.map((taxon) => taxon.id)).size !== taxons.length) {
    return invalid("INVALID_TAXON_CHAIN", "Taxon chain contains duplicate identities");
  }
  return null;
}

function provenance(
  property: LandingPageInputFieldProvenance["property"],
  layer: LandingPageInputCatalogLayer,
): LandingPageInputFieldProvenance {
  return { property, layer: layer.level, taxon: layer.taxon };
}

function sameTaxon(left: LandingPageInputCatalogLayer["taxon"], right: NonNullable<LandingPageInputCatalogLayer["taxon"]>): boolean {
  return !!left && left.id === right.id && left.name === right.name && left.slug === right.slug && left.level === right.level && left.parentId === right.parentId && left.isActive === right.isActive;
}

function layerRank(level: LandingPageInputCatalogLayerLevel): number {
  return { universal: 0, segment: 1, niche: 2, ultra_niche: 3 }[level];
}

function specializedWithoutProvenance(field: ResolvedLandingPageInputField): LandingPageInputFieldDefinition {
  const { provenance: _provenance, ...definition } = field;
  return definition;
}

function invalid(code: LandingPageInputCatalogErrorCode, message: string): ResolveLandingPageInputCatalogResult {
  return { ok: false, error: { code, message } };
}

function cloneJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === "object") {
    for (const property of Object.getOwnPropertyNames(value)) {
      const nested = value[property as keyof T];
      if (nested && typeof nested === "object" && !Object.isFrozen(nested)) deepFreeze(nested);
    }
    Object.freeze(value);
  }
  return value;
}
