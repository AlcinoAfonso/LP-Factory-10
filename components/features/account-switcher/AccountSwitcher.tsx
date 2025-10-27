// components/features/account-switcher/AccountSwitcher.tsx
"use client";

import React, { useMemo, useRef, useState, useCallback, useLayoutEffect } from "react";
import { useRouter } from "next/navigation";
import { useUserAccounts } from "./useUserAccounts";
import { useAccessContext } from "@/providers/AccessProvider";

// Novos componentes (apresentação)
import { AccountSwitcherTrigger } from "./AccountSwitcherTrigger";
import { AccountSwitcherList } from "./AccountSwitcherList";

type Pos = { top: number; leftCenter: number };

export function AccountSwitcher() {
  const router = useRouter();
  const { account } = useAccessContext() || {};

  // ---------- estado & refs ----------
  const [open, setOpen] = useState(false);
  const [hideTrigger, setHideTrigger] = useState(false);

  const btnRef = useRef<HTMLButtonElement | null>(null);
  const popRef = useRef<HTMLDivElement | null>(null);
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const menuId = "account-switcher-menu";
  const btnId = "account-switcher-trigger";
  const openedAtRef = useRef<number | null>(null);

  // Carrega somente quando abrir
  const { data, loading, error, refetch } = useUserAccounts(open);
  const list = useMemo(() => data ?? [], [data]);

  const [focusIndex, setFocusIndex] = useState<number>(-1);
  const [pos, setPos] = useState<Pos | null>(null);

  // ---------- utilidades ----------
  const isDisabledAt = useCallback(
    (idx: number) => {
      const acc = list[idx];
      if (!acc) return true;

      // Tipagem canônica não inclui 'trial' → tratar em runtime
      const status = acc.accountStatus as unknown as string;
      const clickable =
        status === "active" || status === "pending_setup" || status === "trial";

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

  // ---------- efeitos: clique-fora / ESC ----------
  // Fechar fora/ESC — usa 'click' (não 'mousedown') + defer p/ não atropelar o onClick interno
  React.useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      const t = e.target as Node | null;
      // Defer: permite o handler do item executar antes
      setTimeout(() => {
        if (
          popRef.current && !popRef.current.contains(t!) &&
          btnRef.current && !btnRef.current.contains(t!)
        ) {
          setOpen(false);
          btnRef.current?.focus();
        }
      }, 0);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        btnRef.current?.focus();
      }
    };
    document.addEventListener("click", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("click", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // ---------- efeitos: foco inicial ----------
  React.useEffect(() => {
    if (open) {
      openedAtRef.current = performance.now();
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

  // ---------- efeitos: esconder trigger quando só há 1 conta ----------
  React.useEffect(() => {
    if (data !== null && !loading && !error) {
      const shouldHide = list.length <= 1;
      setHideTrigger(shouldHide);
      if (shouldHide && open) setOpen(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, loading, error, list.length, open]);

  // ---------- posicionamento do popover ----------
  const computePos = useCallback(() => {
    const b = btnRef.current?.getBoundingClientRect();
    if (!b) return;
    setPos({
      top: b.bottom + 8,
      leftCenter: b.left + b.width / 2,
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

  // ---------- teclado no contêiner ----------
  const onMenuKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!open || loading || error || list.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      const next = focusIndex < 0 ? findNextEnabled(-1, 1) : findNextEnabled(focusIndex, 1);
      if (next >= 0) { setFocusIndex(next); itemRefs.current[next]?.focus(); }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const prev = focusIndex < 0 ? findNextEnabled(list.length, -1) : findNextEnabled(focusIndex, -1);
      if (prev >= 0) { setFocusIndex(prev); itemRefs.current[prev]?.focus(); }
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (focusIndex >= 0 && !isDisabledAt(focusIndex)) handleSelect(focusIndex);
    } else if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
      btnRef.current?.focus();
    }
  };

  // ---------- seleção / navegação ----------
  const handleSelect = (idx: number) => {
    const acc = list[idx];
    if (!acc) return;

    const nextUrl = `/a/${acc.accountSubdomain}`;
    // Se já está na conta selecionada, apenas fecha
    if (typeof window !== "undefined" && window.location.pathname === nextUrl) {
      setOpen(false);
      return;
    }

    setOpen(false);
    router.push(nextUrl);

    // Fallback hard caso algo impeça a navegação client-side
    setTimeout(() => {
      if (typeof window !== "undefined" && window.location.pathname !== nextUrl) {
        window.location.assign(nextUrl);
      }
    }, 150);
  };

  // ---------- criar conta ----------
  const handleCreate = () => {
    setOpen(false);
    router.push("/a/home?consultive=1");
  };

  if (hideTrigger) return null;

  // ---------- render ----------
  return (
    <div className="relative inline-block text-left">
      <AccountSwitcherTrigger
        open={open}
        onToggle={() => setOpen((v) => !v)}
        btnRef={btnRef}
        id={btnId}
        label="Trocar conta"
      />

      <div
        // contêiner invisível apenas para keydown centralizado
        onKeyDown={onMenuKeyDown}
      >
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
          popRef={popRef}
          pos={pos}
          menuId={menuId}
          labelledBy={btnId}
        />
      </div>
    </div>
  );
}
