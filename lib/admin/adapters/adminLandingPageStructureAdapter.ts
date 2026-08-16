import "server-only";

import {
  listLandingPageRootVersions,
  resolveLandingPageRootParameters,
} from "@/conversion-content/landing-page";
import {
  listLandingPageModuleIdentities,
  listLandingPageModuleSelectionCatalog,
  resolveLandingPageModuleCatalog,
  validateLandingPageModuleIdentity,
  type LandingPageFunnelProfileKey,
} from "@/conversion-content/landing-page/module-catalog";
import {
  landingPageInputCatalogPlans,
  landingPageInputCatalogRegistry,
  buildLandingPageInputCatalogTaxonChain,
  resolveLandingPageInputCatalog,
  type LandingPageInputCatalogPlan,
} from "@/conversion-content/landing-page/input-catalog";
import { createServiceClient } from "@/lib/supabase/service";
import { getAdminTaxonResearchPresentation } from "./adminTaxonomyAdapter";
import type { AdminTaxonSummary } from "./adminReadOnlyTypes";

export const adminLandingPageStructureViews = [
  "parametros",
  "modulos",
  "entradas",
  "pesquisas",
] as const;

export type AdminLandingPageStructureView =
  (typeof adminLandingPageStructureViews)[number];

type StructureQuery = Readonly<Record<string, string | undefined>>;

type StructureTaxon = AdminTaxonSummary & {
  level: "segment" | "niche" | "ultra_niche";
};

export function normalizeAdminLandingPageStructureView(
  value: string | undefined,
): AdminLandingPageStructureView {
  return adminLandingPageStructureViews.includes(
    value as AdminLandingPageStructureView,
  )
    ? (value as AdminLandingPageStructureView)
    : "parametros";
}

export async function readAdminLandingPageStructure(
  view: AdminLandingPageStructureView,
  query: StructureQuery,
) {
  switch (view) {
    case "modulos":
      return { view, data: readModules(query) } as const;
    case "entradas":
      return { view, data: await readInputs(query) } as const;
    case "pesquisas":
      return { view, data: await readResearch(query) } as const;
    default:
      return { view, data: readRootParameters(query) } as const;
  }
}

function readRootParameters(query: StructureQuery) {
  const versions = listLandingPageRootVersions();
  const requestedVersion = parseInteger(query.rootVersion);
  const rootVersion =
    requestedVersion !== null && versions.includes(requestedVersion)
      ? requestedVersion
      : versions.at(-1);

  if (rootVersion === undefined) {
    return { versions, selectedVersion: null, result: null };
  }

  const base = resolveLandingPageRootParameters({ rootVersion });
  const presetKey =
    base.ok && query.preset && Object.hasOwn(base.value.presets, query.preset)
      ? query.preset
      : undefined;

  return {
    versions,
    selectedVersion: rootVersion,
    result: resolveLandingPageRootParameters({ rootVersion, presetKey }),
  };
}

function readModules(query: StructureQuery) {
  const identities = listLandingPageModuleIdentities();
  const selection = listLandingPageModuleSelectionCatalog();
  const modules = identities.modules;
  const requestedModule = modules.find(
    (candidate) => candidate.moduleKey === query.module,
  );
  const moduleIdentity = requestedModule ?? modules[0];
  const requestedVariant = moduleIdentity?.variants.find(
    (candidate) => candidate.variantKey === query.variant,
  );
  const variantIdentity = requestedVariant ?? moduleIdentity?.variants[0];
  const funnelProfileKey = isFunnelProfile(query.funnel)
    ? query.funnel
    : "bofu";
  const root = readRootParameters(query);

  if (!moduleIdentity || !variantIdentity || root.selectedVersion === null) {
    return {
      identities,
      selection,
      moduleIdentity: null,
      variantIdentity: null,
      funnelProfileKey,
      result: null,
    };
  }

  const identityValidation = validateLandingPageModuleIdentity({
    moduleKey: moduleIdentity.moduleKey,
    moduleVersion: moduleIdentity.moduleVersion,
    variantKey: variantIdentity.variantKey,
    variantVersion: variantIdentity.variantVersion,
  });
  if (!identityValidation.ok) {
    return {
      identities,
      selection,
      moduleIdentity,
      variantIdentity,
      funnelProfileKey,
      result: identityValidation,
    };
  }

  const variantName = variantIdentity.variantKey.slice(
    moduleIdentity.moduleKey.length + 1,
  );
  return {
    identities,
    selection,
    moduleIdentity,
    variantIdentity,
    funnelProfileKey,
    result: resolveLandingPageModuleCatalog({
      moduleCatalogVersion: identities.moduleCatalogVersion,
      rootVersion: root.selectedVersion,
      moduleKey: moduleIdentity.moduleKey,
      moduleVersion: moduleIdentity.moduleVersion,
      variantName,
      variantVersion: variantIdentity.variantVersion,
      funnelProfileKey,
    }),
  };
}

async function readInputs(query: StructureQuery) {
  const taxonRead = await readActiveTaxons();
  const versions = Object.keys(landingPageInputCatalogRegistry)
    .map(Number)
    .filter(Number.isInteger)
    .sort((left, right) => left - right);
  const requestedVersion = parseInteger(query.catalogVersion);
  const version =
    requestedVersion !== null && versions.includes(requestedVersion)
      ? requestedVersion
      : versions.at(-1) ?? null;
  const plan = landingPageInputCatalogPlans.includes(
    query.plan as LandingPageInputCatalogPlan,
  )
    ? (query.plan as LandingPageInputCatalogPlan)
    : "starter";
  const selectedTaxon = selectTaxon(taxonRead.taxons, query.taxon);

  if (taxonRead.error || version === null || !selectedTaxon) {
    return {
      taxons: taxonRead.taxons,
      taxonError: taxonRead.error,
      versions,
      version,
      plans: landingPageInputCatalogPlans,
      plan,
      selectedTaxon,
      chain: null,
      result: null,
    };
  }

  const chain = buildLandingPageInputCatalogTaxonChain(selectedTaxon, taxonRead.taxons);
  return {
    taxons: taxonRead.taxons,
    taxonError: null,
    versions,
    version,
    plans: landingPageInputCatalogPlans,
    plan,
    selectedTaxon,
    chain,
    result: chain.ok
      ? resolveLandingPageInputCatalog({ version, plan, taxonChain: chain.value })
      : null,
  };
}

async function readResearch(query: StructureQuery) {
  const taxonRead = await readActiveTaxons();
  const selectedTaxon = selectTaxon(taxonRead.taxons, query.taxon);

  if (taxonRead.error || !selectedTaxon) {
    return {
      taxons: taxonRead.taxons,
      taxonError: taxonRead.error,
      selectedTaxon,
      diagnostics: null,
      result: null,
    };
  }

  const presentation = await getAdminTaxonResearchPresentation(selectedTaxon);

  return {
    taxons: taxonRead.taxons,
    taxonError: null,
    selectedTaxon,
    presentation,
  };
}

async function readActiveTaxons(): Promise<{
  taxons: StructureTaxon[];
  error: string | null;
}> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("business_taxons")
    .select("id,parent_id,level,name,slug,is_active")
    .eq("is_active", true)
    .in("level", ["segment", "niche", "ultra_niche"])
    .order("level", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    console.error("readAdminLandingPageStructure taxons failed:", {
      code: error.code,
      message: error.message,
    });
    return { taxons: [], error: "Não foi possível ler os taxons ativos." };
  }

  const rows = Array.isArray(data) ? data : [];
  const validRows = rows.filter(isStructureTaxonRow);
  if (validRows.length !== rows.length) {
    return { taxons: [], error: "A lista de taxons não pôde ser normalizada com segurança." };
  }
  const names = new Map(validRows.map((row) => [row.id, row.name]));
  return {
    taxons: validRows.map((row) => ({
      id: row.id,
      parentId: row.parent_id,
      parentName: row.parent_id ? names.get(row.parent_id) ?? null : null,
      level: row.level,
      name: row.name,
      slug: row.slug,
      isActive: row.is_active,
      aliasCount: 0,
    })),
    error: null,
  };
}

function selectTaxon(
  taxons: readonly StructureTaxon[],
  taxonId: string | undefined,
) {
  return taxons.find((taxon) => taxon.id === taxonId) ?? taxons[0] ?? null;
}

function parseInteger(value: string | undefined): number | null {
  if (!value || !/^\d+$/.test(value)) return null;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) ? parsed : null;
}

function isFunnelProfile(value: string | undefined): value is LandingPageFunnelProfileKey {
  return value === "bofu" || value === "mofu" || value === "tofu";
}

function isStructureTaxonRow(value: unknown): value is {
  id: string;
  parent_id: string | null;
  level: "segment" | "niche" | "ultra_niche";
  name: string;
  slug: string;
  is_active: true;
} {
  if (typeof value !== "object" || value === null) return false;
  const row = value as Record<string, unknown>;
  return (
    typeof row.id === "string" &&
    (row.parent_id === null || typeof row.parent_id === "string") &&
    (row.level === "segment" || row.level === "niche" || row.level === "ultra_niche") &&
    typeof row.name === "string" &&
    typeof row.slug === "string" &&
    row.is_active === true
  );
}
