import { createClient } from "@/supabase/server";

/** Audita a troca de conta (não quebra o fluxo se falhar). */
export async function auditAccountSwitch(accountId: string) {
  try {
    const supabase = await createClient(); // precisa de await aqui
    await supabase.from("audit_logs").insert({
      event: "account_switch",
      account_id: accountId,
    });
  } catch (err) {
    console.error("Audit log failed", err);
  }
}
