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


// real_estate_lab_contents.real_estate_lab_contents_status_chk
export type RealEstateLabContentStatus =
  | 'idea'
  | 'draft'
  | 'review'
  | 'approved'
  | 'published'
  | 'archived';

// real_estate_lab_items.real_estate_lab_items_status_chk
export type RealEstateLabItemStatus =
  | 'open'
  | 'in_progress'
  | 'done'
  | 'discarded';
