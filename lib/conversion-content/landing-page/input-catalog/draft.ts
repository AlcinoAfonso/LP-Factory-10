import type {
  LandingPageInputCatalogRegistry,
  LandingPageInputCatalogRegistryEntry,
  LandingPageInputFieldDefinition,
  LandingPageInputCatalogTaxonIdentity,
  LandingPageInputCatalogTransitionClassification,
} from "./contracts";
import {
  CURRENT_LANDING_PAGE_INPUT_CATALOG_VERSION,
  classifyLandingPageInputCatalogTransitionForTaxon,
} from "./lifecycle";
import { landingPageInputCatalogRegistry } from "./registry";
import { landingPageInputCatalogLayerSchema } from "./schema";
import { buildLandingPageInputCatalogTaxonChain } from "./taxon-chain";

export type LandingPageInputCatalogDraftImpact = Readonly<{
  taxon: LandingPageInputCatalogTaxonIdentity;
  reviewedVersion: number | null;
  operational: boolean;
  classification: LandingPageInputCatalogTransitionClassification;
  addedFieldKeys: readonly string[];
  expandedAllowedValueFieldKeys: readonly string[];
  reviewRequiredFieldKeys: readonly string[];
}>;

export type ValidateLandingPageInputCatalogDraftResult =
  | Readonly<{
      ok: true;
      value: Readonly<{
        entry: LandingPageInputCatalogRegistryEntry;
        registry: LandingPageInputCatalogRegistry;
        canonicalJson: string;
        impacts: readonly LandingPageInputCatalogDraftImpact[];
        totals: Readonly<{
          noMaterialChange: number;
          compatibleEvolution: number;
          reviewRequired: number;
          blockingOperationalReviews: number;
        }>;
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
  taxons: readonly Readonly<{
    identity: LandingPageInputCatalogTaxonIdentity;
    reviewedVersion: number | null;
    operational: boolean;
  }>[];
}>): ValidateLandingPageInputCatalogDraftResult {
  const entry = parseDraftEntry(input.draft);
  if (!entry.ok) return entry;
  const continuityFailure = validatePublishedFieldContinuity(entry.value);
  if (continuityFailure) return continuityFailure;
  const registry = deepFreeze({
    ...cloneJson(landingPageInputCatalogRegistry),
    [entry.value.version]: cloneJson(entry.value),
  } satisfies LandingPageInputCatalogRegistry);
  const identities = input.taxons.map((taxon) => taxon.identity);
  const impacts: LandingPageInputCatalogDraftImpact[] = [];

  for (const taxon of input.taxons) {
    if (!taxon.identity.isActive) continue;
    const chain = buildLandingPageInputCatalogTaxonChain(
      taxon.identity,
      identities,
    );
    if (!chain.ok) {
      return failure("INVALID_TAXON_CHAIN", chain.error.message);
    }
    if (taxon.reviewedVersion === null) {
      impacts.push({
        taxon: taxon.identity,
        reviewedVersion: null,
        operational: taxon.operational,
        classification: "review_required",
        addedFieldKeys: [],
        expandedAllowedValueFieldKeys: [],
        reviewRequiredFieldKeys: [],
      });
      continue;
    }
    if (!(landingPageInputCatalogRegistry as LandingPageInputCatalogRegistry)[taxon.reviewedVersion]) {
      return failure(
        "CATALOG_RESOLUTION_FAILED",
        `A versão revisada ${taxon.reviewedVersion} não é executável.`,
      );
    }
    const transition = classifyLandingPageInputCatalogTransitionForTaxon({
      previousVersion: taxon.reviewedVersion,
      nextVersion: entry.value.version,
      taxonChain: chain.value,
      registry,
    });
    impacts.push({
      taxon: taxon.identity,
      reviewedVersion: taxon.reviewedVersion,
      operational: taxon.operational,
      ...transition,
    });
  }

  const totals = {
    noMaterialChange: impacts.filter(
      (impact) => impact.classification === "no_material_change",
    ).length,
    compatibleEvolution: impacts.filter(
      (impact) => impact.classification === "compatible_evolution",
    ).length,
    reviewRequired: impacts.filter(
      (impact) => impact.classification === "review_required",
    ).length,
    blockingOperationalReviews: impacts.filter(
      (impact) =>
        impact.operational && impact.classification === "review_required",
    ).length,
  };
  return {
    ok: true,
    value: deepFreeze({
      entry: cloneJson(entry.value),
      registry,
      canonicalJson: serializeLandingPageInputCatalogEntry(entry.value),
      impacts,
      totals,
    }),
  };
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

  for (const [location, published] of publishedFields) {
    const next = candidateFields.get(location);
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
      published.retiredInVersion !== undefined
        ? next.retiredInVersion !== published.retiredInVersion
        : next.retiredInVersion !== undefined &&
          next.retiredInVersion !== targetVersion
    ) {
      return failure(
        "INVALID_DRAFT",
        `A retirada de ${published.fieldKey} deve ser forward-only na versão ${targetVersion}.`,
      );
    }
  }

  for (const [location, candidateField] of candidateFields) {
    if (publishedFields.has(location)) continue;
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

function collectDefinedFields(
  entry: LandingPageInputCatalogRegistryEntry,
): ReadonlyMap<string, LandingPageInputFieldDefinition> {
  const fields = new Map<string, LandingPageInputFieldDefinition>();
  collectLayerFields("universal", entry.universal.entries, fields);
  for (const [taxonKey, layer] of Object.entries(entry.taxonLayers)) {
    collectLayerFields(`taxon:${taxonKey}`, layer.entries, fields);
  }
  return fields;
}

function collectLayerFields(
  layerKey: string,
  entries: LandingPageInputCatalogRegistryEntry["universal"]["entries"],
  fields: Map<string, LandingPageInputFieldDefinition>,
): void {
  for (const entry of entries) {
    if (entry.kind === "field") fields.set(`${layerKey}:${entry.fieldKey}`, entry);
  }
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
