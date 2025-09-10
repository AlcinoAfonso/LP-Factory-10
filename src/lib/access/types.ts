/**
 * Tipos centrais do Contexto de Acesso
 * Alinhado ao MRVG 1.4 (Bloco F) + MRVG 1.3 (E8)
 * Mantém compatibilidade com o legado (Doc Principal v6 + Anexo: Account Dashboard v3).
 */

export type MemberStatus = 'active' | 'pending' | 'inactive' | 'revoked';
export type Role = 'owner' | 'admin' | 'editor' | 'viewer';

/** Status textual da conta (DB), incluindo 'trial' usado no projeto */
export type AccountStatus = 'active' | 'inactive' | 'trial' | (string & {});

/** Códigos padronizados de erro/bloqueio do Access Context */
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

/**
 * Shape legado do Access Context (compatível com UI atual),
 * com acréscimos Opcionais para o E8:
 *  - blocked?: sinaliza bloqueio no SSR (em vez de lançar erro)
 *  - error_code?: motivo padronizado (reutiliza AccessErrorCode)
 *  - account_status?: opcional para uso interno de SSR/guards
 */
export interface AccessContext {
  account_id: string;
  account_slug: string; // subdomínio ou slug de rota
  role: Role;
  status: MemberStatus;
  is_super_admin: boolean;
  acting_as: boolean;
  plan: PlanInfo;
  limits: Limits;

  /** Campos opcionais do E8 (não quebram chamadas atuais) */
  blocked?: boolean;
  error_code?: AccessErrorCode;
  account_status?: AccountStatus;
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
