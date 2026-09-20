"use server";

import "server-only";

import { revalidatePath } from "next/cache";

import { getAccessContext } from "@/lib/access/getAccessContext";
import {
  confirmPendingSetupAiOptionForAccount,
  confirmPendingSetupAiSuggestedTaxonForAccount,
  getActionablePendingSetupNicheResolutionForAccount,
  readActionablePendingSetupNicheResolutionForAccount,
  rewriteAiNicheResolutionForAccount,
} from "../../../lib/onboarding/niche-resolution/adapters/accountNicheResolutionUserAdapter";
import {
  readUserIdentityPreference,
  saveUserIdentityPreference,
} from "../../../lib/onboarding/pending-setup/adapters/userIdentityPreferenceAdapter";
import {
  loadPendingSetupBusinessSnapshot,
  processPendingSetupBusiness,
} from "../../../lib/onboarding/pending-setup/businessConversationProvider";
import {
  appendBusinessClarification,
  validateBusinessDescription,
} from "../../../lib/onboarding/pending-setup/businessConversationCore";
import { isConversationalPendingSetupEnabled } from "../../../lib/onboarding/pending-setup/config";
import {
  type PendingSetupBusinessSnapshot,
  validatePreferredName,
} from "../../../lib/onboarding/pending-setup/contracts";

export type PendingSetupConversationState = {
  ok: boolean;
  preferredName?: string;
  business?: PendingSetupBusinessSnapshot;
  error?: string;
};

type AllowedPendingSetupContext = {
  accountId: string;
  preferredName: string | null;
  route: string;
  userId: string;
};

const GENERIC_ERROR = "Não foi possível continuar agora. Tente novamente.";

export async function continuePendingSetupConversationAction(
  previous: PendingSetupConversationState,
  formData: FormData,
): Promise<PendingSetupConversationState> {
  const allowed = await getAllowedPendingSetupContext(formData);
  if (!allowed) return { ...previous, ok: false, error: GENERIC_ERROR };

  const intent = String(formData.get("intent") ?? "");

  if (intent === "save_name") {
    const parsed = validatePreferredName(formData.get("preferred_name"));
    if (!parsed.ok) return { ...previous, ok: false, error: parsed.error };

    try {
      const saved = await saveUserIdentityPreference({
        userId: allowed.userId,
        preferredName: parsed.value,
      });
      revalidatePath(allowed.route);
      return {
        ok: true,
        preferredName: saved.preferredName,
        business: await loadPendingSetupBusinessSnapshot(allowed.accountId),
      };
    } catch {
      return { ...previous, ok: false, error: "Não foi possível salvar seu nome agora." };
    }
  }

  if (!allowed.preferredName) {
    return { ...previous, ok: false, error: "Salve seu nome antes de continuar." };
  }

  if (intent === "describe_business") {
    const parsed = validateBusinessDescription(formData.get("business_description"));
    if (!parsed.ok) return { ...previous, ok: false, error: parsed.error };

    const resolutionLookup = await readActionablePendingSetupNicheResolutionForAccount({
      accountId: allowed.accountId,
    });
    if (!resolutionLookup.ok) return { ...previous, ok: false, error: GENERIC_ERROR };

    const turnKind = String(formData.get("business_turn_kind") ?? "");
    const currentResolution = resolutionLookup.resolution;
    if (turnKind === "initial" && currentResolution) {
      return { ...previous, ok: false, error: GENERIC_ERROR };
    }
    if (turnKind === "clarification" && !currentResolution) {
      return { ...previous, ok: false, error: GENERIC_ERROR };
    }
    if (turnKind !== "initial" && turnKind !== "clarification") {
      return { ...previous, ok: false, error: GENERIC_ERROR };
    }

    const description = turnKind === "clarification"
      ? appendBusinessClarification(currentResolution!.rawInput, parsed.value)
      : appendBusinessClarification(resolutionLookup.recoverableRawInput, parsed.value);
    if (!description.ok) return { ...previous, ok: false, error: description.error };

    const result = await processPendingSetupBusiness({
      accountId: allowed.accountId,
      rawInput: description.value,
    });
    if (!result.ok) return { ...previous, ok: false, error: GENERIC_ERROR };

    revalidatePath(allowed.route);
    return {
      ok: true,
      preferredName: allowed.preferredName,
      business: await loadPendingSetupBusinessSnapshot(allowed.accountId),
    };
  }

  if (intent === "confirm_option") {
    const resolution = await getActionablePendingSetupNicheResolutionForAccount({
      accountId: allowed.accountId,
    });
    if (!resolution) return { ...previous, ok: false, error: GENERIC_ERROR };

    const result = resolution.uxMode === "confirm_single"
      ? await confirmPendingSetupAiSuggestedTaxonForAccount({ accountId: allowed.accountId })
      : await confirmPendingSetupAiOptionForAccount({
          accountId: allowed.accountId,
          taxonId: normalizeOptional(formData.get("taxon_id")),
          optionName: normalizeOptional(formData.get("option_name")),
        });
    if (!result.ok) return { ...previous, ok: false, error: GENERIC_ERROR };

    revalidatePath(allowed.route);
    return {
      ok: true,
      preferredName: allowed.preferredName,
      business: await loadPendingSetupBusinessSnapshot(allowed.accountId),
    };
  }

  if (intent === "confirm_fallback") {
    const resolution = await getActionablePendingSetupNicheResolutionForAccount({
      accountId: allowed.accountId,
    });
    if (!resolution || resolution.uxMode !== "fallback_review" || !resolution.rawInput) {
      return { ...previous, ok: false, error: GENERIC_ERROR };
    }

    const result = await rewriteAiNicheResolutionForAccount({
      accountId: allowed.accountId,
      rewriteInput: resolution.rawInput,
    });
    if (!result.ok) return { ...previous, ok: false, error: GENERIC_ERROR };

    revalidatePath(allowed.route);
    return {
      ok: true,
      preferredName: allowed.preferredName,
      business: await loadPendingSetupBusinessSnapshot(allowed.accountId),
    };
  }

  return { ...previous, ok: false, error: GENERIC_ERROR };
}

async function getAllowedPendingSetupContext(
  formData: FormData,
): Promise<AllowedPendingSetupContext | null> {
  if (!isConversationalPendingSetupEnabled()) return null;

  const accountSubdomain = String(formData.get("account_subdomain") ?? "")
    .trim()
    .toLowerCase();
  if (!accountSubdomain || accountSubdomain === "home") return null;

  const route = `/a/${accountSubdomain}`;
  const ctx = await getAccessContext({
    params: { account: accountSubdomain },
    route,
  });
  const accountId = ctx?.account?.id ?? ctx?.account_id ?? null;
  const userId = ctx?.member?.userId ?? null;
  if (
    !ctx ||
    ctx.blocked ||
    ctx.account?.status !== "pending_setup" ||
    ctx.member?.status !== "active" ||
    ctx.role !== "owner" ||
    !accountId ||
    !userId
  ) {
    return null;
  }

  let identity;
  try {
    identity = await readUserIdentityPreference(userId);
  } catch {
    return null;
  }
  return {
    accountId,
    preferredName: identity?.preferredName ?? null,
    route,
    userId,
  };
}

function normalizeOptional(value: FormDataEntryValue | null): string | null {
  const normalized = String(value ?? "").trim();
  return normalized || null;
}
