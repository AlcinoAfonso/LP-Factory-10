"use server";

import { redirect } from "next/navigation";
import { getServerSupabase } from "@/src/lib/supabase/server";
import { auditAccountSwitch } from "@/src/lib/access/audit";

/** Server Action segura: valida membership antes de auditar/redirecionar. */
export async function chooseAccount(formData: FormData) {
  const requested = String(formData.get("account_id") ?? "");
  if (!requested) redirect("/select-account");

  const supabase = getServerSupabase();

  // valida se o usuário é membro ATIVO da conta solicitada e pega o subdomain no servidor
  const { data, error } = await supabase
    .from("account_users")
    .select("account_id, status, accounts!inner(subdomain)")
    .eq("account_id", requested)
    .eq("status", "active")
    .limit(1)
    .single();

  if (error || !data) redirect("/select-account");

  await auditAccountSwitch(data.account_id);
  redirect(`/a/${(data as any).accounts.subdomain}`);
}
