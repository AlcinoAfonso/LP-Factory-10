// src/lib/access/types.ts

// Tipos compatíveis com o legado E8. Mantém os "nomes" esperados pelos imports.
// Pode continuar válidos no MVP 1:1 (member pode ficar null).

// Usa e reexporta a fonte única de verdade (bindings locais + reexport)
import type { AccountStatus, MemberStatus, MemberRole as Role } from '../types/status';
export type { AccountStatus, MemberStatus, MemberRole as Role } from '../types/status';

/** Códigos de erro usados no Access Context (compat) */
export type AccessErrorCode =
  | 'UNRESOLVED_TENANT'
  | 'FORBIDDEN_ACCOUNT'
  | 'INACTIVE_MEMBER'
  | 'NO_OWNER_GUARD'
  | string;

/** Info de plano/limites (mantém nomes esperados) */
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

/** Entidades opcionais (úteis para páginas que leem campos) */
export interface Account {
  id: string;
  name?: string | null;
  subdomain?: string | null;
  status?: AccountStatus | null;
}
export interface Member {
  role?: Role | null;
  status?: MemberStatus | null;
}

/** Contexto de Acesso (nome esperado: AccessContext) */
export interface AccessContext {
  // Campos “plan/limits” são lidos por algumas telas; manter por compat.
  plan?: PlanInfo;
  limits?: Limits;

  // Para páginas que ainda usam shape antigo:
  account_id?: string;
  account_slug?: string | null;

  // Para quem consome objetos inteiros:
  account?: Account | null;
  member?: Member | null;

  // Sinais de bloqueio/erro padronizados
  blocked?: boolean;
  error_code?: AccessErrorCode | null;

  // Flags legadas — podem ser ignoradas no MVP 1:1
  is_super_admin?: boolean;
  acting_as?: boolean;
}
