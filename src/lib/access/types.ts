// src/lib/access/types.ts
// Tipos mínimos para compilar o legado E8 e também servir ao MVP 1:1.
// Apenas TYPEs; não muda comportamento em runtime.

export type AccountStatus = 'active' | 'suspended' | 'deleted' | string;
export type MemberRole   = 'owner'  | 'admin'     | 'editor'  | 'viewer' | string;
export type MemberStatus = 'active' | 'inactive'  | 'invited' | string;

export type Account = {
  id: string;
  name?: string | null;
  subdomain?: string | null;
  status?: AccountStatus | null;
};

export type Member = {
  role?: MemberRole | null;
  status?: MemberStatus | null;
};

export type AccessContext = {
  account?: Account | null;
  member?: Member | null;          // No MVP 1:1 pode ficar null sempre
  account_slug?: string | null;
  blocked?: boolean;
  error_code?: string | null;
};
