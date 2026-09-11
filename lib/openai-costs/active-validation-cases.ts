import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { readFileSync } from "node:fs";
import { createOpenAiCostRecorder } from "./recorder";
import {
  executionStartRpc,
  operationFinishRpc,
  OpenAiCostTrackingPersistenceError,
  openAiCostPersistenceFailure,
} from "./adapters/activeCostTrackingAdapterCore";
import type { OpenAiCostTrackingAdapter } from "./active-contracts";
import {
  OPENAI_COST_INGESTION_PROTOCOL_VERSION,
  validateOpenAiCostIngestion,
} from "./ingestion";
import { requestCommercialActivationOpenAi } from "../conversion-content/adapters/commercialActivationOpenAiAdapter";
import { listOpenAiWorkloadInventory } from "../openai-workloads";

const execution = {
  executionId: "10000000-0000-4000-8000-000000000001",
  workload: "niche_resolution" as const,
  environment: "development" as const,
  executionOrigin: "runtime" as const,
  economicContext: {
    universe: "client" as const,
    attributionStatus: "attributed" as const,
    accountId: "10000000-0000-4000-8000-000000000002",
  },
  startedAt: "2026-09-11T12:00:00.000Z",
};

const failingAdapter: OpenAiCostTrackingAdapter = {
  startExecution: async () => { throw new Error("secret database detail"); },
  startOperation: async () => { throw new Error("secret database detail"); },
  finishOperation: async () => { throw new Error("secret database detail"); },
  finishExecution: async () => { throw new Error("secret database detail"); },
};

async function main() {
  const failures: unknown[] = [];
  const recorder = createOpenAiCostRecorder({
    adapter: failingAdapter,
    enabled: () => true,
    emitFailure: (event) => failures.push(event),
  });
  await assert.doesNotReject(recorder.startExecution(execution));
  assert.deepEqual(failures, [{
    event: "openai_cost_recording_failed",
    phase: "startExecution",
    executionId: execution.executionId,
    operationId: null,
    code: "adapter_error",
  }]);
  assert.equal(JSON.stringify(failures).includes("secret database detail"), false);
  await recorder.startOperation({
    operationId: "10000000-0000-4000-8000-000000000003",
    executionId: execution.executionId,
    sequence: 1,
    model: "gpt-5.6-luna",
    reasoningEffort: "low",
    configurationSource: "repo_catalog",
    configurationRevision: "v2",
    startedAt: execution.startedAt,
  });
  await recorder.finishOperation({
    operationId: "10000000-0000-4000-8000-000000000003",
    result: "failure",
    failureCategory: "provider_error",
    finishedAt: "2026-09-11T12:00:01.000Z",
  });
  await recorder.finishExecution({
    executionId: execution.executionId,
    result: "failure",
    failureCategory: "provider_error",
    finishedAt: "2026-09-11T12:00:02.000Z",
  });
  assert.deepEqual(failures.slice(1).map((item) => (item as { phase: string }).phase), [
    "startOperation", "finishOperation", "finishExecution",
  ]);

  const timeoutFailures: unknown[] = [];
  const timeoutRecorder = createOpenAiCostRecorder({
    adapter: { ...failingAdapter, startExecution: () => new Promise(() => undefined) },
    enabled: () => true,
    timeoutMs: 25,
    emitFailure: (event) => timeoutFailures.push(event),
  });
  await timeoutRecorder.startExecution(execution);
  assert.equal((timeoutFailures[0] as { code: string }).code, "timeout");

  assert.deepEqual(executionStartRpc(execution), {
    p_id: execution.executionId,
    p_workload: "niche_resolution",
    p_environment: "development",
    p_execution_origin: "runtime",
    p_universe: "client",
    p_attribution_status: "attributed",
    p_account_id: execution.economicContext.accountId,
    p_baseline_reference: null,
    p_baseline_version: null,
    p_started_at: execution.startedAt,
  });

  const terminal = operationFinishRpc({
    operationId: "10000000-0000-4000-8000-000000000003",
    result: "success",
    usage: {
      inputTokens: 10,
      cachedInputTokens: 2,
      cacheWriteTokens: null,
      outputTokens: 4,
      reasoningTokens: 1,
      totalTokens: 14,
    },
    webSearchCallCount: 2,
    finishedAt: "2026-09-11T12:00:01.000Z",
  });
  assert.equal(terminal.p_cached_input_tokens, 2);
  assert.equal(terminal.p_web_search_call_count, 2);
  assert.deepEqual(
    openAiCostPersistenceFailure(new OpenAiCostTrackingPersistenceError("conflict")),
    { status: 409, code: "persistence_conflict" },
  );
  assert.deepEqual(openAiCostPersistenceFailure(new Error("database detail")), {
    status: 503,
    code: "persistence_unavailable",
  });

  const commercialConfiguration = listOpenAiWorkloadInventory().find(
    (item) => item.id === "commercial_activation_draft_generation",
  );
  if (!commercialConfiguration || commercialConfiguration.configurationKind !== "effective") {
    throw new Error("commercial configuration missing");
  }
  const functional = await requestCommercialActivationOpenAi({
    apiKey: "test-key",
    configuration: commercialConfiguration,
    environment: "development",
    request: { input: "test" },
    parseResponse: () => ({ ok: true, value: "functional-result" }),
  }, {
    fetchImpl: async () => new Response(JSON.stringify({
      id: "resp_test",
      output_text: "ok",
      usage: { input_tokens: 1, output_tokens: 1, total_tokens: 2 },
    }), { status: 200, headers: { "content-type": "application/json" } }),
    costRecorder: recorder,
    emitEvent: () => undefined,
  });
  assert.deepEqual(functional, { ok: true, value: "functional-result", responseId: "resp_test" });

  const secret = "test-ingestion-secret";
  const now = Date.parse("2026-09-11T12:00:00.000Z");
  const timestamp = now.toString();
  const inventory = {
    id: "supabase_inspect",
    displayName: "Supabase Inspect",
    classification: "operational",
    configurationKind: "inventory_reference",
    consumer: "test",
    fallback: "test",
    model: "gpt-4.1-mini",
    reasoningEffort: "not_applicable",
    source: "github_actions_default_reference",
    revision: "v2",
    effectiveConfigurationVerified: false,
  } as const;
  const envelope = {
    version: OPENAI_COST_INGESTION_PROTOCOL_VERSION,
    action: "startOperation",
    payload: {
      operationId: "10000000-0000-4000-8000-000000000004",
      executionId: "10000000-0000-4000-8000-000000000005",
      sequence: 1,
      model: inventory.model,
      reasoningEffort: inventory.reasoningEffort,
      configurationSource: inventory.source,
      configurationRevision: inventory.revision,
      startedAt: "2026-09-11T12:00:00.000Z",
    },
  };
  const body = JSON.stringify(envelope);
  const signature = createHmac("sha256", secret).update(`${timestamp}.${body}`).digest("hex");
  const validate = (overrides: Partial<Parameters<typeof validateOpenAiCostIngestion>[0]> = {}) =>
    validateOpenAiCostIngestion({
      body, timestamp, signature, protocol: OPENAI_COST_INGESTION_PROTOCOL_VERSION,
      secret, expectedEnvironment: "production", inventory, now, ...overrides,
    });
  assert.equal(validate().ok, true);
  assert.deepEqual(validate({ signature: "0".repeat(64) }), { ok: false, code: "signature_invalid" });
  assert.deepEqual(validate({ now: now - 1 }), { ok: false, code: "request_expired" });
  assert.deepEqual(validate({ now: now + 300_001 }), { ok: false, code: "request_expired" });
  assert.deepEqual(validate({ body: `${body} ` }), { ok: false, code: "signature_invalid" });
  const wrongModelBody = JSON.stringify({ ...envelope, payload: { ...envelope.payload, model: "arbitrary" } });
  assert.deepEqual(validate({
    body: wrongModelBody,
    signature: createHmac("sha256", secret).update(`${timestamp}.${wrongModelBody}`).digest("hex"),
  }), { ok: false, code: "operation_context_invalid" });

  const sources = [
    "lib/conversion-content/adapters/openAiResponsesAdapter.ts",
    "lib/conversion-content/adapters/commercialActivationOpenAiAdapter.ts",
    "lib/conversion-content/adapters/inputCatalogEvaluationOpenAiAdapter.ts",
    "lib/conversion-content/adapters/dynamicMarketResearchOpenAiAdapter.ts",
    "lib/onboarding/niche-resolution/adapters/openAiResolver.ts",
    "automations/supabase-inspect/run.mjs",
    "automations/supabase-inspect/costRecorder.mjs",
    "app/a/[account]/actions.ts",
  ].map((path) => readFileSync(path, "utf8")).join("\n");
  for (const workload of [
    "niche_resolution",
    "commercial_activation_draft_generation",
    "taxon_input_catalog_sufficiency_evaluation",
    "landing_page_dynamic_market_research",
    "supabase_inspect",
  ]) assert.ok(sources.includes(workload), `missing producer ${workload}`);

  const workflow = readFileSync(".github/workflows/pipeline-supabase-inspect.yml", "utf8");
  assert.ok(workflow.includes("SUPABASE_DB_URL_READONLY"));
  assert.equal(workflow.includes("SUPABASE_SECRET_KEY"), false);
  assert.ok(workflow.includes("OPENAI_COST_INGESTION_HMAC_SECRET"));
  const route = readFileSync("app/api/internal/openai-costs/route.ts", "utf8");
  assert.ok(route.includes("activeCostTrackingAdapter[action]"));
  assert.equal(route.includes("openAiCostRecorder[action]"), false);
  console.log("PASS E21.5.3 active cost tracking contracts");
}

void main();
