import "server-only";

import { createServiceClient } from "@/lib/supabase/service";
import {
  buildLandingPageInputCatalogTaxonChain,
  CURRENT_LANDING_PAGE_INPUT_CATALOG_VERSION,
  type LandingPageInputCatalogTaxonIdentity,
} from "../landing-page/input-catalog";
import {
  isEndCustomerResearchSelectionEnabled,
  isInputCatalogReviewEnabled,
  deriveEffectiveTaxonPreparation,
  type LoadSelectedEndCustomerResearchResult,
  type TaxonPreparationResult,
} from "../landing-page/taxon-preparation";
import { loadSelectedEndCustomerResearchFromClient } from "./selectedEndCustomerResearchAdapterCore";

export async function loadSelectedEndCustomerResearchForTaxon(input: {
  taxonId: string;
}): Promise<LoadSelectedEndCustomerResearchResult> {
  if (!isEndCustomerResearchSelectionEnabled()) {
    return {
      ok: false,
      error: {
        code: "FEATURE_DISABLED",
        message: "A leitura da pesquisa selecionada está desabilitada.",
      },
    };
  }

  const supabase = createServiceClient();
  return loadSelectedEndCustomerResearchFromClient(input, supabase);
}

export async function loadTaxonPreparationForCurrentVersion(input: {
  taxonId: string;
}): Promise<TaxonPreparationResult> {
  if (!isInputCatalogReviewEnabled()) {
    return preparationFailure(
      "INPUT_CATALOG_REVIEW_DISABLED",
      "A preparação E20.6 está desabilitada.",
    );
  }
  if (!isEndCustomerResearchSelectionEnabled()) {
    return preparationFailure(
      "FEATURE_DISABLED",
      "A leitura da pesquisa selecionada está desabilitada.",
    );
  }

  const supabase = createServiceClient();
  const selectedResearch = await loadSelectedEndCustomerResearchFromClient(
    { taxonId: input.taxonId, includeInputCatalogReview: true },
    supabase,
  );
  if (!selectedResearch.ok) return selectedResearch;

  const chain = await readCompleteInputCatalogTaxonChain(
    supabase,
    selectedResearch.value.taxonId,
  );
  if (!chain.ok) return chain.result;
  return deriveEffectiveTaxonPreparation({
    selectedResearch,
    currentInputCatalogVersion: CURRENT_LANDING_PAGE_INPUT_CATALOG_VERSION,
    taxonChain: chain.value,
  });
}

const TAXON_CHAIN_PAGE_SIZE = 500;

async function readCompleteInputCatalogTaxonChain(
  client: ReturnType<typeof createServiceClient>,
  taxonId: string,
): Promise<
  | Readonly<{
      ok: true;
      value: Parameters<typeof deriveEffectiveTaxonPreparation>[0]["taxonChain"];
    }>
  | Readonly<{ ok: false; result: TaxonPreparationResult }>
> {
  const taxons: LandingPageInputCatalogTaxonIdentity[] = [];
  let offset = 0;
  while (true) {
    const { data, error } = await client
      .from("business_taxons")
      .select("id,parent_id,level,name,slug,is_active")
      .in("level", ["segment", "niche", "ultra_niche"])
      .order("id", { ascending: true })
      .range(offset, offset + TAXON_CHAIN_PAGE_SIZE - 1);
    if (error || !Array.isArray(data)) {
      return {
        ok: false,
        result: preparationFailure(
          "DATABASE_READ_FAILED",
          "A cadeia taxonômica não pôde ser lida integralmente.",
        ),
      };
    }
    const page = data.map(normalizeTaxonIdentity);
    if (page.some((taxon) => taxon === null)) {
      return {
        ok: false,
        result: preparationFailure(
          "TAXON_IDENTITY_INVALID",
          "A cadeia taxonômica contém identidade inválida.",
        ),
      };
    }
    taxons.push(...(page as LandingPageInputCatalogTaxonIdentity[]));
    if (data.length < TAXON_CHAIN_PAGE_SIZE) break;
    offset += data.length;
  }
  const selected = taxons.find((taxon) => taxon.id === taxonId);
  if (!selected) {
    return {
      ok: false,
      result: preparationFailure(
        "TAXON_NOT_FOUND",
        "O taxon não pertence à cadeia taxonômica autoritativa.",
      ),
    };
  }
  const chain = buildLandingPageInputCatalogTaxonChain(selected, taxons);
  return chain.ok
    ? { ok: true, value: chain.value }
    : {
        ok: false,
        result: preparationFailure(
          "TAXON_IDENTITY_INVALID",
          chain.error.message,
        ),
      };
}

function normalizeTaxonIdentity(
  value: unknown,
): LandingPageInputCatalogTaxonIdentity | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const row = value as Record<string, unknown>;
  if (
    typeof row.id !== "string" ||
    (row.parent_id !== null && typeof row.parent_id !== "string") ||
    (row.level !== "segment" &&
      row.level !== "niche" &&
      row.level !== "ultra_niche") ||
    typeof row.name !== "string" ||
    typeof row.slug !== "string" ||
    typeof row.is_active !== "boolean"
  ) {
    return null;
  }
  return {
    id: row.id,
    parentId: row.parent_id,
    level: row.level,
    name: row.name,
    slug: row.slug,
    isActive: row.is_active,
  };
}

function preparationFailure(
  code: Extract<TaxonPreparationResult, { ok: false }>["error"]["code"],
  message: string,
): Extract<TaxonPreparationResult, { ok: false }> {
  return Object.freeze({ ok: false, error: Object.freeze({ code, message }) });
}
