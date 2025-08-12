// src/lib/access/accountAdapter.ts

// Tipos vindos do DB (snake_case)
export type DBAccountRow = {
  id: string;
  name: string;
  subdomain: string;
  domain: string | null;
  status: string; // 'active' | 'trial' | 'suspended' | 'canceled' (pode variar em caixa)
};

export type DBMemberRow = {
  id: string;
  account_id: string;
  user_id: string;
  role: string;   // 'owner' | 'admin' | 'editor' | 'viewer'
  status: string; // 'pending' | 'active' | 'inactive' | 'revoked'
  permissions?: Record<string, unknown> | null;
};

// Tipos TS (camelCase)
export type AccountStatus = 'active' | 'trial' | 'suspended' | 'canceled';
export type MemberStatus  = 'pending' | 'active' | 'inactive' | 'revoked';
export type Role          = 'owner' | 'admin' | 'editor' | 'viewer';

export type AccountInfo = {
  id: string;
  name: string;
  subdomain: string;
  domain?: string;
  status: AccountStatus;
};

export type MemberInfo = {
  id: string;
  accountId: string;
  userId: string;
  role: Role;
  status: MemberStatus;
  permissions?: Record<string, unknown>;
};

// Normalizadores (sem lançar erro; fallback seguro)
const ROLES = ['owner', 'admin', 'editor', 'viewer'] as const;
const MSTAT = ['pending', 'active', 'inactive', 'revoked'] as const;
const ASTAT = ['active', 'trial', 'suspended', 'canceled'] as const;

export function normalizeRole(s?: string): Role {
  const v = (s ?? '').toLowerCase().trim();
  return (ROLES as readonly string[]).includes(v) ? (v as Role) : 'viewer';
}

export function normalizeMemberStatus(s?: string): MemberStatus {
  const v = (s ?? '').toLowerCase().trim();
  return (MSTAT as readonly string[]).includes(v) ? (v as MemberStatus) : 'active';
}

export function normalizeAccountStatus(s?: string): AccountStatus {
  const v = (s ?? '').toLowerCase().trim();
  return (ASTAT as readonly string[]).includes(v) ? (v as AccountStatus) : 'active';
}

// Relação esperada é 1:1; aceita array apenas como fallback defensivo
export function pickAccount(
  acc: DBAccountRow | DBAccountRow[] | null | undefined
): DBAccountRow | null {
  if (!acc) return null;
  return Array.isArray(acc) ? (acc[0] ?? null) : acc;
}

export function mapAccountFromDB(r: DBAccountRow): AccountInfo {
  return {
    id: r.id,
    name: r.name,
    subdomain: r.subdomain,
    domain: r.domain ?? undefined,
    status: normalizeAccountStatus(r.status),
  };
}

export function mapMemberFromDB(r: DBMemberRow): MemberInfo {
  return {
    id: r.id,
    accountId: r.account_id,
    userId: r.user_id,
    role: normalizeRole(r.role),
    status: normalizeMemberStatus(r.status),
    permissions: r.permissions ?? undefined,
  };
}
