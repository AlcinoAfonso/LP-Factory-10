import type {
  AiNicheResolutionOutput,
  AiNicheResolutionUxMode,
  DeterministicMatchConfidence,
  DeterministicMatchDecision,
  TaxonMatchCandidate,
} from "../contracts";
import { AI_NICHE_RESOLUTION_SCHEMA_VERSION } from "../contracts";
import {
  createOpenAiWorkloadFailureEvent,
  createOpenAiWorkloadSuccessEvent,
  emitOpenAiWorkloadEvent,
  resolveOpenAiProductWorkload,
  type OpenAiWorkloadEvent,
} from "../../../openai-workloads";

const OPENAI_RESPONSES_ENDPOINT = "https://api.openai.com/v1/responses";
const MAX_AI_OPTIONS = 3;

const UX_MODES = new Set<AiNicheResolutionUxMode>([
  "none",
  "confirm_single",
  "choose_from_options",
  "fallback_review",
]);

const OPTION_CONFIDENCES = new Set<DeterministicMatchConfidence>([
  "high",
  "medium",
  "low",
]);

type ResolveAiNicheResolutionFailureStatus =
  | "skipped_missing_env"
  | "skipped_not_eligible"
  | "failed";

export type ResolveAiNicheResolutionResult =
  | {
      ok: true;
      status: "resolved";
      model: string;
      schemaVersion: typeof AI_NICHE_RESOLUTION_SCHEMA_VERSION;
      output: AiNicheResolutionOutput;
    }
  | {
      ok: false;
      status: ResolveAiNicheResolutionFailureStatus;
      model: string | null;
      schemaVersion: typeof AI_NICHE_RESOLUTION_SCHEMA_VERSION;
      reason: string;
    };

type ResponsesApiResponse = {
  id?: unknown;
  usage?: unknown;
  output_text?: unknown;
  output?: Array<{
    content?: Array<{
      type?: string;
      text?: unknown;
    }>;
  }>;
  error?: {
    message?: string;
    type?: string;
  };
};

type OpenAiResolverDependencies = Readonly<{
  fetchImpl?: typeof fetch;
  emitEvent?: (event: OpenAiWorkloadEvent) => void;
  now?: () => number;
}>;

const AI_NICHE_RESOLUTION_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "uxMode",
    "message",
    "options",
    "needsAdminReview",
    "needsUserConfirmation",
    "shouldCreateOfficialLink",
    "suggestedNewTaxonLabel",
    "reason",
  ],
  properties: {
    uxMode: {
      type: "string",
      enum: ["none", "confirm_single", "choose_from_options", "fallback_review"],
    },
    message: { type: "string" },
    options: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["taxonId", "name", "slug", "confidence", "reason", "isOfficial"],
        properties: {
          taxonId: { type: ["string", "null"] },
          name: { type: "string" },
          slug: { type: ["string", "null"] },
          confidence: { type: "string", enum: ["high", "medium", "low"] },
          reason: { type: "string" },
          isOfficial: { type: "boolean" },
        },
      },
    },
    needsAdminReview: { type: "boolean" },
    needsUserConfirmation: { type: "boolean" },
    shouldCreateOfficialLink: { type: "boolean", enum: [false] },
    suggestedNewTaxonLabel: { type: ["string", "null"] },
    reason: { type: "string" },
  },
} as const;

const SYSTEM_PROMPT = [
  "You resolve onboarding business niche ambiguity for LP Factory.",
  "Prefer official candidate taxons provided by the server when they are useful.",
  "Never create, invent, or approve a taxon, alias, or official account link.",
  "shouldCreateOfficialLink must always be false.",
  "For official options, set isOfficial true and use the official taxonId, name, and slug.",
  "When no official candidate is safe, infer likely market meanings from raw_input and suggest 2 or 3 helpful market options with isOfficial false, taxonId null, and slug null before using fallback_review.",
  "For ambiguous inputs like Corretor, suggest market options such as real estate broker, insurance broker, or commercial consultant if appropriate.",
  "For medium confidence, return useful official options first, then semantic market options when helpful.",
  "For low confidence with official candidates, prepare up to three useful options.",
  "Use fallback_review only when no useful official or semantic market option can be suggested.",
  "Keep messages short and suitable for future Portuguese UX.",
].join("\n");

export function shouldResolveNicheWithAi(
  decision: Pick<
    DeterministicMatchDecision,
    "confidence" | "shouldEscalateToAi" | "aiEscalationMode"
  >,
): boolean {
  return (
    decision.confidence !== "high" ||
    decision.shouldEscalateToAi === true ||
    decision.aiEscalationMode !== "none"
  );
}

export async function resolveNicheWithOpenAi(input: {
  rawInput: string;
  decision: DeterministicMatchDecision;
  candidates: TaxonMatchCandidate[];
  apiKey?: string;
}, dependencies: OpenAiResolverDependencies = {}): Promise<ResolveAiNicheResolutionResult> {
  if (!shouldResolveNicheWithAi(input.decision)) {
    return {
      ok: false,
      status: "skipped_not_eligible",
      model: null,
      schemaVersion: AI_NICHE_RESOLUTION_SCHEMA_VERSION,
      reason: "high_confidence_not_eligible",
    };
  }

  const configuration = resolveOpenAiProductWorkload("niche_resolution");
  const apiKey = input.apiKey?.trim();

  if (!configuration.ok) {
    return {
      ok: false,
      status: "skipped_missing_env",
      model: null,
      schemaVersion: AI_NICHE_RESOLUTION_SCHEMA_VERSION,
      reason: "invalid_openai_configuration",
    };
  }

  const workload = configuration.value;
  const eventContext = {
    workload: workload.id,
    configurationSource: workload.source,
    configurationRevision: workload.revision,
    model: workload.model,
    reasoningEffort: workload.reasoningEffort,
  } as const;
  const emitEvent = dependencies.emitEvent ?? emitOpenAiWorkloadEvent;

  if (!apiKey) {
    emitEvent(createOpenAiWorkloadFailureEvent(eventContext, "configuration_invalid"));
    return {
      ok: false,
      status: "skipped_missing_env",
      model: workload.model,
      schemaVersion: AI_NICHE_RESOLUTION_SCHEMA_VERSION,
      reason: "missing_openai_env",
    };
  }

  const fetchImpl = dependencies.fetchImpl ?? fetch;
  const now = dependencies.now ?? Date.now;
  const startedAt = now();

  try {
    const response = await fetchImpl(OPENAI_RESPONSES_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: workload.model,
        reasoning: { effort: workload.reasoningEffort },
        input: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: JSON.stringify(buildPromptPayload(input)) },
        ],
        text: {
          format: {
            type: "json_schema",
            name: "ai_niche_resolution",
            strict: true,
            schema: AI_NICHE_RESOLUTION_SCHEMA,
          },
        },
        max_output_tokens: 700,
      }),
    });

    if (!response.ok) {
      emitEvent(createOpenAiWorkloadFailureEvent({
        ...eventContext,
        latencyMs: now() - startedAt,
      }, "http_error"));
      return {
        ok: false,
        status: "failed",
        model: workload.model,
        schemaVersion: AI_NICHE_RESOLUTION_SCHEMA_VERSION,
        reason: `openai_http_${response.status}`,
      };
    }

    let payload: unknown;
    try {
      payload = await response.json();
    } catch {
      emitEvent(createOpenAiWorkloadFailureEvent({
        ...eventContext,
        latencyMs: now() - startedAt,
      }, "invalid_response"));
      return {
        ok: false,
        status: "failed",
        model: workload.model,
        schemaVersion: AI_NICHE_RESOLUTION_SCHEMA_VERSION,
        reason: "invalid_response_json",
      };
    }

    if (!isRecord(payload)) {
      emitEvent(createOpenAiWorkloadFailureEvent({
        ...eventContext,
        latencyMs: now() - startedAt,
      }, "invalid_response"));
      return {
        ok: false,
        status: "failed",
        model: workload.model,
        schemaVersion: AI_NICHE_RESOLUTION_SCHEMA_VERSION,
        reason: "invalid_response_payload",
      };
    }

    const data = payload as ResponsesApiResponse;

    if (data.error) {
      emitEvent(createOpenAiWorkloadFailureEvent({
        ...eventContext,
        responseId: data.id,
        latencyMs: now() - startedAt,
        usage: data.usage,
      }, "provider_error"));
      return {
        ok: false,
        status: "failed",
        model: workload.model,
        schemaVersion: AI_NICHE_RESOLUTION_SCHEMA_VERSION,
        reason: data.error.type ?? "openai_response_error",
      };
    }

    const outputText = extractOutputText(data);
    if (outputText.kind !== "text") {
      emitEvent(createOpenAiWorkloadFailureEvent({
        ...eventContext,
        responseId: data.id,
        latencyMs: now() - startedAt,
        usage: data.usage,
      }, outputText.kind === "refusal" ? "refusal" : "invalid_response"));
      return {
        ok: false,
        status: "failed",
        model: workload.model,
        schemaVersion: AI_NICHE_RESOLUTION_SCHEMA_VERSION,
        reason: outputText.kind === "refusal" ? "openai_refusal" : "missing_output_text",
      };
    }

    const parsed = parseJsonObject(outputText.value);
    if (!parsed) {
      emitEvent(createOpenAiWorkloadFailureEvent({
        ...eventContext,
        responseId: data.id,
        latencyMs: now() - startedAt,
        usage: data.usage,
      }, "invalid_response"));
      return {
        ok: false,
        status: "failed",
        model: workload.model,
        schemaVersion: AI_NICHE_RESOLUTION_SCHEMA_VERSION,
        reason: "invalid_output_json",
      };
    }

    emitEvent(createOpenAiWorkloadSuccessEvent({
      ...eventContext,
      responseId: data.id,
      latencyMs: now() - startedAt,
      usage: data.usage,
    }));

    return {
      ok: true,
      status: "resolved",
      model: workload.model,
      schemaVersion: AI_NICHE_RESOLUTION_SCHEMA_VERSION,
      output: normalizeAiOutput(parsed, input.decision, input.candidates),
    };
  } catch (error) {
    const failureCategory = error instanceof Error && error.name === "AbortError"
      ? "timeout"
      : "transport_error";
    emitEvent(createOpenAiWorkloadFailureEvent({
      ...eventContext,
      latencyMs: now() - startedAt,
    }, failureCategory));
    return {
      ok: false,
      status: "failed",
      model: workload.model,
      schemaVersion: AI_NICHE_RESOLUTION_SCHEMA_VERSION,
      reason: error instanceof Error ? error.name : "openai_resolver_error",
    };
  }
}

function buildPromptPayload(input: {
  rawInput: string;
  decision: DeterministicMatchDecision;
  candidates: TaxonMatchCandidate[];
}) {
  return {
    raw_input: input.rawInput,
    deterministic_decision: {
      confidence: input.decision.confidence,
      selected_taxon_id: input.decision.selectedCandidate?.taxonId ?? null,
      should_use_deterministic_match: input.decision.shouldUseDeterministicMatch,
      should_escalate_to_ai: input.decision.shouldEscalateToAi,
      ai_escalation_mode: input.decision.aiEscalationMode,
      needs_admin_review: input.decision.needsAdminReview,
      reason: input.decision.reason,
    },
    official_candidates: input.candidates.map((candidate) => ({
      taxon_id: candidate.taxonId,
      name: candidate.name,
      slug: candidate.slug,
      level: candidate.level,
      parent_id: candidate.parentId,
      parent_name: candidate.parentName,
      match_source: candidate.matchSource,
      score: candidate.score,
    })),
  };
}

function extractOutputText(data: ResponsesApiResponse):
  | Readonly<{ kind: "text"; value: string }>
  | Readonly<{ kind: "refusal" | "invalid_response" }> {
  if (typeof data.output_text === "string") {
    return { kind: "text", value: data.output_text };
  }

  for (const item of data.output ?? []) {
    for (const content of item.content ?? []) {
      if (content.type === "refusal") return { kind: "refusal" };
      if (content.type === "output_text" && typeof content.text === "string") {
        return { kind: "text", value: content.text };
      }
    }
  }

  return { kind: "invalid_response" };
}

function parseJsonObject(value: string): Record<string, unknown> | null {
  try {
    const parsed = JSON.parse(value) as unknown;
    return isRecord(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function normalizeAiOutput(
  raw: Record<string, unknown>,
  decision: DeterministicMatchDecision,
  candidates: TaxonMatchCandidate[],
): AiNicheResolutionOutput {
  if (raw.shouldCreateOfficialLink !== false) {
    return fallbackOutput("ai_output_rejected_official_link");
  }

  const candidateById = new Map(candidates.map((candidate) => [candidate.taxonId, candidate]));
  let options = Array.isArray(raw.options)
    ? raw.options
        .map((option) => normalizeOption(option, candidateById))
        .filter((option): option is AiNicheResolutionOutput["options"][number] => option !== null)
        .slice(0, MAX_AI_OPTIONS)
    : [];

  let uxMode = normalizeUxMode(raw.uxMode);

  if (decision.confidence === "medium" && options.length === 1 && options[0]?.isOfficial) {
    uxMode = "confirm_single";
  } else if (decision.confidence === "medium" && options.length > 1) {
    uxMode = "choose_from_options";
  } else if (decision.confidence === "medium" && options.length === 1) {
    uxMode = "choose_from_options";
  } else if (decision.confidence === "low" && options.length > 0) {
    uxMode = "choose_from_options";
  }

  if ((uxMode === "confirm_single" || uxMode === "choose_from_options") && options.length === 0) {
    return fallbackOutput("ai_output_missing_official_options", normalizeSuggestedLabel(raw.suggestedNewTaxonLabel));
  }

  if (uxMode === "none") {
    return fallbackOutput("ai_output_not_actionable", normalizeSuggestedLabel(raw.suggestedNewTaxonLabel));
  }

  return {
    uxMode,
    message: normalizeMessage(raw.message, uxMode),
    options,
    needsAdminReview: uxMode === "fallback_review" || raw.needsAdminReview === true,
    needsUserConfirmation:
      uxMode === "confirm_single" || uxMode === "choose_from_options" || raw.needsUserConfirmation === true,
    shouldCreateOfficialLink: false,
    suggestedNewTaxonLabel: normalizeSuggestedLabel(raw.suggestedNewTaxonLabel),
    reason: normalizeShortText(raw.reason, "ai_resolution_completed"),
  };
}

function normalizeOption(
  raw: unknown,
  candidateById: Map<string, TaxonMatchCandidate>,
): AiNicheResolutionOutput["options"][number] | null {
  if (!isRecord(raw)) return null;

  const confidence = OPTION_CONFIDENCES.has(raw.confidence as DeterministicMatchConfidence)
    ? (raw.confidence as DeterministicMatchConfidence)
    : "low";

  if (raw.isOfficial === true) {
    if (typeof raw.taxonId !== "string") return null;

    const officialCandidate = candidateById.get(raw.taxonId);
    if (!officialCandidate) return null;

    return {
      taxonId: officialCandidate.taxonId,
      name: officialCandidate.name,
      slug: officialCandidate.slug,
      confidence,
      reason: normalizeShortText(raw.reason, "official_candidate"),
      isOfficial: true,
    };
  }

  const name = normalizeShortText(raw.name, "").slice(0, 120);
  if (!name) return null;

  return {
    taxonId: null,
    name,
    slug: null,
    confidence,
    reason: normalizeShortText(raw.reason, "semantic_market_option"),
    isOfficial: false,
  };
}

function normalizeUxMode(value: unknown): AiNicheResolutionUxMode {
  return UX_MODES.has(value as AiNicheResolutionUxMode)
    ? (value as AiNicheResolutionUxMode)
    : "fallback_review";
}

function normalizeMessage(value: unknown, uxMode: AiNicheResolutionUxMode): string {
  const text = normalizeShortText(value, "");
  if (text) return text;

  if (uxMode === "confirm_single") return "Você quis dizer este nicho?";
  if (uxMode === "choose_from_options") return "Encontramos algumas possibilidades para seu nicho.";
  return "Vamos analisar melhor seu nicho para personalizar sua experiência.";
}

function normalizeSuggestedLabel(value: unknown): string | null {
  if (typeof value !== "string") return null;

  const trimmed = value.trim();
  if (!trimmed) return null;

  return trimmed.slice(0, 120);
}

function normalizeShortText(value: unknown, fallback: string): string {
  if (typeof value !== "string") return fallback;

  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, 240) : fallback;
}

function fallbackOutput(reason: string, suggestedNewTaxonLabel: string | null = null): AiNicheResolutionOutput {
  return {
    uxMode: "fallback_review",
    message: "Vamos analisar melhor seu nicho para personalizar sua experiência.",
    options: [],
    needsAdminReview: true,
    needsUserConfirmation: false,
    shouldCreateOfficialLink: false,
    suggestedNewTaxonLabel,
    reason,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
