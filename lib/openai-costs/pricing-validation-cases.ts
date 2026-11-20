import assert from "node:assert/strict";
import { calculateOpenAiOperationCost, OPENAI_COST_PRICING_CATALOG, OPENAI_COST_PRICING_EFFECTIVE_AT,
  openAiFinancialCoverage } from "./pricing";
import { openAiCostResponseEvidence, openAiCostWebSearchCallCount } from "./recorder";
import { operationFinancialTerminal, operationFinishRpc } from "./adapters/activeCostTrackingAdapterCore";
import { requestOpenAiResponses, type OpenAiResponsesResult } from "../openai-responses/openAiResponsesAdapter";
import { resolveOpenAiProductWorkload } from "../openai-workloads";
import type { OpenAiCostOperationTerminal, OpenAiCostTrackingAdapter } from "./active-contracts";

const usage = { inputTokens: 1000, cachedInputTokens: 0, cacheWriteTokens: 0,
  outputTokens: 500, reasoningTokens: 400, totalTokens: 1500 };
const base = { model: "gpt-6.1-terra", appliedModel: "gpt-6.1-terra", modality: "responses_text",
  requestedServiceTier: "fast", appliedServiceTier: "default", startedAt: OPENAI_COST_PRICING_EFFECTIVE_AT, usage };

export async function validatePricingCorrection() {
  // Independent expected totals from official per-million tables, not a second calculator.
  for (const [model, tier, expected] of [
    ["gpt-6.1-terra", "default", "0.0035"], ["gpt-6.1-terra", "fast", "0.007"],
    ["gpt-6.1-terra", "priority", "0.007"], ["gpt-6.1-sol", "default", "0.007"],
    ["gpt-6.1-sol", "fast", "0.014"], ["gpt-6.1-sol", "ultrafast", "0.042"],
    ["gpt-6-luna", "default", "0.00035"], ["gpt-6-luna", "fast", "0.0007"],
    ["gpt-5.4-mini", "fast", "0.006"], ["gpt-4.1-mini", "fast", "0.0021"],
    ["gpt-4.1-mini-2025-04-14", "default", "0.0012"], ["gpt-5.4-mini-2026-03-17", "default", "0.003"],
  ]) {
    const actual = calculateOpenAiOperationCost({ ...base, model, appliedModel: model, appliedServiceTier: tier });
    assert.equal(actual.costUsd, expected, `${model}/${tier}`);
    assert.equal(actual.pricingSnapshot?.requestedServiceTier, "fast");
    assert.equal(actual.pricingSnapshot?.appliedServiceTier, tier);
    assert.deepEqual(actual.pricingSnapshot?.sourceUrls, OPENAI_COST_PRICING_CATALOG.sourceUrls);
  }
  for (const [tokens, expected, band] of [[272000, "0.272", "short"], [272001, "0.544002", "long"]] as const) {
    const actual = calculateOpenAiOperationCost({ ...base, usage: { ...usage, inputTokens: tokens, outputTokens: 0,
      reasoningTokens: 0, totalTokens: tokens } });
    assert.equal(actual.costUsd, expected);
    assert.equal(actual.pricingSnapshot?.contextBand, band);
  }
  const mixed = { ...base, usage: { ...usage, inputTokens: 12000, cachedInputTokens: 4000, cacheWriteTokens: 7000,
    outputTokens: 1000, reasoningTokens: 1000, totalTokens: 13000 }, cacheWriteTokens30m: 3000, cacheWriteTokens12h: 4000 };
  assert.equal(calculateOpenAiOperationCost(mixed).costUsd, "0.01995");
  assert.equal(calculateOpenAiOperationCost({ ...mixed, webSearchRequested: true, webSearchCallCount: 2 }).costUsd, "0.03995");
  assert.equal(calculateOpenAiOperationCost({ ...mixed, appliedServiceTier: "fast" }).costUsd, "0.0399");
  assert.equal(calculateOpenAiOperationCost({ ...mixed, model: "gpt-6.1-sol", appliedModel: "gpt-6.1-sol",
    appliedServiceTier: "ultrafast" }).costUsd, "0.2394");
  const longMixed = calculateOpenAiOperationCost({ ...mixed, usage: { ...mixed.usage, inputTokens: 300000, totalTokens: 301000 } });
  assert.equal(longMixed.costUsd, "0.6134");
  assert.equal(longMixed.pricingSnapshot?.cacheWrite12hPerMillionUsd, "5");
  for (const [patch, reason] of [
    [{ appliedServiceTier: null }, "applied_service_tier_missing"],
    [{ appliedServiceTier: "auto" }, "pricing_not_found"],
    [{ appliedServiceTier: "ultrafast" }, "pricing_not_found"],
    [{ appliedModel: null }, "applied_model_missing"],
    [{ appliedModel: "gpt-6.1-terra-2099-01-01" }, "pricing_not_found"],
    [{ modality: "image_generation" }, "modality_not_covered"],
    [{ usage: null }, "usage_missing"],
    [{ usage: { ...usage, cachedInputTokens: null } }, "usage_component_missing_or_invalid"],
    [{ usage: { ...usage, cacheWriteTokens: null } }, "usage_component_missing_or_invalid"],
    [{ usage: { ...usage, inputTokens: Number.MAX_SAFE_INTEGER + 1 } }, "usage_component_missing_or_invalid"],
    [{ usage: { ...usage, cachedInputTokens: 1001 } }, "usage_overlap"],
    [{ usage: { ...usage, totalTokens: 2 } }, "usage_total_mismatch"],
    [{ webSearchRequested: true, webSearchCallCount: null }, "web_search_usage_missing"],
    [{ webSearchCallCount: -1 }, "web_search_usage_invalid"],
  ] as const) {
    const actual = calculateOpenAiOperationCost({ ...base, ...patch });
    assert.equal(actual.costUnavailableReason, reason);
    assert.equal(actual.costUsd, null);
    assert.ok(actual.pricingSnapshot, "retain safe financial evidence even when unavailable");
  }
  assert.equal(calculateOpenAiOperationCost({ ...mixed, cacheWriteTokens30m: null }).costUnavailableReason, "cache_retention_usage_missing");
  assert.equal(calculateOpenAiOperationCost({ ...mixed, cacheWriteTokens12h: 3999 }).costUnavailableReason, "cache_retention_usage_mismatch");
  assert.equal(calculateOpenAiOperationCost({ ...base, startedAt: "2026-11-16T10:31:56.999Z" }).costUsd, null,
    "new prices cannot be applied before the controlled coverage cut");
  assert.equal(calculateOpenAiOperationCost(base, { ...OPENAI_COST_PRICING_CATALOG, effectiveUntil: base.startedAt }).costUsd, null);
  assert.equal(openAiFinancialCoverage("gpt-6.1-terra", "ultrafast", base.startedAt).covered, false);
  assert.equal(openAiFinancialCoverage("gpt-6.1-sol", "ultrafast", base.startedAt).covered, true);
  assert.equal(openAiFinancialCoverage("unreviewed-model", "default", base.startedAt).covered, false);
  assert.equal(openAiFinancialCoverage("gpt-6.1-terra", null, base.startedAt).covered, false);

  const safe = openAiCostResponseEvidence({ model: base.model, service_tier: "fast", usage: {
    input_tokens: 12000, input_tokens_details: { cached_tokens: 4000, cache_write_tokens: 7000,
      cache_write_tokens_details: { ttl_30m_tokens: 3000, ttl_12h_tokens: 4000 } },
    output_tokens: 1000, total_tokens: 13000 }, output_text: "PRIVATE_BUSINESS_PAYLOAD", secret: "PRIVATE_SECRET" });
  assert.equal(safe.cacheWriteTokens12h, 4000);
  assert.ok(!JSON.stringify(safe).includes("PRIVATE_"));
  assert.equal(openAiCostWebSearchCallCount({ output: [
    { type: "web_search_call", action: { type: "search" } },
    { type: "web_search_call", action: { type: "open_page" } },
    { type: "web_search_call", action: { type: "find_in_page" } },
  ] }, true), 1, "only search actions incur the search tool fee");
  assert.equal(openAiCostWebSearchCallCount({ output: [{ type: "web_search_call" }] }, true), null);
  assert.equal(openAiCostWebSearchCallCount({}, true), null);
  assert.equal(openAiCostWebSearchCallCount({ tool_usage: { web_search: { num_requests: 2 } }, output: [] }, true), 2);
  assert.equal(openAiCostWebSearchCallCount({ tool_usage: { web_search: { num_requests: -1 } }, output: [] }, true), null);
  const terminal: OpenAiCostOperationTerminal = { operationId: "40000000-0000-4000-8000-000000000001",
    result: "failure", failureCategory: "provider_error", ...safe, requestedServiceTier: "fast", finishedAt: "2026-11-16T10:32:00.000Z" };
  const financial = operationFinancialTerminal({ model: base.model, started_at: base.startedAt, finished_at: null }, terminal);
  assert.equal(financial.costUsd, "0.0399", "a failed functional response still has its actual billable usage");
  const closed = { model: base.model, started_at: base.startedAt, finished_at: terminal.finishedAt,
    cost_status: "calculated", cost_usd: "0.000000000001", cost_unavailable_reason: null,
    pricing_snapshot: financial.pricingSnapshot, pricing_version: "historical-frozen-tariff",
    pricing_effective_at: base.startedAt, web_search_tool_version: null, web_search_price_per_call_usd: null };
  assert.equal(operationFinancialTerminal(closed, terminal).costUsd, "0.000000000001",
    "replay must retain the exact closed amount rather than recalculate it");
  assert.throws(() => operationFinancialTerminal(closed, { ...terminal, appliedServiceTier: "default" }), /conflict/);
  assert.equal(operationFinishRpc(terminal, financial).p_cost_usd, "0.0399");
  validateGpt62SolStandard();
  await validateTransportEvidence();
  console.log("PASS D10 pricing: official tiers/context/mixed retention/search/missing evidence/closed replay");
}

function validateGpt62SolStandard() {
  const model = "gpt-6.2-sol";
  const startedAt = "2026-11-20T14:09:20.000Z";
  const before = "2026-11-20T14:09:19.999Z";
  const input = { ...base, model, appliedModel: model, startedAt, requestedServiceTier: "default",
    cacheWriteTokens30m: 3000, cacheWriteTokens12h: 4000, webSearchRequested: true, webSearchCallCount: 2 };
  const cases = [
    [272_000, "short", "0.5799", ["2", "0.1", "2.5", "5", "10"]],
    [272_001, "long", "1.134804", ["4", "0.2", "5", "10", "15"]],
  ] as const;
  for (const [inputTokens, band, total, rates] of cases) {
    const actual = calculateOpenAiOperationCost({ ...input, usage: { inputTokens, cachedInputTokens: 4000,
      cacheWriteTokens: 7000, outputTokens: 1000, reasoningTokens: 500, totalTokens: inputTokens + 1000 } });
    const snapshot = actual.pricingSnapshot;
    assert.equal(actual.costStatus, "calculated");
    assert.equal(actual.costUsd, total);
    assert.equal(actual.pricingVersion, "2026-11-20-gpt-6.2-sol-standard-v4");
    assert.equal(actual.pricingEffectiveAt, startedAt);
    assert.equal(snapshot?.currency, "usd");
    assert.equal(snapshot?.processing, "standard");
    assert.equal(snapshot?.contextBand, band);
    assert.equal(snapshot?.ordinaryInputTokens, inputTokens - 11_000);
    assert.deepEqual([snapshot?.inputPerMillionUsd, snapshot?.cachedInputPerMillionUsd, snapshot?.cacheWritePerMillionUsd,
      snapshot?.cacheWrite12hPerMillionUsd, snapshot?.outputPerMillionUsd], rates);
    assert.equal(actual.webSearchPricePerCallUsd, "0.01");
  }
  const plain = { ...input, cacheWriteTokens30m: 0, cacheWriteTokens12h: 0 };
  for (const [patch, reason] of [
    [{ startedAt: before }, "pricing_not_found"],
    [{ appliedServiceTier: "fast" }, "pricing_not_found"],
    [{ appliedServiceTier: "ultrafast" }, "pricing_not_found"],
    [{ appliedServiceTier: null }, "applied_service_tier_missing"],
    [{ appliedModel: "gpt-6.2-sol-2099-01-01" }, "pricing_not_found"],
    [{ usage: null }, "usage_missing"],
    [{ webSearchCallCount: null }, "web_search_usage_missing"],
    [{ usage: { ...usage, cacheWriteTokens: 1 }, cacheWriteTokens12h: null }, "cache_retention_usage_missing"],
  ] as const) {
    const actual = calculateOpenAiOperationCost({ ...plain, ...patch });
    assert.equal(actual.costUnavailableReason, reason);
    assert.equal(actual.costUsd, null);
  }
  assert.equal(openAiFinancialCoverage(model, "default", startedAt).covered, true);
  assert.equal(openAiFinancialCoverage(model, "default", before).covered, false);
  assert.equal(openAiFinancialCoverage(model, "fast", startedAt).covered, false);
  assert.deepEqual(calculateOpenAiOperationCost({ ...base, startedAt }), calculateOpenAiOperationCost(base),
    "the scoped tariff must leave existing models' prices and snapshot versions intact");
}

async function validateTransportEvidence() {
  const resolved = await resolveOpenAiProductWorkload("communication_base_stage2_intelligence", "development");
  assert.ok(resolved.ok);
  const terminals: OpenAiCostOperationTerminal[] = [];
  const contexts: Parameters<OpenAiCostTrackingAdapter["startExecution"]>[0]["economicContext"][] = [];
  const recorder: OpenAiCostTrackingAdapter = { startExecution: async ({ economicContext }) => { contexts.push(economicContext); }, startOperation: async () => {},
    finishOperation: async (terminal) => { terminals.push(terminal); }, finishExecution: async () => {} };
  for (const responseTier of ["fast", "default", null]) {
    const result: OpenAiResponsesResult<string> = await requestOpenAiResponses<string>({ apiKey: "fake-test-only-key", environment: "preview",
      configuration: { ...resolved.value, model: "gpt-6.1-terra", serviceTier: "fast" },
      request: { tools: [{ type: "web_search" }] }, parseResponse: () => ({ ok: true, value: "valid" }),
      financialContext: { universe: "client", attributionStatus: "attributed", accountId: "40000000-0000-4000-8000-000000000099" },
      executionOrigin: "runtime" }, { costRecorder: recorder, emitEvent: () => {}, nowIso: () => base.startedAt,
      fetchImpl: async () => new Response(JSON.stringify({ model: base.model, service_tier: responseTier, status: "completed",
        usage: { input_tokens: 1000, input_tokens_details: { cached_tokens: 0, cache_write_tokens: 0 },
          output_tokens: 500, total_tokens: 1500 }, output: [{ type: "web_search_call", action: { type: "search" } }] })) });
    assert.equal(result.ok, responseTier === "fast", "financial correction must preserve E21.2 compatibility behavior");
    const terminal = terminals.at(-1)!;
    assert.equal(terminal.appliedServiceTier, responseTier);
    assert.equal(terminal.requestedServiceTier, "fast");
    const calculated = calculateOpenAiOperationCost({ ...terminal, model: base.model, startedAt: base.startedAt });
    assert.equal(calculated.costUsd, responseTier === "fast" ? "0.017" : responseTier === "default" ? "0.0135" : null);
  }
  const model = "gpt-6.2-sol";
  const startedAt = "2026-11-20T14:09:20.000Z";
  const financialContext = { universe: "client", attributionStatus: "attributed",
    accountId: "40000000-0000-4000-8000-000000000099" } as const;
  const result = await requestOpenAiResponses({ apiKey: "fake-test-only-key", environment: "preview",
    // E21.2 has no explicit tier configured for this model. Standard comes from the provider response.
    configuration: { ...resolved.value, model, serviceTier: null }, request: {},
    parseResponse: () => ({ ok: true, value: "valid" }), financialContext, executionOrigin: "runtime" }, {
    costRecorder: recorder, emitEvent: () => {}, nowIso: () => startedAt,
    fetchImpl: async () => new Response(JSON.stringify({ model, service_tier: "default", status: "completed",
      usage: { input_tokens: 1000, input_tokens_details: { cached_tokens: 0, cache_write_tokens: 0 },
        output_tokens: 500, total_tokens: 1500 }, output: [] })),
  });
  assert.ok(result.ok);
  assert.deepEqual(contexts.at(-1), financialContext);
  const terminal = terminals.at(-1)!;
  const cost = operationFinancialTerminal({ model, started_at: startedAt, finished_at: null }, terminal);
  assert.equal(operationFinishRpc(terminal, cost).p_cost_usd, "0.007");
}
