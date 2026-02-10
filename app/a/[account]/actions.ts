// app/a/[account]/actions.ts
'use server';
import 'server-only';

import { redirect } from 'next/navigation';
import { headers, cookies } from 'next/headers';

import { getAccessContext } from '@/lib/access/getAccessContext';
import {
  setSetupCompletedAtIfNull,
  updateAccountNameCore,
  renameAccountNoStatus,
} from '@/lib/access/adapters/accountAdapter';
import { upsertAccountProfileV1 } from '@/lib/access/adapters/accountProfileAdapter';

export type RenameAccountState = {
  ok: boolean;
  error?: string;
};

export type SetupSaveState = {
  ok: boolean;
  fieldErrors?: Partial<{
    name: string;
    preferred_channel: string;
    whatsapp: string;
    site_url: string;
  }>;
  formError?: string;
};

function slugifyName(input: string): string {
  const base = input
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  return base.length > 0 ? base : 'acc';
}

function validateNameForRename(name: unknown): string {
  const trimmed = (name ?? '').toString().trim();
  if (trimmed.length < 3) throw new Error('invalid_name_length');
  return trimmed;
}

export async function renameAccountAction(
  _prevState: RenameAccountState | undefined,
  formData: FormData
): Promise<RenameAccountState> {
  const t0 = Date.now();

  // 🔥 AJUSTE OBRIGATÓRIO PARA NEXT 15:
  // headers() agora retorna Promise — precisa de await
  const hdrs = await headers();

  const requestId = hdrs.get('x-vercel-id') ?? hdrs.get('x-request-id') ?? null;

  const ip = hdrs.get('x-forwarded-for') ?? null;

  try {
    const accountId = formData.get('account_id')?.toString() ?? '';
    const userId = formData.get('user_id')?.toString() ?? undefined;
    const name = validateNameForRename(formData.get('name'));
    const slug = slugifyName(name);

    if (!accountId) throw new Error('missing_account_id');

    // Apenas renomeia (status inalterado)
    const ok = await renameAccountNoStatus(accountId, name, slug);
    const latency = Date.now() - t0;

    if (ok) {
      // sucesso — log canônico
      // eslint-disable-next-line no-console
      console.error(
        JSON.stringify({
          event: 'account_renamed',
          account_id: accountId,
          user_id: userId ?? null,
          latency_ms: latency,
          timestamp: new Date().toISOString(),
          request_id: requestId,
          ip,
        })
      );

      redirect(`/a/${slug}`);
    } else {
      // Falha lógica sem exceção
      // eslint-disable-next-line no-console
      console.error(
        JSON.stringify({
          event: 'account_rename_failed',
          error: 'adapter_returned_false',
          account_id: accountId,
          user_id: userId ?? null,
          latency_ms: latency,
          timestamp: new Date().toISOString(),
          request_id: requestId,
          ip,
        })
      );

      return {
        ok: false,
        error: 'Não foi possível renomear a conta. Tente novamente.',
      };
    }
  } catch (err: unknown) {
    const latency = Date.now() - t0;

    // eslint-disable-next-line no-console
    console.error(
      JSON.stringify({
        event: 'account_rename_failed',
        error: err instanceof Error ? err.message : String(err),
        latency_ms: latency,
        timestamp: new Date().toISOString(),
        request_id: requestId,
        ip,
      })
    );

    return {
      ok: false,
      error: 'Não foi possível renomear a conta. Tente novamente.',
    };
  }
}

function normalizeText(input: unknown): string {
  return (input ?? '').toString().trim();
}

/**
 * Extrai o subdomínio da conta a partir da URL de referência.
 * Espera um caminho do tipo /a/{subdominio}/... e retorna o segmento {subdominio}.
 */
function extractAccountSubdomainFromReferer(referer: string | null): string | null {
  if (!referer) return null;
  try {
    const url = new URL(referer);
    const parts = url.pathname.split('/').filter(Boolean);
    // Formato esperado: /a/{subdomain}
    if (parts[0] !== 'a') return null;
    const sub = (parts[1] ?? '').trim().toLowerCase();
    if (!sub || sub === 'home') return null;
    return sub;
  } catch {
    return null;
  }
}

/**
 * Lê o cookie last_account_subdomain definido no layout da conta para fallback.
 */
async function readLastAccountSubdomainCookie(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const v = cookieStore.get('last_account_subdomain')?.value ?? '';
    const sub = v.trim().toLowerCase();
    if (!sub || sub === 'home') return null;
    return sub;
  } catch {
    return null;
  }
}

function validatePreferredChannel(input: unknown): 'email' | 'whatsapp' {
  const v = normalizeText(input).toLowerCase();
  if (!v) return 'email';
  if (v === 'email' || v === 'whatsapp') return v;
  throw new Error('invalid_preferred_channel');
}

function validateWhatsappIfNeeded(preferred: 'email' | 'whatsapp', input: unknown): string | null {
  const raw = normalizeText(input);
  if (preferred !== 'whatsapp') return raw ? raw : null;

  if (!raw) throw new Error('whatsapp_required_when_channel');

  // contrato v1: somente dígitos; 10–15 dígitos
  if (!/^\d{10,15}$/.test(raw)) throw new Error('whatsapp_invalid');
  return raw;
}

function validateSiteUrl(input: unknown): string | null {
  const raw = normalizeText(input);
  if (!raw) return null;

  // contrato v1: URL web sem espaços iniciando com http:// ou https://
  if (raw.includes(' ')) throw new Error('site_url_invalid');
  if (!/^https?:\/\//i.test(raw)) throw new Error('site_url_invalid');
  return raw;
}

function validateNameForSetup(name: unknown, accountSubdomain: string): string {
  const trimmed = normalizeText(name);
  if (!trimmed) throw new Error('name_required');
  const defaultName = `Conta ${accountSubdomain}`;
  if (trimmed === defaultName) throw new Error('name_is_default');
  return trimmed;
}

/**
 * E10.4.6 — Handler do “Salvar e continuar” (E10.4)
 * - Guard: owner/admin (via Access Context)
 * - Persistência: account_profiles (niche/preferred_channel/whatsapp/site_url) + accounts.name (core)
 * - Marcador: setSetupCompletedAtIfNull(accountId) (NULL-only)
 * - Logs mínimos (E10.4.6 SUPA-24 + SUPA-05 + VERCE-10): mesmos request_id; sem PII
 */
export async function saveSetupAndContinueAction(
  _prevState: SetupSaveState | undefined,
  formData: FormData
): Promise<SetupSaveState> {
  const t0 = Date.now();
  const hdrs = await headers();

  const requestId =
    hdrs.get('x-vercel-id') ?? hdrs.get('x-request-id') ?? (globalThis.crypto?.randomUUID?.() ?? null);

  // Fallback para resolver o subdomínio da conta sem depender apenas do hidden input
  const formSubdomain = normalizeText(formData.get('account_subdomain')).toLowerCase();
  const refererSubdomain = extractAccountSubdomainFromReferer(hdrs.get('referer'));
  const cookieSubdomain = await readLastAccountSubdomainCookie();
  const accountSubdomain = formSubdomain || refererSubdomain || cookieSubdomain || '';
  const route = accountSubdomain ? `/a/${accountSubdomain}` : '/a';

  // Log de fallback (sem PII): indica que o hidden input estava vazio
  if (!formSubdomain && (refererSubdomain || cookieSubdomain)) {
    // eslint-disable-next-line no-console
    console.warn(
      JSON.stringify({
        scope: 'onboarding',
        event: 'setup_account_subdomain_fallback',
        source: refererSubdomain ? 'referer' : 'cookie',
        request_id: requestId,
        ts: new Date().toISOString(),
      })
    );
  }

  // Campos do form (sem logar valores)
  const nameRaw = formData.get('name');
  const nicheRaw = formData.get('niche');
  const preferredRaw = formData.get('preferred_channel');
  const whatsappRaw = formData.get('whatsapp');
  const siteUrlRaw = formData.get('site_url');

  try {
    if (!accountSubdomain) throw new Error('missing_account_subdomain');

    const ctx = await getAccessContext({
      params: { account: accountSubdomain },
      route,
      requestId: typeof requestId === 'string' ? requestId : undefined,
    });

    if (!ctx || ctx.blocked) {
      // Fail-closed
      return { ok: false, formError: 'Não foi possível salvar agora. Tente novamente.' };
    }

    const accountId = (ctx.account?.id ?? ctx.account_id ?? null) as string | null;
    const memberRole = (ctx.member?.role ?? null) as string | null;

    if (!accountId) throw new Error('missing_account_id');

    // Guard: owner/admin
    if (memberRole !== 'owner' && memberRole !== 'admin') {
      return { ok: false, formError: 'Você não tem permissão para salvar esta configuração.' };
    }

    // Log canônico: tentativa (sem PII)
    // eslint-disable-next-line no-console
    console.log(
      JSON.stringify({
        scope: 'onboarding',
        event: 'setup_save_attempt',
        account_id: accountId,
        request_id: requestId,
        ts: new Date().toISOString(),
      })
    );

    // Validações v1 (E10.4.4 + regra do nome padrão)
    const fieldErrors: SetupSaveState['fieldErrors'] = {};

    let preferred: 'email' | 'whatsapp' = 'email';
    let name = '';
    let whatsapp: string | null = null;
    let siteUrl: string | null = null;

    try {
      preferred = validatePreferredChannel(preferredRaw);
    } catch {
      fieldErrors.preferred_channel = 'Canal inválido.';
    }

    try {
      name = validateNameForSetup(nameRaw, accountSubdomain);
    } catch (e: unknown) {
      const code = e instanceof Error ? e.message : String(e);
      fieldErrors.name =
        code === 'name_is_default'
          ? 'Escolha um nome diferente do padrão.'
          : 'Informe um nome válido.';
    }

    try {
      whatsapp = validateWhatsappIfNeeded(preferred, whatsappRaw);
    } catch (e: unknown) {
      const code = e instanceof Error ? e.message : String(e);
      fieldErrors.whatsapp =
        code === 'whatsapp_required_when_channel'
          ? 'WhatsApp é obrigatório quando o canal é WhatsApp.'
          : 'WhatsApp inválido. Use apenas dígitos (10–15).';
    }

    try {
      siteUrl = validateSiteUrl(siteUrlRaw);
    } catch {
      fieldErrors.site_url = 'Link inválido (use http:// ou https://, sem espaços).';
    }

    // Se houve qualquer erro de validação → inline e não persiste/não seta marcador
    if (
      fieldErrors.name ||
      fieldErrors.preferred_channel ||
      fieldErrors.whatsapp ||
      fieldErrors.site_url
    ) {
      const latency = Date.now() - t0;

      // eslint-disable-next-line no-console
      console.warn(
        JSON.stringify({
          scope: 'onboarding',
          event: 'setup_save_failed',
          error_type: 'validation',
          invalid_fields: Object.keys(fieldErrors).filter((k) => (fieldErrors as any)[k]),
          account_id: accountId,
          request_id: requestId,
          latency_ms: latency,
          ts: new Date().toISOString(),
        })
      );

      return { ok: false, fieldErrors };
    }

    const niche = normalizeText(nicheRaw) || null;

    // Persistência: profile v1 (opcionais) + core accounts.name
    const okProfile = await upsertAccountProfileV1({
      accountId,
      niche,
      preferredChannel: preferred,
      whatsapp,
      siteUrl,
    });

    if (!okProfile) throw new Error('profile_upsert_failed');

    const okName = await updateAccountNameCore(accountId, name);
    if (!okName) throw new Error('account_name_update_failed');

    const okMarker = await setSetupCompletedAtIfNull(accountId);
    if (!okMarker) throw new Error('setup_marker_failed');

    const latency = Date.now() - t0;

    // sucesso — log canônico (sem PII)
    // eslint-disable-next-line no-console
    console.log(
      JSON.stringify({
        scope: 'onboarding',
        event: 'setup_completed',
        account_id: accountId,
        request_id: requestId,
        latency_ms: latency,
        ts: new Date().toISOString(),
      })
    );

    // redirect — log canônico (VERCE-10)
    // eslint-disable-next-line no-console
    console.log(
      JSON.stringify({
        scope: 'onboarding',
        event: 'setup_redirect',
        from: route,
        to: route,
        account_id: accountId,
        request_id: requestId,
        ts: new Date().toISOString(),
      })
    );

    redirect(route);
  } catch (err: unknown) {
    const latency = Date.now() - t0;

    // Se o erro for um NEXT_REDIRECT (Next.js usa exceção para controlar redirect),
    // relança a exceção para que o framework faça o redirecionamento sem tratar como falha.
    if (
      err &&
      typeof err === 'object' &&
      'digest' in err &&
      String((err as any)?.digest ?? '').startsWith('NEXT_REDIRECT')
    ) {
      throw err;
    }

    // eslint-disable-next-line no-console
    console.error(
      JSON.stringify({
        scope: 'onboarding',
        event: 'setup_save_failed',
        error_type: 'system',
        error: err instanceof Error ? err.message : String(err),
        request_id: requestId,
        latency_ms: latency,
        ts: new Date().toISOString(),
      })
    );

    return {
      ok: false,
      formError: 'Não foi possível salvar agora. Tente novamente.',
    };
  }
}
