import { z } from "zod";

import { resolveLandingPageRootParameters } from "../root-resolver";

export const LANDING_PAGE_PRESENTATION_CONTRACT_VERSION = 1 as const;

const root = resolveLandingPageRootParameters({ rootVersion: 1 });
if (!root.ok) {
  throw new Error("Landing page root v1 is required by presentation contract v1");
}

const limits = root.value.semanticRoles;
const text = (maximum: number) => z.string().trim().min(1).max(maximum);
const nullableText = (maximum: number) => text(maximum).nullable();

const headerSchema = z.object({
  kind: z.literal("header"),
  layout: z.literal("standard"),
  ctaLabel: nullableText(limits.cta_label.textRange.absoluteMax),
}).strict();

const heroSchema = z.object({
  kind: z.literal("hero"),
  layout: z.enum(["media_left", "media_right"]),
  eyebrow: nullableText(limits.eyebrow.textRange.absoluteMax),
  heading: text(limits.h1.textRange.absoluteMax),
  body: text(limits.paragraph.textRange.absoluteMax),
  ctaLabel: text(limits.cta_label.textRange.absoluteMax),
  mediaBrief: text(limits.paragraph.textRange.absoluteMax),
}).strict();

const textMediaSchema = z.object({
  kind: z.literal("text_media"),
  layout: z.enum(["media_left", "media_right"]),
  heading: text(limits.h2.textRange.absoluteMax),
  body: text(limits.paragraph.textRange.absoluteMax),
  mediaBrief: nullableText(limits.paragraph.textRange.absoluteMax),
}).strict();

const cardSchema = z.object({
  title: text(limits.card_title.textRange.absoluteMax),
  body: text(limits.card_body.textRange.absoluteMax),
}).strict();

const cardsGridSchema = z.object({
  kind: z.literal("cards_grid"),
  layout: z.enum(["grid_2", "grid_3"]),
  heading: text(limits.h2.textRange.absoluteMax),
  intro: nullableText(limits.paragraph.textRange.absoluteMax),
  cards: z.array(cardSchema).min(2).max(6),
}).strict();

const stepSchema = z.object({
  title: text(limits.step_title.textRange.absoluteMax),
  body: text(limits.step_body.textRange.absoluteMax),
}).strict();

const stepsSchema = z.object({
  kind: z.literal("steps"),
  layout: z.literal("numbered"),
  heading: text(limits.h2.textRange.absoluteMax),
  intro: nullableText(limits.paragraph.textRange.absoluteMax),
  items: z.array(stepSchema).min(2).max(5),
}).strict();

const faqItemSchema = z.object({
  question: text(limits.faq_question.textRange.absoluteMax),
  answer: text(limits.faq_answer.textRange.absoluteMax),
}).strict();

const faqSchema = z.object({
  kind: z.literal("faq"),
  layout: z.literal("accordion"),
  heading: text(limits.h2.textRange.absoluteMax),
  items: z.array(faqItemSchema).min(2).max(6),
}).strict();

const ctaSchema = z.object({
  kind: z.literal("cta"),
  layout: z.literal("centered"),
  heading: text(limits.h2.textRange.absoluteMax),
  body: nullableText(limits.paragraph.textRange.absoluteMax),
  ctaLabel: text(limits.cta_label.textRange.absoluteMax),
}).strict();

const footerSchema = z.object({
  kind: z.literal("footer"),
  layout: z.literal("standard"),
  tagline: nullableText(limits.privacy_note.textRange.absoluteMax),
}).strict();

export const landingPagePresentationSectionSchema = z.discriminatedUnion("kind", [
  headerSchema,
  heroSchema,
  textMediaSchema,
  cardsGridSchema,
  stepsSchema,
  faqSchema,
  ctaSchema,
  footerSchema,
]);

export const landingPagePresentationCandidateSchema = z.object({
  contractVersion: z.literal(LANDING_PAGE_PRESENTATION_CONTRACT_VERSION),
  sections: z.array(landingPagePresentationSectionSchema).min(4).max(10),
}).strict();

export type LandingPagePresentationSection = z.infer<
  typeof landingPagePresentationSectionSchema
>;
export type LandingPagePresentationCandidate = z.infer<
  typeof landingPagePresentationCandidateSchema
>;

export type LandingPagePresentationValidationErrorCode =
  | "INVALID_SCHEMA"
  | "INVALID_SECTION_ORDER"
  | "INVALID_SECTION_CARDINALITY"
  | "UNSUPPORTED_ADDITIONAL_MEDIA"
  | "MODEL_GENERATED_BINDING"
  | "UNAUTHORIZED_OBJECTIVE_CLAIM";

export type LandingPagePresentationValidationResult =
  | Readonly<{ ok: true; value: LandingPagePresentationCandidate }>
  | Readonly<{
      ok: false;
      error: Readonly<{
        code: LandingPagePresentationValidationErrorCode;
        message: string;
      }>;
    }>;

const generatedSchema = z.toJSONSchema(landingPagePresentationCandidateSchema, {
  target: "draft-7",
});
const { $schema: _schemaDialect, ...structuredOutputSchema } = generatedSchema;

export const landingPagePresentationJsonSchema = deepFreeze(
  structuredOutputSchema,
) as Readonly<Record<string, unknown>>;

export function validateLandingPagePresentationCandidate(
  candidate: unknown,
  authorizedModelContext: unknown,
): LandingPagePresentationValidationResult {
  const parsed = landingPagePresentationCandidateSchema.safeParse(candidate);
  if (!parsed.success) {
    return invalid("INVALID_SCHEMA", "Candidate does not match presentation contract v1");
  }

  const sections = parsed.data.sections;
  const counts = countKinds(sections);
  if (
    counts.hero !== 1 ||
    counts.cta < 1 ||
    counts.cta > 2 ||
    counts.header > 1 ||
    counts.footer > 1 ||
    counts.text_media > 3 ||
    counts.cards_grid > 2 ||
    counts.steps > 1 ||
    counts.faq > 1
  ) {
    return invalid(
      "INVALID_SECTION_CARDINALITY",
      "Candidate violates section cardinality",
    );
  }

  const startsWithHeader = sections[0]?.kind === "header";
  const firstContentIndex = startsWithHeader ? 1 : 0;
  if (
    sections[firstContentIndex]?.kind !== "hero" ||
    sections.some((section, index) => section.kind === "header" && index !== 0) ||
    sections.some(
      (section, index) =>
        section.kind === "footer" && index !== sections.length - 1,
    )
  ) {
    return invalid(
      "INVALID_SECTION_ORDER",
      "Header, hero or footer is outside its canonical position",
    );
  }

  if (
    sections.some(
      (section) => section.kind === "text_media" && section.mediaBrief !== null,
    )
  ) {
    return invalid(
      "UNSUPPORTED_ADDITIONAL_MEDIA",
      "Presentation contract v1 generates only the hero image",
    );
  }

  const copy = collectStrings(parsed.data);
  if (copy.some(isModelGeneratedBinding)) {
    return invalid(
      "MODEL_GENERATED_BINDING",
      "Candidate contains a URL, contact, identifier or asset path",
    );
  }

  const authority = normalize(JSON.stringify(authorizedModelContext));
  const unsupportedClaim = copy.find(
    (value) => isObjectiveClaim(value) && !authority.includes(normalize(value)),
  );
  if (unsupportedClaim) {
    return invalid(
      "UNAUTHORIZED_OBJECTIVE_CLAIM",
      "Candidate contains an objective claim absent from modelContext",
    );
  }

  return { ok: true, value: deepFreeze(parsed.data) };
}

function countKinds(sections: readonly LandingPagePresentationSection[]) {
  const counts: Record<LandingPagePresentationSection["kind"], number> = {
    header: 0,
    hero: 0,
    text_media: 0,
    cards_grid: 0,
    steps: 0,
    faq: 0,
    cta: 0,
    footer: 0,
  };
  for (const section of sections) counts[section.kind] += 1;
  return counts;
}

function collectStrings(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap(collectStrings);
  if (value && typeof value === "object") {
    return Object.values(value).flatMap(collectStrings);
  }
  return [];
}

function isModelGeneratedBinding(value: string) {
  return (
    /https?:\/\/|www\.|[\w.+-]+@[\w.-]+\.[a-z]{2,}/i.test(value) ||
    /(?:\+?55\s*)?(?:\(?\d{2}\)?\s*)?9?\d{4}[-\s]?\d{4}/.test(value) ||
    /\b[0-9a-f]{8}-[0-9a-f-]{27,}\b/i.test(value) ||
    /(?:^|\s)(?:bucket|asset|storage|path)\s*[:=]/i.test(value)
  );
}

function isObjectiveClaim(value: string) {
  return /\b(?:creci|registro|certificad[oa]|licen[çc]a|garanti[ad]|comprovad[oa]|clientes? atendid[oa]s?|im[oó]vel dispon[ií]vel|r\$\s*\d|\d+(?:[.,]\d+)?\s*%|endere[çc]o)\b/i.test(
    value,
  );
}

function normalize(value: string) {
  return value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function invalid(
  code: LandingPagePresentationValidationErrorCode,
  message: string,
): LandingPagePresentationValidationResult {
  return { ok: false, error: { code, message } };
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    for (const nested of Object.values(value)) deepFreeze(nested);
    Object.freeze(value);
  }
  return value;
}
