import assert from "node:assert/strict";
import nodeModule from "node:module";
import { category3GenerationId, category3SectionsMatchCatalog, signCategory3Section, verifyCategory3Section } from "../communication-base/agent-base/generation-identity";
import type { AgentBasePilotSection } from "../communication-base/agent-base/pilot";
import { buildCategory3CostDetail, type Category3CostIdentity } from "./category-3-costs";
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

function audit(identity: Category3CostIdentity, n: number, outcome = "attempt", executionIds?: string[]) {
  return { id: id(n), account_id: identity.accountId, record_id: identity.generationId, table_name: "category_3_generation",
    event: "category_3_generation_" + outcome, created_at: n === 10 ? priorDay : nextDay, changes_json: { environment: identity.environment, execution_ids: executionIds } };
}

export async function validateCategory3Costs() {
  const secret = "fixture-secret";
  const identity = category3GenerationId(secret, id(1000), "preview", accountId, 5);
  assert.equal(identity, category3GenerationId(secret, id(1000), "preview", accountId, 5), "transport replay keeps the same initiation");
  assert.notEqual(identity, category3GenerationId(secret, id(1001), "preview", accountId, 5));
  const keys = ["about", "audience", "market_insights", "value_proposition", "benefits", "differentiators", "faq"];
  const catalogState = JSON.stringify({ targets: keys.map(key => ({ key })) });
  const proofContext = { accountId, environment: "preview", version: 5, generationId: identity, catalogState, nicheRevision: "5" } as const;
  const signedSections = keys.map((key, index) => {
    const section: AgentBasePilotSection = { key, value: "fixture", basis: "strategic_hypothesis", sources: [], researched: false,
      costExecutionId: id(10 + index) };
    const signed = { ...section, proof: signCategory3Section(secret, proofContext, section) };
    assert.ok(verifyCategory3Section(secret, proofContext, signed));
    for (const mismatched of [{ generationId: id(1001) }, { generationId: null }, { accountId: id(9) }, { environment: "production" as const }]) {
      assert.equal(verifyCategory3Section(secret, { ...proofContext, ...mismatched }, signed), false);
    }
    assert.equal(verifyCategory3Section(secret, proofContext, { ...signed, costExecutionId: id(999) }), false);
    return signed;
  });
  assert.ok(category3SectionsMatchCatalog(catalogState, signedSections), "a complete signed generation survives a subsequent catalog change as outcome evidence");
  assert.equal(category3SectionsMatchCatalog(catalogState, signedSections.slice(0, -1)), false);
  assert.equal(category3SectionsMatchCatalog(catalogState, [...signedSections].reverse()), false);
  assert.equal(category3SectionsMatchCatalog("{}", signedSections), false);
  const attempts = signedSections.map(section => section.costExecutionId!);
  const firstExecutions = keys.map((_, index) => execution(10 + index, first, index === 0 ? priorDay : nextDay));
  const secondExecutions = [execution(30, second), { ...execution(31, second), result: "failure", failure_category: "provider_error" }];
  const firstOps = keys.map((_, index) => operation(100 + index, 10 + index, "0.03"));
  const extra = { ...operation(107, 10, "0.04"), sequence: 2, retry_of_operation_id: id(100),
    result: "failure", failure_category: "provider_error" };
  const secondOps = [operation(130, 30, "0.07"), { ...operation(131, 31, "0"), cost_usd: null, cost_status: "unavailable",
    cost_unavailable_reason: "usage_missing", web_search_call_count: null, result: "failure", failure_category: "provider_error" }];
  const firstEvidence = [...keys.map((_, index) => audit(first, 10 + index)), audit(first, 500, "saved", attempts)];
  const secondEvidence = [audit(second, 30), audit(second, 31), audit(second, 501, "failed", [id(30), id(31)])];
  const model = translateDialogueLedger([...firstExecutions, ...secondExecutions], [...firstOps, extra, ...secondOps]);
  const hierarchy = buildOpenAiEconomicHierarchy(model, null);
  assert.equal(model.totalCalculatedUsd, "0.32");
  assert.equal(hierarchy.clients.accounts[0].calculatedCostUsd, "0.32");
  assert.equal(model.groups[0].calculatedCostUsd, "0.32");
  assert.deepEqual(hierarchy.clients.accounts[0].events.map(event => event.eventId).sort(), [first.generationId, second.generationId]);
  const rows = model.executions.filter(row => row.economicEvent?.eventId === first.generationId);
  const detail = buildCategory3CostDetail(first, rows, firstEvidence);
  assert.deepEqual([detail.outcome, detail.costStatus, detail.calculatedCostUsd, detail.attemptCount, detail.retryCount, detail.searches],
    ["saved", "complete", "0.25", 8, 1, 16]);
  assert.equal(rows.filter(row => row.startedAt >= "2026-11-21T00:00:00.000Z").length, 6);
  const failedRows = model.executions.filter(row => row.economicEvent?.eventId === second.generationId);
  const failed = buildCategory3CostDetail(second, failedRows, secondEvidence);
  assert.deepEqual([failed.outcome, failed.costStatus, failed.calculatedCostUsd, failed.unavailableCount],
    ["failed", "partial", "0.07", 1]);
  const interrupted = buildCategory3CostDetail(second, failedRows, [...secondEvidence.slice(0, 2), audit(second, 509, "interrupted", [id(30), id(31)])]);
  assert.equal(interrupted.outcome, "interrupted");
  assert.equal(buildCategory3CostDetail(first, rows, firstEvidence.slice(0, -1)).outcome, "unconfirmed", "seven responses do not prove save");
  assert.equal(buildCategory3CostDetail(first, rows, []).costStatus, "partial", "audit outage preserves the calculable subtotal");
  assert.equal(buildCategory3CostDetail(first, rows.slice(1), firstEvidence).missingCount, 1);
  assert.equal(buildCategory3CostDetail(first, [], firstEvidence).calculatedCostUsd, null);
  assert.throws(() => buildCategory3CostDetail(first, [...rows, failedRows[0]], firstEvidence), /scope_invalid/);
  assert.throws(() => buildCategory3CostDetail(first, [...rows, rows[0]], firstEvidence), /scope_invalid/);

  const tables: Record<string, Record<string, unknown>[]> = {
    openai_cost_executions: [...firstExecutions, ...secondExecutions, { ...execution(80, first), environment: "production" }],
    openai_cost_operations: [...firstOps, extra, ...secondOps, operation(180, 80, "99")],
    audit_logs: [...firstEvidence, ...secondEvidence, audit({ ...first, generationId: id(4) }, 40)],
    accounts: [{ id: accountId, name: "Conta QA" }],
  };
  const client = { from(table: string) {
    const filters: Array<(row: Record<string, unknown>) => boolean> = [];
    const chain = {
      select() { return chain; },
      eq(key: string, value: unknown) {
        filters.push(row => key === "changes_json->>environment"
          ? (row.changes_json as { environment?: string })?.environment === value : row[key] === value);
        return chain;
      },
      in(key: string, values: unknown[]) { filters.push(row => values.includes(row[key])); return chain; },
      gt(key: string, value: string) { filters.push(row => String(row[key]) > value); return chain; },
      gte(key: string, value: string) { filters.push(row => String(row[key]) >= value); return chain; },
      lt(key: string, value: string) { filters.push(row => String(row[key]) < value); return chain; },
      order() { return chain; },
      limit() { return chain; },
      then(resolve: (value: { data: Record<string, unknown>[]; error: null }) => unknown) {
        return Promise.resolve(resolve({ data: tables[table].filter(row => filters.every(filter => filter(row)))
          .sort((a, b) => String(a.id).localeCompare(String(b.id))), error: null }));
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
  const adapter = await import("./adapters/category3CostReadAdapter").finally(() => { loader._load = original; });
  const read = await adapter.readCategory3Cost(first);
  assert.ok(read.ok);
  if (read.ok) assert.equal(read.value.calculatedCostUsd, "0.25", "read spans both dates and ignores other account/environment/ID rows");
  const readSecond = await adapter.readCategory3Cost(second);
  assert.ok(readSecond.ok);
  if (readSecond.ok) assert.equal(readSecond.value.calculatedCostUsd, "0.07");
  assert.deepEqual(await adapter.readCategory3Cost({ ...first, accountId: id(999) }), { ok: false });
  const observed = await adapter.readCategory3ObservedStarts({
    startTime: Date.parse("2026-11-21T00:00:00.000Z") / 1000,
    endTime: Date.parse("2026-11-22T00:00:00.000Z") / 1000,
  }, model);
  assert.deepEqual(observed, [{ ...first, generationId: id(4), accountName: "Conta QA", startedAt: nextDay }]);
  const withUnrecorded = buildOpenAiEconomicHierarchy(model, null, observed);
  assert.equal(withUnrecorded.clients.calculatedCostUsd, hierarchy.clients.calculatedCostUsd);
  const unrecorded = withUnrecorded.clients.accounts[0].events.find(event => event.eventId === id(4));
  assert.equal(unrecorded?.executionCount, 0);
  const readUnrecorded = await adapter.readCategory3Cost({ ...first, generationId: id(4) });
  assert.ok(readUnrecorded.ok);
  if (readUnrecorded.ok) assert.equal(readUnrecorded.value.calculatedCostUsd, null);
  console.log("PASS D14F/D10 Category 3 identity, lifetime cost, independent outcome, billed retry, partial coverage and separate generations");
}
