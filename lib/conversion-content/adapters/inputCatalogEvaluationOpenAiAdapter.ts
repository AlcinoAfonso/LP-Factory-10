import type {
  InputCatalogEvaluationProviderRequest,
  InputCatalogEvaluationProviderResult,
} from "../landing-page/taxon-preparation";
import { INPUT_CATALOG_EVALUATION_SCHEMA_VERSION } from "../landing-page/taxon-preparation";
import type {
  OpenAiWorkloadEnvironment,
  OpenAiWorkloadEvent,
  ResolvedOpenAiProductWorkload,
} from "../../openai-workloads";
import { requestOpenAiResponses } from "./openAiResponsesAdapter";
import {
  lpFactoryOpenAiCostContext,
  lpFactoryOpenAiEventCostContext,
  type OpenAiCostRecorder,
} from "../../openai-costs";

export type InputCatalogEvaluationOpenAiInput = Readonly<{
  apiKey?: string;
  configuration: ResolvedOpenAiProductWorkload;
  environment?: OpenAiWorkloadEnvironment;
  request: InputCatalogEvaluationProviderRequest;
  requestId: string;
  safetyIdentifier: string;
  executionOrigin?: "runtime" | "administrative_proof";
  economicEvent?: Readonly<{ eventId: string; taxonId: string }>;
}>;

export type InputCatalogEvaluationOpenAiDependencies = Readonly<{
  fetchImpl?: typeof fetch;
  emitEvent?: (event: OpenAiWorkloadEvent) => void;
  now?: () => number;
  timeoutMs?: number;
  signal?: AbortSignal;
  costRecorder?: OpenAiCostRecorder;
}>;

const MAX_TIMEOUT_MS = 45_000;
const CONTEXT_WINDOW_TOKENS = 128_000;
const MAX_OUTPUT_TOKENS = 6_000;
const WEB_SEARCH_RESERVE_TOKENS = 8_000;
const REASONING_RESERVE_TOKENS = 8_000;

export async function evaluateInputCatalogWithOpenAi(
  input: InputCatalogEvaluationOpenAiInput,
  dependencies: InputCatalogEvaluationOpenAiDependencies = {},
): Promise<InputCatalogEvaluationProviderResult> {
  const prepared = buildInputCatalogEvaluationOpenAiRequest(input, {
    ...dependencies,
    timeoutMs: input.request.timeoutMs ?? dependencies.timeoutMs,
  });
  if (!prepared.ok) return { status: "failure", message: prepared.message };
  const result = await requestOpenAiResponses(
    prepared.value,
    {
      fetchImpl: dependencies.fetchImpl,
      emitEvent: dependencies.emitEvent,
      now: dependencies.now,
      costRecorder: dependencies.costRecorder,
    },
  );

  if (result.ok) return {
    status: "completed",
    output: result.value.output,
    webSearchCallCount: result.value.webSearchCallCount,
    webSearchSources: result.value.webSearchSources,
  };
  if (result.kind === "refusal") {
    return { status: "refusal", message: result.reason };
  }
  if (result.reason === "openai_incomplete") {
    return { status: "incomplete", message: result.reason };
  }
  return { status: "failure", message: result.reason };
}

export function buildInputCatalogEvaluationOpenAiRequest(
  input: InputCatalogEvaluationOpenAiInput,
  dependencies: Pick<InputCatalogEvaluationOpenAiDependencies, "timeoutMs" | "signal" | "now"> = {},
) {
  const now = dependencies.now ?? Date.now;
  const startedAt = now();
  const safetyIdentifier = normalizeSafetyIdentifier(input.safetyIdentifier);
  if (!safetyIdentifier) return { ok: false as const, message: "openai_safety_identifier_invalid" };
  const sourceStrategy = input.request.sourceStrategy;
  if (!(["e20_5", "web_search_fallback", "web_search_focal"] as const).includes(sourceStrategy)) {
    return { ok: false as const, message: "input_catalog_evaluation_source_strategy_invalid" };
  }
  const webEnabled = sourceStrategy !== "e20_5";
  const maxToolCalls = sourceStrategy === "web_search_focal" ? 1 : 2;
  const estimatedTokens = utf8ByteLength(input.request.prompt.instructions) +
    utf8ByteLength(input.request.prompt.input) +
    utf8ByteLength(JSON.stringify(input.request.outputSchema)) +
    MAX_OUTPUT_TOKENS +
    REASONING_RESERVE_TOKENS +
    (webEnabled ? WEB_SEARCH_RESERVE_TOKENS : 0);
  if (estimatedTokens > CONTEXT_WINDOW_TOKENS) {
    return { ok: false as const, message: "input_catalog_evaluation_context_budget_exceeded" };
  }
  const elapsed = Math.max(0, now() - startedAt);
  const requestedTimeout = dependencies.timeoutMs === undefined
    ? MAX_TIMEOUT_MS
    : Math.max(0, Math.min(MAX_TIMEOUT_MS, dependencies.timeoutMs));
  const absoluteRemaining = input.request.deadlineAtMs === undefined
    ? MAX_TIMEOUT_MS
    : Math.max(0, input.request.deadlineAtMs - now());
  return {
    ok: true as const,
    value: {
      apiKey: input.apiKey,
      configuration: input.configuration,
      environment: input.environment,
      expectedWorkload: "taxon_input_catalog_sufficiency_evaluation" as const,
      requestId: input.requestId,
      promptVersion: input.request.prompt.version,
      contractVersion: INPUT_CATALOG_EVALUATION_SCHEMA_VERSION,
      timeoutMs: Math.max(0, Math.min(requestedTimeout - elapsed, absoluteRemaining)),
      signal: dependencies.signal,
      financialContext: input.economicEvent
        ? lpFactoryOpenAiEventCostContext({
            kind: "lp_factory_internal",
            eventId: input.economicEvent.eventId,
            taxonId: input.economicEvent.taxonId,
          })
        : lpFactoryOpenAiCostContext,
      executionOrigin: input.executionOrigin ?? "runtime",
      sourceStrategy,
      request: {
        instructions: input.request.prompt.instructions,
        input: input.request.prompt.input,
        store: false,
        background: false,
        tools: webEnabled ? [{
          type: "web_search",
          external_web_access: true,
          search_context_size: "medium",
        }] : [],
        ...(webEnabled ? {
          tool_choice: "required",
          max_tool_calls: maxToolCalls,
          include: ["web_search_call.action.sources"],
        } : {}),
        max_output_tokens: MAX_OUTPUT_TOKENS,
        safety_identifier: safetyIdentifier,
        text: {
          format: {
            type: "json_schema",
            name: "taxon_input_catalog_sufficiency_evaluation_v2",
            strict: true,
            schema: input.request.outputSchema,
          },
        },
      },
      parseResponse: (payload: unknown) => parseEvaluationResponse(payload, sourceStrategy),
    },
  };
}

export function parseEvaluationResponse(
  payload: unknown,
  sourceStrategy: "e20_5" | "web_search_fallback" | "web_search_focal",
) {
  const response = asRecord(payload);
  if (!response) {
    return failure("invalid_response", "openai_response_invalid");
  }

  const outputItems = Array.isArray(response.output) ? response.output : [];
  const extracted = extractOutputText(response);
  if (extracted.kind === "refusal") {
    return failure("refusal", "openai_refusal");
  }
  const webCalls = outputItems.filter((item) => asRecord(item)?.type === "web_search_call");
  const sources = new Set<string>();
  for (const rawCall of webCalls) {
    const call = asRecord(rawCall);
    const action = asRecord(call?.action);
    if (call?.status !== "completed" || !Array.isArray(action?.sources)) {
      return providerFailure("web_search_evidence_invalid", webCalls.length, sources.size);
    }
    for (const rawSource of action.sources) {
      const url = canonicalHttpsUrl(asRecord(rawSource)?.url);
      if (url) sources.add(url);
    }
  }
  const maxCalls = sourceStrategy === "web_search_focal" ? 1 : 2;
  if (
    (sourceStrategy === "e20_5" && webCalls.length !== 0) ||
    (sourceStrategy !== "e20_5" && (webCalls.length < 1 || webCalls.length > maxCalls || sources.size === 0))
  ) {
    return providerFailure("web_search_evidence_invalid", webCalls.length, sources.size);
  }

  if (extracted.kind !== "text") {
    return failure(
      extracted.kind,
      "openai_output_missing",
    );
  }

  try {
    return {
      ok: true as const,
      value: {
        output: JSON.parse(extracted.value) as unknown,
        webSearchCallCount: webCalls.length,
        webSearchSources: Object.freeze([...sources]),
      },
      telemetry: {
        webSearchCallCount: webCalls.length,
        webSearchSourceCount: sources.size,
      },
    };
  } catch {
    return failure("invalid_response", "openai_output_json_invalid");
  }
}

function providerFailure(reason: string, calls: number, sources: number) {
  return {
    ok: false as const,
    kind: "invalid_response" as const,
    reason,
    telemetry: { webSearchCallCount: calls, webSearchSourceCount: sources },
  };
}

function canonicalHttpsUrl(value: unknown): string | null {
  if (typeof value !== "string" || value.length > 2_048) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.username || url.password) return null;
    url.hash = "";
    return url.toString();
  } catch {
    return null;
  }
}

function extractOutputText(response: Record<string, unknown>):
  | Readonly<{ kind: "text"; value: string }>
  | Readonly<{ kind: "refusal" | "invalid_response" }> {
  const outputItems = Array.isArray(response.output) ? response.output : [];
  for (const item of outputItems) {
    const itemRecord = asRecord(item);
    if (!Array.isArray(itemRecord?.content)) continue;
    for (const content of itemRecord.content) {
      const contentRecord = asRecord(content);
      if (contentRecord?.type === "refusal") return { kind: "refusal" };
    }
  }
  if (typeof response.output_text === "string" && response.output_text.trim()) {
    return { kind: "text", value: response.output_text };
  }

  for (const item of outputItems) {
    const itemRecord = asRecord(item);
    if (!Array.isArray(itemRecord?.content)) continue;
    for (const content of itemRecord.content) {
      const contentRecord = asRecord(content);
      if (
        contentRecord?.type === "output_text" &&
        typeof contentRecord.text === "string" &&
        contentRecord.text.trim()
      ) {
        return { kind: "text", value: contentRecord.text };
      }
    }
  }
  return { kind: "invalid_response" };
}

function utf8ByteLength(value: string): number {
  return new TextEncoder().encode(value).byteLength;
}

function normalizeSafetyIdentifier(value: string) {
  const normalized = value.trim();
  return normalized.length >= 1 &&
    normalized.length <= 64 &&
    /^[A-Za-z0-9_-]+$/.test(normalized)
    ? normalized
    : null;
}

function failure(
  kind: "invalid_response" | "refusal",
  reason: string,
) {
  return { ok: false as const, kind, reason };
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}
