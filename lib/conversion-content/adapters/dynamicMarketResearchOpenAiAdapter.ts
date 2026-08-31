import type {
  OpenAiWorkloadEnvironment,
  OpenAiWorkloadEvent,
  ResolvedOpenAiProductWorkload,
} from "../../openai-workloads";
import {
  LANDING_PAGE_DYNAMIC_RESEARCH_CONTRACT_VERSION,
  LANDING_PAGE_DYNAMIC_RESEARCH_MAX_OUTPUT_TOKENS,
  LANDING_PAGE_DYNAMIC_RESEARCH_PROMPT_VERSION,
  buildLandingPageDynamicResearchPrompt,
  landingPageDynamicResearchDimensions,
  landingPageDynamicResearchOutputSchema,
  type LandingPageDynamicResearchExecution,
  type LandingPageDynamicResearchModelOutput,
  type LandingPageDynamicResearchSource,
  type LandingPageKnowledgeResolutionValue,
} from "../landing-page/knowledge-resolution";
import { requestOpenAiResponses } from "./openAiResponsesAdapter";

export type DynamicMarketResearchOpenAiInput = Readonly<{
  apiKey?: string;
  configuration: ResolvedOpenAiProductWorkload;
  environment: OpenAiWorkloadEnvironment;
  resolution: LandingPageKnowledgeResolutionValue;
  requestId: string;
  safetyIdentifier: string;
}>;

export type DynamicMarketResearchOpenAiDependencies = Readonly<{
  fetchImpl?: typeof fetch;
  emitEvent?: (event: OpenAiWorkloadEvent) => void;
  now?: () => number;
  nowIso?: () => string;
  timeoutMs?: number;
  signal?: AbortSignal;
}>;

export type DynamicMarketResearchOpenAiResult =
  | Readonly<{ ok: true; value: LandingPageDynamicResearchExecution }>
  | Readonly<{
      ok: false;
      offeringInvalidated: false;
      code:
        | "CONFIGURATION_UNPROVEN"
        | "INPUT_INVALID"
        | "CONTEXT_BUDGET_EXCEEDED"
        | "PROVIDER_FAILURE";
      message: string;
    }>;

type ParsedProviderOutput = Readonly<{
  output: LandingPageDynamicResearchModelOutput;
  sources: readonly LandingPageDynamicResearchSource[];
  webSearchCallCount: 1 | 2;
}>;

const MAX_TIMEOUT_MS = 45_000;

export async function researchDynamicLandingPageMarketWithOpenAi(
  input: DynamicMarketResearchOpenAiInput,
  dependencies: DynamicMarketResearchOpenAiDependencies = {},
): Promise<DynamicMarketResearchOpenAiResult> {
  if (!isRuntimeConfigurationProven(input.environment, input.configuration)) {
    return failure(
      "CONFIGURATION_UNPROVEN",
      "Preview e Production exigem revisão operacional comprovada posterior ao bootstrap.",
    );
  }
  const prepared = buildDynamicLandingPageMarketRequest(input, dependencies);
  if (!prepared.ok) return prepared;
  const result = await requestOpenAiResponses(prepared.value, {
    fetchImpl: dependencies.fetchImpl,
    emitEvent: dependencies.emitEvent,
    now: dependencies.now,
  });
  if (!result.ok) return failure("PROVIDER_FAILURE", result.reason);
  const parsed = result.value;
  return Object.freeze({
    ok: true,
    value: deepFreeze({
      status: parsed.output.status,
      summary: parsed.output.summary,
      supplement: parsed.output.supplement,
      sources: parsed.sources,
      searchedAt: validIso(dependencies.nowIso?.()) ?? new Date().toISOString(),
      workload: "landing_page_dynamic_market_research",
      configurationSource: input.configuration.source,
      configurationRevision: input.configuration.revision,
      model: input.configuration.model,
      reasoningEffort: input.configuration.reasoningEffort,
      promptVersion: LANDING_PAGE_DYNAMIC_RESEARCH_PROMPT_VERSION,
      contractVersion: LANDING_PAGE_DYNAMIC_RESEARCH_CONTRACT_VERSION,
      responseId: result.responseId,
      providerRequestId: result.providerRequestId,
      latencyMs: result.latencyMs,
      usage: result.usage,
      webSearchCallCount: parsed.webSearchCallCount,
    }) as LandingPageDynamicResearchExecution,
  });
}

/** Shared request contract for runtime and the separately authorized Admin canary.
 * Builds no proof, makes no call, and never changes a configuration revision. */
export function buildDynamicLandingPageMarketRequest(
  input: DynamicMarketResearchOpenAiInput,
  dependencies: Pick<DynamicMarketResearchOpenAiDependencies, "timeoutMs" | "signal"> = {},
) {
  const safetyIdentifier = normalizeSafetyIdentifier(input.safetyIdentifier);
  if (!safetyIdentifier) {
    return failure("INPUT_INVALID", "O safety identifier técnico é inválido.");
  }
  const prompt = buildLandingPageDynamicResearchPrompt(
    input.resolution,
    input.configuration,
  );
  if (!prompt.ok) {
    return failure(
      prompt.error.code === "CONTEXT_BUDGET_EXCEEDED"
        ? "CONTEXT_BUDGET_EXCEEDED"
        : "INPUT_INVALID",
      prompt.error.message,
    );
  }
  const webSearch = input.configuration.webSearch;
  if (!webSearch) {
    return failure("INPUT_INVALID", "A política Web Search do workload está ausente.");
  }

  return {
    ok: true as const,
    value: {
      apiKey: input.apiKey,
      configuration: input.configuration,
      environment: input.environment,
      expectedWorkload: "landing_page_dynamic_market_research" as const,
      requestId: input.requestId,
      promptVersion: prompt.value.version,
      contractVersion: LANDING_PAGE_DYNAMIC_RESEARCH_CONTRACT_VERSION,
      timeoutMs: boundedTimeout(dependencies.timeoutMs),
      signal: dependencies.signal,
      request: {
        instructions: prompt.value.instructions,
        input: prompt.value.input,
        store: false,
        tools: [{
          type: "web_search",
          external_web_access: webSearch.externalWebAccess,
          search_context_size: webSearch.searchContextSize,
        }],
        tool_choice: "required",
        max_tool_calls: webSearch.maxToolCalls,
        include: ["web_search_call.action.sources"],
        max_output_tokens: LANDING_PAGE_DYNAMIC_RESEARCH_MAX_OUTPUT_TOKENS,
        safety_identifier: safetyIdentifier,
        text: {
          format: {
            type: "json_schema",
            name: "landing_page_dynamic_market_research_v1",
            strict: true,
            schema: landingPageDynamicResearchOutputSchema,
          },
        },
      },
      parseResponse: parseDynamicMarketResearchResponse,
    },
  };
}

export function parseDynamicMarketResearchResponse(payload: unknown) {
  const response = asRecord(payload);
  const outputItems = Array.isArray(response?.output) ? response.output : null;
  if (!response || !outputItems) return parserFailure("openai_output_missing", 0, 0);

  const webCalls = outputItems.filter(
    (item) => asRecord(item)?.type === "web_search_call",
  );
  const sources = new Map<string, LandingPageDynamicResearchSource>();
  let callsComplete = webCalls.length >= 1 && webCalls.length <= 2;
  for (const item of webCalls) {
    const call = asRecord(item);
    const action = asRecord(call?.action);
    const rawSources = Array.isArray(action?.sources) ? action.sources : null;
    if (call?.status !== "completed" || !rawSources || rawSources.length === 0) {
      callsComplete = false;
      continue;
    }
    let usableInCall = 0;
    for (const rawSource of rawSources) {
      const source = providerSource(rawSource);
      if (!source) continue;
      usableInCall += 1;
      sources.set(source.url, source);
    }
    if (usableInCall === 0) callsComplete = false;
  }
  if (!callsComplete || sources.size === 0) {
    return parserFailure("web_search_evidence_invalid", webCalls.length, sources.size);
  }

  const extracted = extractOutputText(outputItems, response.output_text);
  if (extracted.kind !== "text") {
    return {
      ok: false as const,
      kind: extracted.kind,
      reason: extracted.kind === "refusal" ? "openai_refusal" : "openai_output_missing",
      telemetry: telemetry(webCalls.length, sources.size),
    };
  }
  let rawModelOutput: unknown;
  try {
    rawModelOutput = JSON.parse(extracted.value);
  } catch {
    return parserFailure("openai_output_json_invalid", webCalls.length, sources.size);
  }
  const modelOutput = parseModelOutput(rawModelOutput, sources);
  if (!modelOutput) {
    return parserFailure("dynamic_research_contract_invalid", webCalls.length, sources.size);
  }
  if (modelOutput.status === "insufficient_evidence") {
    return {
      ok: false as const,
      kind: "provider_error" as const,
      reason: "dynamic_research_insufficient_evidence",
      telemetry: telemetry(webCalls.length, sources.size),
    };
  }

  const usedUrls = modelOutput.status === "material_delta"
    ? new Set(modelOutput.supplement?.findings.flatMap((finding) => finding.sourceUrls))
    : new Set(sources.keys());
  const selectedSources = [...usedUrls]
    .map((url) => sources.get(url))
    .filter((source): source is LandingPageDynamicResearchSource => Boolean(source));
  return {
    ok: true as const,
    value: Object.freeze({
      output: modelOutput,
      sources: Object.freeze(selectedSources),
      webSearchCallCount: webCalls.length as 1 | 2,
    }) satisfies ParsedProviderOutput,
    telemetry: telemetry(webCalls.length, selectedSources.length),
  };
}

function parseModelOutput(
  value: unknown,
  providerSources: ReadonlyMap<string, LandingPageDynamicResearchSource>,
): LandingPageDynamicResearchModelOutput | null {
  const root = exactRecord(value, ["schemaVersion", "status", "summary", "supplement"]);
  const status = root?.status;
  const summary = boundedString(root?.summary, 1, 1200);
  if (
    root?.schemaVersion !== LANDING_PAGE_DYNAMIC_RESEARCH_CONTRACT_VERSION ||
    !summary ||
    (status !== "material_delta" &&
      status !== "no_material_delta" &&
      status !== "insufficient_evidence")
  ) return null;
  if (status !== "material_delta") {
    return root.supplement === null
      ? deepFreeze({ schemaVersion: 1, status, summary, supplement: null })
      : null;
  }
  const supplement = exactRecord(root.supplement, ["findings"]);
  if (!supplement || !Array.isArray(supplement.findings)) return null;
  if (supplement.findings.length < 1 || supplement.findings.length > 12) return null;
  const findings = [];
  for (const rawFinding of supplement.findings) {
    const finding = exactRecord(rawFinding, ["dimension", "insight", "sourceUrls"]);
    const insight = boundedString(finding?.insight, 1, 1600);
    if (
      !finding ||
      !landingPageDynamicResearchDimensions.includes(
        finding.dimension as (typeof landingPageDynamicResearchDimensions)[number],
      ) ||
      !insight ||
      !Array.isArray(finding.sourceUrls) ||
      finding.sourceUrls.length < 1 ||
      finding.sourceUrls.length > 8
    ) return null;
    const urls = finding.sourceUrls.map(canonicalHttpsUrl);
    if (urls.some((url) => !url || !providerSources.has(url))) return null;
    findings.push({
      dimension: finding.dimension as (typeof landingPageDynamicResearchDimensions)[number],
      insight,
      sourceUrls: [...new Set(urls as string[])],
    });
  }
  return deepFreeze({
    schemaVersion: LANDING_PAGE_DYNAMIC_RESEARCH_CONTRACT_VERSION,
    status,
    summary,
    supplement: { findings },
  });
}

function providerSource(value: unknown): LandingPageDynamicResearchSource | null {
  const record = asRecord(value);
  const url = canonicalHttpsUrl(record?.url);
  if (!url) return null;
  const title = record?.title === undefined || record.title === null
    ? null
    : boundedString(record.title, 1, 300);
  return title === null && record?.title !== undefined && record.title !== null
    ? null
    : Object.freeze({ url, title });
}

function extractOutputText(output: readonly unknown[], shortcut: unknown):
  | Readonly<{ kind: "text"; value: string }>
  | Readonly<{ kind: "refusal" | "invalid_response" }> {
  if (typeof shortcut === "string" && shortcut.trim()) {
    return { kind: "text", value: shortcut };
  }
  for (const item of output) {
    const content = asRecord(item)?.content;
    if (!Array.isArray(content)) continue;
    for (const part of content) {
      const record = asRecord(part);
      if (record?.type === "refusal") return { kind: "refusal" };
      if (record?.type === "output_text" && typeof record.text === "string" && record.text.trim()) {
        return { kind: "text", value: record.text };
      }
    }
  }
  return { kind: "invalid_response" };
}

function isRuntimeConfigurationProven(
  environment: OpenAiWorkloadEnvironment,
  configuration: ResolvedOpenAiProductWorkload,
) {
  if (environment === "unknown") return false;
  if (environment === "development") return true;
  return configuration.source === "supabase_operational" &&
    /^[2-9]\d*$|^[1-9]\d+$/.test(configuration.revision);
}

function parserFailure(reason: string, calls: number, sources: number) {
  return {
    ok: false as const,
    kind: "invalid_response" as const,
    reason,
    telemetry: telemetry(calls, sources),
  };
}

function telemetry(calls: number, sources: number) {
  return { webSearchCallCount: calls, webSearchSourceCount: sources };
}

function boundedTimeout(value: number | undefined) {
  return value === undefined || !Number.isSafeInteger(value) || value < 0
    ? MAX_TIMEOUT_MS
    : Math.min(value, MAX_TIMEOUT_MS);
}

function normalizeSafetyIdentifier(value: string) {
  const normalized = value.trim();
  return normalized.length >= 1 && normalized.length <= 64 &&
    /^[A-Za-z0-9_-]+$/.test(normalized)
    ? normalized
    : null;
}

function canonicalHttpsUrl(value: unknown): string | null {
  if (typeof value !== "string" || value.length > 2048) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.username || url.password) return null;
    url.hash = "";
    return url.href;
  } catch {
    return null;
  }
}

function exactRecord(value: unknown, keys: readonly string[]) {
  const record = asRecord(value);
  if (!record) return null;
  const actual = Object.keys(record);
  return actual.length === keys.length && keys.every((key) => Object.hasOwn(record, key))
    ? record
    : null;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function boundedString(value: unknown, min: number, max: number) {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  return normalized.length >= min && normalized.length <= max ? normalized : null;
}

function validIso(value: unknown) {
  if (typeof value !== "string") return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function failure(
  code: Extract<DynamicMarketResearchOpenAiResult, { ok: false }>["code"],
  message: string,
): Extract<DynamicMarketResearchOpenAiResult, { ok: false }> {
  return Object.freeze({ ok: false, offeringInvalidated: false, code, message });
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    for (const nested of Object.values(value)) deepFreeze(nested);
    Object.freeze(value);
  }
  return value;
}
