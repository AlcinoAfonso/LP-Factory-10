import { redirect } from 'next/navigation';
import { requirePlatformAdmin } from '@/lib/access/guards';
import { getUserEmail } from '@/lib/auth/authAdapter';
import { AdminHeader } from '@/components/admin/AdminHeader';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type AdminLayoutProps = {
  children: React.ReactNode;
};

export default async function AdminLayout({ children }: AdminLayoutProps) {
  const gate = await requirePlatformAdmin();

  if (!gate.allowed) {
    redirect(gate.redirect ?? '/auth/confirm/info');
  }

  const userEmail = await getUserEmail();

  return (
    <>
      <AdminHeader userEmail={userEmail} />
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </>
  );
}
