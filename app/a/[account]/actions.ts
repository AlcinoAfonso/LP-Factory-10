'use server';

import { z } from 'zod';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { createClient } from '@/lib/supabase/server';
import { getAccessContext } from '@/lib/access/accessContext';
import { updateAccountNameCore, renameAccountNoStatus } from '@/lib/access/adapters/accountAdapter';
import { upsertAccountProfile } from '@/lib/access/adapters/accountProfileAdapter';
import { ensureAccountSubdomainOnboarding, getAccountSubdomain } from '@/lib/access/subdomain';
import { getRequestId } from '@/lib/telemetry/requestId';

/**
 * Atualiza o nome da conta SEM mexer no status (ajuda a evitar efeitos colaterais).
 * - Usa a estratégia "core update" do adapter.
 */
export async function renameAccountAction(prevState: any, formData: FormData) {
  const requestId = getRequestId();
  const t0 = Date.now();

  const schema = z.object({
    accountId: z.string().uuid(),
    name: z.string().min(2).max(80),
  });

  const parsed = schema.safeParse({
    accountId: formData.get('accountId'),
    name: formData.get('name'),
  });

  if (!parsed.success) {
    return {
      ok: false,
      fieldErrors: parsed.error.flatten().fieldErrors,
      formError: null,
    };
  }

  try {
    await renameAccountNoStatus(parsed.data.accountId, parsed.data.name);

    // eslint-disable-next-line no-console
    console.error(
      JSON.stringify({
        scope: 'onboarding',
        event: 'account_renamed',
        request_id: requestId,
        latency_ms: Date.now() - t0,
        ts: new Date().toISOString(),
      })
    );

    return { ok: true };
  } catch (err: unknown) {
    // eslint-disable-next-line no-console
    console.error(
      JSON.stringify({
        scope: 'onboarding',
        event: 'account_rename_failed',
        error: err instanceof Error ? err.message : String(err),
        request_id: requestId,
        latency_ms: Date.now() - t0,
        ts: new Date().toISOString(),
      })
    );

    return { ok: false, formError: 'Não foi possível renomear agora. Tente novamente.' };
  }
}

/**
 * Salvar e continuar (Primeiros passos)
 * - Upsert do perfil mínimo (account_profiles)
 * - Atualiza accounts.name (core)
 * - Status: status='pending_setup' → 'active' (idempotente)
 * - Marcadores legacy (setup_completed_at/account_setup_completed_at) não são usados nem atualizados aqui
 * - Redirect de volta para /a/[account] (forçando refresh por query param)
 */
export async function saveSetupAndContinueAction(prevState: any, formData: FormData) {
  const requestId = getRequestId();
  const t0 = Date.now();

  const schema = z.object({
    accountId: z.string().uuid(),
    name: z.string().min(2).max(80),
    niche: z.string().max(80).optional().nullable(),
    preferredChannel: z.enum(['email', 'whatsapp']).optional().nullable(),
    whatsapp: z
      .string()
      .regex(/^\d{10,15}$/)
      .optional()
      .nullable(),
    siteUrl: z
      .string()
      .url()
      .optional()
      .nullable(),
  });

  const parsed = schema.safeParse({
    accountId: formData.get('accountId'),
    name: formData.get('name'),
    niche: formData.get('niche') || null,
    preferredChannel: formData.get('preferredChannel') || null,
    whatsapp: formData.get('whatsapp') || null,
    siteUrl: formData.get('siteUrl') || null,
  });

  if (!parsed.success) {
    // Se houve qualquer erro de validação → inline e não persiste/não altera status
    return {
      ok: false,
      fieldErrors: parsed.error.flatten().fieldErrors,
      formError: null,
    };
  }

  const { accountId, name, niche, preferredChannel, whatsapp, siteUrl } = parsed.data;

  // eslint-disable-next-line no-console
  console.error(
    JSON.stringify({
      scope: 'onboarding',
      event: 'setup_save_attempt',
      request_id: requestId,
      account_id: accountId,
      ts: new Date().toISOString(),
    })
  );

  try {
    // 1) Persistir perfil mínimo (upsert)
    await upsertAccountProfile(accountId, {
      niche,
      preferred_channel: preferredChannel ?? 'email',
      whatsapp,
      site_url: siteUrl,
    });

    // 2) Atualizar accounts.name (core)
    await updateAccountNameCore(accountId, name);

    // 3) Atualizar status: pending_setup → active (idempotente)
    await setAccountStatusActiveIfPending(accountId);

    // 4) Resolver subdomínio/rota para redirect
    const accountSubdomain = await getAccountSubdomainFromCookieOrFallback(accountId, requestId);
    const route = `/a/${accountSubdomain}`;

    // eslint-disable-next-line no-console
    console.error(
      JSON.stringify({
        scope: 'onboarding',
        event: 'setup_completed',
        request_id: requestId,
        account_id: accountId,
        ts: new Date().toISOString(),
      })
    );

    // eslint-disable-next-line no-console
    console.error(
      JSON.stringify({
        scope: 'onboarding',
        event: 'setup_redirect',
        request_id: requestId,
        to: `${route}?setup=done`,
        ts: new Date().toISOString(),
      })
    );

    redirect(`${route}?setup=done`);
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

async function setAccountStatusActiveIfPending(accountId: string) {
  const supabase = createClient();

  // Service role/DB update via RLS-safe path: accounts update via server.
  // Condicional e idempotente: só muda se estiver pending_setup.
  const { error } = await supabase
    .from('accounts')
    .update({ status: 'active' })
    .eq('id', accountId)
    .eq('status', 'pending_setup');

  if (error) throw error;
}

async function getAccountSubdomainFromCookieOrFallback(accountId: string, requestId: string) {
  // Tenta cookie de última conta para manter UX estável em navegação
  const last = cookies().get('lp10_last_account')?.value ?? null;
  if (last) return last;

  // Fallback: garantir subdomínio consistente e recuperar
  const ensured = await ensureAccountSubdomainOnboarding(accountId);

  // eslint-disable-next-line no-console
  console.error(
    JSON.stringify({
      scope: 'onboarding',
      event: 'setup_account_subdomain_fallback',
      request_id: requestId,
      account_id: accountId,
      account_subdomain: ensured,
      ts: new Date().toISOString(),
    })
  );

  return ensured;
}
