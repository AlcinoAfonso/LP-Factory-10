import "server-only";
import { createServiceClient } from "@/lib/supabase/service";
import type { PendingSetupConversation, PendingSetupWriteResult } from "../contracts";
import type { AttendanceOutput, AttendanceProposal } from "../attendance-core";

export type AttendanceTurnIdentity = Readonly<{
  conversationId: string; accountId: string; userId: string; expectedVersion: number; turnToken: string;
}>;
export async function readAttendancePrimary(accountId: string): Promise<string | null | undefined> {
  const { data, error } = await createServiceClient().from("account_taxonomy").select("taxon_id")
    .eq("account_id", accountId).eq("is_primary", true).eq("status", "active").maybeSingle();
  return error ? undefined : (data as { taxon_id: string } | null)?.taxon_id ?? null;
}

function identity(input: AttendanceTurnIdentity) {
  return { p_conversation_id: input.conversationId, p_account_id: input.accountId, p_user_id: input.userId,
    p_expected_version: input.expectedVersion, p_turn_token: input.turnToken };
}
function result(data: unknown, error: unknown): PendingSetupWriteResult | Readonly<{ ok: false; reason: "primary_conflict" }> {
  if (error) {
    const code = String((error as { code?: unknown }).code ?? "");
    if (String((error as { message?: unknown }).message ?? "").includes("pending_setup_primary_conflict"))
      return { ok: false, reason: "primary_conflict" };
    return { ok: false, reason: code === "40001" ? "conflict" : code === "42501" ? "forbidden"
      : ["22023", "23514", "23505"].includes(code) ? "invalid" : "write_failed" };
  }
  const version = Number(data);
  return Number.isSafeInteger(version) && version > 0 ? { ok: true, version } : { ok: false, reason: "write_failed" };
}
export async function claimAttendanceTurn(input: AttendanceTurnIdentity & Readonly<{
  content: string | null; intent: "initialize" | "message" | "confirm" | "clarify";
}>) {
  const { data, error } = await createServiceClient().rpc("claim_account_pending_setup_turn_v2",
    { ...identity(input), p_user_content: input.content, p_intent: input.intent });
  return result(data, error);
}
export async function commitAttendanceTurn(input: AttendanceTurnIdentity & Readonly<{
  output: AttendanceOutput; proposal: AttendanceProposal | null; confirm: boolean;
  observedPrimaryTaxonId: string | null; summary: string;
}>) {
  const stage: PendingSetupConversation["stage"] = input.proposal ? "niche_confirmation"
    : input.output.readyToComplete ? "ready_to_complete"
    : input.output.preferredName || input.output.preferredNameDeclined || input.output.businessUnderstanding ? "business_understanding" : "identity";
  const { data, error } = await createServiceClient().rpc("commit_account_pending_setup_turn_v3", {
    ...identity(input), p_assistant_content: input.output.reply,
    p_summary: input.summary, p_business_understanding: input.output.businessUnderstanding,
    p_preferred_name: input.output.preferredName, p_preferred_name_declined: input.output.preferredNameDeclined, p_next_stage: stage,
    p_proposal: input.proposal, p_confirm: input.confirm, p_observed_primary_taxon_id: input.observedPrimaryTaxonId,
  });
  return result(data, error);
}
export async function releaseAttendanceTurn(input: AttendanceTurnIdentity) {
  const { data, error } = await createServiceClient().rpc("release_account_pending_setup_turn_v2", identity(input));
  return result(data, error);
}

export async function discardAttendanceProposal(input: AttendanceTurnIdentity) {
  const { data, error } = await createServiceClient().rpc("discard_account_pending_setup_proposal_v2", identity(input));
  return result(data, error);
}
