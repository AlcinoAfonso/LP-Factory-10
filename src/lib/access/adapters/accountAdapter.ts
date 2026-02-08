import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service"; // ✅ server-only para mutações (relativo estável)
import type { AccountStatus, MemberStatus, MemberRole } from "@/lib/types/status";

/** Tipos de linha do DB */
export type DBAccountRow = {
  id: string;
  name: string;
  subdomain: string;
  domain: string | null;
  status: string;

  /** E10.4.1 infra */
  setup_completed_at?: string | null;
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

  /** E10.4.1 infra: marcador (NULL vs NOT NULL) */
  setupCompletedAt?: string | null;
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
  setupCompletedAt: r.setup_completed_at ?? null,
});

export const mapMemberFromDB = (r: DBMemberRow): MemberInfo => ({
  id: r.id,
  accountId: r.account_id,
  userId: r.user_id,
  role: normalizeRole(r.role),
  status: normalizeMemberStatus(r.status),
  permissions: r.permissions ?? undefined,
});

/**
 * E10.4.1 infra — Seta accounts.setup_completed_at quando chamado.
 * Preferência: idempotente (só seta quando NULL).
 * Não define evento de negócio; apenas fornece o método.
 */
export async function setSetupCompletedAtIfNull(accountId: string): Promise<boolean> {
  const supabase = createServiceClient();

  let q: any = supabase
    .from("accounts")
    .update({ setup_completed_at: new Date().toISOString() })
    .eq("id", accountId)
    .is("setup_completed_at", null);

  // v12-safe: só aplica no v13+
  if (typeof q?.maxAffected === "function") q = q.maxAffected(1);

  const { error } = await q;

  if (error) {
    // eslint-disable-next-line no-console
    console.error("setSetupCompletedAtIfNull failed:", {
      code: (error as any)?.code,
      message: (error as any)?.message ?? String(error),
      account_id: accountId,
    });
    return false;
  }

  return true;
}

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
  let q1: any = supabase
    .from("accounts")
    .update({
      name: name.trim(),
      subdomain: slug.toLowerCase().trim(),
      status: "active",
      // updated_at por trigger
    })
    .eq("id", accountId);

  // v12-safe: só aplica no v13+
  if (typeof q1?.maxAffected === "function") q1 = q1.maxAffected(1);

  const { error } = await q1;

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

  let q2: any = supabase
    .from("accounts")
    .update({
      name: name.trim(),
      subdomain: slug.toLowerCase().trim(),
      // status inalterado deliberadamente
    })
    .eq("id", accountId);

  if (typeof q2?.maxAffected === "function") q2 = q2.maxAffected(1);

  const { error } = await q2;

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

/**
 * E10.4.6 — Atualiza apenas accounts.name (core).
 * NÃO altera subdomain nem status.
 */
export async function updateAccountNameCore(
  accountId: string,
  name: string
): Promise<boolean> {
  const supabase = createServiceClient(); // server-only

  let q: any = supabase
    .from("accounts")
    .update({
      name: name.trim(),
      // updated_at por trigger
    })
    .eq("id", accountId);

  if (typeof q?.maxAffected === "function") q = q.maxAffected(1);

  const { error } = await q;

  if (error) {
    // eslint-disable-next-line no-console
    console.error("updateAccountNameCore failed:", {
      code: (error as any)?.code,
      message: (error as any)?.message ?? String(error),
      account_id: accountId,
    });
    return false;
  }

  return true;
}

/** Leitura: uma account por subdomain (via RLS) */
export async function getAccountBySubdomain(
  subdomain: string
): Promise<AccountInfo | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("accounts")
    .select("id,name,subdomain,domain,status,setup_completed_at")
    .eq("subdomain", subdomain)
    .maybeSingle();

  if (error || !data) return null;

  return mapAccountFromDB(data as any);
}

/** Leitura: membership do usuário atual na account (via RLS) */
export async function getMyMembership(
  accountId: string
): Promise<MemberInfo | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.id) return null;

  const { data, error } = await supabase
    .from("account_users")
    .select("id,account_id,user_id,role,status,permissions")
    .eq("account_id", accountId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error || !data) return null;

  return mapMemberFromDB(data as any);
}
