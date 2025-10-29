// components/features/account-switcher/useAccountSwitcher.ts
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useUserAccounts } from "./useUserAccounts";
import { useAccessContext } from "@/providers/AccessProvider";

export type Pos = { top: number; leftCenter: number };

export function useAccountSwitcher() {
  const router = useRouter();
  const { account } = useAccessContext() || {};

  // ----- estado & refs -----
  const [open, setOpen] = React.useState(false);
  const [hideTrigger, setHideTrigger] = React.useState(false);

  const btnRef = React.useRef<HTMLButtonElement | null>(null);
  const popRef = React.useRef<HTMLDivElement | null>(null);
  const itemRefs = React.useRef<Array<HTMLButtonElement | null>>([]);

  const menuId = "account-switcher-menu";
  const btnId = "account-switcher-trigger";
  const openedAtRef = React.useRef<number | null>(null);

  // Carrega somente quando abrir
  const { data, loading, error, refetch } = useUserAccounts(open);
  const list = React.useMemo(() => data ?? [], [data]);

  // Contas elegíveis para troca (regra: membro ativo + conta active/pending_setup/trial)
  const eligible = React.useMemo(
    () =>
      list.filter(
        (a) =>
          a.memberStatus === "active" &&
          (a.accountStatus === "active" ||
            a.accountStatus === "pending_setup" ||
            a.accountStatus === "trial")
      ),
    [list]
  );

  const [focusIndex, setFocusIndex] = React.useState<number>(-1);
  const [pos, setPos] = React.useState<Pos | null>(null);

  // ----- utilidades (domínio) -----
  const isDisabledAt = React.useCallback(
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

  const disabledReasonAt = React.useCallback(
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

  const findNextEnabled = React.useCallback(
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

  // ----- efeitos: clique-fora / ESC -----
  // Usa 'click' (não 'mousedown') + defer para não atropelar o onPointerDown interno
  React.useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      const t = e.target as Node | null;
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

  // ----- efeitos: foco inicial -----
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

  // ----- efeitos: esconder trigger quando só há 1 conta elegível -----
  React.useEffect(() => {
    if (data !== null && !loading && !error) {
      const shouldHide = eligible.length <= 1;
      setHideTrigger(shouldHide);
      if (shouldHide && open) setOpen(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, loading, error, eligible.length, open]);

  // ----- posicionamento do popover -----
  const computePos = React.useCallback(() => {
    const b = btnRef.current?.getBoundingClientRect();
    if (!b) return;
    setPos({
      top: b.bottom + 8,
      leftCenter: b.left + b.width / 2,
    });
  }, []);

  React.useLayoutEffect(() => {
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

  // ----- teclado no contêiner -----
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

  // ----- seleção / navegação -----
  const handleSelect = (idx: number) => {
    const acc = list[idx];
    if (!acc) return;

    const nextUrl = `/a/${acc.accountSubdomain}`;
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

  // ----- criar conta -----
  const handleCreate = () => {
    setOpen(false);
    router.push("/a/home?consultive=1");
  };

  return {
    // estado/controle
    open,
    setOpen,
    toggleOpen: () => setOpen((v) => !v),
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
    disabledReasonAt,
    isDisabledAt,

    // ações
    handleSelect,
    handleCreate,
  };
}

export type UseAccountSwitcherReturn = ReturnType<typeof useAccountSwitcher>;
