import "server-only";
import { createHash } from "node:crypto";
import { z } from "zod";
import { clientOpenAiCostContext } from "../../openai-costs";
import { requestOpenAiResponses } from "../../openai-responses/openAiResponsesAdapter";
import { resolveOpenAiProductWorkload, resolveOpenAiWorkloadEnvironment } from "../../openai-workloads";
import { prepareNicheTurn, type NicheTurn, type NicheTurnContext } from "./index";

export const conversationalMessage = z.object({
  account: z.string().regex(/^[a-z0-9][a-z0-9-]{0,62}$/),
  dialogueId: z.uuid().nullable(),
  version: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER),
  requestId: z.uuid(),
  content: z.string().trim().min(1).max(4000),
}).strict();

export const turnText = z.object({ role: z.enum(["user", "assistant"]), content: z.string() });
export const dialogueState = z.object({
  requestId: z.uuid().nullish(),
  lastRequestId: z.uuid().nullish(),
  proposal: z.string().nullable().optional(),
  nameProposal: z.string().nullable().optional(),
  acceptedName: z.string().nullable().optional(),
  operationalAccepted: z.boolean().optional(),
  reply: z.string().optional(),
  understanding: z.string().optional(),
});

export async function requestNicheAgent(accountId: string, dialogueId: string, context: NicheTurnContext) {
  const environment = resolveOpenAiWorkloadEnvironment();
  const configuration = await resolveOpenAiProductWorkload("pending_setup_conversation", environment);
  if (!configuration.ok) return null;
  const search = context.pendingSetup && context.message && !context.activeProposal &&
    !context.pendingSetup.nameProposal && !context.pendingSetup.operationalProposal
    ? configuration.value.webSearch : null;
  const turn = prepareNicheTurn(context, search?.maxToolCalls ?? 0);
  if (!turn.ok) return null;
  const result = await requestOpenAiResponses({
    ...turn.value,
    environment,
    configuration: configuration.value,
    apiKey: process.env.OPENAI_API_KEY,
    financialContext: clientOpenAiCostContext(accountId, {
      kind: "niche_resolution", eventId: dialogueId,
    }),
    executionOrigin: "runtime",
    baselineReference: "d15e_conversational_niche",
    timeoutMs: 120_000,
    request: {
      ...turn.value.request,
      max_output_tokens: 12_000,
      safety_identifier: createHash("sha256").update(accountId).digest("hex"),
      ...(search ? {
        tools: [{ type: "web_search", external_web_access: search.externalWebAccess, search_context_size: search.searchContextSize }],
        tool_choice: "auto", max_tool_calls: search.maxToolCalls, include: ["web_search_call.action.sources"],
      } : {}),
    },
  });
  return result.ok ? result.value : null;
}

const summaryShape = z.object({
  contextualUnderstanding: z.string().nullish(),
  confirmedUnderstanding: z.string().nullish(),
  suggestions: z.array(z.string()).optional(),
  s: z.array(z.string()).optional(),
  c: z.string().optional(),
  p: z.string().nullish(),
  whatsapp: z.string().nullish(),
  w: z.string().nullish(),
  whatsappDeclined: z.boolean().optional(),
  d: z.boolean().optional(),
}).loose();

function readSummary(raw: string | null) {
  try {
    const parsed = summaryShape.safeParse(JSON.parse(raw ?? "{}"));
    return parsed.success ? parsed.data : null;
  } catch { return null; }
}

export function nicheSummaryContext(raw: string | null) {
  const summary = readSummary(raw);
  const values = [summary?.contextualUnderstanding, summary?.confirmedUnderstanding, ...(summary?.suggestions ?? summary?.s ?? [])];
  return {
    text: values.filter(Boolean).join("\n").slice(0, 6000) || null,
    whatsappKnown: Boolean(summary?.whatsapp ?? summary?.w ?? summary?.whatsappDeclined ?? summary?.d),
  };
}

export function mergeNicheMemory(raw: string | null, turn: NicheTurn, acceptedUnderstanding?: string) {
  const previous = readSummary(raw);
  if (!previous) return null;
  const summary = { classification: "Não identificada.", pendingReason: null as string | null, ...previous,
    contextualUnderstanding: previous.contextualUnderstanding ?? null,
    confirmedUnderstanding: previous.confirmedUnderstanding ?? null,
    suggestions: previous.suggestions ?? [] };
  if (previous.c !== undefined) {
    summary.classification = previous.c;
    summary.suggestions = previous.s ?? [];
    summary.pendingReason = typeof previous.p === "string" ? previous.p : null;
    delete summary.c; delete summary.s; delete summary.p;
  }
  if (previous.w !== undefined) { summary.whatsapp = previous.w; delete summary.w; }
  if (previous.d !== undefined) { summary.whatsappDeclined = previous.d; delete summary.d; }
  const unchanged = JSON.stringify(summary);
  for (const { text, replaces, kind } of turn.memory) {
    if (replaces !== null) {
      if (summary.contextualUnderstanding?.includes(replaces)) {
        summary.contextualUnderstanding = summary.contextualUnderstanding.replace(replaces, () => text);
      } else {
        summary.contextualUnderstanding = [summary.contextualUnderstanding, text].filter(Boolean).join("\n");
      }
      if (summary.confirmedUnderstanding?.includes(replaces)) {
        summary.confirmedUnderstanding = summary.confirmedUnderstanding.replace(replaces, "").trim() || null;
      }
      summary.suggestions = summary.suggestions.filter(entry => !entry.includes(replaces));
    } else if (kind === "declaration") {
      summary.contextualUnderstanding = [summary.contextualUnderstanding, text].filter(Boolean).join("\n");
    } else if (text.length <= 250 && summary.suggestions.length < 6) {
      summary.suggestions = [...summary.suggestions, (kind === "external" ? "Fonte externa: " : "Hipótese: ") + text];
    }
  }
  if ((summary.contextualUnderstanding?.length ?? 0) > 4000 || JSON.stringify(summary).length > 5800) {
    Object.assign(summary, JSON.parse(unchanged));
  }
  if (acceptedUnderstanding) summary.confirmedUnderstanding = acceptedUnderstanding;
  const contact = turn.pendingSetup?.whatsapp;
  if (contact?.value || contact?.declined) {
    summary.whatsapp = contact.value;
    summary.whatsappDeclined = contact.declined;
  }
  const joined = JSON.stringify(summary);
  return joined !== unchanged && joined.length <= 5800 ? joined : null;
}
