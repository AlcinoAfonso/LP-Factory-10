// app/admin/layout.tsx
import { redirect } from 'next/navigation';
import { requireSuperAdmin } from '@/lib/access/guards';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { allowed, redirect: redirectTo } = await requireSuperAdmin();
  
  if (!allowed && redirectTo) {
    redirect(redirectTo);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <h1 className="text-xl font-semibold">Admin Dashboard</h1>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
