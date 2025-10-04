// src/lib/admin/adapters/adminAdapter.ts
import { createClient } from "@/lib/supabase/server";
import type { TokenWithUsage, TokenStats, PostSaleToken } from "../contracts";
import * as postSaleTokenAdapter from "./postSaleTokenAdapter";

/**
 * Adapter de orquestração Admin (E7)
 * Usa view v_admin_tokens_with_usage + delega para postSaleTokenAdapter
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
 */
export async function checkSuperAdmin(): Promise<{
  isSuper: boolean;
  userId?: string;
  email?: string;
}> {
  try {
    const supabase = await createClient();

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return { isSuper: false };
    }

    const { data: isSuperAdmin, error: rpcError } = await supabase.rpc('is_super_admin');

    if (rpcError) {
      // eslint-disable-next-line no-console
      console.error('[adminAdapter] RPC is_super_admin failed:', rpcError);
      return { isSuper: false, userId: user.id, email: user.email };
    }

    return {
      isSuper: !!isSuperAdmin,
      userId: user.id,
      email: user.email,
    };
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[adminAdapter] Unexpected error:', err);
    return { isSuper: false };
  }
}

export const tokens = {
  /**
   * Lista tokens da view v_admin_tokens_with_usage
   * Filtros opcionais: usado, expirado
   */
  async list(params?: {
    used?: boolean;
    expired?: boolean;
  }): Promise<TokenWithUsage[]> {
    const supabase = await createClient();

    let query = supabase
      .from("v_admin_tokens_with_usage")
      .select("*")
      .order("created_at", { ascending: false });

    if (params?.used !== undefined) {
      query = query.eq("is_used", params.used);
    }

    if (params?.expired !== undefined) {
      query = query.eq("is_valid", !params.expired);
    }

    const { data, error } = await query;

    if (error || !data) return [];

    return data.map((row) => mapTokenUsageFromDB(row as DBTokenUsageRow));
  },

  /**
   * Estatísticas agregadas da view
   */
  async getStats(): Promise<TokenStats> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("v_admin_tokens_with_usage")
      .select("is_used, is_valid");

    if (error || !data) {
      return { total: 0, used: 0, expired: 0, valid: 0 };
    }

    const total = data.length;
    const used = data.filter((r) => r.is_used).length;
    const valid = data.filter((r) => r.is_valid && !r.is_used).length;
    const expired = data.filter((r) => !r.is_valid && !r.is_used).length;

    return { total, used, expired, valid };
  },

  /**
   * Gera novo token (delega para postSaleTokenAdapter)
   */
  async generate(
    email: string,
    contractRef?: string,
    expiresAt?: Date
  ): Promise<PostSaleToken | null> {
    return postSaleTokenAdapter.generate(email, contractRef, expiresAt);
  },

  /**
   * Revoga token (delega para postSaleTokenAdapter)
   */
  async revoke(tokenId: string): Promise<boolean> {
    return postSaleTokenAdapter.revoke(tokenId);
  },
};
