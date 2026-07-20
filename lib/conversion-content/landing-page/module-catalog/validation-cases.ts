import assert from "node:assert/strict";

import {
  landingPageModuleKeys,
  type LandingPageModuleCatalogEntry,
  type LandingPageModuleDefinition,
} from "./contracts";
import { landingPageModuleCatalogRegistry } from "./registry";
import { landingPageModuleCatalogEntrySchema } from "./schema";

type Case = Readonly<{
  name: string;
  run: () => void;
}>;

const cases: readonly Case[] = [
  {
    name: "module catalog v1 is valid and has the approved metadata",
    run: () => {
      const catalog = landingPageModuleCatalogRegistry[1];

      assert.equal(landingPageModuleCatalogEntrySchema.safeParse(catalog).success, true);
      assert.equal(catalog.family, "landing_page");
      assert.equal(catalog.moduleCatalogVersion, 1);
      assert.deepEqual(catalog.compatibleRootVersions, [1]);
    },
  },
  {
    name: "module catalog v1 contains exactly the nine approved identities",
    run: () => {
      const modules = landingPageModuleCatalogRegistry[1].modules;

      assert.deepEqual(Object.keys(modules), landingPageModuleKeys);
      for (const moduleKey of landingPageModuleKeys) {
        assert.equal(modules[moduleKey].moduleKey, moduleKey);
        assert.equal(modules[moduleKey].moduleVersion, 1);
        assert.equal(modules[moduleKey].lifecycleStatus, "hypothesis");
        assert.equal(modules[moduleKey].purpose, "controlled_test");
      }
    },
  },
  {
    name: "commercial activation cannot replace the landing page family",
    run: () => {
      const catalog = cloneCatalog();
      (catalog as unknown as { family: string }).family =
        "commercial_activation";

      assertInvalid(catalog);
    },
  },
  {
    name: "module functions boundaries and invariants are closed structural identifiers",
    run: () => {
      const modules = landingPageModuleCatalogRegistry[1].modules;

      for (const moduleDefinition of Object.values(modules)) {
        assert.match(moduleDefinition.function, /^[a-z][a-z0-9_]*$/);
        assert.ok(moduleDefinition.boundaries.length > 0);
        assert.ok(moduleDefinition.invariants.length > 0);
        assert.equal(
          new Set(moduleDefinition.boundaries).size,
          moduleDefinition.boundaries.length,
        );
        assert.equal(
          new Set(moduleDefinition.invariants).size,
          moduleDefinition.invariants.length,
        );
      }
    },
  },
  {
    name: "unknown missing or mismatched module identities fail closed",
    run: () => {
      const unknown = cloneCatalog();
      (unknown.modules as Record<string, LandingPageModuleDefinition>).unknown =
        fixtureModule("hero");
      assertInvalid(unknown);

      const missing = cloneCatalog();
      delete (missing.modules as Partial<Record<string, unknown>>).hero;
      assertInvalid(missing);

      const mismatched = cloneCatalog();
      (mismatched.modules.hero as MutableModule).moduleKey = "faq";
      assertInvalid(mismatched);
    },
  },
  {
    name: "invalid lifecycle purpose version and structural definitions fail closed",
    run: () => {
      assertMutationInvalid((catalog) => {
        (catalog.modules.hero as MutableModule).lifecycleStatus = "draft" as never;
      });
      assertMutationInvalid((catalog) => {
        (catalog.modules.hero as MutableModule).purpose = "production" as never;
      });
      assertMutationInvalid((catalog) => {
        (catalog.modules.hero as MutableModule).moduleVersion = 2;
      });
      assertMutationInvalid((catalog) => {
        (catalog.modules.hero as MutableModule).function = "";
      });
      assertMutationInvalid((catalog) => {
        (catalog.modules.hero as MutableModule).boundaries = [
          "opening_section_only",
          "opening_section_only",
        ];
      });
      assertMutationInvalid((catalog) => {
        (catalog.modules.hero as MutableModule).invariants = [];
      });
    },
  },
  {
    name: "a valid but unapproved v1 module function fails closed",
    run: () => {
      assertMutationInvalid((catalog) => {
        assert.equal(catalog.modules.hero.moduleVersion, 1);
        (catalog.modules.hero as MutableModule).function =
          "unapproved_but_valid_function";
      });
    },
  },
  {
    name: "a valid but unapproved v1 module boundary fails closed",
    run: () => {
      assertMutationInvalid((catalog) => {
        assert.equal(catalog.modules.hero.moduleVersion, 1);
        (catalog.modules.hero as MutableModule).boundaries = [
          "unapproved_but_valid_boundary",
          ...catalog.modules.hero.boundaries.slice(1),
        ];
      });
    },
  },
  {
    name: "a valid but unapproved v1 module invariant fails closed",
    run: () => {
      assertMutationInvalid((catalog) => {
        assert.equal(catalog.modules.hero.moduleVersion, 1);
        (catalog.modules.hero as MutableModule).invariants = [
          "unapproved_but_valid_invariant",
          ...catalog.modules.hero.invariants.slice(1),
        ];
      });
    },
  },
  {
    name: "concrete context and future phase contracts are rejected",
    run: () => {
      const forbiddenKeys = [
        "taxon",
        "campaign",
        "plan",
        "copy",
        "asset",
        "order",
        "quantity",
        "content",
        "variants",
        "fields",
        "copySourceMap",
        "funnelCopyProfile",
        "capabilities",
        "rootDelta",
      ] as const;

      for (const forbiddenKey of forbiddenKeys) {
        assertMutationInvalid((catalog) => {
          (catalog.modules.hero as unknown as Record<string, unknown>)[
            forbiddenKey
          ] = {};
        });
      }
    },
  },
  {
    name: "catalog and nested structural definitions are deeply immutable",
    run: () => {
      const catalog = landingPageModuleCatalogRegistry[1];

      assert.equal(Object.isFrozen(landingPageModuleCatalogRegistry), true);
      assert.equal(Object.isFrozen(catalog), true);
      assert.equal(Object.isFrozen(catalog.modules.hero), true);
      assert.equal(Object.isFrozen(catalog.modules.hero.boundaries), true);
      assert.throws(() => {
        (catalog.modules.hero.boundaries as string[]).push("forbidden");
      }, TypeError);
    },
  },
];

for (const validationCase of cases) {
  validationCase.run();
  console.log(`ok - ${validationCase.name}`);
}

function assertInvalid(catalog: LandingPageModuleCatalogEntry) {
  assert.equal(landingPageModuleCatalogEntrySchema.safeParse(catalog).success, false);
}

function assertMutationInvalid(
  mutate: (catalog: LandingPageModuleCatalogEntry) => void,
) {
  const catalog = cloneCatalog();
  mutate(catalog);
  assertInvalid(catalog);
}

function cloneCatalog(): LandingPageModuleCatalogEntry {
  return JSON.parse(
    JSON.stringify(landingPageModuleCatalogRegistry[1]),
  ) as LandingPageModuleCatalogEntry;
}

function fixtureModule(
  moduleKey: LandingPageModuleDefinition["moduleKey"],
): LandingPageModuleDefinition {
  return {
    moduleKey,
    moduleVersion: 1,
    lifecycleStatus: "hypothesis",
    purpose: "controlled_test",
    function: "fixture_function",
    boundaries: ["fixture_boundary"],
    invariants: ["fixture_invariant"],
  };
}

type MutableModule = {
  -readonly [Key in keyof LandingPageModuleDefinition]: LandingPageModuleDefinition[Key];
};
