import {
  landingPageInputCatalogPlans,
  type ResolveCurrentLandingPageInputCatalogInput,
  type ResolveCurrentLandingPageInputCatalogResult,
  type ResolveLandingPageInputCatalogInput,
  type ResolveLandingPageInputCatalogResult,
  type ResolvedCurrentLandingPageInputCatalog,
  type ResolvedCurrentLandingPageInputField,
  type ResolvedLandingPageInputCatalog,
} from "./contracts";
import { CURRENT_LANDING_PAGE_INPUT_CATALOG_VERSION } from "./lifecycle";
import { resolveLandingPageInputCatalog } from "./resolver";

export function resolveCurrentLandingPageInputCatalog(
  input: ResolveCurrentLandingPageInputCatalogInput,
): ResolveCurrentLandingPageInputCatalogResult {
  return resolveCurrentLandingPageInputCatalogWithResolver(
    input,
    resolveLandingPageInputCatalog,
  );
}

export function resolveCurrentLandingPageInputCatalogWithResolver(
  input: ResolveCurrentLandingPageInputCatalogInput,
  resolveHistorical: (
    input: ResolveLandingPageInputCatalogInput,
  ) => ResolveLandingPageInputCatalogResult,
): ResolveCurrentLandingPageInputCatalogResult {
  if (!isRecord(input)) {
    return invalid("INVALID_TAXON_CHAIN", "Current input catalog resolution requires a taxon chain.");
  }
  if (Object.keys(input).some((key) => key !== "taxonChain")) {
    return invalid(
      "HISTORICAL_INPUT_NOT_ALLOWED",
      "Current input catalog resolution accepts only the taxon chain.",
    );
  }
  if (!isRecord(input.taxonChain)) {
    return invalid(
      "INVALID_TAXON_CHAIN",
      "Current input catalog resolution requires a taxon chain.",
    );
  }

  const projections: ResolvedCurrentLandingPageInputCatalog[] = [];
  for (const plan of landingPageInputCatalogPlans) {
    const resolved = resolveHistorical({
      version: CURRENT_LANDING_PAGE_INPUT_CATALOG_VERSION,
      plan,
      taxonChain: input.taxonChain,
      ultraNicheLayerAuthorized: input.taxonChain.ultraNiche !== undefined,
    });
    if (!resolved.ok) return resolved;
    projections.push(projectPlanNeutralCatalog(resolved.value));
  }

  const baseline = JSON.stringify(projections[0]);
  if (projections.some((projection) => JSON.stringify(projection) !== baseline)) {
    return invalid(
      "PLAN_NEUTRAL_PROJECTION_MISMATCH",
      "The current catalog cannot be projected without a commercial plan.",
    );
  }

  return { ok: true, value: projections[0] };
}

function projectPlanNeutralCatalog(
  catalog: ResolvedLandingPageInputCatalog,
): ResolvedCurrentLandingPageInputCatalog {
  const fields: ResolvedCurrentLandingPageInputField[] = catalog.fields.map((field) => {
    const {
      allowedPlans: _allowedPlans,
      provenance,
      ...definition
    } = field;
    return {
      ...definition,
      provenance: provenance.filter(
        (entry) => entry.property !== "allowedPlans",
      ),
    } as ResolvedCurrentLandingPageInputField;
  });
  return deepFreeze({
    version: catalog.version,
    servedTaxon: catalog.servedTaxon,
    appliedLayers: catalog.appliedLayers,
    fields,
    retiredFieldKeys: catalog.retiredFieldKeys,
    valid: true,
  });
}

function invalid(
  code: Extract<
    ResolveCurrentLandingPageInputCatalogResult,
    { ok: false }
  >["error"]["code"],
  message: string,
): ResolveCurrentLandingPageInputCatalogResult {
  return { ok: false, error: { code, message } };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === "object") {
    Object.freeze(value);
    Object.values(value as Record<string, unknown>).forEach(deepFreeze);
  }
  return value;
}
