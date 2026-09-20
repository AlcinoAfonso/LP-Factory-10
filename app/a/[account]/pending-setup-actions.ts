"use server";

import "server-only";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getAccessContext } from "@/lib/access/getAccessContext";
import { clientOpenAiCostContext } from "../../../lib/openai-costs";
import { confirmAiSuggestedTaxonForAccount } from "../../../lib/onboarding/niche-resolution/adapters/accountNicheResolutionUserAdapter";
import {
  appendBusinessContext,
  validateBusinessContext,
  validatePreferredName,
} from "../../../lib/onboarding/pending-setup";
import {
  appendPendingSetupTurn,
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
      const fieldError = validated.reason === "too_long"
        ? "Use no máximo 80 caracteres."
        : validated.reason === "email_derived"
          ? "Informe como prefere ser chamado, sem usar seu e-mail."
          : "Informe um nome válido ou escolha continuar sem nome.";
      return { ok: false, fieldError };
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
  let businessContextText = conversation.businessContextText ?? "";

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
    const resolution = await orchestratePendingSetupNicheTurn({
      accountId: actor.accountId,
      businessContext: businessContextText,
      apiKey: process.env.OPENAI_API_KEY,
      financialContext: clientOpenAiCostContext(actor.accountId, {
        kind: "niche_resolution",
        eventId: crypto.randomUUID(),
      }),
    });
    if (!resolution.ok) return { ok: false, formError: GENERIC_ERROR };
    assistantContent = resolution.assistantContent;
    nextStage = resolution.nextStage;
  } else if (conversation.stage === "niche_confirmation") {
    const intent = String(formData.get("intent") ?? "");
    if (intent === "confirm") {
      const confirmed = await confirmAiSuggestedTaxonForAccount({
        accountId: actor.accountId,
      });
      if (!confirmed.ok) return { ok: false, formError: GENERIC_ERROR };
      userContent = "Sim, está correto.";
      assistantContent = "Perfeito. Registrei essa categoria e já podemos seguir.";
      nextStage = "ready_to_complete";
    } else if (intent === "clarify") {
      userContent = "Não, quero explicar melhor.";
      assistantContent = "Sem problema. Em uma frase, o que você oferece e para qual tipo de cliente?";
      nextStage = "business_understanding";
    } else {
      return { ok: false, formError: GENERIC_ERROR };
    }
  } else {
    return { ok: false, formError: GENERIC_ERROR };
  }

  const written = await appendPendingSetupTurn({
    conversationId,
    accountId: actor.accountId,
    userId: actor.userId,
    expectedVersion,
    userContent,
    assistantContent,
    nextStage,
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
