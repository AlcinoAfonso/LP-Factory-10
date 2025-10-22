'use client';

import { useAccessContext } from '@/providers/AccessProvider';
import Link from 'next/link';
import { useState } from 'react';
import UserMenu from '@/components/layout/UserMenu';

type HeaderVariant = 'public' | 'authenticated' | 'account';

interface HeaderProps {
  userEmail?: string | null;
}

export function Header({ userEmail }: HeaderProps) {
  const ctx = useAccessContext();

  // Precedência: account > authenticated > public
  const variant = getVariant(ctx, userEmail);

  // Estados loading/error degradam para public
  if (!ctx && !userEmail) {
    return <HeaderPublic />;
  }

  switch (variant) {
    case 'account':
      return <HeaderAccount account={ctx.account!} />;
    case 'authenticated':
      return <HeaderAuthenticated userEmail={userEmail} />;
    case 'public':
    default:
      return <HeaderPublic />;
  }
}

function getVariant(
  ctx: Partial<any>,
  userEmail?: string | null
): HeaderVariant {
  if (ctx?.account?.subdomain) return 'account';
  if (userEmail) return 'authenticated';
  return 'public';
}

/* ==================== Variações ==================== */

function HeaderPublic() {
  const [showConsultive, setShowConsultive] = useState(false);

  return (
    <header className="border-b bg-white">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link
          href="/a/home"
          aria-label="Ir para início"
          className="text-sm font-semibold tracking-wide"
        >
          LP Factory
        </Link>

        <nav className="flex items-center gap-3">
          <Link
            href="/auth/login"
            className="rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50"
          >
            Entrar
          </Link>
          <button
            onClick={() => setShowConsultive(true)}
            aria-controls="consultive-modal"
            className="rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50"
          >
            Criar conta
          </button>
        </nav>
      </div>

      {/* Modal consultivo - implementar depois */}
      {showConsultive && <div id="consultive-modal">Consultive Modal (TODO)</div>}
    </header>
  );
}

function HeaderAuthenticated({ userEmail }: { userEmail?: string | null }) {
  return (
    <header className="border-b bg-white">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        {/* Esquerda: logo */}
        <Link
          href="/a/home"
          aria-label="Ir para início"
          className="text-sm font-semibold tracking-wide"
        >
          LP Factory
        </Link>

        {/* Direita: Avatar menu */}
        <nav className="flex items-center gap-3">
          <UserMenu />
        </nav>
      </div>
    </header>
  );
}

function HeaderAccount({
  account,
}: {
  account: {
    name?: string | null;
    subdomain?: string | null;
    status?: string | null;
  };
}) {
  const accountLabel = account?.name ?? account?.subdomain ?? 'Minha conta';

  return (
    <header className="border-b bg-white">
      <div className="mx-auto flex h-14 max-w-6xl items-center px-4">
        {/* Esquerda: logo */}
        <Link
          href="/a/home"
          aria-label="Ir para início"
          className="text-sm font-semibold tracking-wide"
        >
          LP Factory
        </Link>

        {/* Centro: espaço reservado para ações futuras */}
        <div className="flex-1" />

        {/* Direita: Conta + Status + Avatar menu */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-800">{accountLabel}</span>
            <StatusChip status={account?.status} />
          </div>
          <UserMenu />
        </div>
      </div>
    </header>
  );
}

/* ======= Auxiliar inline (chip de status) ======= */

function StatusChip({ status }: { status?: string | null }) {
  const st = (status ?? 'inactive').toString();

  const map: Record<string, { cls: string; label: string }> = {
    active: { cls: 'bg-green-100 text-green-700 border-green-200', label: 'active' },
    inactive: { cls: 'bg-gray-100 text-gray-700 border-gray-200', label: 'inactive' },
    suspended: { cls: 'bg-red-100 text-red-700 border-red-200', label: 'suspended' },
    pending_setup: { cls: 'bg-blue-100 text-blue-700 border-blue-200', label: 'pending_setup' },
    trial: { cls: 'bg-blue-100 text-blue-700 border-blue-200', label: 'trial' },
  };

  const fallback = { cls: 'bg-gray-100 text-gray-700 border-gray-200', label: st };
  const { cls, label } = map[st] ?? fallback;

  return (
    <span
      className={`rounded-full border px-2 py-0.5 text-xs leading-none ${cls}`}
      aria-label={`status da conta: ${label}`}
      title={`Status: ${label}`}
    >
      {label}
    </span>
  );
}
