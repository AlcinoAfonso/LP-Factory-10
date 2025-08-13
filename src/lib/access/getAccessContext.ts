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
 * getAccessContext — resolve o vínculo ativo (active|trial) do usuário.
 * Mantém defaults para plan/limits/acting_as conforme Blueprint atual.
 */
export async function getAccessContext(input?: {
  accountId?: string;
  host?: string;
  pathname?: string;
  params?: { account?: string };
}): Promise<Access.AccessContext | null> {
  const supabase = getServerSupabase();

  // Autenticação
  const { data: userData } = await supabase.auth.getUser();
  const user = userData?.user;
  if (!user) return null;

  // Vínculos do usuário (RLS ON) + status do account
  const q = supabase
    .from("account_users")
    .select(`
      id, account_id, user_id, role, status, permissions,
      accounts:accounts!inner(id, name, subdomain, domain, status)
    `)
    .eq("user_id", user.id)
    .eq("status", "active") // membro ativo
    .limit(50);

  if (input?.accountId) q.eq("account_id", input.accountId);

  const { data, error } = await q;
  if (error || !data || data.length === 0) return null;

  // Normaliza + guarda (permitir active|trial; bloquear suspended/canceled)
  const mapped = data
    .map((row: any) => {
      const accRow = pickAccount(row.accounts) as DBAccountRow | null;
      if (!accRow) return null;
      const account = mapAccountFromDB(accRow);
      const member = mapMemberFromDB(row as DBMemberRow);
      return account.status === "active" || account.status === "trial"
        ? { account, member }
        : null;
    })
    .filter(Boolean) as {
      account: ReturnType<typeof mapAccountFromDB>;
      member: ReturnType<typeof mapMemberFromDB>;
    }[];

  if (mapped.length === 0) return null;

  // Respeita accountId quando passado
  const chosen =
    (input?.accountId
      ? mapped.find((x) => x.account.id === input.accountId)
      : mapped[0]) ?? mapped[0];

  // Monta AccessContext (defaults — Fase 2 liga plan/limits via RPC)
  const ctx: Access.AccessContext = {
    account_id: chosen.account.id,
    account_slug: chosen.account.subdomain,
    role: chosen.member.role as Access.Role,
    status: chosen.member.status as Access.MemberStatus,
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
