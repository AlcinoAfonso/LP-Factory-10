import "server-only";

import { createServiceClient } from "@/lib/supabase/service";
import type { AccountStatus } from "@/lib/types/status";
import type { AdminAccountListItem, AdminTaxonListItem } from "./adminReadOnlyTypes";

const ACCOUNT_STATUSES = ["active", "inactive", "suspended", "pending_setup"] as const;
const TAXON_LEVELS = ["segment", "niche", "ultra_niche"] as const;
const CONFIDENCE_LEVELS = ["high", "medium", "low"] as const;

export const ADMIN_PAGE_SIZE = 50;

export function cleanAdminSearch(value?: string) {
  const cleaned = (value ?? "").replace(/[%,()]/g, " ").replace(/\s+/g, " ").trim();
  return cleaned.length >= 2 ? cleaned : "";
}

export function isAdminAccountStatus(value?: string): value is AccountStatus {
  return ACCOUNT_STATUSES.includes(value as AccountStatus);
}

export function normalizeAdminAccountStatus(value?: string | null): AccountStatus {
  return isAdminAccountStatus(value ?? undefined) ? (value as AccountStatus) : "active";
}

export function isAdminTaxonLevel(value?: string) {
  return TAXON_LEVELS.includes(value as (typeof TAXON_LEVELS)[number]);
}

export function isAdminConfidence(value?: string) {
  return CONFIDENCE_LEVELS.includes(value as (typeof CONFIDENCE_LEVELS)[number]);
}

export function mapAdminAccount(row: any): AdminAccountListItem {
  return {
    id: row.id,
    name: row.name ?? row.subdomain ?? "Conta sem nome",
    subdomain: row.subdomain ?? null,
    domain: row.domain ?? null,
    status: normalizeAdminAccountStatus(row.status),
    createdAt: row.created_at ?? null,
    setupCompletedAt: row.setup_completed_at ?? null,
  };
}

export function mapAdminTaxon(
  row: any,
  parentNames: Map<string, string>,
  aliasCounts: Map<string, number>,
): AdminTaxonListItem {
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

export async function getAdminAccountsByIds(accountIds: string[]) {
  if (accountIds.length === 0) return new Map<string, AdminAccountListItem>();

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("accounts")
    .select("id,name,subdomain,domain,status,created_at,setup_completed_at")
    .in("id", accountIds);

  if (error) return new Map<string, AdminAccountListItem>();
  return new Map(((data as any[]) ?? []).map((row) => [row.id, mapAdminAccount(row)]));
}

export async function getAdminTaxonsByIds(taxonIds: string[]) {
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
