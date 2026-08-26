import type { LandingPagePresentationCandidate } from "../conversion-content/landing-page/presentation";
import type {
  OpenAiManagedWorkloadEnvironment,
  OpenAiReasoningEffort,
  OpenAiWorkloadUsage,
} from "../openai-workloads";
import type { LandingPageGenerationContextPackageV4 } from "./generationContextContracts";

export const LANDING_PAGE_DRAFT_COMPARISON_CASE_ID =
  "corretor-imoveis-representative-v4" as const;
export const LANDING_PAGE_DRAFT_COMPARISON_FIXTURE_VERSION = 4 as const;
export const LANDING_PAGE_DRAFT_COMPARISON_WORKLOAD =
  "landing_page_draft_generation" as const;
export const LANDING_PAGE_DRAFT_COMPARISON_MIN_CONFIGURATIONS = 2;
export const LANDING_PAGE_DRAFT_COMPARISON_MAX_CONFIGURATIONS = 6;
export const LANDING_PAGE_DRAFT_COMPARISON_MAX_FINALISTS = 2;

export type LandingPageDraftComparisonSelection = Readonly<{
  model: string;
  reasoningEffort: OpenAiReasoningEffort;
}>;

export type LandingPageDraftComparisonConfiguration =
  LandingPageDraftComparisonSelection &
    Readonly<{
      key: string;
      baseline: boolean;
      source: "repo_catalog" | "supabase_operational" | "model_catalog_comparison";
      revision: string;
      catalogModelVersion: number | null;
      catalogParameterVersion: number | null;
    }>;

export type LandingPageDraftComparisonProjectionSection = Readonly<{
  kind: string;
  label: string;
  lines: readonly string[];
}>;

export type LandingPageDraftComparisonAttempt =
  | Readonly<{
      ok: true;
      projection: readonly LandingPageDraftComparisonProjectionSection[];
      usage: OpenAiWorkloadUsage;
      latencyMs: number;
    }>
  | Readonly<{
      ok: false;
      kind:
        | "configuration_invalid"
        | "timeout"
        | "http_error"
        | "provider_error"
        | "incomplete"
        | "refusal"
        | "invalid_response"
        | "invalid_candidate";
    }>;

export type LandingPageDraftComparisonResult = Readonly<{
  alias: string;
  configuration: LandingPageDraftComparisonConfiguration;
  attempt: LandingPageDraftComparisonAttempt;
}>;

export type LandingPageDraftComparisonRound = Readonly<{
  roundId: string;
  roundToken: string;
  environment: OpenAiManagedWorkloadEnvironment;
  workload: typeof LANDING_PAGE_DRAFT_COMPARISON_WORKLOAD;
  fixtureId: typeof LANDING_PAGE_DRAFT_COMPARISON_CASE_ID;
  fixtureVersion: typeof LANDING_PAGE_DRAFT_COMPARISON_FIXTURE_VERSION;
  contextContractVersion: 4;
  presentationContractVersion: 1;
  results: readonly LandingPageDraftComparisonResult[];
}>;

export type LandingPageDraftComparisonEvaluation = Readonly<{
  validity: "valid" | "invalid";
  quality: 1 | 2 | 3 | 4 | 5;
  correction: "none" | "light" | "substantial";
  comment: string;
}>;

export type LandingPageDraftComparisonDecision = Readonly<{
  kind: "recommendation" | "insufficient_evidence";
  recommendedAlias: string | null;
  rationale: string;
  limitations: string;
}>;

export const landingPageDraftComparisonFixture = deepFreeze({
  contractVersion: 4,
  identities: {
    accountId: "10000000-0000-4000-8000-000000000021",
    landingPage: {
      id: "20000000-0000-4000-8000-000000000021",
      status: "draft",
    },
    planKey: "starter",
    servedTaxon: {
      id: "21000000-0000-4000-8000-000000000021",
      slug: "corretor-imoveis",
      name: "Corretor Imóveis",
      level: "segment",
      isActive: true,
      parentId: null,
    },
    taxonChain: {
      segment: {
        id: "21000000-0000-4000-8000-000000000021",
        slug: "corretor-imoveis",
        name: "Corretor Imóveis",
        level: "segment",
        isActive: true,
        parentId: null,
      },
    },
    sharedCatalogVersion: 5,
    landingPageCatalogVersion: 5,
    effectiveInputCatalogVersion: 5,
    sharedRevision: 11,
    landingPageRevision: 13,
    rootVersion: 1,
    endCustomerResearchVersion: 1,
  },
  modelContext: {
    research: {
      taxonSlug: "corretor-imoveis",
      audienceScope: "end_customer",
      researchVersion: 1,
      content:
        "Pessoas que compram ou vendem imóveis valorizam clareza sobre etapas, documentação, negociação e acompanhamento profissional.",
    },
    facts: [
      {
        fieldKey: "primary_service_or_offer",
        purpose: "offer",
        valueType: "string",
        value: "Consultoria imobiliária para compra e venda de imóveis",
        source: "configuration",
        provenance: [{ property: "definition", layer: "universal" }],
      },
      {
        fieldKey: "primary_conversion_channel",
        purpose: "conversion",
        valueType: "enum",
        value: "whatsapp",
        source: "configuration",
        provenance: [{ property: "definition", layer: "universal" }],
      },
    ],
    editorialLimits: {
      semanticRoles: [
        { key: "h1", recommended: { min: 20, max: 72 }, absoluteMax: 96 },
        { key: "h2", recommended: { min: 16, max: 64 }, absoluteMax: 80 },
        {
          key: "paragraph",
          recommended: { min: 40, max: 220 },
          absoluteMax: 320,
        },
        {
          key: "cta_label",
          recommended: { min: 4, max: 32 },
          absoluteMax: 48,
        },
      ],
      semanticHierarchy: ["h1", "h2", "h3"],
    },
  },
  serverContext: {
    facts: [
      {
        fieldKey: "whatsapp_destination",
        purpose: "conversion_destination",
        valueType: "phone",
        value: "+5521999990000",
        source: "configuration",
        provenance: [{ property: "definition", layer: "universal" }],
      },
    ],
  },
} satisfies LandingPageGenerationContextPackageV4);

export function landingPageDraftComparisonConfigurationKey(
  selection: LandingPageDraftComparisonSelection,
) {
  return `${selection.model}\u001f${selection.reasoningEffort}`;
}

export function normalizeLandingPageDraftComparisonSelections(
  value: unknown,
): readonly LandingPageDraftComparisonSelection[] | null {
  if (!Array.isArray(value)) return null;
  const selections: LandingPageDraftComparisonSelection[] = [];
  const keys = new Set<string>();
  for (const item of value) {
    if (!isRecord(item)) return null;
    const model = technicalValue(item.model, 128);
    const reasoningEffort = item.reasoningEffort;
    if (!model || !isReasoningEffort(reasoningEffort)) return null;
    const selection = { model, reasoningEffort } as const;
    const key = landingPageDraftComparisonConfigurationKey(selection);
    if (keys.has(key)) return null;
    keys.add(key);
    selections.push(selection);
  }
  return deepFreeze(selections);
}

export function modelCatalogComparisonRevision(
  modelVersion: number,
  parameterVersion: number,
) {
  if (!positiveInteger(modelVersion) || !positiveInteger(parameterVersion)) {
    return null;
  }
  return `catalog:m${modelVersion}:p${parameterVersion}`;
}

export function projectLandingPageDraftForComparison(
  candidate: LandingPagePresentationCandidate,
): readonly LandingPageDraftComparisonProjectionSection[] {
  return deepFreeze(
    candidate.sections.map((section) => {
      switch (section.kind) {
        case "header":
          return sectionProjection(section.kind, "Cabeçalho", [section.ctaLabel]);
        case "hero":
          return sectionProjection(section.kind, "Hero", [
            section.eyebrow,
            section.heading,
            section.body,
            `CTA: ${section.ctaLabel}`,
          ]);
        case "text_media":
          return sectionProjection(section.kind, "Texto", [section.heading, section.body]);
        case "cards_grid":
          return sectionProjection(section.kind, "Cards", [
            section.heading,
            section.intro,
            ...section.cards.flatMap((card) => [card.title, card.body]),
          ]);
        case "steps":
          return sectionProjection(section.kind, "Etapas", [
            section.heading,
            section.intro,
            ...section.items.flatMap((item) => [item.title, item.body]),
          ]);
        case "faq":
          return sectionProjection(section.kind, "Perguntas frequentes", [
            section.heading,
            ...section.items.flatMap((item) => [item.question, item.answer]),
          ]);
        case "cta":
          return sectionProjection(section.kind, "Chamada para ação", [
            section.heading,
            section.body,
            `CTA: ${section.ctaLabel}`,
          ]);
        case "footer":
          return sectionProjection(section.kind, "Rodapé", [section.tagline]);
      }
    }),
  );
}

export function shuffleLandingPageDraftComparisonConfigurations<T>(
  values: readonly T[],
  random: () => number = Math.random,
): readonly T[] {
  const shuffled = [...values];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const target = Math.floor(random() * (index + 1));
    [shuffled[index], shuffled[target]] = [shuffled[target]!, shuffled[index]!];
  }
  return shuffled;
}

export function landingPageDraftComparisonAlias(index: number) {
  if (!Number.isSafeInteger(index) || index < 0 || index >= 26) return null;
  return `Resultado ${String.fromCharCode(65 + index)}`;
}

export function buildLandingPageDraftComparisonSummary(input: Readonly<{
  round: LandingPageDraftComparisonRound;
  evaluations: Readonly<Record<string, LandingPageDraftComparisonEvaluation>>;
  repetitions: readonly LandingPageDraftComparisonResult[];
  decision: LandingPageDraftComparisonDecision;
}>) {
  const lines = [
    "E21.3.3 — comparação textual de Landing Page",
    `Ambiente: ${input.round.environment}`,
    `Workload: ${input.round.workload}`,
    `Rodada: ${input.round.roundId}`,
    `Fixture: ${input.round.fixtureId} v${input.round.fixtureVersion}`,
    `Contratos: contexto v${input.round.contextContractVersion}; apresentação v${input.round.presentationContractVersion}`,
    "Custo: não confirmado; nenhuma conclusão financeira foi produzida.",
    "Estabilidade: ausente para configurações sem repetição focalizada.",
    "",
  ];
  for (const result of input.round.results) {
    const evaluation = input.evaluations[result.alias];
    lines.push(
      `${result.alias}: ${result.configuration.model} + ${result.configuration.reasoningEffort}`,
      `Fonte/revisão: ${result.configuration.source} / ${result.configuration.revision}${result.configuration.baseline ? " (baseline)" : ""}`,
      result.attempt.ok
        ? `Gates: geração válida; avaliação ${evaluation?.validity ?? "ausente"}; qualidade ${evaluation?.quality ?? "ausente"}/5; correção ${evaluation?.correction ?? "ausente"}`
        : `Gates: falha ${result.attempt.kind}`,
      result.attempt.ok
        ? `Usage: input ${metric(result.attempt.usage.inputTokens)}, cached ${metric(result.attempt.usage.cachedInputTokens)}, output ${metric(result.attempt.usage.outputTokens)}, reasoning ${metric(result.attempt.usage.reasoningTokens)}, total ${metric(result.attempt.usage.totalTokens)}; latência ${result.attempt.latencyMs} ms`
        : "Usage e latência: indisponíveis",
      `Comentário: ${evaluation?.comment.trim() || "sem comentário"}`,
      "",
    );
  }
  if (input.repetitions.length > 0) {
    lines.push("Repetições focalizadas:");
    for (const repetition of input.repetitions) {
      lines.push(
        `- ${repetition.alias}: ${repetition.configuration.model} + ${repetition.configuration.reasoningEffort}; ${repetition.attempt.ok ? `válida; latência ${repetition.attempt.latencyMs} ms; total tokens ${metric(repetition.attempt.usage.totalTokens)}` : `falha ${repetition.attempt.kind}`}`,
      );
    }
    lines.push("");
  }
  lines.push(
    `Quantidade de repetições focalizadas: ${input.repetitions.length}`,
    `Decisão humana: ${input.decision.kind === "recommendation" ? `recomendação ${input.decision.recommendedAlias ?? "não informada"}` : "evidência insuficiente"}`,
    `Motivo: ${input.decision.rationale.trim()}`,
    `Limitações: ${input.decision.limitations.trim() || "não informadas"}`,
    "Nenhuma configuração foi ativada, promovida ou persistida por esta comparação.",
  );
  return lines.join("\n");
}

function sectionProjection(kind: string, label: string, values: readonly (string | null)[]) {
  return {
    kind,
    label,
    lines: values.filter((value): value is string => Boolean(value?.trim())),
  } as const;
}

function metric(value: number | null) {
  return value === null ? "indisponível" : String(value);
}

function isReasoningEffort(value: unknown): value is OpenAiReasoningEffort {
  return (
    value === "none" ||
    value === "low" ||
    value === "medium" ||
    value === "high" ||
    value === "xhigh" ||
    value === "max"
  );
}

function technicalValue(value: unknown, maximum: number) {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  return normalized.length > 0 && normalized.length <= maximum &&
    /^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(normalized)
    ? normalized
    : null;
}

function positiveInteger(value: number) {
  return Number.isSafeInteger(value) && value > 0;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    for (const nested of Object.values(value)) deepFreeze(nested);
    Object.freeze(value);
  }
  return value;
}
