import assert from "node:assert/strict";

import {
  landingPageFieldKinds,
  landingPageModuleKeys,
  landingPageVariantCapabilities,
  landingPageVariantFieldContractKeys,
  landingPageVariantKeys,
  type LandingPageModuleKey,
  type LandingPageVariantKey,
} from "./contracts";
import { landingPageModuleCatalogRegistry } from "./registry";
import { landingPageModuleCatalogSchema } from "./schema";

type Case = Readonly<{
  name: string;
  run: () => void;
}>;

const cases: readonly Case[] = [
  {
    name: "the versioned catalog and all nine modules are valid",
    run: () => {
      const result = landingPageModuleCatalogSchema.safeParse(
        landingPageModuleCatalogRegistry,
      );

      assert.equal(result.success, true);
      assert.equal(landingPageModuleCatalogRegistry.family, "landing_page");
      assert.equal(landingPageModuleCatalogRegistry.moduleCatalogVersion, 1);
      assert.deepEqual(
        landingPageModuleCatalogRegistry.compatibleRootVersions,
        [1],
      );
      assert.deepEqual(
        Object.keys(landingPageModuleCatalogRegistry.modules).sort(),
        [...landingPageModuleKeys].sort(),
      );
    },
  },
  {
    name: "module identities are closed and scoped to landing_page",
    run: () => {
      const qualifiedIdentities = Object.values(
        landingPageModuleCatalogRegistry.modules,
      ).map((moduleDefinition) => {
        assert.equal(moduleDefinition.family, "landing_page");
        assert.equal(moduleDefinition.moduleVersion, 1);
        assert.equal(moduleDefinition.lifecycleStatus, "hypothesis");
        assert.equal(moduleDefinition.purpose, "controlled_test");
        return `${moduleDefinition.family}:${moduleDefinition.moduleKey}@v${moduleDefinition.moduleVersion}`;
      });

      assert.equal(new Set(qualifiedIdentities).size, landingPageModuleKeys.length);
      assert.equal(
        qualifiedIdentities.some((identity) =>
          identity.startsWith("commercial_activation:"),
        ),
        false,
      );
    },
  },
  {
    name: "registry values are deeply immutable",
    run: () => {
      assertDeeplyFrozen(landingPageModuleCatalogRegistry);
    },
  },
  {
    name: "module contracts do not anticipate later catalog phases",
    run: () => {
      const forbiddenKeys = new Set([
        "taxon",
        "campaign",
        "plan",
        "copy",
        "asset",
        "order",
        "channel",
        "destination",
        "variant",
        "fields",
        "sourceMap",
        "profile",
      ]);

      for (const moduleDefinition of Object.values(
        landingPageModuleCatalogRegistry.modules,
      )) {
        for (const key of Object.keys(moduleDefinition)) {
          assert.equal(forbiddenKeys.has(key), false, `forbidden key: ${key}`);
        }
      }
    },
  },
  {
    name: "unknown modules and structural values fail closed",
    run: () => {
      const unknownModule = cloneRegistry();
      unknownModule.modules.unknown = cloneModule("hero");
      assert.equal(landingPageModuleCatalogSchema.safeParse(unknownModule).success, false);

      const invalidLifecycle = cloneRegistry();
      invalidLifecycle.modules.hero.lifecycleStatus = "active";
      assert.equal(
        landingPageModuleCatalogSchema.safeParse(invalidLifecycle).success,
        false,
      );

      const invalidPurpose = cloneRegistry();
      invalidPurpose.modules.hero.purpose = "production";
      assert.equal(
        landingPageModuleCatalogSchema.safeParse(invalidPurpose).success,
        false,
      );

      const invalidStructuralFunction = cloneRegistry();
      invalidStructuralFunction.modules.hero.structuralFunction =
        "Arbitrary structural function.";
      assert.equal(
        landingPageModuleCatalogSchema.safeParse(invalidStructuralFunction)
          .success,
        false,
      );

      const invalidInvariant = cloneRegistry();
      invalidInvariant.modules.hero.invariants[0] = "Arbitrary invariant.";
      assert.equal(
        landingPageModuleCatalogSchema.safeParse(invalidInvariant).success,
        false,
      );

      const invalidBoundary = cloneRegistry();
      invalidBoundary.modules.hero.boundaries[0] = "Arbitrary boundary.";
      assert.equal(
        landingPageModuleCatalogSchema.safeParse(invalidBoundary).success,
        false,
      );

      const invalidFamily = cloneRegistry();
      invalidFamily.family = "commercial_activation";
      assert.equal(
        landingPageModuleCatalogSchema.safeParse(invalidFamily).success,
        false,
      );
    },
  },
  {
    name: "missing modules, mismatched identities and extra fields fail closed",
    run: () => {
      const missingModule = cloneRegistry();
      delete missingModule.modules.faq;
      assert.equal(
        landingPageModuleCatalogSchema.safeParse(missingModule).success,
        false,
      );

      const mismatchedIdentity = cloneRegistry();
      mismatchedIdentity.modules.hero.moduleKey = "faq";
      assert.equal(
        landingPageModuleCatalogSchema.safeParse(mismatchedIdentity).success,
        false,
      );

      const extraField = cloneRegistry();
      extraField.modules.hero.variant = "standard";
      assert.equal(
        landingPageModuleCatalogSchema.safeParse(extraField).success,
        false,
      );
    },
  },
  {
    name: "all ten field contracts and five field kinds are valid",
    run: () => {
      assert.deepEqual(
        Object.keys(
          landingPageModuleCatalogRegistry.variantFieldContracts,
        ).sort(),
        [...landingPageVariantFieldContractKeys].sort(),
      );

      const kinds = new Set<string>();
      for (const contract of Object.values(
        landingPageModuleCatalogRegistry.variantFieldContracts,
      )) {
        for (const field of contract.fields) collectFieldKinds(field, kinds);
      }
      assert.deepEqual([...kinds].sort(), [...landingPageFieldKinds].sort());
    },
  },
  {
    name: "unknown field, path, shape, cardinality and policy fail closed",
    run: () => {
      const unknownField = cloneRegistry();
      unknownField.variantFieldContracts["hero.standard@v1"].fields.push({
        ...cloneField("hero.standard@v1", 0),
        fieldKey: "unknown",
        path: "hero.standard.unknown",
      });
      assertInvalid(unknownField);

      const unknownPath = cloneRegistry();
      unknownPath.variantFieldContracts["hero.standard@v1"].fields[0].path =
        "hero.standard.unapproved";
      assertInvalid(unknownPath);

      const unknownShape = cloneRegistry();
      unknownShape.variantFieldContracts["hero.standard@v1"].fields[0].fieldKind =
        "video";
      assertInvalid(unknownShape);

      const invertedCardinality = cloneRegistry();
      invertedCardinality.variantFieldContracts[
        "hero.standard@v1"
      ].fields[0].cardinality = { min: 2, max: 1 };
      assertInvalid(invertedCardinality);

      const unknownPolicy = cloneRegistry();
      unknownPolicy.variantFieldContracts["hero.standard@v1"].fields[0].policy =
        "generated";
      assertInvalid(unknownPolicy);
    },
  },
  {
    name: "nested collections and concrete action destinations fail closed",
    run: () => {
      const nestedCollection = cloneRegistry();
      const collection = nestedCollection.variantFieldContracts[
        "trust_bar.standard@v1"
      ].fields[0];
      collection.itemFields = [structuredClone(collection)];
      assertInvalid(nestedCollection);

      const concreteDestination = cloneRegistry();
      const action = concreteDestination.variantFieldContracts[
        "hero.standard@v1"
      ].fields.find((field) => field.fieldKind === "action");
      assert.ok(action);
      action.destination = "https://example.com";
      assertInvalid(concreteDestination);
    },
  },
  {
    name: "field contract identity, semantic role and support fail closed",
    run: () => {
      const mismatchedContract = cloneRegistry();
      mismatchedContract.variantFieldContracts[
        "hero.standard@v1"
      ].fieldContractKey = "faq.standard@v1";
      assertInvalid(mismatchedContract);

      const unknownSemanticRole = cloneRegistry();
      unknownSemanticRole.variantFieldContracts[
        "hero.standard@v1"
      ].fields[0].semanticRole = "display";
      assertInvalid(unknownSemanticRole);

      const unknownSupport = cloneRegistry();
      unknownSupport.variantFieldContracts["hero.standard@v1"].fields[1].support =
        "always";
      assertInvalid(unknownSupport);

      const missingContract = cloneRegistry();
      delete missingContract.variantFieldContracts["faq.accordion@v1"];
      assertInvalid(missingContract);
    },
  },
  {
    name: "all ten variants link one module and their own field contract",
    run: () => {
      assert.deepEqual(
        Object.keys(landingPageModuleCatalogRegistry.variants).sort(),
        [...landingPageVariantKeys].sort(),
      );

      for (const variantDefinition of Object.values(
        landingPageModuleCatalogRegistry.variants,
      )) {
        assert.equal(variantDefinition.moduleVersion, 1);
        assert.equal(variantDefinition.variantVersion, 1);
        assert.equal(variantDefinition.lifecycleStatus, "hypothesis");
        assert.equal(variantDefinition.purpose, "controlled_test");
        assert.equal(
          variantDefinition.fieldContractKey,
          variantDefinition.variantKey,
        );
        assert.ok(
          landingPageModuleCatalogRegistry.modules[variantDefinition.moduleKey],
        );
        assert.ok(
          landingPageModuleCatalogRegistry.variantFieldContracts[
            variantDefinition.fieldContractKey
          ],
        );
      }
    },
  },
  {
    name: "only the three approved capabilities are assigned",
    run: () => {
      const assignedCapabilities = new Set(
        Object.values(landingPageModuleCatalogRegistry.variants).flatMap(
          (variantDefinition) => variantDefinition.capabilities,
        ),
      );
      assert.deepEqual(
        [...assignedCapabilities].sort(),
        [...landingPageVariantCapabilities].sort(),
      );
      assert.deepEqual(
        landingPageModuleCatalogRegistry.variants["hero.standard@v1"]
          .capabilities,
        ["primary_action", "image_asset"],
      );
      assert.deepEqual(
        landingPageModuleCatalogRegistry.variants["final_cta.standard@v1"]
          .capabilities,
        ["primary_action"],
      );
      assert.deepEqual(
        landingPageModuleCatalogRegistry.variants["faq.accordion@v1"]
          .capabilities,
        ["accordion_interaction"],
      );
    },
  },
  {
    name: "faq variants are independent and accordion declares the WCAG contract",
    run: () => {
      const standardFields =
        landingPageModuleCatalogRegistry.variantFieldContracts[
          "faq.standard@v1"
        ].fields;
      const accordionFields =
        landingPageModuleCatalogRegistry.variantFieldContracts[
          "faq.accordion@v1"
        ].fields;
      assert.notEqual(standardFields, accordionFields);
      assert.deepEqual(
        normalizeFaqFieldPaths(standardFields),
        normalizeFaqFieldPaths(accordionFields),
      );

      assert.equal(
        landingPageModuleCatalogRegistry.variants["faq.standard@v1"]
          .accordionAccessibility,
        undefined,
      );
      assert.deepEqual(
        landingPageModuleCatalogRegistry.variants["faq.accordion@v1"]
          .accordionAccessibility,
        {
          baseline: "WCAG 2.2",
          keyboardOperable: true,
          exposesExpandedState: true,
          associatesControlAndRegion: true,
          preservesFocus: true,
          initiallyCollapsed: true,
          singleExpandedItem: true,
        },
      );
    },
  },
  {
    name: "form compatibility is explicit without channel fallback",
    run: () => {
      for (const variantKey of [
        "hero.standard@v1",
        "final_cta.standard@v1",
      ] as const) {
        assert.deepEqual(
          landingPageModuleCatalogRegistry.variants[variantKey]
            .actionCompatibility,
          { supportsPrimaryConversionForm: false },
        );
      }

      const formFallback = cloneRegistry();
      formFallback.variants["hero.standard@v1"].fallbackChannel = "whatsapp";
      assertInvalid(formFallback);

      const formSupported = cloneRegistry();
      formSupported.variants[
        "hero.standard@v1"
      ].actionCompatibility = { supportsPrimaryConversionForm: true };
      assertInvalid(formSupported);
    },
  },
  {
    name: "unknown capability, variant and creation motivation fail closed",
    run: () => {
      const unknownCapability = cloneRegistry();
      unknownCapability.variants["hero.standard@v1"].capabilities.push(
        "carousel",
      );
      assertInvalid(unknownCapability);

      const unknownVariant = cloneRegistry();
      unknownVariant.variants["hero.campaign@v1"] = cloneVariant(
        "hero.standard@v1",
      );
      unknownVariant.variants["hero.campaign@v1"].variantKey =
        "hero.campaign@v1";
      assertInvalid(unknownVariant);

      for (const motivation of [
        "taxon",
        "copy",
        "plan",
        "campaign",
        "asset",
        "order",
        "quantity",
      ]) {
        const motivatedVariant = cloneRegistry();
        motivatedVariant.variants[
          "hero.standard@v1"
        ].creationMotivation = motivation;
        assertInvalid(motivatedVariant);
      }
    },
  },
  {
    name: "incomplete accordion accessibility and mismatched links fail closed",
    run: () => {
      for (const requirement of [
        "keyboardOperable",
        "exposesExpandedState",
        "associatesControlAndRegion",
        "preservesFocus",
        "initiallyCollapsed",
        "singleExpandedItem",
      ]) {
        const incompleteAccordion = cloneRegistry();
        const accessibility = incompleteAccordion.variants[
          "faq.accordion@v1"
        ].accordionAccessibility;
        assert.ok(accessibility);
        accessibility[requirement] = false;
        assertInvalid(incompleteAccordion);
      }

      const mismatchedModule = cloneRegistry();
      mismatchedModule.variants["hero.standard@v1"].moduleKey = "faq";
      assertInvalid(mismatchedModule);

      const mismatchedFields = cloneRegistry();
      mismatchedFields.variants["hero.standard@v1"].fieldContractKey =
        "faq.standard@v1";
      assertInvalid(mismatchedFields);
    },
  },
  {
    name: "root compatibility and specialization deltas fail closed",
    run: () => {
      const incompatibleModule = cloneRegistry();
      incompatibleModule.modules.hero.compatibleRootVersion = 2;
      assertInvalid(incompatibleModule);

      const incompatibleVariant = cloneRegistry();
      incompatibleVariant.variants["hero.standard@v1"].compatibleRootVersion = 2;
      assertInvalid(incompatibleVariant);

      const widenedModuleLimit = cloneRegistry();
      widenedModuleLimit.modules.hero.rootDelta.textRanges.push({ semanticRole: "h1", absoluteMax: 121 });
      assertInvalid(widenedModuleLimit);

      const widenedVariantLimit = cloneRegistry();
      widenedVariantLimit.modules.hero.rootDelta.textRanges.push({ semanticRole: "h1", recommended: { min: 36, max: 64 }, absoluteMax: 100 });
      widenedVariantLimit.variants["hero.standard@v1"].rootDelta.textRanges.push({ semanticRole: "h1", recommended: { min: 36, max: 70 }, absoluteMax: 110 });
      assertInvalid(widenedVariantLimit);

      const invalidInheritedRange = cloneRegistry();
      invalidInheritedRange.modules.hero.rootDelta.textRanges.push({ semanticRole: "h1", recommended: { min: 36, max: 64 }, absoluteMax: 100 });
      invalidInheritedRange.variants["hero.standard@v1"].rootDelta.textRanges.push({ semanticRole: "h1", absoluteMax: 50 });
      assertInvalid(invalidInheritedRange);

      const duplicateRestriction = cloneRegistry();
      duplicateRestriction.variants["hero.standard@v1"].rootDelta.textRanges.push(
        { semanticRole: "h1", absoluteMax: 100 },
        { semanticRole: "h1", absoluteMax: 90 },
      );
      assertInvalid(duplicateRestriction);

      const unknownRootContract = cloneRegistry();
      unknownRootContract.compatibleRootVersions = [2];
      assertInvalid(unknownRootContract);

      const inheritedPropertyRole = cloneRegistry();
      inheritedPropertyRole.modules.hero.rootDelta.textRanges.push({ semanticRole: "toString", absoluteMax: 1 });
      assert.doesNotThrow(() => assertInvalid(inheritedPropertyRole));
    },
  },
  {
    name: "copy source maps are closed and operational evidence stays separate",
    run: () => {
      const textualFields = Object.values(landingPageModuleCatalogRegistry.variantFieldContracts)
        .flatMap((contract) => flattenFields(contract.fields))
        .filter((field) => field.fieldKind === "text");
      assert.equal(textualFields.length, 30);
      assert.equal(textualFields.every((field) => Boolean(field.copySourceMap)), true);

      const unknownSourceMode = cloneRegistry();
      getMutableTextField(unknownSourceMode, "hero.standard@v1", "hero.standard.title").copySourceMap.sourceMode = "input_catalog";
      assertInvalid(unknownSourceMode);

      const unknownPath = cloneRegistry();
      getMutableTextField(unknownPath, "hero.standard@v1", "hero.standard.title").copySourceMap.researchPath = "businessBuyer.items[]";
      assertInvalid(unknownPath);

      const unknownItemKey = cloneRegistry();
      getMutableTextField(unknownItemKey, "hero.standard@v1", "hero.standard.title").copySourceMap.primaryItemKeys = ["unknown"];
      assertInvalid(unknownItemKey);

      const tooManySources = cloneRegistry();
      getMutableTextField(tooManySources, "hero.standard@v1", "hero.standard.title").copySourceMap.primaryItemKeys = ["trigger", "desire", "belief"];
      assertInvalid(tooManySources);

      const orphanOperationalEvidence = cloneRegistry();
      getMutableTextField(orphanOperationalEvidence, "social_proof.standard@v1", "social_proof.standard.items[].quote").copySourceMap.evidencePath = "social_proof.standard.orphan";
      assertInvalid(orphanOperationalEvidence);

      const orphanMap = cloneRegistry();
      orphanMap.copySourceMaps["hero.standard.orphan"] = structuredClone(orphanMap.copySourceMaps["hero.standard.title"]);
      assertInvalid(orphanMap);
    },
  },
];

for (const testCase of cases) {
  testCase.run();
  console.log(`PASS ${testCase.name}`);
}

console.log(`PASS ${cases.length} landing-page module catalog validation cases`);

function cloneRegistry(): MutableCatalog {
  return structuredClone(
    landingPageModuleCatalogRegistry,
  ) as unknown as MutableCatalog;
}

function cloneModule(moduleKey: LandingPageModuleKey): MutableModule {
  return structuredClone(
    landingPageModuleCatalogRegistry.modules[moduleKey],
  ) as unknown as MutableModule;
}

function assertDeeplyFrozen(value: unknown): void {
  if (!value || typeof value !== "object") return;
  assert.equal(Object.isFrozen(value), true);
  for (const nested of Object.values(value)) assertDeeplyFrozen(nested);
}

function collectFieldKinds(field: Record<string, unknown>, kinds: Set<string>) {
  assert.equal(typeof field.fieldKind, "string");
  kinds.add(field.fieldKind as string);
  if (Array.isArray(field.itemFields)) {
    for (const itemField of field.itemFields) collectFieldKinds(itemField, kinds);
  }
  if (field.label && typeof field.label === "object") {
    collectFieldKinds(field.label as Record<string, unknown>, kinds);
  }
}

function flattenFields(fields: readonly Record<string, unknown>[]): Record<string, unknown>[] {
  return fields.flatMap((field) => [
    field,
    ...(Array.isArray(field.itemFields) ? flattenFields(field.itemFields) : []),
    ...(field.label && typeof field.label === "object" ? flattenFields([field.label as Record<string, unknown>]) : []),
  ]);
}

function getMutableTextField(catalog: MutableCatalog, contractKey: string, path: string): MutableField {
  const field = flattenFields(catalog.variantFieldContracts[contractKey].fields).find((candidate) => candidate.path === path);
  assert.ok(field);
  return field as MutableField;
}

function cloneField(
  contractKey: string,
  fieldIndex: number,
): MutableField {
  return structuredClone(
    landingPageModuleCatalogRegistry.variantFieldContracts[
      contractKey as keyof typeof landingPageModuleCatalogRegistry.variantFieldContracts
    ].fields[fieldIndex],
  ) as unknown as MutableField;
}

function cloneVariant(variantKey: LandingPageVariantKey): MutableVariant {
  return structuredClone(
    landingPageModuleCatalogRegistry.variants[variantKey],
  ) as unknown as MutableVariant;
}

function normalizeFaqFieldPaths(value: unknown): unknown {
  return JSON.parse(
    JSON.stringify(value).replace(/faq\.(?:standard|accordion)/g, "faq.variant"),
  );
}

function assertInvalid(catalog: MutableCatalog): void {
  assert.equal(landingPageModuleCatalogSchema.safeParse(catalog).success, false);
}

type MutableModule = {
  family: string;
  moduleKey: string;
  moduleVersion: number;
  lifecycleStatus: string;
  purpose: string;
  compatibleRootVersion: number;
  rootDelta: MutableRootDelta;
  structuralFunction: string;
  invariants: string[];
  boundaries: string[];
  [key: string]: unknown;
};

type MutableCatalog = {
  family: string;
  moduleCatalogVersion: number;
  compatibleRootVersions: number[];
  copySourceMaps: Record<string, MutableField["copySourceMap"]>;
  modules: Record<string, MutableModule>;
  variantFieldContracts: Record<
    string,
    {
      fieldContractKey: string;
      fields: MutableField[];
    }
  >;
  variants: Record<string, MutableVariant>;
};

type MutableField = {
  fieldKind: string;
  fieldKey: string;
  path: string;
  cardinality: { min: number; max: number };
  policy: string;
  semanticRole?: string;
  support?: string;
  copySourceMap: {
    sourceMode: string;
    researchPath?: string;
    primaryItemKeys?: string[];
    auxiliaryItemKey?: string;
    evidencePath?: string;
  };
  itemFields?: MutableField[];
  label?: MutableField;
  operationalBinding?: string;
  destination?: string;
  [key: string]: unknown;
};

type MutableVariant = {
  variantKey: string;
  variantName: string;
  variantVersion: number;
  moduleKey: string;
  moduleVersion: number;
  fieldContractKey: string;
  lifecycleStatus: string;
  purpose: string;
  compatibleRootVersion: number;
  rootDelta: MutableRootDelta;
  capabilities: string[];
  actionCompatibility?: { supportsPrimaryConversionForm: boolean };
  accordionAccessibility?: Record<string, string | boolean>;
  fallbackChannel?: string;
  creationMotivation?: string;
  [key: string]: unknown;
};

type MutableRootDelta = {
  textRanges: Array<{
    semanticRole: string;
    recommended?: { min: number; max: number };
    absoluteMax?: number;
  }>;
};
