import { createClient } from "@/supabase/server";


// 3) Normaliza rows e descarta contas fora de active|trial
const rows = (data as any[])
.map((row) => {
const accRow = pickAccount(row.accounts) as DBAccountRow | null;
if (!accRow) return null;
const account = mapAccountFromDB(accRow);
const member = mapMemberFromDB(row as DBMemberRow);
const accountOk = account.status === "active" || account.status === "trial";
const memberOk = member.status === "active";
return accountOk && memberOk ? { account, member } : null;
})
.filter(Boolean) as {
account: ReturnType<typeof mapAccountFromDB>;
member: ReturnType<typeof mapMemberFromDB>;
}[];


if (rows.length === 0) return null;


// 4) Escolha da conta: pelo slug (params.account) > accountId > primeira
const wantedSlug = input?.params?.account?.trim().toLowerCase();


// Se slug presente e for 'home', tratamos como público/onboarding → não escolher conta
if (wantedSlug === "home") {
return null;
}


let chosen:
| { account: ReturnType<typeof mapAccountFromDB>; member: ReturnType<typeof mapMemberFromDB> }
| undefined;


if (wantedSlug) {
chosen = rows.find((x) => x.account.subdomain?.toLowerCase() === wantedSlug);
// Se slug informado não encontrou conta válida, não fazer fallback silencioso
if (!chosen) return null;
} else if (input?.accountId) {
chosen = rows.find((x) => x.account.id === input.accountId);
} else {
chosen = rows[0];
}


if (!chosen) return null;


// 5) Monta AccessContext completo (objetos + shape plano)
const ctx: any = {
// objetos ricos para a UI atual
account: chosen.account,
member: chosen.member,


// shape plano legado/compatível
account_id: chosen.account.id,
account_slug: chosen.account.subdomain,
role: chosen.member.role as Access.Role,
status: chosen.member.status as Access.MemberStatus,


// flags padrão (Fase 2 pode ligar via RPC)
is_super_admin: false,
acting_as: false,
plan: { id: "", name: "" },
limits: {
max_lps: 0,
max_conversions: 0,
max_domains: 1,
},
};


return ctx as Access.AccessContext;
}
