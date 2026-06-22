import { redirect } from 'next/navigation';
import { requirePlatformAdmin } from '@/lib/access/guards';
import { getUserEmail } from '@/lib/auth/authAdapter';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { AdminSidebar } from '@/components/admin/AdminSidebar';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type ProtectedAdminLayoutProps = {
  children: React.ReactNode;
};

export default async function ProtectedAdminLayout({
  children,
}: ProtectedAdminLayoutProps) {
  const gate = await requirePlatformAdmin();

  if (!gate.allowed) {
    if (gate.redirect === '/auth/login') {
      redirect('/auth/login?next=%2Fadmin%2Fcontas');
    }

    redirect(gate.redirect ?? '/auth/confirm/info');
  }

  const userEmail = await getUserEmail();

  return (
    <div className="min-h-screen bg-surface-app">
      <AdminHeader userEmail={userEmail} />
      <div className="mx-auto flex max-w-7xl flex-col md:flex-row">
        <AdminSidebar />
        <main className="w-full min-w-0 px-4 py-6 md:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
