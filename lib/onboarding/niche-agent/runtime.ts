import "server-only";
import { createHash } from "node:crypto";
import { z } from "zod";
import { readNicheDialogueCostContext } from "../../openai-costs/adapters/costLedgerReadAdapter";
import { requestOpenAiResponses } from "../../openai-responses/openAiResponsesAdapter";
import { resolveOpenAiProductWorkload, resolveOpenAiWorkloadEnvironment } from "../../openai-workloads";
import { contactTurn, fixedNicheTurn, prepareNicheTurn, publicResearchTopic, readNicheResearch, type NicheContext } from "./index";
import { synthesisReference, withoutWhatsAppField } from "./dialogue";

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
  proposal: z.string().nullish(),
  nameProposal: z.string().nullish(),
  acceptedName: z.string().nullish(),
  official: z.object({ description: z.string().nullish(), legacyTaxonId: z.string().nullish(),
    legacyUpdatedAt: z.string().nullish() }).optional(),
  synthesis: synthesisReference.nullish(),
});

export async function requestNicheAgent(accountId: string, dialogueId: string, context: NicheContext, prior: string | null) {
  if (context.fixedNiche) return fixedNicheTurn(context, prior);
  if (context.pendingSetup && !withoutWhatsAppField(context.message)) return contactTurn;
  const environment = resolveOpenAiWorkloadEnvironment();
  const configuration = await resolveOpenAiProductWorkload("pending_setup_conversation", environment);
  if (!configuration.ok || environment === "unknown") return null;
  const financialContext = await readNicheDialogueCostContext(accountId, dialogueId, environment).catch(() => null);
  if (!financialContext) {
    console.warn("d15e_niche_cost_context_unavailable", { journey: context.pendingSetup ? "pending_setup" : "account_niche" });
    return null;
  }
  const transport = {
    environment, configuration: configuration.value, apiKey: process.env.OPENAI_API_KEY,
    financialContext,
    executionOrigin: "runtime" as const, baselineReference: "d15e_conversational_niche", timeoutMs: 120_000,
    expectedWorkload: "pending_setup_conversation" as const,
  };
  const limits = { max_output_tokens: 12_000, safety_identifier: createHash("sha256").update(accountId).digest("hex") };
  const prepared = prepareNicheTurn(context, prior);
  const turn = await requestOpenAiResponses({ ...transport, ...prepared, request: { ...prepared.request, ...limits } });
  if (!turn.ok) {
    console.warn("d15e_niche_turn_unavailable", { journey: context.pendingSetup ? "pending_setup" : "account_niche", kind: turn.kind });
    return null;
  }
  const search = configuration.value.webSearch;
  const topic = turn.value.searchTopic && publicResearchTopic(turn.value.searchTopic, context);
  if (!search || !topic) return turn.value;
  const research = await requestOpenAiResponses({
    ...transport, promptVersion: prepared.promptVersion, contractVersion: prepared.contractVersion,
    request: {
      ...limits, instructions: "Esclareça somente o assunto público recebido, em português e com brevidade. Use a pesquisa para fatos verificáveis. Não proponha nicho, peça confirmação, anuncie gravações ou inclua URLs no texto.",
      input: topic, store: false, background: false,
      tools: [{ type: "web_search", external_web_access: search.externalWebAccess, search_context_size: search.searchContextSize }],
      tool_choice: "auto", max_tool_calls: search.maxToolCalls, include: ["web_search_call.action.sources"],
    },
    parseResponse(payload) {
      const reply = readNicheResearch(payload, search.maxToolCalls);
      return reply ? { ok: true, value: reply } : { ok: false, kind: "invalid_response", reason: "niche_research_unavailable" };
    },
  });
  const reply = research.ok ? turn.value.reply + "\n\n" + research.value : turn.value.reply;
  return reply.length <= 4000 ? { ...turn.value, reply } : turn.value;
}
