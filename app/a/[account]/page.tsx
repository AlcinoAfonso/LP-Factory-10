// app/a/[account]/page.tsx
'use client';

import { useMemo } from 'react';
import { useAccessContext } from '@/providers/AccessProvider';
import AlertBanner from '@/components/ui/AlertBanner';

type DashState = 'auth' | 'onboarding' | 'public';

export default function Page({ params }: { params: { account: string } }) {
  const ctx = useAccessContext() as any;

  const isHome = params.account === 'home';
  const hasCtx = Boolean(ctx?.account || ctx?.member);

  const state: DashState = useMemo(() => {
    if (isHome && !hasCtx) return 'onboarding';
    if (hasCtx) return 'auth';
    return 'public';
  }, [isHome, hasCtx]);

  const role = ctx?.member?.role ?? '—';
  const accountName = ctx?.account?.name ?? params.account;
  const accountSlug = ctx?.account?.subdomain ?? params.account;
  const accountId = ctx?.account?.id as string | undefined;
  const memberStatus = ctx?.member?.status ?? '—';

  const accountStatus = ctx?.account?.status as
    | 'active'
    | 'inactive'
    | 'suspended'
    | 'pending_setup'
    | 'trial'
    | undefined;

  const showSetupBanner = state === 'auth' && accountStatus === 'pending_setup';

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-3xl font-semibold">Account Dashboard</h1>

      {/* Banner de setup apenas enquanto a conta estiver em pending_setup */}
      {showSetupBanner && (
        <AlertBanner
          type="info"
          title="Defina o nome da sua conta"
          description="Você pode alterá-lo quando quiser. Ao salvar, sua conta será ativada."
          actionLabel="Salvar nome da conta"
          fields={[
            { name: 'name', type: 'text', placeholder: 'Nome da conta', required: true, minLength: 3 },
            { name: 'account_id', type: 'hidden', defaultValue: accountId },
          ]}
          onSubmit={async (fd) => {
            const { renameAccountAction } = await import('./actions');
            await renameAccountAction(undefined, fd);
          }}
        />
      )}

      {state === 'auth' && (
        <DashboardAuthenticated
          accountName={accountName}
          accountId={accountId}
          accountSlug={accountSlug}
          role={role}
          memberStatus={memberStatus}
        />
      )}

      {state === 'onboarding' && <DashboardOnboarding />}

      {state === 'public' && <DashboardPublic />}
    </main>
  );
}

/* ===================== Components ===================== */

function DashboardAuthenticated({
  accountName,
  accountId,
  accountSlug,
  role,
  memberStatus,
}: {
  accountName?: string;
  accountId?: string;
  accountSlug?: string;
  role?: string;
  memberStatus?: string;
}) {
  return (
    <div className="mt-4 grid gap-2 text-sm text-gray-700">
      <div>
        <span className="font-medium">Conta: </span>
        {accountName ?? '—'} <span className="text-gray-500">({accountId ?? '—'})</span>
      </div>
      <div>
        <span className="font-medium">Slug: </span>
        {accountSlug ?? '—'}
      </div>
      <div>
        <span className="font-medium">Papel: </span>
        {role ?? '—'}
      </div>
      <div>
        <span className="font-medium">Status membro: </span>
        {memberStatus ?? '—'}
      </div>
    </div>
  );
}

function DashboardOnboarding() {
  return (
    <div className="mt-4 space-y-3 text-gray-700">
      <p>Bem-vindo! Vamos criar sua primeira conta para começar.</p>
      <a
        href="/a/home?modal=new"
        className="inline-flex items-center rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50"
      >
        Criar primeira conta
      </a>
    </div>
  );
}

function DashboardPublic() {
  return (
    <p className="mt-2 text-gray-600">
      Use os botões no topo para entrar ou criar sua conta.
    </p>
  );
}
