import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";

import {
  readCompleteOpenAiLpCostPages,
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
];
const internal = translateOpenAiLpCostRows({
  period: current.period,
  eventRows,
  coverageRows: [{ activated_at: "2026-08-10T03:00:00.000Z" }],
});
assert.equal(internal.ok, true);
if (!internal.ok) throw new Error("internal read model should be valid");
assert.equal(internal.value.totalUsd, "0.25");
assert.equal(internal.value.coverageStatus, "partial");
assert.equal(internal.value.accounts[0]?.landingPages[0]?.workloads.length, 2);
assert.equal(internal.value.pendingAttemptCount, 1);

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

let pageCalls = 0;
const paged = await readCompleteOpenAiLpCostPages(async (from, to) => {
  pageCalls += 1;
  assert.equal(to - from + 1, 2);
  return { data: pageCalls === 1 ? [1, 2] : [3], error: null };
}, 2);
assert.deepEqual(paged, { data: [1, 2, 3], error: null });
assert.equal(pageCalls, 2);

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
  "Landing Pages calculadas",
  "Outros gastos / reconciliação",
  "Provisório",
  "Período encerrado",
  "Atualizado na OpenAI",
  "Atualizado na cobertura interna",
  "Geração de texto",
  "Geração de imagem",
]) {
  assert.equal(componentSource.includes(expected), true, `missing UI evidence: ${expected}`);
}
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
    ...overrides,
  };
}

runValidationCases().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
