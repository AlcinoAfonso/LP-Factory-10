'use server';
import 'server-only';

import { redirect } from 'next/navigation';
import { headers } from 'next/headers';

import { renameAndActivate } from '@/lib/access/adapters/accountAdapter'; // ajuste p/ alias se aplicável

export type RenameAccountState = {
  ok: boolean;
  error?: string;
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

function validateName(name: unknown): string {
  const trimmed = (name ?? '').toString().trim();
  if (trimmed.length < 3) throw new Error('invalid_name_length');
  return trimmed;
}

export async function renameAccountAction(
  _prevState: RenameAccountState | undefined,
  formData: FormData
): Promise<RenameAccountState> {
  const t0 = Date.now();
  const hdrs = headers();
  const requestId = hdrs.get('x-vercel-id') ?? hdrs.get('x-request-id') ?? null;
  const ip = hdrs.get('x-forwarded-for') ?? null;

  try {
    const accountId = formData.get('account_id')?.toString() ?? '';
    const userId = formData.get('user_id')?.toString() ?? undefined;
    const name = validateName(formData.get('name'));
    const slug = slugifyName(name);

    if (!accountId) throw new Error('missing_account_id');

    // Adapter retorna boolean → true = sucesso
    const ok = await renameAndActivate(accountId, name, slug);
    const latency = Date.now() - t0;

    if (ok) {
      // sucesso — log canônico
      // eslint-disable-next-line no-console
      console.error(
        JSON.stringify({
          event: 'account_activated',
          account_id: accountId,
          user_id: userId ?? null,
          latency_ms: latency,
          timestamp: new Date().toISOString(),
          request_id: requestId,
          ip,
        })
      );

      // Sem payload do adapter, usamos o slug calculado localmente
      redirect(`/a/${slug}`);
    } else {
      // Falha lógica sem exceção (retorno false)
      // eslint-disable-next-line no-console
      console.error(
        JSON.stringify({
          event: 'account_activate_failed',
          error: 'adapter_returned_false',
          account_id: accountId,
          user_id: userId ?? null,
          latency_ms: latency,
          timestamp: new Date().toISOString(),
          request_id: requestId,
          ip,
        })
      );
      return { ok: false, error: 'Não foi possível ativar a conta. Tente novamente.' };
    }
  } catch (err: unknown) {
    const latency = Date.now() - t0;
    // eslint-disable-next-line no-console
    console.error(
      JSON.stringify({
        event: 'account_activate_failed',
        error: err instanceof Error ? err.message : String(err),
        latency_ms: latency,
        timestamp: new Date().toISOString(),
        request_id: requestId,
        ip,
      })
    );
    return { ok: false, error: 'Não foi possível ativar a conta. Tente novamente.' };
  }
}
