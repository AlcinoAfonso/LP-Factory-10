import assert from "node:assert/strict";

import type { LandingPageRootRegistryEntry } from "./contracts";
import { landingPageRootRegistry } from "./root-registry";
import {
  resolveLandingPageRootParameters,
  resolveLandingPageRootParametersFromRegistry,
} from "./root-resolver";
import {
  countLandingPageRootTextCharacters,
  landingPageRootRegistryEntrySchema,
  normalizeLandingPageRootText,
} from "./root-schema";

type Case = {
  name: string;
  run: () => void;
};

const cases: Case[] = [
  {
    name: "registry v1 is valid",
    run: () => {
      assert.equal(
        landingPageRootRegistryEntrySchema.safeParse(
          landingPageRootRegistry[1],
        ).success,
        true,
      );
    },
  },
  {
    name: "version 1 resolves explicitly",
    run: () => {
      const result = resolveLandingPageRootParameters({
        rootVersion: 1,
        presetKey: "compact",
      });

      assert.equal(result.ok, true);
      assert.equal(result.value.family, "landing_page");
      assert.equal(result.value.rootVersion, 1);
      assert.equal(result.value.lifecycleStatus, "hypothesis");
      assert.equal(result.value.resolvedPresetKey, "compact");
      assert.equal(result.value.visualCriteria.visualHierarchyFollowsSemantic, true);
      assert.equal(result.value.visualCriteria.contrastRequired, true);
      assert.equal(result.value.visualCriteria.legibilityRequired, true);
      assert.equal(result.value.visualCriteria.accessibleNavigationRequired, true);
      assert.equal(result.value.visualCriteria.interactiveStatesRequired, true);
    },
  },
  {
    name: "unknown version fails closed",
    run: () => {
      assert.deepEqual(resolveLandingPageRootParameters({ rootVersion: 999 }), {
        ok: false,
        error: {
          code: "UNKNOWN_ROOT_VERSION",
          message: "Unknown landing_page root version: 999",
        },
      });
    },
  },
  {
    name: "unknown preset fails closed",
    run: () => {
      const result = resolveLandingPageRootParameters({
        rootVersion: 1,
        presetKey: "wide",
      });

      assert.equal(result.ok, false);
      assert.equal(result.error.code, "UNKNOWN_PRESET");
    },
  },
  {
    name: "missing preset uses version default preset",
    run: () => {
      const result = resolveLandingPageRootParameters({ rootVersion: 1 });

      assert.equal(result.ok, true);
      assert.equal(result.value.resolvedPresetKey, "balanced");
      assert.equal(result.value.resolvedPreset.key, "balanced");
    },
  },
  {
    name: "missing default preset fails invalid contract",
    run: () => {
      const registry = withRootMutation((entry) => {
        (entry as unknown as { defaultPreset: string }).defaultPreset =
          "missing";
      });

      const result = resolveLandingPageRootParametersFromRegistry(
        { rootVersion: 1 },
        registry,
      );

      assert.equal(result.ok, false);
      assert.equal(result.error.code, "INVALID_ROOT_CONTRACT");
    },
  },
  {
    name: "structurally invalid root contract fails closed",
    run: () => {
      const registry = withRootMutation((entry) => {
        delete (entry as unknown as { family?: unknown }).family;
      });

      const result = resolveLandingPageRootParametersFromRegistry(
        { rootVersion: 1 },
        registry,
      );

      assert.equal(result.ok, false);
      assert.equal(result.error.code, "INVALID_ROOT_CONTRACT");
    },
  },
  {
    name: "registry key and rootVersion mismatch fails closed",
    run: () => {
      const entry = cloneRootEntry();
      const registry = { 2: entry };

      const result = resolveLandingPageRootParametersFromRegistry(
        { rootVersion: 2 },
        registry,
      );

      assert.equal(result.ok, false);
      assert.equal(result.error.code, "INVALID_ROOT_CONTRACT");
    },
  },
  {
    name: "unknown lifecycle status fails schema",
    run: () => {
      const entry = cloneRootEntry();
      (entry as unknown as { lifecycleStatus: string }).lifecycleStatus =
        "draft";

      assert.equal(landingPageRootRegistryEntrySchema.safeParse(entry).success, false);
    },
  },
  {
    name: "missing semantic role fails schema",
    run: () => {
      const entry = cloneRootEntry();
      delete (entry.semanticRoles as unknown as { h1?: unknown }).h1;

      assert.equal(landingPageRootRegistryEntrySchema.safeParse(entry).success, false);
    },
  },
  {
    name: "unknown semantic role fails schema",
    run: () => {
      const entry = cloneRootEntry();
      (entry.semanticRoles as unknown as Record<string, unknown>).hero_title = {
        key: "hero_title",
        textRange: { recommended: { min: 1, max: 2 }, absoluteMax: 3 },
      };

      assert.equal(landingPageRootRegistryEntrySchema.safeParse(entry).success, false);
    },
  },
  {
    name: "inverted recommended range fails schema",
    run: () => {
      const entry = cloneRootEntry();
      (
        entry.semanticRoles.h1.textRange.recommended as unknown as {
          min: number;
        }
      ).min = 80;

      assert.equal(landingPageRootRegistryEntrySchema.safeParse(entry).success, false);
    },
  },
  {
    name: "recommended range above absolute max fails schema",
    run: () => {
      const entry = cloneRootEntry();
      (
        entry.semanticRoles.h1.textRange.recommended as unknown as {
          max: number;
        }
      ).max = 999;

      assert.equal(landingPageRootRegistryEntrySchema.safeParse(entry).success, false);
    },
  },
  {
    name: "absolute max below one fails schema",
    run: () => {
      const entry = cloneRootEntry();
      (
        entry.semanticRoles.h1.textRange as unknown as {
          absoluteMax: number;
        }
      ).absoluteMax = 0;

      assert.equal(landingPageRootRegistryEntrySchema.safeParse(entry).success, false);
    },
  },
  {
    name: "version 1 spacing options are valid",
    run: () => {
      const entry = cloneRootEntry();

      assert.deepEqual(entry.commonOptions.spacing, [
        "compact",
        "default",
        "spacious",
      ]);
      assert.equal(landingPageRootRegistryEntrySchema.safeParse(entry).success, true);
    },
  },
  {
    name: "duplicate spacing option fails schema",
    run: () => {
      const entry = cloneRootEntry();
      (entry.commonOptions as unknown as { spacing: string[] }).spacing = [
        "compact",
        "default",
        "default",
        "spacious",
      ];

      assert.equal(landingPageRootRegistryEntrySchema.safeParse(entry).success, false);
    },
  },
  {
    name: "missing required v1 spacing option fails schema",
    run: () => {
      const entry = cloneRootEntry();
      (entry.commonOptions as unknown as { spacing: string[] }).spacing = [
        "compact",
        "default",
      ];

      assert.equal(landingPageRootRegistryEntrySchema.safeParse(entry).success, false);
    },
  },
  {
    name: "preset spacing not declared by version fails schema",
    run: () => {
      const entry = cloneRootEntry();
      (entry as unknown as { rootVersion: number }).rootVersion = 2;
      (entry.commonOptions as unknown as { spacing: string[] }).spacing = [
        "compact",
        "spacious",
      ];

      assert.equal(landingPageRootRegistryEntrySchema.safeParse(entry).success, false);
    },
  },
  {
    name: "unknown spacing fails schema",
    run: () => {
      const entry = cloneRootEntry();
      (entry.commonOptions.spacing as unknown as string[]).push("wide");

      assert.equal(landingPageRootRegistryEntrySchema.safeParse(entry).success, false);
    },
  },
  {
    name: "unknown visual role fails schema",
    run: () => {
      const entry = cloneRootEntry();
      (entry.visualRoles as unknown as Record<string, unknown>).button = {
        key: "button",
        description: "Concrete button role",
      };

      assert.equal(landingPageRootRegistryEntrySchema.safeParse(entry).success, false);
    },
  },
  {
    name: "concrete token or free style fails schema",
    run: () => {
      const entry = cloneRootEntry();
      (entry.visualRoles.text as unknown as { description: string }).description =
        "Use Tailwind class text-ink-900";

      assert.equal(landingPageRootRegistryEntrySchema.safeParse(entry).success, false);
    },
  },
  {
    name: "text normalization and unicode counting are stable",
    run: () => {
      assert.equal(normalizeLandingPageRootText("  Olá\t\tmundo\r\nnovo  "), "Olá mundo\nnovo");
      assert.equal(countLandingPageRootTextCharacters("  A🙂\r\nB  "), 4);
    },
  },
  {
    name: "nested preset mutation is blocked",
    run: () => {
      const result = resolveLandingPageRootParameters({ rootVersion: 1 });
      assert.equal(result.ok, true);
      assert.throws(() => {
        (result.value.resolvedPreset.typography.h1 as { min: string }).min =
          "9rem";
      }, TypeError);
      assert.equal(result.value.resolvedPreset.typography.h1.min, "2.25rem");
    },
  },
  {
    name: "nested semantic role mutation is blocked",
    run: () => {
      const result = resolveLandingPageRootParameters({ rootVersion: 1 });
      assert.equal(result.ok, true);
      assert.throws(() => {
        (
          result.value.semanticRoles.h1.textRange.recommended as unknown as {
            max: number;
          }
        ).max = 999;
      }, TypeError);
      assert.equal(result.value.semanticRoles.h1.textRange.recommended.max, 72);
    },
  },
  {
    name: "resolved calls do not share mutable references",
    run: () => {
      const first = resolveLandingPageRootParameters({ rootVersion: 1 });
      const second = resolveLandingPageRootParameters({ rootVersion: 1 });

      assert.equal(first.ok, true);
      assert.equal(second.ok, true);
      assert.notEqual(first.value, second.value);
      assert.notEqual(first.value.resolvedPreset, second.value.resolvedPreset);
      assert.notEqual(first.value.semanticRoles.h1, second.value.semanticRoles.h1);
    },
  },
  {
    name: "new version can be added and resolved without changing v1",
    run: () => {
      const versionOneSnapshot = cloneRootEntry();
      const versionOne = cloneRootEntry();
      const versionTwo = cloneRootEntry();
      (versionTwo as unknown as { rootVersion: number }).rootVersion = 2;

      const registry = {
        1: versionOne,
        2: versionTwo,
      };

      assert.equal(registry[1].rootVersion, 1);
      assert.equal(registry[2].rootVersion, 2);
      assert.equal(
        landingPageRootRegistryEntrySchema.safeParse(registry[1]).success,
        true,
      );
      assert.equal(
        landingPageRootRegistryEntrySchema.safeParse(registry[2]).success,
        true,
      );

      const resolvedVersionOne = resolveLandingPageRootParametersFromRegistry(
        { rootVersion: 1 },
        registry,
      );
      const resolvedVersionTwo = resolveLandingPageRootParametersFromRegistry(
        { rootVersion: 2 },
        registry,
      );

      assert.equal(resolvedVersionOne.ok, true);
      assert.equal(resolvedVersionTwo.ok, true);
      assert.equal(resolvedVersionOne.value.rootVersion, 1);
      assert.equal(resolvedVersionTwo.value.rootVersion, 2);
      assert.deepEqual(registry[1], versionOneSnapshot);
      assert.equal(Object.isFrozen(resolvedVersionOne.value), true);
      assert.equal(Object.isFrozen(resolvedVersionTwo.value), true);

      (registry[2] as unknown as { rootVersion: number }).rootVersion = 1;
      const mismatchedVersion = resolveLandingPageRootParametersFromRegistry(
        { rootVersion: 2 },
        registry,
      );

      assert.equal(mismatchedVersion.ok, false);
      assert.equal(mismatchedVersion.error.code, "INVALID_ROOT_CONTRACT");
    },
  },
  {
    name: "root contract has no modules variants composition or renderer",
    run: () => {
      const serialized = JSON.stringify(landingPageRootRegistry[1]);

      assert.equal(/module|variant|composition|renderer/i.test(serialized), false);
    },
  },
];

for (const validationCase of cases) {
  validationCase.run();
  console.log(`ok - ${validationCase.name}`);
}

function cloneRootEntry(): LandingPageRootRegistryEntry {
  return JSON.parse(
    JSON.stringify(landingPageRootRegistry[1]),
  ) as LandingPageRootRegistryEntry;
}

function withRootMutation(
  mutate: (entry: LandingPageRootRegistryEntry) => void,
): Record<number, LandingPageRootRegistryEntry> {
  const entry = cloneRootEntry();
  mutate(entry);
  return { 1: entry };
}
