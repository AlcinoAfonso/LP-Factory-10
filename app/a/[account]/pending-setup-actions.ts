"use server";

import "server-only";
import { getAccountOfficialNiche } from "../../../lib/onboarding/niche-resolution/adapters/accountOfficialNicheAdapter";

import { revalidatePath } from "next/cache";
import { getAccessContext } from "@/lib/access/getAccessContext";
import { getConfirmedOperationalNicheResolutionLabel } from "../../../lib/onboarding/niche-resolution/adapters/accountNicheResolutionUserAdapter";
import { validateBusinessDisplayName } from "../../../lib/onboarding/pending-setup";
import { conversationalMessage, currentSynthesis, mergeNicheMemory, nicheSummaryContext, requestNicheAgent } from "../../../lib/onboarding/niche-agent/runtime";
import { relevantNicheHistory } from "../../../lib/onboarding/niche-agent/dialogue";
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
    const state = conversation.dialogueState;
    const niche = official.niche;
    const saved = conversation.attendanceProposal;
    const officialRevision = niche?.confirmed ? niche.revision : null;
    const active = saved?.kind === "semantic" && saved.expectedNicheRevision === (niche?.textRevision ?? 0)
      ? { id: dialogueId + ":proposal", description: saved.nicheDescription!, expectedOfficialRevision: officialRevision }
      : null;
    const operationalProposal = saved?.kind === "operational_fallback" ? conversation.businessContextText : null;
    const synthesis = saved?.kind === "semantic" && !active ? null : currentSynthesis(state, conversation.messages);
    const observed = conversation.accountContext;
    const summary = nicheSummaryContext(observed.summary);
    const result = await requestNicheAgent(actor.accountId, dialogueId, {
      message: { id: requestId, text: content, replyToProposalId: active?.id ?? null },
      history: relevantNicheHistory(conversation.messages, requestId, content),
      activeSynthesis: synthesis && { id: synthesis.id, text: synthesis.text, accepted: synthesis.accepted, partialReply: synthesis.partialReply },
      nicheAccepted: state?.nicheAccepted,
      summary: summary.text,
      businessContext: (conversation.businessNameCandidate
        ? [conversation.businessContextText, "Nome anteriormente informado: " + conversation.businessNameCandidate]
          .filter(Boolean).join("\n").slice(0, 4000)
        : conversation.businessContextText),
      officialNiche: niche?.confirmed ? { description: niche.name, revision: niche.revision } : null,
      activeProposal: active,
      pendingSetup: {
        nameProposal: state?.nameProposal ?? null,
        acceptedName: state?.acceptedName ?? conversation.businessDisplayName,
        preferredName: conversation.preferredName,
        preferredNameDeclined: Boolean(conversation.preferredNameDeclined),
        operationalProposal,
        operationalAccepted: Boolean(state?.operationalAccepted),
        whatsappKnown: summary.whatsappKnown || Boolean(synthesis?.phone || synthesis?.declined),
      },
    }, conversation.businessNameCandidate);
    const outcome = result?.pendingSetup;
    if (!result || !outcome) throw new Error("provider_unavailable");
    const acceptedSynthesis = !result.synthesisWrite.offer && !result.synthesisWrite.clear &&
      Boolean(result.synthesisWrite.accept || synthesis?.accepted);
    const keepNiche = active && !result.proposal && (result.reaction === "continue" || result.reaction === "accept");
    const acceptOperational = acceptedSynthesis && Boolean(operationalProposal) &&
      (outcome.operational.reaction === "accept" || Boolean(result.synthesisWrite.accept && synthesis?.text === operationalProposal));
    const accept = Boolean(acceptedSynthesis && keepNiche && (result.confirmation || state?.nicheAccepted)) || acceptOperational;
    const next = result.proposal
      ? { kind: "semantic" as const, taxonId: null, taxonName: null, nicheDescription: result.proposal,
          expectedNicheRevision: niche?.textRevision ?? 0 }
      : outcome.operational.proposal
        ? { kind: "operational_fallback" as const, taxonId: null, taxonName: null }
        : !accept && (keepNiche ||
            (operationalProposal && outcome.operational.reaction === "continue")) ? saved : null;
    const understanding = outcome.operational.proposal ?? result.synthesis.proposal ?? synthesis?.text ??
      result.proposal ?? conversation.businessContextText ??
      result.memory.find(entry => entry.kind === "declaration")?.text ?? "";
    const nameReady = !isE1011PassageEnabled() || Boolean(conversation.businessDisplayName ||
      (outcome.publicName.reaction === "accept" && state?.nameProposal) ||
      (outcome.publicName.reaction === "continue" && !outcome.publicName.proposal && state?.acceptedName));
    const ready = !next && acceptedSynthesis && nameReady && Boolean(understanding) &&
      (accept || niche?.confirmed || (state?.operationalAccepted && outcome.operational.reaction === "continue"));
    const written = await commitPendingNicheTurn({ ...fence, reply: result.reply,
      summary: mergeNicheMemory(observed.summary, result, synthesis),
      observed, understanding, preferredName: outcome.preferredName.value,
      preferredNameDeclined: outcome.preferredName.value ? false : outcome.preferredName.declined || Boolean(conversation.preferredNameDeclined),
      stage: next ? "niche_confirmation" : ready ? "ready_to_complete" : "business_understanding",
      proposal: next, accept, observedTaxon: taxonomy.taxon?.taxonId ?? null,
      observedRevision: niche?.textRevision ?? 0, nameProposal: outcome.publicName.proposal,
      nameReaction: outcome.publicName.reaction === "continue" ? "keep" : outcome.publicName.reaction,
      clearOperational: outcome.operational.reaction === "clear" || result.synthesisWrite.clear,
      synthesis: result.synthesisWrite,
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
