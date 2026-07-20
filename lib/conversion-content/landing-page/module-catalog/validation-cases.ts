import assert from "node:assert/strict";

import {
  landingPageFieldKinds,
  landingPageModuleKeys,
  landingPageVariantFieldContractKeys,
  type LandingPageModuleKey,
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

function assertInvalid(catalog: MutableCatalog): void {
  assert.equal(landingPageModuleCatalogSchema.safeParse(catalog).success, false);
}

type MutableModule = {
  family: string;
  moduleKey: string;
  moduleVersion: number;
  lifecycleStatus: string;
  purpose: string;
  structuralFunction: string;
  invariants: string[];
  boundaries: string[];
  [key: string]: unknown;
};

type MutableCatalog = {
  family: string;
  moduleCatalogVersion: number;
  compatibleRootVersions: number[];
  modules: Record<string, MutableModule>;
  variantFieldContracts: Record<
    string,
    {
      fieldContractKey: string;
      fields: MutableField[];
    }
  >;
};

type MutableField = {
  fieldKind: string;
  fieldKey: string;
  path: string;
  cardinality: { min: number; max: number };
  policy: string;
  semanticRole?: string;
  support?: string;
  itemFields?: MutableField[];
  label?: MutableField;
  operationalBinding?: string;
  destination?: string;
  [key: string]: unknown;
};
