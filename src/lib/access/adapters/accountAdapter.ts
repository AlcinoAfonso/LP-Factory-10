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

function normalizeRole(input: string): MemberRole {
  const v = input?.toLowerCase()?.trim();
  if ((ROLES as readonly string[]).includes(v)) return v as MemberRole;
  return "viewer";
}

function normalizeMemberStatus(input: string): MemberStatus {
  const v = input?.toLowerCase()?.trim();
  if ((MSTAT as readonly string[]).includes(v)) return v as MemberStatus;
  return "inactive";
}

function normalizeAccountStatus(input: string): AccountStatus {
  const v = input?.toLowerCase()?.trim();
  if ((ASTAT as readonly string[]).includes(v)) return v as AccountStatus;
  return "inactive";
}

/** Leitura: uma account por subdomain (via RLS) */
export async function getAccountBySubdomain(
  subdomain: string
): Promise<AccountInfo | null> {
  const supabase = await createClient(); // server (com sessão)

  const { data, error } = await supabase
    .from("accounts")
    .select("id,name,subdomain,domain,status,setup_completed_at")
    .eq("subdomain", subdomain)
    .maybeSingle();

  if (error || !data) return null;

  return {
    id: data.id,
    name: data.name,
    subdomain: data.subdomain,
    domain: data.domain ?? undefined,
    status: normalizeAccountStatus(data.status),
    setupCompletedAt: data.setup_completed_at ?? null,
  };
}

/** Leitura: membership do usuário atual na account (via RLS) */
export async function getMyMembership(
  accountId: string
): Promise<MemberInfo | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("account_users")
    .select("id,account_id,user_id,role,status,permissions")
    .eq("account_id", accountId)
    .eq("user_id", (await supabase.auth.getUser()).data.user?.id ?? "")
    .maybeSingle();

  if (error || !data) return null;

  return {
    id: data.id,
    accountId: data.account_id,
    userId: data.user_id,
    role: normalizeRole(data.role),
    status: normalizeMemberStatus(data.status),
    permissions: (data.permissions ?? undefined) as any,
  };
}

/**
 * E10.4.2 — Setter NULL-only do marcador de setup concluído
 * - deve ser idempotente (não sobrescrever)
 */
export async function setSetupCompletedAtIfNull(
  accountId: string
): Promise<boolean> {
  const supabase = createServiceClient(); // server-only (mutação)

  // Padrão: update apenas quando NULL
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

/**
 * E8 (legado) — Renomear conta SEM alterar status
 * - Atualiza name + subdomain
 * - Não mexe em status
 */
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
