// src/lib/access/resolvePostConfirmDestination.ts
import type { SupabaseClient } from "@supabase/supabase-js";

// PPS 4.1.5 — rotas canônicas internas
const ALLOW_PREFIX = ["/a", "/onboarding", "/auth/error"] as const;

export function sanitizeNext(raw?: string | null) {
  if (!raw) return null;
  try {
    const u = new URL(raw, "http://x");
    // normaliza barra final e preserva query/hash
    const normPath = u.pathname.replace(/\/+$/, "") || "/";
    const path = normPath + (u.search || "") + (u.hash || "");
    return ALLOW_PREFIX.some((p) => path === p || path.startsWith(p)) ? path : null;
  } catch {
    return null;
  }
}

// Tipos explícitos do join (ajuste nomes conforme seu schema)
type AccountJoin = {
  role: "owner" | "admin" | "editor" | "viewer";
  status: "active" | "pending" | "revoked";
  accounts: { slug: string; status?: "active" | "disabled"; billing_status?: string } | null;
};

/**
 * Decide destino pós-confirm (signup/email change) usando a sessão corrente.
 * Regras PPS 7: 0→/onboarding, 1→/a/[slug], N→/a
 * Restrições 10.1: vínculo status=active, conta ativa e billing não bloqueada.
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

  if (error) {
    console.log({
      event: "resolvePostConfirmDestination",
      status: "error",
      reason: error.message,
      timestamp: Date.now(),
    });
    return "/a";
  }

  const validSlugs = (data as AccountJoin[]).filter((r) => {
    const acc = r.accounts;
    if (!acc?.slug) return false;
    // vínculo ativo
    if (r.status !== "active") return false;
    // conta ativa
    if (acc.status && acc.status !== "active") return false;
    // billing não bloqueado (exemplos de bloqueio; ajuste conforme seu domínio)
    const blockedBilling = ["canceled", "incomplete_expired", "past_due_hard"].includes(
      acc.billing_status || ""
    );
    if (blockedBilling) return false;
    return true;
  }).map((r) => r.accounts!.slug);

  if (validSlugs.length === 0) return "/onboarding";
  if (validSlugs.length === 1) return `/a/${validSlugs[0]}`;
  return "/a";
}
