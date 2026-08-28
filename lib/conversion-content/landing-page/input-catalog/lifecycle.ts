import type {
  LandingPageInputCatalogPlan,
  LandingPageInputCatalogRegistry,
  LandingPageInputCatalogTaxonChain,
  LandingPageInputCatalogTransitionClassification,
  LandingPageInputCatalogTransitionResult,
  ResolvedLandingPageInputCatalog,
  ResolvedLandingPageInputField,
} from "./contracts";
import { landingPageInputCatalogRegistry } from "./registry";
import { resolveLandingPageInputCatalogFromRegistry } from "./resolver";

export const CURRENT_LANDING_PAGE_INPUT_CATALOG_VERSION = 5 as const;

const currentCatalogEntry = landingPageInputCatalogRegistry[
  CURRENT_LANDING_PAGE_INPUT_CATALOG_VERSION
];
if (
  !currentCatalogEntry ||
  currentCatalogEntry.version !== CURRENT_LANDING_PAGE_INPUT_CATALOG_VERSION
) {
  throw new Error("The explicit current input catalog version is not executable.");
}

export const landingPageInputCatalogOperationalPlans = [
  "starter",
  "lite",
  "pro",
  "ultra",
] as const satisfies readonly LandingPageInputCatalogPlan[];

export const landingPageCommercialIdentityFieldKeys = Object.freeze([
  "funnel_stage",
  "transaction_intent",
  "landing_page_offering_scope",
] as const);

export function collectCommercialIdentityReviewBlockers(
  impacts: readonly Readonly<{
    taxon: Readonly<{ id: string }>;
    classification: LandingPageInputCatalogTransitionClassification;
    reviewRequiredFieldKeys: readonly string[];
  }>[],
): readonly Readonly<{ taxonId: string; fieldKeys: readonly string[] }>[] {
  const protectedKeys = new Set<string>(landingPageCommercialIdentityFieldKeys);
  return Object.freeze(
    impacts.flatMap((impact) => {
      if (impact.classification !== "review_required") return [];
      const fieldKeys = impact.reviewRequiredFieldKeys.filter((fieldKey) =>
        protectedKeys.has(fieldKey),
      );
      return fieldKeys.length === 0
        ? []
        : [Object.freeze({
            taxonId: impact.taxon.id,
            fieldKeys: Object.freeze(fieldKeys),
          })];
    }),
  );
}

export function listLandingPageInputCatalogVersions(): readonly number[] {
  return Object.freeze(
    Object.keys(landingPageInputCatalogRegistry)
      .map(Number)
      .filter((version) => Number.isSafeInteger(version) && version > 0)
      .sort((left, right) => left - right),
  );
}

export function classifyLandingPageInputCatalogTransition(
  previous: ResolvedLandingPageInputCatalog,
  next: ResolvedLandingPageInputCatalog,
): LandingPageInputCatalogTransitionResult {
  if (
    previous.plan !== next.plan ||
    previous.servedTaxon.id !== next.servedTaxon.id ||
    previous.version >= next.version
  ) {
    return freezeResult(result("review_required", [], [], collectFieldKeys(previous, next)));
  }

  const previousKeys = previous.fields.map((field) => field.fieldKey);
  const nextKeys = next.fields.map((field) => field.fieldKey);
  const previousByKey = new Map(previous.fields.map((field) => [field.fieldKey, field]));
  const nextByKey = new Map(next.fields.map((field) => [field.fieldKey, field]));
  const added = nextKeys.filter((fieldKey) => !previousByKey.has(fieldKey));
  const removed = previousKeys.filter((fieldKey) => !nextByKey.has(fieldKey));
  const expanded: string[] = [];
  const reviewRequired = new Set<string>(removed);

  const survivingPreviousKeys = previousKeys.filter((fieldKey) => nextByKey.has(fieldKey));
  const previousOrderWithinNext = nextKeys.filter((fieldKey) => previousByKey.has(fieldKey));
  if (!sameJson(previousOrderWithinNext, survivingPreviousKeys)) {
    survivingPreviousKeys.forEach((fieldKey) => reviewRequired.add(fieldKey));
  }

  for (const fieldKey of previousKeys) {
    const before = previousByKey.get(fieldKey);
    const after = nextByKey.get(fieldKey);
    if (!before || !after) continue;
    if (sameJson(functionalField(before), functionalField(after))) continue;
    if (isStrictAllowedValuesExpansion(before, after)) {
      expanded.push(fieldKey);
      continue;
    }
    reviewRequired.add(fieldKey);
  }

  if (reviewRequired.size > 0) {
    return freezeResult(result("review_required", added, expanded, [...reviewRequired]));
  }
  if (added.length > 0 || expanded.length > 0) {
    return freezeResult(result("compatible_evolution", added, expanded, []));
  }
  return freezeResult(result("no_material_change", [], [], []));
}

export function classifyLandingPageInputCatalogTransitionForTaxon(input: Readonly<{
  previousVersion: number;
  nextVersion: number;
  taxonChain: LandingPageInputCatalogTaxonChain;
  registry?: LandingPageInputCatalogRegistry;
}>): LandingPageInputCatalogTransitionResult {
  const registry = input.registry ?? landingPageInputCatalogRegistry;
  const aggregate = result("no_material_change", [], [], []);
  for (const plan of landingPageInputCatalogOperationalPlans) {
    const previous = resolveLandingPageInputCatalogFromRegistry(
      { version: input.previousVersion, plan, taxonChain: input.taxonChain },
      registry,
    );
    const next = resolveLandingPageInputCatalogFromRegistry(
      { version: input.nextVersion, plan, taxonChain: input.taxonChain },
      registry,
    );
    if (!previous.ok || !next.ok) {
      return result("review_required", [], [], []);
    }
    mergeTransition(
      aggregate,
      classifyLandingPageInputCatalogTransition(previous.value, next.value),
    );
  }
  return freezeResult(aggregate);
}

function isStrictAllowedValuesExpansion(
  before: ResolvedLandingPageInputField,
  after: ResolvedLandingPageInputField,
): boolean {
  if (before.validation.kind !== "enum" || after.validation.kind !== "enum") {
    return false;
  }
  const beforeFunctional = functionalField(before);
  const afterFunctional = functionalField(after);
  beforeFunctional.validation = { kind: "enum", allowedValues: [] };
  afterFunctional.validation = { kind: "enum", allowedValues: [] };
  if (!sameJson(beforeFunctional, afterFunctional)) return false;
  const beforeValues = before.validation.allowedValues;
  const afterValues = after.validation.allowedValues;
  return (
    afterValues.length > beforeValues.length &&
    beforeValues.every((value) => afterValues.includes(value)) &&
    sameJson(
      afterValues.filter((value) => beforeValues.includes(value)),
      beforeValues,
    )
  );
}

function functionalField(field: ResolvedLandingPageInputField): Record<string, unknown> {
  const {
    evidence: _evidence,
    provenance: _provenance,
    ...functional
  } = field;
  return JSON.parse(JSON.stringify(functional)) as Record<string, unknown>;
}

function mergeTransition(
  aggregate: MutableTransition,
  next: LandingPageInputCatalogTransitionResult,
): void {
  if (rank(next.classification) > rank(aggregate.classification)) {
    aggregate.classification = next.classification;
  }
  appendUnique(aggregate.addedFieldKeys, next.addedFieldKeys);
  appendUnique(
    aggregate.expandedAllowedValueFieldKeys,
    next.expandedAllowedValueFieldKeys,
  );
  appendUnique(aggregate.reviewRequiredFieldKeys, next.reviewRequiredFieldKeys);
}

type MutableTransition = {
  classification: LandingPageInputCatalogTransitionClassification;
  addedFieldKeys: string[];
  expandedAllowedValueFieldKeys: string[];
  reviewRequiredFieldKeys: string[];
};

function result(
  classification: LandingPageInputCatalogTransitionClassification,
  addedFieldKeys: readonly string[],
  expandedAllowedValueFieldKeys: readonly string[],
  reviewRequiredFieldKeys: readonly string[],
): MutableTransition {
  return {
    classification,
    addedFieldKeys: [...addedFieldKeys],
    expandedAllowedValueFieldKeys: [...expandedAllowedValueFieldKeys],
    reviewRequiredFieldKeys: [...reviewRequiredFieldKeys],
  };
}

function freezeResult(value: MutableTransition): LandingPageInputCatalogTransitionResult {
  return Object.freeze({
    classification: value.classification,
    addedFieldKeys: Object.freeze([...value.addedFieldKeys]),
    expandedAllowedValueFieldKeys: Object.freeze([
      ...value.expandedAllowedValueFieldKeys,
    ]),
    reviewRequiredFieldKeys: Object.freeze([...value.reviewRequiredFieldKeys]),
  });
}

function rank(classification: LandingPageInputCatalogTransitionClassification): number {
  return {
    no_material_change: 0,
    compatible_evolution: 1,
    review_required: 2,
  }[classification];
}

function appendUnique(target: string[], values: readonly string[]): void {
  for (const value of values) if (!target.includes(value)) target.push(value);
}

function collectFieldKeys(
  previous: ResolvedLandingPageInputCatalog,
  next: ResolvedLandingPageInputCatalog,
): readonly string[] {
  return [...new Set([...previous.fields, ...next.fields].map((field) => field.fieldKey))];
}

function sameJson(left: unknown, right: unknown): boolean {
  return stableStringify(left) === stableStringify(right);
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(",")}]`;
  }
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}
