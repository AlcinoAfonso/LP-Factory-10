import type {
  LandingPageInputCatalogRegistry,
  LandingPageInputCatalogRegistryEntry,
  LandingPageInputFieldDefinition,
  LandingPageInputCatalogTaxonIdentity,
} from "./contracts";
import {
  CURRENT_LANDING_PAGE_INPUT_CATALOG_VERSION,
} from "./lifecycle";
import { landingPageInputCatalogRegistry } from "./registry";
import { resolveLandingPageInputCatalogFromRegistry } from "./resolver";
import { landingPageInputCatalogLayerSchema } from "./schema";
import { buildLandingPageInputCatalogTaxonChain } from "./taxon-chain";

export type LandingPageInputCatalogDraftFieldChange = Readonly<{
  fieldKey: string;
  originLayer: "universal" | "segment" | "niche" | "ultra_niche";
  originTaxonId: string | null;
  kind: "added" | "edited" | "inactivated" | "reactivated";
  affectedTaxonIds: readonly string[];
  attributeChanges: readonly Readonly<{
    attribute: string;
    previousValue: string;
    nextValue: string;
  }>[];
  sameFactConfirmationRequired: boolean;
}>;

export type ValidateLandingPageInputCatalogDraftResult =
  | Readonly<{
      ok: true;
      value: Readonly<{
        entry: LandingPageInputCatalogRegistryEntry;
        registry: LandingPageInputCatalogRegistry;
        canonicalJson: string;
        fieldChanges: readonly LandingPageInputCatalogDraftFieldChange[];
        sameFactConfirmationFieldKeys: readonly string[];
      }>;
    }>
  | Readonly<{
      ok: false;
      error: Readonly<{
        code:
          | "INVALID_DRAFT"
          | "INVALID_VERSION"
          | "INVALID_TAXON_CHAIN"
          | "CATALOG_RESOLUTION_FAILED";
        message: string;
      }>;
    }>;

export function createNextLandingPageInputCatalogDraft(): LandingPageInputCatalogRegistryEntry {
  const current = landingPageInputCatalogRegistry[
    CURRENT_LANDING_PAGE_INPUT_CATALOG_VERSION
  ];
  return deepFreeze({
    ...cloneJson(current),
    version: CURRENT_LANDING_PAGE_INPUT_CATALOG_VERSION + 1,
  });
}

export function validateLandingPageInputCatalogDraft(input: Readonly<{
  draft: unknown;
  taxons: readonly Readonly<{ identity: LandingPageInputCatalogTaxonIdentity }>[];
}>): ValidateLandingPageInputCatalogDraftResult {
  const entry = parseDraftEntry(input.draft);
  if (!entry.ok) return entry;
  const taxonomyFailure = validateCandidateTaxonomy(entry.value, input.taxons);
  if (taxonomyFailure) return taxonomyFailure;
  const continuityFailure = validatePublishedFieldContinuity(entry.value);
  if (continuityFailure) return continuityFailure;
  const planNeutralFailure = validatePlanNeutralDraft(entry.value);
  if (planNeutralFailure) return planNeutralFailure;
  const registry = deepFreeze({
    ...cloneJson(landingPageInputCatalogRegistry),
    [entry.value.version]: cloneJson(entry.value),
  } satisfies LandingPageInputCatalogRegistry);
  const resolutionFailure = validateCandidateResolution(registry, input.taxons);
  if (resolutionFailure) return resolutionFailure;
  const fieldChanges = classifyDraftFieldChanges(entry.value, input.taxons);
  return {
    ok: true,
    value: deepFreeze({
      entry: cloneJson(entry.value),
      registry,
      canonicalJson: serializeLandingPageInputCatalogEntry(entry.value),
      fieldChanges,
      sameFactConfirmationFieldKeys: fieldChanges
        .filter((change) => change.sameFactConfirmationRequired)
        .map((change) => change.fieldKey),
    }),
  };
}

function validateCandidateResolution(
  registry: LandingPageInputCatalogRegistry,
  taxons: readonly Readonly<{ identity: LandingPageInputCatalogTaxonIdentity }>[],
): Extract<ValidateLandingPageInputCatalogDraftResult, { ok: false }> | null {
  const identities = taxons.map(({ identity }) => identity);
  for (const taxon of taxons) {
    const selected = taxon.identity.isActive
      ? taxon.identity
      : { ...taxon.identity, isActive: true };
    const resolutionTaxons = taxon.identity.isActive
      ? identities
      : identities.map((identity) => identity.id === selected.id ? selected : identity);
    const chain = buildLandingPageInputCatalogTaxonChain(selected, resolutionTaxons);
    if (!chain.ok) return failure("INVALID_TAXON_CHAIN", chain.error.message);
    for (const plan of ["starter", "lite", "pro", "ultra"] as const) {
      const resolved = resolveLandingPageInputCatalogFromRegistry(
        {
          version: CURRENT_LANDING_PAGE_INPUT_CATALOG_VERSION + 1,
          plan,
          taxonChain: chain.value,
          ultraNicheLayerAuthorized: chain.value.ultraNiche !== undefined,
        },
        registry,
      );
      if (!resolved.ok) {
        return failure("CATALOG_RESOLUTION_FAILED", resolved.error.message);
      }
    }
  }
  return null;
}

function validateCandidateTaxonomy(
  candidate: LandingPageInputCatalogRegistryEntry,
  taxons: readonly Readonly<{ identity: LandingPageInputCatalogTaxonIdentity }>[],
): Extract<ValidateLandingPageInputCatalogDraftResult, { ok: false }> | null {
  const taxonsById = new Map(taxons.map(({ identity }) => [identity.id, identity] as const));
  const fieldKeys = new Set<string>();
  for (const [layerKey, layer] of Object.entries(candidate.taxonLayers)) {
    const taxon = layer.taxon;
    const contextualTaxon = taxon ? taxonsById.get(taxon.id) : undefined;
    if (
      !taxon ||
      layerKey !== taxon.slug ||
      layer.level === "universal" ||
      layer.level !== taxon.level ||
      !contextualTaxon ||
      !sameTaxonResidence(taxon, contextualTaxon)
    ) {
      return failure("INVALID_DRAFT", `A camada ${layerKey} não corresponde à taxonomia factual atual.`);
    }
  }
  for (const layer of [candidate.universal, ...Object.values(candidate.taxonLayers)]) {
    for (const entry of layer.entries) {
      if (entry.kind !== "field") continue;
      if (fieldKeys.has(entry.fieldKey)) {
        return failure("INVALID_DRAFT", `O fieldKey ${entry.fieldKey} deve ter residência global única.`);
      }
      fieldKeys.add(entry.fieldKey);
      if (entry.originLayer !== layer.level) {
        return failure("INVALID_DRAFT", `A residência de ${entry.fieldKey} não corresponde à camada declarada.`);
      }
      if (layer.level === "universal") {
        if (entry.originTaxon) {
          return failure("INVALID_DRAFT", `O field universal ${entry.fieldKey} não pode declarar originTaxon.`);
        }
      } else if (
        !layer.taxon ||
        !entry.originTaxon ||
        !sameTaxonResidence(entry.originTaxon, layer.taxon)
      ) {
        return failure("INVALID_DRAFT", `O originTaxon de ${entry.fieldKey} não corresponde à sua camada.`);
      }
    }
  }
  return null;
}

function validatePublishedFieldContinuity(
  candidate: LandingPageInputCatalogRegistryEntry,
): Extract<ValidateLandingPageInputCatalogDraftResult, { ok: false }> | null {
  const current = landingPageInputCatalogRegistry[
    CURRENT_LANDING_PAGE_INPUT_CATALOG_VERSION
  ];
  const targetVersion = CURRENT_LANDING_PAGE_INPUT_CATALOG_VERSION + 1;
  const publishedFields = collectDefinedFields(current);
  const candidateFields = collectDefinedFields(candidate);

  for (const [fieldKey, published] of publishedFields) {
    const next = candidateFields.get(fieldKey);
    if (!next) {
      return failure(
        "INVALID_DRAFT",
        `O field publicado ${published.fieldKey} deve permanecer no draft e ser retirado somente por retiredInVersion.`,
      );
    }
    if (next.createdInVersion !== published.createdInVersion) {
      return failure(
        "INVALID_DRAFT",
        `A proveniência publicada de ${published.fieldKey} é imutável.`,
      );
    }
    if (
      next.originLayer !== published.originLayer ||
      !sameOptionalTaxonResidence(next.originTaxon, published.originTaxon)
    ) {
      return failure(
        "INVALID_DRAFT",
        `A residência publicada de ${published.fieldKey} é imutável; use um novo fieldKey para outra residência.`,
      );
    }
    const validRetirement = published.retiredInVersion === undefined
      ? next.retiredInVersion === undefined || next.retiredInVersion === targetVersion
      : next.retiredInVersion === published.retiredInVersion ||
        (next.retiredInVersion === undefined && targetVersion > published.retiredInVersion);
    if (!validRetirement) {
      return failure(
        "INVALID_DRAFT",
        `A inativação ou reativação de ${published.fieldKey} deve ser forward-only na versão ${targetVersion}.`,
      );
    }
    if (next.valueScope !== published.valueScope) {
      return failure(
        "INVALID_DRAFT",
        `A alteração de valueScope de ${published.fieldKey} exige um novo fieldKey.`,
      );
    }
  }

  for (const [fieldKey, candidateField] of candidateFields) {
    if (publishedFields.has(fieldKey)) continue;
    if (
      candidateField.createdInVersion !== targetVersion ||
      candidateField.retiredInVersion !== undefined
    ) {
      return failure(
        "INVALID_DRAFT",
        `O novo field ${candidateField.fieldKey} deve nascer na versão ${targetVersion}.`,
      );
    }
  }
  return null;
}

function validatePlanNeutralDraft(
  candidate: LandingPageInputCatalogRegistryEntry,
): Extract<ValidateLandingPageInputCatalogDraftResult, { ok: false }> | null {
  const expectedPlans = ["starter", "lite", "pro", "ultra"];
  for (const layer of [candidate.universal, ...Object.values(candidate.taxonLayers)]) {
    for (const entry of layer.entries) {
      if (entry.kind === "specialization" && entry.changes.allowedPlans !== undefined) {
        return failure(
          "INVALID_DRAFT",
          `O draft factual não aceita especialização comercial de ${entry.fieldKey}.`,
        );
      }
      if (
        entry.kind === "field" &&
        (entry.allowedPlans.length !== expectedPlans.length ||
          expectedPlans.some((plan, index) => entry.allowedPlans[index] !== plan))
      ) {
        return failure(
          "INVALID_DRAFT",
          `O field ${entry.fieldKey} deve permanecer comum e plan-neutral.`,
        );
      }
    }
  }
  return null;
}

function classifyDraftFieldChanges(
  candidate: LandingPageInputCatalogRegistryEntry,
  taxons: readonly Readonly<{ identity: LandingPageInputCatalogTaxonIdentity }>[],
): readonly LandingPageInputCatalogDraftFieldChange[] {
  const current = landingPageInputCatalogRegistry[CURRENT_LANDING_PAGE_INPUT_CATALOG_VERSION];
  const currentFields = collectDefinedFields(current);
  const candidateFields = collectDefinedFields(candidate);
  const changes: LandingPageInputCatalogDraftFieldChange[] = [];
  for (const [fieldKey, next] of candidateFields) {
    const published = currentFields.get(fieldKey);
    let kind: LandingPageInputCatalogDraftFieldChange["kind"] | null = null;
    if (!published) kind = "added";
    else if (published.retiredInVersion === undefined && next.retiredInVersion !== undefined) {
      kind = "inactivated";
    } else if (published.retiredInVersion !== undefined && next.retiredInVersion === undefined) {
      kind = "reactivated";
    } else if (stableStringify(withoutLifecycle(next)) !== stableStringify(withoutLifecycle(published))) {
      kind = "edited";
    }
    if (!kind) continue;
    const originTaxonId = next.originTaxon?.id ?? null;
    changes.push(Object.freeze({
      fieldKey: next.fieldKey,
      originLayer: next.originLayer,
      originTaxonId,
      kind,
      affectedTaxonIds: affectedTaxonIds(next, taxons),
      attributeChanges: describeAttributeChanges(published, next),
      sameFactConfirmationRequired:
        kind === "edited" && requiresSameFactConfirmation(published, next),
    }));
  }
  return Object.freeze(changes.sort((left, right) =>
    left.fieldKey.localeCompare(right.fieldKey) || left.originLayer.localeCompare(right.originLayer),
  ));
}

function affectedTaxonIds(
  field: LandingPageInputFieldDefinition,
  taxons: readonly Readonly<{ identity: LandingPageInputCatalogTaxonIdentity }>[],
): readonly string[] {
  if (field.originLayer === "universal") {
    return Object.freeze(taxons.map((taxon) => taxon.identity.id).sort());
  }
  const originId = field.originTaxon?.id;
  if (!originId) return Object.freeze([]);
  const parentById = new Map(
    taxons.map((taxon) => [taxon.identity.id, taxon.identity.parentId] as const),
  );
  return Object.freeze(taxons
    .filter((taxon) => {
      let currentId: string | null = taxon.identity.id;
      while (currentId !== null) {
        if (currentId === originId) return true;
        currentId = parentById.get(currentId) ?? null;
      }
      return false;
    })
    .map((taxon) => taxon.identity.id)
    .sort());
}

function requiresSameFactConfirmation(
  published: LandingPageInputFieldDefinition | undefined,
  next: LandingPageInputFieldDefinition,
): boolean {
  if (!published) return false;
  return ["purpose", "expectedValueOrigin", "valueType", "obligation", "requiredWhen", "applicableWhen", "validation"]
    .some((key) => stableStringify(published[key as keyof LandingPageInputFieldDefinition]) !==
      stableStringify(next[key as keyof LandingPageInputFieldDefinition]));
}

function withoutLifecycle(field: LandingPageInputFieldDefinition) {
  const { createdInVersion: _created, retiredInVersion: _retired, ...rest } = field;
  return rest;
}

function collectDefinedFields(
  entry: LandingPageInputCatalogRegistryEntry,
): ReadonlyMap<string, LandingPageInputFieldDefinition> {
  const fields = new Map<string, LandingPageInputFieldDefinition>();
  collectLayerFields(entry.universal.entries, fields);
  for (const layer of Object.values(entry.taxonLayers)) {
    collectLayerFields(layer.entries, fields);
  }
  return fields;
}

function collectLayerFields(
  entries: LandingPageInputCatalogRegistryEntry["universal"]["entries"],
  fields: Map<string, LandingPageInputFieldDefinition>,
): void {
  for (const entry of entries) {
    if (entry.kind === "field") fields.set(entry.fieldKey, entry);
  }
}

function describeAttributeChanges(
  published: LandingPageInputFieldDefinition | undefined,
  next: LandingPageInputFieldDefinition,
): LandingPageInputCatalogDraftFieldChange["attributeChanges"] {
  const attributes = new Set([...Object.keys(published ?? {}), ...Object.keys(next)]);
  attributes.delete("kind");
  attributes.delete("fieldKey");
  return Object.freeze([...attributes]
    .sort()
    .filter((attribute) => stableStringify(published?.[attribute as keyof LandingPageInputFieldDefinition]) !==
      stableStringify(next[attribute as keyof LandingPageInputFieldDefinition]))
    .map((attribute) => Object.freeze({
      attribute,
      previousValue: serializeDiffValue(published?.[attribute as keyof LandingPageInputFieldDefinition]),
      nextValue: serializeDiffValue(next[attribute as keyof LandingPageInputFieldDefinition]),
    })));
}

function sameOptionalTaxonResidence(
  left: LandingPageInputCatalogTaxonIdentity | undefined,
  right: LandingPageInputCatalogTaxonIdentity | undefined,
): boolean {
  if (!left || !right) return left === right;
  return sameTaxonResidence(left, right);
}

function sameTaxonResidence(
  left: LandingPageInputCatalogTaxonIdentity,
  right: LandingPageInputCatalogTaxonIdentity,
): boolean {
  return left.id === right.id && left.name === right.name && left.slug === right.slug &&
    left.level === right.level && left.parentId === right.parentId;
}

function serializeDiffValue(value: unknown): string {
  return value === undefined ? "ausente" : stableStringify(value);
}

export function serializeLandingPageInputCatalogEntry(
  entry: LandingPageInputCatalogRegistryEntry,
): string {
  return stableStringify(entry);
}

function parseDraftEntry(
  value: unknown,
):
  | Readonly<{ ok: true; value: LandingPageInputCatalogRegistryEntry }>
  | Extract<ValidateLandingPageInputCatalogDraftResult, { ok: false }> {
  if (!isRecord(value)) return failure("INVALID_DRAFT", "O draft precisa ser um objeto JSON.");
  if (
    Object.keys(value).some(
      (key) => !["version", "universal", "taxonLayers"].includes(key),
    ) ||
    value.version !== CURRENT_LANDING_PAGE_INPUT_CATALOG_VERSION + 1
  ) {
    return failure(
      "INVALID_VERSION",
      "O draft deve representar exatamente a próxima versão sequencial.",
    );
  }
  if (!landingPageInputCatalogLayerSchema.safeParse(value.universal).success) {
    return failure("INVALID_DRAFT", "A camada universal do draft é inválida.");
  }
  if (!isRecord(value.taxonLayers)) {
    return failure("INVALID_DRAFT", "As camadas taxonômicas do draft são inválidas.");
  }
  for (const layer of Object.values(value.taxonLayers)) {
    if (!landingPageInputCatalogLayerSchema.safeParse(layer).success) {
      return failure("INVALID_DRAFT", "Uma camada taxonômica do draft é inválida.");
    }
  }
  return {
    ok: true,
    value: deepFreeze(cloneJson(value)) as LandingPageInputCatalogRegistryEntry,
  };
}

function failure(
  code: Extract<ValidateLandingPageInputCatalogDraftResult, { ok: false }>["error"]["code"],
  message: string,
): Extract<ValidateLandingPageInputCatalogDraftResult, { ok: false }> {
  return Object.freeze({ ok: false, error: Object.freeze({ code, message }) });
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(",")}]`;
  }
  if (isRecord(value)) {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function cloneJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === "object") {
    for (const property of Object.getOwnPropertyNames(value)) {
      const nested = value[property as keyof T];
      if (nested && typeof nested === "object" && !Object.isFrozen(nested)) {
        deepFreeze(nested);
      }
    }
    Object.freeze(value);
  }
  return value;
}
