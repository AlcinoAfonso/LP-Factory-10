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

export const OPENAI_COST_PRICING_VERSION = "2026-09-27-standard-v2";
export const OPENAI_COST_PRICING_EFFECTIVE_AT = "2026-09-27T22:41:15.000Z";
export const OPENAI_WEB_SEARCH_TOOL_VERSION = "web-search-2026-09-11-v1";
const LEGACY_PRICING_VERSION = "2026-09-11-standard-v1";
const LEGACY_PRICING_EFFECTIVE_AT = "2026-09-11T00:00:00.000Z";

export type OpenAiModelPricingRule = Readonly<{
  model: "gpt-5.4-mini" | "gpt-5.6-terra" | "gpt-5.6-luna" | "gpt-6-luna" | "gpt-6-sol" | "gpt-4.1-mini";
  inputPerMillionUsd: string;
  cachedInputPerMillionUsd: string;
  cacheWritePerMillionUsd: string | null;
  outputPerMillionUsd: string;
  longContext?: Readonly<{
    thresholdInputTokens: number;
    inputPerMillionUsd: string;
    cachedInputPerMillionUsd: string;
    cacheWritePerMillionUsd: string;
    outputPerMillionUsd: string;
  }>;
}>;

export type OpenAiCostPricingCatalog = Readonly<{
  version: string;
  effectiveAt: string;
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

export const OPENAI_COST_PRICING_CATALOG: OpenAiCostPricingCatalog = Object.freeze({
  version: OPENAI_COST_PRICING_VERSION,
  effectiveAt: OPENAI_COST_PRICING_EFFECTIVE_AT,
  modelRules: RULES,
  webSearch: WEB_SEARCH_PRICING,
});

export function calculateOpenAiOperationCost(input: Readonly<{
  model: string;
  startedAt: string;
  usage?: OpenAiWorkloadUsage | null;
  webSearchCallCount?: number | null;
  webSearchRequested?: boolean;
}>, catalog: OpenAiCostPricingCatalog = selectPricingCatalog(input.startedAt)): OpenAiCostFinancialTerminal {
  const startedAt = timestamp(input.startedAt);
  if (!startedAt || startedAt < catalog.effectiveAt) {
    return unavailable("pricing_not_effective");
  }
  const pricing = catalog.modelRules.find((candidate) => candidate.model === input.model);
  if (!pricing) return unavailable("pricing_not_found");
  const usage = input.usage;
  if (!usage || usage.inputTokens === null || usage.outputTokens === null) {
    return unavailable("usage_missing");
  }
  const cached = usage.cachedInputTokens ?? 0;
  const cacheWrite = usage.cacheWriteTokens ?? 0;
  const ordinaryInput = usage.inputTokens - cached - cacheWrite;
  if (ordinaryInput < 0) return unavailable("usage_overlap");
  if (usage.totalTokens !== null && usage.totalTokens !== usage.inputTokens + usage.outputTokens) {
    return unavailable("usage_total_mismatch");
  }
  if (cacheWrite > 0 && pricing.cacheWritePerMillionUsd === null) {
    return unavailable("cache_write_pricing_missing");
  }
  if (input.webSearchRequested && input.webSearchCallCount == null) {
    return unavailable("web_search_usage_missing");
  }
  const webSearchCalls = input.webSearchCallCount ?? 0;
  if (!Number.isSafeInteger(webSearchCalls) || webSearchCalls < 0) {
    return unavailable("web_search_usage_invalid");
  }

  const longContext = pricing.longContext && usage.inputTokens > pricing.longContext.thresholdInputTokens
    ? pricing.longContext
    : null;
  const selected = longContext ?? pricing;
  let total = decimalZero();
  for (const [tokens, price] of [
    [ordinaryInput, selected.inputPerMillionUsd],
    [cached, selected.cachedInputPerMillionUsd],
    [cacheWrite, selected.cacheWritePerMillionUsd],
    [usage.outputTokens, selected.outputPerMillionUsd],
  ] as const) {
    if (tokens === 0) continue;
    if (price === null) return unavailable("pricing_component_missing");
    const component = perMillionCost(tokens, price);
    if (!component) return unavailable("pricing_invalid");
    total = addDecimal(total, component);
  }
  const webSearchRule = catalog.webSearch;
  if (webSearchCalls > 0) {
    if (!webSearchRule) return unavailable("web_search_pricing_missing");
    const price = decimalFromNonNegativeString(webSearchRule.pricePerCallUsd);
    const component = price && multiplyDecimalByNonNegativeInteger(price, webSearchCalls);
    if (!component) return unavailable("web_search_pricing_missing");
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
      processing: "standard",
      contextBand: longContext ? "long" : "short",
      longContextThresholdInputTokens: pricing.longContext?.thresholdInputTokens ?? null,
      tokenUnit: "per_million",
      model: pricing.model,
      inputPerMillionUsd: selected.inputPerMillionUsd,
      cachedInputPerMillionUsd: selected.cachedInputPerMillionUsd,
      cacheWritePerMillionUsd: selected.cacheWritePerMillionUsd,
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

function selectPricingCatalog(startedAt: string): OpenAiCostPricingCatalog {
  const normalized = timestamp(startedAt);
  return normalized && normalized >= OPENAI_COST_PRICING_EFFECTIVE_AT
    ? OPENAI_COST_PRICING_CATALOG
    : LEGACY_PRICING_CATALOG;
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
