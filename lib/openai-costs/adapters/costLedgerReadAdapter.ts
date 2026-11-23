import "server-only";

import { z } from "zod";
import { createServiceClient } from "../../supabase/service";
import { clientOpenAiCostContext, type OpenAiCostEnvironment } from "../active-contracts";
import { resolveOpenAiOccurrenceId } from "../recorder";
import { buildOccurrenceCostDetail, type OccurrenceCostQuery, type OccurrenceCostResult } from "../occurrence-costs";
import { COST_LEDGER_PAGE_SIZE, readCostLedgerPages, translateCostLedger } from "./costLedgerReadAdapterCore";

export const executionColumns = "id,workload,environment,execution_origin,universe,attribution_status,account_id,economic_event_kind,economic_event_id,landing_page_id,taxon_id,baseline_reference,baseline_version,started_at,finished_at,result,failure_category";
const operationColumns = "id,execution_id,sequence,retry_of_operation_id,model,reasoning_effort,configuration_source,configuration_revision,prompt_version,contract_version,started_at,finished_at,result,failure_category,input_tokens,cached_input_tokens,cache_write_tokens,output_tokens,reasoning_tokens,total_tokens,web_search_call_count,web_search_tool_version,web_search_price_per_call_usd::text,pricing_version,pricing_effective_at,pricing_snapshot,cost_status,cost_unavailable_reason,cost_usd::text";
const occurrenceLink = z.object({ occurrence_id: z.uuid().nullable() });
const occurrenceLifecycle = z.object({ occurrence_id: z.uuid(), closed_at: z.iso.datetime({ offset: true }).nullable() });

export async function readCostLedgerOperations(
  client: ReturnType<typeof createServiceClient>,
  executions: readonly Record<string, unknown>[],
) {
  const operations: Record<string, unknown>[] = [];
  for (let offset = 0; offset < executions.length; offset += 100) {
    const ids = executions.slice(offset, offset + 100).map(execution => execution.id as string);
    const batch = await readCostLedgerPages(async after => {
      let query = client.from("openai_cost_operations").select(operationColumns)
        .in("execution_id", ids).order("id").limit(COST_LEDGER_PAGE_SIZE);
      if (after) query = query.gt("id", after);
      return await query;
    });
    operations.push(...batch);
  }
  return operations;
}

export async function readNicheDialogueCostContext(accountId: string, dialogueId: string, environment: OpenAiCostEnvironment) {
  const context = clientOpenAiCostContext(accountId, { kind: "niche_resolution", eventId: dialogueId });
  const occurrenceId = resolveOpenAiOccurrenceId(context, environment);
  const client = createServiceClient();
  const signal = AbortSignal.timeout(2000);
  const execution = await client.from("openai_cost_executions").select("id")
    .eq("occurrence_id", occurrenceId).eq("account_id", accountId)
    .eq("environment", environment).eq("execution_origin", "runtime")
    .eq("universe", "client").eq("attribution_status", "attributed")
    .eq("economic_event_kind", "niche_resolution").eq("economic_event_id", dialogueId)
    .limit(1).abortSignal(signal).maybeSingle();
  if (execution.error) return null;
  if (!execution.data) return context;
  // Once an execution exists, v4 cannot add dimensions to that occurrence.
  const { data: lifecycle, error } = await client.from("openai_cost_occurrence_lifecycle")
    .select("action_kind").eq("occurrence_id", occurrenceId).abortSignal(signal).maybeSingle();
  if (error) return null;
  if (lifecycle?.action_kind === "niche_resolution") return context;
  return !lifecycle || lifecycle.action_kind === null ? { ...context, occurrenceDimensions: undefined } : null;
}

export async function readOpenAiCostOccurrence(query: OccurrenceCostQuery): Promise<OccurrenceCostResult> {
  try {
    const client = createServiceClient();
    let occurrenceId = query.id;
    if (query.by === "execution") {
      const link = await client.from("openai_cost_executions").select("id,occurrence_id").eq("id", query.id).maybeSingle();
      if (link.error) return { ok: false, code: "READ_FAILED" };
      if (!link.data) return { ok: false, code: "NOT_FOUND" };
      const parsed = occurrenceLink.safeParse(link.data);
      if (!parsed.success || link.data.id !== query.id) return { ok: false, code: "READ_FAILED" };
      if (!parsed.data.occurrence_id) return { ok: false, code: "NOT_FOUND" };
      occurrenceId = parsed.data.occurrence_id;
    }

    // Once we observe closure, every admitted operation is already durable and no new admission can join it.
    const lifecycle = await client.from("openai_cost_occurrence_lifecycle")
      .select("occurrence_id,closed_at").eq("occurrence_id", occurrenceId).maybeSingle();
    if (lifecycle.error) return { ok: false, code: "READ_FAILED" };
    let closedAt: string | null = null;
    if (lifecycle.data) {
      const parsed = occurrenceLifecycle.safeParse(lifecycle.data);
      if (!parsed.success || parsed.data.occurrence_id !== occurrenceId) return { ok: false, code: "READ_FAILED" };
      closedAt = parsed.data.closed_at;
    }

    const executions = await readCostLedgerPages(async after => {
      let read = client.from("openai_cost_executions").select(`${executionColumns},occurrence_id`)
        .eq("occurrence_id", occurrenceId).order("id").limit(COST_LEDGER_PAGE_SIZE);
      if (after) read = read.gt("id", after);
      return await read;
    });
    if (executions.length === 0) return { ok: false, code: lifecycle.data ? "READ_FAILED" : "NOT_FOUND" };
    if (executions.some(execution => execution.occurrence_id !== occurrenceId)) return { ok: false, code: "READ_FAILED" };
    const operations = await readCostLedgerOperations(client, executions);

    const accountId = z.uuid().safeParse(executions[0].account_id);
    let accountName: string | undefined;
    if (accountId.success) {
      const account = await client.from("accounts").select("id,name").eq("id", accountId.data).maybeSingle();
      if (!account.error && account.data?.id === accountId.data && typeof account.data.name === "string" &&
          account.data.name.trim() && !/[\u0000-\u001f]/.test(account.data.name)) accountName = account.data.name;
    }
    const model = translateCostLedger(executions, operations, accountName);
    return { ok: true, value: buildOccurrenceCostDetail(occurrenceId, closedAt, model.executions) };
  } catch {
    return { ok: false, code: "READ_FAILED" };
  }
}
