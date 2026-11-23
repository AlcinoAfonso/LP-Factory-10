import "server-only";
import { createHash } from "node:crypto";
import { z } from "zod";
import type { OpenAiResponsesInput } from "../../openai-responses/openAiResponsesAdapter";
import { readNicheDialogueCostContext } from "../../openai-costs/adapters/costLedgerReadAdapter";
import { requestOpenAiResponses } from "../../openai-responses/openAiResponsesAdapter";
import { webSearchMetadata } from "../../openai-responses/web-search-metadata";
import { resolveOpenAiProductWorkload, resolveOpenAiWorkloadEnvironment } from "../../openai-workloads";
import { validNicheDescription } from "../niche-resolution/official-niche-policy";
import {
  CONTACT_RECEIPT, SYNTHESIS_QUESTION, mergeNicheMemory, presentOffer, publicResearchTopic, redactNicheText, synthesisReference, withoutWhatsAppField,
  type DialogueText, type DisplayedOffer, type NicheOffer, type SynthesisWrite,
} from "./dialogue";
import { NICHE_AGENT_INSTRUCTIONS, NICHE_AGENT_PROMPT_VERSION } from "./prompt";

export type NicheContext = Readonly<{
  message: string;
  history: readonly DialogueText[];
  summary: string | null;
  businessContext: string | null;
  officialNiche: string | null;
  fixedNiche?: string | null;
  displayed: DisplayedOffer | null;
  pendingSetup?: { preferredName: string | false | null; publicName: string | null; publicNameRequired: boolean };
}>;

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

const offerShape = z.strictObject({
  summary: z.string(),
  niche: z.string().nullable(),
  publicName: z.string().nullable(),
});
const correctionShape = z.strictObject({ previous: z.string(), replacement: z.string() });
const outputShape = z.strictObject({
  reply: z.string(),
  offer: offerShape.nullable(),
  accept: z.string().nullable(),
  clear: z.boolean(),
  corrections: z.array(correctionShape),
  preferredName: z.union([z.string(), z.literal(false)]).nullable(),
  searchTopic: z.string().nullable(),
});
const format = { type: "json_schema", name: "niche_turn", strict: true,
  schema: z.toJSONSchema(outputShape, { target: "draft-7" }) } as const;
const fragment = z.string().trim().min(1).max(1000);
const correction = correctionShape.extend({ previous: fragment, replacement: fragment });
const envelope = z.object({
  status: z.literal("completed"),
  output: z.array(z.object({
    type: z.string(),
    role: z.string().optional(),
    content: z.array(z.object({ type: z.string(), text: z.string().optional() })).optional(),
  })),
});

type RawTurn = Partial<Record<keyof typeof outputShape.shape, unknown>>;
export type NicheTurn = Readonly<{
  reply: string;
  offer: NicheOffer | null;
  synthesis: SynthesisWrite;
  summary: string | null;
  preferredName: string | false | null;
  searchTopic: string | null;
}>;
export const contactTurn: NicheTurn = {
  reply: CONTACT_RECEIPT, offer: null, summary: null, preferredName: null, searchTopic: null,
  synthesis: { accept: null, offer: null, clear: false, nicheReaction: "continue" },
};

const project = (value: string | null | undefined) => value ? redactNicheText(value) : null;
const safeName = (value: unknown) => validNicheDescription(value) && project(value) === value ? value : null;

function safeReply(value: unknown) {
  if (typeof value !== "string") return null;
  const reply = redactNicheText(value).replaceAll(SYNTHESIS_QUESTION, "").trim();
  return reply && reply.length <= 4000 ? reply : null;
}

function readOutput(payload: unknown) {
  const data = envelope.safeParse(payload);
  if (!data.success) return null;
  const content = data.data.output.filter(item => item.type === "message" && item.role === "assistant")
    .flatMap(item => item.content ?? []);
  if (content.some(item => item.type === "refusal")) return null;
  return content.filter(item => item.type === "output_text").map(item => item.text).join("").trim() || null;
}

function validatedTurn(raw: RawTurn, context: NicheContext, observedSummary: string | null): NicheTurn | null {
  const parsedOffer = offerShape.safeParse(raw.offer);
  const proposed = parsedOffer.success ? parsedOffer.data : null;
  const niche = safeName(proposed?.niche);
  const name = context.pendingSetup ? safeName(proposed?.publicName) : null;
  const understanding = fragment.safeParse(proposed?.summary);
  const offer = proposed && understanding.success && project(understanding.data) === understanding.data &&
    (proposed.niche === null || niche) && (!context.pendingSetup || proposed.publicName === null || name) &&
    (!context.pendingSetup?.publicNameRequired || context.pendingSetup.publicName || name) &&
    (!context.fixedNiche || niche === context.fixedNiche)
    ? { summary: understanding.data, niche, publicName: name } : null;
  const presentation = offer && presentOffer(offer);
  const shown = presentation || null;

  // The model alone judges acceptance. The server checks only the exact displayed target.
  const candidate = context.displayed && !shown && raw.offer == null && raw.clear !== true &&
    raw.accept === context.displayed.id &&
    (!context.fixedNiche || context.displayed.niche === context.fixedNiche)
    ? context.displayed : null;
  const corrections = Array.isArray(raw.corrections) ? raw.corrections.slice(0, 6).flatMap(value => {
    const parsed = correction.safeParse(value);
    return parsed.success ? [parsed.data] : [];
  }) : [];
  const summary = candidate && !context.fixedNiche
    ? mergeNicheMemory(observedSummary, candidate, corrections) : null;
  const accepted = candidate && summary !== undefined ? candidate : null;
  const clear = raw.clear === true && raw.offer == null && raw.accept == null;
  const reply = candidate && summary === undefined
    ? "Não foi possível concluir a confirmação. A proposta e o contexto anterior foram preservados."
    : shown?.reply ?? safeReply(raw.reply) ?? (accepted ? "Recebi sua confirmação." : null);
  if (!reply) return null;
  const preferredName = context.pendingSetup
    ? safeName(raw.preferredName) ?? (raw.preferredName === false ? false : null) : null;
  return {
    reply, offer: shown ? offer : null, summary: accepted ? summary ?? null : null, preferredName,
    searchTopic: !context.fixedNiche && !candidate && !shown && raw.accept == null && !clear &&
      typeof raw.searchTopic === "string" ? raw.searchTopic.trim() : null,
    synthesis: {
      offer: shown?.range ?? null, accept: accepted?.id ?? null, clear,
      nicheReaction: accepted?.niche ? "accept" : accepted || clear ? "clear" : "continue",
    },
  };
}

export function prepareNicheTurn(context: NicheContext, observedSummary: string | null): Pick<OpenAiResponsesInput<NicheTurn>,
  "request" | "parseResponse" | "promptVersion" | "contractVersion"> {
  const original = context.pendingSetup ? withoutWhatsAppField(context.message) : context.message;
  const message = redactNicheText(original);
  const history = context.history.map(({ role, content }) => ({
    role, content: project(context.pendingSetup && role === "user" ? withoutWhatsAppField(content) : content),
  })).filter(item => item.content);
  return {
    promptVersion: NICHE_AGENT_PROMPT_VERSION, contractVersion: 5,
    request: {
      instructions: NICHE_AGENT_INSTRUCTIONS,
      input: JSON.stringify({ ...context, message, history, summary: project(context.summary),
        businessContext: project(context.businessContext), officialNiche: project(context.officialNiche) }),
      store: false, background: false, text: { format },
    },
    parseResponse(payload) {
      const text = readOutput(payload);
      if (text && webSearchMetadata(payload)?.calls === 0) {
        let raw: unknown;
        try { raw = JSON.parse(text); } catch { raw = /^[{["]/u.test(text) ? null : { reply: text }; }
        if (raw && typeof raw === "object" && !Array.isArray(raw)) {
          const turn = validatedTurn(raw, context, observedSummary);
          if (turn) return { ok: true, value: turn };
        }
      }
      return { ok: false, kind: "invalid_response", reason: "niche_reply_unavailable" };
    },
  };
}

export function readNicheResearch(payload: unknown, limit: number) {
  const web = webSearchMetadata(payload);
  const reply = safeReply(readOutput(payload));
  if (!reply || !web?.calls || web.calls > limit) return null;
  return reply + "\n\nFontes consultadas em " + new Date().toISOString().slice(0, 10) + ":\n" +
    web.sources.slice(0, 3).map(source => source.url).join("\n");
}

export async function requestNicheAgent(accountId: string, dialogueId: string, context: NicheContext, prior: string | null) {
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
