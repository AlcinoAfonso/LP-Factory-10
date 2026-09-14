import { z } from "zod";

import {
  INPUT_CATALOG_EVALUATION_SCHEMA_VERSION,
  inputCatalogEvaluationCandidateConclusions,
  inputCatalogEvaluationCandidateOrigins,
  inputCatalogEvaluationModes,
  inputCatalogEvaluationSourceStates,
  inputCatalogEvaluationSourceStrategies,
  inputCatalogEvaluationStatuses,
  inputCatalogEvaluationTaxonomicLayers,
  type InputCatalogEvaluationOutput,
  type ParseInputCatalogEvaluationOutputResult,
} from "./contracts";

const MAX_SERIALIZED_OUTPUT_LENGTH = 100_000;
const MAX_SUMMARY_LENGTH = 2_000;
const MAX_CANDIDATES = 8;
const MAX_FACTUAL_NEED_LENGTH = 500;
const MAX_RELATED_FIELDS = 16;
const MAX_FIELD_KEY_LENGTH = 100;
const MAX_CANDIDATE_TEXT_LENGTH = 1_000;
const MAX_EVIDENCE_LENGTH = 1_600;
const MAX_UNCERTAINTIES = 8;
const MAX_UNCERTAINTY_LENGTH = 500;
const MAX_FOLLOW_UP_LENGTH = 1_000;
const MAX_SOURCE_URLS = 16;

const text = (maximum: number) => z.string().trim().min(1).max(maximum);
const nullableText = (maximum: number) => text(maximum).nullable();
const sourceUrls = z.array(z.url().max(2_048)).max(MAX_SOURCE_URLS);

export const inputCatalogEvaluationCandidateSchema = z
  .object({
    origin: z.enum(inputCatalogEvaluationCandidateOrigins),
    conclusion: z.enum(inputCatalogEvaluationCandidateConclusions),
    factualNeed: text(MAX_FACTUAL_NEED_LENGTH),
    relatedFields: z
      .array(text(MAX_FIELD_KEY_LENGTH))
      .max(MAX_RELATED_FIELDS),
    currentCoverage: text(MAX_CANDIDATE_TEXT_LENGTH),
    allegedInsufficiency: nullableText(MAX_CANDIDATE_TEXT_LENGTH),
    evidence: text(MAX_EVIDENCE_LENGTH),
    expectedOperationalSource: nullableText(MAX_CANDIDATE_TEXT_LENGTH),
    realConsumer: nullableText(MAX_CANDIDATE_TEXT_LENGTH),
    concreteHarm: nullableText(MAX_CANDIDATE_TEXT_LENGTH),
    suggestedTaxonomyLayer: z
      .enum(inputCatalogEvaluationTaxonomicLayers)
      .nullable(),
    uncertainties: z
      .array(text(MAX_UNCERTAINTY_LENGTH))
      .max(MAX_UNCERTAINTIES),
    sourceUrls,
  })
  .strict();

export const inputCatalogEvaluationOutputSchema = z
  .object({
    schemaVersion: z.literal(INPUT_CATALOG_EVALUATION_SCHEMA_VERSION),
    status: z.enum(inputCatalogEvaluationStatuses),
    mode: z.enum(inputCatalogEvaluationModes),
    sourceStrategy: z.enum(inputCatalogEvaluationSourceStrategies),
    sourceState: z.enum(inputCatalogEvaluationSourceStates),
    summary: text(MAX_SUMMARY_LENGTH),
    summarySourceUrls: sourceUrls,
    candidates: z
      .array(inputCatalogEvaluationCandidateSchema)
      .max(MAX_CANDIDATES),
    followUpQuestion: nullableText(MAX_FOLLOW_UP_LENGTH),
  })
  .strict();

const generatedSchema = z.toJSONSchema(inputCatalogEvaluationOutputSchema, {
  target: "draft-7",
});
const { $schema: _schemaDialect, ...structuredOutputSchema } = generatedSchema;

export const inputCatalogEvaluationOutputJsonSchema = deepFreeze(
  structuredClone(structuredOutputSchema),
) as Readonly<Record<string, unknown>>;

export function parseInputCatalogEvaluationOutput(
  candidate: unknown,
): ParseInputCatalogEvaluationOutputResult {
  const decoded = decodeCandidate(candidate);
  if (!decoded.ok) return decoded;

  const parsed = inputCatalogEvaluationOutputSchema.safeParse(decoded.value);
  if (!parsed.success) {
    return failure(
      "INVALID_SCHEMA",
      "A resposta não corresponde ao contrato estrito E20.6.5 v2.",
    );
  }

  const semanticError = validateSemantics(parsed.data);
  if (semanticError) {
    return failure("INVALID_SEMANTICS", semanticError);
  }

  return deepFreeze({
    ok: true as const,
    value: structuredClone(parsed.data) as InputCatalogEvaluationOutput,
  });
}

function decodeCandidate(
  candidate: unknown,
):
  | Readonly<{ ok: true; value: unknown }>
  | Extract<ParseInputCatalogEvaluationOutputResult, { ok: false }> {
  if (typeof candidate !== "string") return { ok: true, value: candidate };
  if (candidate.length > MAX_SERIALIZED_OUTPUT_LENGTH) {
    return failure("INVALID_JSON", "A resposta serializada excede o limite permitido.");
  }
  try {
    return { ok: true, value: JSON.parse(candidate) as unknown };
  } catch {
    return failure("INVALID_JSON", "A resposta não contém JSON válido.");
  }
}

function validateSemantics(
  output: z.infer<typeof inputCatalogEvaluationOutputSchema>,
): string | null {
  for (const candidate of output.candidates) {
    if (
      hasDuplicates(candidate.relatedFields) ||
      hasDuplicates(candidate.uncertainties) ||
      hasDuplicates(candidate.sourceUrls)
    ) {
      return "Fields relacionados, incertezas e fontes não podem conter duplicatas.";
    }
    if (candidate.sourceUrls.some((url) => !isHttpsUrl(url))) {
      return "Toda fonte declarada deve usar URL HTTPS sem credenciais.";
    }
    if (
      candidate.conclusion === "refine_existing_field" &&
      candidate.relatedFields.length === 0
    ) {
      return "Refinamento exige ao menos um field relacionado.";
    }
    if (
      (candidate.conclusion === "refine_existing_field" ||
        candidate.conclusion === "possible_new_field") &&
      [
        candidate.allegedInsufficiency,
        candidate.evidence,
        candidate.expectedOperationalSource,
        candidate.realConsumer,
        candidate.concreteHarm,
      ].some((value) => value === null)
    ) {
      return "Gap candidato exige insuficiência, evidência, origem, consumidor e prejuízo.";
    }
    if (
      candidate.conclusion === "inconclusive" &&
      candidate.uncertainties.length === 0
    ) {
      return "Candidato inconclusivo deve declarar ao menos uma incerteza.";
    }
  }

  if (
    hasDuplicates(output.summarySourceUrls) ||
    output.summarySourceUrls.some((url) => !isHttpsUrl(url))
  ) {
    return "As fontes do resumo devem ser URLs HTTPS únicas e sem credenciais.";
  }
  if (
    (output.sourceStrategy === "e20_5" && output.sourceState !== "e20_5_valid") ||
    (output.sourceStrategy === "web_search_fallback" && output.sourceState === "e20_5_valid")
  ) {
    return "A estratégia declarada não corresponde ao estado da fonte E20.5.";
  }
  const webStrategy = output.sourceStrategy !== "e20_5";
  if (
    (webStrategy &&
      (output.summarySourceUrls.length === 0 ||
        output.candidates.some((candidate) => candidate.sourceUrls.length === 0))) ||
    (!webStrategy &&
      (output.summarySourceUrls.length > 0 ||
        output.candidates.some((candidate) => candidate.sourceUrls.length > 0)))
  ) {
    return webStrategy
      ? "Resultado com Web Search deve citar fontes no resumo e em cada candidato."
      : "Resultado baseado somente na E20.5 não admite fontes web.";
  }

  if (
    output.mode === "systematic" &&
    output.candidates.some((candidate) => candidate.origin !== "systematic")
  ) {
    return "Modo sistemático aceita somente candidatos de origem sistemática.";
  }
  if (output.mode === "hypothesis") {
    const focalCount = output.candidates.filter(
      (candidate) => candidate.origin === "human_hypothesis",
    ).length;
    if (
      focalCount !== 1 ||
      output.candidates.some((candidate) => candidate.origin === "systematic")
    ) {
      return "Modo hipótese exige exatamente um candidato focal e admite apenas incidentais adicionais.";
    }
  }

  const conclusions = output.candidates.map((candidate) => candidate.conclusion);
  if (
    output.status === "sufficient" &&
    (conclusions.some((conclusion) => conclusion !== "covered") ||
      output.followUpQuestion !== null)
  ) {
    return "Status suficiente aceita apenas cobertura e não admite pergunta pendente.";
  }
  if (
    output.status === "candidate_gaps" &&
    (!conclusions.some(
      (conclusion) =>
        conclusion === "refine_existing_field" ||
        conclusion === "possible_new_field",
    ) ||
      conclusions.some((conclusion) => conclusion === "inconclusive"))
  ) {
    return "Status de gaps exige ao menos um gap acionável e nenhum candidato inconclusivo.";
  }
  if (
    output.status === "inconclusive" &&
    (conclusions.some(
      (conclusion) =>
        conclusion === "refine_existing_field" ||
        conclusion === "possible_new_field",
    ) ||
      (!conclusions.includes("inconclusive") && output.followUpQuestion === null))
  ) {
    return "Status inconclusivo não admite gap acionável e deve explicitar incerteza ou pergunta.";
  }

  return null;
}

function hasDuplicates(values: readonly string[]): boolean {
  return new Set(values).size !== values.length;
}

function isHttpsUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password;
  } catch {
    return false;
  }
}

function failure(
  code: Extract<ParseInputCatalogEvaluationOutputResult, { ok: false }>["error"]["code"],
  message: string,
): Extract<ParseInputCatalogEvaluationOutputResult, { ok: false }> {
  return deepFreeze({ ok: false, error: { code, message } });
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    for (const nested of Object.values(value)) deepFreeze(nested);
    Object.freeze(value);
  }
  return value;
}
