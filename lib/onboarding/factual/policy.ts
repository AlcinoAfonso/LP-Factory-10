import type { MemberRole } from "../../types/status";
import type { ResolvedFactualCoverage } from "../../conversion-content/landing-page/input-catalog";

export type FactualValues = Readonly<{
  businessDisplayName: string | null;
  whatsapp: string | null;
  creciRegistration: string | null;
  professionalRegulatoryCredential: string | null;
}>;

export type FactualInput = Readonly<{
  businessDisplayName: string;
  whatsapp: string;
  creciRegistration: string;
  professionalRegulatoryCredential: string;
}>;

export type FactualInputErrors = Partial<Record<keyof FactualInput, string>>;

export function canEditFactualValues(role: MemberRole): boolean {
  return role === "owner" || role === "admin" || role === "editor";
}

export function hasFactualCatalogCutover(rows: unknown, count: number | null): boolean {
  if (count !== 3 || !Array.isArray(rows) || rows.length !== 3) return false;
  const definitions = new Map<string, Record<string, unknown>>();
  for (const row of rows) {
    if (!row || typeof row !== "object" || typeof row.field_key !== "string" ||
        !row.definition || typeof row.definition !== "object" || Array.isArray(row.definition)) return false;
    definitions.set(row.field_key, row.definition as Record<string, unknown>);
  }
  return definitions.size === 3 &&
    definitions.get("business_display_name")?.obligation === "required" &&
    definitions.get("business_display_name")?.valueType === "string" &&
    definitions.get("creci_registration")?.obligation === "optional" &&
    definitions.get("creci_registration")?.valueType === "string" &&
    definitions.get("professional_regulatory_credential")?.obligation === "optional" &&
    definitions.get("professional_regulatory_credential")?.valueType === "string";
}

export function assessFactualCoverage(
  coverage: ResolvedFactualCoverage,
): Readonly<{ ok: true; creciApplicable: boolean; professionalCredentialApplicable: boolean }> | Readonly<{ ok: false }> {
  const business = coverage.fields.find((field) => field.fieldKey === "business_display_name");
  const creci = coverage.fields.find((field) => field.fieldKey === "creci_registration");
  const credential = coverage.fields.find((field) => field.fieldKey === "professional_regulatory_credential");
  const isCorretor = coverage.appliedLayers.some((layer) => layer.taxon?.slug === "corretor-imoveis");
  const isProfessionalServices = coverage.appliedLayers.some((layer) => layer.level === "segment" && layer.taxon?.slug === "servicos-profissionais");
  if (
    coverage.fields.some((field) => !["business_display_name", "creci_registration", "professional_regulatory_credential"].includes(field.fieldKey)) ||
    !business || business.originLayer !== "universal" || business.obligation !== "required" ||
    business.valueType !== "string" ||
    Boolean(creci) !== isCorretor ||
    (creci && (creci.originLayer !== "niche" || creci.originTaxon?.slug !== "corretor-imoveis" || creci.obligation !== "optional" || creci.valueType !== "string")) ||
    Boolean(credential) !== isProfessionalServices ||
    (credential && (credential.originLayer !== "segment" || credential.originTaxon?.slug !== "servicos-profissionais" || credential.obligation !== "optional" || credential.valueType !== "string"))
  ) return { ok: false };
  return { ok: true, creciApplicable: Boolean(creci), professionalCredentialApplicable: Boolean(credential) };
}

export function validateFactualInput(
  input: FactualInput,
  creciApplicable: boolean,
  professionalCredentialApplicable: boolean,
): Readonly<{ ok: true; values: FactualValues }> | Readonly<{ ok: false; errors: FactualInputErrors }> {
  const businessDisplayName = input.businessDisplayName.trim();
  const whatsapp = input.whatsapp.trim();
  const creciRegistration = input.creciRegistration.trim();
  const professionalRegulatoryCredential = input.professionalRegulatoryCredential.trim();
  const errors: FactualInputErrors = {};

  if (!businessDisplayName) errors.businessDisplayName = "Informe o nome público do negócio ou profissional.";
  else if (businessDisplayName.length > 120) errors.businessDisplayName = "Use no máximo 120 caracteres.";
  if (whatsapp.length > 32) errors.whatsapp = "Use no máximo 32 caracteres.";
  if (creciApplicable && creciRegistration.length > 80) errors.creciRegistration = "Use no máximo 80 caracteres.";
  if (professionalCredentialApplicable && professionalRegulatoryCredential.length > 120) errors.professionalRegulatoryCredential = "Use no máximo 120 caracteres.";
  if (Object.keys(errors).length) return { ok: false, errors };

  return {
    ok: true,
    values: {
      businessDisplayName,
      whatsapp: whatsapp || null,
      creciRegistration: creciApplicable ? creciRegistration || null : null,
      professionalRegulatoryCredential: professionalCredentialApplicable ? professionalRegulatoryCredential || null : null,
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
  professionalCredentialApplicable: boolean,
) {
  return {
    account_id: accountId,
    business_display_name: values.businessDisplayName,
    whatsapp: values.whatsapp,
    ...(creciApplicable ? { creci_registration: values.creciRegistration } : {}),
    ...(professionalCredentialApplicable ? { professional_regulatory_credential: values.professionalRegulatoryCredential } : {}),
    updated_at: new Date().toISOString(),
  };
}
