import type {
  LandingPageInputCatalogLayer,
  LandingPageInputCatalogLayerEntry,
  LandingPageInputCatalogRegistryEntry,
  LandingPageInputCatalogTaxonIdentity,
  LandingPageInputCatalogTransitionResult,
  LandingPageInputFieldDefinition,
  LandingPageInputFieldSpecialization,
} from "./contracts";
import type {
  LandingPageInputCatalogDraftImpact,
  ValidateLandingPageInputCatalogDraftResult,
} from "./draft";
import {
  classifyLandingPageInputCatalogTransition,
  landingPageInputCatalogOperationalPlans,
} from "./lifecycle";
import { resolveLandingPageInputCatalogFromRegistry } from "./resolver";
import { buildLandingPageInputCatalogTaxonChain } from "./taxon-chain";
import { validateLandingPageInputCatalogDraft } from "./draft";

export type LandingPageInputCatalogDraftOperationTarget =
  | Readonly<{ kind: "universal" }>
  | Readonly<{ kind: "taxon_layer"; taxonId: string }>;

export type LandingPageInputCatalogDraftFieldContract = Readonly<
  Omit<
    LandingPageInputFieldDefinition,
    "originLayer" | "originTaxon" | "createdInVersion" | "retiredInVersion"
  >
>;

export type LandingPageInputCatalogDraftOperation =
  | Readonly<{
      kind: "add";
      target: LandingPageInputCatalogDraftOperationTarget;
      field: LandingPageInputCatalogDraftFieldContract;
    }>
  | Readonly<{
      kind: "change";
      target: LandingPageInputCatalogDraftOperationTarget;
      fieldKey: string;
      field: LandingPageInputCatalogDraftFieldContract;
    }>
  | Readonly<{
      kind: "retire";
      target: LandingPageInputCatalogDraftOperationTarget;
      fieldKey: string;
    }>;

export function projectLandingPageInputCatalogDraftReleaseTaxons<
  Taxon extends Readonly<{
    identity: LandingPageInputCatalogTaxonIdentity;
    reviewedVersion: number | null;
  }>,
>(input: Readonly<{
  taxons: readonly Taxon[];
  releaseTaxonIds?: readonly string[];
}>):
  | Readonly<{ ok: true; value: readonly Taxon[] }>
  | Extract<ValidateLandingPageInputCatalogDraftResult, { ok: false }> {
  const releaseTaxonIds = input.releaseTaxonIds ?? [];
  if (new Set(releaseTaxonIds).size !== releaseTaxonIds.length) {
    return invalid("As sessões factuais de liberação contêm taxon duplicado.");
  }
  const byId = new Map(input.taxons.map((taxon) => [taxon.identity.id, taxon]));
  for (const taxonId of releaseTaxonIds) {
    const taxon = byId.get(taxonId);
    if (!taxon) return invalid("Uma sessão factual de liberação referencia taxon ausente.");
    if (taxon.identity.isActive) {
      return invalid("Uma sessão factual de liberação referencia taxon já ativo.");
    }
  }
  const released = new Set(releaseTaxonIds);
  const projected = input.taxons.map((taxon) => deepFreeze({
    ...cloneJson(taxon),
    identity: {
      ...cloneJson(taxon.identity),
      ...(released.has(taxon.identity.id) ? { isActive: true as const } : {}),
    },
  })) as Taxon[];
  return deepFreeze({ ok: true, value: projected });
}

export function applyLandingPageInputCatalogDraftOperation(input: Readonly<{
  draft: unknown;
  operation: LandingPageInputCatalogDraftOperation;
  taxons: readonly Readonly<{
    identity: LandingPageInputCatalogTaxonIdentity;
    reviewedVersion: number | null;
  }>[];
  releaseTaxonIds?: readonly string[];
}>): ValidateLandingPageInputCatalogDraftResult {
  const prepared = prepareTarget(input);
  if (!prepared.ok) return prepared;

  const initial = validateLandingPageInputCatalogDraft({
    draft: input.draft,
    taxons: prepared.taxons,
  });
  if (!initial.ok) return initial;

  const draft = cloneJson(initial.value.entry);
  const projectedLayers = materializeReleaseLayerIdentities(
    draft,
    prepared.taxons,
    input.releaseTaxonIds ?? [],
  );
  if (!projectedLayers.ok) return projectedLayers;
  const layer = selectMutableLayer(draft, input.operation, prepared.targetTaxon);
  if (!layer.ok) return layer;

  const entries = layer.value.entries as LandingPageInputCatalogLayerEntry[];
  switch (input.operation.kind) {
    case "add": {
      const operation = input.operation;
      if (entries.some((entry) => entry.fieldKey === operation.field.fieldKey)) {
        return invalid(`O field ${operation.field.fieldKey} já existe na camada alvo.`);
      }
      entries.push(materializeField({
        contract: operation.field,
        layer: layer.value,
        createdInVersion: draft.version,
      }));
      break;
    }
    case "change": {
      const operation = input.operation;
      if (operation.field.fieldKey !== operation.fieldKey) {
        return invalid("A alteração não pode trocar a chave do field.");
      }
      const fieldIndex = entries.findIndex(
        (entry) => entry.kind === "field" && entry.fieldKey === operation.fieldKey,
      );
      if (fieldIndex >= 0) {
        const current = entries[fieldIndex];
        if (current.kind !== "field") return invalid(`O field ${operation.fieldKey} é inválido.`);
        entries[fieldIndex] = materializeField({
          contract: preserveNumberRangeBounds(operation.field, current),
          layer: layer.value,
          createdInVersion: current.createdInVersion,
          retiredInVersion: current.retiredInVersion,
        });
        break;
      }

      if (!prepared.targetTaxon) {
        return invalid(`O field ${operation.fieldKey} não existe na camada alvo.`);
      }
      const specializationIndex = entries.findIndex(
        (entry) => entry.kind === "specialization" && entry.fieldKey === operation.fieldKey,
      );
      const currentEffective = specializationIndex < 0
        ? null
        : resolveInheritedField({
            draft,
            taxons: prepared.taxons,
            targetTaxon: prepared.targetTaxon,
            fieldKey: operation.fieldKey,
          });
      if (currentEffective && !currentEffective.ok) return currentEffective;
      const currentSpecialization = specializationIndex < 0
        ? null
        : entries.splice(specializationIndex, 1)[0];
      const inherited = resolveInheritedField({
        draft,
        taxons: prepared.taxons,
        targetTaxon: prepared.targetTaxon,
        fieldKey: operation.fieldKey,
      });
      if (!inherited.ok) return inherited;
      const specialization = materializeSpecialization({
        fieldKey: operation.fieldKey,
        inherited: inherited.value,
        contract: preserveNumberRangeBounds(
          operation.field,
          currentEffective?.value ?? inherited.value,
        ),
      });
      if (!specialization.ok) return specialization;
      if (currentSpecialization && currentSpecialization.kind !== "specialization") {
        return invalid(`A especialização de ${operation.fieldKey} é inválida.`);
      }
      if (specializationIndex < 0) entries.push(specialization.value);
      else entries.splice(specializationIndex, 0, specialization.value);
      break;
    }
    case "retire": {
      const operation = input.operation;
      const index = entries.findIndex(
        (entry) => entry.kind === "field" && entry.fieldKey === operation.fieldKey,
      );
      if (index < 0) return invalid(`O field ${operation.fieldKey} não existe na camada alvo.`);
      const current = entries[index];
      if (current.kind !== "field") return invalid(`O field ${operation.fieldKey} é inválido.`);
      if (current.retiredInVersion !== undefined) {
        return invalid(`O field ${operation.fieldKey} já foi retirado.`);
      }
      entries[index] = { ...cloneJson(current), retiredInVersion: draft.version };
      break;
    }
  }

  return validateLandingPageInputCatalogDraftProjectedImpacts({
    draft,
    taxons: prepared.taxons,
    projectedTaxonIds: prepared.resolutionTaxons.map((taxon) => taxon.id),
  });
}

export function validateLandingPageInputCatalogDraftProjectedImpacts(input: Readonly<{
  draft: unknown;
  taxons: readonly Readonly<{
    identity: LandingPageInputCatalogTaxonIdentity;
    reviewedVersion: number | null;
  }>[];
  projectedTaxonIds: readonly string[];
}>): ValidateLandingPageInputCatalogDraftResult {
  if (new Set(input.projectedTaxonIds).size !== input.projectedTaxonIds.length) {
    return invalid("A matriz projetada contém taxon duplicado.");
  }
  const candidate = validateLandingPageInputCatalogDraft({
    draft: input.draft,
    taxons: input.taxons,
  });
  if (!candidate.ok) return candidate;
  const impacts = [...candidate.value.impacts];
  for (const taxonId of input.projectedTaxonIds) {
    const taxon = input.taxons.find((item) => item.identity.id === taxonId);
    const impactIndex = impacts.findIndex((impact) => impact.taxon.id === taxonId);
    if (!taxon?.identity.isActive || impactIndex < 0) {
      return invalid("Um taxon projetado está ausente ou inativo na matriz candidata.");
    }
    if (taxon.reviewedVersion === null) continue;
    const rebuilt = rebuildFourPlanImpact({
      taxon: taxon.identity,
      reviewedVersion: taxon.reviewedVersion,
      candidate: candidate.value,
      taxons: input.taxons,
    });
    if (!rebuilt.ok) return rebuilt;
    impacts[impactIndex] = rebuilt.value;
  }
  const totals = {
    noMaterialChange: impacts.filter((impact) => impact.classification === "no_material_change").length,
    compatibleEvolution: impacts.filter((impact) => impact.classification === "compatible_evolution").length,
    reviewRequired: impacts.filter((impact) => impact.classification === "review_required").length,
  };
  return deepFreeze({
    ok: true,
    value: {
      ...candidate.value,
      impacts,
      totals,
    },
  });
}

function rebuildFourPlanImpact(input: Readonly<{
  taxon: LandingPageInputCatalogTaxonIdentity;
  reviewedVersion: number;
  candidate: Extract<ValidateLandingPageInputCatalogDraftResult, { ok: true }>["value"];
  taxons: readonly Readonly<{
    identity: LandingPageInputCatalogTaxonIdentity;
    reviewedVersion: number | null;
  }>[];
}>):
  | Readonly<{ ok: true; value: LandingPageInputCatalogDraftImpact }>
  | Extract<ValidateLandingPageInputCatalogDraftResult, { ok: false }> {
  const chain = buildLandingPageInputCatalogTaxonChain(
    input.taxon,
    input.taxons.map((taxon) => taxon.identity),
  );
  if (!chain.ok) return invalid(chain.error.message);
  const added = new Set<string>();
  const expanded = new Set<string>();
  const reviewRequired = new Set<string>();
  let classification: LandingPageInputCatalogTransitionResult["classification"] =
    "no_material_change";
  for (const plan of landingPageInputCatalogOperationalPlans) {
    const previous = resolveLandingPageInputCatalogFromRegistry(
      {
        version: input.reviewedVersion,
        plan,
        taxonChain: chain.value,
        ultraNicheLayerAuthorized: input.taxon.level === "ultra_niche",
      },
      input.candidate.registry,
    );
    const next = resolveLandingPageInputCatalogFromRegistry(
      {
        version: input.candidate.entry.version,
        plan,
        taxonChain: chain.value,
        ultraNicheLayerAuthorized: input.taxon.level === "ultra_niche",
      },
      input.candidate.registry,
    );
    if (!previous.ok) return invalid(previous.error.message);
    if (!next.ok) return invalid(next.error.message);
    const transition = classifyLandingPageInputCatalogTransition(previous.value, next.value);
    if (transitionRank(transition.classification) > transitionRank(classification)) {
      classification = transition.classification;
    }
    transition.addedFieldKeys.forEach((key) => added.add(key));
    transition.expandedAllowedValueFieldKeys.forEach((key) => expanded.add(key));
    transition.reviewRequiredFieldKeys.forEach((key) => reviewRequired.add(key));
  }
  return {
    ok: true,
    value: deepFreeze({
      taxon: cloneJson(input.taxon),
      reviewedVersion: input.reviewedVersion,
      classification,
      addedFieldKeys: [...added],
      expandedAllowedValueFieldKeys: [...expanded],
      reviewRequiredFieldKeys: [...reviewRequired],
    }),
  };
}

function transitionRank(classification: LandingPageInputCatalogTransitionResult["classification"]): number {
  return { no_material_change: 0, compatible_evolution: 1, review_required: 2 }[classification];
}

function prepareTarget(input: Readonly<{
  operation: LandingPageInputCatalogDraftOperation;
  taxons: readonly Readonly<{
    identity: LandingPageInputCatalogTaxonIdentity;
    reviewedVersion: number | null;
  }>[];
  releaseTaxonIds?: readonly string[];
}>):
  | Readonly<{
      ok: true;
      taxons: readonly Readonly<{
        identity: LandingPageInputCatalogTaxonIdentity;
        reviewedVersion: number | null;
      }>[];
      targetTaxon: LandingPageInputCatalogTaxonIdentity | null;
      resolutionTaxons: readonly LandingPageInputCatalogTaxonIdentity[];
    }>
  | Extract<ValidateLandingPageInputCatalogDraftResult, { ok: false }> {
  const projection = projectLandingPageInputCatalogDraftReleaseTaxons({
    taxons: input.taxons,
    releaseTaxonIds: input.releaseTaxonIds,
  });
  if (!projection.ok) return projection;
  const taxons = projection.value;
  const resolutionTaxonIds = new Set(input.releaseTaxonIds ?? []);
  if (input.operation.target.kind === "universal") {
    return {
      ok: true,
      taxons,
      targetTaxon: null,
      resolutionTaxons: taxons
        .filter((taxon) => resolutionTaxonIds.has(taxon.identity.id))
        .map((taxon) => taxon.identity),
    };
  }
  const targetId = input.operation.target.taxonId;
  const target = taxons.find(
    (taxon) => taxon.identity.id === targetId,
  );
  if (!target) return invalid("O taxon da camada alvo não existe no contexto completo.");
  if (!target.identity.isActive && !input.releaseTaxonIds?.includes(target.identity.id)) {
    return invalid("Um taxon inativo exige uma sessão factual de liberação aberta.");
  }
  resolutionTaxonIds.add(target.identity.id);
  return {
    ok: true,
    taxons,
    targetTaxon: target.identity,
    resolutionTaxons: taxons
      .filter((taxon) => resolutionTaxonIds.has(taxon.identity.id))
      .map((taxon) => taxon.identity),
  };
}

function materializeReleaseLayerIdentities(
  draft: LandingPageInputCatalogRegistryEntry,
  taxons: readonly Readonly<{
    identity: LandingPageInputCatalogTaxonIdentity;
    reviewedVersion: number | null;
  }>[],
  releaseTaxonIds: readonly string[],
): Readonly<{ ok: true }> | Extract<ValidateLandingPageInputCatalogDraftResult, { ok: false }> {
  for (const taxonId of releaseTaxonIds) {
    const projectedTaxon = taxons.find((taxon) => taxon.identity.id === taxonId)?.identity;
    if (!projectedTaxon) return invalid("A projeção de uma release está ausente.");
    const matching = Object.entries(draft.taxonLayers).find(
      ([, layer]) => layer.taxon?.id === taxonId,
    );
    if (!matching) continue;
    const [layerKey, layer] = matching;
    if (
      layerKey !== projectedTaxon.slug ||
      layer.level !== projectedTaxon.level ||
      !sameTaxon({ ...layer.taxon!, isActive: true }, projectedTaxon)
    ) {
      return invalid("A identidade da layer de uma release está divergente.");
    }
    (draft.taxonLayers as Record<string, LandingPageInputCatalogLayer>)[layerKey] = {
      ...cloneJson(layer),
      taxon: projectedTaxon,
      entries: layer.entries.map((entry) =>
        entry.kind === "field"
          ? { ...cloneJson(entry), originTaxon: projectedTaxon }
          : cloneJson(entry),
      ),
    };
  }
  return { ok: true };
}

function selectMutableLayer(
  draft: LandingPageInputCatalogRegistryEntry,
  operation: LandingPageInputCatalogDraftOperation,
  targetTaxon: LandingPageInputCatalogTaxonIdentity | null,
): Readonly<{ ok: true; value: LandingPageInputCatalogLayer }> |
  Extract<ValidateLandingPageInputCatalogDraftResult, { ok: false }> {
  if (operation.target.kind === "universal") {
    return { ok: true, value: draft.universal };
  }
  if (!targetTaxon) return invalid("A identidade da camada taxonômica está ausente.");

  const sameIdentityLayer = Object.entries(draft.taxonLayers).find(
    ([, layer]) => layer.taxon?.id === targetTaxon.id,
  );
  const slugLayer = draft.taxonLayers[targetTaxon.slug];
  if (
    (sameIdentityLayer && sameIdentityLayer[0] !== targetTaxon.slug) ||
    (slugLayer?.taxon && slugLayer.taxon.id !== targetTaxon.id)
  ) {
    return invalid("A camada taxonômica colide com outra identidade ou slug.");
  }
  let layer = slugLayer;
  if (!layer) {
    if (operation.kind === "retire") return invalid("A camada taxonômica alvo não existe no draft.");
    layer = { level: targetTaxon.level, taxon: targetTaxon, entries: [] };
    (draft.taxonLayers as Record<string, LandingPageInputCatalogLayer>)[targetTaxon.slug] = layer;
  }
  if (!sameTaxon(layer.taxon, targetTaxon) || layer.level !== targetTaxon.level) {
    return invalid("A identidade persistida da camada taxonômica está divergente.");
  }
  if (!targetTaxon.isActive) return invalid("A projeção administrativa do taxon alvo está inválida.");

  const projected = {
    ...cloneJson(layer),
    taxon: targetTaxon,
    entries: layer.entries.map((entry) =>
      entry.kind === "field"
        ? { ...cloneJson(entry), originTaxon: targetTaxon }
        : cloneJson(entry),
    ),
  } satisfies LandingPageInputCatalogLayer;
  (draft.taxonLayers as Record<string, LandingPageInputCatalogLayer>)[targetTaxon.slug] = projected;
  return { ok: true, value: projected };
}

function materializeField(input: Readonly<{
  contract: LandingPageInputCatalogDraftFieldContract;
  layer: LandingPageInputCatalogLayer;
  createdInVersion: number;
  retiredInVersion?: number;
}>): LandingPageInputFieldDefinition {
  const contract = cloneJson(input.contract) as Record<string, unknown>;
  delete contract.originLayer;
  delete contract.originTaxon;
  delete contract.createdInVersion;
  delete contract.retiredInVersion;
  return {
    ...contract,
    originLayer: input.layer.level,
    ...(input.layer.taxon ? { originTaxon: cloneJson(input.layer.taxon) } : {}),
    createdInVersion: input.createdInVersion,
    ...(input.retiredInVersion === undefined
      ? {}
      : { retiredInVersion: input.retiredInVersion }),
  } as LandingPageInputFieldDefinition;
}

function resolveInheritedField(input: Readonly<{
  draft: LandingPageInputCatalogRegistryEntry;
  taxons: readonly Readonly<{ identity: LandingPageInputCatalogTaxonIdentity }>[];
  targetTaxon: LandingPageInputCatalogTaxonIdentity;
  fieldKey: string;
}>): Readonly<{ ok: true; value: LandingPageInputFieldDefinition }> |
  Extract<ValidateLandingPageInputCatalogDraftResult, { ok: false }> {
  const chain = buildLandingPageInputCatalogTaxonChain(
    input.targetTaxon,
    input.taxons.map((taxon) => taxon.identity),
  );
  if (!chain.ok) return invalid(chain.error.message);
  for (const plan of landingPageInputCatalogOperationalPlans) {
    const resolved = resolveLandingPageInputCatalogFromRegistry(
      {
        version: input.draft.version,
        plan,
        taxonChain: chain.value,
        ultraNicheLayerAuthorized: input.targetTaxon.level === "ultra_niche",
      },
      { [input.draft.version]: input.draft },
    );
    if (!resolved.ok) return invalid(resolved.error.message);
    const field = resolved.value.fields.find((candidate) => candidate.fieldKey === input.fieldKey);
    if (field) {
      const { provenance: _provenance, ...definition } = cloneJson(field);
      return { ok: true, value: definition };
    }
  }
  return invalid(`O field ${input.fieldKey} não existe na cobertura herdada da camada alvo.`);
}

function materializeSpecialization(input: Readonly<{
  fieldKey: string;
  inherited: LandingPageInputFieldDefinition;
  contract: LandingPageInputCatalogDraftFieldContract;
}>): Readonly<{ ok: true; value: LandingPageInputFieldSpecialization }> |
  Extract<ValidateLandingPageInputCatalogDraftResult, { ok: false }> {
  const inheritedContract = stripFieldHistory(input.inherited);
  const immutableInherited = cloneJson(inheritedContract) as Record<string, unknown>;
  const immutableProposed = cloneJson(input.contract) as Record<string, unknown>;
  for (const key of ["obligation", "allowedPlans", "validation"]) {
    delete immutableInherited[key];
    delete immutableProposed[key];
  }
  if (stableStringify(immutableInherited) !== stableStringify(immutableProposed)) {
    return invalid(`A especialização de ${input.fieldKey} não pode alterar propriedades imutáveis.`);
  }

  const changes: Record<string, unknown> = {};
  for (const key of ["obligation", "allowedPlans", "validation"] as const) {
    if (stableStringify(inheritedContract[key]) !== stableStringify(input.contract[key])) {
      changes[key] = cloneJson(input.contract[key]);
    }
  }
  if (Object.keys(changes).length === 0) {
    return invalid(`A alteração de ${input.fieldKey} não contém especialização material.`);
  }
  return {
    ok: true,
    value: {
      kind: "specialization",
      fieldKey: input.fieldKey,
      changes: changes as LandingPageInputFieldSpecialization["changes"],
    },
  };
}

function preserveNumberRangeBounds(
  contract: LandingPageInputCatalogDraftFieldContract,
  current: LandingPageInputFieldDefinition,
): LandingPageInputCatalogDraftFieldContract {
  if (contract.validation.kind !== "number_range" || current.validation.kind !== "number_range") {
    return contract;
  }
  return {
    ...cloneJson(contract),
    validation: {
      ...cloneJson(contract.validation),
      ...(contract.validation.minimum === undefined && current.validation.minimum !== undefined
        ? { minimum: current.validation.minimum }
        : {}),
      ...(contract.validation.maximum === undefined && current.validation.maximum !== undefined
        ? { maximum: current.validation.maximum }
        : {}),
    },
  };
}

function stripFieldHistory(field: LandingPageInputFieldDefinition): LandingPageInputCatalogDraftFieldContract {
  const {
    originLayer: _originLayer,
    originTaxon: _originTaxon,
    createdInVersion: _createdInVersion,
    retiredInVersion: _retiredInVersion,
    ...contract
  } = cloneJson(field);
  return contract;
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function sameTaxon(
  left: LandingPageInputCatalogTaxonIdentity | undefined,
  right: LandingPageInputCatalogTaxonIdentity,
): boolean {
  return !!left &&
    left.id === right.id &&
    left.parentId === right.parentId &&
    left.level === right.level &&
    left.name === right.name &&
    left.slug === right.slug &&
    left.isActive === right.isActive;
}

function invalid(
  message: string,
): Extract<ValidateLandingPageInputCatalogDraftResult, { ok: false }> {
  return deepFreeze({ ok: false, error: { code: "INVALID_DRAFT", message } });
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
