"use server";

import "server-only";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getAccessContext } from "@/lib/access/getAccessContext";
import { clientOpenAiCostContext } from "../../../lib/openai-costs";
import {
  confirmAiSuggestedTaxonForAccount,
  confirmOperationalNicheForPendingSetup,
  getConfirmedOperationalNicheResolutionLabel,
} from "../../../lib/onboarding/niche-resolution/adapters/accountNicheResolutionUserAdapter";
import { getActivePrimaryAccountTaxon } from "../../../lib/onboarding/niche-resolution/adapters/accountTaxonomyAdapter";
import {
  appendBusinessContext,
  buildPendingSetupAiProjection,
  hasPendingSetupTerminalFallback,
  PENDING_SETUP_OPENAI_RETRY_MESSAGE,
  PENDING_SETUP_TERMINAL_FALLBACK_MESSAGE,
  selectOperationalFallbackLabel,
  shouldUseTerminalFallbackAfterRejectedAiConfirmation,
  validateBusinessContext,
  validatePreferredName,
} from "../../../lib/onboarding/pending-setup";
import {
  appendPendingSetupTurn,
  claimPendingSetupTurn,
  completePendingSetup,
  loadPendingSetupConversation,
  setPendingSetupPreferredName,
} from "../../../lib/onboarding/pending-setup/adapters/pendingSetupConversationAdapter";
import { orchestratePendingSetupNicheTurn } from "../../../lib/onboarding/pending-setup/adapters/pendingSetupNicheOrchestrator";

export type PendingSetupActionState = Readonly<{
  ok: boolean;
  fieldError?: string;
  formError?: string;
}>;

const GENERIC_ERROR = "Não foi possível continuar agora. Tente novamente.";

async function getPendingSetupActor(formData: FormData) {
  const accountSubdomain = String(formData.get("account_subdomain") ?? "")
    .trim()
    .toLowerCase();
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

export async function savePendingSetupPreferredNameAction(
  _previousState: PendingSetupActionState,
  formData: FormData,
): Promise<PendingSetupActionState> {
  const actor = await getPendingSetupActor(formData);
  if (!actor.ok) return { ok: false, formError: GENERIC_ERROR };

  const conversationId = String(formData.get("conversation_id") ?? "").trim();
  const expectedVersion = Number(formData.get("expected_version"));
  if (!conversationId || !Number.isSafeInteger(expectedVersion) || expectedVersion < 1) {
    return { ok: false, formError: GENERIC_ERROR };
  }

  const isSkip = String(formData.get("intent") ?? "") === "skip";
  let preferredName: string | null = null;

  if (!isSkip) {
    const authClient = await createClient();
    const {
      data: { user },
    } = await authClient.auth.getUser();
    if (!user?.id || user.id !== actor.userId) {
      return { ok: false, formError: GENERIC_ERROR };
    }

    const validated = validatePreferredName(formData.get("preferred_name"), user.email);
    if (!validated.ok) {
      return {
        ok: false,
        fieldError: validated.reason === "too_long"
          ? "Use no máximo 80 caracteres."
          : validated.reason === "email_derived"
            ? "Informe como prefere ser chamado, sem usar seu e-mail."
            : "Informe um nome válido ou escolha “Prefiro não informar”.",
      };
    }
    preferredName = validated.value;
  }

  const result = await setPendingSetupPreferredName({
    conversationId,
    accountId: actor.accountId,
    userId: actor.userId,
    preferredName,
    expectedVersion,
  });

  if (!result.ok) {
    return {
      ok: false,
      formError: result.reason === "conflict"
        ? "Esta conversa foi atualizada em outra aba. Recarregue para continuar."
        : GENERIC_ERROR,
    };
  }

  revalidatePath(actor.route);
  return { ok: true };
}

export async function continuePendingSetupConversationAction(
  _previousState: PendingSetupActionState,
  formData: FormData,
): Promise<PendingSetupActionState> {
  const actor = await getPendingSetupActor(formData);
  if (!actor.ok) return { ok: false, formError: GENERIC_ERROR };

  const conversationId = String(formData.get("conversation_id") ?? "").trim();
  const expectedVersion = Number(formData.get("expected_version"));
  if (!conversationId || !Number.isSafeInteger(expectedVersion) || expectedVersion < 1) {
    return { ok: false, formError: GENERIC_ERROR };
  }

  const conversation = await loadPendingSetupConversation({
    accountId: actor.accountId,
    userId: actor.userId,
  });
  if (
    !conversation ||
    conversation.id !== conversationId ||
    conversation.version !== expectedVersion
  ) {
    return { ok: false, formError: "Esta conversa mudou. Recarregue para continuar." };
  }
  let userContent: string;
  let assistantContent: string;
  let nextStage: "business_understanding" | "niche_confirmation" | "ready_to_complete";
  let confirmationKind: "official" | "operational_fallback" | null = null;
  let businessContextText = conversation.businessContextText ?? "";
  let shouldUseTerminalFallbackAfterRejection = false;

  if (conversation.stage === "business_understanding") {
    const validated = validateBusinessContext(formData.get("business_context"));
    if (!validated.ok) {
      return {
        ok: false,
        fieldError: validated.reason === "too_long"
          ? "Use no máximo 4.000 caracteres."
          : "Conte em poucas palavras com o que você trabalha e para quem.",
      };
    }
    userContent = validated.value;
    businessContextText = appendBusinessContext(
      conversation.businessContextText,
      validated.value,
    );
  } else if (conversation.stage === "niche_confirmation") {
    const intent = String(formData.get("intent") ?? "");
    const isTerminalFallback = hasPendingSetupTerminalFallback({
      confirmationKind: conversation.confirmationKind,
      assistantContents: conversation.messages
        .filter((message) => message.role === "assistant")
        .map((message) => message.content),
    });
    shouldUseTerminalFallbackAfterRejection =
      shouldUseTerminalFallbackAfterRejectedAiConfirmation({
        openAiCallCount: conversation.openAiCallCount,
        confirmationKind: conversation.confirmationKind,
        intent,
      });
    if (intent === "confirm") {
      userContent = conversation.confirmationKind === "operational_fallback"
        ? "Sim, use minha descrição como referência operacional."
        : "Sim, está correto.";
    } else if (intent === "clarify" && !isTerminalFallback) {
      userContent = "Não, quero explicar melhor.";
    } else {
      return { ok: false, formError: GENERIC_ERROR };
    }
  } else {
    return { ok: false, formError: GENERIC_ERROR };
  }

  const turnToken = crypto.randomUUID();
  const claimed = await claimPendingSetupTurn({
    conversationId,
    accountId: actor.accountId,
    userId: actor.userId,
    expectedVersion,
    turnToken,
  });
  if (!claimed.ok) {
    return {
      ok: false,
      formError: claimed.reason === "conflict"
        ? "Esta conversa foi atualizada em outra aba. Recarregue para continuar."
        : GENERIC_ERROR,
    };
  }

  if (conversation.stage === "business_understanding") {
    const existingPrimary = await getActivePrimaryAccountTaxon({ accountId: actor.accountId });
    if (existingPrimary) {
      assistantContent = `Entendi: seu negócio se encaixa em ${existingPrimary.name}. Já podemos seguir.`;
      nextStage = "ready_to_complete";
    } else {
      const resolution = await orchestratePendingSetupNicheTurn({
        accountId: actor.accountId,
        conversationId,
        userId: actor.userId,
        expectedVersion: claimed.version,
        turnToken,
        businessContext: businessContextText,
        aiContextProjection: buildPendingSetupAiProjection({
          messages: conversation.messages,
          currentAnswer: userContent,
        }),
        previousAssistantContents: conversation.messages
          .filter((message) => message.role === "assistant")
          .map((message) => message.content),
        openAiCallCount: conversation.openAiCallCount,
        apiKey: process.env.OPENAI_API_KEY,
        financialContext: clientOpenAiCostContext(actor.accountId, {
          kind: "niche_resolution",
          eventId: crypto.randomUUID(),
        }),
      });
      if (resolution.ok) {
        assistantContent = resolution.assistantContent;
        nextStage = resolution.nextStage;
        confirmationKind = resolution.confirmationKind;
      } else {
        assistantContent = resolution.reason === "ai_resolution_write_failed"
          ? PENDING_SETUP_OPENAI_RETRY_MESSAGE
          : "Não consegui concluir esse entendimento agora. Você pode tentar novamente em instantes.";
        nextStage = "business_understanding";
      }
    }
  } else {
    const intent = String(formData.get("intent") ?? "");
    if (shouldUseTerminalFallbackAfterRejection) {
      assistantContent = PENDING_SETUP_TERMINAL_FALLBACK_MESSAGE;
      nextStage = "niche_confirmation";
      confirmationKind = "operational_fallback";
    } else if (intent === "clarify") {
      assistantContent = "Sem problema. Em uma frase, o que você oferece e para qual tipo de cliente?";
      nextStage = "business_understanding";
    } else if (conversation.confirmationKind === "official") {
      const existingPrimary = await getActivePrimaryAccountTaxon({ accountId: actor.accountId });
      let confirmedPrimary = existingPrimary;
      if (!confirmedPrimary) {
        const confirmed = await confirmAiSuggestedTaxonForAccount({ accountId: actor.accountId });
        if (confirmed.ok) {
          confirmedPrimary = await getActivePrimaryAccountTaxon({ accountId: actor.accountId });
        }
      }
      if (confirmedPrimary) {
        assistantContent = "Perfeito. Registrei essa categoria e já podemos seguir.";
        nextStage = "ready_to_complete";
      } else {
        assistantContent = "Não consegui confirmar essa categoria agora. Tente novamente ou explique de outra forma.";
        nextStage = "niche_confirmation";
        confirmationKind = "official";
      }
    } else if (conversation.confirmationKind === "operational_fallback") {
      const existingLabel = await getConfirmedOperationalNicheResolutionLabel({
        accountId: actor.accountId,
      });
      let confirmedLabel = existingLabel;
      if (!confirmedLabel) {
        const confirmed = await confirmOperationalNicheForPendingSetup({
          accountId: actor.accountId,
          label: selectOperationalFallbackLabel(
            conversation.messages,
            businessContextText,
          ),
        });
        if (confirmed.ok) {
          confirmedLabel = await getConfirmedOperationalNicheResolutionLabel({
            accountId: actor.accountId,
          });
        }
      }
      if (confirmedLabel) {
        assistantContent = "Perfeito. Vou usar sua descrição como referência operacional, sem vínculo oficial.";
        nextStage = "ready_to_complete";
      } else {
        assistantContent = "Não consegui registrar essa escolha agora. Tente confirmar novamente.";
        nextStage = "niche_confirmation";
        confirmationKind = "operational_fallback";
      }
    } else {
      assistantContent = "Não consegui recuperar a confirmação pendente. Explique seu negócio novamente.";
      nextStage = "business_understanding";
    }
  }

  const written = await appendPendingSetupTurn({
    conversationId,
    accountId: actor.accountId,
    userId: actor.userId,
    expectedVersion: claimed.version,
    turnToken,
    userContent,
    assistantContent,
    nextStage,
    confirmationKind,
    businessContextText,
  });
  if (!written.ok) {
    return {
      ok: false,
      formError: written.reason === "conflict"
        ? "Esta conversa foi atualizada em outra aba. Recarregue para continuar."
        : GENERIC_ERROR,
    };
  }

  revalidatePath(actor.route);
  return { ok: true };
}

export async function completePendingSetupAction(
  _previousState: PendingSetupActionState,
  formData: FormData,
): Promise<PendingSetupActionState> {
  const actor = await getPendingSetupActor(formData);
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

  const [primaryTaxon, operationalLabel] = await Promise.all([
    getActivePrimaryAccountTaxon({ accountId: actor.accountId }),
    getConfirmedOperationalNicheResolutionLabel({ accountId: actor.accountId }),
  ]);
  const resolutionOutcome = primaryTaxon
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
