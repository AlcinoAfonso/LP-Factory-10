import "server-only";

import { createHash, randomUUID } from "node:crypto";

import { requestOpenAiResponses } from "../../conversion-content/adapters/openAiResponsesAdapter";
import { clientOpenAiCostContext, type OpenAiCostEconomicContext, type OpenAiCostRecorder } from "../../openai-costs";
import {
  resolveOpenAiProductWorkload,
  resolveOpenAiWorkloadEnvironment,
  type OpenAiWorkloadEvent,
  type ResolvedOpenAiProductWorkload,
} from "../../openai-workloads";
import {
  COMMUNICATION_AI_CONTRACT_VERSION,
  COMMUNICATION_AI_PROMPT_VERSION,
  parseStageOneResponse,
  parseStageTwoResponse,
  stageOnePrompt,
  stageTwoPrompt,
  type StageTwoDraft,
  type StageTwoTarget,
} from "../ai-core";
import type { CommunicationBase } from "../contracts";

type AiFailure = Readonly<{ ok: false; reason: "invalid_input" | "unavailable" }>;

export async function assistCommunicationSection(input: Readonly<{
  accountId: string;
  key: string;
  userText: string;
  apiKey?: string;
  configurationOverride?: ResolvedOpenAiProductWorkload;
  financialContext?: OpenAiCostEconomicContext;
  executionOrigin?: "runtime" | "administrative_proof";
}>) {
  const prompt = stageOnePrompt(input.key, input.userText);
  if (!prompt) return { ok: false, reason: "invalid_input" } as AiFailure;
  const configuration = input.configurationOverride ?? await resolveConfiguration("communication_base_stage1_assistance");
  if (!configuration) return { ok: false, reason: "unavailable" } as AiFailure;
  const result = await requestOpenAiResponses<Readonly<{ suggestion: string; missingQuestion: string }>>({
    apiKey: input.apiKey ?? process.env.OPENAI_API_KEY,
    configuration,
    expectedWorkload: "communication_base_stage1_assistance",
    requestId: randomUUID(),
    promptVersion: COMMUNICATION_AI_PROMPT_VERSION,
    contractVersion: COMMUNICATION_AI_CONTRACT_VERSION,
    financialContext: input.financialContext ?? clientOpenAiCostContext(input.accountId),
    executionOrigin: input.executionOrigin ?? "runtime",
    baselineReference: `e25_1_stage1_${input.key}`,
    request: responseRequest(prompt, 2_500, input.accountId),
    parseResponse: parseStageOneResponse,
  });
  return result.ok ? { ok: true as const, value: result.value, responseId: result.responseId, latencyMs: result.latencyMs }
    : { ok: false as const, reason: "unavailable" as const };
}

export async function generateCommunicationIntelligence(input: Readonly<{
  accountId: string;
  base: CommunicationBase;
  target: StageTwoTarget;
  requiresCurrentResearch: boolean;
  apiKey?: string;
  configurationOverride?: ResolvedOpenAiProductWorkload;
  financialContext?: OpenAiCostEconomicContext;
  executionOrigin?: "runtime" | "administrative_proof";
  emitEvent?: (event: OpenAiWorkloadEvent) => void;
  costRecorder?: OpenAiCostRecorder;
}>) {
  const prompt = stageTwoPrompt(input.base, input.target, input.requiresCurrentResearch);
  if (!prompt) return { ok: false, reason: "invalid_input" } as AiFailure;
  const configuration = input.configurationOverride ?? await resolveConfiguration("communication_base_stage2_intelligence");
  if (!configuration) return { ok: false, reason: "unavailable" } as AiFailure;
  if (input.requiresCurrentResearch && !configuration.webSearch) {
    return { ok: false, reason: "unavailable" } as AiFailure;
  }
  const result = await requestOpenAiResponses<StageTwoDraft>({
    apiKey: input.apiKey ?? process.env.OPENAI_API_KEY,
    configuration,
    expectedWorkload: "communication_base_stage2_intelligence",
    requestId: randomUUID(),
    promptVersion: COMMUNICATION_AI_PROMPT_VERSION,
    contractVersion: COMMUNICATION_AI_CONTRACT_VERSION,
    financialContext: input.financialContext ?? clientOpenAiCostContext(input.accountId),
    executionOrigin: input.executionOrigin ?? "runtime",
    baselineReference: input.target.kind === "general"
      ? "e25_1_stage2_general"
      : `e25_1_stage2_local_${input.target.key}`,
    request: {
      ...responseRequest(prompt, 16_000, input.accountId),
      ...(input.requiresCurrentResearch ? {
        tools: [{
          type: "web_search",
          external_web_access: configuration.webSearch?.externalWebAccess,
          search_context_size: configuration.webSearch?.searchContextSize,
        }],
        tool_choice: "required",
        max_tool_calls: configuration.webSearch?.maxToolCalls,
        include: ["web_search_call.action.sources"],
      } : {}),
    },
    parseResponse: (payload) => parseStageTwoResponse(payload, input.target, input.requiresCurrentResearch),
  }, { emitEvent: input.emitEvent, costRecorder: input.costRecorder });
  return result.ok ? { ok: true as const, value: result.value, usage: result.usage, latencyMs: result.latencyMs,
    responseId: result.responseId }
    : { ok: false as const, reason: "unavailable" as const };
}

async function resolveConfiguration(workload: string) {
  const environment = resolveOpenAiWorkloadEnvironment();
  const result = await resolveOpenAiProductWorkload(workload, environment);
  return result.ok ? result.value : null;
}

function responseRequest(prompt: Readonly<{
  instructions: string;
  input: string;
  schema: Record<string, unknown>;
}>, maxOutputTokens: number, accountId: string) {
  return {
    instructions: prompt.instructions,
    input: prompt.input,
    store: false,
    background: false,
    service_tier: "default",
    max_output_tokens: maxOutputTokens,
    safety_identifier: createHash("sha256").update(accountId).digest("hex"),
    text: {
      format: {
        type: "json_schema",
        name: "communication_base_v2",
        strict: true,
        schema: prompt.schema,
      },
    },
  };
}
