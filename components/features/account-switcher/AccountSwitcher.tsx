// components/features/account-switcher/useUserAccounts.ts
// Client-only: obtém a lista de contas via GET /api/user/accounts com foco em performance:
// - Lazy load ao abrir o submenu
// - Cache em memória por aba com TTL
// - Debounce para evitar múltiplos fetches em aberturas rápidas
// - no-store + timeout + cancelamento para não “travar” a UI

"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type UserAccount = {
  accountId: string;
  accountName: string;
  accountSubdomain: string;
  accountStatus: "active" | "inactive" | "suspended" | "pending_setup";
  memberRole: "owner" | "admin" | "editor" | "viewer";
  memberStatus: "pending" | "active" | "inactive" | "revoked";
};

type ErrorCode =
  | "timeout"
  | "network_error"
  | "server_error"
  | "invalid_payload"
  | "unauthorized";

type FetchResult =
  | { ok: true; data: UserAccount[] }
  | { ok: false; error: ErrorCode };

async function fetchWithTimeout(
  input: RequestInfo,
  init: RequestInit = {},
  timeoutMs = 6000
): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(input, {
      ...init,
      signal: controller.signal,
      // Evita cache indevido do navegador
      cache: "no-store",
      headers: {
        ...(init.headers || {}),
        "cache-control": "no-store",
      },
    });
  } finally {
    clearTimeout(id);
  }
}

/** Leitura do endpoint server-only (RLS aplicada). */
export async function fetchUserAccounts(timeoutMs = 6000): Promise<FetchResult> {
  try {
    const res = await fetchWithTimeout("/api/user/accounts", { method: "GET" }, timeoutMs);

    if (res.status === 401) return { ok: false, error: "unauthorized" };
    if (!res.ok) return { ok: false, error: "server_error" };

    const data = (await res.json()) as unknown;
    if (!Array.isArray(data)) return { ok: false, error: "invalid_payload" };

    return { ok: true, data: data as UserAccount[] };
  } catch (e: any) {
    if (e?.name === "AbortError") return { ok: false, error: "timeout" };
    return { ok: false, error: "network_error" };
  }
}

/** Cache leve por aba/sessão */
const sessionCache: { data?: UserAccount[]; ts?: number } = {};

type UseUserAccountsOptions = {
  /** TTL do cache da aba (ms). Padrão 5 min. */
  ttlMs?: number;
  /** Debounce para aberturas rápidas do menu (ms). Padrão 200ms. */
  debounceMs?: number;
  /** Timeout da requisição (ms). Padrão 6000ms. */
  timeoutMs?: number;
};

/**
 * Hook para carregar as contas sob demanda (lazy).
 * - enabled=true dispara a leitura (com debounce).
 * - Cache em memória por aba com TTL curto.
 * - Evita fetches concorrentes e cancela requisição anterior se necessário.
 */
export function useUserAccounts(
  enabled: boolean,
  { ttlMs = 5 * 60 * 1000, debounceMs = 200, timeoutMs = 6000 }: UseUserAccountsOptions = {}
) {
  const [data, setData] = useState<UserAccount[] | null>(null);
  const [error, setError] = useState<ErrorCode | null>(null);
  const [loading, setLoading] = useState(false);

  // Controle de concorrência / cancelamento
  const inFlightAbortRef = useRef<AbortController | null>(null);
  const loadingRef = useRef(false);

  // Debounce de abertura do menu
  const debounceTimerRef = useRef<number | null>(null);

  const doFetch = useCallback(async () => {
    // Respeitar cache com TTL
    const now = Date.now();
    if (sessionCache.data && sessionCache.ts && now - sessionCache.ts < ttlMs) {
      setError(null);
      setData(sessionCache.data);
      return;
    }

    // Evitar concorrência
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    setError(null);

    // Cancelar requisição anterior, se houver
    if (inFlightAbortRef.current) {
      inFlightAbortRef.current.abort();
    }
    const localAbort = new AbortController();
    inFlightAbortRef.current = localAbort;

    try {
      // Passar o signal apenas para controle local do fetch (fetchUserAccounts tem controle próprio de timeout)
      const res = await fetchUserAccounts(timeoutMs);
      if (localAbort.signal.aborted) return;

      if (res.ok) {
        sessionCache.data = res.data;
        sessionCache.ts = Date.now();
        setData(res.data);
        setError(null);
      } else {
        setData(null);
        setError(res.error);
      }
    } finally {
      if (inFlightAbortRef.current === localAbort) {
        inFlightAbortRef.current = null;
      }
      setLoading(false);
      loadingRef.current = false;
    }
  }, [ttlMs, timeoutMs]);

  // Efeito: lazy load com debounce quando enabled=true
  useEffect(() => {
    if (!enabled) return;

    // Debounce para não disparar múltiplos fetches ao abrir/fechar rapidamente
    if (debounceTimerRef.current) {
      window.clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    debounceTimerRef.current = window.setTimeout(() => {
      void doFetch();
    }, debounceMs);

    return () => {
      if (debounceTimerRef.current) {
        window.clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
    };
  }, [enabled, debounceMs, doFetch]);

  // Refetch manual: invalida cache e dispara leitura
  const refetch = useCallback(async () => {
    sessionCache.data = undefined;
    sessionCache.ts = undefined;
    await doFetch();
  }, [doFetch]);

  // Cleanup ao desmontar: cancelar requisição pendente
  useEffect(() => {
    return () => {
      if (inFlightAbortRef.current) inFlightAbortRef.current.abort();
    };
  }, []);

  return { data, error, loading, refetch };
}
