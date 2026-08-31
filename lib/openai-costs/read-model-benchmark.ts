// Synthetic only. Fresh process per scenario; no remote IO or persisted events.
// node --expose-gc --import tsx lib/openai-costs/read-model-benchmark.ts
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readOpenAiLpCostPages } from "./adapters/lpCostReadModelAdapterCore";
import { baselineReadModel, benchmarkPeriod as period, benchmarkCoverage as coverageRows, costRow } from "./read-model-validation-cases";
import type { OpenAiLpCostReadResult } from "./contracts";

async function main() {
  const mode = process.argv[2];
  if (!mode) {
    for (const [count, cardinality] of [[10000, 10], [99999, 10], [100000, 10], [100001, 10], [300001, 10], [10000, 10000], [99999, 99999]]) {
      for (const candidate of ["baseline", "incremental"]) {
        process.stdout.write(execFileSync(process.execPath, ["--expose-gc", "--max-old-space-size=512", "--import", "tsx", process.argv[1], candidate, String(count), String(cardinality)]));
      }
    }
    process.stdout.write(execFileSync(process.execPath, ["--expose-gc", "--max-old-space-size=64", "--import", "tsx", process.argv[1], "incremental", "1000001", "10"]));
    return;
  }
  assert.ok(global.gc, "run with --expose-gc");
  const count = Number(process.argv[3]);
  const cardinality = Number(process.argv[4]);
  global.gc();
  const before = process.memoryUsage().heapUsed;
  let retained = before;
  let sampledPeak = before;
  let gcMilliseconds = 0;
  let calls = 0;
  const sample = () => {
    sampledPeak = Math.max(sampledPeak, process.memoryUsage().heapUsed);
    const start = performance.now(); global.gc?.(); gcMilliseconds += performance.now() - start;
    retained = Math.max(retained, process.memoryUsage().heapUsed);
  };
  const readPage = async (from: number, to: number) => {
    calls++;
    if (calls % 20 === 0) sample();
    return { data: Array.from({ length: Math.max(0, Math.min(count, to + 1) - from) }, (_, offset) => costRow(from + offset, cardinality)), error: null };
  };
  const start = performance.now();
  let result: OpenAiLpCostReadResult | null = null;
  let status = "ok";
  let retainedEventRows = 0;
  if (mode === "baseline") {
    const pages = await baselineReadModel.readCompleteOpenAiLpCostPages(readPage);
    retainedEventRows = pages.data.length;
    if (pages.error) status = pages.error instanceof Error ? pages.error.message : "error";
    else result = baselineReadModel.translateOpenAiLpCostRows({ period, coverageRows, eventRows: pages.data });
    sample();
  } else {
    result = await readOpenAiLpCostPages({ period, readPage, readCoverage: async () => ({ data: coverageRows, error: null }) });
    sample();
  }
  const millisecondsExcludingGc = Math.round(performance.now() - start - gcMilliseconds);
  if (result) {
    assert.equal(result.ok && result.value.attemptCount, count);
    assert.equal(result.ok && result.value.accounts.length, Math.min(count, cardinality));
    assert.equal(result.ok && result.value.totalUsd, `0.${String(count).padStart(12, "0")}`.replace(/0+$/, ""));
  }
  console.log(JSON.stringify({ mode, count, cardinality, calls, retainedEventRows, status,
    millisecondsExcludingGc, retainedHeapDeltaMiB: +((retained - before) / 1048576).toFixed(2),
    sampledPeakHeapDeltaMiB: +((sampledPeak - before) / 1048576).toFixed(2),
    outputBytes: result ? Buffer.byteLength(JSON.stringify(result)) : 0,
  }));
}
main().catch((error: unknown) => { console.error(error); process.exitCode = 1; });
