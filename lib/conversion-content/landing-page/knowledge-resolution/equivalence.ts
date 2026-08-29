import {
  landingPageInputCatalogPlans,
  resolveLandingPageInputCatalog,
  type LandingPageInputCatalogTaxonChain,
  type ResolvedLandingPageInputCatalog,
  type ResolvedLandingPageInputField,
} from "../input-catalog";

export type CompareTaxonInputCatalogsResult =
  | Readonly<{ ok: true; equivalent: boolean }>
  | Readonly<{
      ok: false;
      error: Readonly<{ code: string; message: string }>;
    }>;

export function compareTaxonInputCatalogs(input: {
  version: number;
  servedTaxonChain: LandingPageInputCatalogTaxonChain;
  specializedTaxonChain: LandingPageInputCatalogTaxonChain;
}): CompareTaxonInputCatalogsResult {
  for (const plan of landingPageInputCatalogPlans) {
    const served = resolveLandingPageInputCatalog({
      version: input.version,
      plan,
      taxonChain: input.servedTaxonChain,
      ultraNicheLayerAuthorized: true,
    });
    const specialized = resolveLandingPageInputCatalog({
      version: input.version,
      plan,
      taxonChain: input.specializedTaxonChain,
      ultraNicheLayerAuthorized: true,
    });
    if (!served.ok || !specialized.ok) {
      const error = !served.ok ? served.error : !specialized.ok ? specialized.error : null;
      return Object.freeze({
        ok: false,
        error: Object.freeze({
          code: error?.code ?? "UNKNOWN",
          message: "O catálogo E20.2 não pôde ser resolvido para equivalência factual.",
        }),
      });
    }
    if (materialCatalogSnapshot(served.value) !== materialCatalogSnapshot(specialized.value)) {
      return Object.freeze({ ok: true, equivalent: false });
    }
  }
  return Object.freeze({ ok: true, equivalent: true });
}

function materialCatalogSnapshot(catalog: ResolvedLandingPageInputCatalog): string {
  return canonicalJson({
    version: catalog.version,
    plan: catalog.plan,
    fields: [...catalog.fields]
      .sort((left, right) => left.fieldKey.localeCompare(right.fieldKey))
      .map(materialField),
    retiredFieldKeys: [...catalog.retiredFieldKeys].sort(),
  });
}

function materialField(field: ResolvedLandingPageInputField): unknown {
  const {
    originLayer: _originLayer,
    originTaxon: _originTaxon,
    evidence: _evidence,
    provenance: _provenance,
    ...material
  } = field;
  return material;
}

function canonicalJson(value: unknown): string {
  return JSON.stringify(sortRecordKeys(value));
}

function sortRecordKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortRecordKeys);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, nested]) => [key, sortRecordKeys(nested)]),
  );
}
