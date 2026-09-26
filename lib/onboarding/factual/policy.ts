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

export function assessFactualCoverage(
  coverage: ResolvedFactualCoverage,
): Readonly<{ ok: true; creciApplicable: boolean }> | Readonly<{ ok: false }> {
  const business = coverage.fields.find((field) => field.fieldKey === "business_display_name");
  const creci = coverage.fields.find((field) => field.fieldKey === "creci_registration");
  if (
    coverage.fields.some((field) => !["business_display_name", "creci_registration"].includes(field.fieldKey)) ||
    !business || business.originLayer !== "universal" || business.obligation !== "required" ||
    business.valueType !== "string" ||
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
