import "server-only";

import type {
  LandingPageInputCatalogTaxonIdentity,
  ValidateLandingPageInputCatalogDraftResult,
} from "@/conversion-content/landing-page/input-catalog";
import type { createServiceClient } from "@/lib/supabase/service";
import { collectCompletePaginatedRows } from "./adminInputCatalogLifecyclePagination";
import { createInputCatalogLifecycleProof } from "./adminInputCatalogLifecycleValidation";

type ServiceClient = ReturnType<typeof createServiceClient>;
export type LifecycleTaxon = Readonly<{
  identity: LandingPageInputCatalogTaxonIdentity;
  reviewedVersion: number | null;
  selectedResearchVersion: number | null;
}>;
export type LifecycleContext = Readonly<{
  taxons: readonly LifecycleTaxon[];
  lifecycleProof: ReturnType<ReturnType<typeof createInputCatalogLifecycleProof>["finish"]> | null;
}>;
const PAGE_SIZE = 500;
const READ_ERROR = "A coleção administrativa não pôde ser lida integralmente.";

/** Complete offset/count scan, not a transaction snapshot. */
export async function readCompleteLifecycleContext(
  client: ServiceClient,
  options: Readonly<{
    fingerprint: boolean;
    prepareCandidate?: (taxons: readonly LifecycleTaxon[]) => ValidateLandingPageInputCatalogDraftResult;
  }> = { fingerprint: false },
): Promise<Readonly<{ ok: true; value: LifecycleContext }> | Readonly<{ ok: false; message: string }>> {
  const taxonRows = await collectCompletePaginatedRows({
    pageSize: PAGE_SIZE,
    readPage: async (offset, limit) => {
      try {
        const { data, error, count } = await client.from("business_taxons")
          .select("id,parent_id,level,name,slug,is_active,selected_end_customer_research_version,reviewed_input_catalog_version", { count: "exact" })
          .in("level", ["segment", "niche", "ultra_niche"])
          .order("id", { ascending: true })
          .range(offset, offset + limit - 1);
        if (error || !Array.isArray(data) || count === null || data.length > limit) {
          return null;
        }
        return { rows: data, total: count };
      } catch {
        return null;
      }
    },
  });
  if (!taxonRows.ok) return { ok: false, message: READ_ERROR };
  const taxons: LifecycleTaxon[] = [];
  for (const raw of taxonRows.rows) {
    const taxon = normalizeTaxon(raw);
    if (!taxon) {
      return { ok: false, message: "A coleção de taxons contém estado inválido." };
    }
    taxons.push(taxon);
  }
  const candidate = options.prepareCandidate?.(taxons);
  const proof = options.fingerprint || candidate?.ok ? createInputCatalogLifecycleProof({
    fingerprint: options.fingerprint,
    candidate: candidate?.ok ? candidate.value : undefined,
  }) : null;

  const context = { taxons };
  return { ok: true, value: { ...context, lifecycleProof: proof?.finish(context) ?? null } };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeTaxon(value: unknown): Readonly<{
  identity: LandingPageInputCatalogTaxonIdentity;
  reviewedVersion: number | null;
  selectedResearchVersion: number | null;
}> | null {
  if (!isRecord(value)) return null;
  if (
    typeof value.id !== "string" ||
    (value.parent_id !== null && typeof value.parent_id !== "string") ||
    (value.level !== "segment" && value.level !== "niche" && value.level !== "ultra_niche") ||
    typeof value.name !== "string" ||
    typeof value.slug !== "string" ||
    typeof value.is_active !== "boolean" ||
    (value.selected_end_customer_research_version !== null &&
      (!Number.isSafeInteger(value.selected_end_customer_research_version) ||
        Number(value.selected_end_customer_research_version) <= 0)) ||
    (value.reviewed_input_catalog_version !== null &&
      (!Number.isSafeInteger(value.reviewed_input_catalog_version) ||
        Number(value.reviewed_input_catalog_version) <= 0))
  ) return null;
  return {
    identity: {
      id: value.id,
      parentId: value.parent_id,
      level: value.level,
      name: value.name,
      slug: value.slug,
      isActive: value.is_active,
    },
    reviewedVersion: value.reviewed_input_catalog_version as number | null,
    selectedResearchVersion:
      value.selected_end_customer_research_version as number | null,
  };
}
