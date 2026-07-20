import assert from "node:assert/strict";

import {
  landingPageModuleKeys,
  type LandingPageModuleCatalogEntry,
  type LandingPageModuleDefinition,
  type LandingPageModuleFieldCatalogEntry,
} from "./contracts";
import { validateLandingPageModuleFieldPayload } from "./payload-validator";
import {
  landingPageModuleCatalogRegistry,
  landingPageModuleFieldCatalogRegistry,
} from "./registry";
import {
  landingPageModuleCatalogEntrySchema,
  landingPageModuleFieldCatalogEntrySchema,
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
    name: "catalog and nested structural definitions are deeply immutable",
    run: () => {
      const catalog = landingPageModuleCatalogRegistry[1];
      const fieldCatalog = landingPageModuleFieldCatalogRegistry[1];

      assert.equal(Object.isFrozen(landingPageModuleCatalogRegistry), true);
      assert.equal(Object.isFrozen(catalog), true);
      assert.equal(Object.isFrozen(catalog.modules.hero), true);
      assert.equal(Object.isFrozen(catalog.modules.hero.boundaries), true);
      assert.equal(Object.isFrozen(landingPageModuleFieldCatalogRegistry), true);
      assert.equal(Object.isFrozen(fieldCatalog.modules.hero.fields), true);
      assert.equal(
        Object.isFrozen(fieldCatalog.modules.hero.fields.title.cardinality),
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
  };
}

type MutableModule = {
  -readonly [Key in keyof LandingPageModuleDefinition]: LandingPageModuleDefinition[Key];
};

for (const validationCase of cases) {
  validationCase.run();
  console.log(`ok - ${validationCase.name}`);
}
