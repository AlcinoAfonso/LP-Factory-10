// src/lib/access/audit.ts
import { createClient } from "@/supabase/server";

/** Audita a troca de conta (não quebra o fluxo se falhar). */
export async function auditAccountSwitch(accountId: string) {
  try {
    const supabase = createClient(); // cria client diretamente, sem await
    await supabase.from("audit_logs").insert({
      event: "account_switch",
      account_id: accountId,
      // adicione campos opcionais se existirem na sua tabela:
      // user_id, metadata, created_at...
    });
  } catch (err) {
    // silêncio: auditoria não deve bloquear fluxo
    console.error("Audit log failed", err);
  }
}
