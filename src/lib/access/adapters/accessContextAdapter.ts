// src/lib/access/adapters/accessContextAdapter.ts
// Fonte única de leitura do Access Context (E8).
// Decide via super view v2; retorna null quando allow=false.
// Log mínimo: access_context_decision.

import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server"; // sua função async zero-args

export type AccessAccount = {
  id: string;
  subdomain: string;
  status: "active" | "inactive" | "suspended" | string;
};

export type AccessMember = {
  user_id: string;
  account_id: string;
  role: string;
  status: "active" | "inactive" | string;
};

export type AccessContext = {
  account: AccessAccount;
  member: AccessMember;
};

type RowV2 = {
  account_id: string;
  account_key: string;       // subdomain
  account_status: string;
  user_id: string | null;
  member_role: string | null;
  member_status: string | null;
  allow: boolean | null;
  reason: string | null;     // 'account_blocked' | 'member_inactive' | 'no_membership' | null
};

function logDecision(input: {
  user_id?: string | null;
  account_id?: string | null;
  role?: string | null;
  decision: "allow" | "deny" | "null";
  reason?: string | null;
  route?: string;
}) {
  try {
    const h = headers();
    const route = input.route ?? h.get("x-invoke-path") ?? "";
    const payload = {
      event: "access_context_decision",
      decision: input.decision,
      reason: input.reason ?? null,
      user_id: input.user_id ?? null,
      account_id: input.account_id ?? null,
      role: input.role ?? null,
      route,
    };
    // eslint-disable-next-line no-console
    console.log(JSON.stringify(payload));
  } catch {
    /* ignore logging errors */
  }
}

export async function readAccessContext(subdomain: string): Promise<AccessContext | null> {
  const supabase = await createClient();

  // Consulta direta à super view v2 (sem genéricos — compat ampla das libs)
  const { data, error } = await supabase
    .from("v_access_context_v2")
    .select(
      [
        "account_id",
        "account_key",
        "account_status",
        "user_id",
        "member_role",
        "member_status",
        "allow",
        "reason",
      ].join(",")
    )
    .eq("account_key", subdomain)
    .limit(1)
    .maybeSingle();

  if (error) {
    logDecision({ decision: "null", reason: "adapter_error_read_v2" });
    return null;
  }

  if (!data) {
    logDecision({ decision: "deny", reason: "no_membership_or_invalid_account" });
    return null;
  }

  const row = data as unknown as RowV2;

  if (!row.allow) {
    logDecision({
      user_id: row.user_id ?? null,
      account_id: row.account_id ?? null,
      role: row.member_role ?? null,
      decision: "deny",
      reason: row.reason ?? "denied_by_view",
    });
    return null;
  }

  const ctx: AccessContext = {
    account: {
      id: row.account_id,
      subdomain: row.account_key,
      status: row.account_status as AccessAccount["status"],
    },
    member: {
      user_id: row.user_id as string,
      account_id: row.account_id,
      role: (row.member_role ?? "member") as AccessMember["role"],
      status: (row.member_status ?? "active") as AccessMember["status"],
    },
  };

  logDecision({
    user_id: row.user_id,
    account_id: row.account_id,
    role: row.member_role,
    decision: "allow",
    reason: null,
  });

  return ctx;
}
