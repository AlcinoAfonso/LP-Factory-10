'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

import { createServerClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { audit } from '@/lib/audit';
import { getAccessContextByAccountKey } from '@/lib/access/getAccessContextByAccountKey';
import { getAccountIdFromAccountKey } from '@/lib/accounts/getAccountIdFromAccountKey';
import { setSetupCompletedAtIfNull } from '@/lib/accounts/setSetupCompletedAtIfNull';

type SetupFormInput = {
  account_key: string; // ex: acc-xxxx
  name: string;
  niche?: string | null;
  preferred_channel?: string | null;
  whatsapp?: string | null;
  site_url?: string | null;
};

type SetupFormResult =
  | { ok: true }
  | { ok: false; message: string };

function isNextRedirectError(err: unknown): boolean {
  // Next lança um erro especial para redirect.
  // Identificar por string é feio, mas é o fallback mais compatível.
  const msg = String((err as any)?.message ?? '');
  const digest = String((err as any)?.digest ?? '');
  return msg.includes('NEXT_REDIRECT') || digest.includes('NEXT_REDIRECT');
}

export async function finalizeSetup(input: SetupFormInput): Promise<SetupFormResult> {
  const hdrs = headers();
  const ip =
    hdrs.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    hdrs.get('x-real-ip') ||
    null;

  const supabase = await createServerClient();
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();

  if (userErr || !user?.id) {
    await audit('setup_save_failed', {
      reason: 'no_user',
      account_key: input.account_key,
      ip_address: ip,
    });
    return { ok: false, message: 'Você precisa estar logado para continuar.' };
  }

  const accountKey = input.account_key;

  // 1) Resolver account_id e validar acesso do usuário (auth client)
  const accountId = await getAccountIdFromAccountKey(accountKey);
  if (!accountId) {
    await audit('setup_save_failed', {
      reason: 'account_not_found',
      account_key: accountKey,
      user_id: user.id,
      ip_address: ip,
    });
    return { ok: false, message: 'Conta inválida.' };
  }

  const access = await getAccessContextByAccountKey(accountKey);
  if (!access?.allow) {
    await audit('setup_save_failed', {
      reason: 'access_denied',
      account_key: accountKey,
      account_id: accountId,
      user_id: user.id,
      ip_address: ip,
    });
    return { ok: false, message: 'Acesso negado.' };
  }

  // 2) Persistir dados usando service client (server-only)
  const service = createServiceClient();

  try {
    await audit('setup_save_attempt', {
      account_key: accountKey,
      account_id: accountId,
      user_id: user.id,
      ip_address: ip,
    });

    // 2.1) upsert em account_profiles
    {
      const { error } = await service
        .from('account_profiles')
        .upsert(
          {
            account_id: accountId,
            niche: input.niche ?? null,
            preferred_channel: input.preferred_channel ?? null,
            whatsapp: input.whatsapp ?? null,
            site_url: input.site_url ?? null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'account_id' }
        );

      if (error) {
        await audit('setup_save_failed', {
          reason: 'account_profiles_upsert',
          account_key: accountKey,
          account_id: accountId,
          user_id: user.id,
          ip_address: ip,
          error: { message: error.message, code: (error as any).code },
        });
        return { ok: false, message: 'Não foi possível salvar agora. Tente novamente.' };
      }
    }

    // 2.2) atualizar accounts.name
    {
      const { error } = await service
        .from('accounts')
        .update({
          name: input.name,
          updated_at: new Date().toISOString(),
        })
        .eq('id', accountId);

      if (error) {
        await audit('setup_save_failed', {
          reason: 'accounts_update_name',
          account_key: accountKey,
          account_id: accountId,
          user_id: user.id,
          ip_address: ip,
          error: { message: error.message, code: (error as any).code },
        });
        return { ok: false, message: 'Não foi possível salvar agora. Tente novamente.' };
      }
    }

    // 2.3) marcar setup concluído (idempotente)
    {
      const { ok, error } = await setSetupCompletedAtIfNull(accountId);
      if (!ok) {
        await audit('setup_save_failed', {
          reason: 'set_setup_completed_at',
          account_key: accountKey,
          account_id: accountId,
          user_id: user.id,
          ip_address: ip,
          error,
        });
        return { ok: false, message: 'Não foi possível salvar agora. Tente novamente.' };
      }
    }

    await audit('setup_completed', {
      account_key: accountKey,
      account_id: accountId,
      user_id: user.id,
      ip_address: ip,
    });

    // 3) Redirect pós-setup:
    // E10.5/E15 ainda não construída. Evitar redirecionar de volta para /a/[account]
    // (que é exatamente onde o onboarding está).
    const dest = '/a/home';

    await audit('setup_redirect', {
      account_key: accountKey,
      account_id: accountId,
      user_id: user.id,
      ip_address: ip,
      dest,
    });

    redirect(dest);
  } catch (err) {
    // IMPORTANTÍSSIMO: não “engolir” redirect do Next
    if (isNextRedirectError(err)) throw err;

    await audit('setup_save_failed', {
      reason: 'unexpected',
      account_key: accountKey,
      account_id: accountId,
      user_id: user.id,
      ip_address: ip,
      error: { message: String((err as any)?.message ?? err) },
    });

    return { ok: false, message: 'Não foi possível salvar agora. Tente novamente.' };
  }
}
