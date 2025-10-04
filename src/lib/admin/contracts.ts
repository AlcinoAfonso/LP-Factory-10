// src/lib/admin/contracts.ts
/**
 * Tipos do domínio Admin (E7)
 * Fonte: view v_admin_tokens_with_usage + tabela post_sale_tokens
 */

export type PostSaleToken = {
  id: string;
  email: string;
  contract_ref?: string;
  expires_at: string; // ISO timestamp
  used_at?: string;
  used_by?: string;
  account_id?: string;
  meta?: Record<string, unknown>;
  created_at: string;
};

export type TokenWithUsage = {
  token_id: string;
  email: string;
  contract_ref?: string;
  expires_at: string;
  used_at?: string;
  used_by?: string;
  account_id?: string;
  account_slug?: string;
  acc_status?: string;
  is_used: boolean;
  is_valid: boolean;
  created_at: string;
};

export type TokenStats = {
  total: number;
  used: number;
  expired: number;
  valid: number;
};

export type TokenValidation = {
  valid: boolean;
  reason?: 'not_found' | 'already_used' | 'expired' | 'ok';
};
