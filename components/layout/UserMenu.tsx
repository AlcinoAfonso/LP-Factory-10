'use client';

import { useEffect, useRef, useState } from 'react';
import { useUser } from '@supabase/auth-helpers-react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Link from 'next/link';
import { useAccessContext } from '@/providers/AccessProvider';

export default function UserMenu() {
  const supabase = createClientComponentClient();
  const user = useUser();
  const ctx = useAccessContext();

  const email = user?.email ?? '—';
  const role = ctx?.member?.role ?? '—';

  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  // Fechar com ESC e click fora
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    function onClick(e: MouseEvent) {
      if (!open) return;
      const t = e.target as Node;
      if (menuRef.current && !menuRef.current.contains(t) && btnRef.current && !btnRef.current.contains(t)) {
        setOpen(false);
      }
    }
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onClick);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onClick);
    };
  }, [open]);

  async function handleLogout() {
    await supabase.auth.signOut();
    // Redirect simples pós-logout (mantém fluxo SULB)
    window.location.href = '/auth/login';
  }

  return (
    <div className="relative">
      {/* Avatar (iniciais) */}
      <button
        ref={btnRef}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen(v => !v)}
        className="inline-flex h-8 w-8 select-none items-center justify-center rounded-full bg-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-300"
        title={email}
      >
        {email?.[0]?.toUpperCase() ?? 'U'}
      </button>

      {open && (
        <div
          ref={menuRef}
          role="menu"
          className="absolute right-0 mt-2 w-56 rounded-xl border bg-white shadow-md z-50 overflow-hidden"
        >
          {/* TOPO: email + papel (sem conta; sem separador visual) */}
          <div className="px-3 pt-3 pb-2">
            <div className="text-sm font-medium text-gray-900">{email}</div>
            <div className="text-xs text-gray-500">{role}</div>
          </div>

          <div className="mt-2">
            <Link
              href="/a/profile"
              className="block px-3 py-2 text-sm hover:bg-gray-50"
              role="menuitem"
              onClick={() => setOpen(false)}
            >
              Perfil
            </Link>

            {/* Placeholder até E10 (AccountSwitcher) */}
            <button
              type="button"
              className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
              role="menuitem"
              onClick={() => {
                // futuro: abrir sublista de contas
                setOpen(false);
              }}
            >
              Trocar conta ▸
            </button>

            <Link
              href="/a/home?consultive=1"
              className="block px-3 py-2 text-sm hover:bg-gray-50"
              role="menuitem"
              onClick={() => setOpen(false)}
            >
              Criar outra conta
            </Link>

            <div className="my-1 border-t" />

            {/* Único “Sair” (sem LogoutButton duplicado) */}
            <button
              type="button"
              className="block w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-gray-50"
              role="menuitem"
              onClick={handleLogout}
            >
              Sair
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
