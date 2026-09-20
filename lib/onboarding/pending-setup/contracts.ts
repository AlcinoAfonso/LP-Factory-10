import type { ActionableNicheResolution } from "../niche-resolution/contracts";

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

export function validatePendingSetupTurnId(input: unknown): string | null {
  const value = typeof input === "string" ? input.trim() : "";
  return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
    ? value
    : null;
}

export type PendingSetupBusinessSnapshot =
  | { kind: "awaiting_business" }
  | { kind: "awaiting_confirmation"; resolution: ActionableNicheResolution }
  | { kind: "ready_official"; rawInput: string; taxonName: string }
  | { kind: "ready_fallback"; description: string };

export type PendingSetupConversationTurnKind =
  | "business_description"
  | "clarification"
  | "official_confirmation"
  | "operational_confirmation"
  | "fallback_confirmation";

export type PendingSetupConversationProductState =
  | "awaiting_confirmation"
  | "ready_official"
  | "ready_fallback"
  | "failure";

export type PendingSetupCompletionMode = "official" | "fallback";

export type PendingSetupConversationTurn = {
  id: string;
  userMessage: string;
  turnKind: PendingSetupConversationTurnKind;
  status: "pending" | "completed" | "failed";
  productState: PendingSetupConversationProductState | null;
  productMessage: string | null;
  createdAt: string;
  completedAt: string | null;
};

export function presentPendingSetupBusinessTurn(
  business: PendingSetupBusinessSnapshot,
): { state: PendingSetupConversationProductState; message: string } | null {
  if (business.kind === "awaiting_confirmation") {
    return {
      state: "awaiting_confirmation",
      message: "Preciso da sua confirmação para continuar.",
    };
  }
  if (business.kind === "ready_official") {
    return {
      state: "ready_official",
      message: `Entendimento confirmado: ${business.taxonName}.`,
    };
  }
  if (business.kind === "ready_fallback") {
    return {
      state: "ready_fallback",
      message: `Entendimento operacional confirmado: ${business.description}.`,
    };
  }
  return null;
}
