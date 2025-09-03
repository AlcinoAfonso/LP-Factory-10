import { createClient } from "@/lib/supabase/server"; // caminho seguro para o repo atual
.map((row) => {
const accRow = pickAccount(row.accounts) as DBAccountRow | null;
if (!accRow) return null;
const account = mapAccountFromDB(accRow);
const member = mapMemberFromDB(row as DBMemberRow);
const accountOk = account.status === "active" || account.status === "trial";
const memberOk = member.status === "active";
return accountOk && memberOk ? { account, member } : null;
})
.filter((x): x is Chosen => Boolean(x));


if (rows.length === 0) return null;


// 4) Escolha da conta: pelo slug (params.account) > accountId > primeira
const wantedSlug = input?.params?.account?.trim().toLowerCase();


// Slug 'home' → estado público/onboarding (não escolher conta)
if (wantedSlug === "home") return null;


let chosen: Chosen | undefined;


if (wantedSlug) {
chosen = rows.find((x) => x.account.subdomain?.toLowerCase() === wantedSlug);
if (!chosen) return null; // slug informado mas não encontrado
} else if (input?.accountId) {
chosen = rows.find((x) => x.account.id === input.accountId);
} else {
chosen = rows[0];
}


if (!chosen) return null;


// 5) Monta AccessContext completo (objetos + shape plano)
const ctx: Access.AccessContext = {
// objetos ricos
account: chosen.account,
member: chosen.member,


// shape plano
account_id: chosen.account.id,
account_slug: chosen.account.subdomain,
role: chosen.member.role as Access.Role,
status: chosen.member.status as Access.MemberStatus,


// flags padrão (Fase 2 pode ligar via RPC)
is_super_admin: false,
acting_as: false,
plan: { id: "", name: "" },
limits: { max_lps: 0, max_conversions: 0, max_domains: 1 },
} as any;


return ctx;
