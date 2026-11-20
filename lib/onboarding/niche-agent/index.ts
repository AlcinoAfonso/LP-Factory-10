import { z } from "zod";
import type { OpenAiResponsesInput, OpenAiResponsesParser } from "../../openai-responses/openAiResponsesAdapter";
import { OFFICIAL_NICHE_MAX_LENGTH, validNicheDescription } from "../niche-resolution/official-niche-policy";
import { webSearchMetadata } from "../../openai-responses/web-search-metadata";
import { NICHE_AGENT_INSTRUCTIONS, NICHE_AGENT_PROMPT_VERSION } from "./prompt";
import { contactReference, projectContactText, type SynthesisWrite } from "./dialogue";

const CONTRACT_VERSION = 3;
const SUMMARY_LIMIT = 6000;
const dialogueText = z.string().trim().min(1).max(4000);
const reference = z.string().trim().min(1).max(160);
const nicheDescription = z.string().min(1).max(OFFICIAL_NICHE_MAX_LENGTH).refine(validNicheDescription);
const publicName = z.string().trim().min(1).max(120).refine(value => !/[\x00-\x1f\x7f<>]/u.test(value));
const pendingSetupContext = z.strictObject({
  nameProposal: publicName.nullable(),
  acceptedName: publicName.nullable(),
  preferredName: publicName.nullable(),
  preferredNameDeclined: z.boolean(),
  whatsappKnown: z.boolean(),
  operationalProposal: dialogueText.nullable(),
  operationalAccepted: z.boolean(),
});

const contextSchema = z.strictObject({
  message: z.strictObject({ text: dialogueText, replyToProposalId: reference.nullable(), id: z.uuid().optional() }).nullable(),
  history: z.array(z.strictObject({
    role: z.enum(["user", "assistant"]),
    text: dialogueText,
    id: z.uuid().optional(),
  })).max(28).readonly(),
  activeSynthesis: z.strictObject({ id: z.uuid(), text: z.string().max(1000), accepted: z.boolean(),
    partialReply: dialogueText.nullish() }).nullish(),
  nicheAccepted: z.boolean().optional(),
  researchTopic: z.string().max(160).optional(),
  summary: z.string().max(SUMMARY_LIMIT).nullable(),
  businessContext: dialogueText.nullable(),
  officialNiche: z.strictObject({ description: nicheDescription, revision: reference }).nullable(),
  activeProposal: z.strictObject({
    id: reference,
    description: nicheDescription,
    expectedOfficialRevision: reference.nullable(),
  }).nullable(),
  externalSources: z.array(z.strictObject({
    id: reference,
    excerpt: dialogueText,
    checkedOn: z.iso.date(),
  })).max(3).readonly().optional(),
  pendingSetup: pendingSetupContext.optional(),
});

// The caller supplies the submitted message and server-observed proposal association.
// History precedes that message and is used only as context.
export type NicheTurnContext = z.input<typeof contextSchema>;

const turnSchema = z.strictObject({
  reply: dialogueText,
  proposal: nicheDescription.nullable(),
  reaction: z.enum(["continue", "accept", "reject", "correct"]),
  synthesis: z.strictObject({
    proposal: z.string().trim().min(1).max(1000).nullable(),
    reaction: z.enum(["continue", "accept", "partial", "clear"]),
  }),
  searchTopic: z.string().trim().min(1).max(160).nullable(),
  memory: z.array(z.strictObject({
    kind: z.enum(["declaration", "hypothesis", "external"]),
    text: z.string().trim().min(1).max(1000),
    replaces: z.string().min(1).max(SUMMARY_LIMIT).nullable(),
    sourceId: reference.nullable(),
  })).max(6),
});
const journeyProposal = (text: typeof publicName | typeof dialogueText) => z.strictObject({
  proposal: text.nullable(),
  reaction: z.enum(["continue", "accept", "clear"]),
});
const pendingTurnSchema = turnSchema.extend({
  pendingSetup: z.strictObject({
    publicName: journeyProposal(publicName),
    operational: journeyProposal(dialogueText),
    preferredName: z.strictObject({ value: publicName.nullable(), declined: z.boolean() }),
    whatsapp: z.strictObject({ reference: reference.nullable(), declined: z.boolean() }),
  }),
});
type PendingTurn = z.output<typeof pendingTurnSchema>["pendingSetup"];

type ModelTurn = z.output<typeof turnSchema>;
export type NicheTurn = Readonly<ModelTurn & {
  synthesisWrite: SynthesisWrite;
  pendingSetup?: Omit<PendingTurn, "whatsapp"> & {
    whatsapp: { value: string | null; declined: boolean };
  };
  // Evidence for the caller to revalidate against the persisted proposal, actor and account.
  confirmation: Readonly<{
    proposalId: string;
    description: string;
    expectedOfficialRevision: string | null;
  }> | null;
}>;

type PreparedNicheTurn = Pick<
  OpenAiResponsesInput<NicheTurn>, "request" | "parseResponse" | "promptVersion" | "contractVersion"
>;

const textFormat = {
  type: "json_schema",
  name: "niche_turn",
  strict: true,
  schema: z.toJSONSchema(turnSchema, { target: "draft-7" }),
} as const;
const pendingTextFormat = { ...textFormat, schema: z.toJSONSchema(pendingTurnSchema, { target: "draft-7" }) };

type Contact = { value: string; source: z.output<typeof contactReference> | null };
const redact = (text: string) => projectContactText(text, () => "[telefone removido]");

const responsesEnvelope = z.object({
  status: z.string(),
  error: z.unknown().optional(),
  output: z.array(z.object({
    type: z.string(),
    role: z.string().optional(),
    content: z.array(z.object({
      type: z.string(), text: z.string().optional(),
      annotations: z.array(z.object({ type: z.string(), url: z.string().optional() })).optional(),
    })).optional(),
  })).optional(),
});

export function prepareNicheTurn(raw: NicheTurnContext, searchLimit = 0):
  | Readonly<{ ok: true; value: PreparedNicheTurn }>
  | Readonly<{ ok: false; kind: "invalid_context" }> {
  const validated = contextSchema.safeParse(raw);
  if (!validated.success) return { ok: false, kind: "invalid_context" };

  const { message, history, activeSynthesis, nicheAccepted, researchTopic, summary, businessContext, officialNiche,
    activeProposal, externalSources = [], pendingSetup } = validated.data;
  const contacts = new Map<string, Contact>();
  function project(text: string, messageId?: string) {
    return projectContactText(text, (value, index) => {
      const id = `contato_${contacts.size + 1}`;
      contacts.set(id, { value, source: messageId ? { messageId, index } : null });
      return `[${id}]`;
    }, true);
  }
  const current = message ? pendingSetup ? project(message.text, message.id) : redact(message.text) : null;
  const currentProposal = activeProposal?.expectedOfficialRevision === (officialNiche?.revision ?? null)
    ? activeProposal : null;
  const confirmationTarget = currentProposal && message?.replyToProposalId === currentProposal.id
    ? {
        proposalId: currentProposal.id,
        description: currentProposal.description,
        expectedOfficialRevision: currentProposal.expectedOfficialRevision,
      }
    : null;

  return {
    ok: true,
    value: {
      promptVersion: NICHE_AGENT_PROMPT_VERSION,
      contractVersion: CONTRACT_VERSION,
      request: {
        instructions: NICHE_AGENT_INSTRUCTIONS,
        input: JSON.stringify({
          message: current,
          history: history.map(({ role, text, id }) => ({ role, text: pendingSetup && role === "user"
            ? project(text, id) : redact(text) })),
          summary: summary === null ? null : redact(summary),
          businessContext: businessContext === null ? null : redact(businessContext),
          activeSynthesis: activeSynthesis ? { text: redact(activeSynthesis.text), accepted: activeSynthesis.accepted,
            partialReply: activeSynthesis.partialReply ? redact(activeSynthesis.partialReply) : null } : null,
          nicheAccepted: Boolean(currentProposal && nicheAccepted),
          ...(researchTopic ? { researchTopic } : {}),
          officialNiche: officialNiche?.description ?? null,
          activeProposal: currentProposal ? {
            description: currentProposal.description, linkedToMessage: confirmationTarget !== null,
          } : null,
          externalSources: externalSources.map(({ id, excerpt, checkedOn }) => ({
            id, excerpt: redact(excerpt), checkedOn,
          })),
          ...(pendingSetup ? { pendingSetup } : {}),
        }),
        store: false,
        background: false,
        text: { format: pendingSetup ? pendingTextFormat : textFormat },
      },
      parseResponse: parseTurn(summary ?? "", message !== null, currentProposal?.description ?? null,
        confirmationTarget, externalSources, pendingSetup, contacts, activeSynthesis, searchLimit),
    },
  };
}

function parseTurn(
  priorSummary: string,
  hasMessage: boolean,
  currentDescription: string | null,
  confirmationTarget: NicheTurn["confirmation"],
  sources: readonly { id: string }[],
  pending: z.output<typeof pendingSetupContext> | undefined,
  contacts: ReadonlyMap<string, Contact>,
  activeSynthesis: NonNullable<z.output<typeof contextSchema>["activeSynthesis"]> | null | undefined,
  searchLimit = 0,
): OpenAiResponsesParser<NicheTurn> {
  const invalid = (reason: string) => ({ ok: false, kind: "invalid_response", reason } as const);
  return (payload) => {
    const envelope = responsesEnvelope.safeParse(payload);
    if (!envelope.success) return invalid("niche_turn_envelope");
    const { status, error, output } = envelope.data;
    if (error || status === "failed" || status === "incomplete" || status === "cancelled") {
      return { ok: false, kind: "provider_error", reason: "niche_turn_unavailable" };
    }
    const web = webSearchMetadata(payload);
    if (!web || web.calls > searchLimit || (searchLimit > 0 && web.calls === 0) || status !== "completed" || !output ||
      output.some(({ type }) => !["message", "reasoning", "web_search_call"].includes(type))) return invalid("niche_turn_output");
    const messages = output.filter(({ type }) => type === "message");
    const content = messages[0]?.content ?? [];
    if (messages.length !== 1) return invalid("niche_turn_message_count");
    if (messages[0].role !== "assistant" || content.length === 0) return invalid("niche_turn_message_shape");
    if (content.some(({ type }) => type === "refusal")) {
      return { ok: false, kind: "refusal", reason: "niche_turn_refused" };
    }
    if (content.some(({ type, text }) => type !== "output_text" || typeof text !== "string")) return invalid("niche_turn_content");

    let raw: unknown;
    try { raw = JSON.parse(content.map(({ text }) => text).join("")); } catch { return invalid("niche_turn_json"); }
    const pendingResult = pending ? pendingTurnSchema.safeParse(raw) : null;
    const turn = pendingResult ?? turnSchema.safeParse(raw);
    if (!turn.success) {
      const issue = turn.error.issues[0];
      const field = issue?.path[0];
      const shape = pending ? pendingTurnSchema.shape : turnSchema.shape;
      return invalid(typeof field === "string" && Object.hasOwn(shape, field)
        ? `niche_turn_schema_${field}_${issue.code}` : "niche_turn_schema");
    }
    const { reply, proposal, reaction, memory, synthesis, searchTopic } = turn.data;
    const confirmation = reaction === "accept" ? confirmationTarget : null;
    if (reaction === "accept" && (!confirmation || proposal !== null)) return invalid("niche_turn_acceptance");
    if (!hasMessage && (reaction !== "continue" || memory.length > 0)) return invalid("niche_turn_without_message");
    const replyWithProposal = proposal && !reply.includes(proposal)
      ? reply + "\n\nProposta de nicho: " + proposal : reply;
    if (proposal && reaction === "reject" && proposal === currentDescription) return invalid("niche_turn_rejected_proposal");
    if ((["accept", "partial"].includes(synthesis.reaction) && (!hasMessage || !activeSynthesis || activeSynthesis.accepted)) ||
      (synthesis.reaction === "accept" && synthesis.proposal)) return invalid("niche_turn_synthesis_acceptance");
    const synthesisText = synthesis.proposal;
    if (synthesisText && reply.split(synthesisText).length > 2) return invalid("niche_turn_synthesis_repeated_in_reply");
    const result = pendingResult?.success ? pendingResult.data.pendingSetup : null;
    const suggestedContact = result?.whatsapp.reference ? contacts.get(result.whatsapp.reference) : null;
    const contact = result?.whatsapp.declined ? null : suggestedContact ?? null;
    const whatsappDeclined = Boolean(result?.whatsapp.declined && suggestedContact === null);
    if (result) {
      if (!pending || !hasMessage) return invalid("niche_turn_pending_setup_without_message");
      if (result.preferredName.value && result.preferredName.declined) return invalid("niche_turn_preferred_name_state");
      if ([result.publicName, result.operational].some(item => item.proposal &&
        (!reply.includes(item.proposal) || item.reaction === "accept"))) return invalid("niche_turn_pending_setup_proposal");
      if (result.publicName.reaction === "accept" && !pending.nameProposal) return invalid("niche_turn_public_name_acceptance");
      if ((result.operational.reaction === "accept" && (!pending.operationalProposal || proposal || confirmation)) ||
        (result.operational.proposal && (proposal || confirmation))) return invalid("niche_turn_operational_state");
    }
    const containsContact = (text: string) => /\[contato_\d+\]/iu.test(text) || redact(text) !== text;
    if ([reply, proposal ?? "", result?.publicName.proposal ?? "", result?.preferredName.value ?? "",
      result?.operational.proposal ?? ""].some(containsContact)) return invalid("niche_turn_contact_in_text");
    const hasAcceptance = Boolean(confirmation || synthesis.reaction === "accept" ||
      result?.publicName.reaction === "accept" || result?.operational.reaction === "accept");
    if (web.calls > 0 && (hasAcceptance || searchTopic || proposal || synthesis.proposal)) return invalid("niche_turn_research_effect");
    let start = synthesisText ? replyWithProposal.indexOf(synthesisText) : -1;
    let replyWithSynthesis = replyWithProposal;
    if (synthesisText && start === -1) {
      const prefix = replyWithProposal + "\n\n";
      start = prefix.length;
      replyWithSynthesis = prefix + synthesisText;
      if ([synthesisText, replyWithSynthesis].some(containsContact)) return invalid("niche_turn_contact_in_text");
    }
    const contactNote = contact?.source ? " WhatsApp informado (final " + contact.value.replace(/\D/g, "").slice(-2) + ")."
      : whatsappDeclined ? " WhatsApp não informado por opção." : "";
    const end = start + (synthesisText?.length ?? 0);
    const shown = start >= 0 ? replyWithSynthesis.slice(0, end) + contactNote + replyWithSynthesis.slice(end) : replyWithProposal;
    const cited = new Set(content.flatMap(item => item.annotations ?? [])
      .filter(item => item.type === "url_citation").map(item => item.url));
    const sourceUrls = web.sources.map(source => source.url);
    const urls = cited.size ? sourceUrls.filter(url => cited.has(url)) : sourceUrls.slice(0, 3);
    if (web.calls > 0 && urls.length === 0) return invalid("niche_turn_research_sources");
    const displayedReply = web.calls > 0
      ? shown + "\n\nFontes consultadas em " + new Date().toISOString().slice(0, 10) + ":\n" + urls.join("\n")
      : shown;
    if (displayedReply.length > 4000) return invalid("niche_turn_reply_length");
    const safeMemory = (validMemory(memory, priorSummary, sources) ? memory : [])
      .filter(entry => !containsContact(entry.text));
    return { ok: true, value: { reply: displayedReply, proposal, reaction, confirmation, synthesis,
      searchTopic: hasAcceptance ? null : searchTopic,
      synthesisWrite: {
        offer: synthesisText ? { start: Array.from(replyWithSynthesis.slice(0, start)).length + 1,
          length: Array.from(synthesisText).length, contact: contact?.source ?? (whatsappDeclined ? "declined" : null) } : null,
        accept: synthesis.reaction === "accept" ? activeSynthesis?.id ?? null : null,
        clear: synthesis.reaction === "clear",
        partial: synthesis.reaction === "partial" && !synthesis.proposal,
        nicheReaction: confirmation ? "accept" : reaction === "continue" ? "continue" : "clear",
      },
      memory: safeMemory,
      ...(result ? { pendingSetup: { ...result, whatsapp: { value: contact?.value ?? null, declined: whatsappDeclined } } } : {}) } };
  };
}

function validMemory(memory: ModelTurn["memory"], summary: string, sources: readonly { id: string }[]): boolean {
  const texts = new Set<string>();
  const replacements: { start: number; end: number }[] = [];
  for (const { kind, text, replaces, sourceId } of memory) {
    if (texts.has(text) || summary.includes(text)) return false;
    texts.add(text);
    if (kind === "external" ? sources.filter(({ id }) => id === sourceId).length !== 1 : sourceId !== null) return false;
    if (replaces === null) continue;

    const start = summary.indexOf(replaces);
    const end = start + replaces.length;
    if (kind !== "declaration" || start < 0 || start !== summary.lastIndexOf(replaces) ||
      replacements.some((position) => start < position.end && position.start < end)) return false;
    replacements.push({ start, end });
  }
  return true;
}
