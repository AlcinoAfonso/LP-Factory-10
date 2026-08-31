import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { readOpenAiLpCostPages } from "./adapters/lpCostReadModelAdapterCore";
import * as baselineReadModel from "./fixtures/read-model-baseline";
export { baselineReadModel };

export const benchmarkPeriod = { startTime: 1785542400, endTime: 1788134400 };
export const benchmarkCoverage = [{ activated_at: "2026-08-01T00:00:00Z" }];

export function costRow(index: number, cardinality = 10): Record<string, unknown> {
  const group = String(index % cardinality).padStart(12, "0");
  return {
    attempt_id: `e2145000-0000-4000-8000-${String(index).padStart(12, "0")}`,
    account_id: `a2145000-0000-4000-8000-${group}`,
    account_name: `Account ${group}`,
    landing_page_id: `b2145000-0000-4000-8000-${group}`,
    landing_page_name: `LP ${group}`,
    workload: "landing_page_draft_generation",
    started_at: "2026-08-20T12:00:00.000Z",
    terminal_at: "2026-08-20T12:00:01.000Z",
    result: "success", cost_usd: "0.000000000001",
    http_status: null, provider_error_code: null, provider_error_type: null,
  };
}

export async function runReadModelValidationCases() {
  let comparisons = 0;
  const read = (rows: readonly unknown[], pageSize: number, coverageRows: unknown = benchmarkCoverage) => readOpenAiLpCostPages({
    period: benchmarkPeriod,
    readCoverage: async () => ({ data: coverageRows, error: null }),
    readPage: async (from, to) => ({ data: rows.slice(from, to + 1), error: null }),
  }, pageSize);
  const compare = async (rows: readonly unknown[], pageSize: number, coverageRows: unknown) => {
    assert.deepEqual(await read(rows, pageSize, coverageRows), baselineReadModel.translateOpenAiLpCostRows({
      period: benchmarkPeriod, eventRows: rows, coverageRows,
    }));
    comparisons++;
  };
  {
    // Both modalities share attempt IDs; timestamps tie and deliberately change order.
    // Accounts contain multiple LPs, equal display names and non-adjacent entries.
    const mixed = Array.from({ length: 40 }, (_, i) => ({
      ...costRow(Math.floor(i / 2), 3),
      landing_page_id: `b2145000-0000-4000-8000-${String(i % 6).padStart(12, "0")}`,
      account_name: "Equal account names", landing_page_name: "Equal LP names",
      workload: i % 2 ? "landing_page_draft_image_generation" : "landing_page_draft_generation",
      started_at: i % 3 ? "2026-08-20T12:00:00.000001Z" : "2026-08-19T12:00:00Z",
      ...(i % 5 === 0 ? { terminal_at: null, result: null, cost_usd: null }
        : i % 5 === 1 ? { result: "failure", cost_usd: null, http_status: 429, provider_error_code: "credit_balance_exhausted", provider_error_type: "insufficient_quota" }
        : { cost_usd: i % 5 === 2 ? "0" : i % 5 === 3 ? "0.123456789012" : "999999999999999999.999999999999" }),
    }));
    for (const rows of [[], [costRow(0)], mixed]) {
      for (const coverage of [[], benchmarkCoverage, [{ activated_at: "2026-08-10T00:00:00Z" }], null, [{}], [...benchmarkCoverage, ...benchmarkCoverage]]) {
        for (const size of [1, 2, 7, 500]) await compare(rows, size, coverage);
      }
    }
    for (const override of [
      { attempt_id: "bad" }, { workload: "other" }, { account_name: "" }, { cost_usd: "-1" },
      { started_at: "2026-07-31T23:59:59Z" }, { started_at: "2026-08-31T00:00:00Z" },
      { terminal_at: null }, { result: "unknown" }, { cost_usd: "NaN" },
      { http_status: 999 }, { provider_error_code: "unsafe error with spaces" },
    ]) await compare([costRow(0), { ...costRow(1), ...override }], 1, benchmarkCoverage);
    await compare([costRow(0), { ...costRow(1), account_name: "changed" }], 1, benchmarkCoverage);
    await compare([costRow(0, 1), { ...costRow(1, 1), landing_page_name: "changed" }], 1, benchmarkCoverage);
    await compare([costRow(0), costRow(0)], 1, benchmarkCoverage);

    for (const pages of [
      [[costRow(1)], [costRow(0)]], // backwards page
      [[costRow(0)], [costRow(0)]], // repeated boundary
      [[costRow(0)], [{ ...costRow(0), started_at: "2026-08-21T00:00:00Z" }]],
    ]) {
      let calls = 0;
      const result = await readOpenAiLpCostPages({ period: benchmarkPeriod,
        readCoverage: async () => ({ data: benchmarkCoverage, error: null }),
        readPage: async () => { assert.ok(calls < 2); return { data: pages[calls++], error: null }; },
      }, 1);
      assert.equal(result.ok ? "unexpected success" : result.error.code, "INVALID_RESPONSE");
    }
    for (const [last, expected] of [
      [{ data: [], error: null }, "ok"],
      [{ data: null, error: { code: "PGRST103" }, status: 416 }, "ok"],
      [{ data: null, error: { code: "network_error" } }, "READ_FAILED"],
      [{ data: null, error: null }, "READ_FAILED"],
      [{ data: [costRow(1), costRow(2), costRow(3)], error: null }, "INVALID_RESPONSE"],
    ] as const) {
      const result = await readOpenAiLpCostPages({ period: benchmarkPeriod,
        readCoverage: async () => ({ data: benchmarkCoverage, error: null }),
        readPage: async (from) => from === 0 ? { data: [costRow(0)], error: null } : last,
      }, 2);
      assert.equal(result.ok ? "ok" : result.error.code, expected);
      if (!result.ok) assert.equal("value" in result, false);
    }
    // Short pages are not EOF: a server cap below the requested page size is safe.
    let calls = 0;
    const capped = await readOpenAiLpCostPages({ period: benchmarkPeriod,
      readCoverage: async () => ({ data: benchmarkCoverage, error: null }),
      readPage: async (from) => { calls++; return { data: from < 8 ? [costRow(from)] : [], error: null }; },
    }, 500);
    assert.equal(capped.ok && capped.value.attemptCount, 8); assert.equal(calls, 9);
    for (const initialFailure of [true, false]) {
      const result = await readOpenAiLpCostPages({ period: benchmarkPeriod,
        readCoverage: async () => ({ data: benchmarkCoverage, error: initialFailure ? { code: "coverage_failed" } : null }),
        readPage: async (from) => {
          if (from > 0) throw new Error("sensitive transport detail");
          return { data: [costRow(0)], error: null };
        },
      });
      assert.equal(result.ok ? "ok" : result.error.code, "READ_FAILED");
      assert.equal(JSON.stringify(result).includes("sensitive"), false);
    }
    const first416 = await readOpenAiLpCostPages({ period: benchmarkPeriod,
      readCoverage: async () => ({ data: [], error: null }),
      readPage: async () => ({ data: null, error: { code: "PGRST103" }, status: 416 }),
    });
    assert.equal(first416.ok ? "ok" : first416.error.code, "READ_FAILED");
    for (const size of [0, -1, 501, NaN, 0.5]) {
      const result = await readOpenAiLpCostPages({ period: benchmarkPeriod,
        readCoverage: async () => { assert.fail("must not read"); },
        readPage: async () => { assert.fail("must not read"); },
      }, size);
      assert.equal(result.ok ? "ok" : result.error.code, "INVALID_RESPONSE");
    }
    for (const count of [99999, 100000, 100001, 300001]) {
      const rows = Array.from({ length: count }, (_, i) => costRow(i));
      await compare(rows, 500, benchmarkCoverage);
    }
    const adapter = readFileSync(path.join(process.cwd(), "lib/openai-costs/adapters/lpCostReadModelAdapter.ts"), "utf8");
    assert.match(adapter, /import "server-only"/);
    assert.match(adapter, /createServiceClient\(\)/);
    assert.match(adapter, /\.order\("attempt_id", \{ ascending: true \}\)\s*\.order\("workload", \{ ascending: true \}\)\s*\.range\(from, to\)/);
    console.log(`ok - AA11 ${comparisons} full baseline DTO/error comparisons; >100k, exact decimals, groups, coverage, page progress and failure isolation`);
  }
}
