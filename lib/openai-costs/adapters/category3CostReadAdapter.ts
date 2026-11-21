import "server-only";

import { createServiceClient } from "../../supabase/service";
import { buildCategory3CostDetail, category3CostIdentitySchema, category3SavedEvent, category3SavedEvidenceSchema, category3SavedTable,
  type Category3CostIdentity, type Category3CostResult } from "../category-3-costs";
import { DIALOGUE_PAGE_SIZE, readDialoguePages, translateDialogueLedger } from "../dialogue-costs";
import { executionColumns, operationColumns } from "./dialogueCostReadAdapter";

export async function readCategory3Cost(input: Category3CostIdentity | string): Promise<Category3CostResult> {
  try {
    const client = createServiceClient();
    const saved = await readSavedEvidence(client, typeof input === "string" ? input : input.generationId);
    const identity = typeof input === "string" ? saved?.identity : input;
    if (!identity) return { ok: false };
    const { generationId, accountId, environment } = identity;
    const evidence = saved?.identity.accountId === accountId && saved.identity.environment === environment ? saved.evidence : null;
    const executions = await readDialoguePages(async after => {
      const page = client.from("openai_cost_executions").select(executionColumns)
        .eq("economic_event_kind", "category_3_generation").eq("economic_event_id", generationId)
        .eq("account_id", accountId).eq("environment", environment).eq("execution_origin", "runtime")
        .eq("workload", "communication_base_stage2_intelligence").order("id").limit(DIALOGUE_PAGE_SIZE);
      return await (after ? page.gt("id", after) : page);
    });
    if (!executions.length && !evidence) return { ok: false };
    const operations: Record<string, unknown>[] = [];
    for (let offset = 0; offset < executions.length; offset += 100) {
      const ids = executions.slice(offset, offset + 100).map(row => row.id as string);
      operations.push(...await readDialoguePages(async after => {
        const page = client.from("openai_cost_operations").select(operationColumns).in("execution_id", ids).order("id").limit(DIALOGUE_PAGE_SIZE);
        return await (after ? page.gt("id", after) : page);
      }));
    }
    return { ok: true, value: buildCategory3CostDetail(identity, translateDialogueLedger(executions, operations), evidence) };
  } catch {
    return { ok: false };
  }
}

async function readSavedEvidence(client: ReturnType<typeof createServiceClient>, generationId: string) {
  try {
    const { data, error } = await client.from("audit_logs").select("account_id,record_id,changes_json")
      .eq("id", generationId).eq("table_name", category3SavedTable)
      .eq("action", "update").eq("event", category3SavedEvent).limit(1);
    const row = data?.[0];
    if (error || !row || row.account_id !== row.record_id) return null;
    const evidence = category3SavedEvidenceSchema.safeParse(row.changes_json);
    if (!evidence.success) return null;
    const identity = category3CostIdentitySchema.safeParse({ generationId, accountId: row.account_id, environment: evidence.data.environment });
    return identity.success ? { identity: identity.data, evidence: evidence.data } : null;
  } catch {
    return null;
  }
}
