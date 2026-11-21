import "server-only";
import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/service";
import { closeOpenAiNicheDialogueOccurrence } from "../../../openai-costs/recorder";
import { dialogueState, turnText } from "../../niche-agent/runtime";
import type { SynthesisWrite } from "../../niche-agent/dialogue";

export type NicheDialogueIdentity = Readonly<{ accountId: string; userId: string; dialogueId: string }>;

export async function allowsLegacyNicheDialogue(input: NicheDialogueIdentity & {
  expectedVersion: number; requestId?: string;
}) {
  const { data, error } = await createServiceClient().from("account_dialogues").select("version,niche_state")
    .eq("id", input.dialogueId).eq("account_id", input.accountId).eq("user_id", input.userId)
    .eq("origin", "account_niche").maybeSingle();
  if (error) return false;
  if (!data) return input.expectedVersion === 0 && Boolean(input.requestId);
  const state = data.niche_state as { synthesisRequired?: boolean; requestId?: string; confirmedVersion?: number };
  return !state.synthesisRequired && (Number(data.version) === input.expectedVersion ||
    (input.requestId ? state.requestId === input.requestId : state.confirmedVersion === input.expectedVersion));
}
const stateSchema = z.object({ reply: z.string().optional(), understanding: z.string().optional(),
  proposal: z.string().nullable().optional() });
const claimSchema = z.object({ replay: z.boolean(), version: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER),
  state: stateSchema, summary: z.string().max(6000).nullable().optional(), summaryUpdatedAt: z.string().optional(),
  recent: z.array(z.object({ role: z.enum(["user","assistant"]), content: z.string().max(4000) })).optional() });
export async function claimAccountNicheTurn(input: NicheDialogueIdentity & Readonly<{
  expectedVersion: number; requestId: string; turnToken: string; content: string | null; expectedRevision: string | null;
}>) {
  if (!await allowsLegacyNicheDialogue(input)) return { ok: false as const };
  const { data, error } = await createServiceClient().rpc("claim_account_niche_turn_v1", {
    p_dialogue_id: input.dialogueId, p_account_id: input.accountId, p_user_id: input.userId,
    p_expected_version: input.expectedVersion, p_request_id: input.requestId, p_turn_token: input.turnToken,
    p_content: input.content, p_expected_revision: input.expectedRevision,
  });
  const parsed = claimSchema.safeParse(data);
  return !error && parsed.success ? { ok: true as const, value: parsed.data } : { ok: false as const };
}
export async function commitAccountNicheTurn(input: NicheDialogueIdentity & Readonly<{
  expectedVersion: number; turnToken: string; reply: string; understanding: string; proposal: string | null;
  summary: string | null; observedSummary: string | null; observedSummaryUpdatedAt: string;
}>) {
  if (!await allowsLegacyNicheDialogue(input)) return { ok: false as const };
  const { data, error } = await createServiceClient().rpc("commit_account_niche_turn_v1", {
    p_dialogue_id: input.dialogueId, p_account_id: input.accountId, p_user_id: input.userId,
    p_expected_version: input.expectedVersion, p_turn_token: input.turnToken, p_reply: input.reply,
    p_understanding: input.understanding, p_proposal: input.proposal, p_summary: input.summary,
    p_observed_summary: input.observedSummary, p_observed_summary_updated_at: input.observedSummaryUpdatedAt,
  });
  const version = Number(data);
  return !error && Number.isSafeInteger(version) && version > input.expectedVersion
    ? { ok: true as const, version } : { ok: false as const };
}
export async function releaseAccountNicheTurn(input: NicheDialogueIdentity & Readonly<{ expectedVersion: number; turnToken: string }>) {
  const { error } = await createServiceClient().rpc("release_account_niche_turn_v1", {
    p_dialogue_id: input.dialogueId, p_account_id: input.accountId, p_user_id: input.userId,
    p_expected_version: input.expectedVersion, p_turn_token: input.turnToken,
  });
  return !error;
}

const conversationClaim = claimSchema.extend({
  state: dialogueState,
  recent: z.array(turnText).optional(),
});

export async function claimNicheConversation(input: Parameters<typeof claimAccountNicheTurn>[0] & { content: string }) {
  const { data, error } = await createServiceClient().rpc("claim_account_niche_turn_v2", {
    p_dialogue_id: input.dialogueId, p_account_id: input.accountId, p_user_id: input.userId,
    p_expected_version: input.expectedVersion, p_request_id: input.requestId, p_turn_token: input.turnToken,
    p_content: input.content, p_expected_revision: input.expectedRevision,
  });
  const parsed = conversationClaim.safeParse(data);
  return !error && parsed.success ? parsed.data : null;
}

export async function commitNicheConversation(input: Parameters<typeof commitAccountNicheTurn>[0] & {
  acceptedProposal: string | null; keepProposal: boolean; synthesis: SynthesisWrite;
}) {
  const { data, error } = await createServiceClient().rpc("commit_account_niche_turn_v2", {
    p_dialogue_id: input.dialogueId, p_account_id: input.accountId, p_user_id: input.userId,
    p_expected_version: input.expectedVersion, p_turn_token: input.turnToken, p_reply: input.reply,
    p_understanding: input.understanding, p_proposal: input.proposal, p_summary: input.summary,
    p_observed_summary: input.observedSummary, p_observed_summary_updated_at: input.observedSummaryUpdatedAt,
    p_accepted_proposal: input.acceptedProposal, p_keep_proposal: input.keepProposal,
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
