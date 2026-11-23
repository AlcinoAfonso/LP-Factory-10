import { z } from "zod";
import { validNicheDescription } from "../niche-resolution/official-niche-policy";
import type { NicheContext } from "./runtime";

export const synthesisRange = z.object({
  start: z.number().int().positive(),
  length: z.number().int().positive().max(1000),
});
export const synthesisReference = synthesisRange.extend({ messageId: z.uuid() });
export type SynthesisReference = z.output<typeof synthesisReference>;
export type DialogueText = Readonly<{ id: string; role: "user" | "assistant"; content: string }>;
export type NicheOffer = Readonly<{ summary: string; niche: string | null; publicName: string | null }>;
export type DisplayedOffer = NicheOffer & { id: string };
export type SynthesisWrite = Readonly<{
  offer: (z.output<typeof synthesisRange> & { contact: null }) | null;
  accept: string | null;
  clear: boolean;
  nicheReaction: "continue" | "accept" | "clear";
}>;

export const CONTACT_RECEIPT = "Recebi o WhatsApp. Podemos continuar a conversa.";
export const SYNTHESIS_QUESTION = "\n\nEssa síntese está correta?";
const offerDetails = ({ niche, publicName }: NicheOffer) =>
  [publicName && "Nome público: " + publicName, niche && "Nicho proposto: " + niche].filter(Boolean);

export function presentOffer(offer: NicheOffer) {
  const text = [offer.summary, ...offerDetails(offer)].join("\n");
  const length = Array.from(text).length;
  return length <= 1000 ? { reply: text + SYNTHESIS_QUESTION, range: { start: 1, length, contact: null } } : null;
}

export function displayedOffer(ref: SynthesisReference | null | undefined, messages: readonly DialogueText[],
  fields: Pick<NicheOffer, "niche" | "publicName">): DisplayedOffer | null {
  const shown = ref && messages.find(message => message.id === ref.messageId && message.role === "assistant");
  if (!shown) return null;
  const points = Array.from(shown.content);
  const end = ref.start - 1 + ref.length;
  const text = points.slice(ref.start - 1, end).join("");
  const offer = { ...fields, summary: text, id: ref.messageId };
  const suffix = offerDetails(offer).map(detail => "\n" + detail).join("");
  if (end > points.length || points.slice(end).join("") !== SYNTHESIS_QUESTION || !text.endsWith(suffix)) return null;
  const summary = text.slice(0, text.length - suffix.length);
  return summary ? { ...offer, summary } : null;
}

export function nicheHistory(messages: readonly DialogueText[], currentId: string) {
  const previous = messages.filter(({ id }) => id !== currentId);
  return previous.length <= 24 ? previous : [...previous.slice(0, 4), ...previous.slice(-20)];
}

export function withoutWhatsAppField(text: string) {
  return text.replace(/(?:^|\n)WhatsApp para contato: \(\d{2}\) 9\d{4}-\d{4}$/u, "").trim();
}

export function pendingSetupWhatsApp(messages: readonly DialogueText[]) {
  return messages.some(({ role, content }) => role === "user" && withoutWhatsAppField(content) !== content.trim())
    ? "correction" as const : undefined;
}

export function redactNicheText(text: string) {
  return text.replace(/\[contato_\d+\]/giu, "[contato removido]")
    .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/giu, "[email removido]")
    .replace(/\bhttps?:\/\/\S+|\bwww\.\S+/giu, "[url removida]")
    .replace(/\b(whats\s*app|zap|telefone|celular|cpf|cnpj)([\s:]+(?:é\s+)?)(\+?\d[\d ().-]*\d)/giu,
      "$1$2[dado removido]")
    .replace(/(?:\+\d{1,3}[ \t.-]*)?(?:\(\d{2,3}\)[ \t]*|\d{2,3}[ \t.-]+)\d{4,5}[ \t.-]?\d{4}|\d{4,5}-\d{4}|\+?\d{8,15}/gu,
      (value, offset: number, source: string) => /(?:R\$|US\$|€|\$)\s*$/u.test(source.slice(0, offset))
        ? value : "[telefone removido]");
}

const summaryShape = z.looseObject({
  confirmedUnderstanding: z.string().nullish(),
  contextualUnderstanding: z.string().nullish(),
  suggestions: z.array(z.string()).optional(),
  s: z.array(z.string()).optional(),
});

function readSummary(raw: string | null) {
  try {
    const summary = summaryShape.safeParse(JSON.parse(raw ?? "{}"));
    return summary.success ? summary.data : null;
  } catch { return null; }
}

export function nicheSummaryContext(raw: string | null) {
  const summary = readSummary(raw);
  return summary ? JSON.stringify({
    confirmed: summary.confirmedUnderstanding,
    declarations: summary.contextualUnderstanding,
    suggestions: summary.suggestions ?? summary.s,
  }) : null;
}

export function readNicheBusinessNameCandidate(raw: string | null) {
  const name = readSummary(raw)?.businessNameCandidate;
  return validNicheDescription(name) ? name : null;
}

// Undefined means the confirmed synthesis cannot be saved safely.
export function mergeNicheMemory(raw: string | null, confirmed: DisplayedOffer,
  corrections: readonly { previous: string; replacement: string }[]) {
  const summary = readSummary(raw);
  if (!summary) return undefined;
  const before = JSON.stringify(summary);
  const text = confirmed.publicName
    ? confirmed.summary + "\nNome público: " + confirmed.publicName : confirmed.summary;
  for (const { previous, replacement } of corrections) {
    if (previous === replacement || !text.includes(replacement) || text.replace(replacement, "").includes(previous)) continue;
    for (const key of ["confirmedUnderstanding", "contextualUnderstanding"] as const) {
      const value = summary[key];
      const at = value?.indexOf(previous) ?? -1;
      if (value && at >= 0 && at === value.lastIndexOf(previous) &&
        !/[\p{L}\p{N}]/u.test((value[at - 1] ?? "") + (value[at + previous.length] ?? ""))) {
        summary[key] = value.replace(previous, "").split("\n").filter(line => line.trim()).join("\n").trim() || null;
      }
    }
  }
  const lines = summary.confirmedUnderstanding?.split("\n") ?? [];
  const additions = text.split("\n").filter(line => !lines.includes(line));
  if (additions.length) summary.confirmedUnderstanding = [...lines, ...additions].join("\n");
  if (JSON.stringify(summary) === before) return null;
  if (typeof summary.c === "string") {
    summary.classification ??= summary.c;
    delete summary.c;
  }
  const after = JSON.stringify(summary);
  return after.length <= 5700 ? after : undefined;
}

export function publicResearchTopic(topic: string, context: NicheContext, privateNames: readonly string[] = []) {
  if (!/^[\p{L}\p{M}][\p{L}\p{M} ,?()-]{3,159}$/u.test(topic)) return null;
  const names = [...privateNames, context.pendingSetup?.preferredName || null, context.pendingSetup?.publicName, context.displayed?.publicName];
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
  const declaredPrivate = /\b(?:meu|minha|nosso|nossa)\s+(?:(?:endere[çc]o(?:\s+(?:particular|residencial|comercial))?|nome\s+(?:pessoal|completo))\s*(?::|é)|(?:consultório|clínica|loja|sede|casa)\s+fica\s+(?:na|no|em)(?=\s+(?:rua|avenida|travessa|alameda)\s))\s*([^.!?;,\r\n]+)/giu;
  for (const { role, content } of [...context.history, { role: "user", content: context.message }]) {
    for (const line of content.split("\n")) {
      if (line.startsWith("Nome público: ")) names.push(line.slice("Nome público: ".length));
    }
    if (role !== "user") continue;
    for (const [, value] of content.matchAll(declaredPrivate)) {
      names.push(value);
      // A confirmed private address remains private when the topic omits its number or locality.
      const [street] = value.trim().split(/\s+(?=\d|n[º°.]|(?:em|no bairro|na cidade|bairro|onde|perto)\b)/iu);
      if (/^(?:rua|avenida|travessa|alameda)\s+(?:(?:d[aeo]s?)\s+)?\p{L}{2,}/iu.test(street) && street !== value.trim()) {
        names.push(street);
      }
    }
  }
  const normalize = (text: string) => text.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase()
    .replace(/[^\p{L}]+/gu, " ").trim();
  const lower = normalize(topic);
  if (names.some(name => name && normalize(name) && (" " + lower + " ").includes(" " + normalize(name) + " "))) return null;
  return topic;
}
