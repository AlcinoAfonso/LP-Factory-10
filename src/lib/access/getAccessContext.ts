// src/lib/access/getAccessContext.ts
// E8 MVP — Orquestrador SSR (Refactor P0)
// Regras: sem queries diretas; lê pelo adapter (v_access_context); contrato estável.

import { createClient } from '@/supabase/server';
import type * as Access from './types';
import { mapAccountFromDB, mapMemberFromDB, type AccountInfo, type MemberInfo } from './adapters/accountAdapter';
import { readAccessContext } from './adapters/accessContextAdapter';

type Input = {
  params?: { account?: string };
  accountId?: string;
  userId?: string;
  route?: string;
  requestId?: string;
};

type AccessContextLegacy = Access.AccessContext & {
  account_id: string;
  account_slug: string | null;
  role: Access.Role;
  status: Access.MemberStatus;
  is_super_admin: boolean;
  acting_as: boolean | string;
  plan: { id: string; name: string };
  limits: { max_lps: number; max_conversions: number; max_domains: number };
};

export async function getAccessContext(input?: Input): Promise<AccessContextLegacy | null> {
  const slugRaw = input?.params?.account?.trim().toLowerCase();
  const accId = input?.accountId?.trim();

  if (slugRaw === 'home') return null;

  let userId = input?.userId;
  if (!userId) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.id) return null;
    userId = user.id;
  }

  const pair = await readAccessContext(slugRaw ?? '');
  if (!pair) return null;

  // Marcador removido do runtime: passamos null apenas por compat com mapAccountFromDB
  const account: AccountInfo = mapAccountFromDB({
    id: pair.account.id,
    name: pair.account.name ?? null,
    subdomain: pair.account.subdomain,
    domain: null,
    status: pair.account.status,
    setup_completed_at: null,
  } as any);

  const member: MemberInfo = mapMemberFromDB({
    id: '—',
    account_id: pair.member?.account_id ?? accId ?? account.id,
    user_id: pair.member?.user_id ?? userId,
    role: pair.member?.role,
    status: pair.member?.status,
    permissions: undefined,
  } as any);

  const ctx: AccessContextLegacy = {
    account,
    member,

    account_id: account.id,
    account_slug: account.subdomain ?? null,
    role: member.role as Access.Role,
    status: member.status as Access.MemberStatus,

    is_super_admin: false,
    acting_as: false,
    plan: { id: '', name: '' },
    limits: { max_lps: 0, max_conversions: 0, max_domains: 1 },
  };

  const isBlocked = pair.allow === false;
  if (isBlocked) {
    ctx.blocked = true;

    const ms = (member.status ?? '') as string;
    const reason = (pair.reason ?? '') as string;

    if (reason === 'member_inactive') {
      if (ms === 'pending') ctx.error_code = 'MEMBERSHIP_PENDING';
      else if (ms === 'inactive') ctx.error_code = 'INACTIVE_MEMBER';
      else if (ms === 'revoked') ctx.error_code = 'MEMBERSHIP_REVOKED';
      else ctx.error_code = 'MEMBERSHIP_BLOCKED';
    } else if (reason === 'account_blocked') {
      ctx.error_code = 'FORBIDDEN_ACCOUNT';
    } else {
      ctx.error_code = 'ACCESS_DENIED';
    }
  } else {
    ctx.blocked = false;
    ctx.error_code = null;
  }

  return ctx;
}

export type { AccessContextLegacy as AccessContext };
