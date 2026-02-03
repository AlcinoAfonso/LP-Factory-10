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

  const variant = getVariant(ctx);

  const role = ctx?.member?.role ?? null;
  const accountKey = ctx?.account?.subdomain ?? null;
  const accountName = ctx?.account?.name ?? null;
  const accountStatus = ctx?.account?.status ?? null;

  const safeUserEmail = userEmail ?? undefined;
  const safeUserRole = role ?? undefined;

  if (variant === 'public') {
    return (
      <header className="border-b bg-background">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <Link href="/" className="text-sm font-semibold">
            LP Factory
          </Link>

          <div className="flex items-center gap-2">
            <Link
              href="/auth/login"
              className="rounded-md border px-3 py-1.5 text-sm hover:bg-muted"
            >
              Entrar
            </Link>
            <Link
              href="/auth/sign-up"
              className="rounded-md bg-foreground px-3 py-1.5 text-sm text-background hover:opacity-90"
            >
              Criar conta
            </Link>
          </div>
        </div>
      </header>
    );
  }

  if (variant === 'authenticated') {
    return (
      <header className="border-b bg-background">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <Link href="/a/home" className="text-sm font-semibold">
            LP Factory
          </Link>

          <div className="flex items-center gap-2">
            <UserMenu userEmail={safeUserEmail} userRole={safeUserRole} />
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="border-b bg-background">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <div className="flex min-w-0 items-center gap-2">
          <Link href="/a/home" className="text-sm font-semibold">
            LP Factory
          </Link>

          <span className="text-muted-foreground">/</span>

          <Link
            href={accountKey ? `/a/${accountKey}` : '/a/home'}
            className="min-w-0 truncate text-sm font-medium"
            title={accountName ?? accountKey ?? undefined}
          >
            {accountName ?? accountKey ?? 'Conta'}
          </Link>

          <StatusChip status={accountStatus} />
        </div>

        <div className="flex items-center gap-2">
          <UserMenu userEmail={safeUserEmail} userRole={safeUserRole} />
        </div>
      </div>
    </header>
  );
}

function getVariant(ctx: any): HeaderVariant {
  if (!ctx?.user) return 'public';
  if (!ctx?.account) return 'authenticated';
  return 'account';
}

function StatusChip({ status }: { status?: string | null }) {
  const st = (status ?? 'inactive').toString();

  const map: Record<string, { cls: string; label: string }> = {
    active: { cls: 'bg-green-100 text-green-700 border-green-200', label: 'active' },
    inactive: { cls: 'bg-gray-100 text-gray-700 border-gray-200', label: 'inactive' },
    suspended: { cls: 'bg-red-100 text-red-700 border-red-200', label: 'suspended' },
    pending_setup: { cls: 'bg-blue-100 text-blue-700 border-blue-200', label: 'pending_setup' },
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
