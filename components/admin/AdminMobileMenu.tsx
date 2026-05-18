'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { adminAreas } from '@/components/admin/adminNavigation';
import { cn } from '@/lib/utils';

export function AdminMobileMenu() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const btnRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    function handleEscape(ev: KeyboardEvent) {
      if (ev.key === 'Escape') {
        setOpen(false);
      }
    }

    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  return (
    <div className="md:hidden">
      <button
        ref={btnRef}
        type="button"
        aria-label="Abrir navegação administrativa"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-white text-foreground transition-colors hover:bg-muted"
      >
        <span className="sr-only">Abrir navegação administrativa</span>
        <span aria-hidden="true" className="flex flex-col gap-1">
          <span className="h-0.5 w-4 rounded-full bg-current" />
          <span className="h-0.5 w-4 rounded-full bg-current" />
          <span className="h-0.5 w-4 rounded-full bg-current" />
        </span>
      </button>

      {open ? (
        <div className="fixed inset-x-0 top-14 z-40">
          <button
            type="button"
            aria-label="Fechar navegação administrativa"
            className="fixed inset-0 top-14 bg-foreground/20"
            onClick={() => setOpen(false)}
          />

          <div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label="Navegação administrativa"
            className="relative w-full border-b border-border bg-white px-4 py-3 shadow-lg"
          >
            <nav aria-label="Navegação administrativa" className="space-y-1">
              {adminAreas.map((area) => {
                const active = pathname === area.href;

                return (
                  <Link
                    key={area.href}
                    href={area.href}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'flex min-h-10 items-center rounded-md px-3 py-2 text-sm font-medium transition-colors',
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
          </div>
        </div>
      ) : null}
    </div>
  );
}
