import assert from "node:assert/strict";
import nodeModule from "node:module";
import { category3GenerationId, signCategory3Section, verifyCategory3Section } from "../communication-base/agent-base/generation-identity";
import type { AgentBasePilotSection } from "../communication-base/agent-base/pilot";
import { buildCategory3CostDetail, type Category3CostIdentity } from "./category-3-costs";
import { clientOpenAiCostContext } from "./active-contracts";
import { buildOpenAiEconomicHierarchy } from "./economic-hierarchy";
import { translateDialogueLedger } from "./dialogue-costs";

const id = (n: number) => "c3000000-0000-4000-8000-" + String(n).padStart(12, "0");
const accountId = id(1);
const first = { generationId: id(2), accountId, environment: "preview" } as const;
const second = { ...first, generationId: id(3) };
const priorDay = "2026-11-20T23:59:00.000Z";
const nextDay = "2026-11-21T00:02:00.000Z";

function execution(n: number, identity: Category3CostIdentity, start = nextDay) {
  return { id: id(n), account_id: identity.accountId, environment: identity.environment, started_at: start, finished_at: nextDay,
    result: "success", failure_category: null, execution_origin: "runtime", universe: "client", attribution_status: "attributed",
    workload: "communication_base_stage2_intelligence", economic_event_kind: "category_3_generation", economic_event_id: identity.generationId,
    landing_page_id: null, taxon_id: null, baseline_reference: null, baseline_version: null };
}

function operation(n: number, parent: number, cost: string) {
  return { id: id(n), execution_id: id(parent), sequence: 1, retry_of_operation_id: null,
    model: "gpt-6.2-sol", reasoning_effort: "medium", configuration_source: "supabase_operational", configuration_revision: "approved",
    prompt_version: null, contract_version: null, started_at: nextDay, finished_at: nextDay,
    result: "success", failure_category: null, input_tokens: 10, cached_input_tokens: 1, cache_write_tokens: 2,
    output_tokens: 5, reasoning_tokens: 0, total_tokens: 15, web_search_call_count: 2,
    web_search_tool_version: "search-v1", web_search_price_per_call_usd: "0.01", pricing_version: "sol-standard",
    pricing_effective_at: priorDay, pricing_snapshot: { model: "gpt-6.2-sol" }, cost_status: "calculated", cost_unavailable_reason: null, cost_usd: cost };
}

export async function validateCategory3Costs() {
  const secret = "fixture-secret";
  const identity = category3GenerationId(secret, id(1000), "preview", accountId, 5);
  assert.equal(identity, category3GenerationId(secret, id(1000), "preview", accountId, 5), "transport replay keeps the same initiation");
  assert.notEqual(identity, category3GenerationId(secret, id(1001), "preview", accountId, 5));
  const keys = ["about", "audience", "market_insights", "value_proposition", "benefits", "differentiators", "faq"];
  const catalogState = JSON.stringify({ targets: keys.map(key => ({ key })) });
  const proofContext = { accountId, environment: "preview", version: 5, generationId: identity, catalogState, nicheRevision: "5" } as const;
  for (const key of keys) {
    const section: AgentBasePilotSection = { key, value: "fixture", basis: "strategic_hypothesis", sources: [], researched: false };
    const signed = { ...section, proof: signCategory3Section(secret, proofContext, section) };
    assert.ok(verifyCategory3Section(secret, proofContext, signed));
    for (const mismatched of [{ generationId: id(1001) }, { generationId: null }, { accountId: id(9) }, { environment: "production" as const }]) {
      assert.equal(verifyCategory3Section(secret, { ...proofContext, ...mismatched }, signed), false);
    }
    assert.equal(verifyCategory3Section(secret, proofContext, { ...signed, value: "alterado" }), false);
    const legacyContext = { ...proofContext, generationId: null };
    const legacy = { ...section, proof: signCategory3Section(secret, legacyContext, section) };
    assert.equal(verifyCategory3Section(secret, legacyContext, legacy), true);
    assert.equal(verifyCategory3Section(secret, proofContext, legacy), false);
  }
  const firstExecutions = keys.map((_, index) => execution(10 + index, first, index === 0 ? priorDay : nextDay));
  const secondExecutions = [execution(30, second), { ...execution(31, second), result: "failure", failure_category: "provider_error" }];
  const firstOps = keys.map((_, index) => operation(100 + index, 10 + index, "0.03"));
  const extra = { ...operation(107, 10, "0.04"), sequence: 2, retry_of_operation_id: id(100),
    result: "failure", failure_category: "provider_error" };
  const secondOps = [operation(130, 30, "0.07"), { ...operation(131, 31, "0"), cost_usd: null, cost_status: "unavailable",
    cost_unavailable_reason: "usage_missing", web_search_call_count: null, result: "failure", failure_category: "provider_error" }];
  const model = translateDialogueLedger([...firstExecutions, ...secondExecutions], [...firstOps, extra, ...secondOps]);
  const hierarchy = buildOpenAiEconomicHierarchy(model, null);
  assert.equal(model.totalCalculatedUsd, "0.32");
  assert.equal(hierarchy.clients.accounts[0].calculatedCostUsd, "0.32");
  assert.equal(model.groups[0].calculatedCostUsd, "0.32");
  assert.deepEqual(hierarchy.clients.accounts[0].events.map(event => event.eventId).sort(), [first.generationId, second.generationId]);
  const firstModel = translateDialogueLedger(firstExecutions, [...firstOps, extra]);
  const detail = buildCategory3CostDetail(first, firstModel);
  assert.deepEqual([detail.outcome, detail.calculatedCostUsd, detail.attemptCount, detail.retryCount, detail.searches],
    ["unconfirmed", "0.25", 8, 1, 16], "seven billed responses do not prove the functional outcome");
  assert.equal(detail.executions.filter(row => row.startedAt >= "2026-11-21T00:00:00.000Z").length, 6);
  assert.equal(detail.executions[0].operations[0].cacheWriteTokens, 2);
  const partial = buildCategory3CostDetail(second, translateDialogueLedger(secondExecutions, secondOps));
  assert.deepEqual([partial.outcome, partial.calculatedCostUsd, partial.unavailableCount],
    ["unconfirmed", "0.07", 1], "an operation failure does not assert the outcome of the generation");
  const missing = buildCategory3CostDetail(first, translateDialogueLedger([firstExecutions[0]], []));
  assert.equal(missing.missingCount, 1);
  assert.equal(missing.calculatedCostUsd, null);
  assert.throws(() => buildCategory3CostDetail(first, model), /scope_invalid/);
  assert.throws(() => buildCategory3CostDetail(first, { ...firstModel,
    executions: [...firstModel.executions, firstModel.executions[0]] }), /scope_invalid/);

  const tables: Record<string, Record<string, unknown>[]> = {
    openai_cost_executions: [...firstExecutions, ...secondExecutions, { ...execution(80, first), environment: "production" }],
    openai_cost_operations: [...firstOps, extra, ...secondOps, operation(180, 80, "99")],
    openai_cost_coverage: [],
  };
  const oneExecution = firstExecutions[0];
  const oneOperation = firstOps[0];
  const v2Row = { ...oneExecution, ...oneOperation, economic_event_kind: null, economic_event_id: null,
    operation_sequence: 1, cursor_started_at: oneExecution.started_at, account_name: "QA", landing_page_name: null, taxon_name: null,
    execution_finished_at: oneExecution.finished_at, execution_result: oneExecution.result, execution_failure_category: null,
    operation_id: oneOperation.id, operation_started_at: oneOperation.started_at, operation_finished_at: oneOperation.finished_at,
    operation_result: oneOperation.result, operation_failure_category: null };
  let linkError = false;
  const startCalls: Record<string, unknown>[] = [];
  let startError: { code: string; message: string } | null = null;
  const client = { async rpc(name: string, args: Record<string, unknown>) {
    if (name === "read_openai_active_cost_rows_v2") {
      return { data: args.p_after_execution_id ? [] : [v2Row], error: null };
    }
    assert.equal(name, "start_openai_cost_execution_v2");
    startCalls.push(args);
    return { data: null, error: startCalls.length === 1 ? startError : null };
  }, from(table: string) {
    const filters: Array<(row: Record<string, unknown>) => boolean> = [];
    const chain = {
      select() { return chain; },
      eq(key: string, value: unknown) {
        filters.push(row => row[key] === value);
        return chain;
      },
      in(key: string, values: unknown[]) { filters.push(row => values.includes(row[key])); return chain; },
      gt(key: string, value: string) { filters.push(row => String(row[key]) > value); return chain; },
      order() { return chain; },
      limit() { return chain; },
      then(resolve: (value: { data: Record<string, unknown>[]; error: string | null }) => unknown) {
        return Promise.resolve(resolve({ data: tables[table].filter(row => filters.every(filter => filter(row)))
          .sort((a, b) => String(a.id).localeCompare(String(b.id))),
          error: linkError && table === "openai_cost_executions" ? "link unavailable" : null }));
      },
    };
    return chain;
  } };
  const loader = nodeModule as unknown as { _load: (name: string, parent: unknown, isMain: boolean) => unknown };
  const original = loader._load;
  loader._load = function(name, parent, isMain) {
    if (name === "server-only") return {};
    if (name.endsWith("supabase/service")) return { createServiceClient: () => client };
    return original.call(this, name, parent, isMain);
  };
  const [adapter, { readOpenAiActiveCosts }, { activeCostTrackingAdapter }] = await Promise.all([
    import("./adapters/category3CostReadAdapter"), import("./adapters/activeCostReadModelAdapter"),
    import("./adapters/activeCostTrackingAdapter"),
  ]).finally(() => { loader._load = original; });
  const read = await adapter.readCategory3Cost(first);
  assert.ok(read.ok);
  if (read.ok) assert.equal(read.value.calculatedCostUsd, "0.25", "read spans both dates and ignores other account/environment/ID rows");
  const readSecond = await adapter.readCategory3Cost(second);
  assert.ok(readSecond.ok);
  if (readSecond.ok) assert.equal(readSecond.value.calculatedCostUsd, "0.07");
  assert.deepEqual(await adapter.readCategory3Cost({ ...first, accountId: id(999) }), { ok: false });
  assert.deepEqual(await adapter.readCategory3Cost({ ...first, generationId: id(4) }), { ok: false });
  const period = { startTime: Date.parse("2026-11-20T00:00:00.000Z") / 1000, endTime: Date.parse("2026-11-22T00:00:00.000Z") / 1000 };
  const linked = await readOpenAiActiveCosts(period);
  assert.ok(linked.ok);
  assert.equal(linked.value.executions[0].economicEvent?.eventId, first.generationId);
  assert.equal(linked.value.totalCalculatedUsd, "0.03");
  linkError = true;
  const bridge = await readOpenAiActiveCosts(period);
  assert.ok(bridge.ok);
  assert.equal(bridge.value.executions[0].economicEvent, null);
  assert.equal(bridge.value.totalCalculatedUsd, linked.value.totalCalculatedUsd);
  const context = { executionId: oneExecution.id, workload: "communication_base_stage2_intelligence", environment: "preview",
    executionOrigin: "runtime", startedAt: priorDay,
    economicContext: clientOpenAiCostContext(accountId, { kind: "category_3_generation", eventId: first.generationId }) } as const;
  await activeCostTrackingAdapter.startExecution(context);
  assert.equal(startCalls.length, 1);
  assert.equal(startCalls[0].p_economic_event_id, first.generationId);
  startCalls.length = 0;
  startError = { code: "23514", message: 'new row violates check constraint "openai_cost_executions_economic_event_chk"' };
  await activeCostTrackingAdapter.startExecution(context);
  assert.equal(startCalls.length, 2);
  assert.equal(startCalls[1].p_account_id, accountId);
  assert.equal(startCalls[1].p_economic_event_id, null);
  startCalls.length = 0;
  startError = { code: "23514", message: 'new row violates check constraint "another_constraint"' };
  await assert.rejects(() => activeCostTrackingAdapter.startExecution(context));
  assert.equal(startCalls.length, 1);
  console.log("PASS D14F/D10 Category 3 identity, lifetime cost, unconfirmed functional outcome, billed retry, partial coverage and separate generations");
}
