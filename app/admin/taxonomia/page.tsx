import { notFound } from 'next/navigation';
import { AdminPlaceholderPage } from '@/components/admin/AdminPlaceholderPage';
import { getAdminArea } from '@/components/admin/adminNavigation';

export default function AdminTaxonomyPage() {
  const area = getAdminArea('/admin/taxonomia');

  if (!area) {
    notFound();
  }

  return <AdminPlaceholderPage area={area} />;
}
