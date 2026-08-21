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
  const expectedLandingPageRevision = Number(formData.get("expected_revision"));
  const expectedSharedRevision = Number(formData.get("expected_shared_revision"));
  const valuesJson = String(formData.get("values_json") ?? "");
  const intent = String(formData.get("intent") ?? "save") as "save" | "next" | "back" | "exit";
  if (
    !accountSubdomain || !landingPageId ||
    !Number.isSafeInteger(expectedLandingPageRevision) ||
    !Number.isSafeInteger(expectedSharedRevision) ||
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

  const ctx = await getAccessContext({
    params: { account: accountSubdomain },
    route: `/a/${accountSubdomain}/landing-pages/${landingPageId}`,
  });
  const accountId = (ctx?.account?.id ?? ctx?.account_id ?? null) as string | null;
  if (!ctx || ctx.blocked || ctx.account?.status !== "active" || !accountId) {
    return { status: "error", formError: "Você não pode editar esta página." };
  }

  const sharedValues: Record<string, AccountLandingPageOnboardingStoredValues[string]> = {};
  const landingPageValues: Record<string, AccountLandingPageOnboardingStoredValues[string]> = {};
  for (const [fieldKey, stored] of Object.entries(values)) {
    if (stored.scope === "account" || stored.scope === "business") sharedValues[fieldKey] = stored;
    else landingPageValues[fieldKey] = stored;
  }

  const result = await saveAccountLandingPageOperationalConfiguration({
    accountId,
    landingPageId,
    sharedValues,
    landingPageValues,
    expectedSharedRevision,
    expectedLandingPageRevision,
  });
  if (!result.ok) {
    if (result.error === "revision_conflict") return { status: "error", formError: "A configuração mudou em outra sessão. Recarregue a página." };
    if (result.error === "invalid_values" && result.fieldKey) return { status: "error", fieldErrors: { [result.fieldKey]: "Revise este valor antes de continuar." } };
    if (result.error === "not_operational") return { status: "error", formError: "Restaure a página antes de alterar sua configuração." };
    return { status: "error", formError: "Não foi possível salvar agora. Nenhuma revisão de conteúdo foi alterada." };
  }

  revalidatePath(`/a/${accountSubdomain}`);
  revalidatePath(`/a/${accountSubdomain}/landing-pages/${landingPageId}`);
  return {
    status: "success",
    intent,
    revision: result.landingPageRevision,
    sharedRevision: result.sharedRevision,
  };
}
