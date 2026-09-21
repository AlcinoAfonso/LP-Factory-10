import "server-only";

import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import type {
  PendingSetupConversation,
  PendingSetupConfirmationKind,
  PendingSetupMessage,
  PendingSetupOpenAiCallClaimResult,
  PendingSetupResolutionOutcome,
  PendingSetupStage,
  PendingSetupWriteResult,
} from "../contracts";
import { resolvePreferredNameFromAuth } from "../policy";

type ConversationRow = {
  id: string;
  account_id: string;
  user_id: string;
  preferred_name: string | null;
  business_context_text: string | null;
  stage: PendingSetupStage;
  confirmation_kind: PendingSetupConfirmationKind | null;
  resolution_outcome: PendingSetupResolutionOutcome | null;
  openai_call_count: number;
  version: number | string;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
};

type MessageRow = {
  id: string;
  ordinal: number;
  role: "user" | "assistant";
  content: string;
  created_at: string;
};

function mapMessage(row: MessageRow): PendingSetupMessage {
  return {
    id: row.id,
    ordinal: Number(row.ordinal),
    role: row.role,
    content: row.content,
    createdAt: row.created_at,
  };
}

function mapConversation(
  row: ConversationRow,
  messages: readonly MessageRow[],
): PendingSetupConversation {
  return {
    id: row.id,
    accountId: row.account_id,
    userId: row.user_id,
    preferredName: row.preferred_name,
    businessContextText: row.business_context_text,
    stage: row.stage,
    confirmationKind: row.confirmation_kind,
    resolutionOutcome: row.resolution_outcome,
    openAiCallCount: Number(row.openai_call_count),
    version: Number(row.version),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    completedAt: row.completed_at,
    messages: messages.map(mapMessage),
  };
}

function writeFailure(error: unknown): PendingSetupWriteResult {
  const code = String((error as { code?: unknown } | null)?.code ?? "");
  const message = String((error as { message?: unknown } | null)?.message ?? "");
  if (
    code === "40001"
    || message.includes("version_conflict")
    || message.includes("stage_not_claimable")
  ) {
    return { ok: false, reason: "conflict" };
  }
  if (code === "42501" || message.includes("actor_not_allowed")) {
    return { ok: false, reason: "forbidden" };
  }
  if (code === "22023" || code === "23514") {
    return { ok: false, reason: "invalid" };
  }
  return { ok: false, reason: "write_failed" };
}

export async function loadPendingSetupConversation(input: {
  accountId: string;
  userId: string;
}): Promise<PendingSetupConversation | null> {
  const authClient = await createClient();
  const {
    data: { user },
  } = await authClient.auth.getUser();
  if (!user?.id || user.id !== input.userId) return null;

  const preferredName = resolvePreferredNameFromAuth(user.user_metadata, user.email);
  const service = createServiceClient();
  const { data: conversationId, error: startError } = await service.rpc(
    "start_account_pending_setup_v1",
    {
      p_account_id: input.accountId,
      p_user_id: input.userId,
      p_preferred_name: preferredName,
    },
  );

  if (startError || typeof conversationId !== "string") {
    console.error("pendingSetupConversation start failed", {
      code: (startError as { code?: unknown } | null)?.code ?? "invalid_response",
    });
    return null;
  }

  const [{ data: conversation, error: conversationError }, { data: messages, error: messagesError }] =
    await Promise.all([
      service
        .from("account_pending_setup_conversations")
        .select(
          "id,account_id,user_id,preferred_name,business_context_text,stage,confirmation_kind,resolution_outcome,openai_call_count,version,created_at,updated_at,completed_at",
        )
        .eq("id", conversationId)
        .eq("account_id", input.accountId)
        .eq("user_id", input.userId)
        .maybeSingle(),
      service
        .from("account_pending_setup_messages")
        .select("id,ordinal,role,content,created_at")
        .eq("conversation_id", conversationId)
        .order("ordinal", { ascending: true }),
    ]);

  if (conversationError || messagesError || !conversation) {
    console.error("pendingSetupConversation read failed", {
      conversation_code: (conversationError as { code?: unknown } | null)?.code ?? null,
      messages_code: (messagesError as { code?: unknown } | null)?.code ?? null,
    });
    return null;
  }

  return mapConversation(
    conversation as ConversationRow,
    ((messages ?? []) as MessageRow[]),
  );
}

export async function setPendingSetupPreferredName(input: {
  conversationId: string;
  accountId: string;
  userId: string;
  preferredName: string | null;
  expectedVersion: number;
}): Promise<PendingSetupWriteResult> {
  const service = createServiceClient();
  const { data, error } = await service.rpc("set_account_pending_setup_preferred_name_v1", {
    p_conversation_id: input.conversationId,
    p_account_id: input.accountId,
    p_user_id: input.userId,
    p_preferred_name: input.preferredName,
    p_expected_version: input.expectedVersion,
  });

  if (error) return writeFailure(error);
  const version = Number(data);
  return Number.isSafeInteger(version) && version >= 1
    ? { ok: true, version }
    : { ok: false, reason: "write_failed" };
}

export async function appendPendingSetupTurn(input: {
  conversationId: string;
  accountId: string;
  userId: string;
  expectedVersion: number;
  turnToken: string;
  userContent: string;
  assistantContent: string;
  nextStage: Exclude<PendingSetupStage, "identity" | "completed">;
  confirmationKind: PendingSetupConfirmationKind | null;
  businessContextText: string;
}): Promise<PendingSetupWriteResult> {
  const service = createServiceClient();
  const { data, error } = await service.rpc("append_account_pending_setup_turn_v1", {
    p_conversation_id: input.conversationId,
    p_account_id: input.accountId,
    p_user_id: input.userId,
    p_expected_version: input.expectedVersion,
    p_turn_token: input.turnToken,
    p_user_content: input.userContent,
    p_assistant_content: input.assistantContent,
    p_next_stage: input.nextStage,
    p_confirmation_kind: input.confirmationKind,
    p_business_context_text: input.businessContextText,
  });

  if (error) return writeFailure(error);
  const version = Number(data);
  return Number.isSafeInteger(version) && version >= 1
    ? { ok: true, version }
    : { ok: false, reason: "write_failed" };
}

export async function claimPendingSetupTurn(input: {
  conversationId: string;
  accountId: string;
  userId: string;
  expectedVersion: number;
  turnToken: string;
}): Promise<PendingSetupWriteResult> {
  const service = createServiceClient();
  const { data, error } = await service.rpc("claim_account_pending_setup_turn_v1", {
    p_conversation_id: input.conversationId,
    p_account_id: input.accountId,
    p_user_id: input.userId,
    p_expected_version: input.expectedVersion,
    p_turn_token: input.turnToken,
  });

  if (error) return writeFailure(error);
  const version = Number(data);
  return Number.isSafeInteger(version) && version >= 1
    ? { ok: true, version }
    : { ok: false, reason: "write_failed" };
}

export async function claimPendingSetupOpenAiCall(input: {
  conversationId: string;
  accountId: string;
  userId: string;
  expectedVersion: number;
  turnToken: string;
}): Promise<PendingSetupOpenAiCallClaimResult> {
  const service = createServiceClient();
  const { data, error } = await service.rpc("claim_account_pending_setup_openai_call_v1", {
    p_conversation_id: input.conversationId,
    p_account_id: input.accountId,
    p_user_id: input.userId,
    p_expected_version: input.expectedVersion,
    p_turn_token: input.turnToken,
  });

  if (error) {
    const message = String((error as { message?: unknown } | null)?.message ?? "");
    if (message.includes("pending_setup_openai_call_limit_reached")) {
      return { ok: false, reason: "limit_reached" };
    }
    const failure = writeFailure(error);
    return !failure.ok
      ? {
          ok: false,
          reason: failure.reason === "not_found" ? "write_failed" : failure.reason,
        }
      : { ok: false, reason: "write_failed" };
  }

  const count = Number(data);
  return Number.isSafeInteger(count) && count >= 1 && count <= 3
    ? { ok: true, count }
    : { ok: false, reason: "write_failed" };
}

export async function completePendingSetup(input: {
  conversationId: string;
  accountId: string;
  userId: string;
  expectedVersion: number;
  resolutionOutcome: PendingSetupResolutionOutcome;
}): Promise<PendingSetupWriteResult> {
  const service = createServiceClient();
  const { data, error } = await service.rpc("complete_account_pending_setup_v1", {
    p_conversation_id: input.conversationId,
    p_account_id: input.accountId,
    p_user_id: input.userId,
    p_expected_version: input.expectedVersion,
    p_resolution_outcome: input.resolutionOutcome,
  });

  if (error) return writeFailure(error);
  return data === true
    ? { ok: true, version: input.expectedVersion + 1 }
    : { ok: false, reason: "write_failed" };
}
