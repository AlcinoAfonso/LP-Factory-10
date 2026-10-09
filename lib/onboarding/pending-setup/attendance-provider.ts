import "server-only";
import { createHash, randomUUID } from "node:crypto";
import { requestOpenAiResponses, type OpenAiResponsesDependencies } from "../../openai-responses/openAiResponsesAdapter";
import { clientOpenAiCostContext, type OpenAiCostEconomicContext } from "../../openai-costs";
import { resolveOpenAiProductWorkload, resolveOpenAiWorkloadEnvironment,
  type ResolvedOpenAiProductWorkload, type OpenAiWorkloadEnvironment } from "../../openai-workloads";
import { ATTENDANCE_PROMPT_VERSION, ATTENDANCE_CONTRACT_VERSION, attendancePrompt,
  attendanceOutputSchema, validateAttendanceOutput, type AttendanceContext, type AttendanceOutput } from "./attendance-core";

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
  if (!resolved.ok) return { ok: false as const };
  const prompt = attendancePrompt(input.context);
  const result = await requestOpenAiResponses<Readonly<{ output: AttendanceOutput }>>({
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
  for (const item of Array.isArray(data.output) ? data.output : []) {
    if (!item || typeof item !== "object") continue;
    const record = item as Record<string, unknown>;
    if (record.type === "web_search_call") return invalid;
    if (record.type !== "message") continue;
    for (const content of Array.isArray(record.content) ? record.content : []) {
      if (content.type === "refusal") return { ...invalid, kind: "refusal" as const, reason: "provider_refusal" };
      if (content.type === "output_text" && typeof content.text === "string") chunks.push(content.text);
    }
  }
  let output: unknown;
  try { output = JSON.parse(chunks.join("") || String(data.output_text ?? "")); } catch { return invalid; }
  const validated = validateAttendanceOutput(output, context);
  if (!validated) {
    const parsed = attendanceOutputSchema.safeParse(output);
    console.warn("pending_setup_attendance_contract_failed", {
      schemaValid: parsed.success, action: parsed.success ? parsed.data.action : null,
      hasTaxonId: parsed.success && parsed.data.existingTaxonId !== null,
      confirmation: Boolean(context.confirmedProposal), hasUnderstanding: Boolean(context.displayedUnderstanding),
      readyToComplete: parsed.success && parsed.data.readyToComplete,
      sufficientUnderstanding: parsed.success && parsed.data.sufficientUnderstanding,
      nameChanged: parsed.success && parsed.data.preferredName !== null && parsed.data.preferredName !== context.preferredName,
      nameDeclined: parsed.success && parsed.data.preferredNameDeclined,
    });
  }
  return validated ? { ok: true as const, value: { output: validated },
    telemetry: { webSearchCallCount: 0, webSearchSourceCount: 0 } } : invalid;
}
