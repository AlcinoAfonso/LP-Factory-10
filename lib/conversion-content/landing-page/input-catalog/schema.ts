import { z } from "zod";

import {
  landingPageInputCatalogEvidenceReferences,
  landingPageInputCatalogPlans,
  landingPageInputColorPaletteRoles,
  type LandingPageInputFieldDefinition,
  type LandingPageInputValueValidationResult,
} from "./contracts";
import { isLandingPageOfferingScope } from "./offering-scope";

const nonEmptyText = z.string().trim().min(1);
const fieldKeySchema = z.string().regex(/^[a-z][a-z0-9_]*$/);
const planSchema = z.enum(landingPageInputCatalogPlans);
const layerLevelSchema = z.enum([
  "universal",
  "segment",
  "niche",
  "ultra_niche",
]);
const taxonLevelSchema = z.enum(["segment", "niche", "ultra_niche"]);

export const landingPageInputCatalogTaxonIdentitySchema = z
  .object({
    id: z.uuid(),
    name: nonEmptyText,
    slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    level: taxonLevelSchema,
    isActive: z.boolean(),
    parentId: z.uuid().nullable(),
  })
  .strict();

export const landingPageInputConditionSchema = z
  .object({
    fieldKey: fieldKeySchema,
    operator: z.enum(["equals", "in"]),
    value: z.union([
      nonEmptyText,
      z.boolean(),
      z.array(nonEmptyText).min(1),
    ]),
  })
  .strict()
  .superRefine((condition, context) => {
    if (condition.operator === "in" && !Array.isArray(condition.value)) {
      context.addIssue({
        code: "custom",
        path: ["value"],
        message: "in requires an array value",
      });
    }
    if (condition.operator === "equals" && Array.isArray(condition.value)) {
      context.addIssue({
        code: "custom",
        path: ["value"],
        message: "equals requires a scalar value",
      });
    }
  });

const validationSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("type_only") }).strict(),
  z
    .object({
      kind: z.literal("enum"),
      allowedValues: z.array(nonEmptyText).min(1),
    })
    .strict(),
  z
    .object({
      kind: z.literal("string_list"),
      allowedValues: z.array(nonEmptyText).min(1).optional(),
      minItems: z.number().int().min(1).optional(),
      maxItems: z.number().int().min(1).optional(),
    })
    .strict()
    .superRefine((validation, context) => {
      for (const key of ["allowedValues", "minItems", "maxItems"] as const) {
        if (Object.hasOwn(validation, key) && validation[key] === undefined) {
          context.addIssue({
            code: "custom",
            path: [key],
            message: "unset string-list constraints must be omitted",
          });
        }
      }
      if (
        validation.minItems !== undefined &&
        validation.maxItems !== undefined &&
        validation.minItems > validation.maxItems
      ) {
        context.addIssue({ code: "custom", message: "list limits are inverted" });
      }
    }),
  z
    .object({
      kind: z.literal("number_range"),
      currency: z.literal("BRL"),
      minimum: z.number().finite().min(0).optional(),
      maximum: z.number().finite().min(0).optional(),
    })
    .strict()
    .superRefine((validation, context) => {
      if (
        validation.minimum !== undefined &&
        validation.maximum !== undefined &&
        validation.minimum > validation.maximum
      ) {
        context.addIssue({ code: "custom", message: "range limits are inverted" });
      }
    }),
  z.object({ kind: z.literal("e164") }).strict(),
  z.object({ kind: z.literal("email") }).strict(),
  z.object({ kind: z.literal("https_url") }).strict(),
  z.object({ kind: z.literal("keyword_map") }).strict(),
  z.object({ kind: z.literal("asset_reference") }).strict(),
  z.object({ kind: z.literal("color_palette") }).strict(),
  z.object({ kind: z.literal("offering_scope") }).strict(),
]);

const evidenceSchema = z
  .object({
    summary: nonEmptyText,
    references: z
      .array(z.enum(landingPageInputCatalogEvidenceReferences))
      .min(1),
  })
  .strict();

const capabilityBindingSchema = z
  .object({
    slotKey: z.literal("applicable_capabilities"),
    supportedWhenValue: z.literal(true),
  })
  .strict();

export const landingPageInputFieldDefinitionSchema = z
  .object({
    kind: z.literal("field"),
    fieldKey: fieldKeySchema,
    purpose: nonEmptyText,
    originLayer: layerLevelSchema,
    originTaxon: landingPageInputCatalogTaxonIdentitySchema.optional(),
    valueType: z.enum([
      "string",
      "phone",
      "email",
      "url",
      "enum",
      "string_list",
      "boolean",
      "number_range",
      "keyword_map",
      "asset_reference",
      "color_palette",
      "offering_scope",
    ]),
    valueScope: z.enum([
      "account",
      "business",
      "offer",
      "campaign",
      "landing_page",
    ]),
    expectedValueOrigin: z.enum([
      "account_provided",
      "business_provided",
      "offer_provided",
      "campaign_provided",
      "landing_page_provided",
    ]),
    obligation: z.enum(["required", "optional", "conditional"]),
    requiredWhen: landingPageInputConditionSchema.optional(),
    applicableWhen: landingPageInputConditionSchema.optional(),
    validation: validationSchema,
    allowedPlans: z.array(planSchema).min(1),
    snapshotPolicy: z.literal("include_if_used"),
    landingPageSubstitutionPolicy: z
      .enum(["not_applicable", "forbidden", "explicit_allowed"])
      .optional(),
    capabilityBindings: z.array(capabilityBindingSchema).min(1).optional(),
    evidence: evidenceSchema,
    createdInVersion: z.number().int().min(1),
    retiredInVersion: z.number().int().min(2).optional(),
  })
  .strict()
  .superRefine((field, context) => {
    if (field.originLayer === "universal" && field.originTaxon) {
      context.addIssue({ code: "custom", path: ["originTaxon"], message: "universal field cannot have a taxon" });
    }
    if (field.originLayer !== "universal" && !field.originTaxon) {
      context.addIssue({ code: "custom", path: ["originTaxon"], message: "taxon layer requires a taxon" });
    }
    if (field.originTaxon && field.originTaxon.level !== field.originLayer) {
      context.addIssue({ code: "custom", path: ["originTaxon", "level"], message: "origin taxon level mismatch" });
    }
    if (field.obligation === "conditional" && !field.requiredWhen) {
      context.addIssue({ code: "custom", path: ["requiredWhen"], message: "conditional field requires requiredWhen" });
    }
    if (field.obligation !== "conditional" && field.requiredWhen) {
      context.addIssue({ code: "custom", path: ["requiredWhen"], message: "non-conditional field cannot declare requiredWhen" });
    }
    if (field.requiredWhen?.fieldKey === field.fieldKey || field.applicableWhen?.fieldKey === field.fieldKey) {
      context.addIssue({ code: "custom", message: "field condition cannot reference itself" });
    }
    if (new Set(field.allowedPlans).size !== field.allowedPlans.length) {
      context.addIssue({ code: "custom", path: ["allowedPlans"], message: "plans must be unique" });
    }
    if (
      field.capabilityBindings &&
      new Set(field.capabilityBindings.map((binding) => binding.slotKey)).size !==
        field.capabilityBindings.length
    ) {
      context.addIssue({
        code: "custom",
        path: ["capabilityBindings"],
        message: "capability binding slots must be unique",
      });
    }
    if (field.capabilityBindings && field.valueType !== "boolean") {
      context.addIssue({
        code: "custom",
        path: ["capabilityBindings"],
        message: "capability bindings require a boolean field",
      });
    }
    if (field.createdInVersion >= 2 && !field.landingPageSubstitutionPolicy) {
      context.addIssue({
        code: "custom",
        path: ["landingPageSubstitutionPolicy"],
        message: "fields created in v2 or later require an explicit landing-page substitution policy",
      });
    }
    if (
      field.retiredInVersion !== undefined &&
      field.retiredInVersion <= field.createdInVersion
    ) {
      context.addIssue({
        code: "custom",
        path: ["retiredInVersion"],
        message: "retirement must be forward-only",
      });
    }
    if (
      field.landingPageSubstitutionPolicy &&
      field.valueScope === "landing_page" &&
      field.landingPageSubstitutionPolicy !== "not_applicable"
    ) {
      context.addIssue({
        code: "custom",
        path: ["landingPageSubstitutionPolicy"],
        message: "landing-page scoped fields require not_applicable substitution policy",
      });
    }
    if (
      field.landingPageSubstitutionPolicy === "not_applicable" &&
      field.valueScope !== "landing_page"
    ) {
      context.addIssue({
        code: "custom",
        path: ["landingPageSubstitutionPolicy"],
        message: "reusable fields cannot use not_applicable substitution policy",
      });
    }
    validateValueTypeAndValidation(field, context);
  });

export const landingPageInputFieldSpecializationSchema = z
  .object({
    kind: z.literal("specialization"),
    fieldKey: fieldKeySchema,
    changes: z.record(z.string(), z.unknown()),
  })
  .strict();

export const landingPageInputCatalogLayerSchema = z
  .object({
    level: layerLevelSchema,
    taxon: landingPageInputCatalogTaxonIdentitySchema.optional(),
    entries: z.array(
      z.union([
        landingPageInputFieldDefinitionSchema,
        landingPageInputFieldSpecializationSchema,
      ]),
    ),
  })
  .strict()
  .superRefine((layer, context) => {
    if (layer.level === "universal" && layer.taxon) {
      context.addIssue({ code: "custom", path: ["taxon"], message: "universal layer cannot have a taxon" });
    }
    if (layer.level !== "universal" && !layer.taxon) {
      context.addIssue({ code: "custom", path: ["taxon"], message: "taxon layer requires identity" });
    }
    if (layer.taxon && layer.taxon.level !== layer.level) {
      context.addIssue({ code: "custom", path: ["taxon", "level"], message: "layer and taxon level mismatch" });
    }
  });

export function validateLandingPageInputValue(
  field: LandingPageInputFieldDefinition,
  value: unknown,
): LandingPageInputValueValidationResult {
  const valid = validateValue(field, value);
  return valid
    ? { ok: true }
    : { ok: false, error: { code: "INVALID_VALUE", message: `Invalid value for ${field.fieldKey}` } };
}

function validateValue(field: LandingPageInputFieldDefinition, value: unknown): boolean {
  switch (field.valueType) {
    case "string":
      return typeof value === "string" && value.trim().length > 0;
    case "phone":
      return typeof value === "string" && /^\+[1-9]\d{7,14}$/.test(value);
    case "email":
      return typeof value === "string" && z.string().trim().email().safeParse(value).success;
    case "url": {
      if (typeof value !== "string") return false;
      try {
        return new URL(value).protocol === "https:";
      } catch {
        return false;
      }
    }
    case "enum":
      return typeof value === "string" && field.validation.kind === "enum" && field.validation.allowedValues.includes(value);
    case "boolean":
      return typeof value === "boolean";
    case "string_list":
      return validateStringList(field, value);
    case "number_range":
      return validateNumberRange(field, value);
    case "keyword_map":
      return validateKeywordMap(value);
    case "asset_reference":
      return field.validation.kind === "asset_reference" && validateAssetReference(value);
    case "color_palette":
      return field.validation.kind === "color_palette" && validateColorPalette(value);
    case "offering_scope":
      return field.validation.kind === "offering_scope" && isLandingPageOfferingScope(value);
  }
}

function validateStringList(field: LandingPageInputFieldDefinition, value: unknown): boolean {
  if (!Array.isArray(value) || value.length === 0 || !value.every((item) => typeof item === "string" && item.trim())) return false;
  const normalized = value.map((item) => item.trim().toLocaleLowerCase("pt-BR"));
  if (new Set(normalized).size !== normalized.length) return false;
  if (field.validation.kind !== "string_list") return false;
  if (field.validation.minItems !== undefined && value.length < field.validation.minItems) return false;
  if (field.validation.maxItems !== undefined && value.length > field.validation.maxItems) return false;
  return !field.validation.allowedValues || normalized.every((item) => field.validation.kind === "string_list" && field.validation.allowedValues?.some((allowed) => allowed.toLocaleLowerCase("pt-BR") === item));
}

function validateNumberRange(field: LandingPageInputFieldDefinition, value: unknown): boolean {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const range = value as Record<string, unknown>;
  if (Object.keys(range).some((key) => !["minimum", "maximum", "currency"].includes(key))) return false;
  if (typeof range.minimum !== "number" || typeof range.maximum !== "number" || range.currency !== "BRL") return false;
  if (!Number.isFinite(range.minimum) || !Number.isFinite(range.maximum) || range.minimum < 0 || range.minimum > range.maximum) return false;
  if (field.validation.kind !== "number_range") return false;
  if (field.validation.minimum !== undefined && range.minimum < field.validation.minimum) return false;
  return field.validation.maximum === undefined || range.maximum <= field.validation.maximum;
}

function validateKeywordMap(value: unknown): boolean {
  if (!Array.isArray(value) || value.length === 0) return false;
  const seen = new Set<string>();
  for (const item of value) {
    if (!item || typeof item !== "object" || Array.isArray(item)) return false;
    const mapItem = item as Record<string, unknown>;
    if (Object.keys(mapItem).some((key) => !["keyword_or_cluster", "message_anchor", "ad_context"].includes(key))) return false;
    if (typeof mapItem.keyword_or_cluster !== "string" || !mapItem.keyword_or_cluster.trim()) return false;
    if (typeof mapItem.message_anchor !== "string" || !mapItem.message_anchor.trim()) return false;
    if (mapItem.ad_context !== undefined && (typeof mapItem.ad_context !== "string" || !mapItem.ad_context.trim())) return false;
    const normalized = mapItem.keyword_or_cluster.trim().toLocaleLowerCase("pt-BR");
    if (seen.has(normalized)) return false;
    seen.add(normalized);
  }
  return true;
}

function validateAssetReference(value: unknown): boolean {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const reference = value as Record<string, unknown>;
  if (Object.keys(reference).length !== 1 || typeof reference.asset_id !== "string") return false;
  const assetId = reference.asset_id.trim();
  const hasUriScheme = /^[a-z][a-z0-9+.-]*:/i.test(assetId);
  const isNetworkReference = /^(?:\/\/|\\\\)/.test(assetId);
  return assetId.length > 0 && !hasUriScheme && !isNetworkReference;
}

function validateColorPalette(value: unknown): boolean {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const palette = value as Record<string, unknown>;
  const allowedRoles = new Set<string>(landingPageInputColorPaletteRoles);
  const keys = Object.keys(palette);
  if (keys.length !== landingPageInputColorPaletteRoles.length || keys.some((key) => !allowedRoles.has(key))) return false;
  return landingPageInputColorPaletteRoles.every((role) => typeof palette[role] === "string" && /^#[0-9a-fA-F]{6}$/.test(palette[role]));
}

function validateValueTypeAndValidation(field: z.infer<typeof landingPageInputFieldDefinitionSchema>, context: z.RefinementCtx) {
  const expectedKind: Partial<Record<typeof field.valueType, typeof field.validation.kind>> = {
    phone: "e164",
    email: "email",
    url: "https_url",
    enum: "enum",
    string_list: "string_list",
    number_range: "number_range",
    keyword_map: "keyword_map",
    asset_reference: "asset_reference",
    color_palette: "color_palette",
    offering_scope: "offering_scope",
  };
  const expected = expectedKind[field.valueType];
  if (expected && field.validation.kind !== expected) {
    context.addIssue({ code: "custom", path: ["validation"], message: "validation is incompatible with value type" });
  }
  if ((field.valueType === "string" || field.valueType === "boolean") && field.validation.kind !== "type_only") {
    context.addIssue({ code: "custom", path: ["validation"], message: "type-only field has incompatible validation" });
  }
}
