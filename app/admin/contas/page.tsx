import { notFound } from 'next/navigation';
import { AdminPlaceholderPage } from '@/components/admin/AdminPlaceholderPage';
import { getAdminArea } from '@/components/admin/adminNavigation';

export default function AdminAccountsPage() {
  const area = getAdminArea('/admin/contas');

  if (!area) {
    notFound();
  }

  return <AdminPlaceholderPage area={area} />;
}
