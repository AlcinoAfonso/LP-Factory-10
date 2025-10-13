// src/lib/admin/adapters/postSaleTokenAdapter.ts
import { createServiceClient } from "../../supabase/service";
import type { PostSaleToken, TokenValidation } from "../contracts";

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
  created_by?: string | null;
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

type ActorRole = "super_admin" | "platform_admin" | "user" | null;
type Ctx = { actor_id?: string | null; actor_role?: ActorRole; ip?: string | null; t0?: number };

function now() {
  return typeof globalThis.performance?.now === "function"
    ? globalThis.performance.now()
    : Date.now();
}
function latencyMs(t0?: number) {
  if (typeof t0 !== "number") return undefined;
  const t1 = typeof globalThis.performance?.now === "function" ? globalThis.performance.now() : Date.now();
  return Math.round(t1 - t0);
}
function logEvent(event: string, extra: Record<string, unknown>, ctx?: Ctx) {
  // eslint-disable-next-line no-console
  console.error(JSON.stringify({
    event, scope: "admin",
    actor_id: ctx?.actor_id ?? null,
    actor_role: ctx?.actor_role ?? null,
    ip: ctx?.ip ?? null,
    latency_ms: latencyMs(ctx?.t0),
    timestamp: new Date().toISOString(),
    ...extra,
  }));
}

/** ==== Rate limits (configuráveis) ==== */
const RL_DAY_PER_EMAIL = Number(process.env.RATE_LIMIT_TOKENS_PER_EMAIL ?? 3);
const RL_BURST_5M = Number(process.env.RATE_LIMIT_BURST_5M ?? 5);

/**
 * Retorna limite diário de tokens baseado no papel do ator
 * super_admin: 200/dia
 * platform_admin: 20/dia
 * outros: 20/dia (fallback)
 */
function getDailyLimitForRole(role?: ActorRole): number {
  if (role === "super_admin") {
    return Number(process.env.RATE_LIMIT_SUPER_ADMIN_PER_DAY ?? 200);
  }
  return Number(process.env.RATE_LIMIT_TOKENS_PER_DAY ?? 20);
}

/**
 * Gera novo token de pós-venda
 * TTL default: 7 dias
 * Aplica rate-limit por ator (diferenciado por papel), por e-mail e burst 5m.
 */
export async function generate(
  email: string,
  contractRef?: string,
  expiresAt?: Date,
  ctx?: Ctx
): Promise<PostSaleToken | null> {
  const t0 = ctx?.t0 ?? now();
  const svc = createServiceClient();

  const normalizedEmail = email.toLowerCase().trim();
  const actorId = ctx?.actor_id ?? null;
  const actorRole = ctx?.actor_role ?? null;
  const dailyLimit = getDailyLimitForRole(actorRole);

  // 1) Checagem por ator (últimas 24h) - limite diferenciado por papel
  if (actorId) {
    const { count: byActor, error: errActor } = await svc
      .from("post_sale_tokens")
      .select("id", { count: "exact", head: true })
      .eq("created_by", actorId)
      .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    if (!errActor && (byActor ?? 0) >= dailyLimit) {
      logEvent("rate_limit_exceeded", { 
        scope_detail: "per_actor_day", 
        actor_daily: byActor, 
        limit: dailyLimit,
        actor_role: actorRole 
      }, ctx);
      return null;
    }
  }

  // 2) Checagem por e-mail (últimas 24h)
  {
    const { count: byEmail, error: errEmail } = await svc
      .from("post_sale_tokens")
      .select("id", { count: "exact", head: true })
      .eq("email", normalizedEmail)
      .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    if (!errEmail && (byEmail ?? 0) >= RL_DAY_PER_EMAIL) {
      logEvent("rate_limit_exceeded", { scope_detail: "per_email_day", email: normalizedEmail, email_daily: byEmail, limit: RL_DAY_PER_EMAIL }, ctx);
      return null;
    }
  }

  // 3) Checagem de burst 5 minutos por ator
  if (actorId) {
    const { count: burst, error: errBurst } = await svc
      .from("post_sale_tokens")
      .select("id", { count: "exact", head: true })
      .eq("created_by", actorId)
      .gte("created_at", new Date(Date.now() - 5 * 60 * 1000).toISOString());

    if (!errBurst && (burst ?? 0) >= RL_BURST_5M) {
      logEvent("rate_limit_exceeded", { scope_detail: "burst_5m", actor_burst_5m: burst, limit: RL_BURST_5M }, ctx);
      return null;
    }
  }

  const expires = expiresAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const { data, error } = await svc
    .from("post_sale_tokens")
    .insert({
      email: normalizedEmail,
      contract_ref: contractRef || null,
      expires_at: expires.toISOString(),
      created_by: actorId, // <- registra o ator
    })
    .select()
    .single();

  if (error || !data) {
    logEvent("token_generate_error", { error: String(error?.message ?? error) }, ctx);
    return null;
  }

  const token = mapTokenFromDB(data as DBTokenRow);
  logEvent("token_generated", { email: normalizedEmail, contract_ref: contractRef ?? null, token_id: token.id }, ctx);
  return token;
}

/** Valida token (read-only, não consome) */
export async function validate(tokenId: string, _ctx?: Ctx): Promise<TokenValidation> {
  const svc = createServiceClient();
  const { data, error } = await svc
    .from("post_sale_tokens")
    .select("id, used_at, expires_at")
    .eq("id", tokenId)
    .maybeSingle();

  if (error || !data) return { valid: false, reason: "not_found" };
  if (data.used_at) return { valid: false, reason: "already_used" };
  if (new Date(data.expires_at) <= new Date()) return { valid: false, reason: "expired" };
  return { valid: true, reason: "ok" };
}

/** Consome token via RPC (loga sucesso/erro) */
export async function consume(tokenId: string, actorId: string, ctx?: Ctx): Promise<string | null> {
  const t0 = ctx?.t0 ?? now();
  const svc = createServiceClient();

  const { data, error } = await svc.rpc("create_account_with_owner", {
    p_token_id: tokenId,
    p_actor_id: actorId,
  });

  if (error) {
    logEvent("token_consume_failed", { token_id: tokenId, error: String(error?.message ?? error) }, { ...ctx, t0 });
    return null;
  }

  logEvent("token_consumed", { token_id: tokenId, account_id: data ?? null, actor_id: actorId }, { ...ctx, t0 });
  return data as string;
}

/** Revoga token — IDEMPOTENTE */
export async function revoke(tokenId: string, ctx?: Ctx): Promise<boolean> {
  const t0 = ctx?.t0 ?? now();
  const svc = createServiceClient();

  // 1) Checa estado atual
  const { data: row, error: selErr } = await svc
    .from("post_sale_tokens")
    .select("id, expires_at, used_at")
    .eq("id", tokenId)
    .maybeSingle();

  if (selErr) {
    logEvent("token_revoke_failed", { token_id: tokenId, error: String(selErr?.message ?? selErr) }, { ...ctx, t0 });
    return false;
  }

  // 2) Não encontrado → NOOP idempotente
  if (!row) {
    logEvent("token_revoke_noop", { token_id: tokenId, reason: "not_found" }, { ...ctx, t0 });
    return true;
  }

  const alreadyExpired = new Date(row.expires_at) <= new Date();
  const alreadyUsed = !!row.used_at;

  // 3) Já expirado ou já usado → NOOP idempotente
  if (alreadyExpired || alreadyUsed) {
    logEvent("token_revoke_noop", {
      token_id: tokenId,
      reason: alreadyExpired ? "already_expired" : "already_used",
    }, { ...ctx, t0 });
    return true;
  }

  // 4) Atualiza para expirar agora
  const { error: updErr } = await svc
    .from("post_sale_tokens")
    .update({ expires_at: new Date().toISOString() })
    .eq("id", tokenId);

  if (updErr) {
    logEvent("token_revoke_failed", { token_id: tokenId, error: String(updErr?.message ?? updErr) }, { ...ctx, t0 });
    return false;
  }

  logEvent("token_revoked", { token_id: tokenId }, { ...ctx, t0 });
  return true;
}
