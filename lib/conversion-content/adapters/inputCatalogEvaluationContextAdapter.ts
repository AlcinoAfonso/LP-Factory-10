import "server-only";

import {
  buildLandingPageInputCatalogTaxonChain,
  type LandingPageInputCatalogTaxonIdentity,
} from "../landing-page/input-catalog";
import {
  buildInputCatalogEvaluationContext,
  type BuildInputCatalogEvaluationContextResult,
  type InputCatalogEvaluationReconstructionInput,
} from "../landing-page/taxon-preparation";
import { createServiceClient } from "../../supabase/service";
import { loadTaxonPreparationForReviewedVersion } from "./selectedEndCustomerResearchAdapter";

export async function reconstructCanonicalInputCatalogEvaluationContext(
  input: InputCatalogEvaluationReconstructionInput,
): Promise<BuildInputCatalogEvaluationContextResult> {
  const preparation = await loadTaxonPreparationForReviewedVersion({
    taxonId: input.taxonId,
  });
  if (!preparation.ok) {
    return failure(
      preparation.error.code === "REQUIRED_INPUT_CATALOG_VERSION_INVALID"
        ? "INPUT_CATALOG_VERSION_INVALID"
        : preparation.error.code === "REQUIRED_INPUT_CATALOG_VERSION_NOT_EXECUTABLE"
          ? "INPUT_CATALOG_VERSION_NOT_EXECUTABLE"
          : "AUTHORIZED_RESEARCH_INVALID",
      preparation.error.message,
    );
  }
  if (preparation.value.requiredInputCatalogVersion !== input.inputCatalogVersion) {
    return failure(
      "CONTEXT_IDENTITY_INVALID",
      "A versão E20.2 avaliada mudou desde o início da execução.",
    );
  }

  const taxonChain = await readCanonicalTaxonChain(input.taxonId);
  if (!taxonChain.ok) {
    return failure("CONTEXT_IDENTITY_INVALID", taxonChain.error);
  }

  return buildInputCatalogEvaluationContext({
    selectedResearch: {
      ok: true,
      value: {
        taxonId: preparation.value.taxonId,
        taxonSlug: preparation.value.taxonSlug,
        selectedResearchVersion: preparation.value.selectedResearchVersion,
        selectedResearchValid: true,
        reviewedInputCatalogVersion:
          preparation.value.reviewedInputCatalogVersion,
        research: preparation.value.research,
      },
    },
    taxonChain: taxonChain.value,
    inputCatalogVersion: preparation.value.requiredInputCatalogVersion,
  });
}

async function readCanonicalTaxonChain(taxonId: string) {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("business_taxons")
    .select("id,parent_id,level,name,slug,is_active")
    .in("level", ["segment", "niche", "ultra_niche"]);
  if (error || !Array.isArray(data)) {
    return { ok: false as const, error: "Não foi possível ler a cadeia taxonômica." };
  }

  const identities = data
    .map(normalizeTaxonIdentity)
    .filter((taxon): taxon is LandingPageInputCatalogTaxonIdentity => taxon !== null);
  if (identities.length !== data.length) {
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
