"use server";

import "server-only";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getAccessContext } from "@/lib/access/getAccessContext";
import { validatePreferredName } from "../../../lib/onboarding/pending-setup";
import { setPendingSetupPreferredName } from "../../../lib/onboarding/pending-setup/adapters/pendingSetupConversationAdapter";

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
