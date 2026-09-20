import type {
  PendingSetupBusinessSnapshot,
  PendingSetupConversationProductState,
  PendingSetupConversationTurn,
} from "./contracts";
import { presentPendingSetupBusinessTurn } from "./contracts";

export type PendingSetupTurnCorrelation = Pick<
  PendingSetupConversationTurn,
  "id" | "status" | "turnKind" | "userMessage"
>;

type CompleteTurn = (input: {
  state: PendingSetupConversationProductState;
  message: string;
}) => Promise<boolean | "saved" | "lease_lost" | "turn_not_current" | "failed">;

export async function reconcilePendingSetupTurnRetry(
  turn: PendingSetupTurnCorrelation,
  business: PendingSetupBusinessSnapshot,
  complete: CompleteTurn,
): Promise<
  "completed" | "not_ready" | "persist_failed" | "lease_lost" | "turn_not_current"
> {
  if (!canReconcilePendingSetupTurn(turn, business)) return "not_ready";
  const presentation = presentPendingSetupBusinessTurn(business);
  if (!presentation) return "not_ready";
  const result = await complete(presentation);
  if (result === "lease_lost" || result === "turn_not_current") return result;
  return result === true || result === "saved" ? "completed" : "persist_failed";
}

export function selectPendingSetupCompletionRetryTurn(
  turns: PendingSetupConversationTurn[],
  business: PendingSetupBusinessSnapshot,
): PendingSetupConversationTurn | null {
  const latest = turns.at(-1);
  if (!latest || latest.status === "completed") return null;
  return canReconcilePendingSetupTurn(latest, business) ? latest : null;
}

export function canReconcilePendingSetupTurn(
  turn: PendingSetupTurnCorrelation,
  business: PendingSetupBusinessSnapshot,
): boolean {
  if (turn.status === "completed" || business.kind === "awaiting_business") return false;

  if (turn.turnKind === "fallback_confirmation") {
    return business.kind === "ready_fallback" && valuesMatch(turn.userMessage, business.description);
  }
  if (turn.turnKind === "official_confirmation") {
    return business.kind === "ready_official" && valuesMatch(turn.userMessage, business.taxonName);
  }
  if (turn.turnKind === "operational_confirmation") {
    return business.kind === "ready_fallback" && valuesMatch(turn.userMessage, business.description);
  }
  if (business.kind === "ready_official") {
    return descriptionMatchesTurn(turn, business.rawInput);
  }
  if (business.kind === "ready_fallback") return false;
  if (business.kind !== "awaiting_confirmation") return false;
  return descriptionMatchesTurn(turn, business.resolution.rawInput);
}

function descriptionMatchesTurn(turn: PendingSetupTurnCorrelation, rawInput: string): boolean {
  const persistedInput = normalizeComparable(rawInput);
  const turnInput = normalizeComparable(turn.userMessage);
  if (turn.turnKind === "business_description") return persistedInput === turnInput;
  return persistedInput === turnInput || persistedInput.endsWith(`. ${turnInput}`);
}

function valuesMatch(left: string, right: string): boolean {
  return normalizeComparable(left) === normalizeComparable(right);
}

function normalizeComparable(value: string): string {
  return value.trim().replace(/\s+/g, " ").toLocaleLowerCase("pt-BR");
}
