import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";

import { refreshOpenAiCostsActionCore } from "./action-core";
import {
  readOpenAiLpCostPages,
  translateOpenAiLpCostRows,
} from "../../../../lib/openai-costs/adapters/lpCostReadModelAdapterCore";
import {
  buildOpenAiCostsDashboard,
  buildOpenAiCostsFinancialComposition,
  parseOpenAiActiveCostFilters,
  parseOpenAiCostsPeriodSelection,
} from "../../../../lib/openai-costs/dashboard";

async function runValidationCases() {
const now = new Date("2026-08-28T15:00:00.000Z");
const current = parseOpenAiCostsPeriodSelection({
  mode: "current_month",
  startDate: null,
  endDate: null,
}, now);
assert.ok(current);
assert.deepEqual(current, {
  mode: "current_month",
  startDate: "2026-08-01",
  endDate: "2026-08-28",
  period: {
    startTime: Date.parse("2026-08-01T00:00:00.000Z") / 1_000,
    endTime: Date.parse("2026-08-28T15:00:00.000Z") / 1_000,
  },
  provisional: true,
});
assert.equal(parseOpenAiCostsPeriodSelection({
  mode: "custom",
  startDate: "2026-02-01",
  endDate: "2026-08-28",
}, now), null);
assert.equal(parseOpenAiCostsPeriodSelection({
  mode: "custom",
  startDate: "2026-08-29",
  endDate: "2026-08-29",
}, now), null);

const eventRows = [
  row({ attempt_id: "e2145000-0000-4000-8000-000000000001", cost_usd: "0.25" }),
  row({
    attempt_id: "e2145000-0000-4000-8000-000000000002",
    workload: "landing_page_draft_image_generation",
    terminal_at: null,
    result: null,
    cost_usd: null,
  }),
  row({
    attempt_id: "e2145000-0000-4000-8000-000000000003",
    result: "failure",
    cost_usd: null,
    http_status: 429,
    provider_error_code: "credit_balance_exhausted",
    provider_error_type: "insufficient_quota",
  }),
];
const internal = translateOpenAiLpCostRows({
  period: current.period,
  eventRows,
  coverageRows: [{ activated_at: "2026-08-10T03:00:00.000Z" }],
});
assert.equal(internal.ok, true);
if (!internal.ok) throw new Error("internal read model should be valid");
assert.equal(internal.value.totalUsd, "0.25");
assert.equal(internal.value.coverageStatus, "degraded");
assert.equal(internal.value.accounts[0]?.landingPages[0]?.workloads.length, 2);
assert.equal(internal.value.pendingAttemptCount, 1);
assert.equal(internal.value.providerCreditFailureCount, 1);

const completeCoverage = translateOpenAiLpCostRows({
  period: current.period,
  eventRows: [eventRows[0]],
  coverageRows: [{ activated_at: "2026-08-01T00:00:00.000Z" }],
});
assert.equal(completeCoverage.ok && completeCoverage.value.coverageStatus, "complete");
const partialCoverage = translateOpenAiLpCostRows({
  period: current.period,
  eventRows: [eventRows[0]],
  coverageRows: [{ activated_at: "2026-08-10T03:00:00.000Z" }],
});
assert.equal(partialCoverage.ok && partialCoverage.value.coverageStatus, "partial");

const dashboard = buildOpenAiCostsDashboard({
  selection: current,
  official: {
    ok: true,
    value: {
      currency: "usd",
      totalUsd: "0.2",
      startTime: current.period.startTime,
      endTime: current.period.endTime,
      bucketCount: 1,
      pageCount: 1,
      fetchedAt: "2026-08-28T15:00:01.000Z",
    },
  },
  internal,
});
assert.ok(dashboard);
assert.equal(dashboard.reconciliationUsd, "-0.05");
assert.equal(dashboard.reconciliationAnomalous, true);
const unavailable = buildOpenAiCostsDashboard({
  selection: current,
  official: {
    ok: true,
    value: {
      currency: "usd",
      totalUsd: "0.2",
      startTime: current.period.startTime,
      endTime: current.period.endTime,
      bucketCount: 1,
      pageCount: 1,
      fetchedAt: "2026-08-28T15:00:01.000Z",
    },
  },
  internal: {
    ok: false,
    error: { code: "READ_FAILED", message: "sanitized" },
  },
});
assert.ok(unavailable);
assert.equal(unavailable.internal, null);
assert.equal(unavailable.internalErrorCode, "READ_FAILED");

const activeFilters = parseOpenAiActiveCostFilters({
  universe: "client",
  accountId: "e2155000-0000-4000-8000-000000000010",
  workload: "niche_resolution",
});
assert.deepEqual(activeFilters, {
  universe: "client",
  accountId: "e2155000-0000-4000-8000-000000000010",
  workload: "niche_resolution",
});
assert.equal(parseOpenAiActiveCostFilters({ universe: "lp_factory", accountId: "e2155000-0000-4000-8000-000000000010", workload: "" }), null);
assert.equal(parseOpenAiActiveCostFilters({ universe: "client", accountId: "not-a-uuid", workload: "" }), null);
assert.equal(parseOpenAiActiveCostFilters({ universe: "", accountId: "", workload: "unknown" }), null);

const activeModel = {
  totalCalculatedUsd: "0.05",
  executionCount: 1,
  operationCount: 2,
  pendingOperationCount: 0,
  unavailableOperationCount: 1,
  unassignedExecutionCount: 0,
  internalUpdatedAt: "2026-08-28T14:30:00.000Z",
  coverage: [{
    environment: "production" as const,
    workload: "niche_resolution" as const,
    activatedAt: "2026-08-20T00:00:00.000Z",
    contractVersion: "e21.5.3-v1",
  }],
  groups: [{
    universe: "client" as const,
    attributionStatus: "attributed" as const,
    accountId: "e2155000-0000-4000-8000-000000000010",
    workload: "niche_resolution" as const,
    calculatedCostUsd: "0.05",
    executionCount: 1,
    operationCount: 2,
    pendingOperationCount: 0,
    unavailableOperationCount: 1,
  }],
  executions: [{
    executionId: "e2155000-0000-4000-8000-000000000020",
    workload: "niche_resolution" as const,
    environment: "production" as const,
    executionOrigin: "runtime" as const,
    universe: "client" as const,
    attributionStatus: "attributed" as const,
    accountId: "e2155000-0000-4000-8000-000000000010",
    baselineReference: "baseline-e21",
    baselineVersion: "v1",
    startedAt: "2026-08-28T14:00:00.000Z",
    finishedAt: "2026-08-28T14:30:00.000Z",
    result: "success" as const,
    failureCategory: null,
    calculatedCostUsd: "0.05",
    pendingOperationCount: 0,
    unavailableOperationCount: 1,
    operations: [{
      operationId: "e2155000-0000-4000-8000-000000000030",
      sequence: 1,
      retryOfOperationId: null,
      model: "model-e21-fixture",
      reasoningEffort: "none" as const,
      configurationSource: "repo_catalog" as const,
      configurationRevision: "v2",
      promptVersion: null,
      contractVersion: "e21.5.3-v1",
      startedAt: "2026-08-28T14:00:00.000Z",
      finishedAt: "2026-08-28T14:10:00.000Z",
      result: "success" as const,
      failureCategory: null,
      inputTokens: 10,
      cachedInputTokens: 0,
      cacheWriteTokens: 0,
      outputTokens: 2,
      reasoningTokens: 0,
      totalTokens: 12,
      webSearchCallCount: 0,
      webSearchToolVersion: null,
      webSearchPricePerCallUsd: null,
      pricingVersion: "2026-09-11-standard-v1",
      pricingEffectiveAt: "2026-09-11T00:00:00.000Z",
      costStatus: "calculated" as const,
      costUnavailableReason: null,
      costUsd: "0.05",
    }, {
      operationId: "e2155000-0000-4000-8000-000000000031",
      sequence: 2,
      retryOfOperationId: "e2155000-0000-4000-8000-000000000030",
      model: "unknown-model",
      reasoningEffort: "none" as const,
      configurationSource: "repo_catalog" as const,
      configurationRevision: "v2",
      promptVersion: null,
      contractVersion: "e21.5.3-v1",
      startedAt: "2026-08-28T14:11:00.000Z",
      finishedAt: "2026-08-28T14:20:00.000Z",
      result: "failure" as const,
      failureCategory: "provider_error",
      inputTokens: null,
      cachedInputTokens: null,
      cacheWriteTokens: null,
      outputTokens: null,
      reasoningTokens: null,
      totalTokens: null,
      webSearchCallCount: null,
      webSearchToolVersion: null,
      webSearchPricePerCallUsd: null,
      pricingVersion: null,
      pricingEffectiveAt: null,
      costStatus: "unavailable" as const,
      costUnavailableReason: "pricing_not_found",
      costUsd: null,
    }],
  }],
};
const composition = buildOpenAiCostsFinancialComposition({
  selection: current,
  official: { ok: true, value: { currency: "usd", totalUsd: "1", startTime: current.period.startTime, endTime: current.period.endTime, bucketCount: 1, pageCount: 1, fetchedAt: "2026-08-28T15:00:01.000Z" } },
  active: { ok: true, value: activeModel },
  legacy: internal,
  activeFilters: activeFilters ?? {},
});
assert.ok(composition);
assert.equal(composition.globalReconciliationUsd, "0.7");
assert.equal(composition.filteredActive?.totalCalculatedUsd, "0.05");
assert.equal(composition.filteredActive?.unavailableOperationCount, 1);

const lpFactoryBrowserForm = new FormData();
lpFactoryBrowserForm.set("periodMode", "custom");
lpFactoryBrowserForm.set("startDate", "2026-08-01");
lpFactoryBrowserForm.set("endDate", "2026-08-28");
lpFactoryBrowserForm.set("universe", "lp_factory");
lpFactoryBrowserForm.set("workload", "");
assert.equal(lpFactoryBrowserForm.get("accountId"), null);

const deniedCalls: string[] = [];
const denied = await refreshOpenAiCostsActionCore(lpFactoryBrowserForm, {
  authorize: async () => ({ allowed: false }),
  readOfficial: async () => { deniedCalls.push("official"); throw new Error("must not read"); },
  readActive: async () => { deniedCalls.push("active"); throw new Error("must not read"); },
  readLegacy: async () => { deniedCalls.push("legacy"); throw new Error("must not read"); },
});
assert.equal(denied.status, "error");
assert.equal(denied.code, "UNAUTHORIZED");
assert.deepEqual(deniedCalls, []);

const allowedCalls: string[] = [];
const allowed = await refreshOpenAiCostsActionCore(lpFactoryBrowserForm, {
  authorize: async () => ({ allowed: true }),
  readOfficial: async (period) => {
    allowedCalls.push("official");
    return { ok: true, value: { currency: "usd", totalUsd: "1", startTime: period.startTime, endTime: period.endTime, bucketCount: 1, pageCount: 1, fetchedAt: "2026-08-29T00:00:00.000Z" } };
  },
  readActive: async () => { allowedCalls.push("active"); return { ok: true, value: activeModel }; },
  readLegacy: async () => { allowedCalls.push("legacy"); return internal; },
});
assert.equal(allowed.status, "success");
assert.equal(allowed.dashboard?.activeFilters.universe, "lp_factory");
assert.equal(allowed.dashboard?.activeFilters.accountId, null);
assert.equal(allowed.dashboard?.globalReconciliationUsd, "0.7");
assert.deepEqual(allowedCalls.sort(), ["active", "legacy", "official"]);

let pageCalls = 0;
const paged = await readOpenAiLpCostPages({
  period: current.period,
  readCoverage: async () => ({ data: [{ activated_at: "2026-08-10T03:00:00.000Z" }], error: null }),
  readPage: async (from, to) => {
    pageCalls += 1;
    assert.equal(to - from + 1, 2);
    return { data: eventRows.slice(from, to + 1), error: null };
  },
}, 2);
assert.deepEqual(paged, internal);
assert.equal(pageCalls, 3);

const root = process.cwd();
const [pageSource, actionSource, actionCoreSource, componentSource, navigationSource] = await Promise.all([
  readFile(path.join(root, "app/admin/(protected)/custos-openai/page.tsx"), "utf8"),
  readFile(path.join(root, "app/admin/(protected)/custos-openai/actions.ts"), "utf8"),
  readFile(path.join(root, "app/admin/(protected)/custos-openai/action-core.ts"), "utf8"),
  readFile(path.join(root, "app/admin/(protected)/custos-openai/_components/OpenAiCostsDashboard.tsx"), "utf8"),
  readFile(path.join(root, "components/admin/adminNavigation.ts"), "utf8"),
]);
assert.match(pageSource, /await requirePlatformAdmin\(\)/);
assert.match(pageSource, /next=%2Fadmin%2Fcustos-openai/);
assert.match(actionSource, /readOfficialOpenAiCosts/);
assert.match(actionSource, /readOpenAiLpCosts/);
assert.match(actionSource, /readOpenAiActiveCosts/);
assert.match(actionSource, /authorize: requirePlatformAdmin/);
assert.match(actionCoreSource, /parseOpenAiActiveCostFilters/);
assert.match(actionCoreSource, /buildOpenAiCostsFinancialComposition/);
assert.ok(actionCoreSource.indexOf("await dependencies.authorize()") < actionCoreSource.indexOf("await Promise.all"));
for (const expected of [
  "Mês atual",
  "Personalizado",
  "Atualizar custos",
  "Gasto oficial OpenAI",
  "Controle ativo calculável",
  "Histórico congelado",
  "Outros gastos / reconciliação",
  "Provisório",
  "Período encerrado",
  "Atualizado na OpenAI",
  "Último evento do histórico interno",
  "Geração de texto",
  "Geração de imagem",
  "Cobertura completa",
  "Cobertura parcial",
  "Cobertura degradada",
  "Cobertura ativa registrada",
  "Cobertura ativa não registrada",
  "Controle ativo indisponível",
  "Custos indisponíveis",
  "Não atribuídas",
  "Execuções e operações",
  "Effort",
  "Baseline",
  "Retry",
  "Web Search",
  "Os filtros internos não alteram o gasto oficial nem a reconciliação global",
  "Visão global na OpenAI",
  "Os acessos abaixo saem da LP Factory e abrem em nova aba",
  "Abrir Usage na OpenAI",
  "Abrir faturamento e créditos na OpenAI",
]) {
  assert.equal(componentSource.includes(expected), true, `missing UI evidence: ${expected}`);
}
assert.match(componentSource, /const OPENAI_USAGE_URL = "https:\/\/platform\.openai\.com\/usage"/);
assert.match(componentSource, /const OPENAI_BILLING_URL = "https:\/\/platform\.openai\.com\/settings\/organization\/billing\/overview"/);
assert.equal((componentSource.match(/<ExternalLink href=/g) ?? []).length, 2);
assert.equal((componentSource.match(/target="_blank"/g) ?? []).length, 1);
assert.equal((componentSource.match(/rel="noopener noreferrer"/g) ?? []).length, 1);
assert.match(componentSource, /aria-live="polite"/);
assert.match(componentSource, /tabIndex=\{-1\}/);
assert.match(componentSource, /focus-visible:ring-4/);
assert.match(componentSource, /overflow-x-auto/);
assert.match(componentSource, /<details/);
assert.match(componentSource, /<caption className="sr-only">/);
assert.match(componentSource, /state\.status === "error"/);
assert.match(componentSource, /state\.status === "idle"/);
assert.match(componentSource, /min-h-11/);
assert.match(componentSource, /bg-brand-700/);
assert.match(navigationSource, /href: '\/admin\/custos-openai'/);
assert.equal(actionSource.includes("export const OPENAI_COSTS_INITIAL_STATE"), false);
for (const forbidden of ["promptText", "responseText", "providerPayload", "sourceUrl", "OPENAI_API_KEY", "SUPABASE_SERVICE_ROLE_KEY"]) {
  assert.equal(componentSource.includes(forbidden), false, `forbidden client field: ${forbidden}`);
}

console.log("ok - E21.4.5 and E21.5.5 dashboard authorization, composition, filters and accessible UI states");
}

function row(overrides: Record<string, unknown>) {
  return {
    attempt_id: "e2145000-0000-4000-8000-000000000001",
    account_id: "e2145000-0000-4000-8000-000000000010",
    account_name: "Cliente E21.4",
    landing_page_id: "e2145000-0000-4000-8000-000000000020",
    landing_page_name: "LP E21.4",
    workload: "landing_page_draft_generation",
    started_at: "2026-08-20T12:00:00.000Z",
    terminal_at: "2026-08-20T12:00:01.000Z",
    result: "success",
    cost_usd: "0.25",
    http_status: null,
    provider_error_code: null,
    provider_error_type: null,
    ...overrides,
  };
}

runValidationCases().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
