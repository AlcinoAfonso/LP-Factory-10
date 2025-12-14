// src/lib/access/adapters/accessContextAdapter.ts
// Fonte única de leitura do Access Context (E8).
// Decide via super view v2; retorna null quando allow=false.
// Log padronizado: access_context_decision (MRVG 1.5 D/F).

import 'server-only';
import { headers } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import type { AccountStatus, MemberStatus, MemberRole } from '../../types/status';

export type AccessAccount = {
  id: string;
  subdomain: string;
  name?: string;
  status: AccountStatus;
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
};

type RowV2 = {
  account_id: string;
  account_key: string; // subdomain
  account_name?: string | null;
  account_status: string;
  user_id: string | null;
  member_role: string | null;
  member_status: string | null;
  allow: boolean | null;
  reason: string | null; // 'account_blocked' | 'member_inactive' | 'no_membership' | null
};

type LogInput = {
  decision: 'allow' | 'deny' | 'null';
  reason?:
    | 'ok'
    | 'account_blocked'
    | 'member_inactive'
    | 'no_membership'
    | 'no_membership_or_invalid_account'
    | 'denied_by_view'
    | `adapter_error_${string}`
    | string
    | null;
  user_id?: string | null;
  account_id?: string | null;
  role?: string | null;
  route?: string | null;
  request_id?: string | null;
  latency_ms?: number | null;
  source?: 'view_v2' | 'view_v1' | 'adapter_error';
};

async function logDecision(input: LogInput) {
  try {
    const h = await headers();
    const payload = {
      event: 'access_context_decision',
      source: input.source ?? 'view_v2',
      decision: input.decision,
      reason: input.reason ?? null,
      user_id: input.user_id ?? null,
      account_id: input.account_id ?? null,
      role: input.role ?? null,
      route: input.route ?? h.get('x-invoke-path') ?? null,
      request_id: input.request_id ?? h.get('x-request-id') ?? null,
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
    .from('v_access_context_v2')
    .select(
      [
        'account_id',
        'account_key',
        'account_name',
        'account_status',
        'user_id',
        'member_role',
        'member_status',
        'allow',
        'reason',
      ].join(',')
    )
    .eq('account_key', subdomain)
    .limit(1)
    .maybeSingle();

  if (error) {
    await logDecision({
      decision: 'null',
      reason: 'adapter_error_read_v2',
      source: 'adapter_error',
      latency_ms: Date.now() - t0,
    });
    return null;
  }

  if (!data) {
    await logDecision({
      decision: 'deny',
      reason: 'no_membership_or_invalid_account',
      latency_ms: Date.now() - t0,
    });
    return null;
  }

  const row = data as unknown as RowV2;

  if (!row.allow) {
    await logDecision({
      user_id: row.user_id ?? null,
      account_id: row.account_id ?? null,
      role: row.member_role ?? null,
      decision: 'deny',
      reason: (row.reason as LogInput['reason']) ?? 'denied_by_view',
      latency_ms: Date.now() - t0,
    });
    return null;
  }

  const ctx: AccessContext = {
    account: {
      id: row.account_id,
      subdomain: row.account_key,
      name: row.account_name || row.account_key,
      status: row.account_status as AccountStatus,
    },
    member: {
      user_id: row.user_id as string,
      account_id: row.account_id,
      role: (row.member_role ?? 'viewer') as MemberRole,
      status: (row.member_status ?? 'active') as MemberStatus,
    },
  };

  await logDecision({
    user_id: row.user_id,
    account_id: row.account_id,
    role: row.member_role,
    decision: 'allow',
    reason: 'ok',
    latency_ms: Date.now() - t0,
  });

  return ctx;
}

/**
 * Retorna subdomain da primeira conta ativa do usuário autenticado.
 * Usado para redirect em /a/home (C0.2).
 * Server-only. Fail-closed (erro ou sem conta → null).
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
      decision: 'null',
      reason: 'adapter_error_auth',
      source: 'adapter_error',
      latency_ms: Date.now() - t0,
    });
    return null;
  }

  // 2) Buscar primeira conta via v_access_context_v2
  // Observação: adicionado order determinístico para evitar variação entre execuções.
  // Trocar para coluna de preferência (ex.: last_accessed) quando disponível.
  const { data, error } = await supabase
    .from('v_access_context_v2')
    .select('account_key, account_id')
    .eq('user_id', user.id)
    .eq('allow', true)
    .order('account_key', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    await logDecision({
      decision: 'null',
      reason: 'adapter_error_read_first_account',
      source: 'adapter_error',
      user_id: user.id,
      latency_ms: Date.now() - t0,
    });
    return null;
  }

  if (!data) {
    await logDecision({
      decision: 'deny',
      reason: 'no_membership',
      user_id: user.id,
      latency_ms: Date.now() - t0,
    });
    return null;
  }

  await logDecision({
    decision: 'allow',
    reason: 'ok',
    user_id: user.id,
    account_id: (data as any).account_id ?? null,
    latency_ms: Date.now() - t0,
  });

  return (data as any).account_key as string; // subdomain
}
