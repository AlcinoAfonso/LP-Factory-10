'use client';

import { useAccessContext } from '@/providers/AccessProvider';
import Link from 'next/link';
import UserMenu from '@/components/layout/UserMenu';

type HeaderVariant = 'public' | 'authenticated' | 'account';

interface HeaderProps {
  userEmail?: string | null;
}

export function Header({ userEmail }: HeaderProps) {
  const ctx = useAccessContext();

  const variant = getVariant(ctx, userEmail);

  if (!ctx && !userEmail) {
    return <HeaderPublic />;
  }

  switch (variant) {
    case 'account':
      return (
        <HeaderAccount
          account={ctx.account!}
          userEmail={userEmail ?? undefined}
          role={(ctx?.member?.role ?? undefined) as string | undefined}
        />
      );
    case 'authenticated':
      return <HeaderAuthenticated userEmail={userEmail} />;
    case 'public':
    default:
      return <HeaderPublic />;
  }
}

function getVariant(ctx: Partial<any>, userEmail?: string | null): HeaderVariant {
  if (ctx?.account?.subdomain) return 'account';
  if (userEmail) return 'authenticated';
  return 'public';
}

function BrandWordmark() {
  return (
    <Link
      href="/a/home"
      aria-label="Ir para início"
      className="inline-flex items-center rounded-md border border-brand-600/20 bg-brand-50 px-2.5 py-1 text-sm font-semibold tracking-wide text-brand-700 transition-colors hover:border-brand-600/35 hover:bg-brand-50/70"
    >
      LP Factory
    </Link>
  );
}

/* ==================== Variações ==================== */

function HeaderPublic() {
  return (
    <header className="border-b border-border bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/85">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <BrandWordmark />

        <nav className="flex items-center gap-3">
          <Link
            href="/auth/login"
            className="rounded-md border border-border bg-white px-3 py-1.5 text-sm text-foreground transition-colors hover:bg-accent"
          >
            Entrar
          </Link>

          <Link
            href="/auth/sign-up"
            className="rounded-md border border-brand-600/30 bg-brand-50 px-3 py-1.5 text-sm font-medium text-brand-700 transition-colors hover:bg-brand-50/70"
          >
            Criar conta
          </Link>
        </nav>
      </div>
    </header>
  );
}

function HeaderAuthenticated({ userEmail }: { userEmail?: string | null }) {
  return (
    <header className="border-b border-border bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/85">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <BrandWordmark />

        <nav className="flex items-center gap-3">
          <UserMenu userEmail={userEmail ?? undefined} />
        </nav>
      </div>
    </header>
  );
}

function HeaderAccount({
  account,
  userEmail,
  role,
}: {
  account: { name?: string | null; subdomain?: string | null; status?: string | null };
  userEmail?: string;
  role?: string;
}) {
  const accountLabel = account?.name ?? account?.subdomain ?? 'Minha conta';

  return (
    <header className="border-b border-border bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/85">
      <div className="mx-auto flex h-14 max-w-6xl items-center px-4">
        <BrandWordmark />

        <div className="flex-1" />

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm text-foreground">{accountLabel}</span>
            <StatusChip status={account?.status} />
          </div>
          <UserMenu userEmail={userEmail} userRole={role} />
        </div>
      </div>
    </header>
  );
}

/* ======= Auxiliar inline (chip de status) ======= */

function StatusChip({ status }: { status?: string | null }) {
  const st = (status ?? 'inactive').toString();

  const map: Record<string, { cls: string; label: string }> = {
    active: { cls: 'bg-state-success/10 text-state-success border-state-success/20', label: 'active' },
    inactive: { cls: 'bg-muted text-muted-foreground border-border', label: 'inactive' },
    suspended: { cls: 'bg-state-error/10 text-state-error border-state-error/20', label: 'suspended' },
    pending_setup: { cls: 'bg-brand-500/10 text-brand-700 border-brand-600/20', label: 'pending_setup' },
  };

  const fallback = { cls: 'bg-muted text-muted-foreground border-border', label: st };
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
