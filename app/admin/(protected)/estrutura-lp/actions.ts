"use server";

import { revalidatePath } from "next/cache";

import { requirePlatformAdmin } from "@/lib/access/guards";
import {
  initializeAdminInputCatalogDraft,
  applyAdminInputCatalogDraftOperation,
  prepareAdminInputCatalogPublication,
  reconcileAdminInputCatalogPublishedDraft,
  validateAdminInputCatalogDraft,
} from "@/lib/admin/adapters/adminInputCatalogLifecycleAdapter";
import type { LandingPageInputCatalogDraftFieldContract, LandingPageInputCatalogDraftOperation } from "@/conversion-content/landing-page/input-catalog";

export type InputCatalogLifecycleActionState = Readonly<{
  error: string | null;
  message: string | null;
  handoff: string | null;
  revision: number;
}>;

export async function initializeInputCatalogDraftAction(
  previous: InputCatalogLifecycleActionState,
): Promise<InputCatalogLifecycleActionState> {
  const actor = await requirePlatformAdmin();
  if (!actor.allowed) return denied(previous);
  const result = await initializeAdminInputCatalogDraft({
    actorUserId: actor.actorUserId,
  });
  return complete(previous, result, "Draft sequencial criado sem efeito operacional.");
}

export async function applyInputCatalogDraftOperationAction(
  previous: InputCatalogLifecycleActionState,
  formData: FormData,
): Promise<InputCatalogLifecycleActionState> {
  const actor = await requirePlatformAdmin();
  if (!actor.allowed) return denied(previous);
  const operation = parseDraftOperation(formData);
  if (!operation.ok) {
    return { error: operation.message, message: null, handoff: null, revision: nextRevision(previous.revision) };
  }
  const result = await applyAdminInputCatalogDraftOperation({
    actorUserId: actor.actorUserId,
    expectedRevision: Number(formData.get("expectedRevision")),
    operation: operation.value,
  });
  if (result.ok) revalidatePath("/admin/taxonomia");
  return complete(previous, result, "Operação aplicada ao draft; validações e decisões anteriores foram invalidadas.");
}

export async function validateInputCatalogDraftAction(
  previous: InputCatalogLifecycleActionState,
  formData: FormData,
): Promise<InputCatalogLifecycleActionState> {
  const actor = await requirePlatformAdmin();
  if (!actor.allowed) return denied(previous);
  const result = await validateAdminInputCatalogDraft({
    actorUserId: actor.actorUserId,
    expectedRevision: Number(formData.get("expectedRevision")),
  });
  return complete(previous, result, "Draft e impacto foram revalidados sobre o conteúdo atual.");
}

export async function prepareInputCatalogPublicationAction(
  previous: InputCatalogLifecycleActionState,
  formData: FormData,
): Promise<InputCatalogLifecycleActionState> {
  const actor = await requirePlatformAdmin();
  if (!actor.allowed) return denied(previous);
  const result = await prepareAdminInputCatalogPublication({
    actorUserId: actor.actorUserId,
    expectedRevision: Number(formData.get("expectedRevision")),
  });
  return complete(
    previous,
    result,
    "Handoff congelado. A versão atual não mudou e depende de materialização, revisão, merge e deploy.",
  );
}

export async function reconcileInputCatalogPublishedDraftAction(
  previous: InputCatalogLifecycleActionState,
  formData: FormData,
): Promise<InputCatalogLifecycleActionState> {
  const actor = await requirePlatformAdmin();
  if (!actor.allowed) return denied(previous);
  const result = await reconcileAdminInputCatalogPublishedDraft({
    actorUserId: actor.actorUserId,
    expectedRevision: Number(formData.get("expectedRevision")),
    runtimeEnvironment: process.env.VERCEL_ENV,
  });
  return complete(
    previous,
    result,
    "O draft temporário foi reconciliado com o registry já implantado.",
  );
}

function complete(
  previous: InputCatalogLifecycleActionState,
  result: Awaited<ReturnType<typeof initializeAdminInputCatalogDraft>>,
  message: string,
): InputCatalogLifecycleActionState {
  const revision = nextRevision(previous.revision);
  if (!result.ok) {
    return { error: result.message, message: null, handoff: null, revision };
  }
  revalidatePath("/admin/estrutura-lp");
  return {
    error: null,
    message,
    handoff: result.handoff ?? null,
    revision,
  };
}

function denied(
  previous: InputCatalogLifecycleActionState,
): InputCatalogLifecycleActionState {
  return {
    error: "Acesso administrativo não autorizado.",
    message: null,
    handoff: null,
    revision: nextRevision(previous.revision),
  };
}

function nextRevision(value: number): number {
  return Number.isSafeInteger(value) && value >= 0 ? value + 1 : 1;
}

function parseDraftOperation(formData: FormData): Readonly<{ ok: true; value: LandingPageInputCatalogDraftOperation }> | Readonly<{ ok: false; message: string }> {
  const kind = String(formData.get("operationKind") ?? "");
  const targetKind = String(formData.get("targetKind") ?? "");
  const taxonId = String(formData.get("taxonId") ?? "");
  const fieldKey = String(formData.get("fieldKey") ?? "").trim();
  if (kind !== "add" && kind !== "change" && kind !== "retire") return { ok: false, message: "Escolha uma operação válida." };
  if (targetKind !== "universal" && (targetKind !== "taxon_layer" || !taxonId)) return { ok: false, message: "Escolha uma camada alvo válida." };
  const target = targetKind === "universal" ? { kind: "universal" as const } : { kind: "taxon_layer" as const, taxonId };
  if (!fieldKey) return { ok: false, message: "Informe a chave do field." };
  if (kind === "retire") return { ok: true, value: { kind, target, fieldKey } };
  const field = parseFieldContract(formData, fieldKey);
  if (!field.ok) return field;
  return { ok: true, value: kind === "add" ? { kind, target, field: field.value } : { kind, target, fieldKey, field: field.value } };
}

function parseFieldContract(formData: FormData, fieldKey: string): Readonly<{ ok: true; value: LandingPageInputCatalogDraftFieldContract }> | Readonly<{ ok: false; message: string }> {
  const valueType = String(formData.get("valueType") ?? "");
  const obligation = String(formData.get("obligation") ?? "");
  const validation = validationFor(
    valueType,
    String(formData.get("allowedValues") ?? ""),
    String(formData.get("minimum") ?? ""),
    String(formData.get("maximum") ?? ""),
  );
  const allowedPlans = formData.getAll("allowedPlans").map(String);
  const purpose = String(formData.get("purpose") ?? "").trim();
  const evidenceSummary = String(formData.get("evidenceSummary") ?? "").trim();
  if (!validation || !purpose || !evidenceSummary || allowedPlans.length === 0) return { ok: false, message: "Preencha o contrato completo do field, incluindo plano, validação e evidência." };
  const requiredWhen = obligation === "conditional"
    ? parseCondition(formData, "requiredWhen")
    : { ok: true as const, value: null };
  if (!requiredWhen.ok) return requiredWhen;
  const applicableWhen = formData.get("applicableWhenEnabled") === "true"
    ? parseCondition(formData, "applicableWhen")
    : { ok: true as const, value: null };
  if (!applicableWhen.ok) return applicableWhen;
  const capabilityBindings = formData.get("capabilityBindingEnabled") === "true"
    ? [{ slotKey: "applicable_capabilities" as const, supportedWhenValue: true as const }]
    : undefined;
  return { ok: true, value: {
    kind: "field",
    fieldKey,
    purpose,
    valueScope: String(formData.get("valueScope")) as LandingPageInputCatalogDraftFieldContract["valueScope"],
    expectedValueOrigin: String(formData.get("expectedValueOrigin")) as LandingPageInputCatalogDraftFieldContract["expectedValueOrigin"],
    obligation: obligation as LandingPageInputCatalogDraftFieldContract["obligation"],
    ...(requiredWhen.value ? { requiredWhen: requiredWhen.value } : {}),
    ...(applicableWhen.value ? { applicableWhen: applicableWhen.value } : {}),
    allowedPlans: allowedPlans as LandingPageInputCatalogDraftFieldContract["allowedPlans"],
    snapshotPolicy: "include_if_used",
    landingPageSubstitutionPolicy: String(formData.get("substitutionPolicy")) as NonNullable<LandingPageInputCatalogDraftFieldContract["landingPageSubstitutionPolicy"]>,
    evidence: { summary: evidenceSummary, references: ["decision:e20-2-human"] },
    valueType: valueType as LandingPageInputCatalogDraftFieldContract["valueType"],
    validation,
    ...(capabilityBindings ? { capabilityBindings } : {}),
  } as LandingPageInputCatalogDraftFieldContract };
}

function parseCondition(
  formData: FormData,
  prefix: "requiredWhen" | "applicableWhen",
):
  | Readonly<{
      ok: true;
      value: NonNullable<LandingPageInputCatalogDraftFieldContract["requiredWhen"]>;
    }>
  | Readonly<{ ok: false; message: string }> {
  const fieldKey = String(formData.get(`${prefix}FieldKey`) ?? "").trim();
  const operator = String(formData.get(`${prefix}Operator`) ?? "");
  const valueKind = String(formData.get(`${prefix}ValueKind`) ?? "");
  const rawValue = String(formData.get(`${prefix}Value`) ?? "").trim();
  if (
    !fieldKey ||
    (operator !== "equals" && operator !== "in") ||
    (valueKind !== "text" && valueKind !== "boolean" && valueKind !== "list") ||
    !rawValue
  ) {
    return { ok: false, message: "Preencha todos os campos fechados da condição factual." };
  }
  if (valueKind === "boolean" && rawValue !== "true" && rawValue !== "false") {
    return { ok: false, message: "A condição booleana aceita somente true ou false." };
  }
  const value = valueKind === "boolean"
    ? rawValue === "true"
    : valueKind === "list"
      ? rawValue.split(",").map((item) => item.trim()).filter(Boolean)
      : rawValue;
  return {
    ok: true,
    value: {
      fieldKey,
      operator,
      value,
    },
  };
}

function validationFor(
  valueType: string,
  rawValues: string,
  rawMinimum: string,
  rawMaximum: string,
): LandingPageInputCatalogDraftFieldContract["validation"] | null {
  const values = rawValues.split(",").map((value) => value.trim()).filter(Boolean);
  if (valueType === "string" || valueType === "boolean") return { kind: "type_only" };
  if (valueType === "phone") return { kind: "e164" };
  if (valueType === "email") return { kind: "email" };
  if (valueType === "url") return { kind: "https_url" };
  if (valueType === "keyword_map") return { kind: "keyword_map" };
  if (valueType === "asset_reference") return { kind: "asset_reference" };
  if (valueType === "color_palette") return { kind: "color_palette" };
  if (valueType === "offering_scope") return { kind: "offering_scope" };
  if (valueType === "enum" && values.length > 0) return { kind: "enum", allowedValues: values };
  if (valueType === "string_list") return { kind: "string_list", ...(values.length > 0 ? { allowedValues: values } : {}) };
  if (valueType === "number_range") {
    const minimum = parseOptionalFiniteNumber(rawMinimum);
    const maximum = parseOptionalFiniteNumber(rawMaximum);
    if (minimum === null || maximum === null || (minimum !== undefined && maximum !== undefined && minimum > maximum)) {
      return null;
    }
    return {
      kind: "number_range",
      currency: "BRL",
      ...(minimum === undefined ? {} : { minimum }),
      ...(maximum === undefined ? {} : { maximum }),
    };
  }
  return null;
}

function parseOptionalFiniteNumber(rawValue: string): number | undefined | null {
  const value = rawValue.trim();
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}
