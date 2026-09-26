"use server";

import { revalidatePath } from "next/cache";
import { loadFactualOnboarding, saveFactualProfile } from "../../../lib/onboarding/factual/adapters/accountFactualOnboardingAdapter";
import { validateFactualInput, type FactualInputErrors } from "../../../lib/onboarding/factual/policy";

export type FactualActionState = Readonly<{
  status: "idle" | "saved" | "error";
  formError?: string;
  fieldErrors?: FactualInputErrors;
}>;

const UNAVAILABLE = "Não foi possível salvar os dados agora. Atualize a página e tente novamente.";

export async function saveFactualOnboardingAction(
  _previousState: FactualActionState,
  formData: FormData,
): Promise<FactualActionState> {
  const accountSubdomain = readString(formData, "account_subdomain").trim().toLowerCase();
  const current = await loadFactualOnboarding(accountSubdomain);
  if (current.status !== "available" || !current.canEdit) {
    return { status: "error", formError: UNAVAILABLE };
  }

  const parsed = validateFactualInput({
    businessDisplayName: readString(formData, "business_display_name"),
    whatsapp: readString(formData, "whatsapp"),
    creciRegistration: readString(formData, "creci_registration"),
  }, current.creciApplicable);
  if (!parsed.ok) return { status: "error", fieldErrors: parsed.errors };

  const saved = await saveFactualProfile({
    accountId: current.accountId,
    values: parsed.values,
    creciApplicable: current.creciApplicable,
  });
  if (!saved) return { status: "error", formError: UNAVAILABLE };

  revalidatePath(`/a/${current.accountSubdomain}`);
  return { status: "saved" };
}

function readString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}
