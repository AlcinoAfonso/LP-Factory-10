// components/features/account-switcher/AccountSwitcher.tsx
"use client";

import React from "react";
import { useAccountSwitcher } from "./useAccountSwitcher";
import { AccountSwitcherTrigger } from "./AccountSwitcherTrigger";
import { AccountSwitcherList } from "./AccountSwitcherList";

export function AccountSwitcher() {
  const {
    // estado/controle
    open,
    toggleOpen,
    hideTrigger,

    // dados
    list,
    loading,
    error,
    refetch,

    // refs/posicionamento
    btnRef,
    popRef,
    itemRefs,
    pos,

    // ids
    menuId,
    btnId,

    // UX/A11y
    focusIndex,
    onMenuKeyDown,

    // ações
    handleSelect,
    handleCreate,
  } = useAccountSwitcher();

  // Não renderiza o switcher quando há 0 ou 1 conta
  if (hideTrigger) return null;

  return (
    <div className="relative inline-block text-left">
      <AccountSwitcherTrigger
        open={open}
        onToggle={toggleOpen}
        btnRef={btnRef as React.RefObject<HTMLButtonElement>}
        id={btnId}
        label="Trocar conta"
      />

      {/* contêiner invisível apenas para centralizar o onKeyDown do menu */}
      <div onKeyDown={onMenuKeyDown}>
        <AccountSwitcherList
          list={list}
          focusIndex={focusIndex}
          itemRefs={itemRefs}
          loading={loading}
          error={error}
          onRetry={refetch}
          onSelect={handleSelect}
          onCreate={handleCreate}
          open={open}
          popRef={popRef as React.RefObject<HTMLDivElement>}
          pos={pos}
          menuId={menuId}
          labelledBy={btnId}
        />
      </div>
    </div>
  );
}
