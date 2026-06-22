import { notFound } from 'next/navigation';
import { AdminPlaceholderPage } from '@/components/admin/AdminPlaceholderPage';
import { getAdminArea } from '@/components/admin/adminNavigation';

export default function AdminAuditPage() {
  const area = getAdminArea('/admin/auditoria');

  if (!area) {
    notFound();
  }

  return <AdminPlaceholderPage area={area} />;
}
