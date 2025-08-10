import { headers } from 'next/headers';
import { getServerSupabase } from '../supabase/server';
import type { AccessContext, AccessInput, Role } from './types';
import { AccessError } from './types';

/**
 * Fase 1: resolve tenant, valida vínculo ativo e retorna contexto mínimo.
 * - RLS sempre ON
 * - Sem auditoria / planos reais (defaults)
 * - Sem acting_as/super_admin (defaults)
 */
export async function getAccessContext(input: AccessInput = {}): Promise<AccessContext> {
  const h = headers();
  const host = (input.host ?? h.get('host') ?? '').toLowerCase();
  const pathname = input.pathname ?? '';

  // 1) Resolver account_slug
  const account_slug = resolveAccountSlug(host, pathname, input.params);
  if (!account_slug) throw new AccessError('UNRESOLVED_TENANT', 'Tenant não resolvido.');

  // 2) Sessão do usuário
  const supabase = getServerSupabase();
  const { data: userRes, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userRes?.user) throw new AccessError('FORBIDDEN_ACCOUNT', 'Usuário não autenticado.');
  const userId = userRes.user.id;

  // 3) Account pelo slug (RLS)
  const { data: account, error: accErr } = await supabase
    .from('accounts')
    .select('id, subdomain')
    .eq('subdomain', account_slug)
    .single();
  if (accErr || !account) throw new AccessError('UNRESOLVED_TENANT', 'Conta não encontrada.');

  // 4) Vínculo na account (RLS)
  const { data: membership, error: memErr } = await supabase
    .from('account_users')
    .select('role, status')
    .eq('account_id', account.id)
    .eq('user_id', userId)
    .single();
  if (memErr || !membership) throw new AccessError('FORBIDDEN_ACCOUNT', 'Sem vínculo com esta conta.');
  if (membership.status !== 'active') throw new AccessError('INACTIVE_MEMBER', 'Vínculo não está ativo.');

  // 5) Contexto com defaults seguros (Fase 1)
  const ctx: AccessContext = {
    account_id: account.id,
    account_slug,
    role: membership.role as Role,
    status: membership.status,
    is_super_admin: false,
    acting_as: false,
    plan: { id: '', name: 'MVP' },
    limits: { max_lps: 0, max_conversions: 0, max_domains: 0 },
  };
  return ctx;
}

// Preferência: subdomínio; fallback: rota /a/[account]
function resolveAccountSlug(host: string, pathname: string, params?: { account?: string }) {
  const isLocal = host.startsWith('localhost') || host.startsWith('127.0.0.1');
  const parts = host.split('.');
  if (!isLocal && parts.length >= 3) {
    const sub = parts[0];
    if (sub && sub !== 'www') return sub;
  }
  if (params?.account) return params.account;
  const match = pathname?.match(/\/a\/([^/]+)/);
  if (match?.[1]) return match[1];
  return null;
}
