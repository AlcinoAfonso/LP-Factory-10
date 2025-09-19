// src/lib/access/adapters/accessContextAdapter.ts
// Fonte única de leitura do Access Context (E8).
// Regras: decidir via super view v2; retornar null quando allow=false.
// Logs mínimos: access_context_decision.

import { cookies, headers } from "next/headers";
import { createClient } from "@/lib/supabase/server"; // já existente no projeto

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
    // Log mínimo e síncrono (console). Observabilidade avançada fica para depois.
    // Estrutura padronizada: access_context_decision
    // Ex.: {"event":"access_context_decision","decision":"deny","reason":"member_inactive",...}
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
  // Client atrelado ao request (SSR)
  const cookieStore = cookies();
  const supabase = createClient({ cookies: () => cookieStore });

  // Consulta direta à super view v2
  // Filtro: account_key = subdomain; user = auth.uid() (RLS via security_invoker)
  const { data, error } = await supabase
    .from<RowV2>("v_access_context_v2")
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
    // Falha de leitura: não arriscamos expor nada → retorna null.
    logDecision({ decision: "null", reason: "adapter_error_read_v2" });
    return null;
  }

  // Nenhuma linha (slug inexistente ou sem visibilidade pelo RLS)
  if (!data) {
    logDecision({ decision: "deny", reason: "no_membership_or_invalid_account" });
    return null;
  }

  const allow = Boolean(data.allow);
  const reason = data.reason ?? null;

  // Se a view diz que NÃO pode, respeitamos e retornamos null.
  if (!allow) {
    logDecision({
      user_id: data.user_id ?? null,
      account_id: data.account_id ?? null,
      role: data.member_role ?? null,
      decision: "deny",
      reason: reason ?? "denied_by_view",
    });
    return null;
  }

  // allow === true → montamos o contrato mínimo {account, member}
  const ctx: AccessContext = {
    account: {
      id: data.account_id,
      subdomain: data.account_key,
      status: data.account_status as AccessAccount["status"],
    },
    member: {
      user_id: data.user_id as string,
      account_id: data.account_id,
      role: (data.member_role ?? "member") as AccessMember["role"],
      status: (data.member_status ?? "active") as AccessMember["status"],
    },
  };

  logDecision({
    user_id: data.user_id,
    account_id: data.account_id,
    role: data.member_role,
    decision: "allow",
    reason: null,
  });

  return ctx;
}
