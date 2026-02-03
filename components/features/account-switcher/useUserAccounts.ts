// components/features/account-switcher/useUserAccounts.ts
"use client";

import * as React from "react";

/** Formato vindo do endpoint (/api/user/accounts) */
export type ApiUserAccount = {
  accountId: string;
  accountName: string | null;
  accountSubdomain: string;
  accountStatus: string;
  memberRole: "owner" | "admin" | "editor" | "viewer";
  memberStatus: "pending" | "active" | "inactive" | "revoked";
};

/** Formato usado internamente pelo AccountSwitcher */
export type UserAccount = {
  accountId: string;
  accountName: string | null;
  accountSubdomain: string;
  accountStatus: string;
  memberRole: ApiUserAccount["memberRole"];
  memberStatus: ApiUserAccount["memberStatus"];
};

type State = {
  data: UserAccount[] | null;
  loading: boolean;
  error: string | null;
};

export function useUserAccounts(shouldLoad: boolean) {
  const [state, setState] = React.useState<State>({
    data: null,
    loading: false,
    error: null,
  });

  const abortRef = React.useRef<AbortController | null>(null);

  const fetcher = React.useCallback(async () => {
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;

    setState((s) => ({ ...s, loading: true, error: null }));

    try {
      const res = await fetch("/api/user/accounts", {
        cache: "no-store",
        signal: ac.signal,
      });

      if (!res.ok) {
        throw new Error(`http_${res.status}`);
      }

      const json = await res.json();
      const rows: ApiUserAccount[] = Array.isArray(json) ? json : json?.data ?? [];

      const mapped: UserAccount[] = rows.map((i) => ({
        accountId: i.accountId,
        accountName: i.accountName ?? null,
        accountSubdomain: i.accountSubdomain,
        accountStatus: String(i.accountStatus),
        memberRole: i.memberRole,
        memberStatus: i.memberStatus,
      }));

      setState({ data: mapped, loading: false, error: null });
    } catch (e: any) {
      if (e?.name === "AbortError") return;
      setState({ data: null, loading: false, error: e?.message ?? "fetch_error" });
    }
  }, []);

  React.useEffect(() => {
    if (shouldLoad) fetcher();
    return () => abortRef.current?.abort();
  }, [shouldLoad, fetcher]);

  return {
    data: state.data,
    loading: state.loading,
    error: state.error,
    refetch: fetcher,
  };
}
