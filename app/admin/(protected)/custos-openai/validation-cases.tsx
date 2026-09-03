import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";

import {
  readOpenAiLpCostPages,
  translateOpenAiLpCostRows,
} from "../../../../lib/openai-costs/adapters/lpCostReadModelAdapterCore";
import {
  buildOpenAiCostsDashboard,
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
const [pageSource, actionSource, componentSource, navigationSource] = await Promise.all([
  readFile(path.join(root, "app/admin/(protected)/custos-openai/page.tsx"), "utf8"),
  readFile(path.join(root, "app/admin/(protected)/custos-openai/actions.ts"), "utf8"),
  readFile(path.join(root, "app/admin/(protected)/custos-openai/_components/OpenAiCostsDashboard.tsx"), "utf8"),
  readFile(path.join(root, "components/admin/adminNavigation.ts"), "utf8"),
]);
assert.match(pageSource, /await requirePlatformAdmin\(\)/);
assert.match(pageSource, /next=%2Fadmin%2Fcustos-openai/);
assert.ok(actionSource.indexOf("await requirePlatformAdmin()") < actionSource.indexOf("await Promise.all"));
assert.match(actionSource, /readOfficialOpenAiCosts/);
assert.match(actionSource, /readOpenAiLpCosts/);
for (const expected of [
  "Mês atual",
  "Personalizado",
  "Atualizar custos",
  "Gasto oficial OpenAI",
  "Histórico de Landing Pages",
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
  "Histórico indisponível",
  "Série histórica congelada",
  "write-side prospectivo foi retirado",
  "Crédito ou limite OpenAI requer atenção",
  "Visão global na OpenAI",
  "Os acessos abaixo saem da LP Factory e abrem em nova aba",
  "Abrir Usage na OpenAI",
  "Abrir faturamento e créditos na OpenAI",
]) {
  assert.equal(componentSource.includes(expected), true, `missing UI evidence: ${expected}`);
}
assert.match(componentSource, /const OPENAI_USAGE_URL = "https:\/\/platform\.openai\.com\/usage"/);
assert.match(componentSource, /const OPENAI_BILLING_URL = "https:\/\/platform\.openai\.com\/settings\/organization\/billing\/overview"/);
assert.equal((componentSource.match(/target="_blank"/g) ?? []).length, 2);
assert.equal((componentSource.match(/rel="noopener noreferrer"/g) ?? []).length, 2);
assert.match(componentSource, /aria-live="polite"/);
assert.match(componentSource, /state\.status === "success"/);
assert.match(componentSource, /min-h-11/);
assert.match(componentSource, /bg-brand-700/);
assert.match(navigationSource, /href: '\/admin\/custos-openai'/);
assert.equal(actionSource.includes("export const OPENAI_COSTS_INITIAL_STATE"), false);

console.log("ok - E21.4.5 dashboard period, reconciliation, pagination, authorization and UI states");
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
