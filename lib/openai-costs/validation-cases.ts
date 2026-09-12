import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import { join, relative, resolve } from "node:path";
import { runReadModelValidationCases } from "./read-model-validation-cases";

import * as publicApi from "./index";
import {
  boundedOpenAiProviderErrorMetadata,
  isOpenAiCreditFailure,
  parseOpenAiProviderErrorMetadata,
} from "./provider-error-metadata";
import { readOfficialOpenAiCostsWithKey } from "./providers/openAiCostsProviderCore";

const period = Object.freeze({
  startTime: 1_787_539_200,
  endTime: 1_787_712_000,
});

type RuntimeSource = Readonly<{
  path: string;
  contents: string;
}>;

const repositoryRoot = resolve(process.cwd());
const runtimeRoots = ["app", "lib", "automations", "services"] as const;
const validationFile = "lib/openai-costs/validation-cases.ts";
const readModelAdapter = "lib/openai-costs/adapters/lpCostReadModelAdapter.ts";
const readRpc = "read_openai_lp_cost_events_v1";

const forbiddenLegacyProducerPatterns = [
  /OPENAI_LP_COST_TRACKING_ENABLED/,
  /append_openai_lp_cost_start_v1/,
  /append_openai_lp_cost_terminal_v1/,
  /register_openai_lp_cost_coverage_v1/,
  /(?:create)?OpenAiLpCostTracker/,
  /openai[-_]?lp[-_]?cost[-_]?tracker/i,
] as const;

function normalizeRepositoryPath(path: string) {
  return path.replaceAll("\\", "/");
}

function isRuntimeProofPath(path: string) {
  return path.split("/").some((segment) =>
    /^(?:__tests__|tests?|specs?)$/i.test(segment)
    || /(?:^|[-_.])(?:validation(?:-cases)?|tests?|specs?)(?:[-_.]|$)/i.test(segment));
}

function assertRuntimeCostHistoryIsReadOnly(sources: readonly RuntimeSource[]) {
  for (const source of sources) {
    for (const forbiddenPattern of forbiddenLegacyProducerPatterns) {
      if (forbiddenPattern.test(source.contents)) {
        throw new Error(`legacy OpenAI LP cost producer or gate found in ${source.path}`);
      }
    }

    if (source.contents.includes(readRpc) && source.path !== readModelAdapter) {
      throw new Error(`OpenAI LP cost read RPC used outside the read-model adapter: ${source.path}`);
    }
  }

  const adapter = sources.find((source) => source.path === readModelAdapter);
  assert.ok(adapter?.contents.includes(readRpc), "read-model adapter must retain the historical read RPC");
}

async function readRuntimeSources() {
  const sources: RuntimeSource[] = [];

  async function visit(directory: string): Promise<void> {
    let entries;
    try {
      entries = await readdir(directory, { withFileTypes: true });
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return;
      throw error;
    }

    for (const entry of entries) {
      const absolutePath = join(directory, entry.name);
      if (entry.isDirectory()) {
        await visit(absolutePath);
      } else if (entry.isFile() && /\.(?:[cm]?[jt]sx?)$/.test(entry.name)) {
        const repositoryPath = normalizeRepositoryPath(relative(repositoryRoot, absolutePath));
        if (repositoryPath === validationFile || isRuntimeProofPath(repositoryPath)) continue;
        sources.push({
          path: repositoryPath,
          contents: await readFile(absolutePath, "utf8"),
        });
      }
    }
  }

  for (const root of runtimeRoots) {
    await visit(join(repositoryRoot, root));
  }

  return sources;
}

const cases = [
  {
    name: "public API exposes the official Costs reader",
    run: () => {
      assert.equal(typeof publicApi.readOfficialOpenAiCosts, "function");
    },
  },
  {
    name: "runtime keeps the legacy LP cost history read-only",
    run: async () => {
      const sources = await readRuntimeSources();
      assertRuntimeCostHistoryIsReadOnly(sources);
    },
  },
  {
    name: "runtime history guard fails closed for a reintroduced producer gate",
    run: () => {
      assert.throws(
        () => assertRuntimeCostHistoryIsReadOnly([
          {
            path: "app/api/reintroduced-producer.ts",
            contents: "const enabled = process.env.OPENAI_LP_COST_TRACKING_ENABLED;",
          },
          {
            path: readModelAdapter,
            contents: readRpc,
          },
        ]),
        /legacy OpenAI LP cost producer or gate/,
      );
    },
  },
  {
    name: "provider diagnostics remain bounded and sanitized",
    run: () => {
      assert.deepEqual(parseOpenAiProviderErrorMetadata({
        error: {
          code: " credit_balance_exhausted ",
          type: "insufficient_quota",
          message: "must-not-be-preserved",
        },
      }), {
        providerErrorCode: "credit_balance_exhausted",
        providerErrorType: "insufficient_quota",
      });
      assert.equal(isOpenAiCreditFailure({
        providerErrorCode: "credit_balance_exhausted",
        providerErrorType: null,
      }), true);
      assert.equal(isOpenAiCreditFailure({
        providerErrorCode: "rate_limit_exceeded",
        providerErrorType: "requests",
      }), false);
      assert.equal(boundedOpenAiProviderErrorMetadata("x".repeat(129)), null);
      assert.equal(boundedOpenAiProviderErrorMetadata("invalid message"), null);
    },
  },
  {
    name: "missing admin key and invalid, future or excessive periods fail before transport",
    run: async () => {
      let calls = 0;
      const fetchImpl = async () => {
        calls += 1;
        return jsonResponse(costsPage([]));
      };

      const missingKey = await readOfficialOpenAiCostsWithKey(
        { period, adminKey: "" },
        { fetchImpl },
      );
      assert.equal(missingKey.ok, false);
      assert.equal(missingKey.error.code, "ADMIN_KEY_MISSING");

      const invalidPeriod = await readOfficialOpenAiCostsWithKey(
        {
          period: { startTime: period.endTime, endTime: period.startTime },
          adminKey: "admin-test-key",
        },
        { fetchImpl },
      );
      assert.equal(invalidPeriod.ok, false);
      assert.equal(invalidPeriod.error.code, "INVALID_PERIOD");

      const futurePeriod = await readOfficialOpenAiCostsWithKey(
        {
          period: { startTime: period.startTime, endTime: period.endTime },
          adminKey: "admin-test-key",
        },
        {
          fetchImpl,
          now: () => new Date((period.startTime - 1) * 1_000),
        },
      );
      assert.equal(futurePeriod.ok, false);
      assert.equal(futurePeriod.error.code, "INVALID_PERIOD");

      const excessivePeriod = await readOfficialOpenAiCostsWithKey(
        {
          period: {
            startTime: period.startTime,
            endTime: period.startTime + 181 * 86_400,
          },
          adminKey: "admin-test-key",
        },
        {
          fetchImpl,
          maxPages: 1,
          now: () => new Date((period.startTime + 182 * 86_400) * 1_000),
        },
      );
      assert.equal(excessivePeriod.ok, false);
      assert.equal(excessivePeriod.error.code, "INVALID_PERIOD");
      assert.equal(calls, 0);
    },
  },
  {
    name: "complete pagination returns one sanitized exact USD total",
    run: async () => {
      const requests: URL[] = [];
      const authorizations: string[] = [];
      const responses = [
        costsPage([
          costsBucket(period.startTime, period.startTime + 86_400, [0.1, 0.2]),
        ], true, "cursor-2"),
        costsPage([
          costsBucket(period.startTime + 86_400, period.endTime, [1.005]),
        ]),
      ];
      const result = await readOfficialOpenAiCostsWithKey(
        { period, adminKey: " admin-test-key " },
        {
          fetchImpl: async (input, init) => {
            requests.push(new URL(String(input)));
            authorizations.push(new Headers(init?.headers).get("authorization") ?? "");
            return jsonResponse(responses.shift());
          },
          now: () => new Date("2026-08-28T12:00:00.000Z"),
        },
      );

      assert.deepEqual(result, {
        ok: true,
        value: {
          currency: "usd",
          totalUsd: "1.305",
          startTime: period.startTime,
          endTime: period.endTime,
          bucketCount: 2,
          pageCount: 2,
          fetchedAt: "2026-08-28T12:00:00.000Z",
        },
      });
      assert.equal(requests.length, 2);
      assert.equal(requests[0]?.origin + requests[0]?.pathname, "https://api.openai.com/v1/organization/costs");
      assert.equal(requests[0]?.searchParams.get("start_time"), String(period.startTime));
      assert.equal(requests[0]?.searchParams.get("end_time"), String(period.endTime));
      assert.equal(requests[0]?.searchParams.get("bucket_width"), "1d");
      assert.equal(requests[0]?.searchParams.get("limit"), "180");
      assert.equal(requests[0]?.searchParams.has("group_by"), false);
      assert.equal(requests[1]?.searchParams.get("page"), "cursor-2");
      assert.deepEqual(authorizations, ["Bearer admin-test-key", "Bearer admin-test-key"]);
      assert.equal(JSON.stringify(result).includes("admin-test-key"), false);
      assert.equal(JSON.stringify(result).includes("project_id"), false);
    },
  },
  {
    name: "empty Costs response is a successful zero total",
    run: async () => {
      const result = await readOfficialOpenAiCostsWithKey(
        { period, adminKey: "admin-test-key" },
        {
          fetchImpl: async () => jsonResponse(costsPage([])),
          now: () => new Date("2026-08-28T12:01:00.000Z"),
        },
      );
      assert.equal(result.ok, true);
      assert.equal(result.value.totalUsd, "0");
      assert.equal(result.value.bucketCount, 0);
    },
  },
  {
    name: "HTTP, JSON, shape and currency failures remain sanitized",
    run: async () => {
      const http = await readOfficialOpenAiCostsWithKey(
        { period, adminKey: "admin-test-key" },
        { fetchImpl: async () => new Response("sensitive", { status: 403 }) },
      );
      assert.equal(http.ok, false);
      assert.deepEqual(http.error, {
        code: "HTTP_ERROR",
        message: "OpenAI Costs returned a non-success status",
        httpStatus: 403,
      });
      assert.equal(JSON.stringify(http).includes("sensitive"), false);

      const invalidJson = await readOfficialOpenAiCostsWithKey(
        { period, adminKey: "admin-test-key" },
        { fetchImpl: async () => new Response("{") },
      );
      assert.equal(invalidJson.ok, false);
      assert.equal(invalidJson.error.code, "INVALID_RESPONSE");

      const invalidShape = await readOfficialOpenAiCostsWithKey(
        { period, adminKey: "admin-test-key" },
        { fetchImpl: async () => jsonResponse({ object: "page", data: [] }) },
      );
      assert.equal(invalidShape.ok, false);
      assert.equal(invalidShape.error.code, "INVALID_RESPONSE");

      const nonUsd = await readOfficialOpenAiCostsWithKey(
        { period, adminKey: "admin-test-key" },
        {
          fetchImpl: async () => jsonResponse(costsPage([
            costsBucket(period.startTime, period.endTime, [1], "brl"),
          ])),
        },
      );
      assert.equal(nonUsd.ok, false);
      assert.equal(nonUsd.error.code, "NON_USD");
    },
  },
  {
    name: "pagination fails closed for missing, repeated and excessive cursors",
    run: async () => {
      const missing = await readOfficialOpenAiCostsWithKey(
        { period, adminKey: "admin-test-key" },
        { fetchImpl: async () => jsonResponse(costsPage([], true, null)) },
      );
      assert.equal(missing.ok, false);
      assert.equal(missing.error.code, "PAGINATION_INCOMPLETE");

      let calls = 0;
      const repeated = await readOfficialOpenAiCostsWithKey(
        { period, adminKey: "admin-test-key" },
        {
          fetchImpl: async () => {
            calls += 1;
            return jsonResponse(costsPage([], true, "same-cursor"));
          },
        },
      );
      assert.equal(repeated.ok, false);
      assert.equal(repeated.error.code, "PAGINATION_INCOMPLETE");
      assert.equal(calls, 2);

      const excessive = await readOfficialOpenAiCostsWithKey(
        { period, adminKey: "admin-test-key" },
        {
          fetchImpl: async () => jsonResponse(costsPage([], true, "next")),
          maxPages: 1,
        },
      );
      assert.equal(excessive.ok, false);
      assert.equal(excessive.error.code, "PAGINATION_INCOMPLETE");
    },
  },
  {
    name: "transport errors and timeouts are distinguished",
    run: async () => {
      const transport = await readOfficialOpenAiCostsWithKey(
        { period, adminKey: "admin-test-key" },
        { fetchImpl: async () => Promise.reject(new Error("network")) },
      );
      assert.equal(transport.ok, false);
      assert.equal(transport.error.code, "REQUEST_FAILED");

      const timeout = await readOfficialOpenAiCostsWithKey(
        { period, adminKey: "admin-test-key" },
        {
          timeoutMs: 1,
          fetchImpl: async (_input, init) => new Promise<Response>((_resolve, reject) => {
            init?.signal?.addEventListener("abort", () => reject(new Error("aborted")));
          }),
        },
      );
      assert.equal(timeout.ok, false);
      assert.equal(timeout.error.code, "TIMEOUT");

      const bodyTimeout = await readOfficialOpenAiCostsWithKey(
        { period, adminKey: "admin-test-key" },
        {
          timeoutMs: 1,
          fetchImpl: async (_input, init) => new Response(new ReadableStream({
            start(controller) {
              init?.signal?.addEventListener("abort", () => {
                controller.error(new DOMException("aborted", "AbortError"));
              });
            },
          })),
        },
      );
      assert.equal(bodyTimeout.ok, false);
      assert.equal(bodyTimeout.error.code, "TIMEOUT");
    },
  },
] as const;

function costsPage(
  data: readonly unknown[],
  hasMore = false,
  nextPage: string | null = null,
) {
  return {
    object: "page",
    data,
    has_more: hasMore,
    next_page: nextPage,
  };
}

function costsBucket(
  startTime: number,
  endTime: number,
  values: readonly number[],
  currency = "usd",
) {
  return {
    object: "bucket",
    start_time: startTime,
    end_time: endTime,
    results: values.map((value) => ({
      object: "organization.costs.result",
      amount: { value, currency },
      project_id: "project-sensitive",
      line_item: "sensitive-line-item",
    })),
  };
}

function jsonResponse(payload: unknown): Response {
  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

async function runValidationCases() {
  await runReadModelValidationCases();
  for (const validationCase of cases) {
    await validationCase.run();
    console.log(`ok - ${validationCase.name}`);
  }
}

runValidationCases().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
