"use server";

import { revalidatePath } from "next/cache";
import { readAccountOfficialNiche } from "../../../lib/onboarding/niche-resolution/adapters/accountOfficialNicheAdapter";
import {
  claimNicheConversation, commitNicheConversation, readNicheConversation, readNicheDialogueMessages, releaseAccountNicheTurn,
} from "../../../lib/onboarding/niche-resolution/adapters/accountNicheDialogueAdapter";
import { conversationalMessage, requestNicheAgent } from "../../../lib/onboarding/niche-agent/runtime";
import { displayedOffer, nicheHistory, nicheSummaryContext } from "../../../lib/onboarding/niche-agent/dialogue";
import { readBusinessContextForNiche } from "../../../lib/communication-base/adapters/communicationBaseAdapter";
import { getAccessContext } from "@/lib/access/getAccessContext";
import type { MemberInfo } from "@/lib/access/adapters/accountAdapter";
import { isAccountNicheEditingEnabled, readAccountNicheProductGuard } from "../../../lib/onboarding/niche-resolution/adapters/accountTaxonomyAdapter";
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

async function nicheEditorContext(account: string) {
  if (!/^[a-z0-9][a-z0-9-]{0,62}$/.test(account) || account === "home") return null;
  const ctx = await getAccessContext({ params: { account }, throwOnReadError: true });
  const member = ctx?.member as MemberInfo | null | undefined;
  return ctx && !ctx.blocked && ctx.account?.status === "active" && member?.status === "active" && member.userId
    ? { ...ctx, member } : null;
}

async function loadAccountNicheConversation(account: string, home: boolean) {
  try {
    if (home && !isAccountNicheEditingEnabled()) return null;
    const ctx = await nicheEditorContext(account);
    if (!ctx?.account || !["owner", "admin", "editor"].includes(ctx.member.role)) return null;
    const [current, products, conversation] = await Promise.all([
      readAccountOfficialNiche(ctx.account.id), readAccountNicheProductGuard(ctx.account.id),
      readNicheConversation(ctx.account.id, ctx.member.userId),
    ]);
    if (!current.ok || products === null || !conversation.ok) return null;
    const niche = current.niche;
    const existingOnly = Boolean(home && products && niche && !niche.confirmed);
    return { blocked: Boolean(niche && products && !existingOnly), existingOnly,
      confirmed: Boolean(niche?.confirmed), hasNiche: Boolean(niche), dialogue: conversation.dialogue };
  } catch { return null; }
}

export async function loadBaseNicheConversationAction(account: string) {
  return loadAccountNicheConversation(account, false);
}

export async function loadHomeNicheConversationAction(account: string) {
  return loadAccountNicheConversation(account, true);
}

export async function converseBaseNicheAction(raw: unknown) {
  return converseNiche(raw, false);
}

export async function converseHomeNicheAction(raw: unknown) {
  return converseNiche(raw, true);
}

async function converseNiche(raw: unknown, home: boolean) {
  const parsed = conversationalMessage.safeParse(raw);
  const failure = { ok: false as const, message: GENERIC_ERROR };
  if (!parsed.success || (home && !isAccountNicheEditingEnabled())) return failure;
  const input = parsed.data;
  let fence: { accountId: string; userId: string; dialogueId: string; expectedVersion: number; turnToken: string } | null = null;
  try {
    const ctx = await nicheEditorContext(input.account);
    if (!ctx?.account || !["owner", "admin", "editor"].includes(ctx.member.role)) return failure;
    const identity = { accountId: ctx.account.id, userId: ctx.member.userId, dialogueId: input.dialogueId ?? input.requestId };
    const [current, business, products] = await Promise.all([
      readAccountOfficialNiche(identity.accountId),
      readBusinessContextForNiche({ accountId: identity.accountId, actorUserId: identity.userId }),
      readAccountNicheProductGuard(identity.accountId),
    ]);
    if (!current.ok || !business.ok || products === null) return failure;
    const niche = current.niche;
    const fixedNiche = home && products && niche && !niche.confirmed ? niche.name : null;
    const blocked = Boolean(products && niche && !fixedNiche);
    const productMessage = "A redefinição está indisponível porque a conta tem um produto cadastrado.";
    if (blocked && !niche?.confirmed) return { ok: false as const, message: productMessage };
    const expectedRevision = niche?.revision ?? null;
    const turnToken = crypto.randomUUID();
    const claim = await claimNicheConversation({ ...identity, turnToken, expectedRevision,
      expectedVersion: input.version, requestId: input.requestId, content: input.content });
    if (!claim) return { ok: false as const, message: blocked ? productMessage : "A conversa ou o nicho mudou. Atualize a página para continuar." };
    if (claim.replay) return { ok: true as const };
    fence = { ...identity, expectedVersion: claim.version, turnToken };
    const messages = await readNicheDialogueMessages(identity.dialogueId);
    if (!claim.summaryUpdatedAt || !messages) throw new Error("context_unavailable");
    if (fixedNiche && (claim.state.official?.description !== fixedNiche ||
      claim.state.official.legacyTaxonId !== niche?.taxonId ||
      claim.state.official.legacyUpdatedAt !== niche?.legacyUpdatedAt)) throw new Error("niche_changed");
    const proposed = claim.state.proposal ?? null;
    const shown = !fixedNiche || proposed === fixedNiche
      ? displayedOffer(claim.state.synthesis, messages, { niche: proposed, publicName: null }) : null;
    const prior = claim.summary ?? null;
    const turn = await requestNicheAgent(identity.accountId, identity.dialogueId, {
      message: input.content, history: nicheHistory(messages, input.requestId),
      displayed: shown, summary: nicheSummaryContext(prior),
      businessContext: JSON.stringify(business.value),
      officialNiche: niche?.confirmed ? niche.name : null, fixedNiche,
    }, prior);
    if (!turn) throw new Error("provider_unavailable");
    const acceptedProposal = turn.synthesis.accept ? shown?.niche ?? null : null;
    const written = await commitNicheConversation({ ...fence, reply: turn.reply, proposal: turn.offer?.niche ?? null,
      summary: turn.summary, observedSummary: prior, observedSummaryUpdatedAt: claim.summaryUpdatedAt,
      acceptedProposal, synthesis: turn.synthesis,
    });
    if (!written) throw new Error("turn_not_committed");
    if (acceptedProposal) revalidatePath("/a/" + input.account, "layout");
    return { ok: true as const };
  } catch {
    if (fence) await releaseAccountNicheTurn(fence).catch(() => false);
    return { ok: false as const, message: fence
      ? "A mensagem foi registrada. Tente novamente para obter a resposta." : GENERIC_ERROR };
  } finally {
    revalidatePath("/a/" + input.account + (home ? "" : "/base-comunicacao"));
  }
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
