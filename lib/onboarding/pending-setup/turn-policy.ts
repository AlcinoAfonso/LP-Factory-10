import type {
  AiNicheResolutionOutput,
  DeterministicMatchDecision,
  TaxonMatchCandidate,
} from "../niche-resolution/contracts";

export type PendingSetupAiTurnDecision =
  | Readonly<{
      kind: "confirm_official";
      candidate: TaxonMatchCandidate;
      assistantContent: string;
    }>
  | Readonly<{
      kind: "ask_clarifying_question";
      assistantContent: string;
    }>
  | Readonly<{
      kind: "unresolved_fallback";
      assistantContent: string;
    }>;

export const PENDING_SETUP_MAX_OPENAI_CALLS = 3;
export const PENDING_SETUP_OPENAI_RETRY_MESSAGE =
  "Não consegui validar esse entendimento agora. Você pode tentar novamente ou explicar de outra forma.";
export const PENDING_SETUP_TERMINAL_FALLBACK_MESSAGE =
  "Ainda não consegui identificar seu nicho com segurança. Vou preservar o que você me contou para seguirmos sem associar uma categoria incorreta.";

export function buildAliasConfirmationOutput(
  candidate: TaxonMatchCandidate,
): AiNicheResolutionOutput {
  return {
    uxMode: "confirm_single",
    message: `Seu negócio se encaixa em ${candidate.name}?`,
    options: [{
      taxonId: candidate.taxonId,
      name: candidate.name,
      slug: candidate.slug,
      confidence: "high",
      reason: "official_alias_confirmation",
      isOfficial: true,
    }],
    needsAdminReview: false,
    needsUserConfirmation: true,
    shouldCreateOfficialLink: false,
    suggestedNewTaxonLabel: null,
    reason: "deterministic_alias_confirmation_required",
  };
}

export function decidePendingSetupAiTurn(input: {
  output: AiNicheResolutionOutput;
  allowedCandidates: readonly TaxonMatchCandidate[];
}): PendingSetupAiTurnDecision {
  const allowedById = new Map(
    input.allowedCandidates.map((candidate) => [candidate.taxonId, candidate]),
  );
  const official = input.output.options
    .filter((option) => option.isOfficial && option.taxonId)
    .map((option) => allowedById.get(option.taxonId ?? "") ?? null)
    .filter((candidate): candidate is TaxonMatchCandidate => Boolean(candidate));

  if (official.length === 1 && input.output.uxMode === "confirm_single") {
    return {
      kind: "confirm_official",
      candidate: official[0],
      assistantContent: `Pelo que entendi, seu negócio se encaixa em ${official[0].name}. É isso mesmo?`,
    };
  }

  const optionNames = Array.from(new Set([
    ...official.map((candidate) => candidate.name),
    ...input.output.options
      .filter((option) => !option.isOfficial)
      .map((option) => option.name.trim())
      .filter(Boolean),
  ])).slice(0, 3);

  if (optionNames.length > 0) {
    return {
      kind: "ask_clarifying_question",
      assistantContent: `Para eu entender melhor, qual destas opções mais se aproxima do seu negócio: ${formatOptions(optionNames)}?`,
    };
  }

  return {
    kind: "unresolved_fallback",
    assistantContent: "Entendi o contexto. Vou preservar essa descrição para personalizar os próximos passos sem associar um nicho oficial incorreto.",
  };
}

export function hasReachedPendingSetupOpenAiCallLimit(
  openAiCallCount: number | null,
): boolean {
  return normalizeOpenAiCallCount(openAiCallCount) >= PENDING_SETUP_MAX_OPENAI_CALLS;
}

export function isPendingSetupTerminalFallbackMessage(
  content: string | null,
): boolean {
  return normalizeAssistantContent(content)
    === PENDING_SETUP_TERMINAL_FALLBACK_MESSAGE;
}

export function hasPendingSetupTerminalFallback(input: {
  confirmationKind: "official" | "operational_fallback" | null;
  assistantContents: readonly string[];
}): boolean {
  return input.confirmationKind === "operational_fallback"
    && input.assistantContents.some(isPendingSetupTerminalFallbackMessage);
}

export function shouldUseTerminalFallbackAfterRejectedAiConfirmation(input: {
  openAiCallCount: number | null;
  confirmationKind: "official" | "operational_fallback" | null;
  intent: string;
}): boolean {
  return input.intent === "clarify"
    && input.confirmationKind === "official"
    && hasReachedPendingSetupOpenAiCallLimit(input.openAiCallCount);
}

export function shouldFallbackFromRepeatedClarification(input: {
  previousAssistantContents: readonly string[];
  nextAssistantContent: string;
}): boolean {
  const previousClarifications = input.previousAssistantContents
    .map(parseClarificationOptions)
    .filter((options): options is readonly string[] => options !== null);
  const previousOptions = previousClarifications.at(-1) ?? null;
  const nextOptions = parseClarificationOptions(input.nextAssistantContent);
  return previousOptions !== null
    && nextOptions !== null
    && previousOptions.length === nextOptions.length
    && previousOptions.every((option, index) => option === nextOptions[index]);
}

export function shouldUseAutomaticOfficialPath(
  decision: DeterministicMatchDecision,
): decision is DeterministicMatchDecision & { selectedCandidate: TaxonMatchCandidate } {
  return Boolean(
    decision.confidence === "high" &&
    decision.shouldUseDeterministicMatch &&
    !decision.needsAdminReview &&
    decision.selectedCandidate?.taxonId,
  );
}

export function appendBusinessContext(
  existing: string | null,
  currentAnswer: string,
  maxLength = 4000,
): string {
  const normalizedExisting = String(existing ?? "").replace(/\s+/g, " ").trim();
  const normalizedAnswer = currentAnswer.replace(/\s+/g, " ").trim();
  const joined = [normalizedExisting, normalizedAnswer].filter(Boolean).join(" | ");
  return joined.slice(-maxLength);
}

export function selectOperationalFallbackLabel(
  messages: readonly Readonly<{ role: "user" | "assistant"; content: string }>[],
  accumulatedBusinessContext: string,
): string {
  const firstBusinessDescription = messages.find((message) => message.role === "user")?.content;
  return String(firstBusinessDescription ?? accumulatedBusinessContext)
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 4000);
}

function formatOptions(options: readonly string[]): string {
  if (options.length <= 1) return options[0] ?? "nenhuma das anteriores";
  if (options.length === 2) return `${options[0]} ou ${options[1]}`;
  return `${options.slice(0, -1).join(", ")} ou ${options.at(-1)}`;
}

function parseClarificationOptions(content: string | null): readonly string[] | null {
  const prefix = "Para eu entender melhor, qual destas opções mais se aproxima do seu negócio: ";
  const normalized = normalizeAssistantContent(content);
  if (!normalized.startsWith(prefix) || !normalized.endsWith("?")) return null;
  const options = normalized
    .slice(prefix.length, -1)
    .split(/,\s+|\s+ou\s+/)
    .map((option) => option.trim().toLocaleLowerCase("pt-BR"))
    .filter(Boolean)
    .sort();
  return options.length > 0 ? options : null;
}

function normalizeAssistantContent(content: string | null): string {
  return String(content ?? "").replace(/\s+/g, " ").trim();
}

function normalizeOpenAiCallCount(value: number | null): number {
  return Number.isSafeInteger(value) && Number(value) >= 0
    ? Number(value)
    : PENDING_SETUP_MAX_OPENAI_CALLS;
}
