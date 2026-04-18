'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { LogoutButton } from '@/components/logout-button';

type AdminUserMenuProps = {
  userEmail?: string | null;
};

export function AdminUserMenu({ userEmail }: AdminUserMenuProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const btnRef = useRef<HTMLButtonElement | null>(null);

  const safeEmail = userEmail?.trim() || '—';

  const initials = useMemo(() => {
    const first = safeEmail.charAt(0).toUpperCase();
    return /[A-Z0-9]/i.test(first) ? first : 'U';
  }, [safeEmail]);

  useEffect(() => {
    function handleClickOutside(ev: MouseEvent) {
      if (!open) return;

      const target = ev.target as Node | null;

      if (
        menuRef.current &&
        !menuRef.current.contains(target) &&
        btnRef.current &&
        !btnRef.current.contains(target)
      ) {
        setOpen(false);
      }
    }

    function handleEscape(ev: KeyboardEvent) {
      if (ev.key === 'Escape') {
        setOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open]);

  return (
    <div className="relative">
      <button
        ref={btnRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Abrir menu do administrador"
        onClick={() => setOpen((value) => !value)}
        className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-brand-600/20 bg-brand-50 text-sm font-medium text-brand-700 transition-colors hover:bg-brand-50/70"
        title={safeEmail}
      >
        {initials}
      </button>

      {open ? (
        <div
          ref={menuRef}
          role="menu"
          aria-label="Menu do administrador"
          className="absolute right-0 z-50 mt-2 w-72 overflow-hidden rounded-lg border border-border bg-popover shadow-lg"
        >
          <div className="px-4 py-3">
            <div className="truncate text-sm font-medium text-popover-foreground">
              {safeEmail}
            </div>
            <div className="text-xs text-muted-foreground">platform_admin</div>
          </div>

          <div className="my-1 h-px w-full bg-border" />

          <div className="px-2 pb-2">
            <LogoutButton />
          </div>
        </div>
      ) : null}
    </div>
  );
}
