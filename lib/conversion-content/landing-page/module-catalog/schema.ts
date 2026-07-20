import { z } from "zod";

import {
  landingPageCapabilityKeys,
  landingPageFieldKinds,
  landingPageFieldPolicies,
  landingPageFieldSupports,
  landingPageModuleKeys,
  landingPageModuleLifecycleStatuses,
  landingPageVariantKeys,
  type LandingPageFieldDefinition,
  type LandingPageModuleDefinition,
  type LandingPageModuleKey,
} from "./contracts";
import {
  landingPageModuleCatalogRegistry,
  landingPageModuleFieldCatalogRegistry,
  landingPageModuleVariantCatalogRegistry,
} from "./registry";
import { landingPageRootSemanticRoleKeys } from "../root-schema";

const identifierSchema = z.string().regex(/^[a-z][a-z0-9_]*$/);
const rootDeltaSchema = z.object({}).strict();
const uniqueIdentifiersSchema = z
  .array(identifierSchema)
  .min(1)
  .superRefine((values, context) => {
    if (new Set(values).size !== values.length) {
      context.addIssue({
        code: "custom",
        message: "structural identifiers must be unique",
      });
    }
  });

const fieldPathSchema = z
  .string()
  .regex(/^[a-z][a-zA-Z0-9]*(?:\[\])?(?:\.[a-z][a-zA-Z0-9]*)?$/);
const cardinalitySchema = z
  .object({
    min: z.number().int().min(0),
    max: z.number().int().min(0),
  })
  .strict()
  .superRefine((cardinality, context) => {
    if (cardinality.min > cardinality.max) {
      context.addIssue({
        code: "custom",
        message: "field cardinality is inverted",
      });
    }
  });

const textFieldDefinitionSchema = z
  .object({
    path: fieldPathSchema,
    fieldKind: z.literal(landingPageFieldKinds[0]),
    semanticRole: z.enum(landingPageRootSemanticRoleKeys),
    cardinality: cardinalitySchema,
    policy: z.enum([
      landingPageFieldPolicies[0],
      landingPageFieldPolicies[1],
      landingPageFieldPolicies[2],
    ]),
    support: z.enum(landingPageFieldSupports),
  })
  .strict()
  .superRefine((field, context) => {
    if (
      field.policy === "operational_required" &&
      field.support !== "when_present"
    ) {
      context.addIssue({
        code: "custom",
        path: ["support"],
        message: "operational required text needs when_present support",
      });
    }
  });

const collectionFieldDefinitionSchema = z
  .object({
    path: fieldPathSchema,
    fieldKind: z.literal(landingPageFieldKinds[1]),
    cardinality: cardinalitySchema,
    policy: z.literal("not_copy"),
    ordered: z.literal(true).optional(),
  })
  .strict();

const actionFieldDefinitionSchema = z
  .object({
    path: fieldPathSchema,
    fieldKind: z.literal(landingPageFieldKinds[2]),
    cardinality: cardinalitySchema,
    policy: z.literal("not_copy"),
  })
  .strict();

const imageFieldDefinitionSchema = z
  .object({
    path: fieldPathSchema,
    fieldKind: z.literal(landingPageFieldKinds[3]),
    cardinality: cardinalitySchema,
    policy: z.literal("technical_reference"),
    visibility: z.literal("all_viewports"),
  })
  .strict();

const referenceFieldDefinitionSchema = z
  .object({
    path: fieldPathSchema,
    fieldKind: z.literal(landingPageFieldKinds[4]),
    cardinality: cardinalitySchema,
    policy: z.literal("technical_reference"),
    referenceKind: z.literal("operational_evidence"),
  })
  .strict();

const fieldDefinitionSchema = z
  .discriminatedUnion("fieldKind", [
    textFieldDefinitionSchema,
    collectionFieldDefinitionSchema,
    actionFieldDefinitionSchema,
    imageFieldDefinitionSchema,
    referenceFieldDefinitionSchema,
  ])
  .superRefine((field, context) => {
    if (field.fieldKind !== "collection" && field.cardinality.max > 1) {
      context.addIssue({
        code: "custom",
        path: ["cardinality", "max"],
        message: "non-collection fields allow at most one value",
      });
    }
  });

const moduleFieldDefinitionSchema = z
  .object({
    moduleKey: z.enum(landingPageModuleKeys),
    moduleVersion: z.literal(1),
    fields: z.record(z.string(), fieldDefinitionSchema),
  })
  .strict()
  .superRefine((moduleDefinition, context) => {
    validateFieldPaths(moduleDefinition.fields, context);
  });

export const landingPageModuleFieldCatalogEntrySchema = z
  .object({
    moduleCatalogVersion: z.literal(1),
    modules: z.record(z.string(), moduleFieldDefinitionSchema),
  })
  .strict()
  .superRefine((catalog, context) => {
    validateExactValues({
      context,
      path: ["modules"],
      actual: Object.keys(catalog.modules),
      expected: landingPageModuleKeys,
    });

    for (const [moduleKey, moduleDefinition] of Object.entries(
      catalog.modules,
    )) {
      if (moduleDefinition.moduleKey !== moduleKey) {
        context.addIssue({
          code: "custom",
          path: ["modules", moduleKey, "moduleKey"],
          message: "module field identity must match its registry key",
        });
      }

      const canonicalModule =
        landingPageModuleFieldCatalogRegistry[1].modules[
          moduleKey as LandingPageModuleKey
        ];
      if (
        moduleDefinition.moduleVersion === 1 &&
        canonicalModule &&
        !isDeepEqual(moduleDefinition.fields, canonicalModule.fields)
      ) {
        context.addIssue({
          code: "custom",
          path: ["modules", moduleKey, "fields"],
          message: "module fields must match the approved v1 contract",
        });
      }
    }
  });

const primaryActionCapabilitySchema = z
  .object({
    capabilityKey: z.literal("primary_action"),
    bindingFieldKey: z.literal("primary_conversion_channel"),
    allowedValues: z.tuple([
      z.literal("whatsapp"),
      z.literal("phone"),
      z.literal("email"),
      z.literal("external_url"),
    ]),
  })
  .strict();

const imageAssetCapabilitySchema = z
  .object({
    capabilityKey: z.literal("image_asset"),
    modes: z.tuple([z.literal("informative"), z.literal("decorative")]),
    visibility: z.literal("all_viewports"),
    informativeRequiresAltText: z.literal(true),
    decorativeRequiresEmptyAltText: z.literal(true),
  })
  .strict();

const accordionInteractionCapabilitySchema = z
  .object({
    capabilityKey: z.literal("accordion_interaction"),
    initialState: z.literal("all_closed"),
    expansionMode: z.literal("single"),
    toggleMode: z.literal("own_control"),
    keyboardRequired: z.literal(true),
    stateExposed: z.literal(true),
    controlContentAssociationRequired: z.literal(true),
    focusPreserved: z.literal(true),
    focusVisible: z.literal("inherited_from_root"),
    wcagBaseline: z.literal("2.2"),
  })
  .strict();

const capabilityDefinitionSchema = z.discriminatedUnion("capabilityKey", [
  primaryActionCapabilitySchema,
  imageAssetCapabilitySchema,
  accordionInteractionCapabilitySchema,
]);

const moduleVariantDefinitionSchema = z
  .object({
    variantKey: z.enum(landingPageVariantKeys),
    variantVersion: z.literal(1),
    lifecycleStatus: z.literal("hypothesis"),
    purpose: z.literal("controlled_test"),
    compatibleModuleVersion: z.literal(1),
    fields: z.record(z.string(), fieldDefinitionSchema),
    capabilities: z.array(z.enum(landingPageCapabilityKeys)),
    rootDelta: rootDeltaSchema,
  })
  .strict()
  .superRefine((variant, context) => {
    validateFieldPaths(variant.fields, context);
    if (new Set(variant.capabilities).size !== variant.capabilities.length) {
      context.addIssue({
        code: "custom",
        path: ["capabilities"],
        message: "variant capabilities must be unique",
      });
    }
  });

const moduleVariantCatalogModuleEntrySchema = z
  .object({
    moduleKey: z.enum(landingPageModuleKeys),
    moduleVersion: z.literal(1),
    rootDelta: rootDeltaSchema,
    variants: z.record(z.string(), moduleVariantDefinitionSchema),
  })
  .strict();

export const landingPageModuleVariantCatalogEntrySchema = z
  .object({
    moduleCatalogVersion: z.literal(1),
    capabilities: z.record(z.string(), capabilityDefinitionSchema),
    modules: z.record(z.string(), moduleVariantCatalogModuleEntrySchema),
  })
  .strict()
  .superRefine((catalog, context) => {
    validateExactValues({
      context,
      path: ["capabilities"],
      actual: Object.keys(catalog.capabilities),
      expected: landingPageCapabilityKeys,
    });
    validateExactValues({
      context,
      path: ["modules"],
      actual: Object.keys(catalog.modules),
      expected: landingPageModuleKeys,
    });

    for (const [capabilityKey, capability] of Object.entries(
      catalog.capabilities,
    )) {
      const canonicalCapability =
        landingPageModuleVariantCatalogRegistry[1].capabilities[
          capabilityKey as keyof typeof landingPageModuleVariantCatalogRegistry[1]["capabilities"]
        ];
      if (
        capability.capabilityKey !== capabilityKey ||
        !canonicalCapability ||
        !isDeepEqual(capability, canonicalCapability)
      ) {
        context.addIssue({
          code: "custom",
          path: ["capabilities", capabilityKey],
          message: "capability must match the approved v1 contract",
        });
      }
    }

    for (const [moduleKey, moduleEntry] of Object.entries(catalog.modules)) {
      const canonicalModule =
        landingPageModuleVariantCatalogRegistry[1].modules[
          moduleKey as LandingPageModuleKey
        ];
      if (
        moduleEntry.moduleKey !== moduleKey ||
        moduleEntry.moduleVersion !== canonicalModule?.moduleVersion
      ) {
        context.addIssue({
          code: "custom",
          path: ["modules", moduleKey],
          message: "variant module identity must match the approved v1 contract",
        });
      }
      if (!canonicalModule) continue;

      validateExactValues({
        context,
        path: ["modules", moduleKey, "variants"],
        actual: Object.keys(moduleEntry.variants),
        expected: Object.keys(canonicalModule.variants),
      });

      for (const [variantKey, variant] of Object.entries(
        moduleEntry.variants,
      )) {
        const canonicalVariant = canonicalModule.variants[variantKey];
        if (
          variant.variantKey !== variantKey ||
          variant.compatibleModuleVersion !== moduleEntry.moduleVersion ||
          !canonicalVariant ||
          !isDeepEqual(variant, canonicalVariant)
        ) {
          context.addIssue({
            code: "custom",
            path: ["modules", moduleKey, "variants", variantKey],
            message: "variant must match the approved v1 contract",
          });
        }
        validateCapabilityBindings({
          moduleKey,
          variantKey,
          variant,
          context,
        });
      }
    }
  });

export const landingPageModuleDefinitionSchema = z
  .object({
    moduleKey: z.enum(landingPageModuleKeys),
    moduleVersion: z.number().int().min(1),
    lifecycleStatus: z.enum(landingPageModuleLifecycleStatuses),
    purpose: z.literal("controlled_test"),
    function: identifierSchema,
    boundaries: uniqueIdentifiersSchema,
    invariants: uniqueIdentifiersSchema,
    rootDelta: rootDeltaSchema,
  })
  .strict();

export const landingPageModuleCatalogEntrySchema = z
  .object({
    family: z.literal("landing_page"),
    moduleCatalogVersion: z.number().int().min(1),
    compatibleRootVersions: z.array(z.number().int().min(1)).min(1),
    modules: z.record(z.string(), landingPageModuleDefinitionSchema),
  })
  .strict()
  .superRefine((catalog, context) => {
    if (
      new Set(catalog.compatibleRootVersions).size !==
      catalog.compatibleRootVersions.length
    ) {
      context.addIssue({
        code: "custom",
        path: ["compatibleRootVersions"],
        message: "compatible root versions must be unique",
      });
    }

    if (catalog.moduleCatalogVersion === 1) {
      validateExactValues({
        context,
        path: ["compatibleRootVersions"],
        actual: catalog.compatibleRootVersions,
        expected: [1],
      });
      validateExactValues({
        context,
        path: ["modules"],
        actual: Object.keys(catalog.modules),
        expected: landingPageModuleKeys,
      });

      for (const [moduleKey, moduleDefinition] of Object.entries(
        catalog.modules,
      )) {
        if (moduleDefinition.moduleKey !== moduleKey) {
          context.addIssue({
            code: "custom",
            path: ["modules", moduleKey, "moduleKey"],
            message: "module identity must match its registry key",
          });
        }
        if (moduleDefinition.moduleVersion !== 1) {
          context.addIssue({
            code: "custom",
            path: ["modules", moduleKey, "moduleVersion"],
            message: "module catalog v1 requires module version 1",
          });
        }
        if (moduleDefinition.lifecycleStatus !== "hypothesis") {
          context.addIssue({
            code: "custom",
            path: ["modules", moduleKey, "lifecycleStatus"],
            message: "module catalog v1 starts as hypothesis",
          });
        }

        const canonicalModule =
          landingPageModuleCatalogRegistry[1].modules[
            moduleKey as LandingPageModuleKey
          ];
        if (moduleDefinition.moduleVersion === 1 && canonicalModule) {
          validateExactModuleV1Structure({
            context,
            moduleKey,
            actual: moduleDefinition,
            expected: canonicalModule,
          });
        }
      }
    }
  });

function validateExactModuleV1Structure(input: {
  context: z.RefinementCtx;
  moduleKey: string;
  actual: LandingPageModuleDefinition;
  expected: LandingPageModuleDefinition;
}) {
  if (input.actual.function !== input.expected.function) {
    input.context.addIssue({
      code: "custom",
      path: ["modules", input.moduleKey, "function"],
      message: "module function must match the approved v1 contract",
    });
  }

  validateExactOrderedIdentifiers({
    context: input.context,
    path: ["modules", input.moduleKey, "boundaries"],
    actual: input.actual.boundaries,
    expected: input.expected.boundaries,
  });
  validateExactOrderedIdentifiers({
    context: input.context,
    path: ["modules", input.moduleKey, "invariants"],
    actual: input.actual.invariants,
    expected: input.expected.invariants,
  });
}

function validateFieldPaths(
  fields: Readonly<Record<string, LandingPageFieldDefinition>>,
  context: z.RefinementCtx,
) {
  for (const [fieldPath, fieldDefinition] of Object.entries(fields)) {
    if (fieldDefinition.path !== fieldPath) {
      context.addIssue({
        code: "custom",
        path: ["fields", fieldPath, "path"],
        message: "field path must match its registry key",
      });
    }

    const collectionChild = fieldPath.match(
      /^([a-z][a-zA-Z0-9]*)\[\]\.([a-z][a-zA-Z0-9]*)$/,
    );
    const objectChild = fieldPath.match(
      /^([a-z][a-zA-Z0-9]*)\.([a-z][a-zA-Z0-9]*)$/,
    );

    if (collectionChild) {
      const parent = fields[collectionChild[1]];
      if (!parent || parent.fieldKind !== "collection") {
        context.addIssue({
          code: "custom",
          path: ["fields", fieldPath],
          message: "collection child requires a declared collection parent",
        });
      }
      if (fieldDefinition.fieldKind === "collection") {
        context.addIssue({
          code: "custom",
          path: ["fields", fieldPath, "fieldKind"],
          message: "nested collections are not allowed",
        });
      }
    } else if (objectChild) {
      const parent = fields[objectChild[1]];
      if (!parent || parent.fieldKind !== "action") {
        context.addIssue({
          code: "custom",
          path: ["fields", fieldPath],
          message: "object child requires a declared action parent",
        });
      }
    } else if (fieldPath.includes(".") || fieldPath.includes("[]")) {
      context.addIssue({
        code: "custom",
        path: ["fields", fieldPath],
        message: "unknown field path structure",
      });
    }
  }

  for (const [fieldPath, fieldDefinition] of Object.entries(fields)) {
    if (
      fieldDefinition.fieldKind === "collection" &&
      !Object.keys(fields).some((path) => path.startsWith(`${fieldPath}[].`))
    ) {
      context.addIssue({
        code: "custom",
        path: ["fields", fieldPath],
        message: "collection requires a closed item contract",
      });
    }
    if (
      fieldDefinition.fieldKind === "action" &&
      !Object.keys(fields).some((path) => path.startsWith(`${fieldPath}.`))
    ) {
      context.addIssue({
        code: "custom",
        path: ["fields", fieldPath],
        message: "action requires a closed child contract",
      });
    }
  }
}

function validateCapabilityBindings(input: {
  moduleKey: string;
  variantKey: string;
  variant: {
    fields: Readonly<Record<string, LandingPageFieldDefinition>>;
    capabilities: readonly string[];
  };
  context: z.RefinementCtx;
}) {
  if (
    input.variant.capabilities.includes("primary_action") &&
    input.variant.fields.primaryCta?.fieldKind !== "action"
  ) {
    input.context.addIssue({
      code: "custom",
      path: [
        "modules",
        input.moduleKey,
        "variants",
        input.variantKey,
        "capabilities",
      ],
      message: "primary action capability requires the approved action field",
    });
  }
  if (
    input.variant.capabilities.includes("image_asset") &&
    input.variant.fields.media?.fieldKind !== "image"
  ) {
    input.context.addIssue({
      code: "custom",
      path: [
        "modules",
        input.moduleKey,
        "variants",
        input.variantKey,
        "capabilities",
      ],
      message: "image asset capability requires the approved image field",
    });
  }
  if (
    input.variant.capabilities.includes("accordion_interaction") &&
    (input.moduleKey !== "faq" || input.variantKey !== "accordion")
  ) {
    input.context.addIssue({
      code: "custom",
      path: [
        "modules",
        input.moduleKey,
        "variants",
        input.variantKey,
        "capabilities",
      ],
      message: "accordion interaction belongs only to faq accordion",
    });
  }
}

function isDeepEqual(left: unknown, right: unknown): boolean {
  if (Object.is(left, right)) return true;
  if (Array.isArray(left) || Array.isArray(right)) {
    return (
      Array.isArray(left) &&
      Array.isArray(right) &&
      left.length === right.length &&
      left.every((value, index) => isDeepEqual(value, right[index]))
    );
  }
  if (isPlainObject(left) && isPlainObject(right)) {
    const leftKeys = Object.keys(left).sort();
    const rightKeys = Object.keys(right).sort();
    return (
      leftKeys.length === rightKeys.length &&
      leftKeys.every(
        (key, index) =>
          key === rightKeys[index] && isDeepEqual(left[key], right[key]),
      )
    );
  }
  return false;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function validateExactOrderedIdentifiers(input: {
  context: z.RefinementCtx;
  path: (string | number)[];
  actual: readonly string[];
  expected: readonly string[];
}) {
  if (
    input.actual.length !== input.expected.length ||
    input.actual.some((value, index) => value !== input.expected[index])
  ) {
    input.context.addIssue({
      code: "custom",
      path: input.path,
      message: "structural identifiers must match the approved v1 contract",
    });
  }
}

function validateExactValues(input: {
  context: z.RefinementCtx;
  path: (string | number)[];
  actual: readonly (string | number)[];
  expected: readonly (string | number)[];
}) {
  for (const value of input.actual) {
    if (!input.expected.includes(value)) {
      input.context.addIssue({
        code: "custom",
        path: input.path,
        message: "unknown required value",
      });
    }
  }
  for (const value of input.expected) {
    if (!input.actual.includes(value)) {
      input.context.addIssue({
        code: "custom",
        path: input.path,
        message: "required value missing",
      });
    }
  }
}
