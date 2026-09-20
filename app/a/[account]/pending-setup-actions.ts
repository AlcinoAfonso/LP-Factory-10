"use server";

import "server-only";

import { revalidatePath } from "next/cache";

import { getAccessContext } from "@/lib/access/getAccessContext";
import {
  saveUserIdentityPreference,
} from "../../../lib/onboarding/pending-setup/adapters/userIdentityPreferenceAdapter";
import { isConversationalPendingSetupEnabled } from "../../../lib/onboarding/pending-setup/config";
import { validatePreferredName } from "../../../lib/onboarding/pending-setup/contracts";

export type PreferredNameState = {
  ok: boolean;
  preferredName?: string;
  error?: string;
};

export async function savePreferredNameAction(
  _previous: PreferredNameState,
  formData: FormData,
): Promise<PreferredNameState> {
  if (!isConversationalPendingSetupEnabled()) {
    return { ok: false, error: "Esta experiência ainda não está disponível." };
  }

  const accountSubdomain = String(formData.get("account_subdomain") ?? "")
    .trim()
    .toLowerCase();
  if (!accountSubdomain || accountSubdomain === "home") {
    return { ok: false, error: "A conta informada é inválida." };
  }

  const ctx = await getAccessContext({
    params: { account: accountSubdomain },
    route: `/a/${accountSubdomain}`,
  });
  const userId = ctx?.member?.userId;
  if (
    !ctx ||
    ctx.blocked ||
    ctx.account?.status !== "pending_setup" ||
    ctx.member?.status !== "active" ||
    ctx.role !== "owner" ||
    !userId
  ) {
    return { ok: false, error: "Você não pode alterar esta identidade." };
  }

  const parsed = validatePreferredName(formData.get("preferred_name"));
  if (!parsed.ok) return { ok: false, error: parsed.error };

  try {
    const saved = await saveUserIdentityPreference({
      userId,
      preferredName: parsed.value,
    });
    revalidatePath(`/a/${accountSubdomain}`);
    return { ok: true, preferredName: saved.preferredName };
  } catch {
    return { ok: false, error: "Não foi possível salvar seu nome agora." };
  }
}
