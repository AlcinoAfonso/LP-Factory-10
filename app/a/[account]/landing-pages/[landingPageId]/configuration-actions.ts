"use server";

import { revalidatePath } from "next/cache";

import { getAccessContext } from "@/lib/access/getAccessContext";
import {
  saveAccountLandingPageOperationalConfiguration,
  type AccountLandingPageOnboardingStoredValues,
} from "@/lp-builder";

import type { OnboardingConfigurationActionState } from "../../_components/onboarding-configuration-action-contract";

const MAX_VALUES_JSON_BYTES = 64 * 1024;

export async function saveLandingPageConfigurationAction(
  _previousState: OnboardingConfigurationActionState,
  formData: FormData,
): Promise<OnboardingConfigurationActionState> {
  const accountSubdomain = String(formData.get("account_subdomain") ?? "").trim().toLowerCase();
  const landingPageId = String(formData.get("landing_page_id") ?? "").trim();
  const expectedLandingPageRevision = parseExpectedRevision(formData.get("expected_revision"));
  const expectedSharedRevision = parseExpectedRevision(formData.get("expected_shared_revision"));
  const valuesJson = String(formData.get("values_json") ?? "");
  const intentEntry = formData.getAll("intent").at(-1);
  const intent = ["save", "next", "back", "exit"].includes(String(intentEntry))
    ? (String(intentEntry) as "save" | "next" | "back" | "exit")
    : null;
  if (
    !accountSubdomain ||
    !landingPageId ||
    !intent ||
    new TextEncoder().encode(valuesJson).byteLength > MAX_VALUES_JSON_BYTES
  ) return { status: "error", formError: "Não foi possível validar esta configuração." };

  let values: AccountLandingPageOnboardingStoredValues;
  try {
    const parsed: unknown = JSON.parse(valuesJson);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error();
    values = parsed as AccountLandingPageOnboardingStoredValues;
  } catch {
    return { status: "error", formError: "Não foi possível validar esta configuração." };
  }

  const route = `/a/${accountSubdomain}/landing-pages/${landingPageId}`;
  const ctx = await getAccessContext({ params: { account: accountSubdomain }, route });
  const accountId = (ctx?.account?.id ?? ctx?.account_id ?? null) as string | null;
  if (
    !ctx ||
    ctx.blocked ||
    ctx.account?.status !== "active" ||
    !accountId ||
    !["owner", "admin"].includes(String(ctx.role))
  ) return { status: "error", formError: "Você não pode editar esta página." };

  const result = await saveAccountLandingPageOperationalConfiguration({
    accountId,
    landingPageId,
    values,
    expectedSharedRevision,
    expectedLandingPageRevision,
    sameCommercialWorkConfirmed:
      String(formData.get("same_commercial_work_confirmed") ?? "") === "1",
  });
  if (!result.ok) {
    if (result.error === "revision_conflict") {
      return { status: "error", formError: "A configuração mudou em outra sessão. Recarregue a página." };
    }
    if (result.error === "identity_change_requires_new_landing_page") {
      return {
        status: "error",
        fieldErrors: result.fieldKey
          ? { [result.fieldKey]: "Esta mudança inicia outro trabalho comercial. Crie uma nova landing page." }
          : undefined,
        formError: "A identidade comercial já foi congelada por uma revisão válida.",
      };
    }
    if (result.error === "offer_change_confirmation_required") {
      return {
        status: "error",
        fieldErrors: {
          primary_service_or_offer:
            "Confirme abaixo se a oferta ainda pertence ao mesmo trabalho comercial.",
        },
      };
    }
    if (result.error === "invalid_values" && result.fieldKey) {
      return { status: "error", fieldErrors: { [result.fieldKey]: "Revise este valor antes de continuar." } };
    }
    return { status: "error", formError: "Não foi possível salvar agora. Nenhuma revisão de conteúdo foi alterada." };
  }

  revalidatePath(`/a/${accountSubdomain}`);
  revalidatePath(route);
  return {
    status: "success",
    intent,
    revision: result.landingPageRevision,
    sharedRevision: result.sharedRevision,
  };
}

function parseExpectedRevision(value: FormDataEntryValue | null): number | null {
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  const parsed = Number(raw);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
}
