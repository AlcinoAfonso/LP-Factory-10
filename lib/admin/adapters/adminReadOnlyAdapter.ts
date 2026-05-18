import "server-only";

import { createServiceClient } from "@/lib/supabase/service";
import type { AccountStatus } from "@/lib/types/status";

const ACCOUNT_STATUSES = ["active", "inactive", "suspended", "pending_setup"] as const;
const TAXON_LEVELS = ["segment", "niche", "ultra_niche"] as const;
const CONFIDENCE_LEVELS = ["high", "medium", "low"] as const;

const PAGE_SIZE = 50;

export type AdminAccountListItem = {
  id: string;
  name: string;
  subdomain: string | null;
  domain: string | null;
  status: AccountStatus;
  createdAt: string | null;
  setupCompletedAt: string | null;
};

export type AdminAccountDetail = AdminAccountListItem & {
  profile: {
    niche: string | null;
    preferredChannel: string | null;
    whatsapp: string | null;
    siteUrl: string | null;
  } | null;
  members: Array<{
    id: string;
    role: string | null;
    status: string | null;
    createdAt: string | null;
  }>;
  taxonomy: Array<{
    taxonId: string;
    name: string;
    slug: string;
    level: string;
    isPrimary: boolean;
    status: string;
    sourceType: string;
  }>;
  nicheResolution: AdminNicheResolutionListItem | null;
};

export type AdminTaxonListItem = {
  id: string;
  parentId: string | null;
  parentName: string | null;
  level: string;
  name: string;
  slug: string;
  isActive: boolean;
  aliasCount: number;
};

export type AdminTaxonDetail = AdminTaxonListItem & {
  aliases: Array<{
    id: string;
    aliasText: string;
    isActive: boolean;
  }>;
  children: AdminTaxonListItem[];
};

export type AdminNicheResolutionListItem = {
  accountId: string;
  accountName: string | null;
  rawInput: string;
  selectedTaxonId: string | null;
  selectedTaxonName: string | null;
  aiSuggestedTaxonId: string | null;
  aiSuggestedTaxonName: string | null;
  confidence: string;
  needsAdminReview: boolean;
  aiNeedsAdminReview: boolean | null;
  resolutionStatus: string;
  matchSource: string | null;
  score: number | null;
  aiStatus: string | null;
  aiUxMode: string | null;
  updatedAt: string | null;
  createdAt: string | null;
};

export type AdminNicheResolutionDetail = AdminNicheResolutionListItem & {
  reason: string;
  aiReason: string | null;
  aiErrorCode: string | null;
  aiModel: string | null;
  aiSuggestedNewTaxonLabel: string | null;
};

export type AdminListResult<T> = {
  items: T[];
  total: number;
  error: string | null;
};

type AdminFilters = {
  search?: string;
  status?: string;
  level?: string;
  confidence?: string;
  review?: string;
};

function cleanSearch(value?: string) {
  const cleaned = (value ?? "").replace(/[%,()]/g, " ").replace(/\s+/g, " ").trim();
  return cleaned.length >= 2 ? cleaned : "";
}

function isAccountStatus(value?: string): value is AccountStatus {
  return ACCOUNT_STATUSES.includes(value as AccountStatus);
}

function normalizeAccountStatus(value?: string | null): AccountStatus {
  return isAccountStatus(value ?? undefined) ? (value as AccountStatus) : "active";
}

function isTaxonLevel(value?: string) {
  return TAXON_LEVELS.includes(value as (typeof TAXON_LEVELS)[number]);
}

function isConfidence(value?: string) {
  return CONFIDENCE_LEVELS.includes(value as (typeof CONFIDENCE_LEVELS)[number]);
}

function mapAccount(row: any): AdminAccountListItem {
  return {
    id: row.id,
    name: row.name ?? row.subdomain ?? "Conta sem nome",
    subdomain: row.subdomain ?? null,
    domain: row.domain ?? null,
    status: normalizeAccountStatus(row.status),
    createdAt: row.created_at ?? null,
    setupCompletedAt: row.setup_completed_at ?? null,
  };
}

function mapTaxon(row: any, parentNames: Map<string, string>, aliasCounts: Map<string, number>): AdminTaxonListItem {
  return {
    id: row.id,
    parentId: row.parent_id ?? null,
    parentName: row.parent_id ? parentNames.get(row.parent_id) ?? null : null,
    level: row.level ?? "niche",
    name: row.name ?? "Taxon sem nome",
    slug: row.slug ?? "",
    isActive: Boolean(row.is_active),
    aliasCount: aliasCounts.get(row.id) ?? 0,
  };
}

async function getAccountsByIds(accountIds: string[]) {
  if (accountIds.length === 0) return new Map<string, AdminAccountListItem>();

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("accounts")
    .select("id,name,subdomain,domain,status,created_at,setup_completed_at")
    .in("id", accountIds);

  if (error) return new Map<string, AdminAccountListItem>();

  return new Map(((data as any[]) ?? []).map((row) => [row.id, mapAccount(row)]));
}

async function getTaxonsByIds(taxonIds: string[]) {
  if (taxonIds.length === 0) return new Map<string, { id: string; name: string; slug: string; level: string }>();

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("business_taxons")
    .select("id,name,slug,level")
    .in("id", taxonIds);

  if (error) return new Map<string, { id: string; name: string; slug: string; level: string }>();

  return new Map(
    ((data as any[]) ?? []).map((row) => [
      row.id,
      {
        id: row.id,
        name: row.name ?? "Taxon sem nome",
        slug: row.slug ?? "",
        level: row.level ?? "niche",
      },
    ]),
  );
}

export async function listAdminAccounts(filters: AdminFilters = {}): Promise<AdminListResult<AdminAccountListItem>> {
  const supabase = createServiceClient();
  const search = cleanSearch(filters.search);

  let query: any = supabase
    .from("accounts")
    .select("id,name,subdomain,domain,status,created_at,setup_completed_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .limit(PAGE_SIZE);

  if (isAccountStatus(filters.status)) {
    query = query.eq("status", filters.status);
  }

  if (search) {
    query = query.or(`name.ilike.%${search}%,subdomain.ilike.%${search}%,domain.ilike.%${search}%`);
  }

  const { data, error, count } = await query;

  if (error) {
    console.error("listAdminAccounts failed:", { code: error.code, message: error.message });
    return { items: [], total: 0, error: "failed_to_list_accounts" };
  }

  return {
    items: ((data as any[]) ?? []).map(mapAccount),
    total: count ?? 0,
    error: null,
  };
}

export async function getAdminAccountDetail(accountId: string): Promise<AdminAccountDetail | null> {
  const supabase = createServiceClient();

  const { data: accountRow, error: accountError } = await supabase
    .from("accounts")
    .select("id,name,subdomain,domain,status,created_at,setup_completed_at")
    .eq("id", accountId)
    .maybeSingle();

  if (accountError || !accountRow) return null;

  const [{ data: profileRow }, { data: memberRows }, { data: taxonomyRows }, nicheResolution] =
    await Promise.all([
      supabase
        .from("account_profiles")
        .select("niche,preferred_channel,whatsapp,site_url")
        .eq("account_id", accountId)
        .maybeSingle(),
      supabase
        .from("account_users")
        .select("id,role,status,created_at")
        .eq("account_id", accountId)
        .order("created_at", { ascending: true })
        .limit(100),
      supabase
        .from("account_taxonomy")
        .select("taxon_id,is_primary,status,source_type")
        .eq("account_id", accountId)
        .order("is_primary", { ascending: false }),
      getAdminNicheResolutionDetail(accountId),
    ]);

  const taxonIds = ((taxonomyRows as any[]) ?? []).map((row) => row.taxon_id).filter(Boolean);
  const taxons = await getTaxonsByIds(taxonIds);

  return {
    ...mapAccount(accountRow),
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

export async function listAdminTaxons(filters: AdminFilters = {}): Promise<AdminListResult<AdminTaxonListItem>> {
  const supabase = createServiceClient();
  const search = cleanSearch(filters.search);

  let query: any = supabase
    .from("business_taxons")
    .select("id,parent_id,level,name,slug,is_active", { count: "exact" })
    .order("level", { ascending: true })
    .order("name", { ascending: true })
    .limit(PAGE_SIZE);

  if (isTaxonLevel(filters.level)) {
    query = query.eq("level", filters.level);
  }

  if (filters.status === "active") query = query.eq("is_active", true);
  if (filters.status === "inactive") query = query.eq("is_active", false);

  if (search) {
    query = query.or(`name.ilike.%${search}%,slug.ilike.%${search}%`);
  }

  const { data, error, count } = await query;

  if (error) {
    console.error("listAdminTaxons failed:", { code: error.code, message: error.message });
    return { items: [], total: 0, error: "failed_to_list_taxons" };
  }

  const rows = (data as any[]) ?? [];
  const parentIds = Array.from(new Set(rows.map((row) => row.parent_id).filter(Boolean)));
  const ids = rows.map((row) => row.id);

  const [parentTaxons, aliases] = await Promise.all([
    getTaxonsByIds(parentIds),
    ids.length > 0
      ? supabase.from("business_taxon_aliases").select("taxon_id").in("taxon_id", ids)
      : Promise.resolve({ data: [] }),
  ]);

  const aliasCounts = new Map<string, number>();
  (((aliases.data as any[]) ?? [])).forEach((row) => {
    aliasCounts.set(row.taxon_id, (aliasCounts.get(row.taxon_id) ?? 0) + 1);
  });

  const parentNames = new Map(Array.from(parentTaxons.entries()).map(([id, row]) => [id, row.name]));

  return {
    items: rows.map((row) => mapTaxon(row, parentNames, aliasCounts)),
    total: count ?? 0,
    error: null,
  };
}

export async function getAdminTaxonDetail(taxonId: string): Promise<AdminTaxonDetail | null> {
  const supabase = createServiceClient();

  const { data: taxonRow, error } = await supabase
    .from("business_taxons")
    .select("id,parent_id,level,name,slug,is_active")
    .eq("id", taxonId)
    .maybeSingle();

  if (error || !taxonRow) return null;

  const [{ data: aliases }, { data: children }] = await Promise.all([
    supabase
      .from("business_taxon_aliases")
      .select("id,alias_text,is_active")
      .eq("taxon_id", taxonId)
      .order("alias_text", { ascending: true })
      .limit(100),
    supabase
      .from("business_taxons")
      .select("id,parent_id,level,name,slug,is_active")
      .eq("parent_id", taxonId)
      .order("name", { ascending: true })
      .limit(100),
  ]);

  const parentNames = await getTaxonsByIds(taxonRow.parent_id ? [taxonRow.parent_id] : []);
  const emptyAliasCounts = new Map<string, number>();
  const mappedTaxon = mapTaxon(taxonRow, new Map(Array.from(parentNames.entries()).map(([id, row]) => [id, row.name])), emptyAliasCounts);

  return {
    ...mappedTaxon,
    aliasCount: ((aliases as any[]) ?? []).length,
    aliases: ((aliases as any[]) ?? []).map((row) => ({
      id: row.id,
      aliasText: row.alias_text ?? "",
      isActive: Boolean(row.is_active),
    })),
    children: ((children as any[]) ?? []).map((row) => mapTaxon(row, new Map([[taxonId, mappedTaxon.name]]), emptyAliasCounts)),
  };
}

export async function listAdminNicheResolutions(
  filters: AdminFilters = {},
): Promise<AdminListResult<AdminNicheResolutionListItem>> {
  const supabase = createServiceClient();
  const search = cleanSearch(filters.search);

  let query: any = supabase
    .from("account_niche_resolutions")
    .select(
      "account_id,raw_input,selected_taxon_id,ai_suggested_taxon_id,confidence,needs_admin_review,ai_needs_admin_review,resolution_status,match_source,score,ai_status,ai_ux_mode,updated_at,created_at",
      { count: "exact" },
    )
    .order("updated_at", { ascending: false })
    .limit(PAGE_SIZE);

  if (filters.status) query = query.eq("resolution_status", filters.status);
  if (isConfidence(filters.confidence)) query = query.eq("confidence", filters.confidence);
  if (filters.review === "true") query = query.or("needs_admin_review.eq.true,ai_needs_admin_review.eq.true");
  if (search) query = query.ilike("raw_input", `%${search}%`);

  const { data, error, count } = await query;

  if (error) {
    console.error("listAdminNicheResolutions failed:", { code: error.code, message: error.message });
    return { items: [], total: 0, error: "failed_to_list_niche_resolutions" };
  }

  const rows = (data as any[]) ?? [];
  return {
    items: await mapNicheResolutionRows(rows),
    total: count ?? 0,
    error: null,
  };
}

export async function getAdminNicheResolutionDetail(accountId: string): Promise<AdminNicheResolutionDetail | null> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("account_niche_resolutions")
    .select(
      "account_id,raw_input,selected_taxon_id,ai_suggested_taxon_id,confidence,needs_admin_review,ai_needs_admin_review,resolution_status,match_source,score,ai_status,ai_ux_mode,reason,ai_reason,ai_error_code,ai_model,ai_suggested_new_taxon_label,updated_at,created_at",
    )
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
  const taxonIds = Array.from(
    new Set(
      rows
        .flatMap((row) => [row.selected_taxon_id, row.ai_suggested_taxon_id])
        .filter(Boolean),
    ),
  );

  const [accounts, taxons] = await Promise.all([getAccountsByIds(accountIds), getTaxonsByIds(taxonIds)]);

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
