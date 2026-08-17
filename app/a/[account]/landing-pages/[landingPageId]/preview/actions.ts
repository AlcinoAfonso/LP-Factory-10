"use server";

import { requireAccountMembersManager } from "@/lib/access/guards";
import { getCommercialEntitlementSignal } from "@/commercial-entitlements";
import { compileLandingPageGenerationContextForDraft } from "@/lp-builder/adapters/generationContextAdapter";
import { loadLandingPageRevisionReadiness } from "@/lp-builder/adapters/landingPageRevisionReadinessAdapter";
import { resolveLandingPageConversionBinding } from "@/lp-builder/landingPageDraftWorkflow";

export const maxDuration = 300;

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
        | "UNSUPPORTED_PRIMARY_CONVERSION_CHANNEL";
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
    requestId: access.context.requestId ?? undefined,
  });
  if (!context.ok) {
    return actionError(
      "GENERATION_CONTEXT_UNAVAILABLE",
      "A configuração desta landing page precisa ser revisada antes da geração.",
    );
  }

  const binding = resolveLandingPageConversionBinding(context.value.serverContext);
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

  // E19.4.4 conecta esta mesma Action ao append transacional. Até lá, mesmo um
  // readiness inesperadamente positivo permanece fail-closed e não chama providers.
  return actionError("GENERATION_UNAVAILABLE", UNAVAILABLE_MESSAGE);
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
