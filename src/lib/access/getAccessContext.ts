// src/lib/access/getAccessContext.ts
// E8 MVP — Orquestrador SSR (Refactor P0)
// Regras: sem queries diretas; lê pelo adapter (v_access_context); contrato estável.

import { createClient } from "@/supabase/server";
import type * as Access from "./types";
import {
  mapAccountFromDB,
  mapMemberFromDB,
  type AccountInfo,
  type MemberInfo,
} from "./adapters/accountAdapter";
import { readAccessContext } from "./adapters/accessContextAdapter";

type Input = {
  /** Preferencial: slug vindo de /a/[account] */
  params?: { account?: string };
  /** Alternativo (casos especiais) */
  accountId?: string;
  /** Opcional — se não vier, busco via supabase.auth.getUser() */
  userId?: string;
  /** Metadados de rota para logs */
  route?: string;
  requestId?: string;
};

type AccessContextLegacy = Access.AccessContext & {
  // shape plano legado/compatível (mantido p/ UI atual)
  account_id: string;
  account_slug: string | null;
  role: Access.Role;
  status: Access.MemberStatus;
  is_super_admin: boolean;
  acting_as: boolean | string;
  plan: { id: string; name: string };
  limits: { max_lps: number; max_conversions: number; max_domains: number };
};

/**
 * Resolve o contexto de acesso para SSR do Account Dashboard.
 * - Usa exclusivamente o adapter (readAccessContext) -> v_access_context
 * - Mantém contrato legado/compatível com a UI atual
 * - Não faz redirect; quem chama (layout SSR) decide o que fazer com null
 */
export async function getAccessContext(input?: Input): Promise<AccessContextLegacy | null> {
  const slugRaw = input?.params?.account?.trim().toLowerCase();
  const accId = input?.accountId?.trim();

  // Slug 'home' → estado público/onboarding (não escolher conta)
  if (slugRaw === "home") return null;

  // Auth (se userId não foi fornecido)
  let userId = input?.userId;
  if (!userId) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.id) return null;
    userId = user.id;
  }

  // Chama o adapter (ele decide allow/deny e loga decisão)
  // readAccessContext:
  // - allow=true  -> retorna ctx
  // - allow=false -> retorna ctx "bloqueado" SOMENTE quando existir membership (B1-Fase1)
  // - caso contrário -> null (fail-closed)
  const pair = await readAccessContext(slugRaw ?? "");
  if (!pair) return null;

  // Normaliza para os tipos já usados no front (reaproveita mappers)
  // Nota: pair.account/pair.member vêm do adapter no shape mínimo;
  // usamos os mappers para manter compat com o domínio atual.
  const account: AccountInfo = mapAccountFromDB({
    id: pair.account.id,
    name: pair.account.name ?? null,
    subdomain: pair.account.subdomain,
    domain: null,
    status: pair.account.status,
    setup_completed_at: pair.account.setupCompletedAt ?? null,
  } as any);

  const member: MemberInfo = mapMemberFromDB({
    id: "—", // não exposto na view mínima (ok para MVP)
    account_id: pair.member?.account_id ?? accId ?? account.id,
    user_id: pair.member?.user_id ?? userId,
    role: pair.member?.role,
    status: pair.member?.status,
    permissions: undefined,
  } as any);

  // Monta contrato estável + shape plano legado
  const ctx: AccessContextLegacy = {
    // objetos ricos para UI atual
    account,
    member,

    // shape plano legado/compatível
    account_id: account.id,
    account_slug: account.subdomain ?? null,
    role: member.role as Access.Role,
    status: member.status as Access.MemberStatus,

    // flags padrão (podem ser ligadas via RPC no futuro)
    is_super_admin: false,
    acting_as: false,
    plan: { id: "", name: "" },
    limits: {
      max_lps: 0,
      max_conversions: 0,
      max_domains: 1,
    },
  };

  // B1-Fase1: propagar bloqueio para o gate SSR (layout decide UX)
  const isBlocked = pair.allow === false;
  if (isBlocked) {
    ctx.blocked = true;

    // error_code é "compat" (string). Mantém nomes simples para UI/telemetria.
    const ms = (member.status ?? "") as string;
    const reason = (pair.reason ?? "") as string;

    if (reason === "member_inactive") {
      if (ms === "pending") ctx.error_code = "MEMBERSHIP_PENDING";
      else if (ms === "inactive") ctx.error_code = "INACTIVE_MEMBER";
      else if (ms === "revoked") ctx.error_code = "MEMBERSHIP_REVOKED";
      else ctx.error_code = "MEMBERSHIP_BLOCKED";
    } else if (reason === "account_blocked") {
      ctx.error_code = "FORBIDDEN_ACCOUNT";
    } else {
      ctx.error_code = "ACCESS_DENIED";
    }
  } else {
    ctx.blocked = false;
    ctx.error_code = null;
  }

  return ctx;
}

export type { AccessContextLegacy as AccessContext };
