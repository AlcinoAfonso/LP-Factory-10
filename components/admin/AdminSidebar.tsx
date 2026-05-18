'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { adminAreas } from '@/components/admin/adminNavigation';
import { cn } from '@/lib/utils';

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden bg-white md:block md:min-h-[calc(100vh-3.5rem)] md:w-64 md:shrink-0 md:border-r">
      <nav aria-label="Navegação administrativa" className="sticky top-14 space-y-1 px-3 py-4">
        {adminAreas.map((area) => {
          const active = pathname === area.href;

          return (
            <Link
              key={area.href}
              href={area.href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex min-h-10 w-full items-center rounded-md px-3 py-2 text-sm font-medium transition-colors',
                active
                  ? 'bg-brand-50 text-brand-700'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              {area.title}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
