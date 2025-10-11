// src/lib/admin/adapters/adminAdapter.ts
import { createClient as createServerClient } from "@/lib/supabase/server";
// usar caminho relativo para evitar issues de alias no build da Vercel
import { createServiceClient } from "../../supabase/service";

import type { TokenWithUsage, TokenStats, PostSaleToken } from "../contracts";
import * as postSaleTokenAdapter from "./postSaleTokenAdapter";

/**
 * Adapter de orquestração Admin (E7/E7.1)
 * - Leituras de views com GRANT para service_role via SERVICE CLIENT (server-only)
 * - Verificação de sessão/claims via SERVER CLIENT (contexto do usuário)
 */

type DBTokenUsageRow = {
  token_id: string;
  email: string;
  contract_ref: string | null;
  expires_at: string;
  used_at: string | null;
  used_by: string | null;
  account_id: string | null;
  account_slug: string | null;
  acc_status: string | null;
  is_used: boolean;
  is_valid: boolean;
  created_at: string;
};

function mapTokenUsageFromDB(row: DBTokenUsageRow): TokenWithUsage {
  return {
    token_id: row.token_id,
    email: row.email,
    contract_ref: row.contract_ref ?? undefined,
    expires_at: row.expires_at,
    used_at: row.used_at ?? undefined,
    used_by: row.used_by ?? undefined,
    account_id: row.account_id ?? undefined,
    account_slug: row.account_slug ?? undefined,
    acc_status: row.acc_status ?? undefined,
    is_used: row.is_used,
    is_valid: row.is_valid,
    created_at: row.created_at,
  };
}

/**
 * Verifica se usuário autenticado é super_admin
 * Fail-closed: qualquer erro retorna false
 * Usa SERVER CLIENT para preservar contexto do usuário (auth.uid()).
 */
export async function checkSuperAdmin(): Promise<{
  isSuper: boolean;
  userId?: string;
  email?: string;
}> {
  try {
    const supabase = await createServerClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return { isSuper: false };
    }

    const { data: isSuperAdmin, error: rpcError } = await supabase.rpc(
      "is_super_admin"
    );

    if (rpcError) {
      // eslint-disable-next-line no-console
      console.error("[adminAdapter] RPC is_super_admin failed:", rpcError);
      return { isSuper: false, userId: user.id, email: user.email ?? undefined };
    }

    return {
      isSuper: !!isSuperAdmin,
      userId: user.id,
      email: user.email ?? undefined,
    };
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[adminAdapter] Unexpected error:", err);
    return { isSuper: false };
  }
}

/**
 * Verifica se usuário autenticado é platform_admin ou super_admin
 * Fail-closed: qualquer erro retorna false
 * Usa SERVER CLIENT para preservar contexto do usuário (auth.uid()).
 */
export async function checkPlatformAdmin(): Promise<{
  isPlatform: boolean;
  userId?: string;
  email?: string;
}> {
  try {
    const supabase = await createServerClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return { isPlatform: false };
    }

    const { data: isPlatformAdmin, error: rpcError } = await supabase.rpc(
      "is_platform_admin"
    );

    if (rpcError) {
      // eslint-disable-next-line no-console
      console.error("[adminAdapter] RPC is_platform_admin failed:", rpcError);
      return { isPlatform: false, userId: user.id, email: user.email ?? undefined };
    }

    return {
      isPlatform: !!isPlatformAdmin,
      userId: user.id,
      email: user.email ?? undefined,
    };
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[adminAdapter] Unexpected error:", err);
    return { isPlatform: false };
  }
}

export const tokens = {
  /**
   * Lista tokens da view v_admin_tokens_with_usage
   * Filtros opcionais: used, expired
   * Usa SERVICE CLIENT (service_role) — server-only.
   */
  async list(params?: {
    used?: boolean;
    expired?: boolean;
  }): Promise<TokenWithUsage[]> {
    try {
      const svc = await createServiceClient(); // <- await

      let query = svc
        .from("v_admin_tokens_with_usage")
        .select("*")
        .order("created_at", { ascending: false });

      if (params?.used !== undefined) {
        query = query.eq("is_used", params.used);
      }

      if (params?.expired !== undefined) {
        // expired=true => is_valid=false
        query = query.eq("is_valid", !params.expired);
      }

      const { data, error } = await query;

      if (error || !data) {
        // eslint-disable-next-line no-console
        console.error("[adminAdapter.tokens.list] query error:", error);
        return [];
      }

      return (data as DBTokenUsageRow[]).map(mapTokenUsageFromDB);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error("[adminAdapter.tokens.list] unexpected error:", e);
      return [];
    }
  },

  /**
   * Estatísticas agregadas da view
   * Usa SERVICE CLIENT (service_role) — server-only.
   */
  async getStats(): Promise<TokenStats> {
    try {
      const svc = await createServiceClient(); // <- await

      const { data, error } = await svc
        .from("v_admin_tokens_with_usage")
        .select("is_used, is_valid");

      if (error || !data) {
        // eslint-disable-next-line no-console
        console.error("[adminAdapter.tokens.getStats] query error:", error);
        return { total: 0, used: 0, expired: 0, valid: 0 };
      }

      const total = data.length;
      const used = data.filter((r) => r.is_used).length;
      const valid = data.filter((r) => r.is_valid && !r.is_used).length;
      const expired = total - used - valid;

      return { total, used, expired, valid };
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error("[adminAdapter.tokens.getStats] unexpected error:", e);
      return { total: 0, used: 0, expired: 0, valid: 0 };
    }
  },

  /**
   * Gera novo token (delega para postSaleTokenAdapter)
   * Agora aceita `ctx` opcional (rate-limit/observabilidade).
   */
  async generate(
    email: string,
    contractRef?: string,
    expiresAt?: Date,
    ctx?: any
  ): Promise<PostSaleToken | null> {
    return postSaleTokenAdapter.generate(email, contractRef, expiresAt, ctx);
  },

  /**
   * Revoga token (delega para postSaleTokenAdapter)
   */
  async revoke(tokenId: string): Promise<boolean> {
    return postSaleTokenAdapter.revoke(tokenId);
  },
};
