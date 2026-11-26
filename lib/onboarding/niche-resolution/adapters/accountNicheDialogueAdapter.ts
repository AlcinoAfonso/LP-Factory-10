import "server-only";
import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/service";
import { createClient } from "@/lib/supabase/server";
import { resolvePreferredNameFromAuth, validatePreferredName } from "../../pending-setup/policy";
import { closeOpenAiNicheDialogueOccurrence } from "../../../openai-costs/recorder";
import { dialogueState, turnText } from "../../niche-agent/runtime";
import type { SynthesisWrite } from "../../niche-agent/dialogue";

export type NicheDialogueIdentity = Readonly<{ accountId: string; userId: string; dialogueId: string }>;

type TurnFence = NicheDialogueIdentity & Readonly<{ expectedVersion: number; turnToken: string }>;

const conversationClaim = z.object({
  replay: z.boolean(),
  version: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER),
  state: dialogueState,
  summary: z.string().max(6000).nullable().optional(),
  summaryUpdatedAt: z.string().optional(),
});

export async function releaseAccountNicheTurn(input: TurnFence) {
  const { error } = await createServiceClient().rpc("release_account_niche_turn_v1", {
    p_dialogue_id: input.dialogueId, p_account_id: input.accountId, p_user_id: input.userId,
    p_expected_version: input.expectedVersion, p_turn_token: input.turnToken,
  });
  return !error;
}

export async function claimNicheConversation(input: TurnFence & { requestId: string; content: string; expectedRevision: string | null }) {
  const { data, error } = await createServiceClient().rpc("claim_account_niche_turn_v2", {
    p_dialogue_id: input.dialogueId, p_account_id: input.accountId, p_user_id: input.userId,
    p_expected_version: input.expectedVersion, p_request_id: input.requestId, p_turn_token: input.turnToken,
    p_content: input.content, p_expected_revision: input.expectedRevision,
  });
  const parsed = conversationClaim.safeParse(data);
  return !error && parsed.success ? parsed.data : null;
}

export async function commitNicheConversation(input: TurnFence & {
  reply: string; proposal: string | null; summary: string | null; observedSummary: string | null;
  observedSummaryUpdatedAt: string; acceptedProposal: string | null; keepProposal?: boolean; synthesis: SynthesisWrite;
}) {
  const { data, error } = await createServiceClient().rpc("commit_account_niche_turn_v2", {
    p_dialogue_id: input.dialogueId, p_account_id: input.accountId, p_user_id: input.userId,
    p_expected_version: input.expectedVersion, p_turn_token: input.turnToken, p_reply: input.reply,
    p_understanding: "", p_proposal: input.proposal, p_summary: input.summary,
    p_observed_summary: input.observedSummary, p_observed_summary_updated_at: input.observedSummaryUpdatedAt,
    p_accepted_proposal: input.acceptedProposal, p_keep_proposal: input.keepProposal ?? false,
    p_synthesis: input.synthesis,
  });
  if (!error && data?.confirmed === true) {
    await closeOpenAiNicheDialogueOccurrence(input.accountId, input.dialogueId);
  }
  return !error;
}

export async function readNicheConversation(accountId: string, userId: string) {
  const service = createServiceClient();
  const { data, error } = await service.from("account_dialogues").select("id,version,niche_state,ended_at")
    .eq("account_id", accountId).eq("user_id", userId).eq("origin", "account_niche")
    .order("ended_at", { ascending: false, nullsFirst: true }).order("started_at", { ascending: false })
    .limit(1).maybeSingle();
  if (error) return { ok: false as const };
  if (!data) return { ok: true as const, dialogue: null };
  const state = dialogueState.safeParse(data.niche_state);
  const version = Number(data.version);
  if (!state.success || !Number.isSafeInteger(version)) return { ok: false as const };
  const messages = await readNicheDialogueMessages(data.id);
  if (!messages) return { ok: false as const };
  return { ok: true as const, dialogue: { id: data.id as string, version,
    messages, ended: Boolean(data.ended_at),
    retry: state.data.requestId !== state.data.lastRequestId
      ? messages.find(message => message.id === state.data.requestId && message.role === "user") ?? null : null } };
}

// Called only after the server reads or reserves this participant's dialogue.
export async function readNicheDialogueMessages(dialogueId: string) {
  const service = createServiceClient();
  const messages: Array<z.output<typeof turnText> & { id: string }> = [];
  for (let from = 0;; from += 1000) {
    const result = await service.from("account_pending_setup_messages").select("id,role,content")
      .eq("dialogue_id", dialogueId).order("ordinal").range(from, from + 999);
    const batch = z.array(turnText.extend({ id: z.uuid() })).safeParse(result.data);
    if (result.error || !batch.success) return null;
    messages.push(...batch.data);
    if (batch.data.length < 1000) break;
  }
  return messages;
}

export async function readNicheInterlocutorName(accountId: string, userId: string): Promise<string | null> {
  try {
    const [auth, stored] = await Promise.all([
      createClient().then(client => client.auth.getUser()),
      createServiceClient().from("account_pending_setup_conversations")
        .select("preferred_name,preferred_name_declined")
        .eq("account_id", accountId).eq("user_id", userId).eq("stage", "completed").maybeSingle(),
    ]);
    const user = auth.data.user;
    if (auth.error || !user || user.id !== userId || stored.error || stored.data?.preferred_name_declined) return null;
    const preferred = validatePreferredName(stored.data?.preferred_name, user.email);
    return preferred.ok ? preferred.value : resolvePreferredNameFromAuth(user.user_metadata, user.email);
  } catch { return null; }
}
