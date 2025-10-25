// components/features/account-switcher/AccountSwitcher.tsx
"use client";

import React, { useMemo, useRef, useState, useCallback, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { useUserAccounts } from "./useUserAccounts";
import { useAccessContext } from "@/providers/AccessProvider";

type Pos = { top: number; leftCenter: number };

export function AccountSwitcher() {
  const router = useRouter();
  const { account } = useAccessContext() || {};
  const [open, setOpen] = useState(false);
  const [hideTrigger, setHideTrigger] = useState(false);

  const btnRef = useRef<HTMLButtonElement | null>(null);
  const popRef = useRef<HTMLDivElement | null>(null);
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const menuId = "account-switcher-menu";
  const btnId = "account-switcher-trigger";
  const openedAtRef = useRef<number | null>(null);

  // ⚡ Carrega somente ao abrir
  const { data, loading, error, refetch } = useUserAccounts(open);
  const list = useMemo(() => data ?? [], [data]);

  const [focusIndex, setFocusIndex] = useState<number>(-1);
  const [pos, setPos] = useState<Pos | null>(null);

  const isDisabledAt = useCallback(
    (idx: number) => {
      const acc = list[idx];
      if (!acc) return true;
      const clickable =
        acc.accountStatus === "active" ||
        acc.accountStatus === "pending_setup" ||
        acc.accountStatus === "trial"; // tratar trial como ativo
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
      if (acc.accountStatus === "inactive")  return "Conta inativa — reative pelo suporte.";
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

  // ---- Fechar fora/ESC
  React.useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      const t = e.target as Node | null;
      if (
        popRef.current &&
        !popRef.current.contains(t!) &&
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

  // ---- Abertura: telemetria + foco
  React.useEffect(() => {
    if (open) {
      openedAtRef.current = performance.now();
      console.error(JSON.stringify({ event: "account_switcher_open", scope: "ui", timestamp: new Date().toISOString() }));

      if (!loading && !error && list.length > 0) {
        const activeIdx = list.findIndex((a) => a.accountSubdomain === account?.subdomain);
        const start = activeIdx >= 0 ? activeIdx : -1;
        const firstEnabled = start >= 0 && !isDisabledAt(start) ? start : findNextEnabled(start, 1);
        setFocusIndex(firstEnabled);
        setTimeout(() => {
          if (firstEnabled >= 0 && itemRefs.current[firstEnabled]) itemRefs.current[firstEnabled]?.focus();
        }, 0);
      } else {
        setFocusIndex(-1);
      }
    } else {
      openedAtRef.current = null;
      setFocusIndex(-1);
    }
  }, [open, loading, error, list, account?.subdomain, findNextEnabled, isDisabledAt]);

  // ---- Esconder trigger só após DATA REAL
  React.useEffect(() => {
    if (data !== null && !loading && !error) {
      const shouldHide = list.length <= 1;
      setHideTrigger(shouldHide);
      if (shouldHide && open) setOpen(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, loading, error, list.length, open]);

  // ---- Posicionamento FIXO (portal) centralizado ao botão
  const computePos = useCallback(() => {
    const b = btnRef.current?.getBoundingClientRect();
    if (!b) return;
    setPos({
      top: b.bottom + 8, // 8px abaixo do botão
      leftCenter: b.left + b.width / 2, // centro do botão
    });
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    computePos();
    const onScroll = () => computePos();
    const onResize = () => computePos();
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onResize);
    };
  }, [open, computePos]);

  // ---- Teclado no menu
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

  // ---- Seleção
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

  // ---- Criar
  const handleCreate = () => {
    console.error(JSON.stringify({ event: "create_account_click", scope: "ui", timestamp: new Date().toISOString() }));
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

      {open && pos &&
        createPortal(
          <div
            ref={popRef}
            id={menuId}
            role="menu"
            aria-label="Minhas contas"
            aria-labelledby={btnId}
            tabIndex={-1}
            onKeyDown={onMenuKeyDown}
            // ⬇️ Portal fixo e centralizado ao botão
            style={{
              position: "fixed",
              top: pos.top,
              left: pos.leftCenter,
              transform: "translateX(-50%)",
              zIndex: 60,
            }}
            className="w-80 rounded-2xl border bg-popover p-2 shadow-lg"
          >
            <div className="px-2 py-1.5 text-xs text-popover-foreground/80">Minhas contas</div>

            {loading && (
              <div className="px-3 py-2 text-sm text-popover-foreground/70" aria-live="polite">
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

            {!loading && !error && (
              <div className="max-h-72 overflow-auto pr-1">
                {list.map((acc, idx) => {
                  const isActive = acc.accountSubdomain === account?.subdomain;
                  const disabled = isDisabledAt(idx);
                  const reason = disabledReasonAt(idx);
                  const displayName = acc.accountName ?? acc.accountSubdomain ?? "(sem nome)";

                  const statusClass =
                    acc.accountStatus === "active" || acc.accountStatus === "trial"
                      ? "bg-emerald-500/10 text-emerald-600 border-emerald-600/20"
                      : acc.accountStatus === "pending_setup"
                      ? "bg-amber-500/10 text-amber-600 border-amber-600/20"
                      : acc.accountStatus === "inactive"
                      ? "bg-slate-500/10 text-slate-600 border-rose-600/20"
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
                        "w-full px-3 py-2 rounded-xl text-sm",
                        "grid grid-cols-[1fr_auto] items-center gap-2",
                        "hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring/40",
                        disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
                        isActive ? "font-semibold" : "",
                      ].join(" ")}
                    >
                      <span className="min-w-0 overflow-hidden truncate leading-tight text-popover-foreground">
                        {displayName}
                      </span>
                      <span
                        className={[
                          "justify-self-end inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium",
                          "shrink-0",
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
              className="w-full text-left px-3 py-2 rounded-xl text-sm hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring/40 text-popover-foreground"
            >
              Criar outra conta
            </button>
          </div>,
          document.body
        )}
    </div>
  );
}
