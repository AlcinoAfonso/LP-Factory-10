// components/features/account-switcher/AccountSwitcher.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useUserAccounts } from "./useUserAccounts";
import { useAccessContext } from "@/providers/AccessProvider";
import { Button } from "@/components/ui/button";

/**
 * AccountSwitcher
 * - Exibe lista de contas do usuário com destaque para a ativa.
 * - Oculta "Trocar conta" se só houver uma conta.
 * - Implementa dropdown leve sem dependência de shadcn/dropdown-menu.
 */
export function AccountSwitcher() {
  const router = useRouter();
  const { account } = useAccessContext() || {};
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const btnRef = useRef<HTMLButtonElement | null>(null);

  // Carrega apenas quando o menu abre
  const { data, loading, error, refetch } = useUserAccounts(open);

  // Fechar ao clicar fora
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      const t = e.target as Node | null;
      if (menuRef.current && !menuRef.current.contains(t!) && btnRef.current && !btnRef.current.contains(t!)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const list = useMemo(() => data ?? [], [data]);

  // Oculta "Trocar conta" se só houver 1 conta
  if (!loading && !error && list.length <= 1) return null;

  return (
    <div className="relative inline-block text-left">
      <Button
        ref={btnRef}
        variant="ghost"
        size="sm"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="w-full justify-between"
      >
        Trocar conta
      </Button>

      {open && (
        <div
          ref={menuRef}
          role="menu"
          aria-label="Minhas contas"
          className="absolute right-0 mt-2 w-64 origin-top-right rounded-2xl border bg-popover p-2 shadow-lg z-50"
        >
          <div className="px-2 py-1.5 text-xs text-muted-foreground">Minhas contas</div>

          {/* Estados */}
          {loading && (
            <div className="px-3 py-2 text-sm text-muted-foreground">Carregando contas…</div>
          )}

          {error && (
            <div className="px-2 py-2">
              <div className="text-sm text-red-500 mb-2">Falha ao carregar.</div>
              <Button variant="secondary" size="sm" onClick={() => refetch()}>
                Tentar novamente
              </Button>
            </div>
          )}

          {!loading && !error && (
            <div className="max-h-72 overflow-auto">
              {list.map((acc) => {
                const isActive = acc.accountSubdomain === account?.subdomain;
                const isDisabled =
                  acc.accountStatus === "inactive" || acc.accountStatus === "suspended";
                return (
                  <button
                    key={acc.accountId}
                    role="menuitem"
                    disabled={isDisabled}
                    onClick={() => {
                      if (isDisabled) return;
                      setOpen(false);
                      router.push(`/a/${acc.accountSubdomain}`);
                    }}
                    className={[
                      "w-full text-left px-3 py-2 rounded-xl text-sm flex items-center justify-between",
                      "hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring/40",
                      isDisabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
                      isActive ? "font-semibold text-primary" : ""
                    ].join(" ")}
                    title={
                      isDisabled ? "Conta indisponível (inactive/suspended)" : undefined
                    }
                  >
                    <span className="truncate">{acc.accountName}</span>
                    {isActive && <span className="text-xs">✓</span>}
                  </button>
                );
              })}
            </div>
          )}

          <div className="my-2 h-px bg-border" />

          <button
            role="menuitem"
            onClick={() => {
              setOpen(false);
              router.push("/a/home?consultive=1");
            }}
            className="w-full text-left px-3 py-2 rounded-xl text-sm hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring/40"
          >
            Criar outra conta
          </button>
        </div>
      )}
    </div>
  );
}
