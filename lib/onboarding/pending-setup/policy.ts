const AUTH_PREFERRED_NAME_KEYS = ["preferred_name", "full_name", "name"] as const;
const MAX_PREFERRED_NAME_LENGTH = 80;
const MAX_BUSINESS_CONTEXT_LENGTH = 4000;

export type PreferredNameValidation =
  | Readonly<{ ok: true; value: string }>
  | Readonly<{ ok: false; reason: "empty" | "too_long" | "invalid" | "email_derived" }>;

function normalizeSpaces(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function comparisonValue(value: string): string {
  return normalizeSpaces(value).normalize("NFKC").toLocaleLowerCase("pt-BR");
}

export function validatePreferredName(
  input: unknown,
  email: string | null | undefined,
): PreferredNameValidation {
  if (typeof input !== "string") return { ok: false, reason: "empty" };

  const value = normalizeSpaces(input);
  if (!value) return { ok: false, reason: "empty" };
  if (value.length > MAX_PREFERRED_NAME_LENGTH) return { ok: false, reason: "too_long" };
  if (/[@\u0000-\u001f\u007f]/u.test(value)) return { ok: false, reason: "invalid" };

  const normalizedEmail = typeof email === "string" ? email.trim().toLocaleLowerCase("pt-BR") : "";
  const emailLocalPart = normalizedEmail.split("@")[0] ?? "";
  const compared = comparisonValue(value);
  if (normalizedEmail && (compared === normalizedEmail || compared === emailLocalPart)) {
    return { ok: false, reason: "email_derived" };
  }

  return { ok: true, value };
}

export function resolvePreferredNameFromAuth(
  metadata: unknown,
  email: string | null | undefined,
): string | null {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return null;

  const values = metadata as Record<string, unknown>;
  for (const key of AUTH_PREFERRED_NAME_KEYS) {
    const candidate = validatePreferredName(values[key], email);
    if (candidate.ok) return candidate.value;
  }

  return null;
}

export function validateBusinessContext(input: unknown):
  | Readonly<{ ok: true; value: string }>
  | Readonly<{ ok: false; reason: "empty" | "too_long" }> {
  if (typeof input !== "string") return { ok: false, reason: "empty" };

  const value = normalizeSpaces(input);
  if (!value) return { ok: false, reason: "empty" };
  if (value.length > MAX_BUSINESS_CONTEXT_LENGTH) return { ok: false, reason: "too_long" };
  return { ok: true, value };
}

export function redactPotentialContactDetails(input: string): string {
  return input
    .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/giu, "[email removido]")
    .replace(/\bhttps?:\/\/\S+|\bwww\.\S+/giu, "[url removida]")
    .replace(/(?:\+?\d[\s().-]*){10,15}/gu, "[telefone removido]")
    .replace(/\s+/g, " ")
    .trim();
}

export const pendingSetupPolicy = {
  authPreferredNameKeys: AUTH_PREFERRED_NAME_KEYS,
  maxPreferredNameLength: MAX_PREFERRED_NAME_LENGTH,
  maxBusinessContextLength: MAX_BUSINESS_CONTEXT_LENGTH,
} as const;
