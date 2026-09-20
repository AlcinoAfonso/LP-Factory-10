import "server-only";

import { createServiceClient } from "@/lib/supabase/service";
import type {
  PendingSetupConversationProductState,
  PendingSetupConversationTurn,
  PendingSetupConversationTurnKind,
} from "../contracts";

type BeginTurnResult =
  | { ok: true; status: "created" | "resumed" | "completed" | "in_progress" }
  | { ok: false; reason: string };

type CompleteTurnInput = {
  accountId: string;
  turnId: string;
  status: "completed" | "failed";
  productState: PendingSetupConversationProductState;
  productMessage: string;
  failureCode: string | null;
};

const TURN_KINDS = new Set<PendingSetupConversationTurnKind>([
  "business_description",
  "clarification",
  "official_confirmation",
  "operational_confirmation",
  "fallback_confirmation",
]);
const TURN_STATUSES = new Set(["pending", "completed", "failed"] as const);
const PRODUCT_STATES = new Set<PendingSetupConversationProductState>([
  "awaiting_confirmation",
  "ready_official",
  "ready_fallback",
  "failure",
]);

export async function beginPendingSetupConversationTurn(input: {
  accountId: string;
  ownerUserId: string;
  turnId: string;
  userMessage: string;
  turnKind: PendingSetupConversationTurnKind;
}): Promise<BeginTurnResult> {
  const supabase = createServiceClient();
  try {
    const { data, error } = await supabase.rpc("begin_pending_setup_conversation_turn", {
      p_account_id: input.accountId,
      p_owner_user_id: input.ownerUserId,
      p_turn_id: input.turnId,
      p_user_message: input.userMessage,
      p_turn_kind: input.turnKind,
    });
    if (error) return { ok: false, reason: "turn_start_failed" };
    if (
      data === "created" ||
      data === "resumed" ||
      data === "completed" ||
      data === "in_progress"
    ) {
      return { ok: true, status: data };
    }
    return { ok: false, reason: typeof data === "string" ? data : "turn_start_failed" };
  } catch {
    return { ok: false, reason: "turn_start_failed" };
  }
}

export async function completePendingSetupConversationTurn(
  input: CompleteTurnInput,
): Promise<boolean> {
  const supabase = createServiceClient();
  try {
    const { data, error } = await supabase.rpc("complete_pending_setup_conversation_turn", {
      p_account_id: input.accountId,
      p_turn_id: input.turnId,
      p_status: input.status,
      p_product_state: input.productState,
      p_product_message: input.productMessage,
      p_failure_code: input.failureCode,
    });
    return !error && data === "saved";
  } catch {
    return false;
  }
}

export async function readPendingSetupConversationHistory(input: {
  accountId: string;
  ownerUserId: string;
}): Promise<PendingSetupConversationTurn[]> {
  const supabase = createServiceClient();
  const { data: conversation, error: conversationError } = await supabase
    .from("pending_setup_conversations")
    .select("owner_user_id")
    .eq("account_id", input.accountId)
    .limit(1)
    .maybeSingle();
  if (conversationError) throw new Error("pending_setup_conversation_lookup_failed");
  if (!conversation) return [];
  if ((conversation as { owner_user_id?: string }).owner_user_id !== input.ownerUserId) {
    throw new Error("pending_setup_conversation_owner_mismatch");
  }

  const { data, error } = await supabase
    .from("pending_setup_conversation_turns")
    .select("id,user_message,turn_kind,status,product_state,product_message,created_at,completed_at")
    .eq("account_id", input.accountId)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(20);
  if (error) throw new Error("pending_setup_conversation_turns_lookup_failed");

  const turns = (data ?? []).map(parseTurn);
  if (turns.some((turn) => turn === null)) {
    throw new Error("pending_setup_conversation_turn_invalid");
  }
  return (turns as PendingSetupConversationTurn[]).reverse();
}

export async function readPendingSetupConversationTurn(input: {
  accountId: string;
  ownerUserId: string;
  turnId: string;
}): Promise<PendingSetupConversationTurn | null> {
  const supabase = createServiceClient();
  const { data: conversation, error: conversationError } = await supabase
    .from("pending_setup_conversations")
    .select("owner_user_id")
    .eq("account_id", input.accountId)
    .limit(1)
    .maybeSingle();
  if (conversationError) throw new Error("pending_setup_conversation_lookup_failed");
  if (!conversation) return null;
  if ((conversation as { owner_user_id?: string }).owner_user_id !== input.ownerUserId) {
    throw new Error("pending_setup_conversation_owner_mismatch");
  }

  const { data, error } = await supabase
    .from("pending_setup_conversation_turns")
    .select("id,user_message,turn_kind,status,product_state,product_message,created_at,completed_at")
    .eq("account_id", input.accountId)
    .eq("id", input.turnId)
    .limit(1)
    .maybeSingle();
  if (error) throw new Error("pending_setup_conversation_turn_lookup_failed");
  if (!data) return null;
  const turn = parseTurn(data);
  if (!turn) throw new Error("pending_setup_conversation_turn_invalid");
  return turn;
}

function parseTurn(value: unknown): PendingSetupConversationTurn | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Record<string, unknown>;
  if (
    typeof row.id !== "string" ||
    typeof row.user_message !== "string" ||
    typeof row.turn_kind !== "string" ||
    !TURN_KINDS.has(row.turn_kind as PendingSetupConversationTurnKind) ||
    typeof row.status !== "string" ||
    !TURN_STATUSES.has(row.status as "pending" | "completed" | "failed") ||
    typeof row.created_at !== "string"
  ) {
    return null;
  }
  const productState = row.product_state;
  if (
    productState !== null &&
    (typeof productState !== "string" ||
      !PRODUCT_STATES.has(productState as PendingSetupConversationProductState))
  ) {
    return null;
  }
  if (row.product_message !== null && typeof row.product_message !== "string") return null;
  if (row.completed_at !== null && typeof row.completed_at !== "string") return null;

  return {
    id: row.id,
    userMessage: row.user_message,
    turnKind: row.turn_kind as PendingSetupConversationTurnKind,
    status: row.status as PendingSetupConversationTurn["status"],
    productState: productState as PendingSetupConversationProductState | null,
    productMessage: row.product_message as string | null,
    createdAt: row.created_at,
    completedAt: row.completed_at as string | null,
  };
}
