import "server-only";
import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/service";

export type NicheDialogueIdentity = Readonly<{ accountId: string; userId: string; dialogueId: string }>;
const stateSchema = z.object({ reply: z.string().optional(), understanding: z.string().optional(),
  proposal: z.string().nullable().optional() });
const claimSchema = z.object({ replay: z.boolean(), version: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER),
  state: stateSchema, summary: z.string().max(6000).nullable().optional(), summaryUpdatedAt: z.string().optional(),
  recent: z.array(z.object({ role: z.enum(["user","assistant"]), content: z.string().max(4000) })).optional() });
export async function claimAccountNicheTurn(input: NicheDialogueIdentity & Readonly<{
  expectedVersion: number; requestId: string; turnToken: string; content: string | null; expectedRevision: string | null;
}>) {
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
