import assert from "node:assert/strict";

import {
  landingPageModuleKeys,
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
};
