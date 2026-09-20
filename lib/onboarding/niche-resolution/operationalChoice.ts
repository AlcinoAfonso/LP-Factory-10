export const LEGACY_OPERATIONAL_CHOICE_LIMIT = 120;
export const PENDING_SETUP_OPERATIONAL_CHOICE_LIMIT = 500;

export type OperationalChoiceLimit =
  | typeof LEGACY_OPERATIONAL_CHOICE_LIMIT
  | typeof PENDING_SETUP_OPERATIONAL_CHOICE_LIMIT;

export function validateOperationalChoiceLabel(
  value: unknown,
  limit: OperationalChoiceLimit,
): { ok: true; value: string } | { ok: false; reason: "empty_rewrite" | "rewrite_too_long" } {
  const normalized = String(value ?? "").replace(/\s+/g, " ").trim();
  if (!normalized) return { ok: false, reason: "empty_rewrite" };
  if (normalized.length > limit) return { ok: false, reason: "rewrite_too_long" };
  return { ok: true, value: normalized };
}
