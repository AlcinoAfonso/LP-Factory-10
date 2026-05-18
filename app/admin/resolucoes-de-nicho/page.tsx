import { notFound } from 'next/navigation';
import { AdminPlaceholderPage } from '@/components/admin/AdminPlaceholderPage';
import { getAdminArea } from '@/components/admin/adminNavigation';

export default function AdminNicheResolutionsPage() {
  const area = getAdminArea('/admin/resolucoes-de-nicho');

  if (!area) {
    notFound();
  }

  return <AdminPlaceholderPage area={area} />;
}
