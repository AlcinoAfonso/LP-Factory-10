// components/features/account-switcher/useUserAccounts.ts
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
    const res = await fetch(input, { ...init, signal: controller.signal, cache: "no-store" });
    return res;
  } finally {
    clearTimeout(id);
  }
}

/**
 * Busca a lista de contas do usuário autenticado.
 * - Timeout padrão: 6s
 * - Sem cache: sempre lê do servidor
 */
export async function fetchUserAccounts(timeoutMs = 6000): Promise<FetchResult> {
  try {
    const res = await fetchWithTimeout("/api/user/accounts", { method: "GET" }, timeoutMs);

    if (res.status === 401) {
      return { ok: false, error: "unauthorized" };
    }
    if (!res.ok) {
      return { ok: false, error: "server_error" };
    }

    const data = (await res.json()) as unknown;
    if (!Array.isArray(data)) {
      return { ok: false, error: "invalid_payload" };
    }
    return { ok: true, data: data as UserAccount[] };
  } catch (e: any) {
    if (e?.name === "AbortError") return { ok: false, error: "timeout" };
    return { ok: false, error: "network_error" };
  }
}

/**
 * Hook para carregar as contas sob demanda (lazy).
 * - `enabled`: quando true, dispara a carga.
 * - Retorna data, loading, error e refetch().
 * - Cache simples em memória por aba (evita refetchs no mesmo open).
 */
const sessionCache: { data?: UserAccount[]; ts?: number } = {};

export function useUserAccounts(enabled: boolean, cacheTtlMs = 5 * 60 * 1000) {
  const [data, setData] = useState<UserAccount[] | null>(null);
  const [error, setError] = useState<ErrorCode | null>(null);
  const [loading, setLoading] = useState(false);
  const loadingRef = useRef(false);

  const load = useCallback(async () => {
    if (loadingRef.current) return;
    setError(null);
    setLoading(true);
    loadingRef.current = true;

    // Cache leve por sessão (se dentro do TTL)
    const now = Date.now();
    if (sessionCache.data && sessionCache.ts && now - sessionCache.ts < cacheTtlMs) {
      setData(sessionCache.data);
      setLoading(false);
      loadingRef.current = false;
      return;
    }

    const res = await fetchUserAccounts(6000);
    if (res.ok) {
      sessionCache.data = res.data;
      sessionCache.ts = now;
      setData(res.data);
    } else {
      setError(res.error);
      setData(null);
    }

    setLoading(false);
    loadingRef.current = false;
  }, [cacheTtlMs]);

  useEffect(() => {
    if (enabled) void load();
  }, [enabled, load]);

  const refetch = useCallback(async () => {
    sessionCache.data = undefined;
    sessionCache.ts = undefined;
    await load();
  }, [load]);

  return { data, error, loading, refetch };
}
