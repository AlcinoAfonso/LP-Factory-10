import "server-only";

import { createServiceClient } from "@/lib/supabase/service";
import {
  ADMIN_PAGE_SIZE,
  cleanAdminSearch,
  getAdminTaxonsByIds,
  isAdminAccountStatus,
  mapAdminAccount,
} from "./adminReadOnlyHelpers";
import { getAdminNicheResolutionDetail } from "./adminNicheResolutionsAdapter";
import type { AdminAccountDetail, AdminAccountListItem, AdminFilters, AdminListResult } from "./adminReadOnlyTypes";

export async function listAdminAccounts(filters: AdminFilters = {}): Promise<AdminListResult<AdminAccountListItem>> {
  const supabase = createServiceClient();
  const search = cleanAdminSearch(filters.search);

  let query: any = supabase
    .from("accounts")
    .select("id,name,subdomain,domain,status,created_at,setup_completed_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .limit(ADMIN_PAGE_SIZE);

  if (isAdminAccountStatus(filters.status)) query = query.eq("status", filters.status);
  if (search) query = query.or(`name.ilike.%${search}%,subdomain.ilike.%${search}%,domain.ilike.%${search}%`);

  const { data, error, count } = await query;

  if (error) {
    console.error("listAdminAccounts failed:", { code: error.code, message: error.message });
    return { items: [], total: 0, error: "failed_to_list_accounts" };
  }

  return { items: ((data as any[]) ?? []).map(mapAdminAccount), total: count ?? 0, error: null };
}

export async function getAdminAccountDetail(accountId: string): Promise<AdminAccountDetail | null> {
  const supabase = createServiceClient();
  const { data: accountRow, error: accountError } = await supabase
    .from("accounts")
    .select("id,name,subdomain,domain,status,created_at,setup_completed_at")
    .eq("id", accountId)
    .maybeSingle();

  if (accountError || !accountRow) return null;

  const [{ data: profileRow }, { data: memberRows }, { data: taxonomyRows }, nicheResolution] = await Promise.all([
    supabase.from("account_profiles").select("niche,preferred_channel,whatsapp,site_url").eq("account_id", accountId).maybeSingle(),
    supabase.from("account_users").select("id,user_id,role,status,created_at").eq("account_id", accountId).order("created_at", { ascending: true }).limit(100),
    supabase.from("account_taxonomy").select("taxon_id,is_primary,status,source_type").eq("account_id", accountId).order("is_primary", { ascending: false }),
    getAdminNicheResolutionDetail(accountId),
  ]);

  const taxonIds = ((taxonomyRows as any[]) ?? []).map((row) => row.taxon_id).filter(Boolean);
  const [taxons, memberEmails] = await Promise.all([
    getAdminTaxonsByIds(taxonIds),
    getMemberEmails(((memberRows as any[]) ?? []).map((row) => row.user_id).filter(Boolean)),
  ]);

  return {
    ...mapAdminAccount(accountRow),
    profile: profileRow
      ? {
          niche: (profileRow as any).niche ?? null,
          preferredChannel: (profileRow as any).preferred_channel ?? null,
          whatsapp: (profileRow as any).whatsapp ?? null,
          siteUrl: (profileRow as any).site_url ?? null,
        }
      : null,
    members: ((memberRows as any[]) ?? []).map((row) => ({
      id: row.id,
      userId: row.user_id ?? null,
      email: row.user_id ? memberEmails.get(row.user_id) ?? null : null,
      role: row.role ?? null,
      status: row.status ?? null,
      createdAt: row.created_at ?? null,
    })),
    taxonomy: ((taxonomyRows as any[]) ?? []).map((row) => {
      const taxon = taxons.get(row.taxon_id);
      return {
        taxonId: row.taxon_id,
        name: taxon?.name ?? "Taxon nao encontrado",
        slug: taxon?.slug ?? "",
        level: taxon?.level ?? "niche",
        isPrimary: Boolean(row.is_primary),
        status: row.status ?? "active",
        sourceType: row.source_type ?? "manual",
      };
    }),
    nicheResolution,
  };
}

async function getMemberEmails(userIds: string[]) {
  const supabase = createServiceClient();
  const emails = new Map<string, string>();

  await Promise.all(
    Array.from(new Set(userIds)).map(async (userId) => {
      const { data, error } = await supabase.auth.admin.getUserById(userId);
      if (!error && data.user?.email) emails.set(userId, data.user.email);
    }),
  );

  return emails;
}
