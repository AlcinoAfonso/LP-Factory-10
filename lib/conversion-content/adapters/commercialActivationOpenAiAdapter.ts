import type {
  OpenAiWorkloadEnvironment,
  OpenAiWorkloadEvent,
  ResolvedOpenAiProductWorkload,
} from "../../openai-workloads";
import {
  requestOpenAiResponses,
  type OpenAiResponsesParser,
} from "./openAiResponsesAdapter";

type CommercialActivationOpenAiInput<T> = Readonly<{
  apiKey?: string;
  configuration: ResolvedOpenAiProductWorkload;
  environment?: OpenAiWorkloadEnvironment;
  request: Readonly<Record<string, unknown>>;
  parseResponse: OpenAiResponsesParser<T>;
}>;

type CommercialActivationOpenAiDependencies = Readonly<{
  fetchImpl?: typeof fetch;
  emitEvent?: (event: OpenAiWorkloadEvent) => void;
  now?: () => number;
}>;

export type CommercialActivationOpenAiResult<T> =
  | Readonly<{
      ok: true;
      value: T;
      responseId: string | null;
    }>
  | Readonly<{ ok: false; reason: string }>;

export function extractCommercialActivationOpenAiOutputText(
  payload: unknown,
): string | null {
  const response = asRecord(payload);
  if (!response) return null;
  if (typeof response.output_text === "string") return response.output_text;

  const output = Array.isArray(response.output) ? response.output : [];
  for (const item of output) {
    const content = asRecord(item)?.content;
    if (!Array.isArray(content)) continue;

    for (const part of content) {
      const outputPart = asRecord(part);
      if (
        outputPart?.type === "output_text" &&
        typeof outputPart.text === "string"
      ) {
        return outputPart.text;
      }
    }
  }

  return null;
}

export async function requestCommercialActivationOpenAi<T>(
  input: CommercialActivationOpenAiInput<T>,
  dependencies: CommercialActivationOpenAiDependencies = {},
): Promise<CommercialActivationOpenAiResult<T>> {
  const result = await requestOpenAiResponses(
    {
      ...input,
      expectedWorkload: "commercial_activation_draft_generation",
    },
    dependencies,
  );

  return result.ok
    ? { ok: true, value: result.value, responseId: result.responseId }
    : {
        ok: false,
        reason: result.kind === "configuration_invalid"
          ? "missing_openai_env"
          : result.reason,
      };
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}
