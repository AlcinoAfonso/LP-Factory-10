// src/lib/access/getAccessContext.ts
import { getServerSupabase } from "@/src/lib/supabase/server";
import type * as Access from "./types";
import {
  mapAccountFromDB,
  mapMemberFromDB,
  pickAccount,
  type DBAccountRow,
  type DBMemberRow,
} from "./adapters/accountAdapter";

/**
 * getAccessContext — resolve o vínculo ativo (active|trial) do usuário
 * para uma conta específica (via slug em params.account ou accountId)
 * e retorna tanto os objetos ricos (account/member) quanto um shape
 * plano compatível com a UI atual.
 */
export async function getAccessContext(input?: {
  accountId?: string;
  host?: string;
  pathname?: string;
  params?: { account?: string }; // slug
}): Promise<Access.AccessContext | null> {
  const supabase = getServerSupabase();

  // 1) Auth
  const { data: userData } = await supabase.auth.getUser();
  const user = userData?.user;
  if (!user) return null;

  // 2) Base query (RLS ON): vínculo do usuário + dados da conta
  const q = supabase
    .from("account_users")
    .select(
      `
      id, account_id, user_id, role, status, permissions,
      accounts:accounts!inner(id, name, subdomain, domain, status)
    `
    )
    .eq("user_id", user.id)
    // membro ativo OU trial
    .eq("status", "active")
    .limit(50);

  // Filtro opcional por accountId
  if (input?.accountId) q.eq("account_id", input.accountId);

  const { data, error } = await q;
  if (error || !data || data.length === 0) return null;

  // 3) Normaliza rows e descarta contas fora de active|trial
  const rows = (data as any[]).map((row) => {
    const accRow = pickAccount(row.accounts) as DBAccountRow | null;
    if (!accRow) return null;
    const account = mapAccountFromDB(accRow);
    const member = mapMemberFromDB(row as DBMemberRow);
    const accountOk = account.status === "active" || account.status === "trial";
    const memberOk = member.status === "active";
    return accountOk && memberOk ? { account, member } : null;
  }).filter(Boolean) as {
    account: ReturnType<typeof mapAccountFromDB>;
    member: ReturnType<typeof mapMemberFromDB>;
  }[];

  if (rows.length === 0) return null;

  // 4) Escolha da conta: pelo slug (params.account) > accountId > primeira
  const wantedSlug = input?.params?.account?.trim().toLowerCase();
  const chosen =
    (wantedSlug
      ? rows.find((x) => x.account.subdomain?.toLowerCase() === wantedSlug)
      : undefined) ??
    (input?.accountId
      ? rows.find((x) => x.account.id === input.accountId)
      : undefined) ??
    rows[0];

  if (!chosen) return null;

  // 5) Monta AccessContext completo (objetos + shape plano)
  const ctx: any = {
    // objetos ricos para a UI atual
    account: chosen.account,
    member: chosen.member,

    // shape plano legado/compatível
    account_id: chosen.account.id,
    account_slug: chosen.account.subdomain,
    role: chosen.member.role as Access.Role,
    status: chosen.member.status as Access.MemberStatus,

    // flags padrão (Fase 2 pode ligar via RPC)
    is_super_admin: false,
    acting_as: false,
    plan: { id: "", name: "" },
    limits: {
      max_lps: 0,
      max_conversions: 0,
      max_domains: 1,
    },
  };

  return ctx as Access.AccessContext;
}
