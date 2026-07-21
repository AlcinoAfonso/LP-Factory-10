import { z } from "zod";

import {
  landingPageFieldPolicies,
  landingPageFieldSupports,
  landingPageResearchItemKeys,
  landingPageCtaModes,
  landingPageFunnelProfileKeys,
  landingPageFunnelTreatmentKeysByProfile,
  landingPageModuleKeys,
  landingPageVariantCapabilities,
  landingPageVariantFieldContractKeys,
  landingPageVariantKeys,
  type LandingPageModuleKey,
  type LandingPageVariantFieldContractKey,
  type LandingPageVariantKey,
} from "./contracts";
import { landingPageModuleCatalogRegistry } from "./registry";
import {
  resolveLandingPageRootParameters,
  type LandingPageRootSemanticRoleKey,
} from "../index";

const resolvedRootV1 = resolveLandingPageRootParameters({ rootVersion: 1 });
const rootSemanticRoleSchema = z.string().refine(
  (key) => resolvedRootV1.ok && Object.hasOwn(resolvedRootV1.value.semanticRoles, key),
  { message: "semantic role is absent from the compatible root contract" },
);

const textRangeRestrictionSchema = z.object({
  semanticRole: rootSemanticRoleSchema,
  recommended: z.object({ min: z.number().int().min(0), max: z.number().int().min(1) }).strict().optional(),
  absoluteMax: z.number().int().min(1).optional(),
}).strict().superRefine((restriction, context) => {
  if (restriction.recommended && restriction.recommended.min > restriction.recommended.max) {
    context.addIssue({ code: "custom", message: "recommended range is inverted" });
  }
  if (!restriction.recommended && restriction.absoluteMax === undefined) {
    context.addIssue({ code: "custom", message: "empty root restriction" });
  }
});

const rootDeltaSchema = z.object({
  textRanges: z.array(textRangeRestrictionSchema),
}).strict().superRefine((delta, context) => {
  const root = resolveLandingPageRootParameters({ rootVersion: 1 });
  if (!root.ok) {
    context.addIssue({ code: "custom", message: "compatible root contract is unavailable" });
    return;
  }
  const seen = new Set<string>();
  for (const [index, restriction] of delta.textRanges.entries()) {
    if (seen.has(restriction.semanticRole)) {
      context.addIssue({ code: "custom", path: ["textRanges", index], message: "duplicate semantic role restriction" });
    }
    seen.add(restriction.semanticRole);
    if (!Object.hasOwn(root.value.semanticRoles, restriction.semanticRole)) {
      continue;
    }
    const rootRange = root.value.semanticRoles[restriction.semanticRole as LandingPageRootSemanticRoleKey].textRange;
    if (restriction.recommended && (
      restriction.recommended.min < rootRange.recommended.min ||
      restriction.recommended.max > rootRange.recommended.max
    )) {
      context.addIssue({ code: "custom", path: ["textRanges", index], message: "recommended range widens the root contract" });
    }
    if (restriction.absoluteMax !== undefined && restriction.absoluteMax > rootRange.absoluteMax) {
      context.addIssue({ code: "custom", path: ["textRanges", index], message: "absolute limit widens the root contract" });
    }
    if (restriction.recommended && restriction.absoluteMax !== undefined && restriction.recommended.max > restriction.absoluteMax) {
      context.addIssue({ code: "custom", path: ["textRanges", index], message: "recommended maximum exceeds absolute maximum" });
    }
  }
});

function funnelProfileDeltaSchema<T extends readonly [string, ...string[]]>(treatments: T) {
  const treatmentSchema = z.enum(treatments);
  return z.object({
    emphasizeTreatments: z.array(treatmentSchema).max(0),
    restrictTreatments: z.array(treatmentSchema),
    prohibitTreatments: z.array(treatmentSchema),
  }).strict();
}

const funnelProfileDeltasSchema = z.object({
  bofu: funnelProfileDeltaSchema(landingPageFunnelTreatmentKeysByProfile.bofu),
  mofu: funnelProfileDeltaSchema(landingPageFunnelTreatmentKeysByProfile.mofu),
  tofu: funnelProfileDeltaSchema(landingPageFunnelTreatmentKeysByProfile.tofu),
}).strict();

function funnelCopyProfileSchema<
  ProfileKey extends "bofu" | "mofu" | "tofu",
  Treatments extends readonly [string, ...string[]],
>(profileKey: ProfileKey, treatments: Treatments) {
  const treatmentSchema = z.enum(treatments);
  return z.object({
    profileKey: z.literal(profileKey),
    prioritizedSources: z.array(z.enum(landingPageResearchItemKeys)).min(1),
    permittedTreatments: z.array(treatmentSchema).min(1),
    restrictedTreatments: z.array(treatmentSchema),
    prohibitedTreatments: z.array(treatmentSchema).min(1),
    emphasizeTreatments: z.tuple([]),
    ctaMode: z.enum(landingPageCtaModes),
  }).strict().superRefine((profile, context) => {
    const all = [...profile.permittedTreatments, ...profile.restrictedTreatments, ...profile.prohibitedTreatments];
    if (
      all.length !== treatments.length ||
      new Set(all).size !== treatments.length ||
      treatments.some((treatment) => !all.includes(treatment))
    ) context.addIssue({ code: "custom", message: "profile treatment vocabulary must be classified exactly once" });
    if (new Set(profile.prioritizedSources).size !== profile.prioritizedSources.length) context.addIssue({ code: "custom", message: "prioritized sources must be unique" });
    const expectedCtaMode = { bofu: "direct_next_step", mofu: "non_coercive_direct", tofu: "low_pressure" } as const;
    if (profile.ctaMode !== expectedCtaMode[profileKey]) context.addIssue({ code: "custom", path: ["ctaMode"], message: "cta mode does not correspond to profile action" });
  });
}

const funnelCopyProfileSchemaByKey = {
  bofu: funnelCopyProfileSchema("bofu", landingPageFunnelTreatmentKeysByProfile.bofu),
  mofu: funnelCopyProfileSchema("mofu", landingPageFunnelTreatmentKeysByProfile.mofu),
  tofu: funnelCopyProfileSchema("tofu", landingPageFunnelTreatmentKeysByProfile.tofu),
};

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

const copySourceMapSchema = z.discriminatedUnion("sourceMode", [
  z.object({
    sourceMode: z.literal("research"),
    researchPath: z.literal("endCustomer.researches[].items[]"),
    primaryItemKeys: z.tuple([z.enum(landingPageResearchItemKeys), z.enum(landingPageResearchItemKeys).optional()]),
    auxiliaryItemKey: z.enum(landingPageResearchItemKeys).optional(),
  }).strict().superRefine((map, context) => {
    const keys = map.primaryItemKeys.filter((key): key is NonNullable<typeof key> => Boolean(key));
    if (new Set(keys).size !== keys.length || (map.auxiliaryItemKey && keys.includes(map.auxiliaryItemKey))) {
      context.addIssue({ code: "custom", message: "copy sources must be unique" });
    }
  }),
  z.object({
    sourceMode: z.literal("operational_evidence"),
    evidencePath: fieldPathSchema,
  }).strict(),
]);

const textFieldSchema = z
  .object({
    fieldKind: z.literal("text"),
    fieldKey: fieldKeySchema,
    path: fieldPathSchema,
    cardinality: cardinalitySchema,
    policy: z.enum(landingPageFieldPolicies),
    semanticRole: nonEmptyPlainText,
    support: z.enum(landingPageFieldSupports).optional(),
    copySourceMap: copySourceMapSchema,
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
      validateCopySourceMode(field, context, ["fields", fieldIndex]);
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
          validateCopySourceMode(itemField, context, ["fields", fieldIndex, "itemFields", itemIndex]);
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
      if (field.fieldKind === "action") {
        validateCopySourceMode(field.label, context, ["fields", fieldIndex, "label"]);
      }
    }
  });

const variantDefinitionSchema = z
  .object({
    variantKey: z.enum(landingPageVariantKeys),
    variantName: z.enum(["standard", "accordion"]),
    variantVersion: z.literal(1),
    moduleKey: z.enum(landingPageModuleKeys),
    moduleVersion: z.literal(1),
    fieldContractKey: z.enum(landingPageVariantFieldContractKeys),
    lifecycleStatus: z.enum(["hypothesis", "validated", "deprecated"]),
    purpose: z.literal("controlled_test"),
    compatibleRootVersion: z.literal(1),
    rootDelta: rootDeltaSchema,
    capabilities: z.array(z.enum(landingPageVariantCapabilities)),
    actionCompatibility: z
      .object({
        supportsPrimaryConversionForm: z.literal(false),
      })
      .strict()
      .optional(),
    accordionAccessibility: z
      .object({
        baseline: z.literal("WCAG 2.2"),
        keyboardOperable: z.literal(true),
        exposesExpandedState: z.literal(true),
        associatesControlAndRegion: z.literal(true),
        preservesFocus: z.literal(true),
        initiallyCollapsed: z.literal(true),
        singleExpandedItem: z.literal(true),
      })
      .strict()
      .optional(),
  })
  .strict()
  .superRefine((variant, context) => {
    if (new Set(variant.capabilities).size !== variant.capabilities.length) {
      context.addIssue({
        code: "custom",
        path: ["capabilities"],
        message: "capabilities must be unique",
      });
    }

    const [qualifiedModule, qualifiedVariant] = variant.variantKey.split(".");
    const variantName = qualifiedVariant?.replace("@v1", "");
    if (
      variant.moduleKey !== qualifiedModule ||
      variant.variantName !== variantName
    ) {
      context.addIssue({
        code: "custom",
        message: "variant identity does not match module and variant name",
      });
    }

    if (variant.fieldContractKey !== variant.variantKey) {
      context.addIssue({
        code: "custom",
        path: ["fieldContractKey"],
        message: "variant must use its own field contract",
      });
    }

    const hasPrimaryAction = variant.capabilities.includes("primary_action");
    const hasImageAsset = variant.capabilities.includes("image_asset");
    const hasAccordion = variant.capabilities.includes("accordion_interaction");
    const isFormIncompatible =
      variant.variantKey === "hero.standard@v1" ||
      variant.variantKey === "final_cta.standard@v1";

    if (hasPrimaryAction !== isFormIncompatible) {
      context.addIssue({
        code: "custom",
        path: ["capabilities"],
        message: "primary action capability is assigned to an invalid variant",
      });
    }
    if (Boolean(variant.actionCompatibility) !== isFormIncompatible) {
      context.addIssue({
        code: "custom",
        path: ["actionCompatibility"],
        message: "form compatibility metadata is assigned to an invalid variant",
      });
    }
    if (hasImageAsset !== (variant.variantKey === "hero.standard@v1")) {
      context.addIssue({
        code: "custom",
        path: ["capabilities"],
        message: "image asset capability is assigned to an invalid variant",
      });
    }
    if (hasAccordion !== (variant.variantKey === "faq.accordion@v1")) {
      context.addIssue({
        code: "custom",
        path: ["capabilities"],
        message: "accordion capability is assigned to an invalid variant",
      });
    }
    if (
      Boolean(variant.accordionAccessibility) !==
      (variant.variantKey === "faq.accordion@v1")
    ) {
      context.addIssue({
        code: "custom",
        path: ["accordionAccessibility"],
        message: "accordion accessibility belongs only to faq accordion",
      });
    }
  });

const moduleDefinitionSchema = z
  .object({
    family: z.literal("landing_page"),
    moduleKey: z.enum(landingPageModuleKeys),
    moduleVersion: z.literal(1),
    lifecycleStatus: z.enum(["hypothesis", "validated", "deprecated"]),
    purpose: z.literal("controlled_test"),
    compatibleRootVersion: z.literal(1),
    rootDelta: rootDeltaSchema,
    funnelProfileDeltas: funnelProfileDeltasSchema,
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
    funnelCopyProfiles: z.record(z.string(), z.union([
      funnelCopyProfileSchemaByKey.bofu,
      funnelCopyProfileSchemaByKey.mofu,
      funnelCopyProfileSchemaByKey.tofu,
    ])),
    modules: z.record(z.string(), moduleDefinitionSchema),
    variantFieldContracts: z.record(z.string(), variantFieldContractSchema),
    variants: z.record(z.string(), variantDefinitionSchema),
  })
  .strict()
  .superRefine((catalog, context) => {
    const root = resolveLandingPageRootParameters({ rootVersion: 1 });
    if (!root.ok) {
      context.addIssue({ code: "custom", message: "compatible root contract is unavailable" });
      return;
    }
    const expectedKeys = new Set<string>(landingPageModuleKeys);
    validateExactKeys({
      actual: Object.keys(catalog.funnelCopyProfiles), expected: new Set(landingPageFunnelProfileKeys),
      context, path: ["funnelCopyProfiles"], label: "funnel profile",
    });
    for (const profileKey of landingPageFunnelProfileKeys) {
      const profile = catalog.funnelCopyProfiles[profileKey];
      if (!profile) continue;
      if (profile.profileKey !== profileKey) context.addIssue({ code: "custom", path: ["funnelCopyProfiles", profileKey, "profileKey"], message: "funnel profile key mismatch" });
      if (JSON.stringify(profile) !== JSON.stringify(landingPageModuleCatalogRegistry.funnelCopyProfiles[profileKey])) {
        context.addIssue({ code: "custom", path: ["funnelCopyProfiles", profileKey], message: "funnel profile differs from the canonical registry" });
      }
    }
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
      validateComposedRootDelta({
        parentRanges: root.value.semanticRoles,
        delta: module.rootDelta,
        context,
        path: ["modules", key, "rootDelta"],
      });
      validateModuleFunnelDeltas(module.funnelProfileDeltas, catalog.funnelCopyProfiles, context, ["modules", key, "funnelProfileDeltas"]);
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

    const expectedVariantKeys = new Set<string>(landingPageVariantKeys);
    const actualVariantKeys = Object.keys(catalog.variants);
    validateExactKeys({
      actual: actualVariantKeys,
      expected: expectedVariantKeys,
      context,
      path: ["variants"],
      label: "variant",
    });

    for (const [key, variant] of Object.entries(catalog.variants)) {
      if (variant.variantKey !== key) {
        context.addIssue({
          code: "custom",
          path: ["variants", key, "variantKey"],
          message: "variant key mismatch",
        });
      }
      if (!catalog.modules[variant.moduleKey]) {
        context.addIssue({
          code: "custom",
          path: ["variants", key, "moduleKey"],
          message: "variant module is not registered",
        });
      }
      if (!catalog.variantFieldContracts[variant.fieldContractKey]) {
        context.addIssue({
          code: "custom",
          path: ["variants", key, "fieldContractKey"],
          message: "variant field contract is not registered",
        });
      }

      if (!expectedVariantKeys.has(key)) continue;
      const moduleDefinition = catalog.modules[variant.moduleKey];
      if (moduleDefinition) {
        const moduleRanges = composeRootRanges(root.value.semanticRoles, moduleDefinition.rootDelta);
        validateComposedRootDelta({
          parentRanges: moduleRanges,
          delta: variant.rootDelta,
          context,
          path: ["variants", key, "rootDelta"],
        });
      }
      const canonical =
        landingPageModuleCatalogRegistry.variants[key as LandingPageVariantKey];
      if (JSON.stringify({
        ...variant,
        lifecycleStatus: canonical.lifecycleStatus,
        rootDelta: canonical.rootDelta,
      }) !== JSON.stringify(canonical)) {
        context.addIssue({
          code: "custom",
          path: ["variants", key],
          message: "variant differs from the canonical registry",
        });
      }
    }
  });

type EffectiveTextRange = Readonly<{
  recommended: Readonly<{ min: number; max: number }>;
  absoluteMax: number;
}>;

function composeRootRanges(
  parentRanges: Readonly<Record<string, { textRange?: EffectiveTextRange } | EffectiveTextRange>>,
  delta: { textRanges: readonly { semanticRole: string; recommended?: { min: number; max: number }; absoluteMax?: number }[] },
) {
  const result: Record<string, EffectiveTextRange> = {};
  for (const [key, parent] of Object.entries(parentRanges)) {
    const range = "textRange" in parent && parent.textRange ? parent.textRange : parent as EffectiveTextRange;
    const restriction = delta.textRanges.find((item) => item.semanticRole === key);
    result[key] = {
      recommended: restriction?.recommended ?? range.recommended,
      absoluteMax: restriction?.absoluteMax ?? range.absoluteMax,
    };
  }
  return result;
}

function validateComposedRootDelta(input: {
  parentRanges: Readonly<Record<string, { textRange?: EffectiveTextRange } | EffectiveTextRange>>;
  delta: { textRanges: readonly { semanticRole: string; recommended?: { min: number; max: number }; absoluteMax?: number }[] };
  context: z.RefinementCtx;
  path: (string | number)[];
}) {
  const effective = composeRootRanges(input.parentRanges, input.delta);
  for (const [index, restriction] of input.delta.textRanges.entries()) {
    if (!Object.hasOwn(input.parentRanges, restriction.semanticRole)) continue;
    const parent = input.parentRanges[restriction.semanticRole];
    const parentRange = "textRange" in parent && parent.textRange ? parent.textRange : parent as EffectiveTextRange;
    const childRange = effective[restriction.semanticRole];
    if (
      childRange.recommended.min < parentRange.recommended.min ||
      childRange.recommended.max > parentRange.recommended.max ||
      childRange.absoluteMax > parentRange.absoluteMax
    ) {
      input.context.addIssue({ code: "custom", path: [...input.path, "textRanges", index], message: "specialization widens its parent contract" });
    }
    if (childRange.recommended.max > childRange.absoluteMax) {
      input.context.addIssue({ code: "custom", path: [...input.path, "textRanges", index], message: "effective recommended maximum exceeds effective absolute maximum" });
    }
  }
}

function validateModuleFunnelDeltas(
  deltas: Record<string, { emphasizeTreatments: string[]; restrictTreatments: string[]; prohibitTreatments: string[] }>,
  profiles: Record<string, { permittedTreatments: string[]; restrictedTreatments: string[]; prohibitedTreatments: string[] }>,
  context: z.RefinementCtx,
  path: (string | number)[],
) {
  for (const profileKey of landingPageFunnelProfileKeys) {
    const delta = deltas[profileKey];
    const profile = profiles[profileKey];
    if (!delta || !profile) continue;
    const known = new Set([...profile.permittedTreatments, ...profile.restrictedTreatments, ...profile.prohibitedTreatments]);
    const prohibited = new Set(profile.prohibitedTreatments);
    const operations = [...delta.emphasizeTreatments, ...delta.restrictTreatments, ...delta.prohibitTreatments];
    if (new Set(operations).size !== operations.length) {
      context.addIssue({ code: "custom", path: [...path, profileKey], message: "funnel delta has conflicting treatment operations" });
    }
    for (const treatment of operations) {
      if (!known.has(treatment)) context.addIssue({ code: "custom", path: [...path, profileKey], message: "funnel delta references treatment outside its profile" });
    }
    for (const treatment of [...delta.emphasizeTreatments, ...delta.restrictTreatments]) {
      if (prohibited.has(treatment)) context.addIssue({ code: "custom", path: [...path, profileKey], message: "funnel delta cannot emphasize or merely restrict a prohibited treatment" });
    }
  }
}

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

function validateCopySourceMode(
  field: { fieldKind: string; policy: string; path: string; copySourceMap?: { sourceMode: string; evidencePath?: string } },
  context: z.RefinementCtx,
  path: (string | number)[],
) {
  if (field.fieldKind !== "text" || !field.copySourceMap) return;
  const operational = field.policy === "operational_required";
  if (operational !== (field.copySourceMap.sourceMode === "operational_evidence")) {
    context.addIssue({ code: "custom", path: [...path, "copySourceMap"], message: "copy source mode is incompatible with field policy" });
  }
  if (operational) {
    const collectionPrefix = field.path.replace(/\.(?:quote|attribution)$/, "");
    if (field.copySourceMap.evidencePath !== `${collectionPrefix}.evidenceRef`) {
      context.addIssue({ code: "custom", path: [...path, "copySourceMap", "evidencePath"], message: "operational evidence path does not belong to the field item" });
    }
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
