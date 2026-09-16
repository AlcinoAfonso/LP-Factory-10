"use server";

import { revalidatePath } from "next/cache";

import { requirePlatformAdmin } from "@/lib/access/guards";
import { createAdminFactualField, setAdminFactualFieldActive, updateAdminFactualField } from "@/lib/admin/adapters/adminFactualFieldsAdapter";
import type { FactualFieldCondition, FactualFieldDefinition, FactualFieldValidation, FactualFieldValueScope } from "@/conversion-content/landing-page/input-catalog";

export type FactualFieldActionState = Readonly<{ error: string | null; message: string | null; revision: number }>;

export async function mutateFactualFieldAction(previous: FactualFieldActionState, formData: FormData): Promise<FactualFieldActionState> {
  const gate = await requirePlatformAdmin();
  if (!gate.allowed) return complete(previous, "Acesso administrativo não autorizado.", null);
  const operation = String(formData.get("operation") ?? "");
  let result;
  if (operation === "toggle") {
    result = await setAdminFactualFieldActive({
      actorUserId: gate.actorUserId,
      id: String(formData.get("id") ?? ""),
      expectedUpdatedAt: String(formData.get("expectedUpdatedAt") ?? ""),
      nextActive: formData.get("nextActive") === "true",
    });
  } else {
    const definition = parseDefinition(formData);
    if (!definition) return complete(previous, "Preencha uma definição factual válida.", null);
    if (operation === "create") {
      const residence = String(formData.get("taxonId") ?? "");
      if (!residence) return complete(previous, "Selecione uma residência factual válida.", null);
      result = await createAdminFactualField({ actorUserId: gate.actorUserId, fieldKey: String(formData.get("fieldKey") ?? ""), taxonId: residence === "universal" ? null : residence, definition });
    } else if (operation === "update") {
      result = await updateAdminFactualField({ actorUserId: gate.actorUserId, id: String(formData.get("id") ?? ""), expectedUpdatedAt: String(formData.get("expectedUpdatedAt") ?? ""), sameFactConfirmed: formData.get("sameFactConfirmed") === "on", definition });
    } else return complete(previous, "Operação factual inválida.", null);
  }
  if (!result.ok) return complete(previous, result.message, null);
  revalidatePath("/admin/estrutura-lp");
  return complete(previous, null, `${result.fieldKey} atualizado na autoridade factual corrente.`);
}

function parseDefinition(formData: FormData): FactualFieldDefinition | null {
  const valueScope = String(formData.get("valueScope") ?? "") as FactualFieldValueScope;
  const originByScope: Record<FactualFieldValueScope, FactualFieldDefinition["expectedValueOrigin"]> = {
    account: "account_provided", business: "business_provided", offer: "offer_provided", campaign: "campaign_provided", landing_page: "landing_page_provided",
  };
  if (!originByScope[valueScope]) return null;
  const obligation = String(formData.get("obligation") ?? "") as FactualFieldDefinition["obligation"];
  const requiredWhen = parseCondition(formData, "requiredWhen");
  const applicableWhen = parseCondition(formData, "applicableWhen");
  const validation = parseValidation(formData);
  if (!validation || !["required", "optional", "conditional"].includes(obligation)) return null;
  return {
    purpose: String(formData.get("purpose") ?? "").trim(),
    valueType: String(formData.get("valueType") ?? "") as FactualFieldDefinition["valueType"],
    valueScope,
    expectedValueOrigin: originByScope[valueScope],
    obligation,
    ...(obligation === "conditional" && requiredWhen ? { requiredWhen } : {}),
    ...(applicableWhen ? { applicableWhen } : {}),
    validation,
  };
}

function parseCondition(formData: FormData, prefix: "requiredWhen" | "applicableWhen"): FactualFieldCondition | null {
  const fieldKey = String(formData.get(`${prefix}FieldKey`) ?? "").trim();
  if (!fieldKey) return null;
  const raw = String(formData.get(`${prefix}Value`) ?? "").trim();
  const operator = formData.get(`${prefix}Operator`) === "in" ? "in" as const : "equals" as const;
  const value = operator === "in" ? raw.split(",").map((item) => item.trim()).filter(Boolean) : raw === "true" ? true : raw === "false" ? false : raw;
  return { fieldKey, operator, value };
}

function parseValidation(formData: FormData): FactualFieldValidation | null {
  const kind = String(formData.get("validationKind") ?? "");
  if (["type_only", "e164", "email", "https_url", "keyword_map", "asset_reference", "color_palette", "offering_scope"].includes(kind)) return { kind } as FactualFieldValidation;
  const allowedValues = String(formData.get("allowedValues") ?? "").split(",").map((item) => item.trim()).filter(Boolean);
  if (kind === "enum") return { kind, allowedValues };
  if (kind === "string_list") return { kind, ...(allowedValues.length ? { allowedValues } : {}), ...positiveInteger("minItems", formData), ...positiveInteger("maxItems", formData) };
  if (kind === "number_range") return { kind, currency: "BRL", ...nonNegativeNumber("minimum", formData), ...nonNegativeNumber("maximum", formData) };
  return null;
}
function positiveInteger(name: string, formData: FormData): Record<string, number> { const value = String(formData.get(name) ?? ""); const parsed = Number(value); return value && Number.isInteger(parsed) && parsed > 0 ? { [name]: parsed } : {}; }
function nonNegativeNumber(name: string, formData: FormData): Record<string, number> { const value = String(formData.get(name) ?? ""); const parsed = Number(value); return value && Number.isFinite(parsed) && parsed >= 0 ? { [name]: parsed } : {}; }
function complete(previous: FactualFieldActionState, error: string | null, message: string | null): FactualFieldActionState { return { error, message, revision: Number.isSafeInteger(previous.revision) ? previous.revision + 1 : 1 }; }
