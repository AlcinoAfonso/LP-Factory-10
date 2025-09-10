import { createClient } from "@/supabase/server";
import type * as Access from "./types";
import {
  mapAccountFromDB,
  mapMemberFromDB,
  type DBAccountRow,
  type DBMemberRow,
  getMembershipsByUser,
  getAccountById,
  getAccountBySlug,
} from "./adapters/accountAdapter";

type Chosen = {
  account: ReturnType<typeof mapAccountFromDB>;
  member: ReturnType<typeof mapMemberFromDB>;
};

// Log leve e estruturado (não lança erro)
function logAccess(outcome: string, extra: Record<string, unknown> = {}) {
  try {
    // eslint-disable-next-line no-console
    console.log(
      JSON.stringify({
        scope: "access_ctx",
        env: process.env.VERCEL_ENV ? "prod" : "dev",
        ...extra,
      })
    );
  } catch {
    /* noop */
  }
}

/**
 * getAccessContext — resolve vínculo do usuário com uma conta.
 * Estratégia E8:
 * 1) Auth
 * 2) Memberships (sem filtrar status)
 * 3) Bypass super_admin
 * 4) Conta por ID (evita choque de RLS); slug só quando necessário
 * 5) Bloqueios server-side (inactive/forbidden) sem 500
 */
export async function getAccessContext(input?: {
  accountId?: string;
  host?: string;
  pathname?: string;
  params?: { account?: string }; // slug
}): Promise<Access.AccessContext | null> {
  const t0 = Date.now();
  const supabase = await createClient();

  // 1) Auth
  const { data: userData } = await supabase.auth.getUser();
  const user = userData?.user;
  if (!user) {
    logAccess("no_user", { route: input?.pathname, ms: Date.now() - t0 });
    return null;
  }

  const slug = input?.params?.account?.trim().toLowerCase();
  if (slug === "home") {
    logAccess("home_route", { route: input?.pathname, ms: Date.now() - t0 });
    return null;
  }

  // 2) Memberships (sem JOIN com accounts; respeita RLS para ler inactive)
  let memberships: DBMemberRow[] = [];
  try {
    memberships = await getMembershipsByUser(user.id);
  } catch {
    logAccess("member_error", {
      route: input?.pathname,
      user_id: user.id,
      ms: Date.now() - t0,
    });
    return { blocked: true, error_code: "UNRESOLVED_TENANT" } as Access.AccessContext;
  }
  if (!memberships.length) {
    logAccess("member_not_found", {
      route: input?.pathname,
      user_id: user.id,
      ms: Date.now() - t0,
    });
    return null; // /a page cuida de redirecionar para onboarding
  }

  // 3) Bypass super_admin
  let isPlatformAdmin = false;
  try {
    const { data: rpc } = await supabase.rpc("is_platform_admin");
    isPlatformAdmin = !!rpc;
  } catch {
    // segue sem bypass
  }

  // 4) Escolher membership alvo
  let target: DBMemberRow | null = null;
  if (input?.accountId) {
    target = memberships.find((m) => m.account_id === input.accountId) ?? null;
  }

  let accRow: DBAccountRow | null = null;
  if (!target && slug) {
    // tentar por slug (pode retornar null por RLS; não quebra)
    accRow = await getAccountBySlug(slug);
    if (accRow) {
      target =
        memberships.find((m) => m.account_id === accRow!.id) ?? null;
    }
    // se slug informado mas não pertence ao usuário, não faz fallback silencioso
    if (!target && input?.params?.account) {
      logAccess("slug_not_owned", {
        route: input?.pathname,
        user_id: user.id,
        ms: Date.now() - t0,
      });
      return null;
    }
  }

  if (!target) {
    // Fallback: prioriza membership active; senão, primeira
    target =
      memberships.find((m) => m.status === "active") ?? memberships[0] ?? null;
  }

  if (!target) {
    logAccess("no_membership_choice", {
      route: input?.pathname,
      user_id: user.id,
      ms: Date.now() - t0,
    });
    return null;
  }

  // 5) Bloqueio SSR por inactive (a menos que seja super_admin)
  if (!isPlatformAdmin && String(target.status).toLowerCase() === "inactive") {
    const member = mapMemberFromDB(target);
    logAccess("inactive", {
      route: input?.pathname,
      user_id: user.id,
      account_id: member.accountId,
      ms: Date.now() - t0,
    });
    const ctxInactive: any = {
      member,
      account_id: member.accountId,
      account_slug: "",
      role: member.role,
      status: member.status,
      is_super_admin: isPlatformAdmin,
      acting_as: false,
      plan: { id: "", name: "" },
      limits: { max_lps: 0, max_conversions: 0, max_domains: 1 },
      blocked: true,
      error_code: "INACTIVE_MEMBER",
      account_status: undefined,
    };
    return ctxInactive as Access.AccessContext;
  }

  // 6) Carregar conta por ID (se ainda não carregada por slug)
  if (!accRow) {
    accRow = await getAccountById(target.account_id);
  }
  if (!accRow) {
    const member = mapMemberFromDB(target);
    logAccess("forbidden_account", {
      route: input?.pathname,
      user_id: user.id,
      account_id: member.accountId,
      ms: Date.now() - t0,
    });
    const ctxForbidden: any = {
      member,
      account_id: member.accountId,
      account_slug: "",
      role: member.role,
      status: member.status,
      is_super_admin: isPlatformAdmin,
      acting_as: false,
      plan: { id: "", name: "" },
      limits: { max_lps: 0, max_conversions: 0, max_domains: 1 },
      blocked: true,
      error_code: "FORBIDDEN_ACCOUNT",
      account_status: undefined,
    };
    return ctxForbidden as Access.AccessContext;
  }

  // 7) Normalização + checagem de status da conta
  const account = mapAccountFromDB(accRow);
  const member = mapMemberFromDB(target);

  const accStatus = String(account.status ?? "").toLowerCase();
  const accountOk =
    accStatus === "active" || accStatus === "trial" || isPlatformAdmin;

  if (!accountOk) {
    logAccess("forbidden_account_status", {
      route: input?.pathname,
      user_id: user.id,
      account_id: account.id,
      ms: Date.now() - t0,
    });
    const ctxForbidden: any = {
      account,
      member,
      account_id: account.id,
      account_slug: account.subdomain,
      role: member.role,
      status: member.status,
      is_super_admin: isPlatformAdmin,
      acting_as: false,
      plan: { id: "", name: "" },
      limits: { max_lps: 0, max_conversions: 0, max_domains: 1 },
      blocked: true,
      error_code: "FORBIDDEN_ACCOUNT",
      account_status: account.status,
    };
    return ctxForbidden as Access.AccessContext;
  }

  // 8) OK
  logAccess("ok", {
    route: input?.pathname,
    user_id: user.id,
    account_id: account.id,
    ms: Date.now() - t0,
  });

  const ctxOk: any = {
    account,
    member,
    account_id: account.id,
    account_slug: account.subdomain,
    role: member.role,
    status: member.status,
    is_super_admin: isPlatformAdmin,
    acting_as: false,
    plan: { id: "", name: "" },
    limits: { max_lps: 0, max_conversions: 0, max_domains: 1 },
    account_status: account.status,
  };

  return ctxOk as Access.AccessContext;
}
