// components/features/account-switcher/AccountSwitcherList.tsx
"use client";

import * as React from "react";
import { createPortal } from "react-dom";

export type AccountItem = {
  accountId: string;
  accountName: string | null;
  accountSubdomain: string;
  accountStatus: string;
  memberStatus: string;
};

export type AccountSwitcherListProps = {
  /** Lista de contas carregadas */
  list: AccountItem[];
  /** Índice de foco atual */
  focusIndex: number;
  /** Refs de itens (para foco controlado) */
  itemRefs: React.MutableRefObject<(HTMLButtonElement | null)[]>;
  /** Flags de carregamento/erro */
  loading: boolean;
  error: string | null;
  /** Handlers externos */
  onRetry: () => void;
  onSelect: (idx: number) => void;
  onCreate: () => void;
  /** Controle de popover */
  open: boolean;
  popRef: React.RefObject<HTMLDivElement>;
  pos: { top: number; leftCenter: number } | null;
  /** IDs e labels de acessibilidade */
  menuId?: string;
  labelledBy?: string;
};

/** Somente UI — sem lógica de estado/navegação */
export function AccountSwitcherList({
  list,
  focusIndex,
  itemRefs,
  loading,
  error,
  onRetry,
  onSelect,
  onCreate,
  open,
  popRef,
  pos,
  menuId = "account-switcher-menu",
  labelledBy = "account-switcher-trigger",
}: AccountSwitcherListProps) {
  if (!open || !pos) return null;

  return createPortal(
    <div
      ref={popRef}
      id={menuId}
      role="menu"
      aria-label="Minhas contas"
      aria-labelledby={labelledBy}
      tabIndex={-1}
      style={{
        position: "fixed",
        top: pos.top,
        left: pos.leftCenter,
        transform: "translateX(-50%)",
        zIndex: 60,
      }}
      className="w-80 rounded-2xl border border-border bg-popover p-2 shadow-lg"
    >
      <div className="px-2 py-1.5 text-xs text-muted-foreground">Minhas contas</div>

      {loading && (
        <div className="px-3 py-2 text-sm text-muted-foreground" aria-live="polite">
          Carregando contas…
        </div>
      )}

      {error && (
        <div className="px-2 py-2" aria-live="polite">
          <div className="mb-2 text-sm text-state-error">Falha ao carregar.</div>
          <button
            type="button"
            onClick={onRetry}
            className="rounded-lg bg-secondary px-3 py-1.5 text-sm hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-ring/40"
          >
            Tentar novamente
          </button>
        </div>
      )}

      {!loading && !error && list.length > 0 && (
        <div className="max-h-72 overflow-auto pr-1">
          {list.map((acc, idx) => {
            const disabled = acc.memberStatus !== "active";
            const displayName =
              acc.accountName ?? acc.accountSubdomain ?? "(sem nome)";
            const status = acc.accountStatus as string;

            const statusClass =
              status === "active"
                ? "bg-state-success/10 text-state-success border-state-success/20"
                : status === "pending_setup"
                ? "bg-state-warning/10 text-state-warning border-state-warning/25"
                : status === "inactive"
                ? "bg-muted text-muted-foreground border-border"
                : "bg-state-error/10 text-state-error border-state-error/20";

            return (
              <button
                key={acc.accountId}
                ref={(el) => {
                  itemRefs.current[idx] = el;
                }}
                type="button"
                role="menuitem"
                aria-disabled={disabled}
                disabled={disabled}
                onPointerDown={(e) => {
                  if (!disabled) {
                    e.preventDefault();
                    onSelect(idx);
                  }
                }}
                className={[
                  "w-full px-3 py-2 rounded-xl text-sm grid grid-cols-[1fr_auto] items-center gap-2",
                  "hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring/40",
                  disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
                  focusIndex === idx ? "font-semibold" : "",
                ].join(" ")}
              >
                <span className="truncate leading-tight text-popover-foreground">
                  {displayName}
                </span>
                <span
                  className={[
                    "justify-self-end inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium shrink-0",
                    statusClass,
                  ].join(" ")}
                >
                  {status}
                </span>
              </button>
            );
          })}
        </div>
      )}

      <div className="my-2 h-px bg-border" />

      <button
        type="button"
        role="menuitem"
        onClick={onCreate}
        className="w-full rounded-xl px-3 py-2 text-left text-sm text-popover-foreground hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring/40"
      >
        Criar outra conta
      </button>
    </div>,
    document.body
  );
}

export default AccountSwitcherList;
