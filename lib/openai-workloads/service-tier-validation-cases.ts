import assert from "node:assert/strict";
import { requestOpenAiResponses, type OpenAiResponsesResult } from "../openai-responses/openAiResponsesAdapter";
import { readWithOpenAiTierCompatibility } from "./adapters/operationalConfigurationAdapterCore";
import {
  listOpenAiServiceTiers, isEligibleOpenAiServiceTier, openAiServiceTierWasApplied,
  createOpenAiWorkloadSuccessEvent, resolveOpenAiProductWorkload, type OpenAiWorkloadEvent,
} from "./index";

export async function validateOpenAiServiceTiers() {
  assert.deepEqual(listOpenAiServiceTiers("gpt-6-luna"), ["default", "fast"]);
  assert.deepEqual(listOpenAiServiceTiers("gpt-6.1-sol"), ["default", "fast", "ultrafast"]);
  for (const model of ["gpt-6-sol", "GPT-6-Luna", "gpt-6-luna-unknown", "gpt-5.4-mini"]) {
    assert.deepEqual(listOpenAiServiceTiers(model), []);
    assert.equal(isEligibleOpenAiServiceTier(model, "fast"), false);
  }
  assert.equal(openAiServiceTierWasApplied("fast", "priority"), true);
  assert.equal(openAiServiceTierWasApplied("fast", "default"), false);

  const resolved = await resolveOpenAiProductWorkload("commercial_activation_draft_generation", "development");
  assert.equal(resolved.ok, true);
  if (!resolved.ok) return;
  for (const [tier, legacyRequest, expected] of [
    ["fast", "default", "fast"], ["default", "auto", "default"], ["ultrafast", undefined, "ultrafast"],
    [null, undefined, undefined], [null, "default", "default"],
  ] as const) {
    const events: OpenAiWorkloadEvent[] = [];
    let sent: Record<string, unknown> = {};
    const model = tier === "ultrafast" ? "gpt-6.1-sol" : "gpt-6-luna";
    const result: OpenAiResponsesResult<boolean> = await requestOpenAiResponses({
      apiKey: "fixture-key", configuration: { ...resolved.value, model, serviceTier: tier },
      environment: "development", executionOrigin: "administrative_proof",
      financialContext: { universe: "lp_factory", attributionStatus: "attributed", accountId: null },
      request: legacyRequest ? { service_tier: legacyRequest } : {},
      parseResponse: () => ({ ok: true, value: true }),
    }, {
      emitEvent: event => events.push(event),
      fetchImpl: async (_url, init) => {
        sent = JSON.parse(String(init?.body));
        return new Response(JSON.stringify({ id: "resp_tier", status: "completed", service_tier: tier ?? "default" }));
      },
    });
    assert.equal(result.ok, true);
    assert.equal(sent.service_tier, expected);
    assert.equal(sent.model, model);
    assert.equal((sent.reasoning as { effort: string }).effort, resolved.value.reasoningEffort);
    assert.equal(events[0].requestedServiceTier, expected ?? null);
    assert.equal(events[0].appliedServiceTier, tier ?? "default");
  }
  for (const mismatch of [
    { service_tier: "default" }, { service_tier: null },
    { service_tier: "priority", model: "gpt-6.1-sol" },
    { service_tier: "priority", reasoning: { effort: "high" } },
  ]) {
    let parsed = false;
    const events: OpenAiWorkloadEvent[] = [];
    const result: OpenAiResponsesResult<boolean> = await requestOpenAiResponses({
      apiKey: "fixture-key", configuration: { ...resolved.value, model: "gpt-6-luna", reasoningEffort: "medium", serviceTier: "fast" },
      environment: "production", executionOrigin: "runtime", request: {},
      financialContext: { universe: "lp_factory", attributionStatus: "attributed", accountId: null },
      parseResponse: () => { parsed = true; return { ok: true, value: true }; },
    }, { emitEvent: event => events.push(event), fetchImpl: async () => new Response(JSON.stringify({
      id: "resp_mismatch", status: "completed", ...mismatch,
    })) });
    assert.equal(result.ok, false);
    assert.equal(!result.ok && result.reason, "openai_configuration_incompatible");
    assert.equal(parsed, false);
    assert.equal(events[0].providerErrorCode, "active_configuration_mismatch");
    assert.equal(events[0].requestedServiceTier, "fast");
  }
  let called = false;
  const invalid = await requestOpenAiResponses({
    apiKey: "fixture-key", configuration: { ...resolved.value, model: "gpt-6-luna", serviceTier: "ultrafast" },
    environment: "development", executionOrigin: "administrative_proof", request: {},
    financialContext: { universe: "lp_factory", attributionStatus: "attributed", accountId: null },
    parseResponse: () => ({ ok: true, value: true }),
  }, { emitEvent: () => undefined, fetchImpl: async () => { called = true; return new Response(); } });
  assert.equal(invalid.ok, false);
  assert.equal(called, false);

  for (const code of ["42501", "PGRST301", "08006", "42703"]) {
    let count = 0;
    await readWithOpenAiTierCompatibility(async () => {
      count++; return { data: null, error: { code, message: "another column does not exist" } };
    });
    assert.equal(count, 1);
  }
  let include: boolean[] = [];
  const legacy = await readWithOpenAiTierCompatibility(async withTier => {
    include.push(withTier);
    return withTier ? { data: null, error: { code: "42703", message: "column service_tier does not exist" } }
      : { data: [{ model: "gpt-6-luna" }], error: null };
  });
  assert.deepEqual(include, [true, false]);
  assert.equal(legacy.error, null);
  include = [];
  await readWithOpenAiTierCompatibility(async withTier => {
    include.push(withTier); return { data: [{ service_tier: "fast" }], error: null };
  });
  assert.deepEqual(include, [true]);

  const sanitized = createOpenAiWorkloadSuccessEvent({
    workload: resolved.value.id, configurationSource: resolved.value.source,
    configurationRevision: resolved.value.revision, model: resolved.value.model,
    reasoningEffort: resolved.value.reasoningEffort, requestedServiceTier: "secret-not-a-tier",
    appliedServiceTier: { unsafe: "payload" },
  });
  assert.equal(sanitized.requestedServiceTier, null);
  assert.equal(sanitized.appliedServiceTier, null);
  console.log("ok - E21.2 exact tiers, explicit wire precedence, legacy preservation, telemetry and narrow schema compatibility");
}
