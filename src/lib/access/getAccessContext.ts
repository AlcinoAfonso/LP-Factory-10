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
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.id) return null;
    userId = user.id;
  }

  // Chama o adapter (ele decide allow/deny e loga decisão)
  // >>> Correção: readAccessContext espera APENAS o subdomain (string)
  const pair = await readAccessContext(slugRaw ?? "");
  if (!pair) return null;

  // Normaliza para os tipos já usados no front (reaproveita mappers)
  // Nota: pair.account/pair.member vêm do adapter no shape mínimo;
  // usamos os mappers para manter compat com o domínio atual.
  const account: AccountInfo = mapAccountFromDB({
    id: pair.account.id,
    name: (pair as any).account?.name ?? null, // opcional para MVP (view mínima não expõe)
    subdomain: pair.account.subdomain,
    domain: (pair as any).account?.domain ?? null, // opcional/futuro
    status: pair.account.status,
  } as any);

  const member: MemberInfo = mapMemberFromDB({
    id: (pair as any).member?.id ?? "—", // não exposto na view mínima (ok para MVP)
    // >>> Correção: usar snake_case retornado pelo adapter
    account_id: (pair as any).member?.account_id ?? accId ?? account.id,
    user_id: (pair as any).member?.user_id ?? userId,
    role: (pair as any).member?.role,
    status: (pair as any).member?.status,
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

  return ctx;
}

export type { AccessContextLegacy as AccessContext };
