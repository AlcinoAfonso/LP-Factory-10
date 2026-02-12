// src/lib/access/adapters/accountProfileAdapter.ts
import { createServiceClient } from "@/lib/supabase/service";

/**
 * E10.4.6 — Persistência do perfil v1 (1:1) em account_profiles
 * Atenção: este adapter não faz guard de acesso; o guard deve ser feito no server action (owner/admin).
 * Logs: sem PII.
 */

export type AccountProfileV1UpsertInput = {
  accountId: string;
  niche?: string | null;
  preferredChannel: "email" | "whatsapp";
  whatsapp?: string | null;
  siteUrl?: string | null;
};

export async function upsertAccountProfileV1(
  input: AccountProfileV1UpsertInput
): Promise<boolean> {
  const supabase = createServiceClient(); // server-only

  const payload = {
    account_id: input.accountId,
    niche: input.niche ?? null,
    preferred_channel: input.preferredChannel,
    whatsapp: input.whatsapp ?? null,
    site_url: input.siteUrl ?? null,
    updated_at: new Date().toISOString(),
  };

  let q: any = supabase
    .from("account_profiles")
    .upsert(payload, { onConflict: "account_id" });

  // v12-safe: só aplica no v13+
  if (typeof q?.maxAffected === "function") q = q.maxAffected(1);

  const { error } = await q;

  if (error) {
    // eslint-disable-next-line no-console
    console.error("upsertAccountProfileV1 failed:", {
      code: (error as any)?.code,
      message: (error as any)?.message ?? String(error),
      account_id: input.accountId,
    });
    return false;
  }

  return true;
}
