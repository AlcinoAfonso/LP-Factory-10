'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { LogoutButton } from '@/components/logout-button';
import { useAccessContext } from '@/providers/AccessProvider';

/**
 * Avatar / User Menu
 * - Mostra email e papel do usuário no topo (somente leitura)
 * - Ações: Perfil • Trocar conta • Criar outra conta • Sair
 * - Sem adapter novo (usa AccessProvider). Listagem de contas virá no E10.
 */
export function UserMenu() {
  const ctx = useAccessContext() as any;
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const btnRef = useRef<HTMLButtonElement | null>(null);

  const userEmail: string =
    (ctx?.user?.email as string | undefined) ??
    (ctx?.member?.email as string | undefined) ??
    '—';

  const userRole: string =
    (ctx?.member?.role as string | undefined) ?? '—';

  const accountName: string =
    (ctx?.account?.name as string | null) ??
    (ctx?.account?.subdomain as string | null) ??
    'Minha conta';

  const initials = useMemo(() => {
    const src = userEmail?.trim() || accountName?.trim() || '';
    const ch = src.charAt(0).toUpperCase();
    return /[A-Z0-9]/i.test(ch) ? ch : 'U';
  }, [userEmail, accountName]);

  // Fechar ao clicar fora
  useEffect(() => {
    function handleClickOutside(ev: MouseEvent) {
      if (!open) return;
      const t = ev.target as Node | null;
      if (menuRef.current && !menuRef.current.contains(t!) && btnRef.current && !btnRef.current.contains(t!)) {
        setOpen(false);
      }
    }
    function handleEsc(ev: KeyboardEvent) {
      if (ev.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [open]);

  return (
    <div className="relative">
      <button
        ref={btnRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-8 w-8 items-center justify-center rounded-full border text-sm font-medium hover:bg-gray-50"
        title={`${accountName}`}
      >
        {initials}
      </button>

      {open && (
        <div
          ref={menuRef}
          role="menu"
          aria-label="Menu do usuário"
          className="absolute right-0 z-50 mt-2 w-72 overflow-hidden rounded-lg border bg-white shadow-lg"
        >
          {/* Cabeçalho de identificação */}
          <div className="px-4 py-3">
            <div className="text-xs text-gray-500">Conta atual</div>
            <div className="truncate text-sm font-medium text-gray-900">{accountName}</div>
            <div className="mt-2 truncate text-sm text-gray-700">{userEmail}</div>
            <div className="text-xs text-gray-500">{userRole}</div>
          </div>
          <div className="h-px w-full bg-gray-100" />

          {/* Ações */}
          <nav className="p-1">
            <MenuItem href="/workspace/profile" onClick={() => setOpen(false)}>
              Perfil
            </MenuItem>
            <MenuItem href="/a/home" onClick={() => setOpen(false)}>
              Trocar conta
            </MenuItem>
            <MenuItem href="/a/home?consultive=1" onClick={() => setOpen(false)}>
              Criar outra conta
            </MenuItem>

            <div className="my-1 h-px w-full bg-gray-100" />

            <button
              onClick={() => setOpen(false)}
              className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm hover:bg-gray-50"
              role="menuitem"
            >
              <span>Sair</span>
              <LogoutButton />
            </button>
          </nav>
        </div>
      )}
    </div>
  );
}

/* Item padrão do menu */
function MenuItem({
  href,
  children,
  onClick,
}: {
  href: string;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      role="menuitem"
      className="flex w-full items-center rounded-md px-3 py-2 text-sm hover:bg-gray-50"
    >
      {children}
    </Link>
  );
}

export default UserMenu;
