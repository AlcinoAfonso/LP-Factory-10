import { notFound } from 'next/navigation';
import { AdminPlaceholderPage } from '@/components/admin/AdminPlaceholderPage';
import { getAdminArea } from '@/components/admin/adminNavigation';

export default function AdminTemplatesPage() {
  const area = getAdminArea('/admin/templates');

  if (!area) {
    notFound();
  }

  return <AdminPlaceholderPage area={area} />;
}
