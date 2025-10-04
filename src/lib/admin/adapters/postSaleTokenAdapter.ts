// src/lib/admin/adapters/postSaleTokenAdapter.ts
import { createClient } from "@/lib/supabase/server";
import type { PostSaleToken, TokenValidation } from "../contracts";

/**
 * Adapter para post_sale_tokens (E7)
 * Operações de escrita requerem service_role/super_admin
 */

type DBTokenRow = {
  id: string;
  email: string;
  contract_ref: string | null;
  expires_at: string;
  used_at: string | null;
  used_by: string | null;
  account_id: string | null;
  meta: Record<string, unknown> | null;
  created_at: string;
};

function mapTokenFromDB(row: DBTokenRow): PostSaleToken {
  return {
    id: row.id,
    email: row.email,
    contract_ref: row.contract_ref ?? undefined,
    expires_at: row.expires_at,
    used_at: row.used_at ?? undefined,
    used_by: row.used_by ?? undefined,
    account_id: row.account_id ?? undefined,
    meta: row.meta ?? undefined,
    created_at: row.created_at,
  };
}

/**
 * Gera novo token de pós-venda
 * TTL default: 7 dias
 */
export async function generate(
  email: string,
  contractRef?: string,
  expiresAt?: Date
): Promise<PostSaleToken | null> {
  const supabase = await createClient();
  
  const expires = expiresAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  
  const { data, error } = await supabase
    .from("post_sale_tokens")
    .insert({
      email: email.toLowerCase().trim(),
      contract_ref: contractRef || null,
      expires_at: expires.toISOString(),
    })
    .select()
    .single();

  if (error || !data) return null;

  return mapTokenFromDB(data as DBTokenRow);
}

/**
 * Valida token (read-only, não consome)
 */
export async function validate(tokenId: string): Promise<TokenValidation> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("post_sale_tokens")
    .select("id, used_at, expires_at")
    .eq("id", tokenId)
    .maybeSingle();

  if (error || !data) {
    return { valid: false, reason: "not_found" };
  }

  if (data.used_at) {
    return { valid: false, reason: "already_used" };
  }

  if (new Date(data.expires_at) <= new Date()) {
    return { valid: false, reason: "expired" };
  }

  return { valid: true, reason: "ok" };
}

/**
 * Consome token via RPC create_account_with_owner
 * Retorna account_id criado ou null em caso de erro
 */
export async function consume(
  tokenId: string,
  actorId: string
): Promise<string | null> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("create_account_with_owner", {
    p_token_id: tokenId,
    p_actor_id: actorId,
  });

  if (error) {
    // eslint-disable-next-line no-console
    console.error("Token consume failed:", error);
    return null;
  }

  return data as string;
}

/**
 * Revoga token (marca como expirado imediatamente)
 */
export async function revoke(tokenId: string): Promise<boolean> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("post_sale_tokens")
    .update({ expires_at: new Date().toISOString() })
    .eq("id", tokenId);

  return !error;
}
