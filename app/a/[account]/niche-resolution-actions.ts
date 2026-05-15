"use server";

import { revalidatePath } from "next/cache";
import { getAccessContext } from "@/lib/access/getAccessContext";
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
  if (!taxonId) return { ok: false, formError: GENERIC_ERROR };

  const result = await confirmAiOptionForAccount({ accountId: ctx.accountId, taxonId });
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
