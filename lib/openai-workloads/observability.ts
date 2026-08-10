import type {
  OpenAiWorkloadEnvironment,
  OpenAiWorkloadEvent,
  OpenAiWorkloadEventContext,
  OpenAiWorkloadFailureCategory,
  OpenAiWorkloadUsage,
} from "./contracts";

type EnvironmentInput = Readonly<{
  vercelEnv?: string;
  nodeEnv?: string;
}>;

type EventInput = OpenAiWorkloadEventContext &
  Readonly<{
    environment?: OpenAiWorkloadEnvironment;
    responseId?: unknown;
    latencyMs?: unknown;
    usage?: unknown;
  }>;

export function resolveOpenAiWorkloadEnvironment(
  input: EnvironmentInput = {
    vercelEnv: process.env.VERCEL_ENV,
    nodeEnv: process.env.NODE_ENV,
  },
): OpenAiWorkloadEnvironment {
  if (
    input.vercelEnv === "production" ||
    input.vercelEnv === "preview" ||
    input.vercelEnv === "development"
  ) {
    return input.vercelEnv;
  }

  return input.nodeEnv === "development" ? "development" : "unknown";
}

export function normalizeOpenAiResponseUsage(usage: unknown): OpenAiWorkloadUsage {
  const root = asRecord(usage);
  const inputDetails = asRecord(root?.input_tokens_details);
  const outputDetails = asRecord(root?.output_tokens_details);

  return deepFreeze({
    inputTokens: tokenMetric(root?.input_tokens),
    cachedInputTokens: tokenMetric(inputDetails?.cached_tokens),
    cacheWriteTokens: tokenMetric(inputDetails?.cache_write_tokens),
    outputTokens: tokenMetric(root?.output_tokens),
    reasoningTokens: tokenMetric(outputDetails?.reasoning_tokens),
    totalTokens: tokenMetric(root?.total_tokens),
  });
}

export function createOpenAiWorkloadSuccessEvent(
  input: EventInput,
): OpenAiWorkloadEvent {
  return createEvent(input, "success", null);
}

export function createOpenAiWorkloadFailureEvent(
  input: EventInput,
  failureCategory: OpenAiWorkloadFailureCategory,
): OpenAiWorkloadEvent {
  return createEvent(input, "failure", failureCategory);
}

export function emitOpenAiWorkloadEvent(
  event: OpenAiWorkloadEvent,
  write: (name: "openai_workload", value: OpenAiWorkloadEvent) => void =
    (name, value) => console.info(name, value),
) {
  write("openai_workload", event);
}

function createEvent(
  input: EventInput,
  result: "success" | "failure",
  failureCategory: OpenAiWorkloadFailureCategory | null,
): OpenAiWorkloadEvent {
  const event = {
    workload: input.workload,
    environment: input.environment ?? resolveOpenAiWorkloadEnvironment(),
    configurationSource: input.configurationSource,
    configurationRevision: input.configurationRevision,
    model: input.model,
    reasoningEffort: input.reasoningEffort,
    responseId: nonEmptyString(input.responseId),
    result,
    failureCategory,
    latencyMs: durationMetric(input.latencyMs),
    ...normalizeOpenAiResponseUsage(input.usage),
  };

  return deepFreeze(event) as OpenAiWorkloadEvent;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function tokenMetric(value: unknown): number | null {
  return typeof value === "number" && Number.isInteger(value) && value >= 0
    ? value
    : null;
}

function durationMetric(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) && value >= 0
    ? value
    : null;
}

function nonEmptyString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : null;
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    for (const nested of Object.values(value)) deepFreeze(nested);
    Object.freeze(value);
  }
  return value;
}
