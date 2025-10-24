"use client";

import React, { useMemo, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useUserAccounts } from "./useUserAccounts";
import { useAccessContext } from "@/providers/AccessProvider";

/**
 * AccountSwitcher — corrigido para exibir lista de contas
 * Ajustes aplicados:
 * 1. Logs de debug temporários para diagnóstico
 * 2. Exibição forçada de "Carregando" quando data=null
 * 3. CSS com min-w-0 e fallback de nome (accountName || accountSubdomain)
 * 4. Lógica de ocultação ajustada (só após loading completo)
 */
export function AccountSwitcher() {
  const router = useRouter();
  const { account } = useAccessContext() || {};
  const [open, setOpen] = useState(false);
  const [hideTrigger, setHideTrigger] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const btnRef = useRef<HTMLButtonElement | null>(null);

  const menuId = "account-switcher-menu";
  const btnId = "account-switcher-trigger";

  const openedAtRef = useRef<number | null>(null);

  const { data, loading, error, refetch } = useUserAccounts(open);
  const list = useMemo(() => data ?? [], [data]);

  const [focusIndex, setFocusIndex] = useState<number>(-1);
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);

  React.useEffect(() => {
    if (open) {
      console.log('AccountSwitcher state:', {
        open,
        loading,
        error: error || null,
        dataIsNull: data === null,
        listLength: list.length,
        hideTrigger,
        firstAccount: list[0] ? {
          name: list[0].accountName,
          subdomain: list[0].accountSubdomain,
          status: list[0].accountStatus
        } : null
      });
    }
  }, [open, loading, error, data, list, hideTrigger]);

  const isDisabledAt = useCallback(
    (idx: number) => {
      const acc = list[idx];
      if (!acc) return true;
      const clickable =
        acc.accountStatus === "active" || acc.accountStatus === "pending_setup";
      const memberOk = acc.memberStatus === "active";
      return !(clickable && memberOk);
    },
    [list]
  );

  const disabledReasonAt = useCallback(
    (idx: number): string | undefined => {
      const acc = list[idx];
      if (!acc) return undefined;
      if (acc.memberStatus !== "active") {
        if (acc.memberStatus === "pending") return "Convite pendente — aguarde aprovação.";
        if (acc.memberStatus === "revoked") return "Acesso revogado — contate o administrador.";
        return "Membro inativo — contate o administrador.";
      }
      if (acc.accountStatus === "inactive") return "Conta inativa — reative pelo suporte.";
      if (acc.accountStatus === "suspended") return "Conta suspensa — acesso temporariamente bloqueado.";
      return undefined;
    },
    [list]
  );

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
        btnRef.current?.focus();
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        btnRef.current?.focus();
      }
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  React.useEffect(() => {
    if (open) {
      openedAtRef.current = performance.now();
      console.error(JSON.stringify({ 
        event: "account_switcher_open", 
        scope: "ui", 
        timestamp: new Date().toISOString() 
      }));

      if (!loading && !error && list.length > 0) {
        const activeIdx = list.findIndex((a) => a.accountSubdomain === account?.subdomain);
        const start = activeIdx >= 0 ? activeIdx : -1;
        const first = start >= 0 && !isDisabledAt(start) ? start : findNextEnabled(start, 1);
        setFocusIndex(first);
        setTimeout(() => {
          if (first >= 0 && itemRefs.current[first]) itemRefs.current[first]?.focus();
        }, 0);
      } else {
        setFocusIndex(-1);
      }
    } else {
      openedAtRef.current = null;
      setFocusIndex(-1);
    }
  }, [open, loading, error, list, account?.subdomain, findNextEnabled, isDisabledAt]);

  React.useEffect(() => {
    if (data !== null && !loading) {
      const shouldHide = list.length <= 1;
      setHideTrigger(shouldHide);
      if (shouldHide && open) setOpen(false);
    }
  }, [data, loading, list.length, open]);

  const onMenuKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!open || loading || error || list.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      const next = focusIndex < 0 ? findNextEnabled(-1, 1) : findNextEnabled(focusIndex, 1);
      if (next >= 0) {
        setFocusIndex(next);
        itemRefs.current[next]?.focus();
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const prev = focusIndex < 0 ? findNextEnabled(list.length, -1) : findNextEnabled(focusIndex, -1);
      if (prev >= 0) {
        setFocusIndex(prev);
        itemRefs.current[prev]?.focus();
      }
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (focusIndex >= 0 && !isDisabledAt(focusIndex)) handleSelect(focusIndex);
    } else if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
      btnRef.current?.focus();
    }
  };

  const handleSelect = (idx: number) => {
    const acc = list[idx];
    if (!acc) return;

    const t0 = openedAtRef.current ?? performance.now();
    const latency = Math.max(0, performance.now() - t0);
    console.error(JSON.stringify({
      event: "account_selected",
      scope: "ui",
      account_id: acc.accountId,
      account_subdomain: acc.accountSubdomain,
      latency_ms: Math.round(latency),
      timestamp: new Date().toISOString(),
    }));

    setOpen(false);
    router.push(`/a/${acc.accountSubdomain}`);
  };

  const handleCreate = () => {
    console.error(JSON.stringify({ 
      event: "create_account_click", 
      scope: "ui", 
      timestamp: new Date().toISOString() 
    }));
    setOpen(false);
    router.push("/a/home?consultive=1");
  };

  if (hideTrigger) return null;

  return (
    <div className="relative inline-block text-left">
      <button
        id={btnId}
        ref={btnRef}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        className="w-full select-none rounded-xl px-3 py-2 text-sm hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring/40"
      >
        Trocar conta
      </button>

      {open && (
        <div
          id={menuId}
          ref={menuRef}
          role="menu"
          aria-label="Minhas contas"
          aria-labelledby={btnId}
          tabIndex={-1}
          onKeyDown={onMenuKeyDown}
          className="absolute right-0 mt-2 w-80 origin-top-right rounded-2xl border bg-popover p-2 shadow-lg z-50"
        >
          <div className="px-2 py-1.5 text-xs text-muted-foreground">Minhas contas</div>

          {(loading || (!error && list.length === 0 && data === null)) && (
            <div className="px-3 py-2 text-sm text-muted-foreground animate-pulse" aria-live="polite">
              Carregando contas…
            </div>
          )}

          {error && (
            <div className="px-2 py-2" aria-live="polite">
              <div className="mb-2 text-sm text-red-500">Falha ao carregar.</div>
              <button
                onClick={() => refetch()}
                className="rounded-lg bg-secondary px-3 py-1.5 text-sm hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-ring/40"
              >
                Tentar novamente
              </button>
            </div>
          )}

          {!loading && !error && data !== null && list.length > 0 && (
            <div className="max-h-72 overflow-auto">
              {list.map((acc, idx) => {
                const isActive = acc.accountSubdomain === account?.subdomain;
                const disabled = isDisabledAt(idx);
                const reason = disabledReasonAt(idx);

                const statusClass =
                  acc.accountStatus === "active"
                    ? "bg-emerald-500/10 text-emerald-600 border-emerald-600/20"
                    : acc.accountStatus === "pending_setup"
                    ? "bg-amber-500/10 text-amber-600 border-amber-600/20"
                    : acc.accountStatus === "inactive"
                    ? "bg-slate-500/10 text-slate-600 border-slate-600/20"
                    : "bg-rose-500/10 text-rose-600 border-rose-600/20";

                return (
                  <button
                    key={acc.accountId}
                    ref={(el) => { itemRefs.current[idx] = el; }}
                    role="menuitem"
                    aria-current={isActive ? "true" : undefined}
                    aria-disabled={disabled ? true : undefined}
                    disabled={disabled}
                    onClick={() => { if (!disabled) handleSelect(idx); }}
                    title={disabled ? reason : undefined}
                    className={[
                      "w-full min-w-0 text-left px-3 py-2 rounded-xl text-sm flex items-center justify-between gap-2",
                      "hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring/40",
                      disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
                      isActive ? "font-semibold text-primary" : "",
                    ].join(" ")}
                  >
                    <span className="truncate min-w-0 flex-1">
                      {acc.accountName || acc.accountSubdomain || 'Sem nome'}
                    </span>
                    <span
                      className={[
                        "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium shrink-0",
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
