/**
 * Tipos canônicos de status - Fonte única de verdade
 * Baseados nos constraints do schema (Inventário Base Sólida)
 */

// accounts.accounts_status_chk
export type AccountStatus = 'active' | 'inactive' | 'suspended' | 'pending_setup';

// account_users.account_users_status_check
export type MemberStatus = 'pending' | 'active' | 'inactive' | 'revoked';

// account_users.account_users_role_check
export type MemberRole = 'owner' | 'admin' | 'editor' | 'viewer';
