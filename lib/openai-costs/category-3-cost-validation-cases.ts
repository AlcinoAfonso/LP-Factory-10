import assert from "node:assert/strict";
import nodeModule from "node:module";
import { category3GenerationId, signCategory3Section, verifyCategory3Section } from "../communication-base/agent-base/generation-identity";
import type { AgentBasePilotSection } from "../communication-base/agent-base/pilot";
import { communicationSections } from "../communication-base/registry";
import { resolveOpenAiProductWorkload } from "../openai-workloads";
import type { OpenAiResponsesDependencies, OpenAiResponsesInput } from "../openai-responses/openAiResponsesAdapter";
import type { OpenAiCostTrackingAdapter } from "./active-contracts";
import { buildCategory3CostDetail, category3DispatchFingerprint, type Category3CostIdentity } from "./category-3-costs";
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
    const dispatched = { ...section, dispatchedOperationId: id(123) };
    const signedDispatch = { ...dispatched, proof: signCategory3Section(secret, proofContext, dispatched) };
    assert.equal(verifyCategory3Section(secret, proofContext, signedDispatch), true);
    assert.equal(verifyCategory3Section(secret, proofContext, { ...signedDispatch, dispatchedOperationId: id(124) }), false);
    assert.equal(verifyCategory3Section(secret, proofContext, { ...signedDispatch, dispatchedOperationId: undefined }), false);
    assert.equal(verifyCategory3Section(secret, proofContext, { ...signed, dispatchedOperationId: id(123) }), false);
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
  const savedEvidence = { environment: first.environment, dispatch: category3DispatchFingerprint(new Set(firstOps.map(row => row.id))) };
  const savedDetail = buildCategory3CostDetail(first, translateDialogueLedger(firstExecutions, firstOps), savedEvidence);
  assert.deepEqual([savedDetail.outcome, savedDetail.matchesSavedOperations, savedDetail.calculatedCostUsd], ["saved", true, "0.21"]);
  const withExtraAttempt = buildCategory3CostDetail(first, firstModel, savedEvidence);
  assert.deepEqual([withExtraAttempt.outcome, withExtraAttempt.matchesSavedOperations, withExtraAttempt.calculatedCostUsd, withExtraAttempt.retryCount],
    ["saved", false, "0.25", 1], "an extra billed attempt is preserved once even when it was outside the saved selection");
  const missingOperation = buildCategory3CostDetail(first, translateDialogueLedger(firstExecutions, firstOps.slice(1)), savedEvidence);
  const missingExecution = buildCategory3CostDetail(first, translateDialogueLedger(firstExecutions.slice(1), firstOps.slice(1)), savedEvidence);
  const equalCountDifferentIds = buildCategory3CostDetail(first, translateDialogueLedger(firstExecutions,
    [{ ...firstOps[0], id: extra.id }, ...firstOps.slice(1)]), savedEvidence);
  for (const candidate of [missingOperation, missingExecution, equalCountDifferentIds]) {
    assert.equal(candidate.outcome, "saved");
    assert.equal(candidate.matchesSavedOperations, false);
  }
  assert.equal(missingOperation.missingCount, 1);
  assert.equal(missingExecution.missingCount, 0, "a lost execution leaves no empty execution row to count");
  assert.equal(buildCategory3CostDetail(first, firstModel, { ...savedEvidence, environment: "production" }).outcome, "unconfirmed");
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
    audit_logs: [],
  };
  const oneExecution = firstExecutions[0];
  const oneOperation = firstOps[0];
  const v2Row = { ...oneExecution, ...oneOperation, economic_event_kind: null, economic_event_id: null,
    operation_sequence: 1, cursor_started_at: oneExecution.started_at, account_name: "QA", landing_page_name: null, taxon_name: null,
    execution_finished_at: oneExecution.finished_at, execution_result: oneExecution.result, execution_failure_category: null,
    operation_id: oneOperation.id, operation_started_at: oneOperation.started_at, operation_finished_at: oneOperation.finished_at,
    operation_result: oneOperation.result, operation_failure_category: null };
  let linkError = false;
  let auditError = false;
  const startCalls: Record<string, unknown>[] = [];
  let startError: { code: string; message: string } | null = null;
  let baseRow = { account_id: accountId, version: 5, created_at: priorDay, updated_at: priorDay,
    sections_json: { business_name: { value: "Negócio de teste", origin: "user_confirmed", format: "text" } } };
  let rejectSave = false;
  const client = { rpc(name: string, args: Record<string, unknown>) {
    if (name === "commit_generated_communication_intelligence_v1") return { async single() {
      assert.equal(args.p_account_id, accountId);
      assert.equal(args.p_expected_version, baseRow.version);
      assert.deepEqual(Object.keys(args.p_generated_sections as object), keys);
      assert.equal(JSON.stringify(args.p_generated_sections).includes("dispatchedOperationId"), false);
      if (rejectSave) return { data: null, error: { code: "40001" } };
      baseRow = { ...baseRow, version: baseRow.version + 1, sections_json: {
        ...baseRow.sections_json, ...args.p_generated_sections as object,
      } };
      return { data: baseRow, error: null };
    } };
    return financialRpc(name, args);
  }, from(table: string) {
    const filters: Array<(row: Record<string, unknown>) => boolean> = [];
    const chain = {
      select() { return chain; },
      insert(row: Record<string, unknown>) {
        assert.equal(table, "audit_logs");
        return { async abortSignal() {
          if (auditError) throw Error("fixture: audit unavailable");
          assert.ok(tables[table].every(existing => existing.id !== row.id));
          tables[table].push(row);
        } };
      },
      eq(key: string, value: unknown) {
        filters.push(row => row[key] === value);
        return chain;
      },
      in(key: string, values: unknown[]) { filters.push(row => values.includes(row[key])); return chain; },
      gt(key: string, value: string) { filters.push(row => String(row[key]) > value); return chain; },
      order() { return chain; },
      limit() { return chain; },
      async maybeSingle() {
        assert.equal(table, "account_communication_bases");
        return { data: filters.every(filter => filter(baseRow)) ? baseRow : null, error: null };
      },
      then(resolve: (value: { data: Record<string, unknown>[]; error: string | null }) => unknown) {
        return Promise.resolve(resolve({ data: tables[table].filter(row => filters.every(filter => filter(row)))
          .sort((a, b) => String(a.id).localeCompare(String(b.id))),
          error: linkError && table === "openai_cost_executions" ? "link unavailable" : null }));
      },
    };
    return chain;
  } };
  async function financialRpc(name: string, args: Record<string, unknown>) {
    if (name === "read_openai_active_cost_rows_v2") {
      return { data: args.p_after_execution_id ? [] : [v2Row], error: null };
    }
    assert.equal(name, "start_openai_cost_execution_v2");
    startCalls.push(args);
    return { data: null, error: startCalls.length === 1 ? startError : null };
  }
  const loader = nodeModule as unknown as { _load: (name: string, parent: unknown, isMain: boolean) => unknown };
  const original = loader._load;
  const resolved = await resolveOpenAiProductWorkload("communication_base_stage2_intelligence", "development");
  assert.ok(resolved.ok);
  const afterSave: Array<() => Promise<unknown>> = [];
  let failDispatch = false;
  const recorder: OpenAiCostTrackingAdapter = {
    async startExecution(input) {
      const event = input.economicContext.event;
      assert.equal(event?.kind, "category_3_generation");
      assert.equal(input.economicContext.accountId, accountId);
      tables.openai_cost_executions.push({ ...execution(500, { ...first, generationId: event.eventId }), id: input.executionId });
    },
    async startOperation(input) {
      tables.openai_cost_operations.push({ ...operation(500, 500, "0.03"), id: input.operationId, execution_id: input.executionId });
    },
    async finishOperation(input) {
      assert.equal(input.webSearchCallCount, 1);
      const row = tables.openai_cost_operations.find(row => row.id === input.operationId);
      assert.ok(row);
      if (input.result === "failure") Object.assign(row, { result: "failure", failure_category: input.failureCategory });
    },
    async finishExecution() {},
  };
  const configuration = async () => resolved;
  const niche = { name: "Nicho de teste", taxonId: null, revision: "fixture", confirmed: true };
  loader._load = function(name, parent, isMain) {
    if (name === "server-only") return {};
    if (name.endsWith("supabase/service")) return { createServiceClient: () => client };
    if (name.endsWith("supabase/server")) return { createClient: async () => client };
    if (name === "next/cache") return { revalidatePath() {} };
    if (name === "next/server") return { after: (task: () => Promise<unknown>) => afterSave.push(task) };
    if (name.endsWith("communication-base/access")) return { requireCommunicationBaseAccess: async () => ({
      ok: true, value: { accountId, accountSubdomain: "categoria-fixture" },
    }) };
    if (name.endsWith("communicationCatalogAdapter")) return { readCommunicationDefinitions: async () => ({ ok: true, value: communicationSections }) };
    if (name.endsWith("accountOfficialNicheAdapter")) return { readOfficialNicheContext: async () => ({ ok: true, niche }) };
    if (name === "../openai-workloads" || name === "../../openai-workloads") return {
      ...(original.call(this, name, parent, isMain) as object), resolveOpenAiProductWorkload: configuration,
      resolveOpenAiWorkloadEnvironment: () => "preview", emitOpenAiWorkloadEvent() {},
    };
    if (name === "../../openai-responses/openAiResponsesAdapter") {
      const responses = original.call(this, name, parent, isMain) as typeof import("../openai-responses/openAiResponsesAdapter");
      return { requestOpenAiResponses: <T>(input: OpenAiResponsesInput<T>, dependencies: OpenAiResponsesDependencies) =>
        responses.requestOpenAiResponses(input, { ...dependencies, costRecorder: recorder, emitEvent() {} }) };
    }
    return original.call(this, name, parent, isMain);
  };
  const [adapter, { readOpenAiActiveCosts }, { activeCostTrackingAdapter }, { recordCategory3SavedEvidence }, actions] = await Promise.all([
    import("./adapters/category3CostReadAdapter"), import("./adapters/activeCostReadModelAdapter"),
    import("./adapters/activeCostTrackingAdapter"), import("../communication-base/adapters/category3SavedEvidenceAdapter"),
    import("../../app/a/[account]/base-comunicacao/actions"),
  ]).finally(() => { loader._load = original; });
  const read = await adapter.readCategory3Cost(first);
  assert.ok(read.ok);
  if (read.ok) assert.equal(read.value.calculatedCostUsd, "0.25", "read spans both dates and ignores other account/environment/ID rows");
  assert.equal(read.value.outcome, "unconfirmed");
  await recordCategory3SavedEvidence(first, firstOps.map(row => row.id));
  assert.deepEqual(tables.audit_logs[0], {
    id: first.generationId, account_id: first.accountId, record_id: first.accountId, table_name: "account_communication_bases",
    action: "update", event: "category_3_generation_saved", changes_json: savedEvidence,
  });
  const reloaded = await adapter.readCategory3Cost(first);
  assert.ok(reloaded.ok);
  assert.equal(reloaded.value.outcome, "saved");
  assert.equal(reloaded.value.matchesSavedOperations, false);
  assert.equal(reloaded.value.calculatedCostUsd, "0.25");
  auditError = true;
  await recordCategory3SavedEvidence(second, secondOps.map(row => row.id));
  auditError = false;
  const readSecond = await adapter.readCategory3Cost(second);
  assert.ok(readSecond.ok);
  assert.equal(readSecond.value.calculatedCostUsd, "0.07");
  assert.equal(readSecond.value.outcome, "unconfirmed");
  const auditOnly = { ...first, generationId: id(8) };
  await recordCategory3SavedEvidence(auditOnly, firstOps.map(row => row.id));
  const auditOnlyResult = await adapter.readCategory3Cost(auditOnly);
  assert.ok(auditOnlyResult.ok);
  assert.deepEqual([auditOnlyResult.value.outcome, auditOnlyResult.value.calculatedCostUsd, auditOnlyResult.value.matchesSavedOperations],
    ["saved", null, false]);
  assert.deepEqual(await adapter.readCategory3Cost({ ...auditOnly, environment: "production" }), { ok: false });
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
  linkError = false;
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
  const originalFetch = globalThis.fetch;
  const originalKey = process.env.OPENAI_API_KEY;
  const originalResourcesFlag = process.env.E25_3_COMMUNICATION_RESOURCES_ENABLED;
  process.env.OPENAI_API_KEY = secret;
  process.env.E25_3_COMMUNICATION_RESOURCES_ENABLED = "true";
  globalThis.fetch = async (url, init) => {
    assert.equal(url, "https://api.openai.com/v1/responses");
    const request = JSON.parse(String(init?.body));
    assert.equal(request.model, "gpt-6.2-sol");
    assert.equal(request.service_tier, "default");
    assert.equal(request.input.includes("dispatchedOperationId"), false);
    const { key, format } = JSON.parse(request.input).target_section;
    const value = format === "text" ? "Exemplo" : format === "items" ? ["Exemplo"] : [{ question: "Pergunta?", answer: "Resposta." }];
    return Response.json({ status: failDispatch ? "incomplete" : "completed", output: [
      { type: "web_search_call", status: "completed", action: { type: "search", sources: [{ url: "https://example.org/" }] } },
    ], output_text: JSON.stringify({ sections: { [key]: {
      value, basis: key === "about" ? "confirmed_business_fact" : "strategic_hypothesis",
    } } }) });
  };

  async function generate(attempt: number, options?: { extraDispatch?: boolean }) {
    const generationAttemptId = id(attempt);
    const version = baseRow.version;
    const common = { account: "categoria-fixture", version, generationAttemptId };
    const generationId = category3GenerationId(secret, generationAttemptId, "preview", accountId, version);
    const sections: AgentBasePilotSection[] = [];
    let catalogState = "";
    let nicheRevision = "";
    if (options?.extraDispatch) {
      failDispatch = true;
      assert.equal((await actions.runAgentBasePilotAction(common)).ok, false);
      failDispatch = false;
    }
    for (const key of keys) {
      const result = await actions.runAgentBasePilotAction({ ...common, previous: sections, catalogState, nicheRevision });
      assert.ok(result.ok, result.ok ? undefined : result.message);
      assert.equal(result.section.key, key);
      assert.ok(result.section.dispatchedOperationId);
      sections.push(result.section);
      ({ catalogState, nicheRevision } = result);
    }
    return { ...common, sections, catalogState, nicheRevision, identity: { ...first, generationId } };
  }

  try {
    const savedRun = await generate(3001);
    assert.ok((await actions.saveAgentBasePilotAction(savedRun)).ok);
    assert.equal(baseRow.version, savedRun.version + 1);
    assert.equal(afterSave.length, 1);
    assert.equal(tables.audit_logs.some(row => row.id === savedRun.identity.generationId), false);
    await afterSave.shift()!();
    const capturedExecutions = tables.openai_cost_executions.filter(row => row.economic_event_id === savedRun.identity.generationId);
    const capturedIds = new Set(capturedExecutions.map(row => row.id));
    assert.equal(capturedExecutions.length, 7);
    assert.equal(translateDialogueLedger(capturedExecutions, tables.openai_cost_operations.filter(row => capturedIds.has(row.execution_id))).totalCalculatedUsd, "0.21");
    assert.ok(tables.audit_logs.some(row => row.id === savedRun.identity.generationId));
    const savedRead = await adapter.readCategory3Cost(savedRun.identity);
    assert.ok(savedRead.ok);
    assert.deepEqual([savedRead.value.outcome, savedRead.value.matchesSavedOperations, savedRead.value.attemptCount, savedRead.value.calculatedCostUsd],
      ["saved", true, 7, "0.21"]);

    const withFailedDispatch = await generate(3002, { extraDispatch: true });
    assert.notEqual(savedRun.identity.generationId, withFailedDispatch.identity.generationId);
    assert.ok((await actions.saveAgentBasePilotAction(withFailedDispatch)).ok);
    await afterSave.shift()!();
    const extraRead = await adapter.readCategory3Cost(withFailedDispatch.identity);
    assert.ok(extraRead.ok);
    assert.deepEqual([extraRead.value.outcome, extraRead.value.matchesSavedOperations, extraRead.value.attemptCount, extraRead.value.calculatedCostUsd],
      ["saved", false, 8, "0.24"]);

    const unavailableAudit = await generate(3003);
    assert.ok((await actions.saveAgentBasePilotAction(unavailableAudit)).ok);
    auditError = true;
    await afterSave.shift()!();
    auditError = false;
    assert.equal(baseRow.version, unavailableAudit.version + 1);
    const uncertain = await adapter.readCategory3Cost(unavailableAudit.identity);
    assert.ok(uncertain.ok);
    assert.equal(uncertain.value.outcome, "unconfirmed");

    const rejected = await generate(3004);
    rejectSave = true;
    assert.equal((await actions.saveAgentBasePilotAction(rejected)).ok, false);
    assert.equal(afterSave.length, 0);
    const rejectedRead = await adapter.readCategory3Cost(rejected.identity);
    assert.ok(rejectedRead.ok);
    assert.equal(rejectedRead.value.outcome, "unconfirmed");
  } finally {
    globalThis.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = originalKey;
    if (originalResourcesFlag === undefined) delete process.env.E25_3_COMMUNICATION_RESOURCES_ENABLED;
    else process.env.E25_3_COMMUNICATION_RESOURCES_ENABLED = originalResourcesFlag;
  }
  console.log("PASS D14F/D10 Category 3 save, evidence failure, rejected save, dispatch coverage, billed retry and separate generations (synthetic external boundaries)");
}
