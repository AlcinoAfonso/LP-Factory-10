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

export type InputCatalogEvaluationOpenAiInput = Readonly<{
  apiKey?: string;
  configuration: ResolvedOpenAiProductWorkload;
  environment?: OpenAiWorkloadEnvironment;
  request: InputCatalogEvaluationProviderRequest;
  requestId: string;
  safetyIdentifier: string;
}>;

export type InputCatalogEvaluationOpenAiDependencies = Readonly<{
  fetchImpl?: typeof fetch;
  emitEvent?: (event: OpenAiWorkloadEvent) => void;
  now?: () => number;
  timeoutMs?: number;
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

  const result = await requestOpenAiResponses(
    {
      apiKey: input.apiKey,
      configuration: input.configuration,
      environment: input.environment,
      expectedWorkload: "taxon_input_catalog_sufficiency_evaluation",
      requestId: input.requestId,
      promptVersion: input.request.prompt.version,
      contractVersion: INPUT_CATALOG_EVALUATION_SCHEMA_VERSION,
      timeoutMs: dependencies.timeoutMs,
      signal: dependencies.signal,
      request: {
        instructions: input.request.prompt.instructions,
        input: input.request.prompt.input,
        store: false,
        tools: [],
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
      parseResponse: parseEvaluationResponse,
    },
    {
      fetchImpl: dependencies.fetchImpl,
      emitEvent: dependencies.emitEvent,
      now: dependencies.now,
    },
  );

  if (result.ok) return { status: "completed", output: result.value };
  if (result.kind === "refusal") {
    return { status: "refusal", message: result.reason };
  }
  if (result.reason === "openai_incomplete") {
    return { status: "incomplete", message: result.reason };
  }
  return { status: "failure", message: result.reason };
}

function parseEvaluationResponse(payload: unknown) {
  const response = asRecord(payload);
  if (!response) {
    return failure("invalid_response", "openai_response_invalid");
  }

  const extracted = extractOutputText(response);
  if (extracted.kind !== "text") {
    return failure(
      extracted.kind,
      extracted.kind === "refusal" ? "openai_refusal" : "openai_output_missing",
    );
  }

  try {
    return { ok: true as const, value: JSON.parse(extracted.value) as unknown };
  } catch {
    return failure("invalid_response", "openai_output_json_invalid");
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
) {
  return { ok: false as const, kind, reason };
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}
