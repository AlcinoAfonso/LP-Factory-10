// src/lib/access/guards.ts
import { checkSuperAdmin, checkPlatformAdmin } from '@/lib/admin';
import { createClient } from '@/lib/supabase/server';
import type { AccountStatus, MemberRole } from '@/lib/types/status';
import { headers } from 'next/headers';
import { getAccessContext } from './getAccessContext';

const accountMembersManagerContextBrand: unique symbol = Symbol('accountMembersManagerContext');
const accountMemberUserContextBrand: unique symbol = Symbol('accountMemberUserContext');

export type AccountMembersManagerContext = Readonly<{
  [accountMembersManagerContextBrand]: true;
  accountId: string;
  accountSubdomain: string;
  accountStatus: AccountStatus;
  actorUserId: string;
  actorRole: Extract<MemberRole, 'owner' | 'admin'>;
  requestId: string | null;
}>;

export type AccountMemberUserContext = Readonly<{
  [accountMemberUserContextBrand]: true;
  actorUserId: string;
}>;

export type AccountMembersManagerGuardResult =
  | Readonly<{ allowed: true; context: AccountMembersManagerContext }>
  | Readonly<{
      allowed: false;
      reason:
        | 'unauthenticated'
        | 'account_not_allowed'
        | 'membership_not_active'
        | 'insufficient_role';
    }>;

export async function requireAccountMembersManager(
  rawAccountSubdomain: string,
): Promise<AccountMembersManagerGuardResult> {
  const accountSubdomain = rawAccountSubdomain.trim().toLowerCase();
  if (!accountSubdomain || accountSubdomain === 'home') {
    return { allowed: false, reason: 'account_not_allowed' };
  }

  const supabase = await createClient();
  let requestId: string | null = null;
  try {
    const requestHeaders = await headers();
    requestId = normalizeRequestId(requestHeaders.get('x-request-id'));
  } catch {
    requestId = null;
  }
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user?.id) return { allowed: false, reason: 'unauthenticated' };

  const access = await getAccessContext({
    params: { account: accountSubdomain },
    userId: user.id,
    requestId: requestId ?? undefined,
  });

  if (!access || access.blocked) {
    return { allowed: false, reason: 'account_not_allowed' };
  }
  const accountStatus = access.account?.status;
  if (!accountStatus) {
    return { allowed: false, reason: 'account_not_allowed' };
  }
  if (access.status !== 'active') {
    return { allowed: false, reason: 'membership_not_active' };
  }
  if (access.role !== 'owner' && access.role !== 'admin') {
    return { allowed: false, reason: 'insufficient_role' };
  }

  return {
    allowed: true,
    context: {
      [accountMembersManagerContextBrand]: true,
      accountId: access.account_id,
      accountSubdomain: access.account_slug ?? accountSubdomain,
      accountStatus,
      actorUserId: user.id,
      actorRole: access.role,
      requestId,
    },
  };
}

function normalizeRequestId(value: string | null): string | null {
  const normalized = value?.trim() ?? '';
  return normalized.length > 0 ? normalized : null;
}

export async function requireAuthenticatedAccountMemberUser(): Promise<
  | Readonly<{ allowed: true; context: AccountMemberUserContext }>
  | Readonly<{ allowed: false; reason: 'unauthenticated' }>
> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user?.id) return { allowed: false, reason: 'unauthenticated' };

  return {
    allowed: true,
    context: {
      [accountMemberUserContextBrand]: true,
      actorUserId: user.id,
    },
  };
}

/**
 * Guard: verifica super_admin via adapter
 * Diferencia usuário não autenticado de não autorizado
 */
export async function requireSuperAdmin(): Promise<{
  allowed: boolean;
  redirect?: '/auth/login' | '/auth/confirm/info';
}> {
  const check = await checkSuperAdmin();
  
  // Usuário não autenticado → login
  if (!check.userId) {
    return { allowed: false, redirect: '/auth/login' };
  }
  
  // Usuário autenticado mas não super → info neutra
  if (!check.isSuper) {
    return { allowed: false, redirect: '/auth/confirm/info' };
  }
  
  return { allowed: true };
}

/**
 * Guard: verifica platform_admin (inclui super_admin) via adapter
 * Diferencia usuário não autenticado de não autorizado
 */
export async function requirePlatformAdmin(): Promise<{
  allowed: false;
  redirect: '/auth/login' | '/auth/confirm/info';
} | {
  allowed: true;
  actorUserId: string;
}> {
  const check = await checkPlatformAdmin();
  
  // Usuário não autenticado → login
  if (!check.userId) {
    return { allowed: false, redirect: '/auth/login' };
  }
  
  // Usuário autenticado mas não platform/super → info neutra
  if (!check.isPlatform) {
    return { allowed: false, redirect: '/auth/confirm/info' };
  }
  
  return { allowed: true, actorUserId: check.userId };
}
