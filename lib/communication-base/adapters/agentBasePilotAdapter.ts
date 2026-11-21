import "server-only";
import { createHash, randomUUID } from "node:crypto";
import { requestOpenAiResponses } from "../../openai-responses/openAiResponsesAdapter";
import { clientOpenAiCostContext } from "../../openai-costs";
import { resolveOpenAiProductWorkload } from "../../openai-workloads";
import type { AgentBaseEnvironment } from "../config";
import { buildAgentBasePilotPrompt, parseAgentBasePilotResponse, sanitizeAgentBasePilotFailureReason, type AgentBasePilotSection } from "../agent-base/pilot";

export async function generateAgentBasePilotSection(input: Parameters<typeof buildAgentBasePilotPrompt>[0] & Readonly<{
  environment: AgentBaseEnvironment; timeoutMs: number;
  generationId?: string | null;
}>) {
  const previous = input.previous.map(({ dispatchedOperationId: _operationId, ...section }) => section);
  const prompt = buildAgentBasePilotPrompt({ ...input, previous });
  if (!prompt) return { ok: false as const };
  const active = await resolveOpenAiProductWorkload("communication_base_stage2_intelligence", input.environment);
  if (!active.ok || !active.value.webSearch) return { ok: false as const };
  // The Agent Base uses Standard from the request, independent of the shared tier.
  const configuration = { ...active.value, model: "gpt-6.2-sol", reasoningEffort: "medium", serviceTier: null } as const;
  const web = active.value.webSearch;
  const requestId = randomUUID();
  const costIds: string[] = [];
  const dispatchedIds: (string | undefined)[] = [];
  const result = await requestOpenAiResponses<AgentBasePilotSection>({
    apiKey: process.env.OPENAI_API_KEY,
    configuration, environment: input.environment, expectedWorkload: "communication_base_stage2_intelligence",
    requestId, promptVersion: prompt.promptVersion, contractVersion: 1, timeoutMs: input.timeoutMs,
    financialContext: clientOpenAiCostContext(input.base.accountId, input.generationId
      ? { kind: "category_3_generation", eventId: input.generationId } : null), executionOrigin: "runtime",
    baselineReference: "d14f_agent_base_pilot_" + input.key,
    request: {
      instructions: prompt.instructions, input: prompt.input, store: false, background: false,
      service_tier: "default", max_output_tokens: 12_000,
      safety_identifier: createHash("sha256").update(input.base.accountId).digest("hex"),
      tools: [{ type: "web_search", external_web_access: web.externalWebAccess, search_context_size: web.searchContextSize }],
      tool_choice: "auto", max_tool_calls: web.maxToolCalls, include: ["web_search_call.action.sources"],
      text: { format: { type: "json_schema", name: "agent_base_pilot_section", strict: true, schema: prompt.schema } },
    },
    parseResponse: payload => parseAgentBasePilotResponse(payload, input.key, input.definitions),
  }, input.generationId ? {
    createId() {
      const id = randomUUID();
      costIds.push(id);
      return id;
    },
    fetchImpl(url, init) {
      // The shared adapter allocates the execution ID and then the operation ID before dispatch.
      dispatchedIds.push(costIds.length === 2 ? costIds[1] : undefined);
      return fetch(url, init);
    },
  } : undefined);
  if (!result.ok) console.warn("agent_base_pilot_failure", {
    requestId, section: input.key, kind: result.kind, reason: sanitizeAgentBasePilotFailureReason(result.reason),
  });
  if (!result.ok) return { ok: false as const };
  const dispatchedOperationId = costIds.length === 2 && dispatchedIds.length === 1 ? dispatchedIds[0] : undefined;
  return { ok: true as const, value: dispatchedOperationId ? { ...result.value, dispatchedOperationId } : result.value };
}
