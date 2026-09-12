import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  filterOpenAiActiveCosts,
  readOpenAiActiveCostPages,
  translateOpenAiActiveCostRows,
} from "./adapters/activeCostReadModelAdapterCore";
import { buildOpenAiCostsFinancialComposition } from "./dashboard";
import {
  calculateOpenAiOperationCost,
  OPENAI_COST_PRICING_CATALOG,
} from "./pricing";

const period = {
  startTime: Date.parse("2026-09-11T00:00:00.000Z") / 1_000,
  endTime: Date.parse("2026-09-12T00:00:00.000Z") / 1_000,
};

async function main() {
  const oneSearch = calculateOpenAiOperationCost({
    model: "gpt-5.6-luna",
    startedAt: "2026-09-11T12:00:00.000Z",
    usage: usage({ inputTokens: 200_000, cachedInputTokens: 20_000, cacheWriteTokens: 10_000, outputTokens: 40_000, totalTokens: 240_000 }),
    webSearchCallCount: 1,
  });
  const twoSearch = calculateOpenAiOperationCost({
    model: "gpt-5.6-luna",
    startedAt: "2026-09-11T12:00:00.000Z",
    usage: usage({ inputTokens: 200_000, cachedInputTokens: 20_000, cacheWriteTokens: 10_000, outputTokens: 40_000, totalTokens: 240_000 }),
    webSearchCallCount: 2,
  });
  assert.equal(oneSearch.costUsd, "0.0949");
  assert.equal(twoSearch.costUsd, "0.1049");
  assert.equal(twoSearch.webSearchPricePerCallUsd, "0.01");
  assert.deepEqual(twoSearch.pricingSnapshot && twoSearch.pricingSnapshot.webSearch, {
    toolVersion: "web-search-2026-09-11-v1",
    unit: "per_call",
    pricePerCallUsd: "0.01",
    callCount: 2,
  });
  assert.equal(calculateOpenAiOperationCost({
    model: "gpt-5.4-mini", startedAt: "2026-09-11T12:00:00Z",
    usage: usage({ inputTokens: 10, outputTokens: 5, totalTokens: 15 }),
  }).costUsd, "0.00003");
  const longContext = calculateOpenAiOperationCost({
    model: "gpt-5.6-terra", startedAt: "2026-09-11T12:00:00Z",
    usage: usage({ inputTokens: 272_001, outputTokens: 1, totalTokens: 272_002 }),
  });
  assert.equal(longContext.costUsd, "1.088022");
  assert.equal(longContext.pricingSnapshot?.contextBand, "long");
  const searchWithoutPrice = calculateOpenAiOperationCost({
    model: "gpt-5.6-luna", startedAt: "2026-09-11T12:00:00Z",
    usage: usage({ inputTokens: 10, outputTokens: 5, totalTokens: 15 }),
    webSearchCallCount: 1,
  }, Object.freeze({ ...OPENAI_COST_PRICING_CATALOG, webSearch: null }));
  assert.deepEqual(searchWithoutPrice, {
    costStatus: "unavailable",
    costUnavailableReason: "web_search_pricing_missing",
    costUsd: null,
    pricingVersion: null,
    pricingEffectiveAt: null,
    pricingSnapshot: null,
    webSearchToolVersion: null,
    webSearchPricePerCallUsd: null,
  });
  for (const [input, reason] of [
    [{ model: "unknown", startedAt: "2026-09-11T12:00:00Z", usage: usage({ inputTokens: 1, outputTokens: 1, totalTokens: 2 }) }, "pricing_not_found"],
    [{ model: "gpt-5.6-luna", startedAt: "2026-09-10T23:59:59Z", usage: usage({ inputTokens: 1, outputTokens: 1, totalTokens: 2 }) }, "pricing_not_effective"],
    [{ model: "gpt-5.6-luna", startedAt: "2026-09-11T12:00:00Z", usage: null }, "usage_missing"],
    [{ model: "gpt-5.6-luna", startedAt: "2026-09-11T12:00:00Z", usage: usage({ inputTokens: 1, cachedInputTokens: 2, outputTokens: 1, totalTokens: 2 }) }, "usage_overlap"],
    [{ model: "gpt-4.1-mini", startedAt: "2026-09-11T12:00:00Z", usage: usage({ inputTokens: 2, cacheWriteTokens: 1, outputTokens: 1, totalTokens: 3 }) }, "cache_write_pricing_missing"],
  ] as const) {
    const result = calculateOpenAiOperationCost(input);
    assert.equal(result.costStatus, "unavailable");
    assert.equal(result.costUnavailableReason, reason);
    assert.equal(result.costUsd, null);
    assert.equal(result.pricingSnapshot, null);
  }

  const rows = [
    activeRow({
      cost_usd: "0.000000000001",
      web_search_call_count: 1,
      web_search_tool_version: "web-search-2026-09-11-v1",
      web_search_price_per_call_usd: "0.01",
    }),
    activeRow({
      operation_sequence: 2,
      operation_id: "40000000-0000-4000-8000-000000000002",
      retry_of_operation_id: "40000000-0000-4000-8000-000000000001",
      cost_status: "unavailable",
      cost_unavailable_reason: "usage_missing",
      cost_usd: null,
      pricing_version: null,
      pricing_effective_at: null,
      pricing_snapshot: null,
      operation_result: "failure",
      operation_failure_category: "provider_error",
    }),
    activeRow({
      cursor_started_at: "2026-09-11T13:00:00.000Z",
      execution_id: "40000000-0000-4000-8000-000000000010",
      operation_sequence: 0,
      universe: "client",
      attribution_status: "unassigned",
      operation_id: null,
      retry_of_operation_id: null,
      model: null,
      reasoning_effort: null,
      configuration_source: null,
      configuration_revision: null,
      prompt_version: null,
      contract_version: null,
      operation_started_at: null,
      operation_finished_at: null,
      operation_result: null,
      operation_failure_category: null,
      input_tokens: null,
      cached_input_tokens: null,
      cache_write_tokens: null,
      output_tokens: null,
      reasoning_tokens: null,
      total_tokens: null,
      web_search_call_count: null,
      web_search_tool_version: null,
      web_search_price_per_call_usd: null,
      pricing_version: null,
      pricing_effective_at: null,
      pricing_snapshot: null,
      cost_status: null,
      cost_unavailable_reason: null,
      cost_usd: null,
    }),
  ];
  const coverageRows = [{
    environment: "production",
    workload: "landing_page_dynamic_market_research",
    activated_at: "2026-09-11T00:00:00.000Z",
    contract_version: "e21.5.3-v1",
  }];
  const translated = translateOpenAiActiveCostRows({ period, rows, coverageRows });
  assert.equal(translated.ok, true);
  if (!translated.ok) throw new Error("active read model must be valid");
  assert.equal(translated.value.totalCalculatedUsd, "0.000000000001");
  assert.equal(translated.value.executionCount, 2);
  assert.equal(translated.value.operationCount, 2);
  assert.equal(translated.value.unavailableOperationCount, 1);
  assert.equal(translated.value.unassignedExecutionCount, 1);
  assert.equal(translated.value.executions[0]?.operations[0]?.webSearchPricePerCallUsd, "0.01");
  assert.equal(translated.value.executions[0]?.operations[1]?.retryOfOperationId, "40000000-0000-4000-8000-000000000001");

  const lossless = translateOpenAiActiveCostRows({
    period,
    coverageRows,
    rows: [activeRow({
      cost_usd: "9007199254740993.123456789012",
      web_search_call_count: 1,
      web_search_tool_version: "web-search-2026-09-11-v1",
      web_search_price_per_call_usd: "9007199254740993.987654321012",
    })],
  });
  assert.equal(lossless.ok, true);
  assert.equal(lossless.ok && lossless.value.totalCalculatedUsd, "9007199254740993.123456789012");
  assert.equal(
    lossless.ok && lossless.value.executions[0]?.operations[0]?.webSearchPricePerCallUsd,
    "9007199254740993.987654321012",
  );

  const filtered = filterOpenAiActiveCosts(translated.value, { universe: "client" });
  assert.equal(filtered.executionCount, 1);
  assert.equal(filtered.totalCalculatedUsd, "0");
  assert.equal(translated.value.totalCalculatedUsd, "0.000000000001");

  let pageCalls = 0;
  const paged = await readOpenAiActiveCostPages({
    period,
    readCoverage: async () => ({ data: coverageRows, error: null }),
    readPage: async (cursor, limit) => {
      assert.equal(limit, 1);
      const page = rows.slice(pageCalls, pageCalls + 1);
      if (page.length > 0 && cursor) {
        assert.equal(cursor.executionId, rows[pageCalls - 1]?.execution_id);
      }
      pageCalls += 1;
      return { data: page, error: null };
    },
  }, 1);
  assert.deepEqual(paged, translated);
  assert.equal(pageCalls, 4);

  const manyRows = Array.from({ length: 1_001 }, (_, index) => activeRow({
    operation_sequence: index + 1,
    operation_id: `40000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`,
    cost_usd: "0.000000000001",
  }));
  let offset = 0;
  const many = await readOpenAiActiveCostPages({
    period,
    readCoverage: async () => ({ data: coverageRows, error: null }),
    readPage: async (cursor, limit) => {
      assert.equal(cursor?.operationSequence ?? 0, offset);
      const page = manyRows.slice(offset, offset + limit);
      offset += page.length;
      return { data: page, error: null };
    },
  });
  assert.equal(many.ok && many.value.operationCount, 1_001);
  assert.equal(many.ok && many.value.totalCalculatedUsd, "0.000000001001");

  for (const invalidRows of [
    [rows[1], rows[0]],
    [rows[0], rows[0]],
    [{ ...rows[0], cost_status: "calculated", cost_usd: null }],
    [{ ...rows[0], cost_usd: 0.000000000001 }],
    [{ ...rows[0], web_search_price_per_call_usd: 0.01 }],
    [{ ...rows[0], cost_usd: "-0.000000000001" }],
    [{ ...rows[0], web_search_price_per_call_usd: Number.POSITIVE_INFINITY }],
    [{ ...rows[0], attribution_status: "unassigned", account_id: "40000000-0000-4000-8000-000000000099" }],
  ]) {
    const result = translateOpenAiActiveCostRows({ period, rows: invalidRows, coverageRows });
    assert.equal(result.ok ? "ok" : result.error.code, "INVALID_RESPONSE");
  }

  const official = {
    ok: true as const,
    value: { currency: "usd" as const, totalUsd: "10", startTime: period.startTime, endTime: period.endTime, bucketCount: 1, pageCount: 1, fetchedAt: "2026-09-12T00:00:01Z" },
  };
  const legacy = {
    ok: true as const,
    value: { totalUsd: "3", coverageActivatedAt: null, coverageStatus: "not_activated" as const, internalUpdatedAt: null, attemptCount: 0, unpricedAttemptCount: 0, pendingAttemptCount: 0, providerCreditFailureCount: 0, accounts: [] },
  };
  const composition = buildOpenAiCostsFinancialComposition({
    selection: { mode: "custom", startDate: "2026-09-11", endDate: "2026-09-11", period, provisional: false },
    official, active: translated, legacy, activeFilters: { universe: "client" },
  });
  assert.ok(composition);
  assert.equal(composition.globalReconciliationUsd, "6.999999999999");
  assert.equal(composition.active?.totalCalculatedUsd, "0.000000000001");
  assert.equal(composition.filteredActive?.totalCalculatedUsd, "0");
  const incomplete = buildOpenAiCostsFinancialComposition({
    selection: composition.selection, official,
    active: { ok: false, error: { code: "READ_FAILED", message: "sanitized" } },
    legacy,
  });
  assert.ok(incomplete);
  assert.equal(incomplete.globalReconciliationUsd, null);

  const migration = readFileSync("supabase/migrations/20260911190000_e21_5_4_openai_cost_calculation_read_model.sql", "utf8");
  assert.match(migration, /finish_openai_cost_operation_v2/);
  assert.match(migration, /read_openai_active_cost_rows_v1/);
  assert.match(migration, /order by e\.started_at, e\.id, coalesce\(o\.sequence, 0\)/);
  assert.equal(migration.includes("openai_lp_"), false);
  const losslessMigration = readFileSync("supabase/migrations/20260912190000_e21_5_lossless_active_cost_read_model.sql", "utf8");
  assert.match(losslessMigration, /web_search_price_per_call_usd text/);
  assert.match(losslessMigration, /cost_usd text/);
  assert.match(losslessMigration, /o\.web_search_price_per_call_usd::text/);
  assert.match(losslessMigration, /o\.cost_usd::text/);
  const adapter = readFileSync("lib/openai-costs/adapters/activeCostReadModelAdapter.ts", "utf8");
  assert.match(adapter, /import "server-only"/);
  assert.match(adapter, /p_after_operation_sequence/);
  console.log("PASS E21.5.4 pricing, keyset read model and global reconciliation");
}

function usage(overrides: Record<string, number | null>) {
  return {
    inputTokens: null,
    cachedInputTokens: null,
    cacheWriteTokens: null,
    outputTokens: null,
    reasoningTokens: null,
    totalTokens: null,
    ...overrides,
  };
}

function activeRow(overrides: Record<string, unknown>) {
  return {
    cursor_started_at: "2026-09-11T12:00:00.000Z",
    execution_id: "40000000-0000-4000-8000-000000000000",
    operation_sequence: 1,
    workload: "landing_page_dynamic_market_research",
    environment: "production",
    execution_origin: "runtime",
    universe: "lp_factory",
    attribution_status: "attributed",
    account_id: null,
    baseline_reference: null,
    baseline_version: null,
    execution_finished_at: "2026-09-11T12:00:03.000Z",
    execution_result: "success",
    execution_failure_category: null,
    operation_id: "40000000-0000-4000-8000-000000000001",
    retry_of_operation_id: null,
    model: "gpt-5.6-luna",
    reasoning_effort: "high",
    configuration_source: "repo_catalog",
    configuration_revision: "v1",
    prompt_version: null,
    contract_version: null,
    request_id: null,
    provider_response_id: null,
    provider_request_id: null,
    input_tokens: 1,
    cached_input_tokens: 0,
    cache_write_tokens: 0,
    output_tokens: 1,
    reasoning_tokens: 0,
    total_tokens: 2,
    web_search_call_count: 0,
    web_search_tool_version: null,
    web_search_price_per_call_usd: null,
    pricing_version: "2026-09-11-standard-v1",
    pricing_effective_at: "2026-09-11T00:00:00.000Z",
    pricing_snapshot: { model: "gpt-5.6-luna" },
    cost_status: "calculated",
    cost_unavailable_reason: null,
    cost_usd: "0.0000014",
    operation_started_at: "2026-09-11T12:00:01.000Z",
    operation_finished_at: "2026-09-11T12:00:02.000Z",
    operation_result: "success",
    operation_failure_category: null,
    http_status: 200,
    provider_error_code: null,
    provider_error_type: null,
    ...overrides,
  };
}

void main();
