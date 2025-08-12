// src/lib/access/adapters/accountAdapter.ts
export type DBAccountRow={id:string;name:string;subdomain:string;domain:string|null;status:string};
export type DBMemberRow={id:string;account_id:string;user_id:string;role:string;status:string;permissions?:Record<string,unknown>|null};

export type AccountStatus='active'|'trial'|'suspended'|'canceled';
export type MemberStatus='pending'|'active'|'inactive'|'revoked';
export type Role='owner'|'admin'|'editor'|'viewer';

export type AccountInfo={id:string;name:string;subdomain:string;domain?:string;status:AccountStatus};
export type MemberInfo={id:string;accountId:string;userId:string;role:Role;status:MemberStatus;permissions?:Record<string,unknown>};

const ROLES=['owner','admin','editor','viewer'] as const;
const MSTAT=['pending','active','inactive','revoked'] as const;
const ASTAT=['active','trial','suspended','canceled'] as const;

export const normalizeRole=(s?:string):Role=>{
  const v=(s??'').toLowerCase().trim(); return (ROLES as readonly string[]).includes(v)?(v as Role):'viewer';
};
export const normalizeMemberStatus=(s?:string):MemberStatus=>{
  const v=(s??'').toLowerCase().trim(); return (MSTAT as readonly string[]).includes(v)?(v as MemberStatus):'active';
};
export const normalizeAccountStatus=(s?:string):AccountStatus=>{
  const v=(s??'').toLowerCase().trim(); return (ASTAT as readonly string[]).includes(v)?(v as AccountStatus):'active';
};

export const pickAccount=(acc:DBAccountRow|DBAccountRow[]|null|undefined)=>!acc?null:(Array.isArray(acc)?(acc[0]??null):acc);

export const mapAccountFromDB=(r:DBAccountRow):AccountInfo=>({
  id:r.id,name:r.name,subdomain:r.subdomain,domain:r.domain??undefined,status:normalizeAccountStatus(r.status),
});
export const mapMemberFromDB=(r:DBMemberRow):MemberInfo=>({
  id:r.id,accountId:r.account_id,userId:r.user_id,role:normalizeRole(r.role),status:normalizeMemberStatus(r.status),permissions:r.permissions??undefined,
});
