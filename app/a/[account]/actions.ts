'use server';
import 'server-only';

import { redirect } from 'next/navigation';
import { headers } from 'next/headers';

import { accountAdapter } from 'src/lib/access/adapters/accountAdapter';

// Tipagem simples para resposta da Action (para uso opcional na UI)
export type RenameAccountState = {
  ok: boolean;
  error?: string;
};

// Util: slugificar nome da conta seguindo padrão acc-*
function slugifyName(input: string): string {
  const base = input
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

  // fallback mínimo para evitar slug vazio
  return base.length > 0 ? base : 'acc';
}

// Validação mínima conforme Base Técnica (camada UI não fala com DB)
function validateName(name: unknown): string {
  const trimmed = (name ?? '').toString().trim();
  if (trimmed.length < 3) {
    throw new Error('invalid_name_length');
  }
  return trimmed;
}

// Server Action: renomeia e ativa a conta (pending_setup → active)
// Fluxo: valida -> gera slug -> chama adapter -> loga -> redirect
export async function renameAccountAction(
  _prevState: RenameAccountState | undefined,
  formData: FormData
): Promise<RenameAccountState> {
  const t0 = Date.now();

  // Captura de contexto para logs
  const hdrs = headers();
  const requestId = hdrs.get('x-vercel-id') ?? hdrs.get('x-request-id') ?? null;
  const ip = hdrs.get('x-forwarded-for') ?? null;

  try {
    const accountId = formData.get('account_id')?.toString() ?? '';
    const userId = formData.get('user_id')?.toString() ?? undefined; // opcional para log
    const name = validateName(formData.get('name'));
    const slug = slugifyName(name);

    if (!accountId) {
      throw new Error('missing_account_id');
    }

    // Chama o adapter (server-only via service.ts, mantendo RLS/Grants)
    const updated = await accountAdapter.renameAndActivate(accountId, name, slug);

    const latency = Date.now() - t0;

    // Observabilidade essencial (JSON line) — sucesso
    // event: account_activated (Base Técnica §5.7)
    // Campos: event, account_id, user_id, latency_ms, timestamp, request_id, ip
    // eslint-disable-next-line no-console
    console.error(
      JSON.stringify({
        event: 'account_activated',
        account_id: updated?.id ?? accountId,
        user_id: userId ?? null,
        latency_ms: latency,
        timestamp: new Date().toISOString(),
        request_id: requestId,
        ip,
      })
    );

    // Redireciona para o slug final (o adapter pode normalizar/ajustar)
    const finalSlug = updated?.slug ?? slug;
    redirect(`/a/${finalSlug}`);
  } catch (err: unknown) {
    const latency = Date.now() - t0;

    // Observabilidade essencial (JSON line) — falha
    // event: account_activate_failed (canônico)
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

    // Mensagem neutra para UI (sem detalhes técnicos)
    return {
      ok: false,
      error: 'Não foi possível ativar a conta. Tente novamente.',
    };
  }
}
