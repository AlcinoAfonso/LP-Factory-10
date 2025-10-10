// src/lib/admin/adapters/postSaleTokenAdapter.ts
import { createServiceClient } from "../../supabase/service";
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

/** ==== Log helpers (inline, sem dependências) ==== */
type ActorRole = "super_admin" | "platform_admin" | "user" | null;
type Ctx = {
  actor_id?: string | null;
  actor_role?: ActorRole;
  ip?: string | null;
  t0?: number; // performance.now() de quem chamou (opcional)
};

function now() {
  return typeof globalThis.performance?.now === "function"
    ? globalThis.performance.now()
    : Date.now();
}
function latencyMs(t0?: number) {
  if (typeof t0 !== "number") return undefined;
  const t1 =
    typeof globalThis.performance?.now === "function"
      ? globalThis.performance.now()
      : Date.now();
  return Math.round(t1 - t0);
}
function logEvent(
  event:
    | "token_consumed"
    | "token_expired"
    | "token_consume_failed",
  extra: Record<string, unknown>,
  ctx?: Ctx
) {
  // eslint-disable-next-line no-console
  console.error(
    JSON.stringify({
      event,
      scope: "admin",
      actor_id: ctx?.actor_id ?? null,
      actor_role: ctx?.actor_role ?? null,
      ip: ctx?.ip ?? null,
      latency_ms: latencyMs(ctx?.t0),
      timestamp: new Date().toISOString(),
      ...extra,
    })
  );
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
  const svc = createServiceClient();

  const expires = expiresAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const { data, error } = await svc
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
 * - Loga token_expired quando TTL vencido.
 */
export async function validate(
  tokenId: string,
  ctx?: Ctx
): Promise<TokenValidation> {
  const t0 = ctx?.t0 ?? now();
  const svc = createServiceClient();

  const { data, error } = await svc
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
    logEvent(
      "token_expired",
      { token_id: tokenId },
      { ...ctx, t0 }
    );
    return { valid: false, reason: "expired" };
  }

  return { valid: true, reason: "ok" };
}

/**
 * Consome token via RPC create_account_with_owner
 * Retorna account_id criado ou null em caso de erro
 * - Loga token_consumed no sucesso.
 * - Loga token_consume_failed no erro.
 */
export async function consume(
  tokenId: string,
  actorId: string,
  ctx?: Ctx
): Promise<string | null> {
  const t0 = ctx?.t0 ?? now();
  const svc = createServiceClient();

  const { data, error } = await svc.rpc("create_account_with_owner", {
    p_token_id: tokenId,
    p_actor_id: actorId,
  });

  if (error) {
    logEvent(
      "token_consume_failed",
      { token_id: tokenId, error: String(error?.message ?? error) },
      { ...ctx, t0 }
    );
    return null;
  }

  logEvent(
    "token_consumed",
    { token_id: tokenId, account_id: data ?? null, actor_id: actorId },
    { ...ctx, t0 }
  );

  return data as string;
}

/**
 * Revoga token (marca como expirado imediatamente)
 */
export async function revoke(tokenId: string): Promise<boolean> {
  const svc = createServiceClient();

  const { error } = await svc
    .from("post_sale_tokens")
    .update({ expires_at: new Date().toISOString() })
    .eq("id", tokenId);

  return !error;
}
