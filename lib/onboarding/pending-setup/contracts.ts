export const PREFERRED_NAME_MAX_LENGTH = 80;

export type PreferredNameValidation =
  | { ok: true; value: string }
  | { ok: false; error: string };

export function validatePreferredName(input: unknown): PreferredNameValidation {
  const value = typeof input === "string" ? input.trim().replace(/\s+/g, " ") : "";
  if (!value) return { ok: false, error: "Diga como você prefere ser chamado." };
  if (value.length > PREFERRED_NAME_MAX_LENGTH) {
    return {
      ok: false,
      error: `Use no máximo ${PREFERRED_NAME_MAX_LENGTH} caracteres.`,
    };
  }
  return { ok: true, value };
}
