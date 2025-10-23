// components/features/account-switcher/AccountSwitcher.tsx
"use client";

import React, { useMemo, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useUserAccounts } from "./useUserAccounts";
import { useAccessContext } from "@/providers/AccessProvider";

/**
 * AccountSwitcher
 * - Lista contas do usuário (ordenação vem do servidor).
 * - Destaque da conta ativa e chip de status.
 * - Oculta "Trocar conta" se só houver uma conta.
 * - Interações: clique, teclado (↑/↓/Enter/ESC), fechar ao clicar fora.
 * - Telemetria leve via console.
 */
export function AccountSwitcher() {
  const router = useRouter();
  const { account } = useAccessContext() || {};
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const btnRef = useRef<HTMLButtonElement | null>(null);

  // Telemetria: medir latência desde open até seleção
  const openedAtRef = useRef<number | null>(null);

  // Carrega apenas quando o menu abre
  const { data, loading, error, refetch } = useUserAccounts(open);
  const list = useMemo(() => data ?? [], [data]);

  // Índice focado para navegação por teclado
  const [focusIndex, setFocusIndex] = useState<number>(-1);
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);

  // Util: checar se item está desabilitado
  const isDisabledAt = useCallback(
    (idx: number) => {
      const acc = list[idx];
      if (!acc) return true;
      return acc.accountStatus === "inactive" || acc.accountStatus === "suspended";
    },
    [list]
  );

  // Encontrar próximo índice habilitado (sentido +1 / -1)
  const findNextEnabled = useCallback(
    (start: number, dir: 1 | -1) => {
      if (!list.length) return -1;
      let i = start;
      for (let k = 0; k < list.length; k++) {
        i = (i + dir + list.length) % list.length;
        if (!isDisabledAt(i)) return i;
      }
      return -1;
    },
    [list, isDisabledAt]
  );

  // Fechar ao clicar fora / ESC
  React.useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      const t = e.target as Node | null;
      if (
        menuRef.current &&
        !menuRef.current.contains(t!) &&
        btnRef.current &&
        !btnRef.current.contains(t!)
      ) {
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

  // Ao abrir: telemetria + foco inicial (primeiro item habilitado)
  React.useEffect(() => {
    if (open) {
      openedAtRef.current = performance.now();
      // eslint-disable-next-line no-console
      console.log(
        JSON.stringify({
          event: "account_switcher_open",
          timestamp: new Date().toISOString(),
        })
      );

      if (!loading && !error && list.length > 0) {
        const start = Math.max(
          0,
          list.findIndex((acc) => acc.accountSubdomain === account?.subdomain)
        );
        const first = isDisabledAt(start) ? findNextEnabled(start, 1) : start;
        setFocusIndex(first);
        setTimeout(() => {
          if (first >= 0 && itemRefs.current[first]) {
            itemRefs.current[first]?.focus();
          }
        }, 0);
      } else {
        setFocusIndex(-1);
      }
    } else {
      openedAtRef.current = null;
      setFocusIndex(-1);
    }
  }, [open, loading, error, list, account?.subdomain, findNextEnabled, isDisabledAt]);

  // Handler de teclado dentro do menu
  const onMenuKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!open || loading || error || list.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      const next =
        focusIndex < 0 ? findNextEnabled(-1, 1) : findNextEnabled(focusIndex, 1);
      if (next >= 0) {
        setFocusIndex(next);
        itemRefs.current[next]?.focus();
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const prev =
        focusIndex < 0 ? findNextEnabled(list.length, -1) : findNextEnabled(focusIndex, -1);
      if (prev >= 0) {
        setFocusIndex(prev);
        itemRefs.current[prev]?.focus();
      }
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (focusIndex >= 0 && !isDisabledAt(focusIndex)) {
        handleSelect(focusIndex);
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
      btnRef.current?.focus();
    }
  };

  // Seleção de item (clique/Enter)
  const handleSelect = (idx: number) => {
    const acc = list[idx];
    if (!acc) return;

    const t0 = openedAtRef.current ?? performance.now();
    const latency = Math.max(0, performance.now() - t0);
    // eslint-disable-next-line no-console
    console.log(
      JSON.stringify({
        event: "account_selected",
        account_id: acc.accountId,
        account_subdomain: acc.accountSubdomain,
        latency_ms: Math.round(latency),
        timestamp: new Date().toISOString(),
      })
    );

    setOpen(false);
    router.push(`/a/${acc.accountSubdomain}`);
  };

  // Criar nova conta
  const handleCreate = () => {
    // eslint-disable-next-line no-console
    console.log(
      JSON.stringify({
        event: "create_account_click",
        timestamp: new Date().toISOString(),
      })
    );
    setOpen(false);
    router.push("/a/home?consultive=1");
  };

  // Se não há mais de 1 conta, não renderiza o switcher (C6.3)
  if (!loading && !error && list.length <= 1) return null;

  return (
    <div className="relative inline-block text-left">
      <button
        ref={btnRef}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="w-full select-none rounded-xl px-3 py-2 text-sm hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring/40"
      >
        Trocar conta
      </button>

      {open && (
        <div
          ref={menuRef}
          role="menu"
          aria-label="Minhas contas"
          tabIndex={-1}
          onKeyDown={onMenuKeyDown}
          className="absolute right-0 mt-2 w-72 origin-top-right rounded-2xl border bg-popover p-2 shadow-lg z-50"
        >
          <div className="px-2 py-1.5 text-xs text-muted-foreground">Minhas contas</div>

          {loading && (
            <div className="px-3 py-2 text-sm text-muted-foreground">
              Carregando contas…
            </div>
          )}

          {error && (
            <div className="px-2 py-2">
              <div className="mb-2 text-sm text-red-500">Falha ao carregar.</div>
              <button
                onClick={() => refetch()}
                className="rounded-lg bg-secondary px-3 py-1.5 text-sm hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-ring/40"
              >
                Tentar novamente
              </button>
            </div>
          )}

          {!loading && !error && (
            <div className="max-h-72 overflow-auto">
              {list.map((acc, idx) => {
                const isActive = acc.accountSubdomain === account?.subdomain;
                const isDisabled =
                  acc.accountStatus === "inactive" || acc.accountStatus === "suspended";

                const statusClass =
                  acc.accountStatus === "active"
                    ? "bg-emerald-500/10 text-emerald-600 border-emerald-600/20"
                    : acc.accountStatus === "pending_setup"
                    ? "bg-amber-500/10 text-amber-600 border-amber-600/20"
                    : acc.accountStatus === "inactive"
                    ? "bg-slate-500/10 text-slate-600 border-slate-600/20"
                    : "bg-rose-500/10 text-rose-600 border-rose-600/20"; // suspended

                return (
                  <button
                    key={acc.accountId}
                    ref={(el) => {
                      itemRefs.current[idx] = el;
                    }}
                    role="menuitem"
                    disabled={isDisabled}
                    onClick={() => {
                      if (isDisabled) return;
                      handleSelect(idx);
                    }}
                    title={
                      isDisabled
                        ? "Conta indisponível (inactive/suspended)"
                        : undefined
                    }
                    className={[
                      "w-full text-left px-3 py-2 rounded-xl text-sm flex items-center justify-between gap-2",
                      "hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring/40",
                      isDisabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
                      isActive ? "font-semibold text-primary" : "",
                      focusIndex === idx ? "ring-2 ring-ring/40" : "",
                    ].join(" ")}
                  >
                    <span className="truncate">{acc.accountName}</span>
                    <span
                      className={[
                        "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium",
                        statusClass,
                      ].join(" ")}
                      aria-label={`status: ${acc.accountStatus}`}
                    >
                      {acc.accountStatus}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          <div className="my-2 h-px bg-border" />

          <button
            role="menuitem"
            onClick={handleCreate}
            className="w-full text-left px-3 py-2 rounded-xl text-sm hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring/40"
          >
            Criar outra conta
          </button>
        </div>
      )}
    </div>
  );
}
