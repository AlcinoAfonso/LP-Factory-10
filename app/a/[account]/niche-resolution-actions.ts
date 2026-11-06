"use server";

import { revalidatePath } from "next/cache";
import { getAccessContext } from "@/lib/access/getAccessContext";
import type { MemberInfo } from "@/lib/access/adapters/accountAdapter";
import { confirmAccountNiche, isAccountNicheEditingEnabled, readAccountNicheProductGuard, readActivePrimaryAccountTaxon, type ActivePrimaryAccountTaxon } from "../../../lib/onboarding/niche-resolution/adapters/accountTaxonomyAdapter";
import { matchBusinessTaxonsDeterministic } from "../../../lib/onboarding/niche-resolution/adapters/taxonMatchAdapter";
import {
  confirmAiOptionForAccount,
  confirmAiSuggestedTaxonForAccount,
  dismissAiNicheResolutionForAccount,
  rewriteAiNicheResolutionForAccount,
} from "../../../lib/onboarding/niche-resolution/adapters/accountNicheResolutionUserAdapter";

export type NicheResolutionActionState = {
  ok: boolean;
  formError?: string;
};

const GENERIC_ERROR = "Não foi possível registrar sua resposta agora. Tente novamente.";

export type AccountNicheEditorState =
  | { ok: true; taxon: ActivePrimaryAccountTaxon | null; hasProducts: boolean; canEdit: boolean }
  | { ok: false; message: string };

async function nicheEditorContext(account: string) {
  if (!isAccountNicheEditingEnabled() || !/^[a-z0-9][a-z0-9-]{0,62}$/.test(account) || account === "home") return null;
  const ctx = await getAccessContext({ params: { account }, throwOnReadError: true });
  const member = ctx?.member as MemberInfo | null | undefined;
  return ctx && !ctx.blocked && ctx.account?.status === "active" && member?.status === "active" && member.userId
    ? { ...ctx, member } : null;
}

export async function loadAccountNicheEditorAction(account: string): Promise<AccountNicheEditorState> {
  try {
    const ctx = await nicheEditorContext(account);
    if (!ctx?.account) return { ok: false, message: "A definição de nicho não está disponível para este acesso." };
    const [taxonomy, hasProducts] = await Promise.all([
      readActivePrimaryAccountTaxon({ accountId: ctx.account.id }), readAccountNicheProductGuard(ctx.account.id),
    ]);
    if (!taxonomy.ok || hasProducts === null) return { ok: false, message: "Não foi possível consultar o nicho agora. Tente novamente." };
    return { ok: true, taxon: taxonomy.taxon, hasProducts, canEdit: ["owner", "admin", "editor"].includes(ctx.member!.role) };
  } catch { return { ok: false, message: GENERIC_ERROR }; }
}

export async function searchAccountNicheAction(account: string, query: string) {
  try {
    const ctx = await nicheEditorContext(account);
    if (!ctx?.member || !["owner", "admin", "editor"].includes(ctx.member.role)) return { ok: false as const, message: GENERIC_ERROR };
    if (typeof query !== "string" || query.trim().length < 2 || query.length > 120) return { ok: false as const, message: "Descreva o nicho em 2 a 120 caracteres." };
    const matches = await matchBusinessTaxonsDeterministic(query, 20);
    return matches.ok ? { ok: true as const, candidates: matches.candidates.map(({ taxonId, name, parentName }) => ({ taxonId, name, parentName })) }
      : { ok: false as const, message: "Não foi possível buscar os nichos agora. Tente novamente." };
  } catch { return { ok: false as const, message: GENERIC_ERROR }; }
}

export async function saveAccountNicheAction(input: Readonly<{
  account: string; query: string; taxonId: string; expectedTaxonId: string | null; confirmed: boolean;
}>) {
  try {
    const ctx = await nicheEditorContext(input.account);
    if (!ctx?.account || !ctx.member || !["owner", "admin", "editor"].includes(ctx.member.role) || input.confirmed !== true) return { ok: false as const, message: GENERIC_ERROR };
    const current = await readActivePrimaryAccountTaxon({ accountId: ctx.account.id });
    if (!current.ok || (current.taxon?.taxonId ?? null) !== input.expectedTaxonId) return { ok: false as const, message: "O nicho mudou. Atualize a página e confira antes de confirmar novamente." };
    // Recheck the allowed choice server-side; a client-supplied option is not authority.
    if (input.taxonId !== current.taxon?.taxonId) {
      const search = await searchAccountNicheAction(input.account, input.query);
      if (!search.ok || !search.candidates.some(candidate => candidate.taxonId === input.taxonId)) return { ok: false as const, message: "Busque e selecione um nicho oficial antes de confirmar." };
    }
    const saved = await confirmAccountNiche({ accountId: ctx.account.id, actorUserId: ctx.member.userId,
      taxonId: input.taxonId, expectedTaxonId: input.expectedTaxonId });
    if (!saved.ok) return { ok: false as const, message: saved.reason === "product_exists"
      ? "A redefinição não está disponível porque esta conta já possui produto desenvolvido."
      : saved.reason === "conflict" ? "O nicho mudou. Atualize a página e confira antes de confirmar novamente." : GENERIC_ERROR };
    revalidatePath(`/a/${input.account}`, "layout");
    return { ok: true as const };
  } catch { return { ok: false as const, message: GENERIC_ERROR }; }
}

async function getAllowedAccountContext(formData: FormData) {
  const accountSubdomain = String(formData.get("account_subdomain") ?? "")
    .trim()
    .toLowerCase();
  const route = accountSubdomain ? `/a/${accountSubdomain}` : "/a";

  if (!accountSubdomain) return { ok: false as const, route, accountId: null };

  const ctx = await getAccessContext({
    params: { account: accountSubdomain },
    route,
  });

  if (!ctx || ctx.blocked || ctx.account?.status !== "active") {
    return { ok: false as const, route, accountId: null };
  }

  const accountId = (ctx.account?.id ?? ctx.account_id ?? null) as string | null;
  if (!accountId) return { ok: false as const, route, accountId: null };

  return { ok: true as const, route, accountId };
}

export async function confirmSuggestedNicheResolutionAction(
  _previousState: NicheResolutionActionState,
  formData: FormData,
): Promise<NicheResolutionActionState> {
  const ctx = await getAllowedAccountContext(formData);
  if (!ctx.ok || !ctx.accountId) return { ok: false, formError: GENERIC_ERROR };

  const result = await confirmAiSuggestedTaxonForAccount({ accountId: ctx.accountId });
  revalidatePath(ctx.route);

  if (!result.ok) return { ok: false, formError: GENERIC_ERROR };
  return { ok: true };
}

export async function confirmOptionNicheResolutionAction(
  _previousState: NicheResolutionActionState,
  formData: FormData,
): Promise<NicheResolutionActionState> {
  const ctx = await getAllowedAccountContext(formData);
  if (!ctx.ok || !ctx.accountId) return { ok: false, formError: GENERIC_ERROR };

  const taxonId = String(formData.get("taxon_id") ?? "").trim();
  const optionName = String(formData.get("option_name") ?? "").trim();
  if (!taxonId && !optionName) return { ok: false, formError: GENERIC_ERROR };

  const result = await confirmAiOptionForAccount({
    accountId: ctx.accountId,
    taxonId: taxonId || null,
    optionName: optionName || null,
  });
  revalidatePath(ctx.route);

  if (!result.ok) return { ok: false, formError: GENERIC_ERROR };
  return { ok: true };
}

export async function rewriteNicheResolutionAction(
  _previousState: NicheResolutionActionState,
  formData: FormData,
): Promise<NicheResolutionActionState> {
  const ctx = await getAllowedAccountContext(formData);
  if (!ctx.ok || !ctx.accountId) return { ok: false, formError: GENERIC_ERROR };

  const rewriteInput = String(formData.get("rewrite_input") ?? "");
  const result = await rewriteAiNicheResolutionForAccount({
    accountId: ctx.accountId,
    rewriteInput,
  });
  revalidatePath(ctx.route);

  if (!result.ok) {
    if (result.reason === "empty_rewrite") {
      return { ok: false, formError: "Informe um nicho para continuar." };
    }
    if (result.reason === "rewrite_too_long") {
      return { ok: false, formError: "Use no máximo 120 caracteres." };
    }
    return { ok: false, formError: GENERIC_ERROR };
  }

  return { ok: true };
}

export async function dismissNicheResolutionAction(
  _previousState: NicheResolutionActionState,
  formData: FormData,
): Promise<NicheResolutionActionState> {
  const ctx = await getAllowedAccountContext(formData);
  if (!ctx.ok || !ctx.accountId) return { ok: false, formError: GENERIC_ERROR };

  const result = await dismissAiNicheResolutionForAccount({ accountId: ctx.accountId });
  revalidatePath(ctx.route);

  if (!result.ok) return { ok: false, formError: GENERIC_ERROR };
  return { ok: true };
}
