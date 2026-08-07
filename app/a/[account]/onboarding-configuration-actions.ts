"use server";

import { revalidatePath } from "next/cache";
import { getAccessContext } from "@/lib/access/getAccessContext";
import {
  bindAccountLandingPageOnboardingConfiguration,
  createAccountLandingPage,
  getAccountLandingPageOnboardingConfiguration,
  listAccountLandingPageDrafts,
  saveAccountLandingPageOnboardingConfiguration,
  type AccountLandingPageOnboardingStoredValues,
} from "../../../lib/lp-builder";
import type {
  OnboardingConfigurationActionIntent,
  OnboardingConfigurationActionState,
  OnboardingCompletionActionState,
} from "./_components/onboarding-configuration-action-contract";

const GENERIC_ERROR =
  "Não foi possível salvar seu progresso agora. Revise os dados e tente novamente.";
const MAX_VALUES_JSON_BYTES = 64 * 1024;
const COMPLETION_ERROR =
  "Não foi possível concluir agora. Recarregue a página e tente novamente.";

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

export async function completeOnboardingConfigurationAction(
  _previousState: OnboardingCompletionActionState,
  formData: FormData,
): Promise<OnboardingCompletionActionState> {
  const accountSubdomain = String(formData.get("account_subdomain") ?? "")
    .trim()
    .toLowerCase();
  const route = accountSubdomain ? `/a/${accountSubdomain}` : "/a";
  const intent = String(formData.get("completion_intent") ?? "");
  const expectedRevision = Number(formData.get("expected_revision"));
  if (
    !accountSubdomain ||
    !["create", "select"].includes(intent) ||
    !Number.isInteger(expectedRevision) ||
    expectedRevision <= 0
  ) {
    return { status: "error", formError: COMPLETION_ERROR };
  }

  const ctx = await getAccessContext({
    params: { account: accountSubdomain },
    route,
  });
  if (!ctx || ctx.blocked || ctx.account?.status !== "active") {
    return {
      status: "error",
      formError: "Esta conta não está disponível para concluir a configuração.",
    };
  }
  const accountId = (ctx.account?.id ?? ctx.account_id ?? null) as string | null;
  if (!accountId) return { status: "error", formError: COMPLETION_ERROR };

  const current = await getAccountLandingPageOnboardingConfiguration({ accountId });
  if (!current.ok || !current.configuration.complete) {
    return {
      status: "error",
      formError:
        "Revise os dados obrigatórios da conta antes de criar ou escolher uma página.",
    };
  }
  if (current.configuration.landingPageId) {
    return {
      status: "error",
      formError: "A configuração já está vinculada a uma landing page.",
    };
  }
  if (current.configuration.revision !== expectedRevision) {
    return {
      status: "error",
      formError:
        "A configuração mudou em outra sessão. Recarregue a página antes de continuar.",
    };
  }

  const drafts = await listAccountLandingPageDrafts({ accountId });
  if (!drafts.ok) {
    return { status: "error", formError: COMPLETION_ERROR };
  }

  let landingPageId = String(formData.get("landing_page_id") ?? "").trim();
  if (intent === "create") {
    if (drafts.drafts.length > 0) {
      return {
        status: "error",
        formError:
          "Já existe um rascunho disponível. Recarregue a página e escolha explicitamente qual deseja continuar.",
      };
    }
    const created = await createAccountLandingPage({
      accountId,
      name: String(formData.get("landing_page_name") ?? "").trim(),
      slug: String(formData.get("landing_page_slug") ?? "").trim(),
    });
    if (!created.ok) {
      return {
        status: "error",
        formError:
          created.error === "slug_already_exists"
            ? "Este endereço curto já está em uso. Escolha outro para a nova página."
            : created.error === "invalid_name" || created.error === "invalid_slug"
              ? "Informe um nome e um endereço curto válidos para a nova página."
              : COMPLETION_ERROR,
      };
    }
    landingPageId = created.landingPage.id;
  }

  if (!landingPageId) {
    return {
      status: "error",
      formError: "Escolha explicitamente o rascunho que deseja continuar.",
    };
  }
  if (
    intent === "select" &&
    !drafts.drafts.some((draft) => draft.id === landingPageId)
  ) {
    return {
      status: "error",
      formError: "O rascunho escolhido não está mais disponível para esta conta.",
    };
  }

  const bound = await bindAccountLandingPageOnboardingConfiguration({
    accountId,
    landingPageId,
    expectedRevision,
  });
  if (!bound.ok) {
    if (intent === "create") {
      return {
        status: "error",
        formError:
          "O rascunho foi criado, mas o vínculo não foi concluído. Recarregue a página e selecione esse rascunho para continuar.",
      };
    }
    if (
      bound.error === "revision_conflict" ||
      bound.error === "landing_page_already_bound"
    ) {
      return {
        status: "error",
        formError:
          "A configuração mudou em outra sessão. Recarregue a página antes de continuar.",
      };
    }
    if (bound.error === "landing_page_not_found") {
      return {
        status: "error",
        formError:
          "O rascunho escolhido não está mais disponível para esta conta.",
      };
    }
    return { status: "error", formError: COMPLETION_ERROR };
  }

  revalidatePath(route);
  return { status: "success", landingPageId };
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
