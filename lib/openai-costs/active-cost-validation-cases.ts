import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  filterOpenAiActiveCosts,
  readOpenAiActiveCostPages,
  translateOpenAiActiveCostRows,
} from "./adapters/activeCostReadModelAdapterCore";
import { buildOpenAiCostsFinancialComposition } from "./dashboard";
import { buildOpenAiEconomicHierarchy } from "./economic-hierarchy";
import { buildOccurrenceCostDetail } from "./occurrence-costs";
import { summarizeOccurrencePeriod } from "./occurrence-period";
import {
  calculateOpenAiOperationCost as calculateCost,
  OPENAI_COST_PRICING_CATALOGS,
} from "./pricing";
import { validateDialogueCosts } from "./dialogue-cost-validation-cases";
import { validatePricingCorrection } from "./pricing-validation-cases";

// Historical fixtures describe a proven Standard response and 30-minute writes.
function calculateOpenAiOperationCost(input: Parameters<typeof calculateCost>[0], catalog?: Parameters<typeof calculateCost>[1]) {
  return calculateCost({ ...input, appliedModel: input.model, appliedServiceTier: "default", modality: "responses_text",
    cacheWriteTokens30m: input.usage?.cacheWriteTokens ?? 0, cacheWriteTokens12h: 0 }, catalog);
}

const period = {
  startTime: Date.parse("2026-09-11T00:00:00.000Z") / 1_000,
  endTime: Date.parse("2026-09-12T00:00:00.000Z") / 1_000,
};

async function main() {
  await validatePricingCorrection();
  await validateDialogueCosts();
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
  assert.equal(twoSearch.pricingVersion, "2026-09-11-standard-v1");
  assert.equal(twoSearch.pricingEffectiveAt, "2026-09-11T00:00:00.000Z");
  const beforePricingCut = "2026-09-27T22:41:14.999Z";
  const afterPricingCut = "2026-09-27T22:41:15.000Z";
  const comparisonUsage = usage({ inputTokens: 1_000, outputTokens: 500, totalTokens: 1_500 });
  assert.equal(calculateOpenAiOperationCost({
    model: "gpt-5.4-mini", startedAt: beforePricingCut, usage: comparisonUsage,
  }).pricingVersion, "2026-09-11-standard-v1");
  const lunaShort = calculateOpenAiOperationCost({
    model: "gpt-6-luna", startedAt: afterPricingCut, usage: comparisonUsage,
    webSearchCallCount: 1,
  });
  assert.equal(lunaShort.costUsd, "0.01035");
  assert.equal(lunaShort.pricingVersion, "2026-09-27-standard-v2");
  assert.equal(lunaShort.pricingEffectiveAt, afterPricingCut);
  assert.equal(calculateOpenAiOperationCost({
    model: "gpt-6-luna", startedAt: afterPricingCut, usage: comparisonUsage,
    webSearchRequested: true, webSearchCallCount: null,
  }).costUnavailableReason, "web_search_usage_missing");
  assert.equal(calculateOpenAiOperationCost({
    model: "gpt-6-luna", startedAt: afterPricingCut, usage: comparisonUsage,
    webSearchRequested: true, webSearchCallCount: 0,
  }).costUsd, "0.00035");
  assert.equal(calculateOpenAiOperationCost({
    model: "gpt-6-sol", startedAt: afterPricingCut, usage: comparisonUsage,
    webSearchCallCount: 1,
  }).costUsd, "0.017");
  assert.equal(calculateOpenAiOperationCost({
    model: "gpt-6-luna", startedAt: beforePricingCut, usage: comparisonUsage,
  }).costUnavailableReason, "pricing_not_found");
  const longComparisonUsage = usage({ inputTokens: 272_001, outputTokens: 1, totalTokens: 272_002 });
  assert.equal(calculateOpenAiOperationCost({
    model: "gpt-6-luna", startedAt: afterPricingCut, usage: longComparisonUsage,
    webSearchCallCount: 1,
  }).costUsd, "0.06440095");
  assert.equal(calculateOpenAiOperationCost({
    model: "gpt-6-sol", startedAt: afterPricingCut, usage: longComparisonUsage,
    webSearchCallCount: 1,
  }).costUsd, "1.098019");
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
    model: "gpt-5.6-luna", startedAt: afterPricingCut,
    usage: usage({ inputTokens: 10, outputTokens: 5, totalTokens: 15 }),
    webSearchCallCount: 1,
  }, Object.freeze({ ...OPENAI_COST_PRICING_CATALOGS[1], webSearch: null }));
  assert.deepEqual(searchWithoutPrice, {
    costStatus: "unavailable",
    costUnavailableReason: "web_search_pricing_missing",
    costUsd: null,
    pricingVersion: null,
    pricingEffectiveAt: null,
    pricingSnapshot: { appliedModel: "gpt-5.6-luna", appliedServiceTier: "default", requestedServiceTier: null,
      modality: "responses_text", cacheWriteTokens30m: 0, cacheWriteTokens12h: 0 },
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
    assert.equal(result.pricingSnapshot?.appliedServiceTier, "default");
  }

  const rows = [
    activeRow({
      cost_usd: "0.000000000001",
      web_search_call_count: 1,
      web_search_tool_version: "web-search-2026-09-11-v1",
      web_search_price_per_call_usd: "0.01",
      pricing_snapshot: { model: "gpt-5.6-luna", appliedModel: "gpt-6.1-terra", requestedServiceTier: "fast",
        appliedServiceTier: "default", modality: "responses_text", contextBand: "long",
        cacheWriteTokens30m: 3000, cacheWriteTokens12h: 4000, private_payload: "DO_NOT_EXPOSE" },
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
  // The hosted ledger has 16 coverage rows; the former fixed cap of 15 hid every active cost.
  const coverageMatrix = ["production", "preview", "development"].flatMap((environment) => [
    "niche_resolution", "pending_setup_conversation", "commercial_activation_draft_generation",
    "communication_base_stage1_assistance", "communication_base_stage2_intelligence", "supabase_inspect",
    "landing_page_dynamic_market_research", "taxon_input_catalog_sufficiency_evaluation",
  ].map((workload) => ({ ...coverageRows[0], environment, workload })));
  for (const count of [16, 24]) {
    const fullCoverage = translateOpenAiActiveCostRows({ period, rows, coverageRows: coverageMatrix.slice(0, count) });
    assert.ok(fullCoverage.ok, `all ${count} valid coverage rows must remain readable`);
    assert.equal(fullCoverage.value.coverage.length, count);
  }
  assert.equal(translateOpenAiActiveCostRows({ period, rows,
    coverageRows: [...coverageMatrix, coverageMatrix[0]] }).ok, false, "overflow/duplicate coverage must fail closed");
  assert.equal(translateOpenAiActiveCostRows({ period, rows,
    coverageRows: [{ ...coverageRows[0], workload: "unregistered_workload" }] }).ok, false);
  const translated = translateOpenAiActiveCostRows({ period, rows, coverageRows });
  assert.equal(translated.ok, true);
  if (!translated.ok) throw new Error("active read model must be valid");
  assert.equal(translated.value.totalCalculatedUsd, "0.000000000001");
  assert.equal(translated.value.economicDimensionStatus, "v2_active");
  assert.equal(translated.value.executionCount, 2);
  assert.equal(translated.value.operationCount, 2);
  assert.equal(translated.value.unavailableOperationCount, 1);
  assert.equal(translated.value.unassignedExecutionCount, 1);
  assert.equal(translated.value.executions[0]?.operations[0]?.webSearchPricePerCallUsd, "0.01");
  assert.equal(translated.value.executions[0]?.operations[0]?.requestedServiceTier, "fast");
  assert.equal(translated.value.executions[0]?.operations[0]?.appliedServiceTier, "default");
  assert.equal(translated.value.executions[0]?.operations[0]?.cacheWriteTokens12h, 4000);
  assert.ok(!JSON.stringify(translated.value).includes("DO_NOT_EXPOSE"));
  assert.equal(translated.value.executions[0]?.operations[1]?.appliedServiceTier, null, "old absent evidence stays absent");
  assert.equal(translated.value.executions[0]?.operations[1]?.retryOfOperationId, "40000000-0000-4000-8000-000000000001");
  assert.deepEqual(translated.value.modelGroups, [
    { model: "gpt-6.1-terra", calculatedCostUsd: "0.000000000001", operationCount: 1, pendingOperationCount: 0, unavailableOperationCount: 0 },
    { model: null, calculatedCostUsd: null, operationCount: 1, pendingOperationCount: 0, unavailableOperationCount: 1 },
  ]);
  validateModelTotals();
  await validateOccurrencePeriods();

  const factualHistory = translateOpenAiActiveCostRows({
    period,
    rows: rows.map((row) => ({ ...row, workload: "taxon_input_catalog_sufficiency_evaluation" })),
    coverageRows: coverageRows.map((row) => ({ ...row, workload: "taxon_input_catalog_sufficiency_evaluation" })),
  });
  assert.ok(factualHistory.ok, "retired factual financial history must remain readable");
  assert.equal(factualHistory.value.totalCalculatedUsd, translated.value.totalCalculatedUsd);
  assert.equal(factualHistory.value.executionCount, translated.value.executionCount);
  assert.ok(factualHistory.value.executions.every((item) => item.workload === "taxon_input_catalog_sufficiency_evaluation"));

  const correlated = translateOpenAiActiveCostRows({
    period,
    coverageRows,
    rows: [activeRow({
      cursor_started_at: "2026-09-11T14:00:00.000Z",
      execution_id: "40000000-0000-4000-8000-000000000020",
      operation_id: "40000000-0000-4000-8000-000000000021",
      workload: "niche_resolution",
      universe: "client",
      attribution_status: "attributed",
      account_id: "40000000-0000-4000-8000-000000000099",
      account_name: "Cliente econômico",
      economic_event_kind: "niche_resolution",
      economic_event_id: "40000000-0000-4000-8000-000000000088",
    })],
  });
  assert.equal(correlated.ok, true);
  if (!correlated.ok) throw new Error("correlated read model must be valid");
  assert.deepEqual(correlated.value.executions[0]?.economicEvent, {
    kind: "niche_resolution",
    eventId: "40000000-0000-4000-8000-000000000088",
  });

  const longAccountName = "A".repeat(257);
  const longAccount = translateOpenAiActiveCostRows({
    period,
    coverageRows,
    rows: [activeRow({
      cursor_started_at: "2026-09-11T14:30:00.000Z",
      execution_id: "40000000-0000-4000-8000-000000000030",
      universe: "client",
      attribution_status: "attributed",
      account_id: "40000000-0000-4000-8000-000000000099",
      account_name: longAccountName,
      workload: "niche_resolution",
      economic_event_kind: "niche_resolution",
      economic_event_id: "40000000-0000-4000-8000-000000000031",
    })],
  });
  assert.equal(longAccount.ok, true);
  if (!longAccount.ok) throw new Error("account names beyond 256 characters must remain valid");
  assert.equal(longAccount.value.executions[0]?.accountName, longAccountName);

  const hierarchy = buildOpenAiEconomicHierarchy(correlated.value, {
    totalUsd: "0.25",
    coverageActivatedAt: null,
    coverageStatus: "not_activated",
    internalUpdatedAt: null,
    attemptCount: 1,
    unpricedAttemptCount: 0,
    pendingAttemptCount: 0,
    providerCreditFailureCount: 0,
    accounts: [{
      accountId: "40000000-0000-4000-8000-000000000099",
      accountName: "Cliente econômico",
      totalUsd: "0.25",
      attemptCount: 1,
      unpricedAttemptCount: 0,
      pendingAttemptCount: 0,
      landingPages: [{
        landingPageId: "40000000-0000-4000-8000-000000000077",
        landingPageName: "LP histórica",
        totalUsd: "0.25",
        attemptCount: 1,
        unpricedAttemptCount: 0,
        pendingAttemptCount: 0,
        workloads: [{
          workload: "landing_page_draft_generation",
          totalUsd: "0.25",
          attemptCount: 1,
          unpricedAttemptCount: 0,
          pendingAttemptCount: 0,
        }],
      }],
    }],
  });
  assert.equal(hierarchy.clients.calculatedCostUsd, "0.2500014");
  assert.equal(hierarchy.clients.accounts[0]?.events.length, 2);
  assert.equal(hierarchy.clients.accounts[0]?.events[1]?.label, "Resolução de nicho — 2026-09-11T14:00:00.000Z");

  const fallback = translateOpenAiActiveCostRows({
    period,
    rows: [activeRow({})],
    coverageRows,
    economicDimensionStatus: "v1_fallback",
  });
  assert.equal(fallback.ok && fallback.value.economicDimensionStatus, "v1_fallback");
  assert.equal(fallback.ok && fallback.value.executions[0]?.economicEvent, null);

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
    [{ ...rows[0], economic_event_kind: "niche_resolution", economic_event_id: rows[0].execution_id }],
    [{ ...rows[0], economic_event_kind: "lp_factory_internal", economic_event_id: "40000000-0000-4000-8000-000000000090", taxon_id: "40000000-0000-4000-8000-000000000091", taxon_name: null }],
    [{ ...rows[0], universe: "client", attribution_status: "attributed", account_id: "40000000-0000-4000-8000-000000000099", account_name: null }],
    [{ ...rows[0], universe: "lp_factory", attribution_status: "attributed", account_id: null, account_name: "Nome incompatível" }],
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
  assert.equal(incomplete.economicHierarchy?.activeAvailable, false);
  assert.equal(incomplete.economicHierarchy?.legacyAvailable, true);
  assert.equal(incomplete.economicHierarchy?.clients.calculatedCostUsd, "3");
  const missingLegacy = buildOpenAiCostsFinancialComposition({
    selection: composition.selection, official,
    active: translated,
    legacy: { ok: false, error: { code: "READ_FAILED", message: "sanitized" } },
  });
  assert.ok(missingLegacy);
  assert.equal(missingLegacy.economicHierarchy?.activeAvailable, true);
  assert.equal(missingLegacy.economicHierarchy?.legacyAvailable, false);
  assert.equal(missingLegacy.economicHierarchy?.lpFactory.calculatedCostUsd, "0.000000000001");

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
  const economicMigration = readFileSync("supabase/migrations/20260912215000_e21_5_6_openai_cost_event_correlation.sql", "utf8");
  assert.match(economicMigration, /economic_event_chk check \(\([\s\S]*\) is true\)/);
  assert.equal(/update\s+public\.openai_cost_executions/i.test(economicMigration), false);
  console.log("PASS E21.5.4 pricing, keyset read model and global reconciliation");
}

function usage(overrides: Record<string, number | null>) {
  return {
    inputTokens: null,
    cachedInputTokens: 0,
    cacheWriteTokens: 0,
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
    account_name: null,
    economic_event_kind: null,
    economic_event_id: null,
    landing_page_id: null,
    landing_page_name: null,
    taxon_id: null,
    taxon_name: null,
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

async function validateOccurrencePeriods() {
  const account = "40000000-0000-4000-8000-000000000099";
  const occurrence = "40000000-0000-4000-8000-000000000098";
  const operation = "40000000-0000-4000-8000-000000000001";
  const october = "2026-10-01T00:00:00Z";
  const november = "2026-11-01T00:00:00Z";
  const december = "2026-12-01T00:00:00Z";
  const time = (value: string) => Date.parse(value) / 1000;
  const example = (start: string, overrides: Record<string, unknown>) => activeRow({
    cursor_started_at: start,
    execution_started_at: "2026-10-31T23:59:58Z",
    execution_finished_at: "2026-11-01T00:00:03Z",
    operation_started_at: start,
    operation_finished_at: "2026-11-01T00:00:03Z",
    occurrence_id: occurrence,
    occurrence_closed_at: "2026-11-01T00:00:04Z",
    workload: "communication_base_stage2_intelligence",
    universe: "client", account_id: account, account_name: "Conta de teste",
    product_type: "communication_base", product_instance_id: account, action_kind: "category_3_generate",
    ...overrides,
  });
  const first = example("2026-10-31T23:59:59.999999Z", { cost_usd: "0.03" });
  const retry = example("2026-11-01T00:00:00.000001Z", {
    operation_id: "40000000-0000-4000-8000-000000000002", operation_sequence: 2, retry_of_operation_id: operation,
    operation_result: "failure", operation_failure_category: "provider_error", cost_usd: "0.05",
  });
  const unavailable = example("2026-11-01T00:00:00.000002Z", {
    operation_id: "40000000-0000-4000-8000-000000000003", operation_sequence: 3,
    cost_status: "unavailable", cost_usd: null, cost_unavailable_reason: "usage_missing",
  });
  const read = (start: string, end: string, rows: readonly unknown[]) => {
    const result = translateOpenAiActiveCostRows({
      period: { startTime: time(start), endTime: time(end) }, rows, coverageRows: [],
      economicDimensionStatus: "v3_operation_period",
    });
    assert(result.ok);
    return result.value;
  };
  const oct = read(october, november, [first]);
  const nov = read(november, december, [retry]);
  for (const [model, amount] of [[oct, "0.03"], [nov, "0.05"]] as const) {
    const filtered = filterOpenAiActiveCosts(model, { accountId: account, product: "communication_base" });
    assert.equal(model.totalCalculatedUsd, amount);
    assert.equal(model.groups[0].calculatedCostUsd, amount);
    assert.equal(model.modelGroups[0].calculatedCostUsd, amount);
    assert.equal(buildOpenAiEconomicHierarchy(model, null).clients.calculatedCostUsd, amount);
    assert.equal(buildOpenAiEconomicHierarchy(model, null).clients.accounts[0].calculatedCostUsd, amount);
    const summary = summarizeOccurrencePeriod(filtered);
    assert.equal(summary.rows[0].id, occurrence);
    assert.equal(summary.rows[0].cost, amount);
    assert.deepEqual(summary.byAction, [{ action: "category_3_generate", cost: amount, incomplete: false }]);
  }
  const combined = read(october, december, [first, retry]);
  const detail = buildOccurrenceCostDetail(occurrence, "2026-11-01T00:00:04Z", combined.executions);
  assert.equal(detail.calculatedCostUsd, "0.08");
  assert.equal(detail.operationCount, 2);
  const partial = summarizeOccurrencePeriod(read(november, december, [retry, unavailable]));
  assert.equal(partial.rows[0].status, "partial");
  assert.equal(partial.rows[0].cost, "0.05");
  const cursors: (string | null)[] = [];
  const pages = [[retry], [unavailable], []];
  const result = await readOpenAiActiveCostPages({
    period: { startTime: time(november), endTime: time(december) },
    economicDimensionStatus: "v3_operation_period",
    readCoverage: async () => ({ data: [], error: null }),
    readPage: async cursor => {
      cursors.push(cursor?.startedAt ?? null);
      return { data: pages.shift(), error: null };
    },
  }, 1);
  assert(result.ok);
  assert.deepEqual(cursors, [null, "2026-11-01T00:00:00.000001Z", "2026-11-01T00:00:00.000002Z"]);
  assert.equal(result.value.operationCount, 2);
}

function validateModelTotals() {
  const accountId = "40000000-0000-4000-8000-000000000099";
  const workload = "niche_resolution";
  const firstId = "40000000-0000-4000-8000-000000000001";
  const clientOperations = [
    activeRow({ cost_usd: "0.03", pricing_snapshot: { model: "gpt-5.6-luna", appliedModel: "gpt-6.1-terra" } }),
    activeRow({
      operation_sequence: 2,
      operation_id: "40000000-0000-4000-8000-000000000002",
      retry_of_operation_id: firstId,
      operation_started_at: "2026-09-12T00:00:00.000Z",
      operation_finished_at: "2026-09-12T00:00:01.000Z",
      operation_result: "failure",
      operation_failure_category: "provider_error",
      cost_usd: "0.05",
      pricing_snapshot: { model: "gpt-6.2-sol" },
    }),
    activeRow({
      operation_sequence: 3,
      operation_id: "40000000-0000-4000-8000-000000000003",
      operation_finished_at: null,
      operation_result: null,
      cost_status: "unavailable",
      cost_unavailable_reason: "operation_pending",
      cost_usd: null,
      pricing_version: null,
      pricing_effective_at: null,
      pricing_snapshot: null,
    }),
  ].map(row => ({
    ...row, universe: "client", account_id: accountId, account_name: "Conta sintética", workload,
    execution_finished_at: "2026-09-12T00:00:02.000Z",
  }));
  const read = translateOpenAiActiveCostRows({
    period: { ...period, endTime: period.endTime + 86_400 },
    coverageRows: [],
    rows: [
      ...clientOperations,
      activeRow({ execution_id: "40000000-0000-4000-8000-000000000010",
        operation_id: "40000000-0000-4000-8000-000000000011", cost_usd: "0.02", pricing_snapshot: {} }),
      activeRow({ execution_id: "40000000-0000-4000-8000-000000000012",
        operation_id: "40000000-0000-4000-8000-000000000013", cost_usd: "0" }),
    ],
  });
  assert.ok(read.ok);
  assert.deepEqual(read.value.modelGroups.map(group => [group.model, group.calculatedCostUsd, group.operationCount]), [
    ["gpt-5.6-luna", "0", 1], ["gpt-6.1-terra", "0.03", 1], ["gpt-6.2-sol", "0.05", 1], [null, "0.02", 2],
  ]);
  assert.equal(read.value.totalCalculatedUsd, "0.1");
  assert.equal(read.value.groups.find(group => group.accountId === accountId)?.calculatedCostUsd, "0.08");
  const filtered = filterOpenAiActiveCosts(read.value, { accountId, universe: "client", workload });
  assert.equal(filtered.totalCalculatedUsd, "0.08");
  assert.deepEqual(filtered.modelGroups.map(group => [group.model, group.calculatedCostUsd]), [
    ["gpt-6.1-terra", "0.03"], ["gpt-6.2-sol", "0.05"], [null, null],
  ]);
  assert.equal(filtered.modelGroups.at(-1)?.pendingOperationCount, 1);
  console.log("PASS D10D model totals match the active ledger, with exact decimals, filters, billed retries and unavailable evidence");
}

void main();
