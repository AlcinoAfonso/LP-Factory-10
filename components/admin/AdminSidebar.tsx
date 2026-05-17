'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { adminAreas } from '@/components/admin/adminNavigation';
import { cn } from '@/lib/utils';

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="border-b border-border bg-white md:min-h-[calc(100vh-3.5rem)] md:w-64 md:shrink-0 md:border-b-0 md:border-r">
      <nav aria-label="Navegação administrativa" className="mx-auto flex max-w-6xl gap-2 overflow-x-auto px-4 py-3 md:sticky md:top-14 md:block md:max-w-none md:space-y-1 md:px-3 md:py-4">
        {adminAreas.map((area) => {
          const active = pathname === area.href;

          return (
            <Link
              key={area.href}
              href={area.href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'inline-flex min-h-10 shrink-0 items-center rounded-md px-3 py-2 text-sm font-medium transition-colors md:flex md:w-full',
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
