// src/lib/access/audit.ts
import { createServerClient } from "../supabase/server";

/** Audita a troca de conta (não quebra o fluxo se falhar). */
export async function auditAccountSwitch(accountId: string) {
  const supabase = createServerClient();
  try {
    await supabase.rpc("audit_context_event", {
      p_event: "account_switch",
      p_entity: "accounts",
      p_entity_id: accountId,
      p_diff: {},
      p_account_id: accountId,
    });
  } catch {
    // no-op
  }
}
