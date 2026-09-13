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
} from "../../openai-costs";

export const INPUT_CATALOG_EVALUATION_TIMEOUT_MS = 45_000;

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
  signal?: AbortSignal;
}>;

export async function evaluateInputCatalogWithOpenAi(
  input: InputCatalogEvaluationOpenAiInput,
  dependencies: InputCatalogEvaluationOpenAiDependencies = {},
): Promise<InputCatalogEvaluationProviderResult> {
  const safetyIdentifier = normalizeSafetyIdentifier(input.safetyIdentifier);
  if (!safetyIdentifier) {
    return { status: "failure", message: "openai_safety_identifier_invalid" };
  }
  const webSearchMaxCalls = input.request.webSearchMaxCalls ?? 0;
  const webSearch = webSearchMaxCalls > 0
    ? input.configuration.webSearch
    : null;
  if (webSearchMaxCalls > 0 && !webSearch) {
    return { status: "failure", message: "openai_web_search_policy_missing" };
  }

  const result = await requestOpenAiResponses(
    {
      apiKey: input.apiKey,
      configuration: input.configuration,
      environment: input.environment,
      expectedWorkload: "taxon_input_catalog_sufficiency_evaluation",
      requestId: input.requestId,
      promptVersion: input.request.prompt.version,
      contractVersion: INPUT_CATALOG_EVALUATION_SCHEMA_VERSION,
      timeoutMs: INPUT_CATALOG_EVALUATION_TIMEOUT_MS,
      signal: dependencies.signal,
      financialContext: input.economicEvent
        ? lpFactoryOpenAiEventCostContext({
            kind: "lp_factory_internal",
            eventId: input.economicEvent.eventId,
            taxonId: input.economicEvent.taxonId,
          })
        : lpFactoryOpenAiCostContext,
      executionOrigin: input.executionOrigin ?? "runtime",
      request: {
        instructions: input.request.prompt.instructions,
        input: input.request.prompt.input,
        store: false,
        tools: webSearch
          ? [{
              type: "web_search",
              external_web_access: webSearch.externalWebAccess,
              search_context_size: webSearch.searchContextSize,
            }]
          : [],
        ...(webSearch
          ? {
              tool_choice: "required",
              max_tool_calls: Math.min(webSearchMaxCalls, webSearch.maxToolCalls),
              include: ["web_search_call.action.sources"],
            }
          : {}),
        max_output_tokens: 6_000,
        safety_identifier: safetyIdentifier,
        text: {
          format: {
            type: "json_schema",
            name: "taxon_input_catalog_sufficiency_evaluation_v1",
            strict: true,
            schema: input.request.outputSchema,
          },
        },
      },
      parseResponse: (payload) => parseEvaluationResponse(payload, webSearchMaxCalls),
    },
    {
      fetchImpl: dependencies.fetchImpl,
      emitEvent: dependencies.emitEvent,
      now: dependencies.now,
    },
  );

  if (result.ok) {
    return {
      status: "completed",
      output: result.value.output,
      provenance: result.value.provenance,
    };
  }
  if (result.kind === "refusal") {
    return { status: "refusal", message: result.reason };
  }
  if (result.reason === "openai_incomplete") {
    return { status: "incomplete", message: result.reason };
  }
  return { status: "failure", message: result.reason };
}

export function parseEvaluationResponse(payload: unknown, webSearchMaxCalls: 0 | 1 | 2 = 0) {
  const response = asRecord(payload);
  if (!response) {
    return failure("invalid_response", "openai_response_invalid");
  }

  const outputItems = Array.isArray(response.output) ? response.output : [];
  const webCalls = outputItems.filter((item) => asRecord(item)?.type === "web_search_call");
  const sources = new Map<string, Readonly<{ title: string | null; url: string }>>();
  if (webSearchMaxCalls === 0 && webCalls.length > 0) {
    return failure("invalid_response", "openai_web_search_unexpected", webCalls.length, 0);
  }
  if (webSearchMaxCalls > 0) {
    if (webCalls.length < 1 || webCalls.length > webSearchMaxCalls) {
      return failure("invalid_response", "openai_web_search_call_count_invalid", webCalls.length, 0);
    }
    for (const item of webCalls) {
      const call = asRecord(item);
      const rawSources = Array.isArray(asRecord(call?.action)?.sources)
        ? asRecord(call?.action)?.sources as unknown[]
        : null;
      if (call?.status !== "completed" || !rawSources?.length) {
        return failure("invalid_response", "openai_web_search_evidence_invalid", webCalls.length, sources.size);
      }
      let usableInCall = 0;
      for (const rawSource of rawSources) {
        const source = normalizeWebSource(rawSource);
        if (!source) continue;
        usableInCall += 1;
        sources.set(source.url, source);
        if (sources.size > 50) {
          return failure("invalid_response", "openai_web_search_evidence_invalid", webCalls.length, sources.size);
        }
      }
      if (usableInCall === 0) {
        return failure("invalid_response", "openai_web_search_evidence_invalid", webCalls.length, sources.size);
      }
    }
  }

  const extracted = extractOutputText(response);
  if (extracted.kind !== "text") {
    return failure(
      extracted.kind,
      extracted.kind === "refusal" ? "openai_refusal" : "openai_output_missing",
      webCalls.length,
      sources.size,
    );
  }

  try {
    return {
      ok: true as const,
      value: {
        output: JSON.parse(extracted.value) as unknown,
        provenance: {
          webSearchCallCount: webCalls.length,
          webSources: [...sources.values()],
        },
      },
      telemetry: {
        webSearchCallCount: webCalls.length,
        webSearchSourceCount: sources.size,
      },
    };
  } catch {
    return failure("invalid_response", "openai_output_json_invalid", webCalls.length, sources.size);
  }
}

function normalizeWebSource(value: unknown) {
  const source = asRecord(value);
  if (typeof source?.url !== "string" || source.url.length > 2_048) return null;
  try {
    const url = new URL(source.url);
    if (url.protocol !== "https:" || url.username || url.password) return null;
    const title = source.title === undefined || source.title === null
      ? null
      : typeof source.title === "string" &&
          source.title.trim().length >= 1 &&
          source.title.trim().length <= 300
        ? source.title.trim()
        : null;
    if (source.title !== undefined && source.title !== null && title === null) return null;
    return Object.freeze({ title, url: url.toString() });
  } catch {
    return null;
  }
}

function extractOutputText(response: Record<string, unknown>):
  | Readonly<{ kind: "text"; value: string }>
  | Readonly<{ kind: "refusal" | "invalid_response" }> {
  if (typeof response.output_text === "string" && response.output_text.trim()) {
    return { kind: "text", value: response.output_text };
  }

  if (!Array.isArray(response.output)) return { kind: "invalid_response" };
  for (const item of response.output) {
    const itemRecord = asRecord(item);
    if (!Array.isArray(itemRecord?.content)) continue;
    for (const content of itemRecord.content) {
      const contentRecord = asRecord(content);
      if (contentRecord?.type === "refusal") return { kind: "refusal" };
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
  webSearchCallCount = 0,
  webSearchSourceCount = 0,
) {
  return {
    ok: false as const,
    kind,
    reason,
    telemetry: { webSearchCallCount, webSearchSourceCount },
  };
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}
