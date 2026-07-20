import { z } from "zod";

import {
  landingPageFieldPolicies,
  landingPageFieldSupports,
  landingPageModuleKeys,
  landingPageVariantFieldContractKeys,
  type LandingPageModuleKey,
  type LandingPageVariantFieldContractKey,
} from "./contracts";
import { landingPageModuleCatalogRegistry } from "./registry";

const nonEmptyPlainText = z
  .string()
  .trim()
  .min(1)
  .refine((value) => !containsFreeMarkupOrRendererHint(value), {
    message: "text must not contain markup, scripts, styles or renderer hints",
  });

const fieldKeySchema = z.string().regex(/^[a-z][A-Za-z0-9]*$/);
const fieldPathSchema = z
  .string()
  .regex(/^[a-z][a-z0-9_]*(?:\.[A-Za-z][A-Za-z0-9]*|\.[A-Za-z][A-Za-z0-9]*\[\]\.[A-Za-z][A-Za-z0-9]*)+$/);
const cardinalitySchema = z
  .object({
    min: z.number().int().min(0),
    max: z.number().int().min(1),
  })
  .strict()
  .superRefine((cardinality, context) => {
    if (cardinality.min > cardinality.max) {
      context.addIssue({
        code: "custom",
        message: "cardinality is inverted",
      });
    }
  });

const textFieldSchema = z
  .object({
    fieldKind: z.literal("text"),
    fieldKey: fieldKeySchema,
    path: fieldPathSchema,
    cardinality: cardinalitySchema,
    policy: z.enum(landingPageFieldPolicies),
    semanticRole: nonEmptyPlainText,
    support: z.enum(landingPageFieldSupports).optional(),
  })
  .strict();

const technicalReferenceFieldSchema = z
  .object({
    fieldKind: z.literal("technical_reference"),
    fieldKey: fieldKeySchema,
    path: fieldPathSchema,
    cardinality: cardinalitySchema,
    policy: z.literal("technical_reference"),
  })
  .strict();

const collectionItemFieldSchema = z.discriminatedUnion("fieldKind", [
  textFieldSchema,
  technicalReferenceFieldSchema,
]);

const collectionFieldSchema = z
  .object({
    fieldKind: z.literal("collection"),
    fieldKey: fieldKeySchema,
    path: fieldPathSchema,
    cardinality: cardinalitySchema,
    policy: z.literal("not_copy"),
    itemFields: z.array(collectionItemFieldSchema).min(1),
  })
  .strict();

const actionFieldSchema = z
  .object({
    fieldKind: z.literal("action"),
    fieldKey: fieldKeySchema,
    path: fieldPathSchema,
    cardinality: cardinalitySchema,
    policy: z.literal("not_copy"),
    label: textFieldSchema,
    operationalBinding: z.literal("primary_conversion_channel"),
  })
  .strict();

const imageFieldSchema = z
  .object({
    fieldKind: z.literal("image"),
    fieldKey: fieldKeySchema,
    path: fieldPathSchema,
    cardinality: cardinalitySchema,
    policy: z.literal("technical_reference"),
    alternativeTextRequiredWhenInformative: z.literal(true),
  })
  .strict();

const fieldDefinitionSchema = z.discriminatedUnion("fieldKind", [
  textFieldSchema,
  collectionFieldSchema,
  actionFieldSchema,
  imageFieldSchema,
  technicalReferenceFieldSchema,
]);

const variantFieldContractSchema = z
  .object({
    fieldContractKey: z.enum(landingPageVariantFieldContractKeys),
    fields: z.array(fieldDefinitionSchema).min(1),
  })
  .strict()
  .superRefine((contract, context) => {
    const prefix = contract.fieldContractKey.replace("@v1", "");
    validateUniqueFieldIdentities(contract.fields, context);

    for (const [fieldIndex, field] of contract.fields.entries()) {
      if (!field.path.startsWith(`${prefix}.`)) {
        context.addIssue({
          code: "custom",
          path: ["fields", fieldIndex, "path"],
          message: "field path does not belong to its contract",
        });
      }

      if (field.fieldKind === "collection") {
        validateUniqueFieldIdentities(field.itemFields, context, [
          "fields",
          fieldIndex,
          "itemFields",
        ]);
        for (const [itemIndex, itemField] of field.itemFields.entries()) {
          if (!itemField.path.startsWith(`${field.path}[].`)) {
            context.addIssue({
              code: "custom",
              path: ["fields", fieldIndex, "itemFields", itemIndex, "path"],
              message: "collection item path does not belong to its collection",
            });
          }
        }
      }

      if (
        field.fieldKind === "action" &&
        !field.label.path.startsWith(`${field.path}.`)
      ) {
        context.addIssue({
          code: "custom",
          path: ["fields", fieldIndex, "label", "path"],
          message: "action label path does not belong to its action",
        });
      }
    }
  });

const moduleDefinitionSchema = z
  .object({
    family: z.literal("landing_page"),
    moduleKey: z.enum(landingPageModuleKeys),
    moduleVersion: z.literal(1),
    lifecycleStatus: z.literal("hypothesis"),
    purpose: z.literal("controlled_test"),
    structuralFunction: nonEmptyPlainText,
    invariants: z.array(nonEmptyPlainText).min(1),
    boundaries: z.array(nonEmptyPlainText).min(1),
  })
  .strict()
  .superRefine((module, context) => {
    validateUniqueText(module.invariants, "invariants", context);
    validateUniqueText(module.boundaries, "boundaries", context);
  });

export const landingPageModuleCatalogSchema = z
  .object({
    family: z.literal("landing_page"),
    moduleCatalogVersion: z.literal(1),
    compatibleRootVersions: z.tuple([z.literal(1)]),
    modules: z.record(z.string(), moduleDefinitionSchema),
    variantFieldContracts: z.record(z.string(), variantFieldContractSchema),
  })
  .strict()
  .superRefine((catalog, context) => {
    const expectedKeys = new Set<string>(landingPageModuleKeys);
    const actualKeys = Object.keys(catalog.modules);

    for (const key of actualKeys) {
      if (!expectedKeys.has(key)) {
        context.addIssue({
          code: "custom",
          path: ["modules", key],
          message: "unknown module key",
        });
      }
    }

    for (const key of landingPageModuleKeys) {
      if (!actualKeys.includes(key)) {
        context.addIssue({
          code: "custom",
          path: ["modules", key],
          message: "required module missing",
        });
      }
    }

    for (const [key, module] of Object.entries(catalog.modules)) {
      if (module.moduleKey !== key) {
        context.addIssue({
          code: "custom",
          path: ["modules", key, "moduleKey"],
          message: "module key mismatch",
        });
      }

      if (!expectedKeys.has(key)) continue;
      const canonical =
        landingPageModuleCatalogRegistry.modules[key as LandingPageModuleKey];

      if (module.structuralFunction !== canonical.structuralFunction) {
        context.addIssue({
          code: "custom",
          path: ["modules", key, "structuralFunction"],
          message: "structural function differs from the canonical registry",
        });
      }
      validateCanonicalTextList({
        actual: module.invariants,
        canonical: canonical.invariants,
        context,
        path: ["modules", key, "invariants"],
      });
      validateCanonicalTextList({
        actual: module.boundaries,
        canonical: canonical.boundaries,
        context,
        path: ["modules", key, "boundaries"],
      });
    }

    const expectedFieldContractKeys = new Set<string>(
      landingPageVariantFieldContractKeys,
    );
    const actualFieldContractKeys = Object.keys(catalog.variantFieldContracts);

    validateExactKeys({
      actual: actualFieldContractKeys,
      expected: expectedFieldContractKeys,
      context,
      path: ["variantFieldContracts"],
      label: "field contract",
    });

    for (const [key, contract] of Object.entries(
      catalog.variantFieldContracts,
    )) {
      if (contract.fieldContractKey !== key) {
        context.addIssue({
          code: "custom",
          path: ["variantFieldContracts", key, "fieldContractKey"],
          message: "field contract key mismatch",
        });
      }

      if (!expectedFieldContractKeys.has(key)) continue;
      const canonical =
        landingPageModuleCatalogRegistry.variantFieldContracts[
          key as LandingPageVariantFieldContractKey
        ];
      if (JSON.stringify(contract) !== JSON.stringify(canonical)) {
        context.addIssue({
          code: "custom",
          path: ["variantFieldContracts", key],
          message: "field contract differs from the canonical registry",
        });
      }
    }
  });

function containsFreeMarkupOrRendererHint(value: string): boolean {
  return /<[^>]+>|<\/|script|style=|class=|className=|tailwind|component|props/i.test(
    value,
  );
}

function validateUniqueText(
  values: readonly string[],
  path: "invariants" | "boundaries",
  context: z.RefinementCtx,
) {
  if (new Set(values).size !== values.length) {
    context.addIssue({
      code: "custom",
      path: [path],
      message: `${path} must be unique`,
    });
  }
}

function validateCanonicalTextList(input: {
  actual: readonly string[];
  canonical: readonly string[];
  context: z.RefinementCtx;
  path: (string | number)[];
}) {
  const matches =
    input.actual.length === input.canonical.length &&
    input.actual.every((value, index) => value === input.canonical[index]);

  if (!matches) {
    input.context.addIssue({
      code: "custom",
      path: input.path,
      message: "structural values differ from the canonical registry",
    });
  }
}

function validateUniqueFieldIdentities(
  fields: readonly { fieldKey: string; path: string }[],
  context: z.RefinementCtx,
  path: (string | number)[] = ["fields"],
) {
  for (const property of ["fieldKey", "path"] as const) {
    const values = fields.map((field) => field[property]);
    if (new Set(values).size !== values.length) {
      context.addIssue({
        code: "custom",
        path,
        message: `${property} values must be unique`,
      });
    }
  }
}

function validateExactKeys(input: {
  actual: readonly string[];
  expected: Set<string>;
  context: z.RefinementCtx;
  path: (string | number)[];
  label: string;
}) {
  for (const key of input.actual) {
    if (!input.expected.has(key)) {
      input.context.addIssue({
        code: "custom",
        path: [...input.path, key],
        message: `unknown ${input.label}`,
      });
    }
  }
  for (const key of input.expected) {
    if (!input.actual.includes(key)) {
      input.context.addIssue({
        code: "custom",
        path: [...input.path, key],
        message: `required ${input.label} missing`,
      });
    }
  }
}
