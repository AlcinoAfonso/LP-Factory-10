import "server-only";
import { createServiceClient } from "@/lib/supabase/service";
import type { PendingSetupConversation, PendingSetupWriteResult } from "../contracts";
import type { AttendanceOutput, AttendanceProposal, AttendanceTaxon } from "../attendance-core";

export type AttendanceTurnIdentity = Readonly<{
  conversationId: string; accountId: string; userId: string; expectedVersion: number; turnToken: string;
}>;
type CatalogRow = { id: string; name: string; level: AttendanceTaxon["level"]; parent_id: string | null; is_active: boolean };
type AliasRow = { id: string; taxon_id: string; alias_text: string; is_active: boolean };

export async function readAttendanceCatalog(): Promise<readonly AttendanceTaxon[] | null> {
  const service = createServiceClient();
  const taxons: CatalogRow[] = [];
  const aliases: AliasRow[] = [];
  // Stable ordered complete pages. Inactive records stay visible to prevent duplicate workarounds.
  for (let from = 0;; from += 1000) {
    const { data, error } = await service.from("business_taxons").select("id,name,level,parent_id,is_active")
      .order("id").range(from, from + 999);
    if (error || !Array.isArray(data)) return null;
    taxons.push(...data as CatalogRow[]);
    if (data.length < 1000) break;
  }
  for (let from = 0;; from += 1000) {
    const { data, error } = await service.from("business_taxon_aliases").select("id,taxon_id,alias_text,is_active")
      .order("id").range(from, from + 999);
    if (error || !Array.isArray(data)) return null;
    aliases.push(...data as AliasRow[]);
    if (data.length < 1000) break;
  }
  const catalog = taxons.map(row => ({
    id: row.id, name: row.name, level: row.level, parentId: row.parent_id, active: row.is_active,
    aliases: aliases.filter(alias => alias.taxon_id === row.id).map(alias => alias.alias_text),
  }));
  // A partial catalog must never authorize Web research or a new category.
  return JSON.stringify(catalog).length <= 80_000 ? catalog : null;
}

function identity(input: AttendanceTurnIdentity) {
  return { p_conversation_id: input.conversationId, p_account_id: input.accountId, p_user_id: input.userId,
    p_expected_version: input.expectedVersion, p_turn_token: input.turnToken };
}
function result(data: unknown, error: unknown): PendingSetupWriteResult {
  if (error) {
    const code = String((error as { code?: unknown }).code ?? "");
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
}>) {
  const stage: PendingSetupConversation["stage"] = input.confirm || input.output.action === "existing"
    ? "ready_to_complete" : input.proposal ? "niche_confirmation"
    : input.output.preferredName || input.output.preferredNameDeclined || input.output.summary ? "business_understanding" : "identity";
  const { data, error } = await createServiceClient().rpc("commit_account_pending_setup_turn_v2", {
    ...identity(input), p_assistant_content: input.output.reply, p_summary: input.output.summary,
    p_preferred_name: input.output.preferredName, p_preferred_name_declined: input.output.preferredNameDeclined, p_next_stage: stage,
    p_proposal: input.proposal, p_confirm: input.confirm,
  });
  return result(data, error);
}
export async function releaseAttendanceTurn(input: AttendanceTurnIdentity) {
  const { data, error } = await createServiceClient().rpc("release_account_pending_setup_turn_v2", identity(input));
  return result(data, error);
}

