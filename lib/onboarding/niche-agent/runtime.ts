import "server-only";
import { createHash } from "node:crypto";
import { z } from "zod";
import { clientOpenAiCostContext } from "../../openai-costs";
import { requestOpenAiResponses } from "../../openai-responses/openAiResponsesAdapter";
import { resolveOpenAiProductWorkload, resolveOpenAiWorkloadEnvironment } from "../../openai-workloads";
import { prepareNicheTurn, type NicheTurnContext } from "./index";
import { publicResearchContext, resolveSynthesis, synthesisReference, type DialogueText } from "./dialogue";

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
  synthesis: synthesisReference.nullish(),
  synthesisAccepted: z.boolean().optional(),
  synthesisPartialId: z.uuid().nullish(),
  nicheAccepted: z.boolean().optional(),
});

export async function requestNicheAgent(accountId: string, dialogueId: string, context: NicheTurnContext, privateBusinessName?: string | null) {
  const environment = resolveOpenAiWorkloadEnvironment();
  const configuration = await resolveOpenAiProductWorkload("pending_setup_conversation", environment);
  if (!configuration.ok) return null;
  const run = async (context: NicheTurnContext, search?: NonNullable<typeof configuration.value.webSearch>) => {
    const turn = prepareNicheTurn(context, search?.maxToolCalls ?? 0);
    if (!turn.ok) return null;
    const result = await requestOpenAiResponses({
      ...turn.value,
      environment,
      configuration: configuration.value,
      apiKey: process.env.OPENAI_API_KEY,
      financialContext: clientOpenAiCostContext(accountId, { kind: "niche_resolution", eventId: dialogueId }),
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
  };
  const turn = await run(context);
  const search = configuration.value.webSearch;
  if (!turn?.searchTopic || !search) return turn;
  const publicContext = publicResearchContext(turn.searchTopic, context, privateBusinessName, turn.pendingSetup?.publicName.proposal);
  if (!publicContext) return turn;
  const research = await run(publicContext, search);
  const reply = research && turn.reply + "\n\n" + research.reply;
  return reply && reply.length <= 4000 ? { ...turn, reply } : turn;
}

export function currentSynthesis(state: z.output<typeof dialogueState> | undefined, messages: readonly DialogueText[]) {
  const snapshot = resolveSynthesis(state?.synthesis, messages);
  const partialReply = messages.find(entry => entry.id === state?.synthesisPartialId && entry.role === "user")?.content;
  return snapshot ? { ...snapshot, accepted: state?.synthesisAccepted === true, partialReply } : null;
}

export { mergeNicheMemory, nicheSummaryContext } from "./dialogue";
