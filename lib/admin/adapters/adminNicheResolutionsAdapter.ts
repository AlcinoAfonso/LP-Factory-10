import "server-only";

import { createServiceClient } from "@/lib/supabase/service";
import {
  ADMIN_PAGE_SIZE,
  cleanAdminSearch,
  getAdminAccountsByIds,
  getAdminTaxonsByIds,
  isAdminConfidence,
} from "./adminReadOnlyHelpers";
import type {
  AdminFilters,
  AdminListResult,
  AdminNicheResolutionDetail,
  AdminNicheResolutionListItem,
} from "./adminReadOnlyTypes";

export async function listAdminNicheResolutions(
  filters: AdminFilters = {},
): Promise<AdminListResult<AdminNicheResolutionListItem>> {
  const supabase = createServiceClient();
  const search = cleanAdminSearch(filters.search);

  let query: any = supabase
    .from("account_niche_resolutions")
    .select("account_id,raw_input,selected_taxon_id,ai_suggested_taxon_id,confidence,needs_admin_review,ai_needs_admin_review,resolution_status,match_source,score,ai_status,ai_ux_mode,updated_at,created_at", { count: "exact" })
    .order("updated_at", { ascending: false })
    .limit(ADMIN_PAGE_SIZE);

  if (filters.status) query = query.eq("resolution_status", filters.status);
  if (isAdminConfidence(filters.confidence)) query = query.eq("confidence", filters.confidence);
  if (filters.review === "true") query = query.or("needs_admin_review.eq.true,ai_needs_admin_review.eq.true");
  if (search) query = query.ilike("raw_input", `%${search}%`);

  const { data, error, count } = await query;

  if (error) {
    console.error("listAdminNicheResolutions failed:", { code: error.code, message: error.message });
    return { items: [], total: 0, error: "failed_to_list_niche_resolutions" };
  }

  return {
    items: await mapNicheResolutionRows((data as any[]) ?? []),
    total: count ?? 0,
    error: null,
  };
}

export async function getAdminNicheResolutionDetail(accountId: string): Promise<AdminNicheResolutionDetail | null> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("account_niche_resolutions")
    .select("account_id,raw_input,selected_taxon_id,ai_suggested_taxon_id,confidence,needs_admin_review,ai_needs_admin_review,resolution_status,match_source,score,ai_status,ai_ux_mode,reason,ai_reason,ai_error_code,ai_model,ai_suggested_new_taxon_label,updated_at,created_at")
    .eq("account_id", accountId)
    .maybeSingle();

  if (error || !data) return null;

  const [mapped] = await mapNicheResolutionRows([data]);

  return {
    ...mapped,
    reason: (data as any).reason ?? "",
    aiReason: (data as any).ai_reason ?? null,
    aiErrorCode: (data as any).ai_error_code ?? null,
    aiModel: (data as any).ai_model ?? null,
    aiSuggestedNewTaxonLabel: (data as any).ai_suggested_new_taxon_label ?? null,
  };
}

async function mapNicheResolutionRows(rows: any[]): Promise<AdminNicheResolutionListItem[]> {
  const accountIds = Array.from(new Set(rows.map((row) => row.account_id).filter(Boolean)));
  const taxonIds = Array.from(new Set(rows.flatMap((row) => [row.selected_taxon_id, row.ai_suggested_taxon_id]).filter(Boolean)));
  const [accounts, taxons] = await Promise.all([getAdminAccountsByIds(accountIds), getAdminTaxonsByIds(taxonIds)]);

  return rows.map((row) => {
    const selectedTaxon = row.selected_taxon_id ? taxons.get(row.selected_taxon_id) : null;
    const aiSuggestedTaxon = row.ai_suggested_taxon_id ? taxons.get(row.ai_suggested_taxon_id) : null;

    return {
      accountId: row.account_id,
      accountName: accounts.get(row.account_id)?.name ?? null,
      rawInput: row.raw_input ?? "",
      selectedTaxonId: row.selected_taxon_id ?? null,
      selectedTaxonName: selectedTaxon?.name ?? null,
      aiSuggestedTaxonId: row.ai_suggested_taxon_id ?? null,
      aiSuggestedTaxonName: aiSuggestedTaxon?.name ?? null,
      confidence: row.confidence ?? "",
      needsAdminReview: Boolean(row.needs_admin_review),
      aiNeedsAdminReview: row.ai_needs_admin_review ?? null,
      resolutionStatus: row.resolution_status ?? "",
      matchSource: row.match_source ?? null,
      score: typeof row.score === "number" ? row.score : row.score === null ? null : Number(row.score),
      aiStatus: row.ai_status ?? null,
      aiUxMode: row.ai_ux_mode ?? null,
      updatedAt: row.updated_at ?? null,
      createdAt: row.created_at ?? null,
    };
  });
}
