// app/select-account/actions.ts
"use server";

import { redirect } from "next/navigation";
import { getServerSupabase } from "@/src/lib/supabase/server";
import { auditAccountSwitch } from "@/src/lib/access/audit";
import { pickAccount, mapAccountFromDB, type DBAccountRow } from "@/src/lib/access/adapters/accountAdapter";

export async function chooseAccount(formData: FormData) {
  const requested = String(formData.get("account_id") ?? "");
  if (!requested) redirect("/select-account");

  const supabase = getServerSupabase();

  const { data, error } = await supabase
    .from("account_users")
    .select("account_id,status,accounts:accounts!inner(id,name,subdomain,domain,status)")
    .eq("account_id", requested)
    .eq("status", "active")
    .limit(1)
    .single();

  if (error || !data) redirect("/select-account");

  const accRow = pickAccount((data as any).accounts) as DBAccountRow | null;
  if (!accRow) redirect("/select-account");
  const account = mapAccountFromDB(accRow);
  if (!(account.status === "active" || account.status === "trial")) redirect("/blocked");

  await auditAccountSwitch(data.account_id);
  redirect(`/a/${account.subdomain}`);
}
