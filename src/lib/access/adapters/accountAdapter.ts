// src/lib/access/adapters/accountAdapter.ts

import { createClient } from "@/supabase/server";

/** Tipos de linha do DB */
export type DBAccountRow = {
  id: string;
  name: string;
  subdomain: string;
  domain: string | null;
  status: string;
};

export type DBMemberRow = {
  id: string;
  account_id: string;
  user_id: string;
  role: string;
  status: string;
  permissions?: Record<string, unknown> | null;
};

/** Tipos de domínio (legado do adapter) */
export type AccountStatus = "active" | "trial" | "suspended" | "canceled";
export type MemberStatus = "pending" | "active" | "inactive" | "revoked";
export type Role = "owner" | "admin" | "editor" | "viewer";

export type AccountInfo = {
  id: string;
  name: string;
  subdomain: string;
  domain?: string;
  status: AccountStatus;
};

export type MemberInfo = {
  id: string;
  accountId: string;
  userId: string;
  role: Role;
  status: MemberStatus;
  permissions?: Record<string, unknown>;
};

/** Normalização */
const ROLES = ["owner", "admin", "editor", "viewer"] as const;
const MSTAT = ["pending", "active", "inactive", "revoked"] as const;
const ASTAT = ["active", "trial", "suspended", "canceled"] as const;

export const normalizeRole = (s?: string): Role => {
  const v = (s ?? "").toLowerCase().trim();
  return (ROLES as readonly string[]).includes(v) ? (v as Role) : "viewer";
};

export const normalizeMemberStatus = (s?: string): MemberStatus => {
  const v = (s ?? "").toLowerCase().trim();
  return (MSTAT as readonly string[]).includes(v)
    ? (v as MemberStatus)
    : "active";
};

export const normalizeAccountStatus = (s?: string): AccountStatus => {
  const v = (s ?? "").toLowerCase().trim();
  return (ASTAT as readonly string[]).includes(v)
    ? (v as AccountStatus)
    : "active";
};

/** Utilitários */
export const pickAccount = (
  acc: DBAccountRow | DBAccountRow[] | null | undefined
) => (!acc ? null : Array.isArray(acc) ? acc[0] ?? null : acc);

export const mapAccountFromDB = (r: DBAccountRow): AccountInfo => ({
  id: r.id,
  name: r.name,
  subdomain: r.subdomain,
  domain: r.domain ?? undefined,
  status: normalizeAccountStatus(r.status),
});

export const mapMemberFromDB = (r: DBMemberRow): MemberInfo => ({
  id: r.id,
  accountId: r.account_id,
  userId: r.user_id,
  role: normalizeRole(r.role),
  status: normalizeMemberStatus(r.status),
  permissions: r.permissions ?? undefined,
});

/* ===========================================================
 * Leituras read-only (Adapters-only)
 * ===========================================================
 * Convenção: não lançar exceções — retornar [] / null em erro.
 */

/** Lê memberships do usuário (sem filtrar status) */
export async function getMembershipsByUser(
  userId: string
): Promise<DBMemberRow[]> {
  const supabase = await createClient();
  const { data /*, error*/ } = await supabase
    .from("account_users")
    .select("id, account_id, user_id, role, status, permissions")
    .eq("user_id", userId)
    .limit(50);

  return (data as DBMemberRow[]) ?? [];
}

/** Busca account por ID (colunas explícitas) */
export async function getAccountById(
  accountId: string
): Promise<DBAccountRow | null> {
  const supabase = await createClient();
  const { data /*, error*/ } = await supabase
    .from("accounts")
    .select("id, name, subdomain, domain, status")
    .eq("id", accountId)
    .maybeSingle();

  return (data as DBAccountRow) ?? null;
}

/** Opcional: buscar account por slug (pode falhar por RLS) */
export async function getAccountBySlug(
  slug: string
): Promise<DBAccountRow | null> {
  const supabase = await createClient();
  const { data /*, error*/ } = await supabase
    .from("accounts")
    .select("id, name, subdomain, domain, status")
    .eq("subdomain", slug)
    .maybeSingle();

  return (data as DBAccountRow) ?? null;
}
