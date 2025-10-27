// components/features/account-switcher/AccountSwitcherTrigger.tsx
"use client";

import * as React from "react";

export type AccountSwitcherTriggerProps = {
  /** Estado de abertura do menu (controlado pelo container) */
  open: boolean;
  /** Alterna abertura/fechamento (controlado pelo container) */
  onToggle: () => void;
  /** Ref do botão para foco/posicionamento do popover */
  btnRef: React.RefObject<HTMLButtonElement>;
  /** ID do botão (usado por aria-labelledby no menu) */
  id?: string;
  /** Título/tooltip do botão */
  title?: string;
  /** Classe extra opcional */
  className?: string;
  /** Rótulo visível do botão (default: "Trocar conta") */
  label?: React.ReactNode;
};

export function AccountSwitcherTrigger({
  open,
  onToggle,
  btnRef,
  id = "account-switcher-trigger",
  title = "Trocar conta",
  className = "",
  label = "Trocar conta",
}: AccountSwitcherTriggerProps) {
  return (
    <button
      id={id}
      ref={btnRef}
      type="button"
      onClick={onToggle}
      aria-haspopup="menu"
      aria-expanded={open}
      aria-controls="account-switcher-menu"
      title={title}
      className={[
        "w-full select-none rounded-xl px-3 py-2 text-sm",
        "hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring/40",
        className,
      ].join(" ")}
    >
      {label}
    </button>
  );
}

export default AccountSwitcherTrigger;
