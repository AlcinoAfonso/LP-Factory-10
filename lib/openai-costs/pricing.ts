import type { OpenAiLpCostStartInput } from "./tracking-contracts";

export const OPENAI_LP_COST_PRICE_VERSION =
  "2026-08-28.openai-published-v1" as const;

const USD_SCALE = 1_000_000_000_000n;
const TEXT_LONG_CONTEXT_THRESHOLD = 272_000;

type PricedUsage = Readonly<{
  usage: Readonly<Record<string, number>>;
  pricing: Readonly<Record<string, string>>;
  costUsd: string;
}>;

export function priceOpenAiLpUsage(
  start: OpenAiLpCostStartInput,
  input: Readonly<{
    usage?: unknown;
    serviceTier?: unknown;
    imageCount?: number;
  }>,
): PricedUsage | null {
  return start.workload === "landing_page_draft_generation"
    ? priceTextUsage(start.model, input.usage, input.serviceTier)
    : priceImageUsage(
        start.model,
        start.size,
        start.quality,
        input.usage,
        input.imageCount,
      );
}

export function isOpenAiLpPricingSupported(start: OpenAiLpCostStartInput) {
  return start.workload === "landing_page_draft_generation"
    ? start.model === "gpt-5.6-luna"
    : start.model === "gpt-image-2" &&
        start.size === "1536x1024" &&
        start.quality === "medium";
}

function priceTextUsage(
  model: string,
  usage: unknown,
  serviceTier: unknown,
): PricedUsage | null {
  if (model !== "gpt-5.6-luna" || serviceTier !== "default") return null;
  const root = asRecord(usage);
  const details = asRecord(root?.input_tokens_details);
  const inputTokens = tokenCount(root?.input_tokens);
  const outputTokens = tokenCount(root?.output_tokens);
  if (inputTokens === null || outputTokens === null) return null;
  const cachedInputTokens = optionalTokenCount(details?.cached_tokens);
  const cacheWriteTokens = optionalTokenCount(details?.cache_write_tokens);
  if (
    cachedInputTokens === null ||
    cacheWriteTokens === null ||
    cachedInputTokens + cacheWriteTokens > inputTokens
  ) {
    return null;
  }
  const ordinaryInputTokens =
    inputTokens - cachedInputTokens - cacheWriteTokens;
  const longContext = inputTokens > TEXT_LONG_CONTEXT_THRESHOLD;
  const rates = longContext
    ? {
        input: 400_000n,
        cached: 40_000n,
        cacheWrite: 500_000n,
        output: 1_800_000n,
        inputLabel: "0.40",
        cachedLabel: "0.04",
        cacheWriteLabel: "0.50",
        outputLabel: "1.80",
      }
    : {
        input: 200_000n,
        cached: 20_000n,
        cacheWrite: 250_000n,
        output: 1_200_000n,
        inputLabel: "0.20",
        cachedLabel: "0.02",
        cacheWriteLabel: "0.25",
        outputLabel: "1.20",
      };
  const picoUsd =
    BigInt(ordinaryInputTokens) * rates.input +
    BigInt(cachedInputTokens) * rates.cached +
    BigInt(cacheWriteTokens) * rates.cacheWrite +
    BigInt(outputTokens) * rates.output;
  return {
    usage: {
      inputTokens,
      ordinaryInputTokens,
      cachedInputTokens,
      cacheWriteTokens,
      outputTokens,
    },
    pricing: {
      serviceTier: "default",
      contextBand: longContext ? "long" : "short",
      inputUsdPerMillion: rates.inputLabel,
      cachedInputUsdPerMillion: rates.cachedLabel,
      cacheWriteUsdPerMillion: rates.cacheWriteLabel,
      outputUsdPerMillion: rates.outputLabel,
    },
    costUsd: formatUsd(picoUsd),
  };
}

function priceImageUsage(
  model: string,
  size: string,
  quality: string,
  usage: unknown,
  imageCount: number | undefined,
): PricedUsage | null {
  if (
    model !== "gpt-image-2" ||
    size !== "1536x1024" ||
    quality !== "medium" ||
    imageCount !== 1
  ) {
    return null;
  }
  const root = asRecord(usage);
  const inputDetails = asRecord(root?.input_tokens_details);
  const textInputTokens = tokenCount(inputDetails?.text_tokens);
  if (textInputTokens === null) return null;
  const imageInputTokens = optionalTokenCount(inputDetails?.image_tokens);
  if (imageInputTokens === null || imageInputTokens > 0) return null;
  const outputDetails = asRecord(root?.output_tokens_details);
  const imageOutputTokens = tokenCount(outputDetails?.image_tokens);
  if (imageOutputTokens === null) return null;
  const picoUsd =
    BigInt(textInputTokens) * 5_000_000n +
    BigInt(imageOutputTokens) * 30_000_000n;
  return {
    usage: {
      textInputTokens,
      imageInputTokens,
      imageOutputTokens,
      imageCount,
    },
    pricing: {
      serviceTier: "default",
      textInputUsdPerMillion: "5.00",
      imageOutputUsdPerMillion: "30.00",
      size,
      quality,
    },
    costUsd: formatUsd(picoUsd),
  };
}

function tokenCount(value: unknown) {
  return typeof value === "number" &&
    Number.isSafeInteger(value) &&
    value >= 0
    ? value
    : null;
}

function optionalTokenCount(value: unknown) {
  return value === undefined ? 0 : tokenCount(value);
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function formatUsd(picoUsd: bigint) {
  const whole = picoUsd / USD_SCALE;
  const fraction = (picoUsd % USD_SCALE).toString().padStart(12, "0");
  return `${whole}.${fraction}`;
}
