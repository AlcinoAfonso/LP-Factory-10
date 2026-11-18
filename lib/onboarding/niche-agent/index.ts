import { z } from "zod";
import type { OpenAiResponsesInput, OpenAiResponsesParser } from "../../openai-responses/openAiResponsesAdapter";
import { OFFICIAL_NICHE_MAX_LENGTH, validNicheDescription } from "../niche-resolution/official-niche-policy";
import { redactPotentialContactDetails } from "../text-redaction";
import { NICHE_AGENT_INSTRUCTIONS, NICHE_AGENT_PROMPT_VERSION } from "./prompt";

const CONTRACT_VERSION = 1;
const SUMMARY_LIMIT = 6000;
const dialogueText = z.string().trim().min(1).max(4000);
const reference = z.string().trim().min(1).max(160);
const nicheDescription = z.string().min(1).max(OFFICIAL_NICHE_MAX_LENGTH).refine(validNicheDescription);

const contextSchema = z.strictObject({
  message: z.strictObject({ text: dialogueText, replyToProposalId: reference.nullable() }).nullable(),
  history: z.array(z.strictObject({
    role: z.enum(["user", "assistant"]),
    text: dialogueText,
  })).max(8).readonly(),
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
});

// The caller supplies the submitted message and server-observed proposal association.
// History precedes that message and is used only as context.
export type NicheTurnContext = z.input<typeof contextSchema>;

const turnSchema = z.strictObject({
  reply: dialogueText,
  proposal: nicheDescription.nullable(),
  reaction: z.enum(["continue", "accept", "reject", "correct"]),
  memory: z.array(z.strictObject({
    kind: z.enum(["declaration", "hypothesis", "external"]),
    text: z.string().trim().min(1).max(1000),
    replaces: z.string().min(1).max(SUMMARY_LIMIT).nullable(),
    sourceId: reference.nullable(),
  })).max(6),
});

type ModelTurn = z.output<typeof turnSchema>;
export type NicheTurn = Readonly<ModelTurn & {
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

const responsesEnvelope = z.object({
  status: z.string(),
  error: z.unknown().optional(),
  output: z.array(z.object({
    type: z.string(),
    role: z.string().optional(),
    content: z.array(z.object({ type: z.string(), text: z.string().optional() })).optional(),
  })).optional(),
});

export function prepareNicheTurn(raw: NicheTurnContext):
  | Readonly<{ ok: true; value: PreparedNicheTurn }>
  | Readonly<{ ok: false; kind: "invalid_context" }> {
  const validated = contextSchema.safeParse(raw);
  if (!validated.success) return { ok: false, kind: "invalid_context" };

  const { message, history, summary, businessContext, officialNiche, activeProposal, externalSources = [] } = validated.data;
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
          message: message ? redactPotentialContactDetails(message.text) : null,
          history: history.map(({ role, text }) => ({ role, text: redactPotentialContactDetails(text) })),
          summary: summary === null ? null : redactPotentialContactDetails(summary),
          businessContext: businessContext === null ? null : redactPotentialContactDetails(businessContext),
          officialNiche: officialNiche?.description ?? null,
          activeProposal: currentProposal ? {
            description: currentProposal.description, linkedToMessage: confirmationTarget !== null,
          } : null,
          externalSources: externalSources.map(({ id, excerpt, checkedOn }) => ({
            id, excerpt: redactPotentialContactDetails(excerpt), checkedOn,
          })),
        }),
        store: false,
        background: false,
        text: { format: textFormat },
      },
      parseResponse: parseTurn(summary ?? "", message !== null, currentProposal?.description ?? null, confirmationTarget, externalSources),
    },
  };
}

function parseTurn(
  priorSummary: string,
  hasMessage: boolean,
  currentDescription: string | null,
  confirmationTarget: NicheTurn["confirmation"],
  sources: readonly { id: string }[],
): OpenAiResponsesParser<NicheTurn> {
  const invalid = { ok: false, kind: "invalid_response", reason: "niche_turn_invalid" } as const;
  return (payload) => {
    const envelope = responsesEnvelope.safeParse(payload);
    if (!envelope.success) return invalid;
    const { status, error, output } = envelope.data;
    if (error || status === "failed" || status === "incomplete" || status === "cancelled") {
      return { ok: false, kind: "provider_error", reason: "niche_turn_unavailable" };
    }
    if (status !== "completed" || !output || output.some(({ type }) => type !== "message" && type !== "reasoning")) return invalid;
    const messages = output.filter(({ type }) => type === "message");
    const content = messages[0]?.content ?? [];
    if (messages.length !== 1 || messages[0].role !== "assistant" || content.length === 0) return invalid;
    if (content.some(({ type }) => type === "refusal")) {
      return { ok: false, kind: "refusal", reason: "niche_turn_refused" };
    }
    if (content.some(({ type, text }) => type !== "output_text" || typeof text !== "string")) return invalid;

    let raw: unknown;
    try { raw = JSON.parse(content.map(({ text }) => text).join("")); } catch { return invalid; }
    const turn = turnSchema.safeParse(raw);
    if (!turn.success) return invalid;
    const { reply, proposal, reaction, memory } = turn.data;
    const confirmation = reaction === "accept" ? confirmationTarget : null;
    if (reaction === "accept" && (!confirmation || proposal !== null || memory.length > 0)) return invalid;
    if (!hasMessage && (reaction !== "continue" || memory.length > 0)) return invalid;
    if (proposal && (!reply.includes(proposal) || (reaction === "reject" && proposal === currentDescription))) return invalid;
    if (!validMemory(memory, priorSummary, sources)) return invalid;
    return { ok: true, value: { reply, proposal, reaction, memory, confirmation } };
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
