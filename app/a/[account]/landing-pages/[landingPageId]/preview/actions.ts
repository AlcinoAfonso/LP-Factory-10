"use server";

import { revalidatePath } from "next/cache";

import { requireAccountMembersManager } from "@/lib/access/guards";
import { getCommercialEntitlementSignal } from "@/commercial-entitlements";
import { compileLandingPageGenerationContextForDraft } from "@/lp-builder/adapters/generationContextAdapter";
import { loadLandingPageRevisionReadiness } from "@/lp-builder/adapters/landingPageRevisionReadinessAdapter";
import { materializeLandingPageDraftRevision } from "@/lp-builder/adapters/landingPageRevisionWorkflowAdapter";
import { resolveLandingPageConversionBinding } from "@/lp-builder/landingPageDraftWorkflow";

export type GenerateLandingPageRevisionActionState =
  | Readonly<{ status: "idle" }>
  | Readonly<{
      status: "success";
      revisionId: string;
      revisionNumber: number;
    }>
  | Readonly<{
      status: "error";
      code:
        | "INVALID_REQUEST"
        | "ACCESS_DENIED"
        | "ENTITLEMENT_REQUIRED"
        | "GENERATION_UNAVAILABLE"
        | "GENERATION_CONTEXT_UNAVAILABLE"
        | "UNSUPPORTED_PRIMARY_CONVERSION_CHANNEL"
        | "GENERATION_FAILED";
      message: string;
    }>;

const UNAVAILABLE_MESSAGE =
  "A geração ainda não está disponível neste ambiente. Nenhuma revisão foi criada.";

export async function generateLandingPageRevisionAction(
  _previousState: GenerateLandingPageRevisionActionState,
  formData: FormData,
): Promise<GenerateLandingPageRevisionActionState> {
  const accountSlug = String(formData.get("account_slug") ?? "")
    .trim()
    .toLowerCase();
  const landingPageId = String(formData.get("landing_page_id") ?? "").trim();
  if (!accountSlug || accountSlug === "home" || !isUuid(landingPageId)) {
    return actionError("INVALID_REQUEST", "A solicitação de geração é inválida.");
  }

  const access = await requireAccountMembersManager(accountSlug);
  if (!access.allowed || access.context.accountStatus !== "active") {
    return actionError("ACCESS_DENIED", "Você não pode gerar uma revisão desta página.");
  }

  const entitlement = await getCommercialEntitlementSignal({
    accountId: access.context.accountId,
  });
  if (!entitlement?.isCommerciallyEligible) {
    return actionError(
      "ENTITLEMENT_REQUIRED",
      "A conta não possui acesso comercial válido para esta operação.",
    );
  }

  const readiness = await loadLandingPageRevisionReadiness();
  if (!readiness.ready) {
    return actionError("GENERATION_UNAVAILABLE", UNAVAILABLE_MESSAGE);
  }

  const context = await compileLandingPageGenerationContextForDraft({
    accountId: access.context.accountId,
    landingPageId,
    ...(access.context.requestId == null
      ? {}
      : { requestId: access.context.requestId }),
  });
  if (!context.ok) {
    return actionError(
      "GENERATION_CONTEXT_UNAVAILABLE",
      "A configuração desta landing page precisa ser revisada antes da geração.",
    );
  }

  const binding = resolveLandingPageConversionBinding(context.value);
  if (!binding.ok) {
    return actionError(
      binding.error === "UNSUPPORTED_PRIMARY_CONVERSION_CHANNEL"
        ? "UNSUPPORTED_PRIMARY_CONVERSION_CHANNEL"
        : "GENERATION_CONTEXT_UNAVAILABLE",
      binding.error === "UNSUPPORTED_PRIMARY_CONVERSION_CHANNEL"
        ? "O canal de conversão form ainda não é suportado para geração de landing page."
        : "O destino do canal de conversão precisa ser revisado antes da geração.",
    );
  }

  const materialized = await materializeLandingPageDraftRevision({
    context: context.value,
    createdBy: access.context.actorUserId,
    requestId: access.context.requestId,
    revalidate: async () => {
      const currentAccess = await requireAccountMembersManager(accountSlug);
      if (
        !currentAccess.allowed ||
        currentAccess.context.accountStatus !== "active" ||
        currentAccess.context.accountId !== access.context.accountId ||
        currentAccess.context.actorUserId !== access.context.actorUserId
      ) {
        return false;
      }
      const currentEntitlement = await getCommercialEntitlementSignal({
        accountId: currentAccess.context.accountId,
      });
      if (!currentEntitlement?.isCommerciallyEligible) return false;
      const currentContext = await compileLandingPageGenerationContextForDraft({
        accountId: currentAccess.context.accountId,
        landingPageId,
        ...(currentAccess.context.requestId == null
          ? {}
          : { requestId: currentAccess.context.requestId }),
      });
      return (
        currentContext.ok &&
        JSON.stringify(currentContext.value) === JSON.stringify(context.value)
      );
    },
  });
  if (!materialized.ok) {
    console.error(JSON.stringify({
      event: "landing_page_revision_generation_failed",
      attempt_id: materialized.attemptId,
      request_id: materialized.requestId,
      stage: materialized.stage,
      reason: materialized.reason,
    }));
    return actionError(
      "GENERATION_FAILED",
      "Não foi possível criar a revisão. Nenhuma revisão parcial foi mantida.",
    );
  }

  revalidatePath(`/a/${accountSlug}/landing-pages/${landingPageId}/preview`);
  return {
    status: "success",
    revisionId: materialized.revisionId,
    revisionNumber: materialized.revisionNumber,
  };
}

function actionError(
  code: Extract<GenerateLandingPageRevisionActionState, { status: "error" }>["code"],
  message: string,
): GenerateLandingPageRevisionActionState {
  return { status: "error", code, message };
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}
