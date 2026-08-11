import { z } from "zod";

export const LANDING_PAGE_MATERIALIZED_CONTENT_SCHEMA_VERSION = 1 as const;
export const LANDING_PAGE_GENERATION_CONTEXT_SNAPSHOT_VERSION = 1 as const;

const semanticRoleKeys = [
  "eyebrow", "h1", "h2", "h3", "paragraph", "cta_label", "privacy_note",
  "faq_question", "faq_answer", "card_title", "card_body", "benefit_item",
  "step_label", "step_title", "step_body",
] as const;
const visualRoleKeys = [
  "primary_action", "focus_indicator", "border", "surface", "text", "state",
] as const;
const spacingValues = ["compact", "default", "spacious"] as const;

const nonEmpty = z.string().trim().min(1);
const sizeValue = z.string().regex(/^\d+(?:\.\d+)?(?:rem|ch)$/);
const textRange = z.object({
  recommended: z.object({ min: z.number().int().min(1), max: z.number().int().min(1) }).strict(),
  absoluteMax: z.number().int().min(1),
}).strict().superRefine((value, context) => {
  if (value.recommended.min > value.recommended.max || value.recommended.max > value.absoluteMax) {
    context.addIssue({ code: "custom", message: "invalid materialized text range" });
  }
});
const semanticRole = z.object({ key: z.enum(semanticRoleKeys), textRange }).strict();
const visualRole = z.object({ key: z.enum(visualRoleKeys), description: nonEmpty }).strict();
const typography = z.object({
  h1: z.object({ min: sizeValue, max: sizeValue }).strict(),
  h2: z.object({ min: sizeValue, max: sizeValue }).strict(),
  h3: z.object({ min: sizeValue, max: sizeValue }).strict(),
  body: z.object({ base: sizeValue, editorialEmphasis: sizeValue.optional() }).strict(),
  support: sizeValue,
}).strict();
const preset = z.object({
  key: nonEmpty,
  density: z.enum(spacingValues),
  defaultSectionSpacing: z.enum(spacingValues),
  maxPageWidth: sizeValue,
  maxReadingWidth: sizeValue,
  typography,
}).strict();
const visualCriteria = z.object({
  accessibilityBaseline: nonEmpty,
  claimsFullWcagConformance: z.literal(false),
  mobileFirst: z.literal(true),
  minViewportPx: z.number().int().min(1),
  evidenceViewportsPx: z.array(z.number().int().min(1)).min(1),
  noTextTruncation: z.literal(true),
  noHorizontalScrollFromText: z.literal(true),
  bodyTextMinSize: sizeValue,
  supportTextMinSize: sizeValue,
  minInteractiveTargetPx: z.object({ width: z.number().int().min(1), height: z.number().int().min(1) }).strict(),
  readingLineWidthCh: z.object({ min: z.number().int().min(1), max: z.number().int().min(1), target: z.number().int().min(1) }).strict(),
  h1MobileLineTarget: z.number().int().min(1),
  h2MobileLineTarget: z.number().int().min(1),
  semanticHierarchy: z.tuple([z.literal("h1"), z.literal("h2"), z.literal("h3")]),
  visibleFocusRequired: z.literal(true),
  visualHierarchyFollowsSemantic: z.literal(true),
  contrastRequired: z.literal(true),
  legibilityRequired: z.literal(true),
  accessibleNavigationRequired: z.literal(true),
  interactiveStatesRequired: z.literal(true),
}).strict();

const materializedRoot = z.object({
  rootVersion: z.number().int().min(1),
  resolvedPresetKey: nonEmpty,
  resolvedPreset: preset,
  effectiveSemanticRoles: z.record(z.string(), semanticRole),
  visualRoles: z.record(z.string(), visualRole),
  visualCriteria,
}).strict().superRefine((value, context) => {
  validateExactKeys(value.effectiveSemanticRoles, semanticRoleKeys, context, ["effectiveSemanticRoles"]);
  validateExactKeys(value.visualRoles, visualRoleKeys, context, ["visualRoles"]);
  if (value.resolvedPreset.key !== value.resolvedPresetKey) {
    context.addIssue({ code: "custom", path: ["resolvedPreset"], message: "materialized preset identity mismatch" });
  }
});

const textField = z.object({ kind: z.literal("text"), fieldKey: nonEmpty, value: nonEmpty }).strict();
const technicalReferenceField = z.object({
  kind: z.literal("technical_reference"),
  fieldKey: nonEmpty,
  referenceKey: nonEmpty,
  value: nonEmpty,
}).strict();
const collection = z.object({
  kind: z.literal("collection"),
  fieldKey: nonEmpty,
  items: z.array(z.object({
    fields: z.array(z.discriminatedUnion("kind", [textField, technicalReferenceField])).min(1),
  }).strict()).min(1),
}).strict();
const action = z.object({
  kind: z.literal("action"),
  fieldKey: nonEmpty,
  label: nonEmpty,
  binding: z.object({
    fieldKey: z.literal("primary_conversion_channel"),
    channel: nonEmpty,
    destination: z.union([nonEmpty, z.null()]),
  }).strict(),
}).strict();
const image = z.object({ kind: z.literal("image"), fieldKey: nonEmpty, reference: nonEmpty }).strict();
const materializedField = z.discriminatedUnion("kind", [textField, collection, action, image, technicalReferenceField]);

const formInteraction = z.object({
  kind: z.literal("form"),
  fields: z.array(z.object({
    fieldKey: nonEmpty,
    valueType: z.enum(["text", "email", "phone"]),
    obligation: z.enum(["required", "optional"]),
    purposeKey: nonEmpty,
  }).strict()).min(1),
  consent: z.object({
    required: z.literal(true),
    fieldKey: nonEmpty,
    purposeKey: nonEmpty,
    privacyPolicyInputFieldKey: nonEmpty,
  }).strict(),
  accessibility: z.object({
    baseline: z.literal("WCAG 2.2"),
    labelsProgrammaticallyAssociated: z.literal(true),
    instructionsProgrammaticallyAssociated: z.literal(true),
    errorsProgrammaticallyAssociated: z.literal(true),
    keyboardOperable: z.literal(true),
    focusMovesToFirstInvalidField: z.literal(true),
  }).strict(),
  operationalBinding: z.object({
    inputCatalogFieldKey: z.literal("primary_conversion_channel"),
    requiredValue: z.literal("form"),
  }).strict(),
}).strict();
const accordionInteraction = z.object({
  kind: z.literal("accordion"),
  baseline: z.literal("WCAG 2.2"),
  keyboardOperable: z.literal(true),
  exposesExpandedState: z.literal(true),
  associatesControlAndRegion: z.literal(true),
  preservesFocus: z.literal(true),
  initiallyCollapsed: z.literal(true),
  singleExpandedItem: z.literal(true),
}).strict();

const materializedModule = z.object({
  moduleKey: nonEmpty,
  moduleVersion: z.number().int().min(1),
  variantKey: nonEmpty,
  variantVersion: z.number().int().min(1),
  fieldContractKey: nonEmpty,
  interactionContracts: z.array(z.discriminatedUnion("kind", [formInteraction, accordionInteraction])),
  fields: z.array(materializedField),
}).strict();

export const landingPageMaterializedContentV1Schema = z.object({
  schemaVersion: z.literal(LANDING_PAGE_MATERIALIZED_CONTENT_SCHEMA_VERSION),
  family: z.literal("landing_page"),
  root: materializedRoot,
  modules: z.array(materializedModule).min(1),
}).strict().superRefine((content, context) => {
  const moduleKeys = new Set<string>();
  for (const [moduleIndex, module] of content.modules.entries()) {
    const identity = `${module.moduleKey}@v${module.moduleVersion}`;
    if (moduleKeys.has(identity)) {
      context.addIssue({ code: "custom", path: ["modules", moduleIndex], message: "duplicate materialized module" });
    }
    moduleKeys.add(identity);
    validateMaterializedModule(module, moduleIndex, context);
  }
});

const jsonValue: z.ZodType<unknown> = z.lazy(() => z.union([
  z.string(), z.number().finite(), z.boolean(), z.null(), z.array(jsonValue), z.record(z.string(), jsonValue),
]));

export const landingPageGenerationContextSnapshotV1Schema = z.object({
  snapshotVersion: z.literal(LANDING_PAGE_GENERATION_CONTEXT_SNAPSHOT_VERSION),
  generationContextContractVersion: z.literal(1),
  structuralIdentities: z.object({
    planKey: nonEmpty,
    servedTaxonId: nonEmpty,
    generationProfileId: nonEmpty,
    versions: z.record(z.string(), jsonValue),
    modules: z.array(z.object({
      order: z.number().int().min(0),
      moduleKey: nonEmpty,
      moduleVersion: z.number().int().min(1),
      variantKey: nonEmpty,
      variantVersion: z.number().int().min(1),
      fieldContractKey: nonEmpty,
    }).strict()).min(1),
  }).strict(),
  exposedGenerationContext: z.record(z.string(), jsonValue),
}).strict().superRefine((snapshot, context) => {
  if (containsForbiddenSnapshotKey(snapshot.exposedGenerationContext)) {
    context.addIssue({ code: "custom", path: ["exposedGenerationContext"], message: "snapshot contains forbidden provider metadata" });
  }
});

export type LandingPageMaterializedContentV1 = z.infer<typeof landingPageMaterializedContentV1Schema>;
export type LandingPageGenerationContextSnapshotV1 = z.infer<typeof landingPageGenerationContextSnapshotV1Schema>;

export function validateLandingPageMaterializedContentV1(input: unknown) {
  const parsed = landingPageMaterializedContentV1Schema.safeParse(input);
  return parsed.success
    ? { ok: true as const, value: deepFreeze(structuredClone(parsed.data)) }
    : { ok: false as const, error: "INVALID_MATERIALIZED_CONTENT" as const };
}

export function validateLandingPageGenerationContextSnapshotV1(input: unknown) {
  const parsed = landingPageGenerationContextSnapshotV1Schema.safeParse(input);
  return parsed.success
    ? { ok: true as const, value: deepFreeze(structuredClone(parsed.data)) }
    : { ok: false as const, error: "INVALID_GENERATION_CONTEXT_SNAPSHOT" as const };
}

export function resolveLandingPageMaterializedContentForRendering(input: unknown) {
  return validateLandingPageMaterializedContentV1(input);
}

function validateMaterializedModule(
  module: z.infer<typeof materializedModule>,
  moduleIndex: number,
  context: z.RefinementCtx,
) {
  const prefix = `${module.moduleKey}.`;
  const suffix = `@v${module.variantVersion}`;
  if (!module.variantKey.startsWith(prefix) || !module.variantKey.endsWith(suffix) || module.variantKey === `${prefix}${suffix}`) {
    context.addIssue({ code: "custom", path: ["modules", moduleIndex, "variantKey"], message: "variant module mismatch" });
  }
  if (module.fieldContractKey !== module.variantKey) {
    context.addIssue({ code: "custom", path: ["modules", moduleIndex, "fieldContractKey"], message: "materialized field contract identity mismatch" });
  }
  const byKey = new Map(module.fields.map((field) => [field.fieldKey, field]));
  if (byKey.size !== module.fields.length) {
    context.addIssue({ code: "custom", path: ["modules", moduleIndex, "fields"], message: "duplicate materialized field" });
    return;
  }
  for (const [fieldIndex, field] of module.fields.entries()) {
    if (field.kind === "collection") {
      for (const [itemIndex, item] of field.items.entries()) {
        const itemKeys = new Set(item.fields.map((candidate) => candidate.fieldKey));
        if (itemKeys.size !== item.fields.length) {
          context.addIssue({ code: "custom", path: ["modules", moduleIndex, "fields", fieldIndex, "items", itemIndex], message: "duplicate collection field" });
        }
      }
    }
  }
}

function validateExactKeys(
  actual: Record<string, unknown>,
  expected: readonly string[],
  context: z.RefinementCtx,
  path: (string | number)[],
) {
  const actualKeys = Object.keys(actual).sort();
  const expectedKeys = [...expected].sort();
  if (actualKeys.length !== expectedKeys.length || actualKeys.some((key, index) => key !== expectedKeys[index])) {
    context.addIssue({ code: "custom", path, message: "materialized role keys mismatch" });
  }
}

function containsForbiddenSnapshotKey(value: unknown): boolean {
  if (Array.isArray(value)) return value.some(containsForbiddenSnapshotKey);
  if (!value || typeof value !== "object") return false;
  const forbidden = new Set(["safety_identifier", "apiKey", "secret", "systemPrompt", "responseId", "generatedContent"]);
  return Object.entries(value).some(([key, nested]) => forbidden.has(key) || containsForbiddenSnapshotKey(nested));
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    for (const nested of Object.values(value)) deepFreeze(nested);
    Object.freeze(value);
  }
  return value;
}
