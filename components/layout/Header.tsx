// components/layout/Header.tsx
'use client';

import { useAccessContext } from '@/providers/AccessProvider';
import Link from 'next/link';
import { useState } from 'react';

type HeaderVariant = 'public' | 'authenticated' | 'account';

interface HeaderProps {
  userEmail?: string | null;
}

export function Header({ userEmail }: HeaderProps) {
  const ctx = useAccessContext();
  
  // Precedência: account > authenticated > public
  const variant = getVariant(ctx, userEmail);
  
  // Estados loading/error degradam para public
  if (!ctx && !userEmail) {
    return <HeaderPublic />;
  }
  
  switch (variant) {
    case 'account':
      return <HeaderAccount userEmail={userEmail} account={ctx.account!} />;
    case 'authenticated':
      return <HeaderAuthenticated userEmail={userEmail} />;
    case 'public':
    default:
      return <HeaderPublic />;
  }
}

function getVariant(
  ctx: Partial<any>,
  userEmail?: string | null
): HeaderVariant {
  // Precedência clara
  if (ctx?.account?.subdomain) return 'account';
  if (userEmail) return 'authenticated';
  return 'public';
}

/* ==================== Variações ==================== */

function HeaderPublic() {
  const [showLogin, setShowLogin] = useState(false);
  const [showConsultive, setShowConsultive] = useState(false);
  
  return (
    <header className="border-b bg-white">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link 
          href="/a/home" 
          aria-label="Ir para início"
          className="text-sm font-semibold tracking-wide"
        >
          LP Factory
        </Link>
        
        <nav className="flex items-center gap-3">
          <button
            onClick={() => setShowLogin(true)}
            aria-controls="login-modal"
            className="rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50"
          >
            Entrar
          </button>
          <button
            onClick={() => setShowConsultive(true)}
            aria-controls="consultive-modal"
            className="rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50"
          >
            Criar conta
          </button>
        </nav>
      </div>
      
      {/* Modals - implementar depois */}
      {showLogin && <div>Login SULB Modal (TODO)</div>}
      {showConsultive && <div>Consultive Modal (TODO)</div>}
    </header>
  );
}

function HeaderAuthenticated({ userEmail }: { userEmail?: string | null }) {
  return (
    <header className="border-b bg-white">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link 
          href="/a/home" 
          aria-label="Ir para início"
          className="text-sm font-semibold tracking-wide"
        >
          LP Factory
        </Link>
        
        <nav className="flex items-center gap-3">
          <span className="text-sm text-gray-600">{userEmail}</span>
          <LogoutButtonPlaceholder />
        </nav>
      </div>
    </header>
  );
}

function HeaderAccount({ 
  userEmail, 
  account 
}: { 
  userEmail?: string | null; 
  account: any;
}) {
  return (
    <header className="border-b bg-white">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <Link 
            href="/a/home" 
            aria-label="Ir para início"
            className="text-sm font-semibold tracking-wide"
          >
            LP Factory
          </Link>
          <span className="text-sm text-gray-600">
            — {account.name ?? account.subdomain}
          </span>
          <span className="rounded-full border px-2 py-0.5 text-xs text-gray-600">
            /a/{account.subdomain}
          </span>
        </div>
        
        <nav className="flex items-center gap-3">
          <span className="text-sm text-gray-600">{userEmail}</span>
          <LogoutButtonPlaceholder />
        </nav>
      </div>
    </header>
  );
}

/* ==================== Placeholders ==================== */

function LogoutButtonPlaceholder() {
  return (
    <button 
      className="rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50"
      onClick={() => console.log('Logout TODO')}
    >
      Sair
    </button>
  );
}
