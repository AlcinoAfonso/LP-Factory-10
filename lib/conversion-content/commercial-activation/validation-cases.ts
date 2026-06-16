import assert from "node:assert/strict";

import {
  commercialActivationFixtureComposition,
  commercialActivationFixtureContent,
} from "./fixture";
import { resolveCommercialActivationHierarchicalBundle } from "./hierarchical-resolve";
import { resolveCommercialActivationRenderModel } from "./resolve";
import type { CommercialActivationContentV1 } from "./schemas";
import type {
  CommercialActivationBundle,
  CommercialActivationBundleResult,
  CommercialActivationContentTaxon,
  ContentComposition,
} from "../contracts";

type Case = {
  name: string;
  run: () => void | Promise<void>;
};

const requiredHeroId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1";
const optionalDifferentialsId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa5";
const optionalFaqId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa7";

const cases: Case[] = [
  {
    name: "valid content resolves all fixture sections",
    run: () => {
      const result = resolveCommercialActivationRenderModel({
        composition: clone(commercialActivationFixtureComposition),
        contentJson: clone(commercialActivationFixtureContent),
      });

      assert.equal(result.status, "ready");
      assert.equal(result.model.sections.length, 8);
    },
  },
  {
    name: "duplicate composition item id invalidates artifact",
    run: () => {
      const content = clone(commercialActivationFixtureContent);
      content.sections[1].composition_item_id = requiredHeroId;

      const result = resolveCommercialActivationRenderModel({
        composition: clone(commercialActivationFixtureComposition),
        contentJson: content,
      });

      assert.deepEqual(result, {
        status: "invalid",
        reason: "composition_item_duplicate",
      });
    },
  },
  {
    name: "unknown composition item id invalidates artifact",
    run: () => {
      const content = clone(commercialActivationFixtureContent);
      content.sections[0].composition_item_id =
        "99999999-9999-4999-8999-999999999999";

      const result = resolveCommercialActivationRenderModel({
        composition: clone(commercialActivationFixtureComposition),
        contentJson: content,
      });

      assert.deepEqual(result, {
        status: "invalid",
        reason: "composition_item_unknown",
      });
    },
  },
  {
    name: "module and variant mismatch invalidates artifact",
    run: () => {
      const composition = clone(commercialActivationFixtureComposition);
      composition.items[0].module.key = "services";

      const result = resolveCommercialActivationRenderModel({
        composition,
        contentJson: clone(commercialActivationFixtureContent),
      });

      assert.deepEqual(result, {
        status: "invalid",
        reason: "section_registry_invalid",
      });
    },
  },
  {
    name: "missing required section invalidates artifact",
    run: () => {
      const content = withoutSection(requiredHeroId);

      const result = resolveCommercialActivationRenderModel({
        composition: clone(commercialActivationFixtureComposition),
        contentJson: content,
      });

      assert.deepEqual(result, {
        status: "invalid",
        reason: "composition_item_missing",
      });
    },
  },
  {
    name: "invalid required section invalidates artifact",
    run: () => {
      const content = clone(commercialActivationFixtureContent);
      const hero = content.sections.find(
        (section) => section.composition_item_id === requiredHeroId,
      );
      assert.ok(hero);
      hero.content = { title: "Missing required hero fields" };

      const result = resolveCommercialActivationRenderModel({
        composition: clone(commercialActivationFixtureComposition),
        contentJson: content,
      });

      assert.deepEqual(result, {
        status: "invalid",
        reason: "section_content_invalid",
      });
    },
  },
  {
    name: "missing optional section is omitted",
    run: () => {
      const content = withoutSection(optionalFaqId);

      const result = resolveCommercialActivationRenderModel({
        composition: clone(commercialActivationFixtureComposition),
        contentJson: content,
      });

      assert.equal(result.status, "ready");
      assert.equal(
        result.model.sections.some(
          (section) => section.compositionItemId === optionalFaqId,
        ),
        false,
      );
    },
  },
  {
    name: "invalid optional section is omitted with safe log",
    run: () => {
      const content = clone(commercialActivationFixtureContent);
      const optional = content.sections.find(
        (section) => section.composition_item_id === optionalDifferentialsId,
      );
      assert.ok(optional);
      optional.content = { title: "Missing cards" };

      const warnings: Array<Record<string, unknown>> = [];
      const result = resolveCommercialActivationRenderModel({
        composition: clone(commercialActivationFixtureComposition),
        contentJson: content,
        logSafeWarning: (_message, details) => warnings.push(details),
      });

      assert.equal(result.status, "ready");
      assert.equal(
        result.model.sections.some(
          (section) => section.compositionItemId === optionalDifferentialsId,
        ),
        false,
      );
      assert.deepEqual(warnings, [
        {
          compositionItemId: optionalDifferentialsId,
          variantKey: "differentials.cards",
        },
      ]);
    },
  },
  {
    name: "unknown root field fails strict schema",
    run: () => {
      const content = {
        ...clone(commercialActivationFixtureContent),
        unexpected: true,
      };

      const result = resolveCommercialActivationRenderModel({
        composition: clone(commercialActivationFixtureComposition),
        contentJson: content,
      });

      assert.deepEqual(result, {
        status: "invalid",
        reason: "content_schema_invalid",
      });
    },
  },
  {
    name: "invalid URL fails section schema",
    run: () => {
      const content = clone(commercialActivationFixtureContent);
      const hero = content.sections.find(
        (section) => section.composition_item_id === requiredHeroId,
      );
      assert.ok(hero);
      hero.content = {
        ...hero.content,
        primary_cta: { label: "Broken", href: "https://" },
      };

      const result = resolveCommercialActivationRenderModel({
        composition: clone(commercialActivationFixtureComposition),
        contentJson: content,
      });

      assert.deepEqual(result, {
        status: "invalid",
        reason: "section_content_invalid",
      });
    },
  },
  {
    name: "hierarchical resolver selects exact ready bundle",
    run: async () => {
      const result = await runHierarchicalCase({
        originalTaxonId: taxonIds.original,
        readyTaxonId: taxonIds.original,
      });

      assert.equal(result.status, "ready");
      assert.equal(result.original_taxon_id, taxonIds.original);
      assert.equal(result.resolved_content_taxon_id, taxonIds.original);
      assert.equal(result.bundle?.composition.taxonId, taxonIds.original);
      assert.equal(result.bundle?.artifact.taxonId, taxonIds.original);
    },
  },
  {
    name: "hierarchical resolver falls back to parent ready bundle",
    run: async () => {
      const result = await runHierarchicalCase({
        originalTaxonId: taxonIds.original,
        readyTaxonId: taxonIds.parent,
      });

      assert.equal(result.status, "ready");
      assert.equal(result.original_taxon_id, taxonIds.original);
      assert.equal(result.resolved_content_taxon_id, taxonIds.parent);
      assert.equal(result.bundle?.composition.taxonId, taxonIds.parent);
      assert.equal(result.bundle?.artifact.taxonId, taxonIds.parent);
    },
  },
  {
    name: "hierarchical resolver falls back to ancestor ready bundle",
    run: async () => {
      const result = await runHierarchicalCase({
        originalTaxonId: taxonIds.original,
        readyTaxonId: taxonIds.ancestor,
      });

      assert.equal(result.status, "ready");
      assert.equal(result.original_taxon_id, taxonIds.original);
      assert.equal(result.resolved_content_taxon_id, taxonIds.ancestor);
      assert.equal(result.bundle?.composition.taxonId, taxonIds.ancestor);
      assert.equal(result.bundle?.artifact.taxonId, taxonIds.ancestor);
    },
  },
  {
    name: "hierarchical resolver skips inactive parent and selects active ancestor",
    run: async () => {
      const inactiveParentTaxons = new Map<string, CommercialActivationContentTaxon>([
        [
          taxonIds.original,
          { id: taxonIds.original, parentId: taxonIds.parent, isActive: true },
        ],
        [
          taxonIds.parent,
          { id: taxonIds.parent, parentId: taxonIds.ancestor, isActive: false },
        ],
        [
          taxonIds.ancestor,
          { id: taxonIds.ancestor, parentId: null, isActive: true },
        ],
      ]);
      const queriedBundleTaxonIds: string[] = [];

      const result = await resolveCommercialActivationHierarchicalBundle({
        taxonId: taxonIds.original,
        readTaxon: async (taxonId) => inactiveParentTaxons.get(taxonId) ?? null,
        readBundle: async ({ taxonId }): Promise<CommercialActivationBundleResult> => {
          queriedBundleTaxonIds.push(taxonId);
          return taxonId === taxonIds.ancestor
            ? { status: "ready", bundle: makeBundle(taxonId) }
            : { status: "composition_not_found" };
        },
      });

      assert.equal(result.status, "ready");
      assert.equal(result.original_taxon_id, taxonIds.original);
      assert.equal(result.resolved_content_taxon_id, taxonIds.ancestor);
      assert.equal(result.bundle?.composition.taxonId, taxonIds.ancestor);
      assert.equal(result.bundle?.artifact.taxonId, taxonIds.ancestor);
      assert.deepEqual(queriedBundleTaxonIds, [
        taxonIds.original,
        taxonIds.ancestor,
      ]);
    },
  },
  {
    name: "hierarchical resolver returns safe fallback when no bundle is ready",
    run: async () => {
      const result = await runHierarchicalCase({
        originalTaxonId: taxonIds.original,
        readyTaxonId: null,
      });

      assert.deepEqual(result, {
        status: "fallback_no_ready_bundle",
        original_taxon_id: taxonIds.original,
        resolved_content_taxon_id: null,
        bundle: null,
      });
    },
  },
  {
    name: "hierarchical resolver returns safe fallback on read error",
    run: async () => {
      const result = await resolveCommercialActivationHierarchicalBundle({
        taxonId: taxonIds.original,
        readTaxon: async (taxonId) => taxonHierarchy.get(taxonId) ?? null,
        readBundle: async () => {
          throw new Error("synthetic read failure");
        },
      });

      assert.deepEqual(result, {
        status: "fallback_read_failed",
        original_taxon_id: taxonIds.original,
        resolved_content_taxon_id: null,
        bundle: null,
      });
    },
  },
  {
    name: "hierarchical resolver returns safe fallback on taxon cycle",
    run: async () => {
      const cyclicTaxons = new Map<string, CommercialActivationContentTaxon>([
        [
          taxonIds.original,
          { id: taxonIds.original, parentId: taxonIds.parent, isActive: true },
        ],
        [
          taxonIds.parent,
          { id: taxonIds.parent, parentId: taxonIds.original, isActive: true },
        ],
      ]);

      const result = await resolveCommercialActivationHierarchicalBundle({
        taxonId: taxonIds.original,
        readTaxon: async (taxonId) => cyclicTaxons.get(taxonId) ?? null,
        readBundle: async () => ({ status: "composition_not_found" }),
      });

      assert.deepEqual(result, {
        status: "fallback_cycle_detected",
        original_taxon_id: taxonIds.original,
        resolved_content_taxon_id: null,
        bundle: null,
      });
    },
  },
];

void main();

async function main() {
  for (const validationCase of cases) {
    await validationCase.run();
    console.log(`ok - ${validationCase.name}`);
  }
}

function withoutSection(compositionItemId: string): CommercialActivationContentV1 {
  const content = clone(commercialActivationFixtureContent);
  content.sections = content.sections.filter(
    (section) => section.composition_item_id !== compositionItemId,
  );
  return content;
}

function clone<T>(value: T): T {
  return globalThis.structuredClone(value);
}

const taxonIds = {
  original: "33333333-3333-4333-8333-333333333333",
  parent: "44444444-4444-4444-8444-444444444444",
  ancestor: "55555555-5555-4555-8555-555555555555",
} as const;

const taxonHierarchy = new Map<string, CommercialActivationContentTaxon>([
  [
    taxonIds.original,
    { id: taxonIds.original, parentId: taxonIds.parent, isActive: true },
  ],
  [
    taxonIds.parent,
    { id: taxonIds.parent, parentId: taxonIds.ancestor, isActive: true },
  ],
  [
    taxonIds.ancestor,
    { id: taxonIds.ancestor, parentId: null, isActive: true },
  ],
]);

async function runHierarchicalCase(input: {
  originalTaxonId: string;
  readyTaxonId: string | null;
}) {
  return resolveCommercialActivationHierarchicalBundle({
    taxonId: input.originalTaxonId,
    readTaxon: async (taxonId) => taxonHierarchy.get(taxonId) ?? null,
    readBundle: async ({ taxonId }): Promise<CommercialActivationBundleResult> =>
      taxonId === input.readyTaxonId
        ? { status: "ready", bundle: makeBundle(taxonId) }
        : { status: "composition_not_found" },
  });
}

function makeBundle(taxonId: string): CommercialActivationBundle {
  const composition = clone(commercialActivationFixtureComposition);
  composition.taxonId = taxonId;

  return {
    composition,
    artifact: {
      id: "66666666-6666-4666-8666-666666666666",
      templateId: composition.template.id,
      compositionId: composition.id,
      taxonId,
      audienceScope: "business_buyer",
      templateVersion: composition.template.version,
      compositionVersion: composition.version,
      researchVersion: 1,
      artifactVersion: 1,
      content: clone(commercialActivationFixtureContent) as unknown as Record<
        string,
        unknown
      >,
      provenance: {},
      researchSources: [],
      publishedAt: "2026-06-16T12:00:00.000Z",
    },
  };
}
