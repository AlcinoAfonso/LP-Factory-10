import "server-only";

import {
  buildLandingPageInputCatalogTaxonChain,
  resolveLandingPageInputCatalogFromRegistry,
  type LandingPageInputCatalogRegistry,
  type LandingPageInputCatalogTaxonIdentity,
} from "../landing-page/input-catalog";
import {
  buildInputCatalogEvaluationContext,
  resolveInputCatalogReview,
  type BuildInputCatalogEvaluationContextResult,
  type InputCatalogEvaluationReconstructionInput,
} from "../landing-page/taxon-preparation";
import { createServiceClient } from "../../supabase/service";
import { loadSelectedEndCustomerResearchForTaxon } from "./selectedEndCustomerResearchAdapter";

export async function reconstructCanonicalInputCatalogEvaluationContext(
  input: InputCatalogEvaluationReconstructionInput,
): Promise<BuildInputCatalogEvaluationContextResult> {
  const selectedResearch = await loadSelectedEndCustomerResearchForTaxon({
    taxonId: input.taxonId,
  });
  if (!selectedResearch.ok) {
    return failure(
      "AUTHORIZED_RESEARCH_INVALID",
      selectedResearch.error.message,
    );
  }
  const taxonChain = await readCanonicalTaxonChain(input.taxonId);
  if (!taxonChain.ok) {
    return failure("CONTEXT_IDENTITY_INVALID", taxonChain.error);
  }

  return buildInputCatalogEvaluationContext({
    selectedResearch,
    taxonChain: taxonChain.value,
    inputCatalogVersion: input.inputCatalogVersion,
  });
}

export async function reconstructDraftInputCatalogEvaluationContext(
  input: InputCatalogEvaluationReconstructionInput,
  registry: LandingPageInputCatalogRegistry,
): Promise<BuildInputCatalogEvaluationContextResult> {
  const selectedResearch = await loadSelectedEndCustomerResearchForTaxon({
    taxonId: input.taxonId,
  });
  if (!selectedResearch.ok) {
    return failure("AUTHORIZED_RESEARCH_INVALID", selectedResearch.error.message);
  }
  const taxonChain = await readCanonicalTaxonChain(input.taxonId);
  if (!taxonChain.ok) return failure("CONTEXT_IDENTITY_INVALID", taxonChain.error);
  return buildInputCatalogEvaluationContext(
    {
      selectedResearch,
      taxonChain: taxonChain.value,
      inputCatalogVersion: input.inputCatalogVersion,
    },
    {
      allowNonPublishedVersion: true,
      resolveReview: (reviewInput) => resolveInputCatalogReview(
        reviewInput,
        (catalogInput) => resolveLandingPageInputCatalogFromRegistry(catalogInput, registry),
      ),
    },
  );
}

async function readCanonicalTaxonChain(taxonId: string) {
  const supabase = createServiceClient();
  const rows: unknown[] = [];
  let offset = 0;
  while (true) {
    const { data, error } = await supabase
      .from("business_taxons")
      .select("id,parent_id,level,name,slug,is_active")
      .in("level", ["segment", "niche", "ultra_niche"])
      .order("id", { ascending: true })
      .range(offset, offset + 499);
    if (error || !Array.isArray(data)) {
      return { ok: false as const, error: "Não foi possível ler a cadeia taxonômica integralmente." };
    }
    rows.push(...data);
    if (data.length < 500) break;
    offset += data.length;
  }

  const identities = rows
    .map(normalizeTaxonIdentity)
    .filter((taxon): taxon is LandingPageInputCatalogTaxonIdentity => taxon !== null);
  if (identities.length !== rows.length) {
    return { ok: false as const, error: "A cadeia taxonômica contém identidade inválida." };
  }
  const selected = identities.find((taxon) => taxon.id === taxonId);
  if (!selected) {
    return { ok: false as const, error: "O taxon não pertence à cadeia taxonômica autoritativa." };
  }
  const chain = buildLandingPageInputCatalogTaxonChain(selected, identities);
  return chain.ok
    ? chain
    : { ok: false as const, error: chain.error.message };
}

function normalizeTaxonIdentity(value: unknown): LandingPageInputCatalogTaxonIdentity | null {
  if (!isRecord(value)) return null;
  if (
    typeof value.id !== "string" ||
    typeof value.name !== "string" ||
    typeof value.slug !== "string" ||
    typeof value.is_active !== "boolean" ||
    (value.parent_id !== null && typeof value.parent_id !== "string") ||
    (value.level !== "segment" && value.level !== "niche" && value.level !== "ultra_niche")
  ) {
    return null;
  }
  return {
    id: value.id,
    name: value.name,
    slug: value.slug,
    level: value.level,
    isActive: value.is_active,
    parentId: value.parent_id,
  };
}

function failure(
  code: Extract<BuildInputCatalogEvaluationContextResult, { ok: false }>["error"]["code"],
  message: string,
): BuildInputCatalogEvaluationContextResult {
  return Object.freeze({ ok: false, error: Object.freeze({ code, message }) });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
