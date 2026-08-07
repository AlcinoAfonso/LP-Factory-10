"use server";

import { revalidatePath } from "next/cache";
import { getAccessContext } from "@/lib/access/getAccessContext";
import {
  saveAccountLandingPageOnboardingConfiguration,
  type AccountLandingPageOnboardingStoredValues,
} from "../../../lib/lp-builder";
import type {
  OnboardingConfigurationActionIntent,
  OnboardingConfigurationActionState,
} from "./_components/onboarding-configuration-action-contract";

const GENERIC_ERROR =
  "Não foi possível salvar seu progresso agora. Revise os dados e tente novamente.";
const MAX_VALUES_JSON_BYTES = 64 * 1024;

export async function saveOnboardingConfigurationAction(
  _previousState: OnboardingConfigurationActionState,
  formData: FormData,
): Promise<OnboardingConfigurationActionState> {
  const accountSubdomain = String(formData.get("account_subdomain") ?? "")
    .trim()
    .toLowerCase();
  const route = accountSubdomain ? `/a/${accountSubdomain}` : "/a";
  const intentEntries = formData.getAll("intent");
  const intent = parseIntent(intentEntries.at(-1) ?? null);
  const catalogVersion = Number(formData.get("catalog_version"));
  const expectedRevision = Number(formData.get("expected_revision"));
  const valuesJson = String(formData.get("values_json") ?? "");

  if (
    !accountSubdomain ||
    !intent ||
    !Number.isInteger(catalogVersion) ||
    catalogVersion <= 0 ||
    !Number.isInteger(expectedRevision) ||
    expectedRevision < 0 ||
    !valuesJson ||
    new TextEncoder().encode(valuesJson).byteLength > MAX_VALUES_JSON_BYTES
  ) {
    return { status: "error", formError: GENERIC_ERROR };
  }

  const values = parseValues(valuesJson);
  if (!values) {
    return { status: "error", formError: GENERIC_ERROR };
  }

  const ctx = await getAccessContext({
    params: { account: accountSubdomain },
    route,
  });
  if (!ctx || ctx.blocked || ctx.account?.status !== "active") {
    return {
      status: "error",
      formError: "Esta conta não está disponível para configuração.",
    };
  }

  const accountId = (ctx.account?.id ?? ctx.account_id ?? null) as string | null;
  if (!accountId) {
    return { status: "error", formError: GENERIC_ERROR };
  }

  const result = await saveAccountLandingPageOnboardingConfiguration({
    accountId,
    catalogVersion,
    expectedRevision,
    values,
  });

  if (!result.ok) {
    if (result.error === "revision_conflict") {
      return {
        status: "error",
        formError:
          "Seu progresso foi atualizado em outra sessão. Recarregue a página antes de continuar.",
      };
    }
    if (result.error === "invalid_values" && result.fieldKey) {
      return {
        status: "error",
        fieldErrors: {
          [result.fieldKey]: "Revise este valor antes de continuar.",
        },
      };
    }
    if (
      result.error === "commercial_entitlement_required" ||
      result.error === "membership_inactive" ||
      result.error === "account_not_active" ||
      result.error === "taxon_unavailable"
    ) {
      return {
        status: "error",
        formError:
          "A configuração da conta mudou e precisa ser revisada antes de continuar.",
      };
    }
    return { status: "error", formError: GENERIC_ERROR };
  }

  revalidatePath(route);
  return {
    status: "success",
    intent,
    revision: result.configuration.revision,
  };
}

function parseIntent(value: FormDataEntryValue | null) {
  return ["save", "next", "back", "exit"].includes(String(value))
    ? (String(value) as OnboardingConfigurationActionIntent)
    : null;
}

function parseValues(
  input: string,
): AccountLandingPageOnboardingStoredValues | null {
  try {
    const parsed: unknown = JSON.parse(input);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return null;
    }
    return parsed as AccountLandingPageOnboardingStoredValues;
  } catch {
    return null;
  }
}
