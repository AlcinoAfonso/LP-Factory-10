/**
 * Tipos canônicos de status - Fonte única de verdade
 * Baseados nos constraints do schema (Inventário Base Sólida)
 */

// accounts.accounts_status_chk
export type AccountStatus =
  | 'active'
  | 'inactive'
  | 'suspended'
  | 'pending_setup';

// account_users.account_users_status_check
export type MemberStatus =
  | 'pending'
  | 'active'
  | 'inactive'
  | 'revoked';

// account_users.account_users_role_check
export type MemberRole =
  | 'owner'
  | 'admin'
  | 'editor'
  | 'viewer';

// account_landing_pages_status_chk — estado expandido durante o rollout E19.5
export type LandingPageStatus = 'draft' | 'active' | 'archived';

export type OperationalLandingPageStatus = Exclude<
  LandingPageStatus,
  'archived'
>;

export function isOperationalLandingPageStatus(
  value: unknown,
): value is OperationalLandingPageStatus {
  return value === 'draft' || value === 'active';
}
