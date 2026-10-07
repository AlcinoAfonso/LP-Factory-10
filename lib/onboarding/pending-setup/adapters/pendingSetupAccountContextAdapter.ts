import "server-only";
import { createServiceClient } from "@/lib/supabase/service";
import type { PendingSetupAccountContext, PendingSetupMessage } from "../contracts";

// Only the current Pending Setup consumer, without a generic conversation service.
export async function readPendingSetupDialogueContext(input: Readonly<{
  conversationId: string; accountId: string; userId: string;
}>): Promise<Readonly<{ context: PendingSetupAccountContext; messages: readonly PendingSetupMessage[] }> | null> {
  const service = createServiceClient();
  const [dialogue, summary] = await Promise.all([
    service.from("account_dialogues").select("id,account_id,user_id,origin")
      .eq("id", input.conversationId).eq("account_id", input.accountId).eq("user_id", input.userId)
      .eq("origin", "pending_setup").maybeSingle(),
    service.from("account_context_summaries").select("summary,updated_at")
      .eq("account_id", input.accountId).maybeSingle(),
  ]);
  if (dialogue.error || !dialogue.data || summary.error || !summary.data) return null;
  const row = summary.data as { summary: string | null; updated_at: string };
  const messages: PendingSetupMessage[] = [];
  for (let from = 0;; from += 1000) {
    const result = await service.from("account_pending_setup_messages").select("id,ordinal,role,content,created_at")
      .eq("conversation_id", dialogue.data.id).order("ordinal").range(from, from + 999);
    if (result.error || !Array.isArray(result.data)) return null;
    messages.push(...result.data.map(message => ({
      id: message.id, ordinal: Number(message.ordinal), role: message.role as "user" | "assistant",
      content: message.content, createdAt: message.created_at,
    })));
    if (result.data.length < 1000) break;
  }
  return { context: { summary: row.summary, updatedAt: row.updated_at }, messages };
}
