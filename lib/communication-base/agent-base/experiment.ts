// D14F: pesquisa e geração das seções 3.2/3.3 executadas em QA isolado.
// Preserva o transporte, a identidade E21 e a configuração ativa dos demais agentes.
import { createHash, randomUUID } from "node:crypto";

import {
  requestOpenAiResponses,
  type OpenAiResponsesParser,
} from "../../openai-responses/openAiResponsesAdapter";
import { clientOpenAiCostContext } from "../../openai-costs";
import { resolveOpenAiProductWorkload } from "../../openai-workloads";
import {
  AGENT_BASE_RESEARCH_PROMPT_VERSION,
  agentBaseQaConfiguration,
  buildAgentBaseResearchPrompt,
  parseAgentBaseResearchResponse,
  type AgentBaseResearchContext,
} from "./research";
import {
  AGENT_BASE_TWO_SECTIONS_PROMPT_VERSION,
  buildAgentBaseTwoSectionsPrompt,
  parseAgentBaseTwoSectionsResponse,
} from "./sections";

export type AgentBaseExperimentInput = Readonly<{
  accountId: string;
  context: AgentBaseResearchContext;
  apiKey: string | undefined;
  environment?: "development" | "preview";
}>;

export async function runAgentBaseMarketResearchExperiment(input: AgentBaseExperimentInput) {
  return runExperiment(
    input,
    buildAgentBaseResearchPrompt(input.context),
    parseAgentBaseResearchResponse,
    AGENT_BASE_RESEARCH_PROMPT_VERSION,
  );
}

export async function runAgentBaseTwoSectionsExperiment(input: AgentBaseExperimentInput) {
  return runExperiment(
    input,
    buildAgentBaseTwoSectionsPrompt(input.context),
    parseAgentBaseTwoSectionsResponse,
    AGENT_BASE_TWO_SECTIONS_PROMPT_VERSION,
  );
}

type ExperimentalPrompt = Readonly<{
  instructions: string;
  input: string;
  schema?: Readonly<Record<string, unknown>>;
}>;

async function runExperiment<T>(
  input: AgentBaseExperimentInput,
  prompt: ExperimentalPrompt | null,
  parseResponse: OpenAiResponsesParser<T>,
  promptVersion: string,
) {
  if (!/^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(input.accountId) || !input.apiKey?.trim()) {
    return { ok: false as const, reason: "experiment_input_or_api_key_missing" };
  }
  if (!prompt) return { ok: false as const, reason: "research_context_invalid" };

  // O E21 fornece somente transporte/política Web; o par QA Sol 6.1/medium
  // é aplicado localmente sem alterar a revisão Preview ou Production.
  const environment = input.environment ?? "development";
  const resolved = await resolveOpenAiProductWorkload("communication_base_stage2_intelligence", environment);
  if (!resolved.ok || !resolved.value.webSearch) {
    return { ok: false as const, reason: "research_workload_unavailable" };
  }
  const configuration = agentBaseQaConfiguration(resolved.value);
  const webSearch = configuration.webSearch;
  if (!webSearch) return { ok: false as const, reason: "research_workload_unavailable" };

  const result = await requestOpenAiResponses<T>({
    apiKey: input.apiKey,
    configuration,
    environment,
    expectedWorkload: "communication_base_stage2_intelligence",
    financialContext: clientOpenAiCostContext(input.accountId),
    executionOrigin: "administrative_proof",
    requestId: randomUUID(),
    promptVersion,
    contractVersion: 1,
    baselineReference: "d14f_agent_base_market_research_experiment",
    request: {
      instructions: prompt.instructions,
      input: prompt.input,
      store: false,
      background: false,
      service_tier: "default",
      max_output_tokens: 12_000,
      safety_identifier: createHash("sha256").update(input.accountId).digest("hex"),
      tools: [{
        type: "web_search",
        external_web_access: webSearch.externalWebAccess,
        search_context_size: webSearch.searchContextSize,
      }],
      tool_choice: "required",
      max_tool_calls: webSearch.maxToolCalls,
      include: ["web_search_call.action.sources"],
      ...(prompt.schema ? {
        text: { format: {
          type: "json_schema",
          name: "agent_base_sections_32_33_v1",
          strict: true,
          schema: prompt.schema,
        } },
      } : {}),
    },
    parseResponse,
  });
  return { ...result, model: configuration.model, reasoningEffort: configuration.reasoningEffort };
}
