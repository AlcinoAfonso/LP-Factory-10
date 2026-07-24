import { z } from "zod";

import {
  landingPageFieldPolicies,
  landingPageFieldSupports,
  landingPageFormFieldObligations,
  landingPageFormFieldValueTypes,
  landingPageResearchItemKeys,
  landingPageCtaModes,
  landingPageFunnelProfileKeys,
  landingPageFunnelTreatmentKeysByProfile,
  landingPageInteractionKinds,
  landingPageModuleKeys,
  landingPageVariantCapabilities,
  type LandingPageFieldDefinition,
  type LandingPageInteractionContract,
  type LandingPageModuleKey,
  type LandingPageVariantFieldContractKey,
  type LandingPageVariantKey,
} from "./contracts";
import { deriveLandingPageVariantCapabilities } from "./capabilities";
import { landingPageModuleCatalogRegistry } from "./registry";
import {
  resolveLandingPageRootParameters,
  type LandingPageRootSemanticRoleKey,
} from "../index";

const resolvedRootV1 = resolveLandingPageRootParameters({ rootVersion: 1 });
const variantNameSchema = z
  .string()
  .regex(/^[a-z][a-z0-9_]*$/, "variant name must use snake_case");
const variantKeySchema = z.string().refine((key) => {
  const match = /^([a-z][a-z0-9_]*)\.([a-z][a-z0-9_]*)@v1$/.exec(key);
  return (
    Boolean(match) &&
    landingPageModuleKeys.includes(match?.[1] as LandingPageModuleKey)
  );
}, "variant key must identify a registered module and version 1");
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
const operationalReferenceKeySchema = z.string().regex(/^[a-z][a-z0-9_]*$/);
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

export const landingPageCopySourceMapSchema = z.discriminatedUnion("sourceMode", [
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
    sourceMode: z.literal("research_with_operational_support"),
    researchPath: z.literal("endCustomer.researches[].items[]"),
    primaryItemKeys: z.tuple([z.enum(landingPageResearchItemKeys), z.enum(landingPageResearchItemKeys).optional()]),
    auxiliaryItemKey: z.enum(landingPageResearchItemKeys).optional(),
    operationalSupport: z.object({
      requirement: z.literal("required_when_claimed"),
      referenceKeys: z.array(operationalReferenceKeySchema).min(1),
    }).strict(),
  }).strict().superRefine((map, context) => {
    const keys = map.primaryItemKeys.filter((key): key is NonNullable<typeof key> => Boolean(key));
    if (new Set(keys).size !== keys.length || (map.auxiliaryItemKey && keys.includes(map.auxiliaryItemKey))) {
      context.addIssue({ code: "custom", message: "copy sources must be unique" });
    }
    if (new Set(map.operationalSupport.referenceKeys).size !== map.operationalSupport.referenceKeys.length) {
      context.addIssue({ code: "custom", path: ["operationalSupport", "referenceKeys"], message: "operational support references must be unique" });
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
    semanticRole: rootSemanticRoleSchema,
    support: z.enum(landingPageFieldSupports).optional(),
    copySourceMap: landingPageCopySourceMapSchema,
  })
  .strict()
  .superRefine((field, context) => {
    if (
      field.copySourceMap.sourceMode === "research" &&
      field.policy !== "research_guided" &&
      field.policy !== "hybrid"
    ) {
      context.addIssue({
        code: "custom",
        path: ["policy"],
        message: "research copy source requires a research-guided or hybrid policy",
      });
    }
    if (
      field.copySourceMap.sourceMode === "research_with_operational_support" &&
      (field.policy !== "hybrid" || field.support !== "when_factual")
    ) {
      context.addIssue({
        code: "custom",
        path: ["support"],
        message: "combined copy source requires hybrid policy and operational support when factual",
      });
    }
    if (
      field.copySourceMap.sourceMode === "operational_evidence" &&
      field.policy !== "operational_required"
    ) {
      context.addIssue({
        code: "custom",
        path: ["policy"],
        message: "operational evidence requires an operational-required policy",
      });
    }
  });

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
  .strict()
  .superRefine((field, context) => {
    if (field.cardinality.min !== 1 || field.cardinality.max !== 1) {
      context.addIssue({
        code: "custom",
        path: ["cardinality"],
        message: "primary action cardinality must be exactly one",
      });
    }
    if (
      field.label.cardinality.min !== 1 ||
      field.label.cardinality.max !== 1
    ) {
      context.addIssue({
        code: "custom",
        path: ["label", "cardinality"],
        message: "primary action label cardinality must be exactly one",
      });
    }
  });

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
    fieldContractKey: variantKeySchema,
    fields: z.array(fieldDefinitionSchema).min(1),
  })
  .strict()
  .superRefine((contract, context) => {
    const prefix = contract.fieldContractKey.replace("@v1", "");
    validateUniqueFieldIdentities(contract.fields, context);
    const flattenedFields = flattenFieldDefinitions(
      contract.fields as readonly LandingPageFieldDefinition[],
    );
    const flattenedPaths = flattenedFields.map((field) => field.path);
    if (new Set(flattenedPaths).size !== flattenedPaths.length) {
      context.addIssue({
        code: "custom",
        path: ["fields"],
        message: "field paths must be unique across the contract",
      });
    }
    validateOperationalEvidenceReferences(
      contract.fields as readonly LandingPageFieldDefinition[],
      context,
    );

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

const formInteractionContractSchema = z.object({
  kind: z.literal("form"),
  fields: z.array(z.object({
    fieldKey: fieldKeySchema,
    valueType: z.enum(landingPageFormFieldValueTypes),
    obligation: z.enum(landingPageFormFieldObligations),
    purposeKey: operationalReferenceKeySchema,
  }).strict()).min(1),
  consent: z.object({
    required: z.literal(true),
    fieldKey: z.literal("privacyConsent"),
    purposeKey: z.literal("privacy_policy_consent"),
    privacyPolicyInputFieldKey: z.literal("privacy_policy_url"),
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
}).strict().superRefine((contract, context) => {
  const fieldKeys = [
    ...contract.fields.map((field) => field.fieldKey),
    contract.consent.fieldKey,
  ];
  if (new Set(fieldKeys).size !== fieldKeys.length) {
    context.addIssue({
      code: "custom",
      path: ["fields"],
      message: "embedded form and consent field keys must be unique",
    });
  }
});

const accordionInteractionContractSchema = z
  .object({
    kind: z.literal("accordion"),
    baseline: z.literal("WCAG 2.2"),
    keyboardOperable: z.literal(true),
    exposesExpandedState: z.literal(true),
    associatesControlAndRegion: z.literal(true),
    preservesFocus: z.literal(true),
    initiallyCollapsed: z.literal(true),
    singleExpandedItem: z.literal(true),
  })
  .strict();

const interactionContractSchema = z.discriminatedUnion("kind", [
  formInteractionContractSchema,
  accordionInteractionContractSchema,
]);

const variantDefinitionSchema = z
  .object({
    variantKey: variantKeySchema,
    variantName: variantNameSchema,
    variantVersion: z.literal(1),
    moduleKey: z.enum(landingPageModuleKeys),
    moduleVersion: z.literal(1),
    fieldContractKey: variantKeySchema,
    lifecycleStatus: z.enum(["hypothesis", "validated", "deprecated"]),
    purpose: z.literal("controlled_test"),
    compatibleRootVersion: z.literal(1),
    rootDelta: rootDeltaSchema,
    capabilities: z.array(z.enum(landingPageVariantCapabilities)),
    interactionContracts: z.array(interactionContractSchema),
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

    const interactionKinds = variant.interactionContracts.map(
      (contract) => contract.kind,
    );
    if (new Set(interactionKinds).size !== interactionKinds.length) {
      context.addIssue({
        code: "custom",
        path: ["interactionContracts"],
        message: "interaction contract kinds must be unique per variant",
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
    permittedInteractionKinds: z.array(z.enum(landingPageInteractionKinds)),
  })
  .strict()
  .superRefine((module, context) => {
    validateUniqueText(module.invariants, "invariants", context);
    validateUniqueText(module.boundaries, "boundaries", context);
    validateUniqueText(
      module.permittedInteractionKinds,
      "permittedInteractionKinds",
      context,
    );
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
      if (
        !structurallyEqual(
          module.permittedInteractionKinds,
          canonical.permittedInteractionKinds,
        )
      ) {
        context.addIssue({
          code: "custom",
          path: ["modules", key, "permittedInteractionKinds"],
          message: "permitted interaction kinds differ from the canonical registry",
        });
      }
    }

    const expectedFieldContractKeys = new Set<string>(
      Object.keys(landingPageModuleCatalogRegistry.variantFieldContracts),
    );
    const actualFieldContractKeys = Object.keys(catalog.variantFieldContracts);
    validateRequiredKeys({
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

      const canonical =
        landingPageModuleCatalogRegistry.variantFieldContracts[
          key as LandingPageVariantFieldContractKey
        ];
      if (canonical && JSON.stringify(contract) !== JSON.stringify(canonical)) {
        context.addIssue({
          code: "custom",
          path: ["variantFieldContracts", key],
          message: "field contract differs from the canonical registry",
        });
      }
    }

    const expectedVariantKeys = new Set<string>(
      Object.keys(landingPageModuleCatalogRegistry.variants),
    );
    const actualVariantKeys = Object.keys(catalog.variants);
    validateRequiredKeys({
      actual: actualVariantKeys,
      expected: expectedVariantKeys,
      context,
      path: ["variants"],
      label: "variant",
    });
    validateExactKeys({
      actual: actualVariantKeys,
      expected: new Set(actualFieldContractKeys),
      context,
      path: ["variants"],
      label: "variant and field contract identity",
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
      const fieldContract =
        catalog.variantFieldContracts[variant.fieldContractKey];
      if (fieldContract) {
        const expectedCapabilities = deriveLandingPageVariantCapabilities(
          fieldContract.fields as readonly LandingPageFieldDefinition[],
          variant.interactionContracts as readonly LandingPageInteractionContract[],
        );
        if (
          JSON.stringify(variant.capabilities) !==
          JSON.stringify(expectedCapabilities)
        ) {
          context.addIssue({
            code: "custom",
            path: ["variants", key, "capabilities"],
            message: "capabilities must be derived from fields and interactions",
          });
        }
      }

      const moduleDefinition = catalog.modules[variant.moduleKey];
      if (moduleDefinition) {
        const incompatibleInteraction = variant.interactionContracts.find(
          (interaction) =>
            !moduleDefinition.permittedInteractionKinds.includes(
              interaction.kind,
            ),
        );
        if (incompatibleInteraction) {
          context.addIssue({
            code: "custom",
            path: ["variants", key, "interactionContracts"],
            message: "interaction kind is not permitted by the module",
          });
        }
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
      if (canonical && !structurallyEqual({
        ...variant,
        lifecycleStatus: canonical.lifecycleStatus,
        rootDelta: canonical.rootDelta,
      }, canonical)) {
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
  path: "invariants" | "boundaries" | "permittedInteractionKinds",
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
    const fieldOwnerPath = structuralOwnerPath(field.path);
    const evidenceOwnerPath = field.copySourceMap.evidencePath
      ? structuralOwnerPath(field.copySourceMap.evidencePath)
      : undefined;
    if (!fieldOwnerPath || fieldOwnerPath !== evidenceOwnerPath) {
      context.addIssue({ code: "custom", path: [...path, "copySourceMap", "evidencePath"], message: "operational evidence path does not belong to the field item" });
    }
  }
}

function structuralOwnerPath(fieldPath: string): string | undefined {
  const separatorIndex = fieldPath.lastIndexOf(".");
  return separatorIndex > 0 ? fieldPath.slice(0, separatorIndex) : undefined;
}

function validateOperationalEvidenceReferences(
  fields: readonly LandingPageFieldDefinition[],
  context: z.RefinementCtx,
): void {
  const flattenedFields = flattenFieldDefinitions(fields);
  for (const field of flattenedFields) {
    if (
      field.fieldKind !== "text" ||
      field.copySourceMap.sourceMode !== "operational_evidence"
    ) {
      continue;
    }
    const evidencePath = field.copySourceMap.evidencePath;
    const evidenceField = flattenedFields.find(
      (candidate) => candidate.path === evidencePath,
    );
    if (evidenceField?.fieldKind !== "technical_reference") {
      context.addIssue({
        code: "custom",
        path: ["fields"],
        message: "operational evidence path must reference a declared technical field",
      });
    }
  }
}

function flattenFieldDefinitions(
  fields: readonly LandingPageFieldDefinition[],
): readonly LandingPageFieldDefinition[] {
  return fields.flatMap((field) => [
    field,
    ...(field.fieldKind === "collection"
      ? flattenFieldDefinitions(field.itemFields)
      : []),
    ...(field.fieldKind === "action"
      ? flattenFieldDefinitions([field.label])
      : []),
  ]);
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

function validateRequiredKeys(input: {
  actual: readonly string[];
  expected: Set<string>;
  context: z.RefinementCtx;
  path: (string | number)[];
  label: string;
}) {
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

function structurallyEqual(left: unknown, right: unknown): boolean {
  return JSON.stringify(sortObjectKeys(left)) === JSON.stringify(sortObjectKeys(right));
}

function sortObjectKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortObjectKeys);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, nested]) => [key, sortObjectKeys(nested)]),
  );
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
  validateRequiredKeys(input);
}
