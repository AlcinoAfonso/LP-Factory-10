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
