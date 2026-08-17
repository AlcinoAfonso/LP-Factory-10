import type {
  OpenAiImageWorkloadEvent,
  ResolvedOpenAiImageWorkload,
  OpenAiWorkloadEnvironment,
  OpenAiWorkloadEvent,
  OpenAiWorkloadEventContext,
  OpenAiWorkloadFailureCategory,
  OpenAiWorkloadUsage,
} from "./contracts";

type ImageEventInput = Readonly<{
  workload: ResolvedOpenAiImageWorkload;
  environment?: OpenAiWorkloadEnvironment;
  attemptId?: unknown;
  requestId?: unknown;
  providerRequestId?: unknown;
  latencyMs?: unknown;
  imageCount?: unknown;
  width?: unknown;
  height?: unknown;
  estimatedCost?: unknown;
  costStatus?: "dated" | "unavailable";
  visualBriefVersion?: unknown;
}>;

type EnvironmentInput = Readonly<{
  vercelEnv?: string;
  nodeEnv?: string;
}>;

type EventInput = OpenAiWorkloadEventContext &
  Readonly<{
    environment?: OpenAiWorkloadEnvironment;
    responseId?: unknown;
    attemptId?: unknown;
    requestId?: unknown;
    promptVersion?: unknown;
    contractVersion?: unknown;
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

export function createOpenAiImageWorkloadSuccessEvent(
  input: ImageEventInput,
): OpenAiImageWorkloadEvent {
  return createImageEvent(input, "success", null);
}

export function createOpenAiImageWorkloadFailureEvent(
  input: ImageEventInput,
  failureCategory: OpenAiWorkloadFailureCategory,
): OpenAiImageWorkloadEvent {
  return createImageEvent(input, "failure", failureCategory);
}

export function emitOpenAiImageWorkloadEvent(
  event: OpenAiImageWorkloadEvent,
  write: (name: "openai_image_workload", value: OpenAiImageWorkloadEvent) => void =
    (name, value) => console.info(name, value),
) {
  write("openai_image_workload", event);
}

function createEvent(
  input: EventInput,
  result: "success" | "failure",
  failureCategory: OpenAiWorkloadFailureCategory | null,
): OpenAiWorkloadEvent {
  const event = {
    workload: input.workload,
    apiKind: "responses_text" as const,
    environment: input.environment ?? resolveOpenAiWorkloadEnvironment(),
    configurationSource: input.configurationSource,
    configurationRevision: input.configurationRevision,
    model: input.model,
    reasoningEffort: input.reasoningEffort,
    attemptId: nonEmptyString(input.attemptId),
    requestId: nonEmptyString(input.requestId),
    promptVersion: nonEmptyString(input.promptVersion),
    contractVersion: positiveIntegerMetric(input.contractVersion),
    responseId: nonEmptyString(input.responseId),
    result,
    failureCategory,
    latencyMs: durationMetric(input.latencyMs),
    ...normalizeOpenAiResponseUsage(input.usage),
  };

  return deepFreeze(event) as OpenAiWorkloadEvent;
}

function createImageEvent(
  input: ImageEventInput,
  result: "success" | "failure",
  failureCategory: OpenAiWorkloadFailureCategory | null,
): OpenAiImageWorkloadEvent {
  const workload = input.workload;
  return deepFreeze({
    workload: workload.id,
    apiKind: workload.apiKind,
    environment: input.environment ?? resolveOpenAiWorkloadEnvironment(),
    configurationSource: workload.source,
    configurationRevision: workload.revision,
    model: workload.model,
    size: workload.size,
    quality: workload.quality,
    format: workload.format,
    compression: workload.compression,
    moderation: workload.moderation,
    visualBriefVersion: nonEmptyString(input.visualBriefVersion),
    attemptId: nonEmptyString(input.attemptId),
    requestId: nonEmptyString(input.requestId),
    providerRequestId: nonEmptyString(input.providerRequestId),
    latencyMs: durationMetric(input.latencyMs),
    imageCount: integerMetric(input.imageCount),
    width: integerMetric(input.width),
    height: integerMetric(input.height),
    estimatedCost:
      typeof input.estimatedCost === "number" &&
      Number.isFinite(input.estimatedCost) &&
      input.estimatedCost >= 0
        ? input.estimatedCost
        : null,
    costStatus: input.costStatus ?? "unavailable",
    result,
    failureCategory,
  });
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

function integerMetric(value: unknown): number | null {
  return typeof value === "number" && Number.isInteger(value) && value >= 0
    ? value
    : null;
}

function positiveIntegerMetric(value: unknown): number | null {
  return typeof value === "number" && Number.isInteger(value) && value > 0
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
