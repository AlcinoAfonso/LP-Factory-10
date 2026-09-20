"use server";

import "server-only";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getAccessContext } from "@/lib/access/getAccessContext";
import {
  confirmPendingSetupFallbackForAccount,
  confirmPendingSetupAiOptionForAccount,
  confirmPendingSetupAiSuggestedTaxonForAccount,
  readActionablePendingSetupNicheResolutionForAccount,
} from "../../../lib/onboarding/niche-resolution/adapters/accountNicheResolutionUserAdapter";
import {
  beginPendingSetupConversationTurn,
  completePendingSetupConversation,
  completePendingSetupConversationTurn,
  readPendingSetupConversationHistory,
  readPendingSetupConversationTurn,
} from "../../../lib/onboarding/pending-setup/adapters/conversationHistoryAdapter";
import { savePendingSetupWhatsappForAccount } from "../../../lib/onboarding/pending-setup/adapters/accountProfileWhatsappAdapter";
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
import {
  canReconcilePendingSetupTurn,
  reconcilePendingSetupTurnRetry,
  selectPendingSetupCompletionRetryTurn,
  type PendingSetupTurnCorrelation,
} from "../../../lib/onboarding/pending-setup/conversationHistoryCore";
import { isConversationalPendingSetupEnabled } from "../../../lib/onboarding/pending-setup/config";
import {
  type PendingSetupBusinessSnapshot,
  type PendingSetupConversationTurn,
  type PendingSetupConversationTurnKind,
  validatePendingSetupTurnId,
  validateOptionalWhatsapp,
  validatePreferredName,
} from "../../../lib/onboarding/pending-setup/contracts";

export type PendingSetupConversationState = {
  ok: boolean;
  preferredName?: string;
  business?: PendingSetupBusinessSnapshot;
  history?: PendingSetupConversationTurn[];
  error?: string;
};

type AllowedPendingSetupContext = {
  accountId: string;
  accountStatus: "active" | "pending_setup";
  preferredName: string | null;
  route: string;
  userId: string;
};

const GENERIC_ERROR = "Não foi possível continuar agora. Tente novamente.";

export async function continuePendingSetupConversationAction(
  previous: PendingSetupConversationState,
  formData: FormData,
): Promise<PendingSetupConversationState> {
  const intent = String(formData.get("intent") ?? "");
  const allowed = await getAllowedPendingSetupContext(
    formData,
    intent === "complete_setup",
  );
  if (!allowed) return { ...previous, ok: false, error: GENERIC_ERROR };

  if (intent === "complete_setup") {
    if (!allowed.preferredName) {
      return { ...previous, ok: false, error: "Salve seu nome antes de continuar." };
    }
    const whatsapp = validateOptionalWhatsapp(formData.get("whatsapp"));
    if (whatsapp) {
      try {
        await savePendingSetupWhatsappForAccount({
          accountId: allowed.accountId,
          whatsapp,
        });
      } catch {
        // Optional profile enrichment never blocks Pending Setup completion.
      }
    }
    if (allowed.accountStatus === "pending_setup") {
      try {
        const [business, history] = await Promise.all([
          loadPendingSetupBusinessSnapshot(allowed.accountId),
          readPendingSetupConversationHistory({
            accountId: allowed.accountId,
            ownerUserId: allowed.userId,
          }),
        ]);
        const retryTurn = selectPendingSetupCompletionRetryTurn(history, business);
        if (retryTurn) {
          const resumed = await beginPendingSetupConversationTurn({
            accountId: allowed.accountId,
            ownerUserId: allowed.userId,
            turnId: retryTurn.id,
            userMessage: retryTurn.userMessage,
            turnKind: retryTurn.turnKind,
            expectedResolutionUpdatedAt: null,
          });
          if (!resumed.ok) return { ...previous, ok: false, error: GENERIC_ERROR };
          if (isTechnicalTurnStatus(resumed.status)) {
            return loadConversationState(allowed, true);
          }
          if (resumed.status !== "completed") {
            if (resumed.leaseVersion === null) {
              return { ...previous, ok: false, error: GENERIC_ERROR };
            }
            const reconciled = await reconcilePendingSetupTurnRetry(
              retryTurn,
              business,
              async (presentation) => completePendingSetupConversationTurn({
                accountId: allowed.accountId,
                turnId: retryTurn.id,
                leaseVersion: resumed.leaseVersion,
                status: "completed",
                productState: presentation.state,
                productMessage: presentation.message,
                failureCode: null,
              }),
            );
            if (reconciled === "lease_lost" || reconciled === "turn_not_current") {
              return loadConversationState(allowed, true);
            }
            if (reconciled !== "completed") {
              return { ...previous, ok: false, error: GENERIC_ERROR };
            }
          }
        }
      } catch {
        return { ...previous, ok: false, error: GENERIC_ERROR };
      }
    }
    const completion = await completePendingSetupConversation({
      accountId: allowed.accountId,
      ownerUserId: allowed.userId,
    });
    if (completion === "saved" || completion === "already_completed") {
      revalidatePath(allowed.route);
      redirect(allowed.route);
    }
    return {
      ...previous,
      ok: false,
      error: completion === "not_ready"
        ? "Conclua o entendimento do seu negócio antes de continuar."
        : GENERIC_ERROR,
    };
  }

  if (allowed.accountStatus !== "pending_setup") {
    return { ...previous, ok: false, error: GENERIC_ERROR };
  }

  if (intent === "save_name") {
    const parsed = validatePreferredName(formData.get("preferred_name"));
    if (!parsed.ok) return { ...previous, ok: false, error: parsed.error };

    try {
      const saved = await saveUserIdentityPreference({
        userId: allowed.userId,
        preferredName: parsed.value,
      });
      const [business, history] = await Promise.all([
        loadPendingSetupBusinessSnapshot(allowed.accountId),
        readPendingSetupConversationHistory({
          accountId: allowed.accountId,
          ownerUserId: allowed.userId,
        }),
      ]);
      revalidatePath(allowed.route);
      return {
        ok: true,
        preferredName: saved.preferredName,
        business,
        history,
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

    const turnKind = String(formData.get("business_turn_kind") ?? "");
    if (turnKind !== "initial" && turnKind !== "clarification") {
      return { ...previous, ok: false, error: GENERIC_ERROR };
    }
    const recordedKind: PendingSetupConversationTurnKind = turnKind === "clarification"
      ? "clarification"
      : "business_description";
    const turnId = validatePendingSetupTurnId(formData.get("turn_id"));
    if (!turnId) return { ...previous, ok: false, error: GENERIC_ERROR };

    const resumed = await resumeExistingRecordedTurn(allowed, turnId, [recordedKind]);
    if (resumed.kind === "response") return resumed.state;
    if (
      resumed.kind === "resumed" &&
      normalizeComparable(resumed.turn.userMessage) !== normalizeComparable(parsed.value)
    ) {
      return { ...previous, ok: false, error: GENERIC_ERROR };
    }
    if (
      resumed.kind === "resumed" &&
      canReconcilePendingSetupTurn(resumed.turn, resumed.business)
    ) {
      return reconcileRecordedTurn(
        allowed,
        resumed.turn,
        resumed.business,
        resumed.leaseVersion,
      );
    }

    const resolutionLookup = await readActionablePendingSetupNicheResolutionForAccount({
      accountId: allowed.accountId,
    });
    if (!resolutionLookup.ok) return { ...previous, ok: false, error: GENERIC_ERROR };

    const currentResolution = resolutionLookup.resolution;
    if (turnKind === "initial" && currentResolution) {
      return { ...previous, ok: false, error: GENERIC_ERROR };
    }
    if (turnKind === "clarification" && !currentResolution) {
      return { ...previous, ok: false, error: GENERIC_ERROR };
    }
    const description = turnKind === "clarification"
      ? appendBusinessClarification(currentResolution!.rawInput, parsed.value)
      : appendBusinessClarification(resolutionLookup.recoverableRawInput, parsed.value);
    if (!description.ok) return { ...previous, ok: false, error: description.error };

    let leaseVersion: number;
    if (resumed.kind === "none") {
      const started = await beginPendingSetupConversationTurn({
        accountId: allowed.accountId,
        ownerUserId: allowed.userId,
        turnId,
        userMessage: parsed.value,
        turnKind: recordedKind,
        expectedResolutionUpdatedAt: resolutionLookup.expectedResolutionUpdatedAt,
      });
      if (!started.ok) {
        return { ...previous, ok: false, error: GENERIC_ERROR };
      }
      if (isTechnicalTurnStatus(started.status)) return loadConversationState(allowed, true);
      if (started.status === "completed") return loadConversationState(allowed, true);
      if (started.leaseVersion === null) {
        return { ...previous, ok: false, error: GENERIC_ERROR };
      }
      leaseVersion = started.leaseVersion;
    } else {
      leaseVersion = resumed.leaseVersion;
    }

    try {
      const result = await processPendingSetupBusiness({
        accountId: allowed.accountId,
        turnId,
        leaseVersion,
        rawInput: description.value,
      });
      if (!result.ok && isTechnicalTurnStatus(result.reason)) {
        return loadConversationState(allowed, true);
      }
      if (!result.ok) {
        return failRecordedTurn(allowed, turnId, leaseVersion, result.reason, previous);
      }

      const business = await loadPendingSetupBusinessSnapshot(allowed.accountId);
      const completed = await completeRecordedTurn(
        allowed.accountId,
        correlationTurn(resumed, turnId, parsed.value, recordedKind),
        business,
        leaseVersion,
      );
      if (isTechnicalTurnStatus(completed)) return loadConversationState(allowed, true);
      if (completed !== "completed") {
        return failRecordedTurn(
          allowed,
          turnId,
          leaseVersion,
          "turn_completion_failed",
          previous,
        );
      }
      revalidatePath(allowed.route);
      return loadConversationState(allowed, true, business);
    } catch {
      return failRecordedTurn(allowed, turnId, leaseVersion, "business_turn_failed", previous);
    }
  }

  if (intent === "confirm_option") {
    const turnId = validatePendingSetupTurnId(formData.get("turn_id"));
    if (!turnId) return { ...previous, ok: false, error: GENERIC_ERROR };
    const resumed = await resumeExistingRecordedTurn(allowed, turnId, [
      "official_confirmation",
      "operational_confirmation",
    ]);
    if (resumed.kind === "response") return resumed.state;
    if (
      resumed.kind === "resumed" &&
      canReconcilePendingSetupTurn(resumed.turn, resumed.business)
    ) {
      return reconcileRecordedTurn(
        allowed,
        resumed.turn,
        resumed.business,
        resumed.leaseVersion,
      );
    }

    const resolutionLookup = await readActionablePendingSetupNicheResolutionForAccount({
      accountId: allowed.accountId,
    });
    if (!resolutionLookup.ok) {
      return resumed.kind === "resumed"
        ? failRecordedTurn(
            allowed,
            turnId,
            resumed.leaseVersion,
            resolutionLookup.reason,
            previous,
          )
        : { ...previous, ok: false, error: GENERIC_ERROR };
    }
    const resolution = resolutionLookup.resolution;
    if (!resolution) {
      return resumed.kind === "resumed"
        ? failRecordedTurn(
            allowed,
            turnId,
            resumed.leaseVersion,
            "confirmation_state_missing",
            previous,
          )
        : { ...previous, ok: false, error: GENERIC_ERROR };
    }

    const taxonId = normalizeOptional(formData.get("taxon_id"));
    const optionName = normalizeOptional(formData.get("option_name"));
    const selectedOption = resolution.uxMode === "confirm_single"
      ? resolution.suggestedTaxon
      : resolution.options.find((option) =>
          taxonId
            ? option.isOfficial && option.taxonId === taxonId
            : !option.isOfficial && normalizeComparable(option.name) === normalizeComparable(optionName),
        ) ?? null;
    if (!selectedOption) return { ...previous, ok: false, error: GENERIC_ERROR };

    const selectedTurnKind: PendingSetupConversationTurnKind = selectedOption.isOfficial
      ? "official_confirmation"
      : "operational_confirmation";
    if (
      resumed.kind === "resumed" &&
      (resumed.turn.turnKind !== selectedTurnKind ||
        normalizeComparable(resumed.turn.userMessage) !== normalizeComparable(selectedOption.name))
    ) {
      return { ...previous, ok: false, error: GENERIC_ERROR };
    }
    let leaseVersion: number;
    if (resumed.kind === "none") {
      const started = await beginPendingSetupConversationTurn({
        accountId: allowed.accountId,
        ownerUserId: allowed.userId,
        turnId,
        userMessage: selectedOption.name,
        turnKind: selectedTurnKind,
        expectedResolutionUpdatedAt: resolutionLookup.expectedResolutionUpdatedAt,
      });
      if (!started.ok) {
        return { ...previous, ok: false, error: GENERIC_ERROR };
      }
      if (isTechnicalTurnStatus(started.status)) return loadConversationState(allowed, true);
      if (started.status === "completed") return loadConversationState(allowed, true);
      if (started.leaseVersion === null) {
        return { ...previous, ok: false, error: GENERIC_ERROR };
      }
      leaseVersion = started.leaseVersion;
    } else {
      leaseVersion = resumed.leaseVersion;
    }

    try {
      const result = resolution.uxMode === "confirm_single"
        ? await confirmPendingSetupAiSuggestedTaxonForAccount({
            accountId: allowed.accountId,
            turnId,
            leaseVersion,
          })
        : await confirmPendingSetupAiOptionForAccount({
            accountId: allowed.accountId,
            turnId,
            leaseVersion,
            taxonId,
            optionName,
          });
      if (!result.ok && isTechnicalTurnStatus(result.reason)) {
        return loadConversationState(allowed, true);
      }
      if (!result.ok) {
        return failRecordedTurn(allowed, turnId, leaseVersion, result.reason, previous);
      }

      const business = await loadPendingSetupBusinessSnapshot(allowed.accountId);
      const completed = await completeRecordedTurn(
        allowed.accountId,
        correlationTurn(resumed, turnId, selectedOption.name, selectedTurnKind),
        business,
        leaseVersion,
      );
      if (isTechnicalTurnStatus(completed)) return loadConversationState(allowed, true);
      if (completed !== "completed") {
        return failRecordedTurn(
          allowed,
          turnId,
          leaseVersion,
          "turn_completion_failed",
          previous,
        );
      }
      revalidatePath(allowed.route);
      return loadConversationState(allowed, true, business);
    } catch {
      return failRecordedTurn(
        allowed,
        turnId,
        leaseVersion,
        "confirmation_turn_failed",
        previous,
      );
    }
  }

  if (intent === "confirm_fallback") {
    const turnId = validatePendingSetupTurnId(formData.get("turn_id"));
    if (!turnId) return { ...previous, ok: false, error: GENERIC_ERROR };
    const resumed = await resumeExistingRecordedTurn(allowed, turnId, [
      "fallback_confirmation",
    ]);
    if (resumed.kind === "response") return resumed.state;
    if (
      resumed.kind === "resumed" &&
      canReconcilePendingSetupTurn(resumed.turn, resumed.business)
    ) {
      return reconcileRecordedTurn(
        allowed,
        resumed.turn,
        resumed.business,
        resumed.leaseVersion,
      );
    }

    const resolutionLookup = await readActionablePendingSetupNicheResolutionForAccount({
      accountId: allowed.accountId,
    });
    if (!resolutionLookup.ok) {
      return resumed.kind === "resumed"
        ? failRecordedTurn(
            allowed,
            turnId,
            resumed.leaseVersion,
            resolutionLookup.reason,
            previous,
          )
        : { ...previous, ok: false, error: GENERIC_ERROR };
    }
    const resolution = resolutionLookup.resolution;
    if (!resolution || resolution.uxMode !== "fallback_review" || !resolution.rawInput) {
      return resumed.kind === "resumed"
        ? failRecordedTurn(
            allowed,
            turnId,
            resumed.leaseVersion,
            "fallback_state_missing",
            previous,
          )
        : { ...previous, ok: false, error: GENERIC_ERROR };
    }

    if (
      resumed.kind === "resumed" &&
      normalizeComparable(resumed.turn.userMessage) !== normalizeComparable(resolution.rawInput)
    ) {
      return { ...previous, ok: false, error: GENERIC_ERROR };
    }
    let leaseVersion: number;
    if (resumed.kind === "none") {
      const started = await beginPendingSetupConversationTurn({
        accountId: allowed.accountId,
        ownerUserId: allowed.userId,
        turnId,
        userMessage: resolution.rawInput,
        turnKind: "fallback_confirmation",
        expectedResolutionUpdatedAt: resolutionLookup.expectedResolutionUpdatedAt,
      });
      if (!started.ok) {
        return { ...previous, ok: false, error: GENERIC_ERROR };
      }
      if (isTechnicalTurnStatus(started.status)) return loadConversationState(allowed, true);
      if (started.status === "completed") return loadConversationState(allowed, true);
      if (started.leaseVersion === null) {
        return { ...previous, ok: false, error: GENERIC_ERROR };
      }
      leaseVersion = started.leaseVersion;
    } else {
      leaseVersion = resumed.leaseVersion;
    }

    try {
      const result = await confirmPendingSetupFallbackForAccount({
        accountId: allowed.accountId,
        turnId,
        leaseVersion,
        rewriteInput: resolution.rawInput,
      });
      if (!result.ok && isTechnicalTurnStatus(result.reason)) {
        return loadConversationState(allowed, true);
      }
      if (!result.ok) {
        return failRecordedTurn(allowed, turnId, leaseVersion, result.reason, previous);
      }

      const business = await loadPendingSetupBusinessSnapshot(allowed.accountId);
      const completed = await completeRecordedTurn(
        allowed.accountId,
        correlationTurn(resumed, turnId, resolution.rawInput, "fallback_confirmation"),
        business,
        leaseVersion,
      );
      if (isTechnicalTurnStatus(completed)) return loadConversationState(allowed, true);
      if (completed !== "completed") {
        return failRecordedTurn(
          allowed,
          turnId,
          leaseVersion,
          "turn_completion_failed",
          previous,
        );
      }
      revalidatePath(allowed.route);
      return loadConversationState(allowed, true, business);
    } catch {
      return failRecordedTurn(
        allowed,
        turnId,
        leaseVersion,
        "fallback_turn_failed",
        previous,
      );
    }
  }

  return { ...previous, ok: false, error: GENERIC_ERROR };
}

async function getAllowedPendingSetupContext(
  formData: FormData,
  allowCompletedAccount = false,
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
    (ctx.account?.status !== "pending_setup" &&
      !(allowCompletedAccount && ctx.account?.status === "active")) ||
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
    accountStatus: ctx.account.status,
    preferredName: identity?.preferredName ?? null,
    route,
    userId,
  };
}

function normalizeOptional(value: FormDataEntryValue | null): string | null {
  const normalized = String(value ?? "").trim();
  return normalized || null;
}

function normalizeComparable(value: string | null): string {
  return String(value ?? "").trim().replace(/\s+/g, " ").toLocaleLowerCase("pt-BR");
}

type ExistingTurnResume =
  | { kind: "none" }
  | {
      kind: "resumed";
      business: PendingSetupBusinessSnapshot;
      leaseVersion: number;
      turn: PendingSetupConversationTurn;
    }
  | { kind: "response"; state: PendingSetupConversationState };

async function resumeExistingRecordedTurn(
  allowed: AllowedPendingSetupContext,
  turnId: string,
  allowedKinds: PendingSetupConversationTurnKind[],
): Promise<ExistingTurnResume> {
  let turn: PendingSetupConversationTurn | null;
  try {
    turn = await readPendingSetupConversationTurn({
      accountId: allowed.accountId,
      ownerUserId: allowed.userId,
      turnId,
    });
  } catch {
    return { kind: "response", state: { ok: false, error: GENERIC_ERROR } };
  }
  if (!turn) return { kind: "none" };
  if (!allowedKinds.includes(turn.turnKind)) {
    return { kind: "response", state: { ok: false, error: GENERIC_ERROR } };
  }

  const started = await beginPendingSetupConversationTurn({
    accountId: allowed.accountId,
    ownerUserId: allowed.userId,
    turnId,
    userMessage: turn.userMessage,
    turnKind: turn.turnKind,
    expectedResolutionUpdatedAt: null,
  });
  if (!started.ok || started.status === "created") {
    return { kind: "response", state: { ok: false, error: GENERIC_ERROR } };
  }
  if (isTechnicalTurnStatus(started.status)) {
    return { kind: "response", state: await loadConversationState(allowed, true) };
  }
  if (started.status === "completed") {
    return { kind: "response", state: await loadConversationState(allowed, true) };
  }
  if (started.leaseVersion === null) {
    return { kind: "response", state: { ok: false, error: GENERIC_ERROR } };
  }

  try {
    return {
      kind: "resumed",
      business: await loadPendingSetupBusinessSnapshot(allowed.accountId),
      leaseVersion: started.leaseVersion,
      turn,
    };
  } catch {
    return { kind: "response", state: { ok: false, error: GENERIC_ERROR } };
  }
}

async function reconcileRecordedTurn(
  allowed: AllowedPendingSetupContext,
  turn: PendingSetupConversationTurn,
  business: PendingSetupBusinessSnapshot,
  leaseVersion: number,
): Promise<PendingSetupConversationState> {
  const result = await reconcilePendingSetupTurnRetry(
    turn,
    business,
    async (presentation) => completePendingSetupConversationTurn({
      accountId: allowed.accountId,
      turnId: turn.id,
      leaseVersion,
      status: "completed",
      productState: presentation.state,
      productMessage: presentation.message,
      failureCode: null,
    }),
  );
  if (result === "lease_lost" || result === "turn_not_current") {
    return loadConversationState(allowed, true);
  }
  if (result !== "completed") return { ok: false, error: GENERIC_ERROR };
  revalidatePath(allowed.route);
  return loadConversationState(allowed, true, business);
}

async function loadConversationState(
  allowed: AllowedPendingSetupContext,
  ok: boolean,
  business?: PendingSetupBusinessSnapshot,
): Promise<PendingSetupConversationState> {
  try {
    const [resolvedBusiness, history] = await Promise.all([
      business
        ? Promise.resolve(business)
        : loadPendingSetupBusinessSnapshot(allowed.accountId),
      readPendingSetupConversationHistory({
        accountId: allowed.accountId,
        ownerUserId: allowed.userId,
      }),
    ]);
    return {
      ok,
      preferredName: allowed.preferredName ?? undefined,
      business: resolvedBusiness,
      history,
    };
  } catch {
    return {
      ok: false,
      preferredName: allowed.preferredName ?? undefined,
      error: GENERIC_ERROR,
    };
  }
}

async function completeRecordedTurn(
  accountId: string,
  turn: PendingSetupTurnCorrelation,
  business: PendingSetupBusinessSnapshot,
  leaseVersion: number,
): Promise<"completed" | "not_ready" | "persist_failed" | "lease_lost" | "turn_not_current"> {
  return reconcilePendingSetupTurnRetry(
    turn,
    business,
    async (presentation) => completePendingSetupConversationTurn({
      accountId,
      turnId: turn.id,
      leaseVersion,
      status: "completed",
      productState: presentation.state,
      productMessage: presentation.message,
      failureCode: null,
    }),
  );
}

function correlationTurn(
  resumed: ExistingTurnResume,
  turnId: string,
  userMessage: string,
  turnKind: PendingSetupConversationTurnKind,
): PendingSetupTurnCorrelation {
  return resumed.kind === "resumed"
    ? resumed.turn
    : { id: turnId, status: "pending", turnKind, userMessage };
}

async function failRecordedTurn(
  allowed: AllowedPendingSetupContext,
  turnId: string,
  leaseVersion: number,
  failureCode: string,
  previous: PendingSetupConversationState,
): Promise<PendingSetupConversationState> {
  const failed = await completePendingSetupConversationTurn({
    accountId: allowed.accountId,
    turnId,
    leaseVersion,
    status: "failed",
    productState: "failure",
    productMessage: "Não foi possível concluir este turno. Você pode tentar novamente.",
    failureCode: failureCode.slice(0, 80),
  });
  if (failed === "lease_lost" || failed === "turn_not_current") {
    return loadConversationState(allowed, true);
  }
  let history = previous.history;
  try {
    history = await readPendingSetupConversationHistory({
      accountId: allowed.accountId,
      ownerUserId: allowed.userId,
    });
  } catch {
    // Preserve the retryable form state even when the refreshed history is unavailable.
  }
  return {
    ...previous,
    ok: false,
    history,
    error: GENERIC_ERROR,
  };
}

function isTechnicalTurnStatus(value: string): value is "in_progress" | "stale_context" | "lease_lost" | "turn_not_current" {
  return value === "in_progress" ||
    value === "stale_context" ||
    value === "lease_lost" ||
    value === "turn_not_current";
}
