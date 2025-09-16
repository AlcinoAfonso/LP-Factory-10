// src/lib/access/adapters/accessContextAdapter.ts
/**
 * Referências: MRVG 1.5 (D/F/G), Fluxos Sistema de Acesso, Supabase Updates Ago/2025.
 * Regra Concisa E8:
 *  - (2) Toda leitura de contexto via view v_access_context (security_invoker=on).
 *  - (3) Adapter dedicado; SSR/middleware apenas chamam o adapter.
 *  - (6) Logging estruturado access_context_decision no ponto de I/O.
 */

import { createClient } from "@/supabase/server";
import type {
  AccountInfo,
  AccountStatus,
  MemberStatus,
  Role,
} from "./accountAdapter";

// Linha da view
type AccessContextRow = {
  account_id: string;
  account_key: string | null;
  account_name: string | null;
  account_status: string | null;
  user_id: string;
  member_role: string | null;
  member_status: string | null;
};

// Par de retorno do adapter
export type AccessPair = {
  account: AccountInfo;
  member: {
    accountId: string;
    userId: string;
    role: Role;
    status: MemberStatus;
  };
};

type ReadOpts = {
  userId: string;
  accountSlug?: string; // preferencial (/a/[account])
  accountId?: string;   // alternativo
  route?: string;       // para logging
  requestId?: string;   // correlação
};

/** Normalizações locais */
const normRole = (s?: string): Role => {
  const v = (s ?? "").toLowerCase().trim();
  return (["owner", "admin", "editor", "viewer"] as const).includes(v as Role)
    ? (v as Role)
    : "viewer";
};

const normMStatus = (s?: string): MemberStatus => {
  const v = (s ?? "").toLowerCase().trim();
  return (["pending", "active", "inactive", "revoked"] as const).includes(
    v as MemberStatus
  )
    ? (v as MemberStatus)
    : "active";
};

const normAStatus = (s?: string): AccountStatus => {
  const v = (s ?? "").toLowerCase().trim();
  return (["active", "trial", "suspended", "canceled"] as const).includes(
    v as AccountStatus
  )
    ? (v as AccountStatus)
    : "active";
};

/** Logger canônico exigido pelo E8 (item 6.1) */
type DecisionReason =
  | "ok"
  | "no_user"
  | "no_rows"
  | "account_blocked"
  | "member_inactive"
  | "missing_params"
  | "error";

function logDecision(input: {
  decision: "allow" | "deny";
  reason: DecisionReason;
  userId?: string;
  accountId?: string;
  role?: Role;
  route?: string;
  requestId?: string;
  latencyMs: number;
}) {
  // eslint-disable-next-line no-console
  console.log(
    JSON.stringify({
      scope: "access_ctx",
      event: "access_context_decision",
      ...input,
      ts: new Date().toISOString(),
    })
  );
}

/**
 * Lê o contexto via view (RLS ON) e aplica governança mínima:
 * - account_status ∈ { active, trial }
 * - member_status  = active
 */
export async function readAccessContext(opts: ReadOpts): Promise<AccessPair | null> {
  const t0 = Date.now();
  const { userId, accountSlug, accountId } = opts || {};
  const supabase = await createClient(); // escopo por request (App Router)

  if (!userId || (!accountSlug && !accountId)) {
    logDecision({
      decision: "deny",
      reason: "missing_params",
      userId,
      route: opts?.route,
      requestId: opts?.requestId,
      latencyMs: Date.now() - t0,
    });
    return null;
  }

  let q = supabase
    .from("v_access_context")
    .select(
      "account_id, account_key, account_name, account_status, user_id, member_role, member_status"
    )
    .eq("user_id", userId)
    .limit(50);

  if (accountId) q = q.eq("account_id", accountId);
  if (accountSlug && !accountId) q = q.eq("account_key", accountSlug);

  const { data, error } = await q;

  if (error) {
    logDecision({
      decision: "deny",
      reason: "error",
      userId,
      route: opts?.route,
      requestId: opts?.requestId,
      latencyMs: Date.now() - t0,
    });
    return null;
  }

  const rows = (data as AccessContextRow[] | null) ?? [];
  if (rows.length === 0) {
    logDecision({
      decision: "deny",
      reason: "no_rows",
      userId,
      route: opts?.route,
      requestId: opts?.requestId,
      latencyMs: Date.now() - t0,
    });
    return null;
  }

  // Aplica governança mínima
  const chosen = rows.find((r) => {
    const accOk = ["active", "trial"].includes((r.account_status ?? "").toLowerCase());
    const memOk = (r.member_status ?? "").toLowerCase() === "active";
    return accOk && memOk;
  });

  if (!chosen) {
    const hasBlocked = rows.some(
      (r) => !["active", "trial"].includes((r.account_status ?? "").toLowerCase())
    );
    logDecision({
      decision: "deny",
      reason: hasBlocked ? "account_blocked" : "member_inactive",
      userId,
      accountId: rows[0]?.account_id,
      role: normRole(rows[0]?.member_role ?? undefined),
      route: opts?.route,
      requestId: opts?.requestId,
      latencyMs: Date.now() - t0,
    });
    return null;
  }

  const account: AccountInfo = {
    id: chosen.account_id,
    name: chosen.account_name ?? "",
    subdomain: (chosen.account_key ?? "").toLowerCase(),
    status: normAStatus(chosen.account_status ?? undefined),
  };

  const member = {
    accountId: chosen.account_id,
    userId: chosen.user_id,
    role: normRole(chosen.member_role ?? undefined),
    status: normMStatus(chosen.member_status ?? undefined),
  };

  logDecision({
    decision: "allow",
    reason: "ok",
    userId,
    accountId: chosen.account_id,
    role: member.role,
    route: opts?.route,
    requestId: opts?.requestId,
    latencyMs: Date.now() - t0,
  });

  return { account, member };
}
