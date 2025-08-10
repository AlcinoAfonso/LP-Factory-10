/**
 * Tipos centrais do Contexto de Acesso
 * Alinhado ao Doc Principal v6 + Anexo: Account Dashboard v3
 */

export type MemberStatus = 'active' | 'pending' | 'inactive' | 'revoked';
export type Role = 'owner' | 'admin' | 'editor' | 'viewer';

export type AccessErrorCode =
  | 'UNRESOLVED_TENANT'
  | 'FORBIDDEN_ACCOUNT'
  | 'INACTIVE_MEMBER'
  | 'NO_OWNER_GUARD';

export interface PlanInfo {
  id: string;
  name: string;
}

export interface Limits {
  max_lps: number;
  max_conversions: number;
  max_domains: number;
  // Fallback para outros limites/flags vindos do backend
  [key: string]: number | boolean;
}

export interface AccessContext {
  account_id: string;
  account_slug: string; // subdomínio ou slug de rota
  role: Role;
  status: MemberStatus;
  is_super_admin: boolean;
  acting_as: boolean;
  plan: PlanInfo;
  limits: Limits;
}

/** Entrada padrão para resolução de contexto (usada pelo middleware e server actions) */
export interface AccessInput {
  host?: string;
  pathname?: string;
  params?: { account?: string }; // fallback de rota: /a/[account]/...
}

/** Erro tipado para padronizar UX e logs */
export class AccessError extends Error {
  code: AccessErrorCode;
  constructor(code: AccessErrorCode, message?: string) {
    super(message ?? code);
    this.code = code;
    this.name = 'AccessError';
  }
}
