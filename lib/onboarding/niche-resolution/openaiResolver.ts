import "server-only";

import type {
  AiNicheResolutionOutput,
  AiNicheResolutionUxMode,
  DeterministicMatchDecision,
  DeterministicMatchConfidence,
  TaxonMatchCandidate,
} from "./contracts";

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
      output: AiNicheResolutionOutput;
    }
  | {
      ok: false;
      status: ResolveAiNicheResolutionFailureStatus;
      reason: string;
    };

type ResponsesApiResponse = {
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
        required: ["taxonId", "name", "slug", "confidence", "reason"],
        properties: {
          taxonId: { type: "string" },
          name: { type: "string" },
          slug: { type: "string" },
          confidence: { type: "string", enum: ["high", "medium", "low"] },
          reason: { type: "string" },
        },
      },
    },
    needsAdminReview: { type: "boolean" },
    needsUserConfirmation: { type: "boolean" },
    shouldCreateOfficialLink: { type: "boolean" },
    suggestedNewTaxonLabel: { type: ["string", "null"] },
    reason: { type: "string" },
  },
} as const;

const SYSTEM_PROMPT = [
  "You resolve onboarding business niche ambiguity for LP Factory.",
  "Use only the official candidate taxons provided by the server.",
  "Never create, invent, or approve a taxon, alias, or official account link.",
  "shouldCreateOfficialLink must always be false.",
  "For medium confidence, prepare one official option for a simple confirmation.",
  "For low confidence with official candidates, prepare up to three official options.",
  "For no useful official candidate, return fallback_review with no options.",
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
}): Promise<ResolveAiNicheResolutionResult> {
  if (!shouldResolveNicheWithAi(input.decision)) {
    return {
      ok: false,
      status: "skipped_not_eligible",
      reason: "high_confidence_not_eligible",
    };
  }

  const apiKey = process.env.OPENAI_API_KEY?.trim();
  const model = process.env.OPENAI_NICHE_RESOLVER_MODEL?.trim();

  if (!apiKey || !model) {
    return {
      ok: false,
      status: "skipped_missing_env",
      reason: "missing_openai_env",
    };
  }

  try {
    const response = await fetch(OPENAI_RESPONSES_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
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
      return {
        ok: false,
        status: "failed",
        reason: `openai_http_${response.status}`,
      };
    }

    const data = (await response.json()) as ResponsesApiResponse;

    if (data.error) {
      return {
        ok: false,
        status: "failed",
        reason: data.error.type ?? "openai_response_error",
      };
    }

    const outputText = extractOutputText(data);
    if (!outputText) {
      return { ok: false, status: "failed", reason: "missing_output_text" };
    }

    const parsed = parseJsonObject(outputText);
    if (!parsed) {
      return { ok: false, status: "failed", reason: "invalid_output_json" };
    }

    return {
      ok: true,
      status: "resolved",
      output: normalizeAiOutput(parsed, input.decision, input.candidates),
    };
  } catch (error) {
    return {
      ok: false,
      status: "failed",
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

function extractOutputText(data: ResponsesApiResponse): string | null {
  if (typeof data.output_text === "string") return data.output_text;

  for (const item of data.output ?? []) {
    for (const content of item.content ?? []) {
      if (content.type === "output_text" && typeof content.text === "string") {
        return content.text;
      }
    }
  }

  return null;
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

  if (decision.reason === "no_candidates" || candidates.length === 0) {
    return fallbackOutput("no_official_candidates", normalizeSuggestedLabel(raw.suggestedNewTaxonLabel));
  }

  let uxMode = normalizeUxMode(raw.uxMode);

  if (decision.confidence === "medium" && options.length > 0) {
    uxMode = "confirm_single";
    options = options.slice(0, 1);
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
  if (!isRecord(raw) || typeof raw.taxonId !== "string") return null;

  const officialCandidate = candidateById.get(raw.taxonId);
  if (!officialCandidate) return null;

  const confidence = OPTION_CONFIDENCES.has(raw.confidence as DeterministicMatchConfidence)
    ? (raw.confidence as DeterministicMatchConfidence)
    : "low";

  return {
    taxonId: officialCandidate.taxonId,
    name: officialCandidate.name,
    slug: officialCandidate.slug,
    confidence,
    reason: normalizeShortText(raw.reason, "official_candidate"),
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

  if (uxMode === "confirm_single") return "Voce quis dizer este nicho?";
  if (uxMode === "choose_from_options") return "Encontramos algumas possibilidades para seu nicho.";
  return "Vamos analisar melhor seu nicho para personalizar sua experiencia.";
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
    message: "Vamos analisar melhor seu nicho para personalizar sua experiencia.",
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
