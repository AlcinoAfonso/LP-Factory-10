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
