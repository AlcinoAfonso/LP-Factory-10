// src/lib/access/adapters/accountAdapter.ts
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "../../supabase/service"; // ✅ server-only para mutações (relativo estável)
import type { AccountStatus, MemberStatus, MemberRole } from "@/lib/types/status";

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

/** Tipos de domínio (mapeados do DB) */
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
  role: MemberRole;
  status: MemberStatus;
  permissions?: Record<string, unknown>;
};

/** Normalização */
const ROLES = ["owner", "admin", "editor", "viewer"] as const;
const MSTAT = ["pending", "active", "inactive", "revoked"] as const;
// ⚠️ Tipos canônicos atuais não incluem 'trial'
const ASTAT = ["active", "inactive", "suspended", "pending_setup"] as const;

export const normalizeRole = (s?: string): MemberRole => {
  const v = (s ?? "").toLowerCase().trim();
  return (ROLES as readonly string[]).includes(v) ? (v as MemberRole) : "viewer";
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

/** Opcional: buscar account por slug/subdomain (pode falhar por RLS) */
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

/* ===========================================================
 * NOVO — Lista de contas para o AccountSwitcher (v_user_accounts_list)
 * ===========================================================
 */

export type UserAccountListItem = {
  accountId: string;
  accountName: string;
  accountSubdomain: string;
  accountStatus: AccountStatus;
  memberRole: MemberRole;
  memberStatus: MemberStatus;
  createdAt?: string;
};

type VUserAccountsListRow = {
  account_id: string;
  account_name: string | null;
  account_subdomain: string;
  account_status: string;
  member_role: string;
  member_status: string;
  created_at?: string | null;
};

const mapUserAccountListRow = (r: VUserAccountsListRow): UserAccountListItem => ({
  accountId: r.account_id,
  accountName: (r.account_name ?? r.account_subdomain) as string,
  accountSubdomain: r.account_subdomain,
  accountStatus: normalizeAccountStatus(r.account_status),
  memberRole: normalizeRole(r.member_role),
  memberStatus: normalizeMemberStatus(r.member_status),
  createdAt: r.created_at ?? undefined,
});

/** Lista contas visíveis ao usuário autenticado (RLS via view) */
export async function listUserAccounts(): Promise<UserAccountListItem[]> {
  const supabase = await createClient(); // ✅ client do usuário (RLS aplicada)
  const { data, error } = await supabase
    .from("v_user_accounts_list")
    .select(
      "account_id, account_name, account_subdomain, account_status, member_role, member_status, created_at"
    )
    .order("account_name", { ascending: true, nullsFirst: true })
    .order("created_at", { ascending: true });

  if (error) {
    // eslint-disable-next-line no-console
    console.error("listUserAccounts failed:", {
      code: (error as any)?.code,
      message: (error as any)?.message ?? String(error),
    });
    return [];
  }

  const rows = (data as VUserAccountsListRow[]) ?? [];
  return rows.map(mapUserAccountListRow);
}

/* ===========================================================
 * E7 - Conta Consultiva
 * ===========================================================
 */

/** Cria conta a partir de token (delega para RPC) — caminho authenticated */
export async function createFromToken(
  tokenId: string,
  actorId: string
): Promise<string | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_account_with_owner", {
    p_token_id: tokenId,
    p_actor_id: actorId,
  });

  if (error) {
    // eslint-disable-next-line no-console
    console.error("createFromToken failed:", {
      code: (error as any)?.code,
      message: (error as any)?.message ?? String(error),
    });
    return null;
  }

  return data as string;
}

/** Cria conta via server-only (service_role) — caminho seguro por flag */
export async function createFromTokenAsService(
  tokenId: string,
  actorId: string
): Promise<string | null> {
  const supabase = createServiceClient();
  const { data, error } = await supabase.rpc("create_account_with_owner", {
    p_token_id: tokenId,
    p_actor_id: actorId,
  });

  if (error) {
    // eslint-disable-next-line no-console
    console.error("createFromTokenAsService failed:", {
      code: (error as any)?.code,
      message: (error as any)?.message ?? String(error),
    });
    return null;
  }

  return data as string;
}

/** Renomeia conta e ativa (pending_setup → active) */
export async function renameAndActivate(
  accountId: string,
  name: string,
  slug: string
): Promise<boolean> {
  const supabase = createServiceClient(); // ✅ mutação via service_role

  // Atenção: a coluna é subdomain (não "slug")
  const { error } = await supabase
    .from("accounts")
    .update({
      name: name.trim(),
      subdomain: slug.toLowerCase().trim(),
      status: "active",
      // updated_at por trigger
    })
    .eq("id", accountId);

  if (error) {
    // 23505 = unique_violation (slug/subdomain duplicado)
    // eslint-disable-next-line no-console
    console.error("renameAndActivate failed:", {
      code: (error as any)?.code,
      message: (error as any)?.message ?? String(error),
    });
    return false;
  }

  return true;
}

/** ✅ E7.2 seguro: Renomeia conta/slug SEM alterar o status */
export async function renameAccountNoStatus(
  accountId: string,
  name: string,
  slug: string
): Promise<boolean> {
  const supabase = createServiceClient(); // server-only
  const { error } = await supabase
    .from("accounts")
    .update({
      name: name.trim(),
      subdomain: slug.toLowerCase().trim(),
      // status inalterado deliberadamente
    })
    .eq("id", accountId);

  if (error) {
    // eslint-disable-next-line no-console
    console.error("renameAccountNoStatus failed:", {
      code: (error as any)?.code,
      message: (error as any)?.message ?? String(error),
    });
    return false;
  }

  return true;
}
