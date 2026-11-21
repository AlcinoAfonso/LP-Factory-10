import { createCostRecorder } from "./costRecorder.mjs";
import assert from "node:assert/strict";
import { callResponsesApi } from "./responsesClient.mjs";

function recorder(events) {
  return {
    startOperation: async () => { events.push(["start"]); return "operation-1"; },
    finishOperation: async (_id, result, details) => { events.push(["finish", result, details.failureCategory]); },
  };
}

const base = { apiKey: "test", model: "gpt-4.1-mini", tools: [], input: [] };

const transportEvents = [];
await assert.rejects(callResponsesApi({
  ...base,
  costRecorder: recorder(transportEvents),
  fetchImpl: async () => { throw new Error("network"); },
}));
assert.deepEqual(transportEvents, [["start"], ["finish", "failure", "transport_error"]]);

const httpEvents = [];
await assert.rejects(callResponsesApi({
  ...base,
  costRecorder: recorder(httpEvents),
  fetchImpl: async () => new Response("limited", {
    status: 429,
    headers: { "x-request-id": "req_http" },
  }),
}));
assert.deepEqual(httpEvents, [["start"], ["finish", "failure", "http_error"]]);

const jsonEvents = [];
await assert.rejects(callResponsesApi({
  ...base,
  costRecorder: recorder(jsonEvents),
  fetchImpl: async () => new Response("{", {
    status: 200,
    headers: { "x-request-id": "req_json" },
  }),
}));
assert.deepEqual(jsonEvents, [["start"], ["finish", "failure", "invalid_response"]]);

const providerEvents = [];
await assert.rejects(callResponsesApi({
  ...base,
  costRecorder: recorder(providerEvents),
  fetchImpl: async () => new Response(JSON.stringify({ status: "incomplete" }), { status: 200 }),
}));
assert.deepEqual(providerEvents, [["start"], ["finish", "failure", "provider_error"]]);

const successEvents = [];
const response = await callResponsesApi({
  ...base,
  costRecorder: recorder(successEvents),
  fetchImpl: async () => new Response(JSON.stringify({ id: "resp_1", output: [] }), { status: 200 }),
});
assert.equal(response.id, "resp_1");
assert.deepEqual(successEvents, [["start"], ["finish", "success", null]]);

console.log("PASS supabase_inspect OpenAI lifecycle");

const env = {
  OPENAI_COST_INGESTION_ENABLED: "true",
  OPENAI_COST_INGESTION_URL: "https://test.example/ingress",
  OPENAI_COST_INGESTION_PROTOCOL_VERSION: "e21.5.3-v1",
  OPENAI_COST_INGESTION_ENVIRONMENT: "production",
  OPENAI_COST_INGESTION_HMAC_SECRET: "test-only",
};
let providerSends = 0;
const operations = [];
const executions = [];
let lateReceipt;
let terminalSignal;
const attempt = async (mode) => {
  const costs = createCostRecorder(env, async (_url, request) => {
    const envelope = JSON.parse(request.body);
    const { action, payload } = envelope;
    assert.ok(request.headers["x-openai-cost-signature"]);
    if (action === "startExecution") {
      executions.push(payload);
      return Response.json(mode === "old" ? { ok: true }
        : { ok: true, recorded: true, executionId: payload.executionId });
    }
    if (action === "startOperation") {
      operations.push(payload);
      assert.equal(payload.requireAdmission, true);
      if (mode === "error") return new Response(null, { status: 503 });
      if (mode === "late") {
        // Simulate a receipt body that arrives after abort even if the fetch ignores it.
        return {
          ok: true,
          json: () => {
            lateReceipt = new Promise(resolve => setTimeout(
              () => resolve({ ok: true, admitted: true, operationId: payload.operationId }), 5_100,
            ));
            return lateReceipt;
          },
        };
      }
      if (mode === "slow") await new Promise(resolve => setTimeout(resolve, 1_650));
      return Response.json({ ok: true, admitted: mode !== "replay",
        operationId: mode === "other" ? "other-id" : payload.operationId });
    }
    if (mode === "slow") {
      terminalSignal = request.signal;
      return new Promise(() => {});
    }
    return new Response(null, { status: 503 });
  });
  await costs.start();
  return await callResponsesApi({ model: "gpt-4.1-mini", costRecorder: costs, fetchImpl: async () => {
    providerSends++;
    return Response.json({ id: "test-provider-response" });
  }});
};
for (const mode of ["old", "replay", "other", "error", "late"]) {
  await assert.rejects(() => attempt(mode), /financial_admission_unconfirmed/);
}
assert.ok(lateReceipt);
await lateReceipt;
assert.equal(providerSends, 0);
assert.equal((await attempt("slow")).id, "test-provider-response");
assert.equal(terminalSignal?.aborted, true);
assert.equal(providerSends, 1);
assert.equal(new Set(executions.map(item => item.occurrenceId)).size, executions.length);
assert.equal(new Set(operations.map(item => item.operationId)).size, operations.length);
