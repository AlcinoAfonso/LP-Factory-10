// src/lib/access/resolvePostConfirmDestination.ts
import type { SupabaseClient } from "@supabase/supabase-js";

// PPS 4.1.5 — rotas canônicas internas permitidas
const ALLOW_PREFIX = ["/a", "/onboarding", "/auth/error"] as const;

// Billing bloqueado (strings conforme Acesso 10.1)
const BLOCKED_BILLING = ["canceled", "incomplete_expired", "past_due_hard"] as const;

export function sanitizeNext(raw?: string | null) {
  if (!raw) return null;
  try {
    const u = new URL(raw, "http://x"); // base dummy
    // normaliza barra final e preserva query/hash
    const normPath = (u.pathname.replace(/\/+$/, "") || "/");
    const path = normPath + (u.search || "") + (u.hash || "");
    return ALLOW_PREFIX.some((p) => path === p || path.startsWith(p)) ? path : null;
  } catch {
    return null;
  }
}

// Tipos do join (aceitando objeto ou array, conforme retorno do PostgREST)
type AccountJoin =
  | { slug: string; status?: "active" | "disabled"; billing_status?: string }
  | null;

type AccountJoinMany = AccountJoin | AccountJoin[] | null;

type Row = {
  role: "owner" | "admin" | "editor" | "viewer";
  status: "active" | "pending" | "revoked";
  accounts: AccountJoinMany;
};

/**
 * Decide destino pós-confirm (signup/email change) usando a sessão corrente.
 * PPS 7: 0→/onboarding, 1→/a/[slug], N→/a
 * Acesso 10.1: vínculo status=active, conta ativa e billing não bloqueada.
 */
export async function resolvePostConfirmDestination(
  supa: SupabaseClient,
  nextParam?: string | null
) {
  // 0) next whitelisted tem prioridade
  const safeNext = sanitizeNext(nextParam);
  if (safeNext) return safeNext;

  // 1) sessão
  const { data: userData } = await supa.auth.getUser();
  if (!userData?.user) return "/a";

  // 2) contas do usuário (join explícito)
  const { data, error } = await supa
    .from("account_users")
    .select("role,status, accounts!inner ( slug, status, billing_status )")
    .eq("user_id", userData.user.id);

  if (error || !data) {
    console.log({
      event: "resolvePostConfirmDestination",
      status: "error",
      reason: error?.message ?? "no-data",
      timestamp: Date.now(),
      route: "helper",
    });
    return "/a";
  }

  // normaliza `accounts` para array e aplica filtros de Acesso 10.1
  const validSlugs = (data as Row[]).flatMap((r) => {
    if (r.status !== "active") return [];
    const accs = r.accounts
      ? Array.isArray(r.accounts)
        ? r.accounts
        : [r.accounts]
      : [];
    return accs
      .filter((acc): acc is NonNullable<AccountJoin> => !!acc && !!acc.slug)
      .filter((acc) => !acc.status || acc.status === "active")
      .filter((acc) => !BLOCKED_BILLING.includes((acc.billing_status || "") as any))
      .map((acc) => acc.slug);
  });

  if (validSlugs.length === 0) return "/onboarding";
  if (validSlugs.length === 1) return `/a/${validSlugs[0]}`;
  return "/a";
}
