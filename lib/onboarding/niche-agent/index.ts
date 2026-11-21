import { z } from "zod";
import type { OpenAiResponsesInput } from "../../openai-responses/openAiResponsesAdapter";
import { webSearchMetadata } from "../../openai-responses/web-search-metadata";
import { validNicheDescription } from "../niche-resolution/official-niche-policy";
import {
  CONTACT_RECEIPT, mergeNicheMemory, presentOffer, redactNicheText, withoutWhatsAppField,
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
type NicheTurn = Readonly<{
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
const claimsWrite = /\b(?:registrei|gravei|salvei|atualizei|já consta|foi feita a (?:gravação|atualização)|(?:ficou|foi|está) (?:salv[oa]|registrad[oa]|atualizad[oa]|confirmad[oa])|nicho atualizad[oa])\b/iu;

function safeReply(value: unknown) {
  if (typeof value !== "string") return null;
  const reply = redactNicheText(value).trim();
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

function acceptance(message: string, echo: unknown, offer: DisplayedOffer, fixed: boolean) {
  const words = message.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
  if (/[?]/u.test(words) ||
    /(?:^nao\b|\bnao\s+(?:confirm|aceit|aprov|concord|pode|represent|esta )|\b(?:mas|porem|contudo|exceto|ainda|se|somente|apenas|discordo|recuso|nunca|jamais|corrijo|corrija|troque|altere|errad[oa]|incorret[oa]|faltou|so que|na verdade)\b)/u.test(words)) return false;
  if (offer.publicName && /\b(?:nome|nicho)\b/u.test(words) &&
    !/\b(?:sintese|tudo|ambos|nome.+nicho|nicho.+nome)\b/u.test(words)) return false;
  if (/^(?:sim(?:[, ]+(?:confirmo|correto|perfeito|isso mesmo))?|isso mesmo|correto|exato|de acordo|perfeito)[.! ]*$/u.test(words)) return true;
  if (fixed) return /^(?:(?:eu )?(?:confirmo|aceito|aprovo)|pode (?:registrar|salvar|confirmar))(?: (?:o nicho|a descricao|a sintese)(?: (?:atual|cadastrad[oa]|exibid[oa]))?)?[.! ]*$/u.test(words);
  return echo === message && /\b(?:confirmo|aceito|aprovo|concordo|isso mesmo|de acordo|pode (?:registrar|salvar|confirmar|seguir)|(?:esta|ta) (?:tudo )?(?:correto|certo)|representa (?:isso|exatamente))\b/u.test(words);
}

function interpret(raw: RawTurn, context: NicheContext, observedSummary: string | null, message: string): NicheTurn | null {
  const output = offerShape.safeParse(raw.offer);
  const proposed = output.success ? output.data : null;
  const niche = safeName(proposed?.niche);
  const name = context.pendingSetup ? safeName(proposed?.publicName) : null;
  const understanding = fragment.safeParse(proposed?.summary);
  const offer = proposed && understanding.success && project(understanding.data) === understanding.data &&
    (proposed.niche === null || niche) && (!context.pendingSetup || proposed.publicName === null || name) &&
    (!context.pendingSetup?.publicNameRequired || context.pendingSetup.publicName || name)
    ? { summary: understanding.data, niche, publicName: name } : null;
  const shown = offer && presentOffer(offer);
  const candidate = context.displayed && !shown && acceptance(message, raw.accept, context.displayed, Boolean(context.fixedNiche))
    ? context.displayed : null;
  const corrections = Array.isArray(raw.corrections) ? raw.corrections.slice(0, 6).flatMap(value => {
    const parsed = correction.safeParse(value);
    return parsed.success ? [parsed.data] : [];
  }) : [];
  const summary = candidate && !context.fixedNiche
    ? mergeNicheMemory(observedSummary, candidate, corrections) : null;
  const accepted = summary !== undefined ? candidate : null;
  const reply = accepted
    ? accepted.niche ? "Entendido. O nicho está confirmado." : "Entendido. A síntese está confirmada."
    : candidate ? "O contexto não pôde ser atualizado. Podemos conferir a síntese novamente."
      : shown?.reply ?? safeReply(raw.reply);
  if (!reply) return null;
  const rejectedAcceptance = !context.fixedNiche && raw.accept != null && !candidate;
  const clarification = /^(?:vamos (?:esclarecer|conferir|ajustar)\b|(?:qual|que|como|o que|quem|você|pode)\b)[^.!?\n]{0,280}[.?]?$/iu;
  const unsafeReply = !accepted && !shown && (claimsWrite.test(reply) || (rejectedAcceptance && !clarification.test(reply)));
  const personal = context.pendingSetup ? safeName(raw.preferredName) : null;
  const preferredName = personal && message.toLocaleLowerCase("pt-BR").includes(personal.toLocaleLowerCase("pt-BR"))
    ? personal : context.pendingSetup && raw.preferredName === false ? false : null;
  return {
    reply: unsafeReply ? "Vamos conferir o entendimento. O que você gostaria de confirmar ou ajustar?" : reply,
    offer: shown ? offer : null, summary: summary ?? null, preferredName,
    searchTopic: !candidate && !shown && raw.accept == null && typeof raw.searchTopic === "string" ? raw.searchTopic.trim() : null,
    synthesis: { offer: shown?.range ?? null, accept: accepted?.id ?? null, clear: !shown && !accepted,
      nicheReaction: accepted?.niche ? "accept" : "clear" },
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
    promptVersion: NICHE_AGENT_PROMPT_VERSION, contractVersion: 4,
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
          const turn = interpret(raw, context, observedSummary, message);
          if (turn) return { ok: true, value: turn };
        }
      }
      return { ok: false, kind: "invalid_response", reason: "niche_reply_unavailable" };
    },
  };
}

export function fixedNicheTurn(context: NicheContext, prior: string | null) {
  return interpret(context.displayed ? {
    reply: "Com um produto cadastrado, é possível confirmar somente o nicho atual.",
    accept: context.message,
  } : {
    offer: { summary: "Com um produto cadastrado, é possível confirmar somente a descrição atual.", niche: context.fixedNiche, publicName: null },
  }, context, prior, context.message);
}

export function readNicheResearch(payload: unknown, limit: number) {
  const web = webSearchMetadata(payload);
  const reply = safeReply(readOutput(payload));
  if (!reply || claimsWrite.test(reply) || !web?.calls || web.calls > limit) return null;
  return reply + "\n\nFontes consultadas em " + new Date().toISOString().slice(0, 10) + ":\n" +
    web.sources.slice(0, 3).map(source => source.url).join("\n");
}

export function publicResearchTopic(topic: string, context: NicheContext) {
  if (!/^[\p{L}\p{M}][\p{L}\p{M} ,?()-]{3,159}$/u.test(topic) ||
    /\b(?:rua|avenida|cep|whatsapp|telefone|endereço|e-mail|cpf|cnpj)\b/iu.test(topic)) return null;
  const names = [context.pendingSetup?.preferredName || null, context.pendingSetup?.publicName];
  const businessContext = context.businessContext ?? "";
  try {
    const business = JSON.parse(businessContext || "{}") as Record<string, unknown>;
    for (const [key, value] of Object.entries(business)) {
      if (/name|address|city|contact|phone|email|website|location/i.test(key) && typeof value === "string") names.push(value);
    }
  } catch {
    if (context.pendingSetup) {
      // This label is generated by the Pending Setup action, not interpreted from user replies.
      for (const [, name] of businessContext.matchAll(/^Nome anteriormente informado:[ \t]*([^\r\n]+)/gmu)) names.push(name);
    }
  }
  const conversation = [...context.history.map(entry => entry.content), context.message];
  for (const text of conversation) {
    names.push(...(text.match(/\p{Lu}[\p{Ll}\p{M}]+(?: +\p{Lu}[\p{Ll}\p{M}]+)+/gu) ?? []));
  }
  // Explicit name declarations are private even when their spelling has no capitals.
  const declaration = /\b(?:(?:empresa|neg[oó]cio|loja|marca)\s+se\s+chama|(?:minha\s+(?:empresa|loja|marca)|meu\s+neg[oó]cio)\s+[eé]|nome\s+d[ao]\s+(?:empresa|neg[oó]cio|loja|marca)\s+[eé]|me\s+chamo|meu\s+nome\s+[eé])\s+(.+)/iu;
  const clauseEnd = /[\r\n.,;!?]|\s+e\s+(?=(?:faz(?:emos)?|oferece(?:mos)?|vende(?:mos)?|atende(?:mos)?|atua(?:mos)?|trabalha(?:mos)?|me\s+chamo|meu\s+nome|minha\s+(?:empresa|loja|marca)|meu\s+neg[oó]cio)\b)/iu;
  const affiliation = /\b(?:[ao]\s+(?:empresa|neg[oó]cio|loja|marca)\s+(?!d[aeo]s?\s)(.+?)\s+(?:faz|oferece|vende|atende|atua|trabalha)\b|trabalho\s+n[ao]\s+(.+?)(?:\s+(?:com|como)\b|$))/iu;
  for (const text of [businessContext, context.summary ?? "", ...conversation]) {
    for (const clause of text.split(clauseEnd)) {
      const named = affiliation.exec(clause);
      const name = declaration.exec(clause)?.[1] ?? named?.[1] ?? named?.[2];
      if (name) names.push(name);
    }
  }
  const normalize = (text: string) => text.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase()
    .replace(/[^\p{L}]+/gu, " ").trim();
  const lower = normalize(topic);
  if (names.some(name => name && normalize(name) && (" " + lower + " ").includes(" " + normalize(name) + " "))) return null;
  return topic;
}
