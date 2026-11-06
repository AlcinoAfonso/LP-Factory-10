"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { readAttendanceCatalog } from "../../../lib/onboarding/pending-setup/adapters/pendingSetupCatalogContextAdapter";
import { readAccountSummaryForNiche } from "../../../lib/onboarding/pending-setup/adapters/pendingSetupAccountContextAdapter";
import { activeAncestors, projectAttendanceSummary, projectAttendanceText, type AttendanceContext } from "../../../lib/onboarding/pending-setup/attendance-core";
import { requestAttendance } from "../../../lib/onboarding/pending-setup/attendance-provider";
import { readBusinessContextForNiche } from "../../../lib/communication-base/adapters/communicationBaseAdapter";
import { getAccessContext } from "@/lib/access/getAccessContext";
import type { MemberInfo } from "@/lib/access/adapters/accountAdapter";
import { confirmAccountNiche, isAccountNicheEditingEnabled, readAccountNicheProductGuard, readActivePrimaryAccountTaxon, type ActivePrimaryAccountTaxon } from "../../../lib/onboarding/niche-resolution/adapters/accountTaxonomyAdapter";
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

const nicheTurnInput = z.object({
  account: z.string(), expectedTaxonId: z.uuid().nullable(), understanding: z.string().max(4000),
  messages: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().min(1).max(4000) }).strict()).max(8),
}).strict();

export async function converseAccountNicheAction(raw: z.input<typeof nicheTurnInput>) {
  try {
    const parsed = nicheTurnInput.safeParse(raw);
    if (!parsed.success) return { ok: false as const, message: "Não foi possível enviar a mensagem. Use até 4.000 caracteres." };
    const input = parsed.data;
    const ctx = await nicheEditorContext(input.account);
    if (!ctx?.account || !ctx.member || !["owner", "admin", "editor"].includes(ctx.member.role)) return { ok: false as const, message: GENERIC_ERROR };
    const [current, products, summary, catalog] = await Promise.all([
      readActivePrimaryAccountTaxon({ accountId: ctx.account.id }), readAccountNicheProductGuard(ctx.account.id),
      readAccountSummaryForNiche(ctx.account.id), readAttendanceCatalog(),
    ]);
    if (!current.ok || products === null || !summary.ok || !catalog) return { ok: false as const, message: "Não foi possível consultar o contexto do negócio agora. Tente novamente." };
    if ((current.taxon?.taxonId ?? null) !== input.expectedTaxonId) return { ok: false as const, message: "O nicho mudou. Reabra a conversa para conferir o vínculo atual." };
    if (current.taxon && products) return { ok: false as const, message: "A redefinição não está disponível porque esta conta já possui produto desenvolvido." };
    const savedContext = await readBusinessContextForNiche({ accountId: ctx.account.id, actorUserId: ctx.member.userId });
    if (!savedContext.ok) return { ok: false as const, message: "Não foi possível consultar a Base agora. Tente novamente." };
    const businessData = Object.fromEntries(Object.entries(savedContext.value).map(([key, value]) => [key, projectAttendanceText(value)]));
    const context: AttendanceContext = { purpose: "account_niche", preferredName: null,
      summary: projectAttendanceSummary(summary.summary), currentPrimaryTaxonId: current.taxon?.taxonId ?? null,
      publicName: businessData.business_name ?? null, businessData, catalog,
      displayedUnderstanding: projectAttendanceText(input.understanding),
      recent: input.messages.map(message => ({ ...message, content: projectAttendanceText(message.content) })),
    };
    const result = await requestAttendance({ accountId: ctx.account.id, context });
    if (!result.ok) return { ok: false as const, message: "Não foi possível conversar agora. Sua mensagem foi preservada; tente novamente." };
    // The model only proposes. Revalidate account access and the official link after the external call.
    const authorized = await nicheEditorContext(input.account);
    const latest = authorized?.account ? await readActivePrimaryAccountTaxon({ accountId: authorized.account.id }) : null;
    if (!authorized?.member || !["owner", "admin", "editor"].includes(authorized.member.role) || !latest?.ok ||
      latest.taxon?.taxonId !== current.taxon?.taxonId || latest.taxon?.revision !== current.taxon?.revision)
      return { ok: false as const, message: "O acesso ou o nicho mudou durante a conversa. Reabra o popup antes de confirmar." };
    const candidate = result.output.action === "existing" ? catalog.find(taxon => taxon.id === result.output.existingTaxonId) : null;
    return { ok: true as const, reply: result.output.reply,
      understanding: result.output.businessUnderstanding || input.understanding,
      proposal: candidate ? { taxonId: candidate.id, name: candidate.name } : null };
  } catch { return { ok: false as const, message: GENERIC_ERROR }; }
}

export async function saveAccountNicheAction(input: Readonly<{
  account: string; taxonId: string; expectedTaxonId: string | null; confirmed: boolean;
}>) {
  try {
    const ctx = await nicheEditorContext(input.account);
    if (!ctx?.account || !ctx.member || !["owner", "admin", "editor"].includes(ctx.member.role) || input.confirmed !== true) return { ok: false as const, message: GENERIC_ERROR };
    const current = await readActivePrimaryAccountTaxon({ accountId: ctx.account.id });
    if (!current.ok || (current.taxon?.taxonId ?? null) !== input.expectedTaxonId) return { ok: false as const, message: "O nicho mudou. Atualize a página e confira antes de confirmar novamente." };
    // Human confirmation is authority; validate the official catalog independently of conversation text.
    const catalog = await readAttendanceCatalog();
    const selected = catalog?.find(taxon => taxon.id === input.taxonId);
    if (!catalog || !selected || !activeAncestors(selected, catalog)) return { ok: false as const, message: "O nicho proposto não está mais disponível. Reabra a conversa." };
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
