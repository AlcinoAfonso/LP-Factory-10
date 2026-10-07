import "server-only";
import { createHash, randomUUID } from "node:crypto";
import { requestOpenAiResponses, type OpenAiResponsesDependencies } from "../../openai-responses/openAiResponsesAdapter";
import { clientOpenAiCostContext, type OpenAiCostEconomicContext } from "../../openai-costs";
import { resolveOpenAiProductWorkload, resolveOpenAiWorkloadEnvironment,
  type ResolvedOpenAiProductWorkload, type OpenAiWorkloadEnvironment } from "../../openai-workloads";
import { ATTENDANCE_PROMPT_VERSION, ATTENDANCE_CONTRACT_VERSION, attendancePrompt,
  validateAttendanceOutput, validHttpsSource, type AttendanceContext, type AttendanceOutput } from "./attendance-core";

export async function requestAttendance(input: Readonly<{
  accountId: string; context: AttendanceContext;
  configurationOverride?: ResolvedOpenAiProductWorkload; environment?: OpenAiWorkloadEnvironment;
  apiKey?: string; financialContext?: OpenAiCostEconomicContext;
  executionOrigin?: "runtime" | "administrative_proof";
}>, dependencies: OpenAiResponsesDependencies = {}) {
  const environment = input.environment ?? resolveOpenAiWorkloadEnvironment();
  const resolved = input.configurationOverride
    ? { ok: true as const, value: input.configurationOverride }
    : await resolveOpenAiProductWorkload("pending_setup_conversation", environment);
  if (!resolved.ok || (input.context.research && !resolved.value.webSearch)) return { ok: false as const };
  const prompt = attendancePrompt(input.context);
  const result = await requestOpenAiResponses<Readonly<{ output: AttendanceOutput; sources: readonly string[] }>>({
    apiKey: input.apiKey ?? process.env.OPENAI_API_KEY,
    environment, configuration: resolved.value, expectedWorkload: "pending_setup_conversation",
    requestId: randomUUID(), promptVersion: ATTENDANCE_PROMPT_VERSION, contractVersion: ATTENDANCE_CONTRACT_VERSION,
    financialContext: input.financialContext ?? clientOpenAiCostContext(input.accountId),
    executionOrigin: input.executionOrigin ?? "runtime", baselineReference: "e10_12_attendance",
    timeoutMs: 120_000,
    request: {
      instructions: prompt.instructions, input: prompt.input, store: false, background: false,
      max_output_tokens: 12_000,
      safety_identifier: createHash("sha256").update(input.accountId).digest("hex"),
      text: { format: { type: "json_schema", name: "pending_setup_attendance", strict: true, schema: prompt.schema } },
      ...(input.context.research ? {
        tools: [{ type: "web_search", external_web_access: true,
          search_context_size: resolved.value.webSearch?.searchContextSize }],
        tool_choice: "required", max_tool_calls: resolved.value.webSearch?.maxToolCalls,
        include: ["web_search_call.action.sources"],
      } : {}),
    },
    parseResponse: payload => parseAttendanceResponse(payload, input.context),
  }, dependencies);
  return result.ok ? { ok: true as const, ...result.value, responseId: result.responseId, latencyMs: result.latencyMs }
    : { ok: false as const };
}

export function parseAttendanceResponse(payload: unknown, context: AttendanceContext) {
  const invalid = { ok: false as const, kind: "invalid_response" as const, reason: "attendance_contract_invalid" };
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return invalid;
  const data = payload as Record<string, unknown>;
  if (data.status === "incomplete" || data.error) return invalid;
  const chunks: string[] = [];
  const sources = new Set<string>();
  let webSearchCallCount = 0;
  const collectSource = (source: unknown) => {
    if (!source || typeof source !== "object") return;
    const url = (source as Record<string, unknown>).url;
    if (typeof url === "string" && validHttpsSource(url)) sources.add(url);
  };
  for (const item of Array.isArray(data.output) ? data.output : []) {
    if (!item || typeof item !== "object") continue;
    const record = item as Record<string, unknown>;
    if (record.type === "web_search_call" && record.status === "completed") {
      webSearchCallCount++;
      const action = record.action as { sources?: unknown[] } | undefined;
      for (const source of action?.sources ?? []) collectSource(source);
    }
    if (record.type !== "message") continue;
    for (const content of Array.isArray(record.content) ? record.content : []) {
      if (content.type === "refusal") return { ...invalid, kind: "refusal" as const, reason: "provider_refusal" };
      if (content.type === "output_text" && typeof content.text === "string") chunks.push(content.text);
      for (const annotation of content.annotations ?? []) {
        if (annotation.type === "url_citation") collectSource(annotation);
      }
    }
  }
  if (context.research && !webSearchCallCount) return invalid;
  if (!context.research && webSearchCallCount) return invalid;
  let output: unknown;
  try { output = JSON.parse(chunks.join("") || String(data.output_text ?? "")); } catch { return invalid; }
  const validated = validateAttendanceOutput(output, context, [...sources]);
  return validated ? { ok: true as const, value: { output: validated, sources: [...sources] },
    telemetry: { webSearchCallCount, webSearchSourceCount: sources.size } } : invalid;
}
