import "server-only";

import { createServiceClient } from "../../supabase/service";
import { buildCategory3CostDetail, type Category3CostIdentity, type Category3CostResult } from "../category-3-costs";
import { DIALOGUE_PAGE_SIZE, readDialoguePages, translateDialogueLedger } from "../dialogue-costs";
import { executionColumns, operationColumns } from "./dialogueCostReadAdapter";

export async function readCategory3Cost(identity: Category3CostIdentity): Promise<Category3CostResult> {
  const { generationId, accountId, environment } = identity;
  try {
    const client = createServiceClient();
    const executions = await readDialoguePages(async after => {
      const page = client.from("openai_cost_executions").select(executionColumns)
        .eq("economic_event_kind", "category_3_generation").eq("economic_event_id", generationId)
        .eq("account_id", accountId).eq("environment", environment).eq("execution_origin", "runtime")
        .eq("workload", "communication_base_stage2_intelligence").order("id").limit(DIALOGUE_PAGE_SIZE);
      return await (after ? page.gt("id", after) : page);
    });
    if (!executions.length) return { ok: false };
    const operations: Record<string, unknown>[] = [];
    for (let offset = 0; offset < executions.length; offset += 100) {
      const ids = executions.slice(offset, offset + 100).map(row => row.id as string);
      operations.push(...await readDialoguePages(async after => {
        const page = client.from("openai_cost_operations").select(operationColumns).in("execution_id", ids).order("id").limit(DIALOGUE_PAGE_SIZE);
        return await (after ? page.gt("id", after) : page);
      }));
    }
    return { ok: true, value: buildCategory3CostDetail(identity, translateDialogueLedger(executions, operations)) };
  } catch {
    return { ok: false };
  }
}
