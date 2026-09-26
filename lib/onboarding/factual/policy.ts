import type { MemberRole } from "../../types/status";
import type { ResolvedFactualCoverage } from "../../conversion-content/landing-page/input-catalog";

export type FactualValues = Readonly<{
  businessDisplayName: string | null;
  whatsapp: string | null;
  creciRegistration: string | null;
}>;

export type FactualInput = Readonly<{
  businessDisplayName: string;
  whatsapp: string;
  creciRegistration: string;
}>;

export type FactualInputErrors = Partial<Record<keyof FactualInput, string>>;

export function canEditFactualValues(role: MemberRole): boolean {
  return role === "owner" || role === "admin" || role === "editor";
}

export function hasFactualCatalogCutover(rows: unknown, count: number | null): boolean {
  if (count !== 2 || !Array.isArray(rows) || rows.length !== 2) return false;
  const definitions = new Map<string, Record<string, unknown>>();
  for (const row of rows) {
    if (!row || typeof row !== "object" || typeof row.field_key !== "string" ||
        !row.definition || typeof row.definition !== "object" || Array.isArray(row.definition)) return false;
    definitions.set(row.field_key, row.definition as Record<string, unknown>);
  }
  return definitions.size === 2 &&
    definitions.get("business_display_name")?.obligation === "required" &&
    definitions.get("business_display_name")?.valueType === "string" &&
    definitions.get("creci_registration")?.obligation === "optional" &&
    definitions.get("creci_registration")?.valueType === "string";
}

export function assessFactualCoverage(
  coverage: ResolvedFactualCoverage,
): Readonly<{ ok: true; creciApplicable: boolean }> | Readonly<{ ok: false }> {
  const business = coverage.fields.find((field) => field.fieldKey === "business_display_name");
  const creci = coverage.fields.find((field) => field.fieldKey === "creci_registration");
  const isCorretor = coverage.appliedLayers.some((layer) => layer.taxon?.slug === "corretor-imoveis");
  if (
    coverage.fields.some((field) => !["business_display_name", "creci_registration"].includes(field.fieldKey)) ||
    !business || business.originLayer !== "universal" || business.obligation !== "required" ||
    business.valueType !== "string" ||
    Boolean(creci) !== isCorretor ||
    (creci && (creci.originTaxon?.slug !== "corretor-imoveis" || creci.obligation !== "optional" || creci.valueType !== "string"))
  ) return { ok: false };
  return { ok: true, creciApplicable: Boolean(creci) };
}

export function validateFactualInput(
  input: FactualInput,
  creciApplicable: boolean,
): Readonly<{ ok: true; values: FactualValues }> | Readonly<{ ok: false; errors: FactualInputErrors }> {
  const businessDisplayName = input.businessDisplayName.trim();
  const whatsapp = input.whatsapp.trim();
  const creciRegistration = input.creciRegistration.trim();
  const errors: FactualInputErrors = {};

  if (!businessDisplayName) errors.businessDisplayName = "Informe o nome público do negócio ou profissional.";
  else if (businessDisplayName.length > 120) errors.businessDisplayName = "Use no máximo 120 caracteres.";
  if (whatsapp.length > 32) errors.whatsapp = "Use no máximo 32 caracteres.";
  if (creciApplicable && creciRegistration.length > 80) errors.creciRegistration = "Use no máximo 80 caracteres.";
  if (Object.keys(errors).length) return { ok: false, errors };

  return {
    ok: true,
    values: {
      businessDisplayName,
      whatsapp: whatsapp || null,
      creciRegistration: creciApplicable ? creciRegistration || null : null,
    },
  };
}

export function isFactualReady(values: FactualValues): boolean {
  return Boolean(values.businessDisplayName?.trim());
}

export function buildFactualProfileWrite(
  accountId: string,
  values: FactualValues,
  creciApplicable: boolean,
) {
  return {
    account_id: accountId,
    business_display_name: values.businessDisplayName,
    whatsapp: values.whatsapp,
    ...(creciApplicable ? { creci_registration: values.creciRegistration } : {}),
    updated_at: new Date().toISOString(),
  };
}
