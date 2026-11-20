import { z } from "zod";
import type { NicheTurn, NicheTurnContext } from "./index";

export const contactReference = z.object({ messageId: z.uuid(), index: z.number().int().nonnegative() });
const savedContact = z.union([contactReference, z.literal("declined")]).nullable();
export const synthesisRange = z.object({
  start: z.number().int().positive(),
  length: z.number().int().positive().max(1000),
  contact: savedContact,
});
export const synthesisReference = synthesisRange.extend({ messageId: z.uuid() });
export type SynthesisReference = z.output<typeof synthesisReference>;
export type DialogueText = Readonly<{ id: string; role: "user" | "assistant"; content: string }>;

export type SynthesisWrite = Readonly<{
  offer: z.output<typeof synthesisRange> | null;
  accept: string | null;
  clear: boolean;
  partial: boolean;
  nicheReaction: "continue" | "accept" | "clear";
}>;

// Match phone shapes, not arbitrary runs of four digits or currency amounts.
export function projectContactText(text: string, phone: (value: string, index: number) => string, allowShort = false) {
  const matches = /(?:\+\d{1,3}[ \t.-]*)?(?:\(\d{2,3}\)[ \t]*|\d{2,3}[ \t.-]+)(?:\d{4,5}[ \t.-]?\d{4})|\d{4,5}-\d{4}|\+?\d{8,15}/gu;
  let index = 0;
  const mask = (value: string) => phone(value, index++);
  return text.replace(/\[contato_\d+\]/giu, "[referência do interlocutor]")
    .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/giu, "[email removido]")
    .replace(/\bhttps?:\/\/\S+|\bwww\.\S+/giu, "[url removida]")
    .replace(matches, (value, offset: number, source: string) => {
      const before = source.slice(0, offset);
      const after = source.slice(offset + value.length);
      if (/\d$/.test(before) || /^\d/.test(after) ||
        /(?:R\$|US\$|€|\$)\s*$/u.test(before) ||
        /^\s*(?:reais|dólares|unidades|peças|clientes|pessoas)\b/iu.test(after)) return value;
      return mask(value);
    }).replace(/\b(whats\s*app|telefone|celular)([\s:]+(?:é\s+|começa\s+com\s+)?)(\d(?:[ \t().-]*\d){2,6})(?![\d \t.-]*\d)/giu,
      (_whole, label: string, separator: string, value: string) => label + separator + mask(value))
    .replace(/^\s*(\d(?:[ \t().-]*\d){2,6})\s*$/u,
      (whole, value: string) => allowShort && !/^(?:19|20|21)\d{2}$/.test(value) ? mask(value) : whole);
}

export function resolveSynthesis(ref: SynthesisReference | null | undefined, messages: readonly DialogueText[]) {
  const shown = ref && messages.find(message => message.id === ref.messageId && message.role === "assistant");
  if (!ref || !shown) return null;
  const text = Array.from(shown.content).slice(ref.start - 1, ref.start - 1 + ref.length).join("");
  if (Array.from(text).length !== ref.length) return null;
  const saved = ref.contact;
  let phone: string | null = null;
  if (saved && saved !== "declined") {
    const message = messages.find(entry => entry.id === saved.messageId && entry.role === "user");
    if (!message) return null;
    const matches: string[] = [];
    projectContactText(message.content, (value, index) => {
      matches[index] = value;
      return "";
    }, true);
    phone = matches[saved.index] ?? null;
    if (phone === null) return null;
  }
  return { id: ref.messageId, text, phone, declined: saved === "declined" };
}

export function relevantNicheHistory(messages: readonly DialogueText[], currentId: string, text: string) {
  const previous = messages.filter(message => message.id !== currentId);
  const terms = new Set(text.toLowerCase().match(/[\p{L}\p{N}]{4,}/gu) ?? []);
  const recent = previous.slice(-12);
  const older = previous.slice(0, -12);
  const relevant = older.map((message, index) => ({ message, index, score:
    (message.content.toLowerCase().match(/[\p{L}\p{N}]{4,}/gu) ?? []).filter(term => terms.has(term)).length }))
    .sort((a, b) => b.score - a.score || b.index - a.index).slice(0, 12).map(item => item.message.id);
  const selected = new Set([...previous.slice(0, 4).map(entry => entry.id), ...relevant, ...recent.map(entry => entry.id)]);
  return previous.filter(message => selected.has(message.id)).map(({ id, role, content }) => ({ id, role, text: content }));
}

export function publicResearchContext(topic: string, context: NicheTurnContext, ...businessNames: (string | null | undefined)[]): NicheTurnContext | null {
  if (!/^[\p{L}\p{M}][\p{L}\p{M} ,?()-]{3,159}$/u.test(topic) ||
    /\b(?:rua|avenida|cep|whatsapp|telefone|endereço|e-mail|cpf|cnpj)\b/iu.test(topic)) return null;
  const names = [...businessNames, context.pendingSetup?.preferredName, context.pendingSetup?.nameProposal, context.pendingSetup?.acceptedName];
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
  for (const { text } of [...context.history, ...(context.message ? [context.message] : [])]) {
    names.push(...(text.match(/\p{Lu}[\p{Ll}\p{M}]+(?: +\p{Lu}[\p{Ll}\p{M}]+)+/gu) ?? []));
  }
  // Explicit name declarations are private even when their spelling has no capitals.
  const declaration = /\b(?:(?:empresa|neg[oó]cio|loja|marca)\s+se\s+chama|(?:minha\s+(?:empresa|loja|marca)|meu\s+neg[oó]cio)\s+[eé]|nome\s+d[ao]\s+(?:empresa|neg[oó]cio|loja|marca)\s+[eé]|me\s+chamo|meu\s+nome\s+[eé])\s+(.+)/iu;
  const clauseEnd = /[\r\n.,;!?]|\s+e\s+(?=(?:faz(?:emos)?|oferece(?:mos)?|vende(?:mos)?|atende(?:mos)?|atua(?:mos)?|trabalha(?:mos)?|me\s+chamo|meu\s+nome|minha\s+(?:empresa|loja|marca)|meu\s+neg[oó]cio)\b)/iu;
  const affiliation = /\b(?:[ao]\s+(?:empresa|neg[oó]cio|loja|marca)\s+(?!d[aeo]s?\s)(.+?)\s+(?:faz|oferece|vende|atende|atua|trabalha)\b|trabalho\s+n[ao]\s+(.+?)(?:\s+(?:com|como)\b|$))/iu;
  for (const text of [businessContext, context.summary ?? "", ...context.history.map(entry => entry.text), context.message?.text ?? ""]) {
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
  return { message: null, history: [], activeProposal: null, officialNiche: null,
    summary: null, businessContext: null, researchTopic: topic };
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
    text: [...new Set(values.filter(Boolean))].join("\n").slice(0, 6000) || null,
    whatsappKnown: Boolean(summary?.whatsapp ?? summary?.w ?? summary?.whatsappDeclined ?? summary?.d),
  };
}

export function mergeNicheMemory(raw: string | null, turn: NicheTurn, snapshot: ReturnType<typeof resolveSynthesis>) {
  if (!snapshot || turn.synthesisWrite.accept !== snapshot.id) return null;
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
    if (kind !== "declaration" || !replaces || !snapshot.text.includes(text)) continue;
    summary.contextualUnderstanding = summary.contextualUnderstanding?.replace(replaces, "").trim() || null;
    summary.confirmedUnderstanding = summary.confirmedUnderstanding?.replace(replaces, "").trim() || null;
    summary.suggestions = summary.suggestions.filter(entry => !entry.includes(replaces));
  }
  if (!summary.confirmedUnderstanding?.includes(snapshot.text)) {
    summary.confirmedUnderstanding = [summary.confirmedUnderstanding, snapshot.text].filter(Boolean).join("\n");
  }
  if (snapshot.phone || snapshot.declined) {
    summary.whatsapp = snapshot.phone;
    summary.whatsappDeclined = snapshot.declined;
  }
  const joined = JSON.stringify(summary);
  if ((summary.confirmedUnderstanding?.length ?? 0) > 4000 || joined.length > 5800) throw new Error("summary_capacity");
  return joined !== unchanged ? joined : null;
}
