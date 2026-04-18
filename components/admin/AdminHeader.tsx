import Link from 'next/link';
import { AdminUserMenu } from '@/components/admin/AdminUserMenu';

type AdminHeaderProps = {
  userEmail?: string | null;
};

export function AdminHeader({ userEmail }: AdminHeaderProps) {
  return (
    <header className="border-b border-border bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/85">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link
          href="/admin"
          aria-label="Ir para o Admin Dashboard"
          className="inline-flex items-center rounded-md border border-brand-600/20 bg-brand-50 px-2.5 py-1 text-sm font-semibold tracking-wide text-brand-700 transition-colors hover:border-brand-600/35 hover:bg-brand-50/70"
        >
          LP Factory Administrativo
        </Link>

        {userEmail ? <AdminUserMenu userEmail={userEmail} /> : null}
      </div>
    </header>
  );
}
