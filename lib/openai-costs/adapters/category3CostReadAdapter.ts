import "server-only";

import { z } from "zod";
import type { OpenAiCostsPeriod } from "../contracts";
import type { OpenAiActiveCostReadModel } from "../active-contracts";
import { createServiceClient } from "../../supabase/service";
import { CATEGORY_3_AUDIT_ENTITY, CATEGORY_3_ATTEMPT_EVENT } from "../../communication-base/agent-base/generation-evidence";
import { buildCategory3CostDetail, type Category3CostIdentity, type Category3CostResult, type Category3ObservedStart } from "../category-3-costs";
import { DIALOGUE_PAGE_SIZE, readDialoguePages, translateDialogueLedger } from "../dialogue-costs";
import { executionColumns, operationColumns } from "./dialogueCostReadAdapter";

const observedAttempt = z.object({
  record_id: z.uuid(), account_id: z.uuid(), created_at: z.iso.datetime({ offset: true }),
  changes_json: z.object({ environment: z.enum(["preview", "production"]) }),
});

export async function readCategory3ObservedStarts(period: OpenAiCostsPeriod, active: OpenAiActiveCostReadModel | null):
Promise<Category3ObservedStart[]> {
  try {
    const client = createServiceClient();
    const rows = await readDialoguePages(async after => {
      const page = client.from("audit_logs").select("id,record_id,account_id,created_at,changes_json")
        .eq("table_name", CATEGORY_3_AUDIT_ENTITY).eq("event", CATEGORY_3_ATTEMPT_EVENT)
        .gte("created_at", new Date(period.startTime * 1000).toISOString())
        .lt("created_at", new Date(period.endTime * 1000).toISOString()).order("id").limit(DIALOGUE_PAGE_SIZE);
      return await (after ? page.gt("id", after) : page);
    });
    const key = (generationId: string, accountId: string, environment: string) => `${generationId}:${accountId}:${environment}`;
    const linked = new Set(active?.executions.flatMap(execution => execution.accountId && execution.economicEvent?.kind === "category_3_generation"
      ? [key(execution.economicEvent.eventId, execution.accountId, execution.environment)] : []) ?? []);
    const missing = new Map<string, Omit<Category3ObservedStart, "accountName">>();
    for (const raw of rows) {
      const row = observedAttempt.parse(raw);
      const environment = row.changes_json.environment;
      const identity = key(row.record_id, row.account_id, environment);
      if (linked.has(identity)) continue;
      const current = missing.get(identity);
      if (!current || Date.parse(row.created_at) < Date.parse(current.startedAt)) {
        missing.set(identity, { generationId: row.record_id, accountId: row.account_id, environment, startedAt: row.created_at });
      }
    }
    const accountIds = [...new Set([...missing.values()].map(row => row.accountId))];
    const names = new Map<string, string>();
    for (let offset = 0; offset < accountIds.length; offset += 100) {
      const batch = accountIds.slice(offset, offset + 100);
      const { data, error } = await client.from("accounts").select("id,name").in("id", batch).limit(batch.length);
      if (error) break;
      for (const row of data ?? []) if (typeof row.name === "string") names.set(row.id, row.name);
    }
    return [...missing.values()].map(row => ({
      ...row, accountName: names.get(row.accountId) ?? "Conta " + row.accountId.slice(0, 8),
    }));
  } catch {
    return [];
  }
}

export async function readCategory3Cost(identity: Category3CostIdentity): Promise<Category3CostResult> {
  const { generationId, accountId, environment } = identity;
  try {
    const client = createServiceClient();
    const [executions, evidence] = await Promise.all([
      readDialoguePages(async after => {
        const page = client.from("openai_cost_executions").select(executionColumns)
          .eq("economic_event_kind", "category_3_generation").eq("economic_event_id", generationId)
          .eq("account_id", accountId).eq("environment", environment).eq("execution_origin", "runtime")
          .eq("workload", "communication_base_stage2_intelligence").order("id").limit(DIALOGUE_PAGE_SIZE);
        return await (after ? page.gt("id", after) : page);
      }),
      readDialoguePages(async after => {
        const page = client.from("audit_logs").select("id,event,changes_json")
          .eq("table_name", CATEGORY_3_AUDIT_ENTITY).eq("record_id", generationId).eq("account_id", accountId)
          .eq("changes_json->>environment", environment).order("id").limit(DIALOGUE_PAGE_SIZE);
        return await (after ? page.gt("id", after) : page);
      }).catch(() => []),
    ]);
    if (executions.length === 0 && evidence.length === 0) return { ok: false };
    const operations: Record<string, unknown>[] = [];
    for (let offset = 0; offset < executions.length; offset += 100) {
      const ids = executions.slice(offset, offset + 100).map(row => row.id as string);
      operations.push(...await readDialoguePages(async after => {
        const page = client.from("openai_cost_operations").select(operationColumns).in("execution_id", ids).order("id").limit(DIALOGUE_PAGE_SIZE);
        return await (after ? page.gt("id", after) : page);
      }));
    }
    const ledger = translateDialogueLedger(executions, operations);
    return { ok: true, value: buildCategory3CostDetail(identity, ledger.executions, evidence) };
  } catch {
    return { ok: false };
  }
}
