import "server-only";
import { z } from "zod";
import { createServiceClient } from "../../supabase/service";
import type { OpenAiActiveCostReadModel } from "../active-contracts";
import type { OpenAiCostsPeriod } from "../contracts";
import { buildDialogueCostDetail, dialogueIdentitySchema, DIALOGUE_PAGE_SIZE, parseCostDialogue, readDialoguePages,
  translateDialogueLedger, type DialogueCostResult, type DialogueListResult, type OpenAiCostDialogue } from "../dialogue-costs";

const metadataColumns = "id,account_id,origin,started_at,ended_at";
export const executionColumns = "id,workload,environment,execution_origin,universe,attribution_status,account_id,economic_event_kind,economic_event_id,landing_page_id,taxon_id,baseline_reference,baseline_version,started_at,finished_at,result,failure_category";
export const operationColumns = "id,execution_id,sequence,retry_of_operation_id,model,reasoning_effort,configuration_source,configuration_revision,prompt_version,contract_version,started_at,finished_at,result,failure_category,input_tokens,cached_input_tokens,cache_write_tokens,output_tokens,reasoning_tokens,total_tokens,web_search_call_count,web_search_tool_version,web_search_price_per_call_usd::text,pricing_version,pricing_effective_at,pricing_snapshot,cost_status,cost_unavailable_reason,cost_usd::text";

export async function listOpenAiCostDialogues(period: OpenAiCostsPeriod, active: OpenAiActiveCostReadModel | null): Promise<DialogueListResult> {
  try {
    const client = createServiceClient();
    const rows = await readDialoguePages(async after => {
      let query = client.from("account_dialogues").select(metadataColumns)
        .gte("started_at", new Date(period.startTime * 1000).toISOString()).lt("started_at", new Date(period.endTime * 1000).toISOString())
        .order("id").limit(DIALOGUE_PAGE_SIZE);
      if (after) query = query.gt("id", after);
      return await query;
    });
    const dialogues = new Map<string, OpenAiCostDialogue>();
    const add = (raw: unknown) => {
      const value = parseCostDialogue(raw);
      if (!value) throw Error("dialogue_metadata_invalid");
      dialogues.set(value.dialogueId, value);
    };
    rows.forEach(add);
    // Older dialogues with explicitly linked activity in the selected period are also discoverable.
    const candidates = [...new Set((active?.executions ?? []).filter(e => e.universe === "client" && e.economicEvent?.kind === "niche_resolution" &&
      ["pending_setup_conversation", "niche_resolution"].includes(e.workload)).map(e => e.economicEvent!.eventId))];
    for (let offset = 0; offset < candidates.length; offset += 100) {
      const batch = candidates.slice(offset, offset + 100);
      const result = await client.from("account_dialogues").select(metadataColumns).in("id", batch).limit(batch.length + 1);
      if (result.error || !Array.isArray(result.data) || result.data.length > batch.length) throw Error("dialogue_read_failed");
      for (const raw of result.data) {
        const value = parseCostDialogue(raw);
        if (!value || !batch.includes(value.dialogueId) || !(active?.executions ?? []).some(e => e.accountId === value.accountId &&
          e.economicEvent?.kind === "niche_resolution" && e.economicEvent.eventId === value.dialogueId)) throw Error("dialogue_link_invalid");
        add(raw);
      }
    }
    const accountNames = new Map<string, string>();
    const accountIds = [...new Set([...dialogues.values()].map(dialogue => dialogue.accountId))];
    for (let offset = 0; offset < accountIds.length; offset += 100) {
      const batch = accountIds.slice(offset, offset + 100);
      const result = await client.from("accounts").select("id,name").in("id", batch).limit(batch.length + 1);
      if (result.error || !Array.isArray(result.data) || result.data.length > batch.length) throw Error("dialogue_accounts_unavailable");
      for (const raw of result.data) {
        const parsed = z.object({ id: z.uuid(), name: z.string().min(1) }).safeParse(raw);
        if (!parsed.success || !batch.includes(parsed.data.id) || accountNames.has(parsed.data.id)) throw Error("dialogue_account_invalid");
        accountNames.set(parsed.data.id, parsed.data.name);
      }
    }
    const linkedWorkloads = new Map<string, Set<"pending_setup_conversation" | "niche_resolution">>();
    const dialogueIds = [...dialogues.keys()];
    for (let offset = 0; offset < dialogueIds.length; offset += 100) {
      const batch = dialogueIds.slice(offset, offset + 100);
      const batchAccountIds = [...new Set(batch.map(dialogueId => dialogues.get(dialogueId)!.accountId))];
      const links = await readDialoguePages(async after => {
        let query = client.from("openai_cost_executions").select("id,account_id,economic_event_id,workload")
          .eq("economic_event_kind", "niche_resolution").in("economic_event_id", batch).in("account_id", batchAccountIds)
          .in("workload", ["pending_setup_conversation", "niche_resolution"]).order("id").limit(DIALOGUE_PAGE_SIZE);
        if (after) query = query.gt("id", after);
        return await query;
      });
      for (const raw of links) {
        const link = z.object({ economic_event_id: z.uuid(), account_id: z.uuid(), workload: z.enum(["pending_setup_conversation", "niche_resolution"]) }).safeParse(raw);
        if (!link.success || !batch.includes(link.data.economic_event_id)) throw Error("dialogue_workload_invalid");
        const dialogue = dialogues.get(link.data.economic_event_id);
        if (dialogue?.accountId !== link.data.account_id) continue;
        const workloads = linkedWorkloads.get(dialogue.dialogueId) ?? new Set<"pending_setup_conversation" | "niche_resolution">();
        workloads.add(link.data.workload);
        linkedWorkloads.set(dialogue.dialogueId, workloads);
      }
    }
    return { ok: true, dialogues: [...dialogues.values()].map(dialogue => ({ ...dialogue,
      accountName: accountNames.get(dialogue.accountId) ?? null, workloads: [...(linkedWorkloads.get(dialogue.dialogueId) ?? [])].sort(),
    })).sort((a,b) => b.startedAt.localeCompare(a.startedAt) || a.dialogueId.localeCompare(b.dialogueId)) };
  } catch { return { ok: false, code: "DIALOGUE_LIST_UNAVAILABLE" }; }
}

export async function readOpenAiDialogueCost(raw: unknown): Promise<DialogueCostResult> {
  const parsed = dialogueIdentitySchema.safeParse(raw);
  if (!parsed.success) return { ok: false, code: "INVALID_DIALOGUE" };
  const { dialogueId, accountId } = parsed.data;
  try {
    const client = createServiceClient();
    const readMetadata = () => client.from("account_dialogues").select(metadataColumns).eq("id", dialogueId).eq("account_id", accountId).limit(2);
    const before = await readMetadata();
    if (before.error || !Array.isArray(before.data) || before.data.length !== 1) throw Error("dialogue_read_failed");
    const dialogue = parseCostDialogue(before.data[0]);
    if (!dialogue || dialogue.dialogueId !== dialogueId || dialogue.accountId !== accountId) throw Error("dialogue_link_invalid");
    // No period restriction: these are the full lifetime facts of this exact canonical dialogue and account.
    const executions = await readDialoguePages(async after => {
      let query = client.from("openai_cost_executions").select(executionColumns)
        .eq("economic_event_kind", "niche_resolution").eq("economic_event_id", dialogueId).eq("account_id", accountId)
        .in("workload", ["pending_setup_conversation", "niche_resolution"]).order("id").limit(DIALOGUE_PAGE_SIZE);
      if (after) query = query.gt("id", after);
      return await query;
    });
    const operations: Record<string, unknown>[] = [];
    for (let offset = 0; offset < executions.length; offset += 100) {
      const batch = executions.slice(offset, offset + 100).map(e => e.id as string);
      operations.push(...await readDialoguePages(async after => {
        let query = client.from("openai_cost_operations").select(operationColumns).in("execution_id", batch).order("id").limit(DIALOGUE_PAGE_SIZE);
        if (after) query = query.gt("id", after);
        return await query;
      }));
    }
    const model = translateDialogueLedger(executions, operations);
    const after = await readMetadata();
    if (after.error || !Array.isArray(after.data) || after.data.length !== 1 || JSON.stringify(parseCostDialogue(after.data[0])) !== JSON.stringify(dialogue))
      throw Error("dialogue_changed_during_read");
    return { ok: true, value: buildDialogueCostDetail(dialogue, model) };
  } catch { return { ok: false, code: "DIALOGUE_COST_UNAVAILABLE" }; }
}
