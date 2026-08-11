import type { OpenAiReasoningEffort } from "../openai-workloads";
import type { LandingPageGenerationContextPackage } from "./generationContextContracts";
import {
  LANDING_PAGE_DRAFT_CANDIDATE_VERSION,
  type LandingPageDraftCandidate,
  type LandingPageDraftFieldValue,
} from "./landingPageGenerationContracts";

const REQUEST_MAX_BYTES = 256_000;
const MIN_OUTPUT_TOKENS = 512;
const MAX_OUTPUT_TOKENS = 16_384;

type JsonSchema = Readonly<Record<string, unknown>>;
type SelectedModule = LandingPageGenerationContextPackage["partA"]["modules"][number];
type FieldDefinition = SelectedModule["fieldContract"]["fields"][number];
type TextFieldDefinition = Extract<FieldDefinition, { fieldKind: "text" }>;
type CollectionFieldDefinition = Extract<FieldDefinition, { fieldKind: "collection" }>;
type CollectionItemFieldDefinition = CollectionFieldDefinition["itemFields"][number];

type FieldSlot = Readonly<{
  slotKey: string;
  field: FieldDefinition;
  resolvedReference?: Readonly<{ referenceKey: string; value: unknown }>;
  itemSlots?: readonly Readonly<{
    slotKey: string;
    field: CollectionItemFieldDefinition;
    referenceValues?: readonly unknown[];
  }>[];
}>;

type ModuleSlot = Readonly<{
  slotKey: string;
  selectedModule: LandingPageGenerationContextPackage["partA"]["modules"][number];
  fieldSlots: readonly FieldSlot[];
}>;

export type LandingPageDraftGenerationRequest = Readonly<{
  ok: true;
  body: Readonly<Record<string, unknown>>;
  serialized: string;
  bytes: number;
  maxOutputTokens: number;
  exposedGenerationContext: Readonly<Record<string, unknown>>;
  moduleSlots: readonly ModuleSlot[];
}> | Readonly<{
  ok: false;
  kind: "request_invalid" | "request_too_large";
}>;

export function buildLandingPageDraftGenerationRequest(input: Readonly<{
  context: LandingPageGenerationContextPackage;
  model: string;
  reasoningEffort: OpenAiReasoningEffort;
  safetyIdentifier: string;
}>): LandingPageDraftGenerationRequest {
  if (!isGenerationContextUsable(input.context) || !nonEmpty(input.safetyIdentifier)) {
    return { ok: false, kind: "request_invalid" };
  }

  const moduleSlots: ModuleSlot[] = [];
  const moduleProperties: Record<string, JsonSchema> = {};
  let maximumCharacters = 0;

  for (const [moduleIndex, selectedModule] of input.context.partA.modules.entries()) {
    const slotKey = `module_${String(moduleIndex + 1).padStart(3, "0")}`;
    const fieldSlots: FieldSlot[] = [];
    const fieldProperties: Record<string, JsonSchema> = {};
    const requiredFields: string[] = [];

    for (const [fieldIndex, field] of selectedModule.fieldContract.fields.entries()) {
      const fieldSlotKey = `field_${String(fieldIndex + 1).padStart(3, "0")}`;
      const built = buildFieldSchema(field, selectedModule.effectiveRoot, input.context.partB.facts);
      if (!built.ok) return { ok: false, kind: "request_invalid" };
      fieldProperties[fieldSlotKey] = built.schema;
      requiredFields.push(fieldSlotKey);
      maximumCharacters += built.maximumCharacters;
      fieldSlots.push({
        slotKey: fieldSlotKey,
        field,
        ...(built.resolvedReference ? { resolvedReference: built.resolvedReference } : {}),
        ...(built.itemSlots ? { itemSlots: built.itemSlots } : {}),
      });
    }

    moduleProperties[slotKey] = {
      type: "object",
      additionalProperties: false,
      required: ["fields"],
      properties: {
        fields: {
          type: "object",
          additionalProperties: false,
          required: requiredFields,
          properties: fieldProperties,
        },
      },
    };
    moduleSlots.push({ slotKey, selectedModule, fieldSlots });
  }

  if (moduleSlots.length === 0) return { ok: false, kind: "request_invalid" };

  const exposedGenerationContext = deepFreeze({
    generationContextContractVersion: input.context.contractVersion,
    planKey: input.context.partA.planKey,
    servedTaxon: input.context.partA.servedTaxon,
    versions: input.context.partA.versions,
    root: input.context.partA.root,
    modules: moduleSlots.map(({ slotKey, selectedModule, fieldSlots }) => ({
      slotKey,
      order: selectedModule.recommendedOrder,
      priority: selectedModule.priority,
      module: selectedModule.module,
      variant: selectedModule.variant,
      effectiveRoot: selectedModule.effectiveRoot,
      fields: fieldSlots.map(({ slotKey: fieldSlotKey, field, itemSlots }) => ({
        slotKey: fieldSlotKey,
        field,
        ...(itemSlots ? { itemSlots: itemSlots.map((item) => ({ slotKey: item.slotKey, field: item.field })) } : {}),
      })),
    })),
    authorizedContent: input.context.partB,
  });

  const maxOutputTokens = Math.min(
    MAX_OUTPUT_TOKENS,
    Math.max(MIN_OUTPUT_TOKENS, Math.ceil(maximumCharacters / 3) + moduleSlots.length * 96),
  );
  const body = {
    model: input.model,
    reasoning: { effort: input.reasoningEffort },
    store: false,
    safety_identifier: input.safetyIdentifier,
    max_output_tokens: maxOutputTokens,
    input: [
      {
        role: "system",
        content: [{ type: "input_text", text: SYSTEM_PROMPT }],
      },
      {
        role: "user",
        content: [{ type: "input_text", text: JSON.stringify(exposedGenerationContext) }],
      },
    ],
    text: {
      format: {
        type: "json_schema",
        name: "landing_page_draft_candidate_v1",
        strict: true,
        schema: {
          type: "object",
          additionalProperties: false,
          required: ["modules"],
          properties: {
            modules: {
              type: "object",
              additionalProperties: false,
              required: moduleSlots.map((slot) => slot.slotKey),
              properties: moduleProperties,
            },
          },
        },
      },
    },
  } as const;
  const serialized = JSON.stringify(body);
  const bytes = Buffer.byteLength(serialized, "utf8");
  if (bytes > REQUEST_MAX_BYTES) return { ok: false, kind: "request_too_large" };
  return deepFreeze({
    ok: true,
    body,
    serialized,
    bytes,
    maxOutputTokens,
    exposedGenerationContext,
    moduleSlots,
  });
}

export function validateLandingPageDraftCandidate(
  payload: unknown,
  request: Extract<LandingPageDraftGenerationRequest, { ok: true }>,
): Readonly<{ ok: true; value: LandingPageDraftCandidate }> | Readonly<{ ok: false }> {
  if (!isExactRecord(payload, ["modules"]) || !isRecord(payload.modules)) return { ok: false };
  if (!hasExactKeys(payload.modules, request.moduleSlots.map((slot) => slot.slotKey))) return { ok: false };

  const modules: LandingPageDraftCandidate["modules"][number][] = [];
  for (const [index, moduleSlot] of request.moduleSlots.entries()) {
    const providerModule = payload.modules[moduleSlot.slotKey];
    if (!isExactRecord(providerModule, ["fields"]) || !isRecord(providerModule.fields)) return { ok: false };
    if (!hasExactKeys(providerModule.fields, moduleSlot.fieldSlots.map((slot) => slot.slotKey))) return { ok: false };

    const fields: Record<string, LandingPageDraftFieldValue> = {};
    for (const fieldSlot of moduleSlot.fieldSlots) {
      const normalized = normalizeFieldValue(
        providerModule.fields[fieldSlot.slotKey],
        fieldSlot,
        moduleSlot.selectedModule.effectiveRoot,
        request.exposedGenerationContext,
      );
      if (!normalized.ok) return { ok: false };
      if (!normalized.absent) fields[fieldSlot.field.fieldKey] = normalized.value;
    }
    const selected = moduleSlot.selectedModule;
    modules.push({
      order: index,
      moduleKey: selected.module.moduleKey,
      moduleVersion: selected.module.moduleVersion,
      variantKey: selected.variant.variantKey,
      variantVersion: selected.variant.variantVersion,
      fieldContractKey: selected.fieldContract.fieldContractKey,
      interactionContracts: selected.variant.interactionContracts,
      fields,
    });
  }

  return { ok: true, value: deepFreeze({ candidateVersion: LANDING_PAGE_DRAFT_CANDIDATE_VERSION, modules }) };
}

function buildFieldSchema(
  field: FieldDefinition,
  effectiveRoot: SelectedModule["effectiveRoot"],
  facts: LandingPageGenerationContextPackage["partB"]["facts"],
): Readonly<{
  ok: true;
  schema: JsonSchema;
  maximumCharacters: number;
  resolvedReference?: FieldSlot["resolvedReference"];
  itemSlots?: FieldSlot["itemSlots"];
}> | Readonly<{ ok: false }> {
  if (field.fieldKind === "text") {
    const schema = textSchema(field, effectiveRoot);
    return { ok: true, schema, maximumCharacters: textMaximum(field, effectiveRoot) };
  }
  if (field.fieldKind === "action") {
    const maximumCharacters = textMaximum(field.label, effectiveRoot);
    return {
      ok: true,
      maximumCharacters,
      schema: {
        type: "object",
        additionalProperties: false,
        required: ["label"],
        properties: { label: textSchema(field.label, effectiveRoot) },
      },
    };
  }
  if (field.fieldKind === "image" || field.fieldKind === "technical_reference") {
    const fact = facts.find((candidate) => candidate.fieldKey === field.path);
    if (!fact) {
      if (field.cardinality.min > 0) return { ok: false };
      return { ok: true, maximumCharacters: 0, schema: { type: "null" } };
    }
    if (fact.value === undefined || fact.value === null) return { ok: false };
    return {
      ok: true,
      maximumCharacters: 0,
      schema: { type: "null" },
      resolvedReference: { referenceKey: field.path, value: fact.value },
    };
  }

  let referenceItemCount: number | null = null;
  const itemSlots: NonNullable<FieldSlot["itemSlots"]>[number][] = [];
  for (const [index, itemField] of field.itemFields.entries()) {
    const slotKey = `item_field_${String(index + 1).padStart(3, "0")}`;
    if (itemField.fieldKind === "text") {
      itemSlots.push({ slotKey, field: itemField });
      continue;
    }
    const fact = facts.find((candidate) => candidate.fieldKey === itemField.path);
    const referenceValues = fact ? normalizeReferenceValues(fact.value) : null;
    if (
      !referenceValues ||
      referenceValues.length < field.cardinality.min ||
      referenceValues.length > field.cardinality.max ||
      (referenceItemCount !== null && referenceItemCount !== referenceValues.length)
    ) {
      return { ok: false };
    }
    referenceItemCount = referenceValues.length;
    itemSlots.push({ slotKey, field: itemField, referenceValues });
  }
  const itemProperties = Object.fromEntries(itemSlots.map((slot) => [
    slot.slotKey,
    slot.field.fieldKind === "text"
      ? textSchema(slot.field, effectiveRoot)
      : { type: "null" },
  ]));
  const itemMaximum = field.itemFields.reduce(
    (total, itemField) => total + (itemField.fieldKind === "text" ? textMaximum(itemField, effectiveRoot) : 0),
    0,
  );
  return {
    ok: true,
    itemSlots,
    maximumCharacters: itemMaximum * field.cardinality.max,
    schema: {
      type: "array",
      minItems: referenceItemCount ?? field.cardinality.min,
      maxItems: referenceItemCount ?? field.cardinality.max,
      items: {
        type: "object",
        additionalProperties: false,
        required: itemSlots.map((slot) => slot.slotKey),
        properties: itemProperties,
      },
    },
  };
}

function normalizeFieldValue(
  providerValue: unknown,
  fieldSlot: FieldSlot,
  effectiveRoot: LandingPageGenerationContextPackage["partA"]["modules"][number]["effectiveRoot"],
  exposedContext: Readonly<Record<string, unknown>>,
):
  | Readonly<{ ok: true; absent: false; value: LandingPageDraftFieldValue }>
  | Readonly<{ ok: true; absent: true }>
  | Readonly<{ ok: false }> {
  const field = fieldSlot.field;
  if (field.fieldKind === "text") {
    if (!validText(providerValue, field, effectiveRoot)) return { ok: false };
    return providerValue === null
      ? { ok: true, absent: true }
      : { ok: true, absent: false, value: { kind: "text", value: providerValue as string } };
  }
  if (field.fieldKind === "image") {
    if (providerValue !== null) return { ok: false };
    return fieldSlot.resolvedReference
      ? { ok: true, absent: false, value: { kind: "image", reference: fieldSlot.resolvedReference.value } }
      : { ok: true, absent: true };
  }
  if (field.fieldKind === "technical_reference") {
    if (providerValue !== null || !fieldSlot.resolvedReference) return { ok: false };
    return {
      ok: true,
      absent: false,
      value: {
        kind: "technical_reference",
        referenceKey: fieldSlot.resolvedReference.referenceKey,
        value: fieldSlot.resolvedReference.value,
      },
    };
  }
  if (field.fieldKind === "action") {
    if (!isExactRecord(providerValue, ["label"]) || !validText(providerValue.label, field.label, effectiveRoot)) {
      return { ok: false };
    }
    const facts = readFacts(exposedContext);
    const channel = facts.find((fact) => fact.fieldKey === "primary_conversion_channel")?.value;
    if (typeof channel !== "string" || !channel.trim()) return { ok: false };
    const destination = facts.find((fact) => fact.fieldKey === `${channel}_destination`)?.value ?? null;
    return {
      ok: true,
      absent: false,
      value: {
        kind: "action",
        label: providerValue.label as string,
        binding: { fieldKey: "primary_conversion_channel", channel, destination },
      },
    };
  }
  if (!Array.isArray(providerValue) || providerValue.length < field.cardinality.min || providerValue.length > field.cardinality.max) {
    return { ok: false };
  }
  const itemSlots = fieldSlot.itemSlots ?? [];
  const items: Array<{ fields: Record<string, LandingPageDraftFieldValue & ({ kind: "text" } | { kind: "technical_reference" })> }> = [];
  for (const [itemIndex, providerItem] of providerValue.entries()) {
    if (!isRecord(providerItem) || !hasExactKeys(providerItem, itemSlots.map((slot) => slot.slotKey))) return { ok: false };
    const fields: Record<string, LandingPageDraftTextValue | Extract<LandingPageDraftFieldValue, { kind: "technical_reference" }>> = {};
    for (const itemSlot of itemSlots) {
      if (itemSlot.field.fieldKind === "technical_reference") {
        if (providerItem[itemSlot.slotKey] !== null || !itemSlot.referenceValues || itemIndex >= itemSlot.referenceValues.length) {
          return { ok: false };
        }
        fields[itemSlot.field.fieldKey] = {
          kind: "technical_reference",
          referenceKey: itemSlot.field.path,
          value: itemSlot.referenceValues[itemIndex],
        };
        continue;
      }
      if (!validText(providerItem[itemSlot.slotKey], itemSlot.field, effectiveRoot)) return { ok: false };
      fields[itemSlot.field.fieldKey] = { kind: "text", value: providerItem[itemSlot.slotKey] as string };
    }
    items.push({ fields });
  }
  return { ok: true, absent: false, value: { kind: "collection", items } };
}

type LandingPageDraftTextValue = Extract<LandingPageDraftFieldValue, { kind: "text" }>;

function textSchema(
  field: TextFieldDefinition,
  effectiveRoot: LandingPageGenerationContextPackage["partA"]["modules"][number]["effectiveRoot"],
): JsonSchema {
  const scalar = { type: "string", minLength: 1, maxLength: textMaximum(field, effectiveRoot) } as const;
  return field.cardinality.min === 0 ? { anyOf: [scalar, { type: "null" }] } : scalar;
}

function textMaximum(
  field: TextFieldDefinition,
  effectiveRoot: LandingPageGenerationContextPackage["partA"]["modules"][number]["effectiveRoot"],
) {
  return effectiveRoot.semanticRoles[field.semanticRole].textRange.absoluteMax;
}

function validText(
  value: unknown,
  field: TextFieldDefinition,
  effectiveRoot: LandingPageGenerationContextPackage["partA"]["modules"][number]["effectiveRoot"],
) {
  if (value === null) return field.cardinality.min === 0;
  return typeof value === "string" && value.trim() === value && value.length > 0 && value.length <= textMaximum(field, effectiveRoot);
}

function normalizeReferenceValues(value: unknown): readonly unknown[] | null {
  if (Array.isArray(value)) {
    return value.length > 0 && value.every((item) => item !== null && item !== undefined)
      ? value
      : null;
  }
  return value === null || value === undefined ? null : [value];
}

function readFacts(context: Readonly<Record<string, unknown>>): readonly Readonly<{ fieldKey: string; value: unknown }>[] {
  const authorized = isRecord(context.authorizedContent) ? context.authorizedContent : null;
  if (!authorized || !Array.isArray(authorized.facts)) return [];
  return authorized.facts.filter(
    (fact): fact is Readonly<{ fieldKey: string; value: unknown }> => isRecord(fact) && typeof fact.fieldKey === "string",
  );
}

function isGenerationContextUsable(context: unknown): context is LandingPageGenerationContextPackage {
  return isRecord(context) && context.contractVersion === 1 && isRecord(context.partA) &&
    isRecord(context.partB) && Array.isArray(context.partA.modules) && context.partA.modules.length > 0;
}

function hasExactKeys(value: Record<string, unknown>, expected: readonly string[]) {
  const actual = Object.keys(value).sort();
  const sortedExpected = [...expected].sort();
  return actual.length === sortedExpected.length && actual.every((key, index) => key === sortedExpected[index]);
}

function isExactRecord(value: unknown, keys: readonly string[]): value is Record<string, unknown> {
  return isRecord(value) && hasExactKeys(value, keys);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function nonEmpty(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    for (const nested of Object.values(value)) deepFreeze(nested);
    Object.freeze(value);
  }
  return value;
}

const SYSTEM_PROMPT = [
  "Gere somente a copy da candidata da landing page em draft a partir do contexto autorizado.",
  "Preencha exatamente os slots recebidos, sem acrescentar, remover, reordenar ou identificar módulos e campos.",
  "Respeite os limites de texto, as fontes autorizadas, os critérios do root, o perfil de funil e as orientações por módulo.",
  "Não invente fatos, provas, credenciais, resultados, preços, garantias, urgência, escassez, destinos, assets ou referências técnicas.",
  "Valores null são omissões autorizadas e não devem ser substituídos por conteúdo inventado.",
  "Devolva somente o JSON exigido pelo schema.",
].join("\n\n");
