import { z } from "zod";

import { factualFieldExpectedOrigins, factualFieldObligations, factualFieldValueScopes, factualFieldValueTypes, factualTaxonLevels } from "./contracts";

const nonEmptyText = z.string().trim().min(1);
export const factualFieldKeySchema = z.string().regex(/^[a-z][a-z0-9_]*$/);

export const factualTaxonIdentitySchema = z.object({
  id: z.uuid(), name: nonEmptyText, slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  level: z.enum(factualTaxonLevels), isActive: z.boolean(), parentId: z.uuid().nullable(),
}).strict();
export const factualFieldConditionSchema = z.object({
  fieldKey: factualFieldKeySchema, operator: z.enum(["equals", "in"]),
  value: z.union([nonEmptyText, z.boolean(), z.array(nonEmptyText).min(1)]),
}).strict().superRefine((condition, context) => {
  if (condition.operator === "in" && !Array.isArray(condition.value)) context.addIssue({ code: "custom", path: ["value"], message: "in requires a string array" });
  if (condition.operator === "equals" && Array.isArray(condition.value)) context.addIssue({ code: "custom", path: ["value"], message: "equals requires a scalar" });
});

const uniqueTexts = z.array(nonEmptyText).min(1).superRefine((values, context) => {
  if (new Set(values).size !== values.length) context.addIssue({ code: "custom", message: "values must be unique" });
});

export const factualFieldValidationSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("type_only") }).strict(),
  z.object({ kind: z.literal("enum"), allowedValues: uniqueTexts }).strict(),
  z.object({ kind: z.literal("string_list"), allowedValues: uniqueTexts.optional(), minItems: z.number().int().min(1).optional(), maxItems: z.number().int().min(1).optional() }).strict().superRefine((value, context) => {
    if (value.minItems !== undefined && value.maxItems !== undefined && value.minItems > value.maxItems) context.addIssue({ code: "custom", message: "list limits are inverted" });
  }),
  z.object({ kind: z.literal("number_range"), currency: z.literal("BRL"), minimum: z.number().finite().min(0).optional(), maximum: z.number().finite().min(0).optional() }).strict().superRefine((value, context) => {
    if (value.minimum !== undefined && value.maximum !== undefined && value.minimum > value.maximum) context.addIssue({ code: "custom", message: "range limits are inverted" });
  }),
  ...(["e164", "email", "https_url", "keyword_map", "asset_reference", "color_palette", "offering_scope"] as const).map((kind) => z.object({ kind: z.literal(kind) }).strict()),
]);

const originByScope = { account: "account_provided", business: "business_provided", offer: "offer_provided", campaign: "campaign_provided", landing_page: "landing_page_provided" } as const;
const validationByType: Partial<Record<(typeof factualFieldValueTypes)[number], string>> = {
  phone: "e164", email: "email", url: "https_url", enum: "enum", string_list: "string_list", number_range: "number_range",
  keyword_map: "keyword_map", asset_reference: "asset_reference", color_palette: "color_palette", offering_scope: "offering_scope",
};

export const factualFieldDefinitionSchema = z.object({
  purpose: nonEmptyText, valueType: z.enum(factualFieldValueTypes), valueScope: z.enum(factualFieldValueScopes),
  expectedValueOrigin: z.enum(factualFieldExpectedOrigins), obligation: z.enum(factualFieldObligations),
  requiredWhen: factualFieldConditionSchema.optional(), applicableWhen: factualFieldConditionSchema.optional(), validation: factualFieldValidationSchema,
}).strict().superRefine((field, context) => {
  if (originByScope[field.valueScope] !== field.expectedValueOrigin) context.addIssue({ code: "custom", path: ["expectedValueOrigin"], message: "origin does not match scope" });
  if ((field.obligation === "conditional") !== Boolean(field.requiredWhen)) context.addIssue({ code: "custom", path: ["requiredWhen"], message: "requiredWhen must match conditional obligation" });
  const expected = validationByType[field.valueType];
  if (expected && field.validation.kind !== expected) context.addIssue({ code: "custom", path: ["validation"], message: "validation does not match valueType" });
  if ((field.valueType === "string" || field.valueType === "boolean") && field.validation.kind !== "type_only") context.addIssue({ code: "custom", path: ["validation"], message: "type_only validation required" });
});

export const factualFieldRowSchema = z.object({
  id: z.uuid(), fieldKey: factualFieldKeySchema, taxonId: z.uuid().nullable(), definition: factualFieldDefinitionSchema,
  isActive: z.boolean(), createdBy: z.uuid().nullable(), updatedBy: z.uuid().nullable(), createdAt: z.iso.datetime({ offset: true }), updatedAt: z.iso.datetime({ offset: true }),
}).strict();
