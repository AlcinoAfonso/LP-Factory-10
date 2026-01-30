// src/lib/access/adapters/accessContextAdapter.ts
// Fonte única de leitura do Access Context (E8).
// Decide via super view v2.
// B1-Fase1: quando houver membership mas allow=false, retorna contexto "bloqueado"
// (para o SSR encaminhar UX por status). Continua fail-closed para:
// - conta inexistente
// - usuário sem membership na conta
// - dados incompletos na view
// Log padronizado: access_context_decision (MRVG 1.5 D/F).

import "server-only";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import type { AccountStatus, MemberStatus, MemberRole } from "../../types/status";

export type AccessAccount = {
  id: string;
  subdomain: string;
  name?: string;
  status: AccountStatus;

  /** E10.4.1 infra: marcador para subestados dentro de pending_setup (NULL vs NOT NULL) */
  setupCompletedAt?: string | null;
};

export type AccessMember = {
  user_id: string;
  account_id: string;
  role: MemberRole;
  status: MemberStatus;
};

export type AccessContext = {
  account: AccessAccount;
  member: AccessMember;
  // Campos de decisão (SSR/UI podem usar para UX por status)
  allow: boolean;
  reason: RowV2["reason"] | null;
};

type RowV2 = {
  account_id: string;
  account_key: string; // subdomain
  account_name?: string | null;
  account_status: string;
  account_setup_completed_at?: string | null;

  user_id: string | null;
  member_role: string | null;
  member_status: string | null;

  // view foi hardenada para boolean, mas mantemos compat
  allow: boolean | null;

  reason: string | null; // 'account_blocked' | 'member_inactive' | 'no_membership' | null
};

type LogInput = {
  decision: "allow" | "deny" | "null";
  reason?:
    | "ok"
    | "account_blocked"
    | "member_inactive"
    | "no_membership"
    | "no_membership_or_invalid_account"
    | "denied_by_view"
    | `adapter_error_${string}`
    | string
    | null;
  user_id?: string | null;
  account_id?: string | null;
  role?: string | null;
  route?: string | null;
  request_id?: string | null;
  latency_ms?: number | null;
  source?: "view_v2" | "view_v1" | "adapter_error";
};

async function logDecision(input: LogInput) {
  try {
    const h = await headers();
    const payload = {
      event: "access_context_decision",
      source: input.source ?? "view_v2",
      decision: input.decision,
      reason: input.reason ?? null,
      user_id: input.user_id ?? null,
      account_id: input.account_id ?? null,
      role: input.role ?? null,
      route: input.route ?? h.get("x-invoke-path") ?? null,
      request_id: input.request_id ?? h.get("x-request-id") ?? null,
      latency_ms: input.latency_ms ?? null,
      ts: new Date().toISOString(),
    };
    // eslint-disable-next-line no-console
    console.log(JSON.stringify(payload));
  } catch {
    /* ignore logging errors */
  }
}

export async function readAccessContext(subdomain: string): Promise<AccessContext | null> {
  const t0 = Date.now();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("v_access_context_v2")
    .select(
      [
        "account_id",
        "account_key",
        "account_name",
        "account_status",
        "account_setup_completed_at",
        "user_id",
        "member_role",
        "member_status",
        "allow",
        "reason",
      ].join(",")
    )
    .eq("account_key", subdomain)
    .limit(1)
    .maybeSingle();

  if (error) {
    await logDecision({
      decision: "null",
      reason: "adapter_error_read_v2",
      source: "adapter_error",
      latency_ms: Date.now() - t0,
    });
    return null;
  }

  if (!data) {
    await logDecision({
      decision: "deny",
      reason: "no_membership_or_invalid_account",
      latency_ms: Date.now() - t0,
    });
    return null;
  }

  const row = data as unknown as RowV2;

  // Se a view negou, pode ser por:
  // - membership bloqueado (pending/inactive/revoked)
  // - conta bloqueada (status não permitido)
  // - sem membership / conta inválida (tratamos como null)
  if (!row.allow) {
    await logDecision({
      user_id: row.user_id ?? null,
      account_id: row.account_id ?? null,
      role: row.member_role ?? null,
      decision: "deny",
      reason: (row.reason as LogInput["reason"]) ?? "denied_by_view",
      latency_ms: Date.now() - t0,
    });

    const hasMembership = !!row.user_id && !!row.member_status;
    const isMemberBlocked = row.reason === "member_inactive" && hasMembership;
    const isAccountBlocked = row.reason === "account_blocked" && hasMembership;

    // Fail-closed: se não temos membership claro, devolve null (vai para /auth/confirm/info)
    if (!isMemberBlocked && !isAccountBlocked) {
      return null;
    }

    // Retorna contexto bloqueado (SSR decide qual tela mostrar)
    const blockedCtx: AccessContext = {
      account: {
        id: row.account_id,
        subdomain: row.account_key,
        name: row.account_name || row.account_key,
        status: row.account_status as AccountStatus,
        setupCompletedAt: row.account_setup_completed_at ?? null,
      },
      member: {
        user_id: row.user_id as string,
        account_id: row.account_id,
        role: (row.member_role ?? "viewer") as MemberRole,
        status: (row.member_status ?? "inactive") as MemberStatus,
      },
      allow: false,
      reason: row.reason,
    };

    return blockedCtx;
  }

  const ctx: AccessContext = {
    account: {
      id: row.account_id,
      subdomain: row.account_key,
      name: row.account_name || row.account_key,
      status: row.account_status as AccountStatus,
      setupCompletedAt: row.account_setup_completed_at ?? null,
    },
    member: {
      user_id: row.user_id as string,
      account_id: row.account_id,
      role: (row.member_role ?? "viewer") as MemberRole,
      status: (row.member_status ?? "active") as MemberStatus,
    },
    allow: true,
    reason: row.reason,
  };

  await logDecision({
    user_id: row.user_id,
    account_id: row.account_id,
    role: row.member_role,
    decision: "allow",
    reason: "ok",
    latency_ms: Date.now() - t0,
  });

  return ctx;
}

type EnsureFirstAccountRow = {
  account_id: string;
  account_key: string;
};

async function ensureFirstAccountForCurrentUserRpc(
  supabase: any,
  userId: string,
  startedAt: number
): Promise<EnsureFirstAccountRow | null> {
  const { data, error } = await supabase.rpc("ensure_first_account_for_current_user");

  if (error) {
    await logDecision({
      decision: "null",
      reason: "adapter_error_ensure_first_account",
      source: "adapter_error",
      user_id: userId,
      latency_ms: Date.now() - startedAt,
    });
    return null;
  }

  const row = (Array.isArray(data) ? data[0] : data) as any;
  if (!row?.account_key || !row?.account_id) return null;

  return { account_id: String(row.account_id), account_key: String(row.account_key) };
}

/**
 * Retorna subdomain da primeira conta ativa do usuário autenticado.
 * Usado para redirect em /a/home (C0.2).
 * Server-only. Fail-closed (erro ou sem conta → null).
 *
 * F2: se não houver vínculo (account_users), tenta auto-criar 1ª conta (pending_setup) + owner/active via RPC.
 * Importante: NÃO cria conta se já existir qualquer vínculo (mesmo bloqueado/pending/inactive).
 */
export async function getFirstAccountForCurrentUser(): Promise<string | null> {
  const t0 = Date.now();
  const supabase = await createClient();

  // 1) Obter user_id da sessão (interno, não exposto à UI)
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    await logDecision({
      decision: "null",
      reason: "adapter_error_auth",
      source: "adapter_error",
      latency_ms: Date.now() - t0,
    });
    return null;
  }

  // 2) Preferência: primeira conta liberada (allow=true) pela v_access_context_v2
  const { data: allowedRow, error: allowedErr } = await supabase
    .from("v_access_context_v2")
    .select("account_key, account_id")
    .eq("user_id", user.id)
    .eq("allow", true)
    .order("account_key", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (allowedErr) {
    await logDecision({
      decision: "null",
      reason: "adapter_error_read_first_account",
      source: "adapter_error",
      user_id: user.id,
      latency_ms: Date.now() - t0,
    });
    return null;
  }

  if (allowedRow) {
    await logDecision({
      decision: "allow",
      reason: "ok",
      user_id: user.id,
      account_id: (allowedRow as any).account_id ?? null,
      latency_ms: Date.now() - t0,
    });
    return (allowedRow as any).account_key as string;
  }

  // 3) Se existe QUALQUER vínculo (mesmo bloqueado), não cria conta (fora do escopo do F2)
  const { data: anyMembership, error: memErr } = await supabase
    .from("account_users")
    .select("account_id, status, role, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (memErr) {
    await logDecision({
      decision: "null",
      reason: "adapter_error_read_membership",
      source: "adapter_error",
      user_id: user.id,
      latency_ms: Date.now() - t0,
    });
    return null;
  }

  if (anyMembership) {
    await logDecision({
      decision: "deny",
      reason: "denied_by_view",
      user_id: user.id,
      account_id: (anyMembership as any).account_id ?? null,
      role: (anyMembership as any).role ?? null,
      latency_ms: Date.now() - t0,
    });
    return null;
  }

  // 4) Sem vínculo: F2 cria 1ª conta + vínculo via RPC (quando existir no BD)
  await logDecision({
    decision: "deny",
    reason: "no_membership",
    user_id: user.id,
    latency_ms: Date.now() - t0,
  });

  const ensured = await ensureFirstAccountForCurrentUserRpc(supabase, user.id, t0);
  if (!ensured) return null;

  await logDecision({
    decision: "allow",
    reason: "ok",
    user_id: user.id,
    account_id: ensured.account_id,
    latency_ms: Date.now() - t0,
  });

  return ensured.account_key;
}
