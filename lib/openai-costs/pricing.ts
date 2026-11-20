import type { OpenAiWorkloadUsage } from "../openai-workloads";
import {
  addDecimal,
  decimalFromNonNegativeString,
  decimalZero,
  divideDecimalByPowerOfTen,
  formatDecimal,
  multiplyDecimalByNonNegativeInteger,
  type DecimalValue,
} from "./decimal";

export const OPENAI_COST_PRICING_VERSION = "2026-11-16-service-cache-v3";
// Controlled financial coverage starts at verification, never at an inferred release date.
export const OPENAI_COST_PRICING_EFFECTIVE_AT = "2026-11-16T10:31:57.000Z";
export const OPENAI_COST_PRICING_SOURCES = Object.freeze([
  "https://developers.openai.com/api/docs/pricing.md",
  "https://developers.openai.com/api/docs/guides/prompt-caching.md",
  "https://developers.openai.com/api/docs/guides/fast-mode.md",
  "https://developers.openai.com/api/docs/guides/ultrafast-mode.md",
  "https://developers.openai.com/api/docs/guides/tools-web-search.md",
  "https://developers.openai.com/api/docs/models/gpt-4.1-mini.md",
  "https://developers.openai.com/api/docs/models/gpt-5.4-mini.md",
]);
const PREVIOUS_PRICING_VERSION = "2026-09-27-standard-v2";
const PREVIOUS_PRICING_EFFECTIVE_AT = "2026-09-27T22:41:15.000Z";
export const OPENAI_WEB_SEARCH_TOOL_VERSION = "web-search-2026-09-11-v1";
const LEGACY_PRICING_VERSION = "2026-09-11-standard-v1";
const LEGACY_PRICING_EFFECTIVE_AT = "2026-09-11T00:00:00.000Z";

export type OpenAiModelPricingRule = Readonly<{
  model: string;
  serviceTier?: "default" | "fast" | "ultrafast" | "flex";
  effectiveUntil?: string;
  inputPerMillionUsd: string;
  cachedInputPerMillionUsd: string;
  cacheWritePerMillionUsd: string | null;
  cacheWrite12hPerMillionUsd?: string | null;
  outputPerMillionUsd: string;
  longContext?: Readonly<{
    thresholdInputTokens: number;
    inputPerMillionUsd: string;
    cachedInputPerMillionUsd: string;
    cacheWritePerMillionUsd: string;
    cacheWrite12hPerMillionUsd?: string | null;
    outputPerMillionUsd: string;
  }>;
}>;

export type OpenAiCostPricingCatalog = Readonly<{
  version: string;
  effectiveAt: string;
  effectiveUntil?: string;
  verifiedAt?: string;
  sourceUrls?: readonly string[];
  modelRules: readonly OpenAiModelPricingRule[];
  webSearch: Readonly<{
    toolVersion: string;
    pricePerCallUsd: string;
  }> | null;
}>;

export type OpenAiCostFinancialTerminal = Readonly<{
  costStatus: "calculated" | "unavailable";
  costUnavailableReason: string | null;
  costUsd: string | null;
  pricingVersion: string | null;
  pricingEffectiveAt: string | null;
  pricingSnapshot: Readonly<Record<string, unknown>> | null;
  webSearchToolVersion: string | null;
  webSearchPricePerCallUsd: string | null;
}>;

const LEGACY_RULES = Object.freeze([
  rule("gpt-5.4-mini", "0.75", "0.075", null, "4.50"),
  rule("gpt-5.6-terra", "2.00", "0.20", "2.50", "12.00", [272_000, "4.00", "0.40", "5.00", "18.00"]),
  rule("gpt-5.6-luna", "0.20", "0.02", "0.25", "1.20", [272_000, "0.40", "0.04", "0.50", "1.80"]),
  rule("gpt-4.1-mini", "0.40", "0.10", null, "1.60"),
] satisfies readonly OpenAiModelPricingRule[]);
const RULES = Object.freeze([
  ...LEGACY_RULES,
  rule("gpt-6-luna", "0.10", "0.01", "0.125", "0.50", [272_000, "0.20", "0.02", "0.25", "0.75"]),
  rule("gpt-6-sol", "2.00", "0.20", "2.50", "10.00", [272_000, "4.00", "0.40", "5.00", "15.00"]),
] satisfies readonly OpenAiModelPricingRule[]);
const WEB_SEARCH_PRICING = Object.freeze({
  toolVersion: OPENAI_WEB_SEARCH_TOOL_VERSION,
  pricePerCallUsd: "0.01",
});
const LEGACY_PRICING_CATALOG: OpenAiCostPricingCatalog = Object.freeze({
  version: LEGACY_PRICING_VERSION,
  effectiveAt: LEGACY_PRICING_EFFECTIVE_AT,
  modelRules: LEGACY_RULES,
  webSearch: WEB_SEARCH_PRICING,
});

const PREVIOUS_PRICING_CATALOG: OpenAiCostPricingCatalog = Object.freeze({
  version: PREVIOUS_PRICING_VERSION,
  effectiveAt: PREVIOUS_PRICING_EFFECTIVE_AT,
  modelRules: RULES,
  webSearch: WEB_SEARCH_PRICING,
});

export const OPENAI_COST_PRICING_CATALOG: OpenAiCostPricingCatalog = Object.freeze({
  version: OPENAI_COST_PRICING_VERSION,
  effectiveAt: OPENAI_COST_PRICING_EFFECTIVE_AT,
  verifiedAt: OPENAI_COST_PRICING_EFFECTIVE_AT,
  sourceUrls: OPENAI_COST_PRICING_SOURCES,
  modelRules: Object.freeze([
    ...currentRules("gpt-6.1-terra", ["1", "0.05", "1.25", "2.5", "5"], ["2", "0.1", "2.5", "5", "7.5"],
      ["2", "0.1", "2.5", "5", "10"], ["4", "0.2", "5", "10", "15"]),
    ...currentRules("gpt-6.1-sol", ["2", "0.1", "2.5", "5", "10"], ["4", "0.2", "5", "10", "15"],
      ["4", "0.2", "5", "10", "20"], ["8", "0.4", "10", "20", "30"]),
    currentRule("gpt-6.1-sol", "ultrafast", ["12", "0.6", "15", "30", "60"], ["24", "1.2", "30", "60", "90"]),
    ...currentRules("gpt-6-luna", ["0.1", "0.01", "0.125", "0.25", "0.5"], ["0.2", "0.02", "0.25", "0.5", "0.75"],
      ["0.2", "0.02", "0.25", "0.5", "1"], ["0.4", "0.04", "0.5", "1", "1.5"]),
    ...currentRules("gpt-6-sol", ["2", "0.2", "2.5", "5", "10"], ["4", "0.4", "5", "10", "15"],
      ["4", "0.4", "5", "10", "20"], ["8", "0.8", "10", "20", "30"]),
    ...currentRules("gpt-5.6-terra", ["2", "0.2", "2.5", "5", "12"], ["4", "0.4", "5", "10", "18"],
      ["4", "0.4", "5", "10", "24"], ["8", "0.8", "10", "20", "36"]),
    ...currentRules("gpt-5.6-luna", ["0.2", "0.02", "0.25", "0.5", "1.2"], ["0.4", "0.04", "0.5", "1", "1.8"],
      ["0.4", "0.04", "0.5", "1", "2.4"], ["0.8", "0.08", "1", "2", "3.6"]),
    { ...rule("gpt-5.4-mini", "0.75", "0.075", null, "4.5"), serviceTier: "default" as const },
    { ...rule("gpt-5.4-mini", "1.5", "0.15", null, "9"), serviceTier: "fast" as const },
    { ...rule("gpt-4.1-mini", "0.4", "0.1", null, "1.6"), serviceTier: "default" as const },
    { ...rule("gpt-4.1-mini", "0.7", "0.175", null, "2.8"), serviceTier: "fast" as const },
  ].map((entry) => Object.freeze(entry))),
  webSearch: WEB_SEARCH_PRICING,
});

// The verified cut applies only to GPT-6.2 Sol. Other models retain their existing tariff versions.
const GPT_6_2_SOL_STANDARD_EFFECTIVE_AT = "2026-11-20T14:09:20.000Z";
const GPT_6_2_SOL_STANDARD_CATALOG: OpenAiCostPricingCatalog = Object.freeze({
  version: "2026-11-20-gpt-6.2-sol-standard-v4",
  effectiveAt: GPT_6_2_SOL_STANDARD_EFFECTIVE_AT,
  verifiedAt: GPT_6_2_SOL_STANDARD_EFFECTIVE_AT,
  sourceUrls: Object.freeze([
    "https://developers.openai.com/api/docs/models/gpt-6.2-sol",
    "https://developers.openai.com/api/docs/pricing",
  ]),
  modelRules: Object.freeze([
    currentRule("gpt-6.2-sol", "default", ["2", "0.1", "2.5", "5", "10"], ["4", "0.2", "5", "10", "15"]),
  ]),
  webSearch: WEB_SEARCH_PRICING,
});

// Old tariff versions remain recoverable; terminal reads never call the calculator.
export const OPENAI_COST_PRICING_CATALOGS = Object.freeze([
  { ...LEGACY_PRICING_CATALOG, effectiveUntil: PREVIOUS_PRICING_EFFECTIVE_AT },
  { ...PREVIOUS_PRICING_CATALOG, effectiveUntil: OPENAI_COST_PRICING_EFFECTIVE_AT },
  OPENAI_COST_PRICING_CATALOG,
  GPT_6_2_SOL_STANDARD_CATALOG,
]);

type PricingInput = Readonly<{
  model: string;
  startedAt: string;
  requestedServiceTier?: string | null;
  appliedServiceTier?: string | null;
  appliedModel?: string | null;
  modality?: string | null;
  cacheWriteTokens30m?: number | null;
  cacheWriteTokens12h?: number | null;
  usage?: OpenAiWorkloadUsage | null;
  webSearchCallCount?: number | null;
  webSearchRequested?: boolean;
}>;

export function calculateOpenAiOperationCost(input: PricingInput,
  catalog: OpenAiCostPricingCatalog = selectPricingCatalog(input.startedAt, input.appliedModel)): OpenAiCostFinancialTerminal {
  const evidence = Object.freeze({
    requestedServiceTier: safeTier(input.requestedServiceTier),
    appliedServiceTier: safeTier(input.appliedServiceTier),
    appliedModel: safeModel(input.appliedModel),
    modality: input.modality === "responses_text" ? input.modality : null,
    cacheWriteTokens30m: metric(input.cacheWriteTokens30m),
    cacheWriteTokens12h: metric(input.cacheWriteTokens12h),
  });
  const fail = (reason: string) => ({ ...unavailable(reason), pricingSnapshot: evidence });
  const startedAt = timestamp(input.startedAt);
  if (!startedAt || startedAt < catalog.effectiveAt || (catalog.effectiveUntil && startedAt >= catalog.effectiveUntil)) {
    return fail("pricing_not_effective");
  }
  if (!evidence.appliedServiceTier) return fail("applied_service_tier_missing");
  const tier = evidence.appliedServiceTier === "priority" ? "fast" : evidence.appliedServiceTier;
  if (!evidence.appliedModel) return fail("applied_model_missing");
  if (evidence.modality !== "responses_text") return fail("modality_not_covered");
  const pricing = catalog.modelRules.find((candidate) => candidate.model === financialModelId(evidence.appliedModel!) &&
    (candidate.serviceTier ?? "default") === tier && (!candidate.effectiveUntil || startedAt < candidate.effectiveUntil));
  if (!pricing) return fail("pricing_not_found");
  const usage = input.usage;
  if (!usage || usage.inputTokens === null || usage.outputTokens === null) {
    return fail("usage_missing");
  }
  if ([usage.inputTokens, usage.outputTokens, usage.cachedInputTokens,
    ...(pricing.cacheWritePerMillionUsd !== null ? [usage.cacheWriteTokens] : [])].some((value) => metric(value) === null)) {
    return fail("usage_component_missing_or_invalid");
  }
  const cached = usage.cachedInputTokens!;
  const cacheWrite = usage.cacheWriteTokens ?? 0; // Older models have no billed cache writes.
  if (usage.cacheWriteTokens !== null && metric(usage.cacheWriteTokens) === null) return fail("usage_invalid");
  const write30m = metric(input.cacheWriteTokens30m);
  const write12h = metric(input.cacheWriteTokens12h);
  if (cacheWrite > 0 && (write30m === null || write12h === null)) return fail("cache_retention_usage_missing");
  if ((write30m !== null || write12h !== null) &&
      (write30m === null || write12h === null || write30m + write12h !== cacheWrite)) return fail("cache_retention_usage_mismatch");
  const ordinaryInput = usage.inputTokens - cached - cacheWrite;
  if (ordinaryInput < 0) return fail("usage_overlap");
  if (usage.totalTokens !== null && usage.totalTokens !== usage.inputTokens + usage.outputTokens) {
    return fail("usage_total_mismatch");
  }
  if (cacheWrite > 0 && pricing.cacheWritePerMillionUsd === null) {
    return fail("cache_write_pricing_missing");
  }
  if (input.webSearchRequested && input.webSearchCallCount == null) {
    return fail("web_search_usage_missing");
  }
  const webSearchCalls = input.webSearchCallCount ?? 0;
  if (!Number.isSafeInteger(webSearchCalls) || webSearchCalls < 0) {
    return fail("web_search_usage_invalid");
  }

  const longContext = pricing.longContext && usage.inputTokens > pricing.longContext.thresholdInputTokens
    ? pricing.longContext
    : null;
  const selected = longContext ?? pricing;
  let total = decimalZero();
  for (const [tokens, price] of [
    [ordinaryInput, selected.inputPerMillionUsd],
    [cached, selected.cachedInputPerMillionUsd],
    [write30m ?? 0, selected.cacheWritePerMillionUsd],
    [write12h ?? 0, selected.cacheWrite12hPerMillionUsd ?? null],
    [usage.outputTokens, selected.outputPerMillionUsd],
  ] as const) {
    if (tokens === 0) continue;
    if (price === null) return fail("pricing_component_missing");
    const component = perMillionCost(tokens, price);
    if (!component) return fail("pricing_invalid");
    total = addDecimal(total, component);
  }
  const webSearchRule = catalog.webSearch;
  if (webSearchCalls > 0) {
    if (!webSearchRule) return fail("web_search_pricing_missing");
    if (pricing.model === "gpt-4.1-mini") return fail("web_search_fixed_content_usage_not_covered");
    const price = decimalFromNonNegativeString(webSearchRule.pricePerCallUsd);
    const component = price && multiplyDecimalByNonNegativeInteger(price, webSearchCalls);
    if (!component) return fail("web_search_pricing_missing");
    total = addDecimal(total, component);
  }

  return Object.freeze({
    costStatus: "calculated",
    costUnavailableReason: null,
    costUsd: formatDecimal(total),
    pricingVersion: catalog.version,
    pricingEffectiveAt: catalog.effectiveAt,
    pricingSnapshot: Object.freeze({
      currency: "usd",
      ...evidence,
      requestedModel: safeModel(input.model),
      processing: tier === "default" ? "standard" : tier,
      sourceUrls: catalog.sourceUrls ?? null,
      verifiedAt: catalog.verifiedAt ?? null,
      effectiveUntil: catalog.effectiveUntil ?? null,
      contextBand: longContext ? "long" : "short",
      longContextThresholdInputTokens: pricing.longContext?.thresholdInputTokens ?? null,
      tokenUnit: "per_million",
      model: pricing.model,
      inputPerMillionUsd: selected.inputPerMillionUsd,
      cachedInputPerMillionUsd: selected.cachedInputPerMillionUsd,
      cacheWritePerMillionUsd: selected.cacheWritePerMillionUsd,
      cacheWrite12hPerMillionUsd: selected.cacheWrite12hPerMillionUsd ?? null,
      ordinaryInputTokens: ordinaryInput,
      outputPerMillionUsd: selected.outputPerMillionUsd,
      webSearch: webSearchCalls > 0 ? Object.freeze({
        toolVersion: webSearchRule?.toolVersion,
        unit: "per_call",
        pricePerCallUsd: webSearchRule?.pricePerCallUsd,
        callCount: webSearchCalls,
      }) : null,
    }),
    webSearchToolVersion: webSearchCalls > 0 ? webSearchRule?.toolVersion ?? null : null,
    webSearchPricePerCallUsd: webSearchCalls > 0 ? webSearchRule?.pricePerCallUsd ?? null : null,
  });
}

function selectPricingCatalog(startedAt: string, appliedModel?: string | null): OpenAiCostPricingCatalog {
  const normalized = timestamp(startedAt);
  return [...OPENAI_COST_PRICING_CATALOGS].reverse().find((entry) => normalized && normalized >= entry.effectiveAt &&
    (entry !== GPT_6_2_SOL_STANDARD_CATALOG || appliedModel === "gpt-6.2-sol"))
    ?? OPENAI_COST_PRICING_CATALOGS[0];
}

// Informative financial coverage only. E21.2 retains every activation decision.
export function openAiFinancialCoverage(model: string, serviceTier: string | null | undefined,
  at = new Date().toISOString()) {
  const catalog = selectPricingCatalog(at, model);
  const tier = serviceTier === "priority" ? "fast" : serviceTier;
  const covered = Boolean(tier && catalog.modelRules.some((entry) => entry.model === financialModelId(model) &&
    (entry.serviceTier ?? "default") === tier && (!entry.effectiveUntil || at < entry.effectiveUntil)) &&
    at >= catalog.effectiveAt && (!catalog.effectiveUntil || at < catalog.effectiveUntil));
  return { covered, version: catalog.version, effectiveAt: catalog.effectiveAt };
}

type Rates = readonly [string, string, string, string, string];
function financialModelId(model: string): string {
  // Only official default snapshots verified in the model pages; never strip an arbitrary suffix.
  const snapshots: Readonly<Record<string, string>> = {
    "gpt-4.1-mini-2025-04-14": "gpt-4.1-mini",
    "gpt-5.4-mini-2026-03-17": "gpt-5.4-mini",
  };
  return snapshots[model] ?? model;
}

function currentRule(model: string, serviceTier: "default" | "fast" | "ultrafast", short: Rates, long: Rates): OpenAiModelPricingRule {
  return Object.freeze({
    model, serviceTier, inputPerMillionUsd: short[0], cachedInputPerMillionUsd: short[1],
    cacheWritePerMillionUsd: short[2], cacheWrite12hPerMillionUsd: short[3], outputPerMillionUsd: short[4],
    longContext: Object.freeze({ thresholdInputTokens: 272_000, inputPerMillionUsd: long[0], cachedInputPerMillionUsd: long[1],
      cacheWritePerMillionUsd: long[2], cacheWrite12hPerMillionUsd: long[3], outputPerMillionUsd: long[4] }),
  });
}
function currentRules(model: string, short: Rates, long: Rates, fastShort: Rates, fastLong: Rates) {
  return [currentRule(model, "default", short, long), currentRule(model, "fast", fastShort, fastLong)];
}

function safeTier(value: unknown) {
  return typeof value === "string" && ["default", "fast", "priority", "ultrafast", "auto", "flex", "scale"].includes(value) ? value : null;
}
function safeModel(value: unknown) {
  return typeof value === "string" && /^[a-zA-Z0-9._-]{1,128}$/.test(value) ? value : null;
}
function metric(value: unknown): number | null {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0 ? value : null;
}

export function unavailableOpenAiOperationCost(
  reason = "pricing_not_evaluated",
): OpenAiCostFinancialTerminal {
  return unavailable(reason);
}

function rule(
  model: OpenAiModelPricingRule["model"],
  inputPerMillionUsd: string,
  cachedInputPerMillionUsd: string,
  cacheWritePerMillionUsd: string | null,
  outputPerMillionUsd: string,
  longContext?: readonly [number, string, string, string, string],
): OpenAiModelPricingRule {
  return Object.freeze({
    model, inputPerMillionUsd, cachedInputPerMillionUsd, cacheWritePerMillionUsd, outputPerMillionUsd,
    longContext: longContext ? Object.freeze({
      thresholdInputTokens: longContext[0], inputPerMillionUsd: longContext[1],
      cachedInputPerMillionUsd: longContext[2], cacheWritePerMillionUsd: longContext[3],
      outputPerMillionUsd: longContext[4],
    }) : undefined,
  });
}

function perMillionCost(tokens: number, price: string): DecimalValue | null {
  const decimal = decimalFromNonNegativeString(price);
  const multiplied = decimal && multiplyDecimalByNonNegativeInteger(decimal, tokens);
  return multiplied && divideDecimalByPowerOfTen(multiplied, 6);
}

function unavailable(reason: string): OpenAiCostFinancialTerminal {
  return Object.freeze({
    costStatus: "unavailable",
    costUnavailableReason: reason,
    costUsd: null,
    pricingVersion: null,
    pricingEffectiveAt: null,
    pricingSnapshot: null,
    webSearchToolVersion: null,
    webSearchPricePerCallUsd: null,
  });
}

function timestamp(value: unknown) {
  if (typeof value !== "string") return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}
