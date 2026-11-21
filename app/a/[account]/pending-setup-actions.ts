"use server";

import "server-only";
import { getAccountOfficialNiche } from "../../../lib/onboarding/niche-resolution/adapters/accountOfficialNicheAdapter";

import { revalidatePath } from "next/cache";
import { getAccessContext } from "@/lib/access/getAccessContext";
import { getConfirmedOperationalNicheResolutionLabel } from "../../../lib/onboarding/niche-resolution/adapters/accountNicheResolutionUserAdapter";
import { validateBusinessDisplayName } from "../../../lib/onboarding/pending-setup";
import { conversationalMessage, requestNicheAgent } from "../../../lib/onboarding/niche-agent/runtime";
import { displayedOffer, nicheHistory, nicheSummaryContext } from "../../../lib/onboarding/niche-agent/dialogue";
import { readAccountOfficialNiche } from "../../../lib/onboarding/niche-resolution/adapters/accountOfficialNicheAdapter";
import { readActivePrimaryAccountTaxon } from "../../../lib/onboarding/niche-resolution/adapters/accountTaxonomyAdapter";
import {
  claimPendingNicheTurn,
  commitPendingNicheTurn,
  completePendingSetup,
  loadPendingSetupConversation,
  releasePendingNicheTurn,
  setPendingSetupBusinessDisplayName,
} from "../../../lib/onboarding/pending-setup/adapters/pendingSetupConversationAdapter";
import { isE1011PassageEnabled, isE1012AttendanceEnabled } from "../../../lib/onboarding/pending-setup/config";

export type PendingSetupActionState = Readonly<{
  ok: boolean;
  fieldError?: string;
  formError?: string;
}>;

const GENERIC_ERROR = "Não foi possível continuar agora. Tente novamente.";

async function getPendingSetupActor(accountSubdomain: string) {
  const route = accountSubdomain ? `/a/${accountSubdomain}` : "/a";
  if (!accountSubdomain) return { ok: false as const, route };

  const ctx = await getAccessContext({
    params: { account: accountSubdomain },
    route,
  });
  const accountId = (ctx?.account?.id ?? ctx?.account_id ?? null) as string | null;
  const userId = (
    (ctx?.member as { userId?: string } | null | undefined)?.userId ?? null
  ) as string | null;
  const role = ctx?.member?.role ?? null;

  if (
    !ctx ||
    ctx.blocked ||
    ctx.account?.status !== "pending_setup" ||
    role !== "owner" ||
    !accountId ||
    !userId
  ) {
    return { ok: false as const, route };
  }

  return { ok: true as const, route, accountId, userId };
}

export async function completePendingSetupAction(
  _previousState: PendingSetupActionState,
  formData: FormData,
): Promise<PendingSetupActionState> {
  const actor = await getPendingSetupActor(String(formData.get("account_subdomain") ?? "").trim().toLowerCase());
  if (!actor.ok) return { ok: false, formError: GENERIC_ERROR };

  const conversationId = String(formData.get("conversation_id") ?? "").trim();
  const expectedVersion = Number(formData.get("expected_version"));
  const conversation = await loadPendingSetupConversation({
    accountId: actor.accountId,
    userId: actor.userId,
  });
  if (
    !conversation ||
    conversation.id !== conversationId ||
    conversation.stage !== "ready_to_complete" ||
    conversation.version !== expectedVersion
  ) {
    return { ok: false, formError: "Esta conversa mudou. Recarregue para continuar." };
  }
  if (isE1011PassageEnabled() && !conversation.businessDisplayName) {
    return { ok: false, formError: "Informe o nome público antes de continuar." };
  }

  const [primaryTaxon, operationalLabel] = await Promise.all([
    getAccountOfficialNiche({ accountId: actor.accountId }),
    getConfirmedOperationalNicheResolutionLabel({ accountId: actor.accountId }),
  ]);
  const resolutionOutcome = primaryTaxon?.confirmed
    ? "official" as const
    : operationalLabel
      ? "operational_fallback" as const
      : null;
  if (!resolutionOutcome) return { ok: false, formError: GENERIC_ERROR };

  const completed = await completePendingSetup({
    conversationId,
    accountId: actor.accountId,
    userId: actor.userId,
    expectedVersion,
    resolutionOutcome,
  });
  if (!completed.ok) {
    return {
      ok: false,
      formError: completed.reason === "conflict"
        ? "Esta conversa foi atualizada em outra aba. Recarregue para continuar."
        : GENERIC_ERROR,
    };
  }

  revalidatePath(actor.route);
  return { ok: true };
}

export async function savePendingSetupBusinessDisplayNameAction(
  _previousState: PendingSetupActionState,
  formData: FormData,
): Promise<PendingSetupActionState> {
  if (!isE1011PassageEnabled() || isE1012AttendanceEnabled()) return { ok: false, formError: GENERIC_ERROR };
  const actor = await getPendingSetupActor(String(formData.get("account_subdomain") ?? "").trim().toLowerCase());
  if (!actor.ok) return { ok: false, formError: GENERIC_ERROR };
  const conversationId = String(formData.get("conversation_id") ?? "").trim();
  const expectedVersion = Number(formData.get("expected_version"));
  if (!conversationId || !Number.isSafeInteger(expectedVersion) || expectedVersion < 1) {
    return { ok: false, formError: GENERIC_ERROR };
  }
  const validated = validateBusinessDisplayName(formData.get("business_display_name"));
  if (!validated.ok) {
    return { ok: false, fieldError: validated.reason === "too_long"
      ? "Use no máximo 120 caracteres."
      : "Informe um nome público válido para o negócio ou profissional." };
  }
  const conversation = await loadPendingSetupConversation({
    accountId: actor.accountId,
    userId: actor.userId,
  });
  if (!conversation || conversation.id !== conversationId ||
    conversation.stage !== "ready_to_complete" || conversation.version !== expectedVersion) {
    return { ok: false, formError: "Esta conversa mudou. Recarregue para continuar." };
  }
  const result = await setPendingSetupBusinessDisplayName({
    conversationId,
    accountId: actor.accountId,
    userId: actor.userId,
    businessDisplayName: validated.value,
    expectedVersion,
  });
  if (!result.ok) {
    return { ok: false, formError: result.reason === "conflict"
      ? "Esta conversa foi atualizada em outra aba. Recarregue para continuar."
      : GENERIC_ERROR };
  }
  revalidatePath(actor.route);
  return { ok: true };
}

export async function conversePendingSetupAction(raw: unknown) {
  const input = conversationalMessage.safeParse(raw);
  const failure = { ok: false as const, message: GENERIC_ERROR };
  if (!input.success || !input.data.dialogueId || !isE1012AttendanceEnabled()) return failure;
  const { account, dialogueId, version, requestId, content } = input.data;
  const actor = await getPendingSetupActor(account);
  if (!actor.ok) return failure;
  const identity = { accountId: actor.accountId, userId: actor.userId, conversationId: dialogueId, token: crypto.randomUUID() };
  const claim = await claimPendingNicheTurn({ ...identity, version, requestId, content });
  if (!claim) return { ok: false as const, message: "A conversa mudou. Atualize a página para continuar." };
  if (claim.replay) return { ok: true as const };
  const fence = { ...identity, version: claim.version };

  try {
    const [conversation, official, taxonomy] = await Promise.all([
      loadPendingSetupConversation(actor), readAccountOfficialNiche(actor.accountId),
      readActivePrimaryAccountTaxon({ accountId: actor.accountId }),
    ]);
    if (conversation?.id !== dialogueId || conversation.version !== claim.version ||
      !conversation.accountContext || !official.ok || !taxonomy.ok) throw new Error("context_unavailable");
    const { dialogueState: state, accountContext: observed, attendanceProposal: saved } = conversation;
    const niche = official.niche;
    const revision = niche?.textRevision ?? 0;
    const savedNiche = saved?.kind === "semantic" && saved.expectedNicheRevision === revision
      ? saved.nicheDescription ?? null : null;
    const shown = saved?.kind === "semantic" && !savedNiche ? null : displayedOffer(state?.synthesis, conversation.messages, {
      niche: savedNiche, publicName: state?.nameProposal ?? null,
    });
    const publicName = conversation.businessDisplayName ?? state?.acceptedName ?? null;
    const publicNameRequired = isE1011PassageEnabled();
    const result = await requestNicheAgent(actor.accountId, dialogueId, {
      message: content, history: nicheHistory(conversation.messages, requestId),
      displayed: shown, summary: nicheSummaryContext(observed.summary),
      businessContext: [conversation.businessContextText,
        conversation.businessNameCandidate && "Nome anteriormente informado: " + conversation.businessNameCandidate]
        .filter(Boolean).join("\n").slice(0, 4000) || null,
      officialNiche: niche?.confirmed ? niche.name : null,
      pendingSetup: {
        publicName, publicNameRequired,
        preferredName: conversation.preferredName ?? (conversation.preferredNameDeclined ? false : null),
      },
    }, observed.summary);
    if (!result) throw new Error("provider_unavailable");
    const accepted = result.synthesis.accept ? shown : null;
    const keep = !result.offer && !result.synthesis.clear && !accepted;
    const next = result.offer?.niche
      ? { kind: "semantic" as const, taxonId: null, taxonName: null, nicheDescription: result.offer.niche, expectedNicheRevision: revision }
      : result.offer && !niche?.confirmed
        ? { kind: "operational_fallback" as const, taxonId: null, taxonName: null }
        : keep && shown ? saved : null;
    const accept = Boolean(accepted && saved);
    const ready = Boolean(accepted && (accept || niche?.confirmed) &&
      (!publicNameRequired || accepted.publicName || publicName));
    const keepName = !result.offer?.publicName && (keep || state?.acceptedName);
    const written = await commitPendingNicheTurn({ ...fence, reply: result.reply, summary: result.summary, observed,
      understanding: result.offer?.summary ?? accepted?.summary ?? conversation.businessContextText ?? "",
      preferredName: typeof result.preferredName === "string" ? result.preferredName : null,
      preferredNameDeclined: result.preferredName === false || (result.preferredName === null && Boolean(conversation.preferredNameDeclined)),
      stage: next ? "niche_confirmation" : ready ? "ready_to_complete" : "business_understanding",
      proposal: next, accept, observedTaxon: taxonomy.taxon?.taxonId ?? null, observedRevision: revision,
      nameProposal: result.offer?.publicName ?? null,
      nameReaction: accepted?.publicName ? "accept" : keepName ? "keep" : "clear",
      clearOperational: result.synthesis.clear, synthesis: result.synthesis,
    });
    if (!written) throw new Error("turn_not_committed");
    return { ok: true as const };
  } catch {
    await releasePendingNicheTurn(fence).catch(() => null);
    return { ok: false as const, message: "A mensagem foi registrada. Tente novamente para obter a resposta." };
  } finally {
    revalidatePath(actor.route);
  }
}
