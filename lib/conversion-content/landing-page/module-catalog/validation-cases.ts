import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { landingPageInputCatalogRegistry } from "../input-catalog";
import {
  countLandingPageRootTextCharacters,
  normalizeLandingPageRootText,
  resolveLandingPageRootParameters,
} from "..";
import {
  landingPageModuleKeys,
  type LandingPageModuleCatalogEntry,
  type LandingPageModuleDefinition,
  type LandingPageModuleFieldCatalogEntry,
  type LandingPageModuleVariantCatalogEntry,
} from "./contracts";
import { validateLandingPageModuleFieldPayload } from "./payload-validator";
import {
  landingPageModuleCatalogRegistry,
  landingPageModuleFieldCatalogRegistry,
  landingPageModuleVariantCatalogRegistry,
  resolveLandingPageModuleVariantDefinitionInternal,
} from "./registry";
import {
  landingPageModuleCatalogEntrySchema,
  landingPageModuleFieldCatalogEntrySchema,
  landingPageModuleVariantCatalogEntrySchema,
} from "./schema";

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
    name: "field catalog v1 is valid and contains all five field kinds",
    run: () => {
      const fieldCatalog = landingPageModuleFieldCatalogRegistry[1];
      assert.equal(
        landingPageModuleFieldCatalogEntrySchema.safeParse(fieldCatalog).success,
        true,
      );

      const fieldKinds = new Set(
        Object.values(fieldCatalog.modules).flatMap((moduleDefinition) =>
          Object.values(moduleDefinition.fields).map((field) => field.fieldKind),
        ),
      );
      assert.deepEqual([...fieldKinds].sort(), [
        "action",
        "collection",
        "image",
        "reference",
        "text",
      ]);
    },
  },
  {
    name: "approved payloads for all nine modules are valid",
    run: () => {
      for (const moduleKey of landingPageModuleKeys) {
        assert.equal(
          validateLandingPageModuleFieldPayload(
            moduleKey,
            validPayloads[moduleKey],
          ).ok,
          true,
        );
      }
    },
  },
  {
    name: "unknown runtime module key returns invalid without throwing",
    run: () => {
      let result: ReturnType<typeof validateLandingPageModuleFieldPayload>;

      assert.doesNotThrow(() => {
        result = validateLandingPageModuleFieldPayload(
          "unknown_module" as LandingPageModuleDefinition["moduleKey"],
          {},
        );
      });
      assert.deepEqual(result!, { ok: false });
    },
  },
  {
    name: "collection minimum and maximum cardinalities are enforced",
    run: () => {
      assert.equal(
        validateLandingPageModuleFieldPayload("trust_bar", trustBarPayload(2)).ok,
        true,
      );
      assert.equal(
        validateLandingPageModuleFieldPayload("trust_bar", trustBarPayload(4)).ok,
        true,
      );
      assert.equal(
        validateLandingPageModuleFieldPayload("trust_bar", trustBarPayload(1)).ok,
        false,
      );
      assert.equal(
        validateLandingPageModuleFieldPayload("trust_bar", trustBarPayload(5)).ok,
        false,
      );
    },
  },
  {
    name: "invalid field cardinality fails closed",
    run: () => {
      assertFieldCatalogMutationInvalid((catalog) => {
        mutableField(catalog, "trust_bar", "items").cardinality = {
          min: 4,
          max: 2,
        };
      });
    },
  },
  {
    name: "nested collection contract fails closed",
    run: () => {
      assertFieldCatalogMutationInvalid((catalog) => {
        mutableFields(catalog, "trust_bar")["items[].text"] = {
          path: "items[].text",
          fieldKind: "collection",
          cardinality: { min: 1, max: 2 },
          policy: "not_copy",
        };
      });
    },
  },
  {
    name: "additional payload field and additional contract field fail closed",
    run: () => {
      const heroPayload = validPayloads.hero as Record<string, unknown>;
      assert.equal(
        validateLandingPageModuleFieldPayload("hero", {
          ...heroPayload,
          extra: "not allowed",
        }).ok,
        false,
      );
      assertFieldCatalogMutationInvalid((catalog) => {
        mutableFields(catalog, "hero").extra = {
          path: "extra",
          fieldKind: "text",
          semanticRole: "paragraph",
          cardinality: { min: 0, max: 1 },
          policy: "hybrid",
          support: "when_factual",
        };
      });
    },
  },
  {
    name: "unknown field path fails closed",
    run: () => {
      assertFieldCatalogMutationInvalid((catalog) => {
        const fields = mutableFields(catalog, "hero");
        const title = fields.title;
        delete fields.title;
        fields.unknownPath = { ...title, path: "unknownPath" };
      });
    },
  },
  {
    name: "incompatible field policy fails closed",
    run: () => {
      assertFieldCatalogMutationInvalid((catalog) => {
        mutableField(catalog, "hero", "title").policy =
          "technical_reference";
      });
    },
  },
  {
    name: "incompatible field support fails closed",
    run: () => {
      assertFieldCatalogMutationInvalid((catalog) => {
        mutableField(catalog, "social_proof", "items[].quote").support =
          "when_factual";
      });
    },
  },
  {
    name: "visible text without a semantic role fails closed",
    run: () => {
      assertFieldCatalogMutationInvalid((catalog) => {
        delete mutableField(catalog, "hero", "title").semanticRole;
      });
    },
  },
  {
    name: "unknown field kind and invalid structural combination fail closed",
    run: () => {
      assertFieldCatalogMutationInvalid((catalog) => {
        mutableField(catalog, "hero", "title").fieldKind = "video";
      });
      assertFieldCatalogMutationInvalid((catalog) => {
        mutableField(catalog, "hero", "media").support = "when_present";
      });
    },
  },
  {
    name: "action payload rejects concrete destination and channel",
    run: () => {
      const heroPayload = validPayloads.hero as Record<string, unknown>;
      assert.equal(
        validateLandingPageModuleFieldPayload("hero", {
          ...heroPayload,
          primaryCta: {
            label: "Comecar",
            destination: "https://example.com",
          },
        }).ok,
        false,
      );
      assert.equal(
        validateLandingPageModuleFieldPayload("hero", {
          ...heroPayload,
          primaryCta: { label: "Comecar", channel: "whatsapp" },
        }).ok,
        false,
      );
    },
  },
  {
    name: "image payload enforces mode, alt text, and visibility",
    run: () => {
      const heroPayload = validPayloads.hero as Record<string, unknown>;
      assert.equal(
        validateLandingPageModuleFieldPayload("hero", {
          ...heroPayload,
          media: imagePayload("informative", ""),
        }).ok,
        false,
      );
      assert.equal(
        validateLandingPageModuleFieldPayload("hero", {
          ...heroPayload,
          media: imagePayload("decorative", "Visible alternative"),
        }).ok,
        false,
      );
      assert.equal(
        validateLandingPageModuleFieldPayload("hero", {
          ...heroPayload,
          media: {
            ...imagePayload("informative", "Product overview"),
            visibility: "desktop_only",
          },
        }).ok,
        false,
      );
    },
  },
  {
    name: "reference payload rejects unknown reference kind",
    run: () => {
      assert.equal(
        validateLandingPageModuleFieldPayload("social_proof", {
          title: "Resultados",
          items: [
            {
              quote: "Resultado comprovado",
              attribution: "Cliente verificado",
              evidenceRef: {
                referenceKind: "external_url",
                evidenceRef: "evidence/customer-1",
              },
            },
          ],
        }).ok,
        false,
      );
    },
  },
  {
    name: "ten approved variant identities resolve internally",
    run: () => {
      const catalog = landingPageModuleVariantCatalogRegistry[1];
      assert.equal(
        landingPageModuleVariantCatalogEntrySchema.safeParse(catalog).success,
        true,
      );

      const identities: string[] = [];
      for (const [moduleKey, moduleEntry] of Object.entries(catalog.modules)) {
        for (const [variantKey, variant] of Object.entries(
          moduleEntry.variants,
        )) {
          identities.push(
            `${moduleKey}.${variantKey}@v${variant.variantVersion}`,
          );
          assert.strictEqual(
            resolveLandingPageModuleVariantDefinitionInternal({
              moduleKey,
              moduleVersion: moduleEntry.moduleVersion,
              variantKey,
              variantVersion: variant.variantVersion,
            }),
            variant,
          );
        }
      }

      assert.deepEqual(identities, [
        "hero.standard@v1",
        "trust_bar.standard@v1",
        "problem_solution.standard@v1",
        "offer.standard@v1",
        "process.standard@v1",
        "technical_assurance.standard@v1",
        "social_proof.standard@v1",
        "faq.standard@v1",
        "faq.accordion@v1",
        "final_cta.standard@v1",
      ]);
    },
  },
  {
    name: "variants bind to one module version and approved fields only",
    run: () => {
      const catalog = landingPageModuleVariantCatalogRegistry[1];
      for (const [moduleKey, moduleEntry] of Object.entries(catalog.modules)) {
        for (const variant of Object.values(moduleEntry.variants)) {
          assert.equal(
            variant.compatibleModuleVersion,
            moduleEntry.moduleVersion,
          );
          assert.deepEqual(
            variant.fields,
            landingPageModuleFieldCatalogRegistry[1].modules[
              moduleKey as LandingPageModuleDefinition["moduleKey"]
            ].fields,
          );
          assert.notStrictEqual(
            variant.fields,
            landingPageModuleFieldCatalogRegistry[1].modules[
              moduleKey as LandingPageModuleDefinition["moduleKey"]
            ].fields,
          );
        }
      }

      assert.deepEqual(catalog.modules.hero.variants.standard.capabilities, [
        "primary_action",
        "image_asset",
      ]);
      assert.deepEqual(
        catalog.modules.final_cta.variants.standard.capabilities,
        ["primary_action"],
      );
    },
  },
  {
    name: "faq variants own independent contracts and accordion declares wcag 2.2",
    run: () => {
      const catalog = landingPageModuleVariantCatalogRegistry[1];
      const standard = catalog.modules.faq.variants.standard;
      const accordion = catalog.modules.faq.variants.accordion;
      const interaction = catalog.capabilities.accordion_interaction;

      assert.notStrictEqual(standard, accordion);
      assert.notStrictEqual(standard.fields, accordion.fields);
      assert.notStrictEqual(
        standard.fields.title,
        accordion.fields.title,
      );
      assert.deepEqual(standard.fields, accordion.fields);
      assert.deepEqual(standard.capabilities, []);
      assert.deepEqual(accordion.capabilities, ["accordion_interaction"]);
      assert.deepEqual(interaction, {
        capabilityKey: "accordion_interaction",
        initialState: "all_closed",
        expansionMode: "single",
        toggleMode: "own_control",
        keyboardRequired: true,
        stateExposed: true,
        controlContentAssociationRequired: true,
        focusPreserved: true,
        focusVisible: "inherited_from_root",
        wcagBaseline: "2.2",
      });
    },
  },
  {
    name: "unknown capability fails closed",
    run: () => {
      assertVariantCatalogMutationInvalid((catalog) => {
        mutableVariantCapabilities(catalog, "hero", "standard").push(
          "unknown_capability",
        );
      });
    },
  },
  {
    name: "primary action is a strict subset of public conversion channels",
    run: () => {
      const inputField = landingPageInputCatalogRegistry[1].universal.entries.find(
        (entry) =>
          entry.kind === "field" &&
          entry.fieldKey === "primary_conversion_channel",
      );
      assert.equal(inputField?.kind, "field");
      assert.equal(inputField?.validation.kind, "enum");
      if (!inputField || inputField.validation.kind !== "enum") {
        assert.fail("primary conversion channel enum must exist");
      }

      const capability =
        landingPageModuleVariantCatalogRegistry[1].capabilities.primary_action;
      for (const value of capability.allowedValues) {
        assert.equal(inputField.validation.allowedValues.includes(value), true);
      }
      assert.equal(inputField.validation.allowedValues.includes("form"), true);
      assert.equal(
        (capability.allowedValues as readonly string[]).includes("form"),
        false,
      );
      assert.equal(
        landingPageModuleVariantCatalogRegistry[1].modules.hero.variants.standard.capabilities.includes(
          "primary_action",
        ),
        true,
      );
      assert.equal(
        landingPageModuleVariantCatalogRegistry[1].modules.final_cta.variants.standard.capabilities.includes(
          "primary_action",
        ),
        true,
      );
    },
  },
  {
    name: "unknown identity module and incompatible versions fail closed",
    run: () => {
      assert.equal(
        resolveLandingPageModuleVariantDefinitionInternal({
          moduleKey: "unknown_module",
          moduleVersion: 1,
          variantKey: "standard",
          variantVersion: 1,
        }),
        undefined,
      );
      assert.equal(
        resolveLandingPageModuleVariantDefinitionInternal({
          moduleKey: "hero",
          moduleVersion: 2,
          variantKey: "standard",
          variantVersion: 1,
        }),
        undefined,
      );
      assert.equal(
        resolveLandingPageModuleVariantDefinitionInternal({
          moduleKey: "hero",
          moduleVersion: 1,
          variantKey: "unknown_variant",
          variantVersion: 1,
        }),
        undefined,
      );
      assert.equal(
        resolveLandingPageModuleVariantDefinitionInternal({
          moduleKey: "hero",
          moduleVersion: 1,
          variantKey: "standard",
          variantVersion: 2,
        }),
        undefined,
      );
      assertVariantCatalogMutationInvalid((catalog) => {
        mutableVariant(catalog, "hero", "standard").compatibleModuleVersion =
          2;
      });
    },
  },
  {
    name: "variant field outside the approved contract fails closed",
    run: () => {
      assertVariantCatalogMutationInvalid((catalog) => {
        const fields = mutableVariantFields(catalog, "faq", "accordion");
        delete fields["items[].answer"];
      });
      assertVariantCatalogMutationInvalid((catalog) => {
        mutableVariantFields(catalog, "faq", "standard").unknownField = {
          path: "unknownField",
          fieldKind: "text",
          semanticRole: "paragraph",
          cardinality: { min: 0, max: 1 },
          policy: "hybrid",
          support: "when_factual",
        };
      });
    },
  },
  {
    name: "commercial context alone cannot create a variant",
    run: () => {
      for (const variantKey of [
        "taxon_specific",
        "copy_specific",
        "plan_specific",
        "campaign_specific",
        "asset_specific",
        "order_specific",
        "quantity_specific",
      ]) {
        assertVariantCatalogMutationInvalid((catalog) => {
          const variants = mutableVariants(catalog, "hero");
          variants[variantKey] = {
            ...JSON.parse(JSON.stringify(variants.standard)),
            variantKey,
          };
        });
      }
    },
  },
  {
    name: "root text normalization and absolute maximum use the public root boundary",
    run: () => {
      const rootParameters = resolveApprovedRootParameters();
      const h1Range = rootParameters.semanticRoles.h1.textRange;
      const exactMaximum = "a".repeat(h1Range.absoluteMax);
      const aboveMaximum = `${exactMaximum}a`;
      const outsideRecommended = "a".repeat(h1Range.recommended.max + 1);

      assert.equal(
        validateLandingPageModuleFieldPayload(
          "hero",
          heroPayloadWithTitle(exactMaximum),
        ).ok,
        true,
      );
      assert.equal(
        validateLandingPageModuleFieldPayload(
          "hero",
          heroPayloadWithTitle(aboveMaximum),
        ).ok,
        false,
      );
      assert.equal(
        validateLandingPageModuleFieldPayload(
          "hero",
          heroPayloadWithTitle(" \t\r\n "),
        ).ok,
        false,
      );

      const rawText = "  Alpha \t Beta\r\nGamma  ";
      assert.equal(
        normalizeLandingPageRootText(rawText),
        "Alpha Beta\nGamma",
      );
      assert.equal(
        countLandingPageRootTextCharacters(rawText),
        Array.from("Alpha Beta\nGamma").length,
      );
      assert.equal(
        validateLandingPageModuleFieldPayload(
          "hero",
          heroPayloadWithTitle(`  ${exactMaximum}  `),
        ).ok,
        true,
      );

      assert.ok(h1Range.recommended.max < h1Range.absoluteMax);
      assert.equal(
        validateLandingPageModuleFieldPayload(
          "hero",
          heroPayloadWithTitle(outsideRecommended),
        ).ok,
        true,
      );
    },
  },
  {
    name: "root resolution errors are converted to ROOT_RESOLUTION_FAILED",
    run: () => {
      assert.deepEqual(
        validateLandingPageModuleFieldPayload("hero", validPayloads.hero, {
          rootVersion: Number.MAX_SAFE_INTEGER,
        }),
        { ok: false, error: { code: "ROOT_RESOLUTION_FAILED" } },
      );
    },
  },
  {
    name: "v1 modules and variants accept only an empty root delta",
    run: () => {
      for (const moduleDefinition of Object.values(
        landingPageModuleCatalogRegistry[1].modules,
      )) {
        assert.deepEqual(moduleDefinition.rootDelta, {});
      }

      for (const moduleEntry of Object.values(
        landingPageModuleVariantCatalogRegistry[1].modules,
      )) {
        assert.deepEqual(moduleEntry.rootDelta, {});
        for (const variant of Object.values(moduleEntry.variants)) {
          assert.deepEqual(variant.rootDelta, {});
        }
      }

      assertMutationInvalid((catalog) => {
        (catalog.modules.hero.rootDelta as Record<string, unknown>).spacing =
          "compact";
      });
      assertVariantCatalogMutationInvalid((catalog) => {
        (
          catalog.modules.hero.rootDelta as Record<string, unknown>
        ).presetKey = "compact";
      });
      assertVariantCatalogMutationInvalid((catalog) => {
        (mutableVariant(catalog, "hero", "standard").rootDelta as Record<
          string,
          unknown
        >).spacing = "compact";
      });
    },
  },
  {
    name: "module catalog does not import or duplicate the root implementation",
    run: () => {
      const sources = [
        "contracts.ts",
        "payload-validator.ts",
        "registry.ts",
        "schema.ts",
      ].map((fileName) =>
        readFileSync(
          `lib/conversion-content/landing-page/module-catalog/${fileName}`,
          "utf8",
        ),
      );
      const combinedSource = sources.join("\n");

      assert.doesNotMatch(combinedSource, /root-registry/);
      assert.doesNotMatch(
        combinedSource,
        /function\s+(?:normalizeLandingPageRootText|countLandingPageRootTextCharacters)/,
      );
      assert.doesNotMatch(
        combinedSource,
        /(?:const|let|var)\s+landingPageRootSemanticRoleKeys\s*=/,
      );
      assert.match(sources[1], /from "\.\.\/index"/);
    },
  },
  {
    name: "catalog and nested structural definitions are deeply immutable",
    run: () => {
      const catalog = landingPageModuleCatalogRegistry[1];
      const fieldCatalog = landingPageModuleFieldCatalogRegistry[1];
      const variantCatalog = landingPageModuleVariantCatalogRegistry[1];

      assert.equal(Object.isFrozen(landingPageModuleCatalogRegistry), true);
      assert.equal(Object.isFrozen(catalog), true);
      assert.equal(Object.isFrozen(catalog.modules.hero), true);
      assert.equal(Object.isFrozen(catalog.modules.hero.rootDelta), true);
      assert.equal(Object.isFrozen(catalog.modules.hero.boundaries), true);
      assert.equal(Object.isFrozen(landingPageModuleFieldCatalogRegistry), true);
      assert.equal(Object.isFrozen(fieldCatalog.modules.hero.fields), true);
      assert.equal(
        Object.isFrozen(fieldCatalog.modules.hero.fields.title.cardinality),
        true,
      );
      assert.equal(Object.isFrozen(landingPageModuleVariantCatalogRegistry), true);
      assert.equal(Object.isFrozen(variantCatalog.modules.faq.variants), true);
      assert.equal(Object.isFrozen(variantCatalog.modules.faq.rootDelta), true);
      assert.equal(
        Object.isFrozen(variantCatalog.modules.faq.variants.accordion.fields),
        true,
      );
      assert.equal(
        Object.isFrozen(
          variantCatalog.modules.faq.variants.accordion.rootDelta,
        ),
        true,
      );
      assert.equal(
        Object.isFrozen(variantCatalog.capabilities.accordion_interaction),
        true,
      );
      assert.throws(() => {
        (catalog.modules.hero.boundaries as string[]).push("forbidden");
      }, TypeError);
      assert.throws(() => {
        (
          fieldCatalog.modules.hero.fields.title.cardinality as {
            min: number;
          }
        ).min = 0;
      }, TypeError);
      assert.throws(() => {
        (
          variantCatalog.modules.faq.variants.accordion
            .capabilities as string[]
        ).push("forbidden");
      }, TypeError);
    },
  },
];

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

function assertFieldCatalogInvalid(catalog: LandingPageModuleFieldCatalogEntry) {
  assert.equal(
    landingPageModuleFieldCatalogEntrySchema.safeParse(catalog).success,
    false,
  );
}

function assertFieldCatalogMutationInvalid(
  mutate: (catalog: LandingPageModuleFieldCatalogEntry) => void,
) {
  const catalog = cloneFieldCatalog();
  mutate(catalog);
  assertFieldCatalogInvalid(catalog);
}

function cloneFieldCatalog(): LandingPageModuleFieldCatalogEntry {
  return JSON.parse(
    JSON.stringify(landingPageModuleFieldCatalogRegistry[1]),
  ) as LandingPageModuleFieldCatalogEntry;
}

function assertVariantCatalogMutationInvalid(
  mutate: (catalog: LandingPageModuleVariantCatalogEntry) => void,
) {
  const catalog = cloneVariantCatalog();
  mutate(catalog);
  assert.equal(
    landingPageModuleVariantCatalogEntrySchema.safeParse(catalog).success,
    false,
  );
}

function cloneVariantCatalog(): LandingPageModuleVariantCatalogEntry {
  return JSON.parse(
    JSON.stringify(landingPageModuleVariantCatalogRegistry[1]),
  ) as LandingPageModuleVariantCatalogEntry;
}

function mutableVariants(
  catalog: LandingPageModuleVariantCatalogEntry,
  moduleKey: LandingPageModuleDefinition["moduleKey"],
): Record<string, Record<string, unknown>> {
  return catalog.modules[moduleKey].variants as unknown as Record<
    string,
    Record<string, unknown>
  >;
}

function mutableVariant(
  catalog: LandingPageModuleVariantCatalogEntry,
  moduleKey: LandingPageModuleDefinition["moduleKey"],
  variantKey: string,
): Record<string, unknown> {
  const variant = mutableVariants(catalog, moduleKey)[variantKey];
  assert.notEqual(variant, undefined);
  return variant;
}

function mutableVariantCapabilities(
  catalog: LandingPageModuleVariantCatalogEntry,
  moduleKey: LandingPageModuleDefinition["moduleKey"],
  variantKey: string,
): string[] {
  return mutableVariant(catalog, moduleKey, variantKey)
    .capabilities as string[];
}

function mutableVariantFields(
  catalog: LandingPageModuleVariantCatalogEntry,
  moduleKey: LandingPageModuleDefinition["moduleKey"],
  variantKey: string,
): Record<string, Record<string, unknown>> {
  return mutableVariant(catalog, moduleKey, variantKey).fields as Record<
    string,
    Record<string, unknown>
  >;
}

function mutableFields(
  catalog: LandingPageModuleFieldCatalogEntry,
  moduleKey: LandingPageModuleDefinition["moduleKey"],
): Record<string, Record<string, unknown>> {
  return catalog.modules[moduleKey].fields as unknown as Record<
    string,
    Record<string, unknown>
  >;
}

function mutableField(
  catalog: LandingPageModuleFieldCatalogEntry,
  moduleKey: LandingPageModuleDefinition["moduleKey"],
  path: string,
): Record<string, unknown> {
  const field = mutableFields(catalog, moduleKey)[path];
  assert.notEqual(field, undefined);
  return field;
}

function trustBarPayload(itemCount: number) {
  return {
    items: Array.from({ length: itemCount }, (_, index) => ({
      text: `Trust signal ${index + 1}`,
    })),
  };
}

function imagePayload(mode: "informative" | "decorative", altText: string) {
  return {
    assetRef: "assets/hero-primary",
    mode,
    altText,
    visibility: "all_viewports",
  };
}

function heroPayloadWithTitle(title: string) {
  return {
    ...(validPayloads.hero as Record<string, unknown>),
    title,
  };
}

function resolveApprovedRootParameters() {
  const result = resolveLandingPageRootParameters({
    rootVersion: landingPageModuleCatalogRegistry[1].compatibleRootVersions[0],
  });
  assert.equal(result.ok, true);
  if (!result.ok) assert.fail("approved root parameters must resolve");
  return result.value;
}

const validPayloads: Readonly<Record<
  LandingPageModuleDefinition["moduleKey"],
  unknown
>> = {
  hero: {
    eyebrow: "Novidade",
    title: "Uma proposta principal",
    subtitle: "Contexto suficiente para orientar a decisao.",
    primaryCta: { label: "Comecar" },
    proofShort: "Evidencia disponivel",
    media: imagePayload("informative", "Visao geral da proposta"),
  },
  trust_bar: trustBarPayload(2),
  problem_solution: {
    title: "Do problema a solucao",
    items: [
      { problem: "Problema um", solution: "Solucao um" },
      { problem: "Problema dois", solution: "Solucao dois" },
    ],
  },
  offer: {
    title: "O que esta incluido",
    items: [{ itemTitle: "Entrega", description: "Descricao da entrega" }],
  },
  process: {
    title: "Como funciona",
    steps: [
      { stepTitle: "Primeiro passo", stepBody: "Descricao do primeiro passo" },
      { stepTitle: "Segundo passo", stepBody: "Descricao do segundo passo" },
    ],
  },
  technical_assurance: {
    title: "Garantias tecnicas",
    items: [
      {
        assuranceTitle: "Criterio verificavel",
        assuranceBody: "Descricao suportada do criterio",
      },
    ],
  },
  social_proof: {
    title: "Resultados",
    items: [
      {
        quote: "Resultado comprovado",
        attribution: "Cliente verificado",
        evidenceRef: {
          referenceKind: "operational_evidence",
          evidenceRef: "evidence/customer-1",
        },
      },
    ],
  },
  faq: {
    title: "Perguntas frequentes",
    items: [
      { question: "Pergunta um?", answer: "Resposta um." },
      { question: "Pergunta dois?", answer: "Resposta dois." },
    ],
  },
  final_cta: {
    title: "Proximo passo",
    body: "Encerramento coerente com a proposta.",
    primaryCta: { label: "Comecar" },
  },
};

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
    rootDelta: {},
  };
}

type MutableModule = {
  -readonly [Key in keyof LandingPageModuleDefinition]: LandingPageModuleDefinition[Key];
};

for (const validationCase of cases) {
  validationCase.run();
  console.log(`ok - ${validationCase.name}`);
}
