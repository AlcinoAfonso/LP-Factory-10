// Experimento manual D14F; reutiliza o provider e o workload E21 existentes.
// Não é consumidor da UI e nunca grava conteúdo na Base.
import { createHash, randomUUID } from "node:crypto";

import { requestOpenAiResponses } from "../../openai-responses/openAiResponsesAdapter";
import { clientOpenAiCostContext } from "../../openai-costs";
import { resolveOpenAiProductWorkload } from "../../openai-workloads";
import {
  AGENT_BASE_RESEARCH_PROMPT_VERSION,
  buildAgentBaseResearchPrompt,
  parseAgentBaseResearchResponse,
  type AgentBaseResearchContext,
} from "./research";

export async function runAgentBaseMarketResearchExperiment(input: Readonly<{
  accountId: string;
  context: AgentBaseResearchContext;
  apiKey: string | undefined;
}>) {
  if (!/^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(input.accountId) || !input.apiKey?.trim()) {
    return { ok: false as const, reason: "experiment_input_or_api_key_missing" };
  }
  const prompt = buildAgentBaseResearchPrompt(input.context);
  if (!prompt) return { ok: false as const, reason: "research_context_invalid" };

  // Development usa a configuração do registry, sem alterar as revisões ativas em Preview/Production.
  const resolved = await resolveOpenAiProductWorkload("communication_base_stage2_intelligence", "development");
  if (!resolved.ok || !resolved.value.webSearch) {
    return { ok: false as const, reason: "research_workload_unavailable" };
  }
  const configuration = resolved.value;
  const webSearch = configuration.webSearch;
  if (!webSearch) return { ok: false as const, reason: "research_workload_unavailable" };
  return requestOpenAiResponses({
    apiKey: input.apiKey,
    configuration,
    environment: "development",
    expectedWorkload: "communication_base_stage2_intelligence",
    financialContext: clientOpenAiCostContext(input.accountId),
    executionOrigin: "administrative_proof",
    requestId: randomUUID(),
    promptVersion: AGENT_BASE_RESEARCH_PROMPT_VERSION,
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
    },
    parseResponse: parseAgentBaseResearchResponse,
  });
}
