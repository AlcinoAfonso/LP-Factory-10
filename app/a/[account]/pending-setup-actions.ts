"use server";

import "server-only";
import { getAccountOfficialNiche } from "../../../lib/onboarding/niche-resolution/adapters/accountOfficialNicheAdapter";

import { revalidatePath } from "next/cache";
import { getAccessContext } from "@/lib/access/getAccessContext";
import { getConfirmedOperationalNicheResolutionLabel } from "../../../lib/onboarding/niche-resolution/adapters/accountNicheResolutionUserAdapter";
import { validateBusinessDisplayName } from "../../../lib/onboarding/pending-setup";
import {
  completePendingSetup,
  loadPendingSetupConversation,
  setPendingSetupBusinessDisplayName,
} from "../../../lib/onboarding/pending-setup/adapters/pendingSetupConversationAdapter";
import { isE1011PassageEnabled } from "../../../lib/onboarding/pending-setup/config";

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
  if (!isE1011PassageEnabled()) return { ok: false, formError: GENERIC_ERROR };
  const actor = await getPendingSetupActor(formData);
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
