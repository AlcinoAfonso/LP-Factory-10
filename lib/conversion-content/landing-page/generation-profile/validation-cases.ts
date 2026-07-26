import assert from "node:assert/strict";

import {
  landingPageGenerationProfileSchema,
  landingPageGenerationProfileSourceSchema,
  landingPageGenerationProfileTaxonChainSchema,
} from "./schema";

const SEGMENT_ID = "10000000-0000-4000-8000-000000000001";
const NICHE_ID = "10000000-0000-4000-8000-000000000002";
const ULTRA_ID = "10000000-0000-4000-8000-000000000003";

const validProfile = {
  id: "20000000-0000-4000-8000-000000000001",
  ownerTaxonId: NICHE_ID,
  version: 1,
  status: "active",
  generationGuidance: "Priorize clareza e progressão narrativa.",
  items: [
    {
      id: "30000000-0000-4000-8000-000000000001",
      moduleKey: "hero",
      moduleVersion: 1,
      variantKey: "hero.form",
      variantVersion: 1,
      priority: "P1",
      recommendedOrder: 10,
      itemGuidance: "Abra com proposta específica.",
    },
  ],
} as const;

const validChain = {
  servedTaxonId: ULTRA_ID,
  nodes: [
    { taxonId: ULTRA_ID, level: "ultra_niche", parentId: NICHE_ID, status: "active" },
    { taxonId: NICHE_ID, level: "niche", parentId: SEGMENT_ID, status: "active" },
    { taxonId: SEGMENT_ID, level: "segment", parentId: null, status: "active" },
  ],
} as const;

const cases: readonly Readonly<{ name: string; run: () => void }>[] = [
  {
    name: "valid profile keeps profile and items in one aggregate",
    run: () => assert.equal(landingPageGenerationProfileSchema.safeParse(validProfile).success, true),
  },
  {
    name: "draft and archived states are valid but item lifecycle is rejected",
    run: () => {
      for (const status of ["draft", "archived"]) {
        assert.equal(landingPageGenerationProfileSchema.safeParse({ ...validProfile, status }).success, true);
      }
      assert.equal(landingPageGenerationProfileSchema.safeParse({
        ...validProfile,
        items: [{ ...validProfile.items[0], status: "active" }],
      }).success, false);
    },
  },
  {
    name: "invalid version state guidance priority order and item guidance fail closed",
    run: () => {
      for (const candidate of [
        { ...validProfile, version: 0 },
        { ...validProfile, status: "published" },
        { ...validProfile, generationGuidance: " " },
        { ...validProfile, items: [{ ...validProfile.items[0], priority: "P4" }] },
        { ...validProfile, items: [{ ...validProfile.items[0], recommendedOrder: 0 }] },
        { ...validProfile, items: [{ ...validProfile.items[0], itemGuidance: " " }] },
      ]) {
        assert.equal(landingPageGenerationProfileSchema.safeParse(candidate).success, false);
      }
    },
  },
  {
    name: "variant identity is optional only as a complete pair",
    run: () => {
      assert.equal(landingPageGenerationProfileSchema.safeParse({
        ...validProfile,
        items: [{ ...validProfile.items[0], variantKey: undefined, variantVersion: undefined }],
      }).success, true);
      assert.equal(landingPageGenerationProfileSchema.safeParse({
        ...validProfile,
        items: [{ ...validProfile.items[0], variantVersion: undefined }],
      }).success, false);
    },
  },
  {
    name: "duplicate module order and obligation fail closed",
    run: () => {
      const second = { ...validProfile.items[0], id: "30000000-0000-4000-8000-000000000002" };
      assert.equal(landingPageGenerationProfileSchema.safeParse({ ...validProfile, items: [validProfile.items[0], second] }).success, false);
      assert.equal(landingPageGenerationProfileSchema.safeParse({ ...validProfile, items: [validProfile.items[0], { ...second, moduleKey: "faq" }] }).success, false);
      assert.equal(landingPageGenerationProfileSchema.safeParse({ ...validProfile, items: [{ ...validProfile.items[0], required: true }] }).success, false);
    },
  },
  {
    name: "segment niche and ultra-niche chains terminate at an active segment",
    run: () => {
      assert.equal(landingPageGenerationProfileTaxonChainSchema.safeParse(validChain).success, true);
      assert.equal(landingPageGenerationProfileTaxonChainSchema.safeParse({ servedTaxonId: NICHE_ID, nodes: validChain.nodes.slice(1) }).success, true);
      assert.equal(landingPageGenerationProfileTaxonChainSchema.safeParse({ servedTaxonId: SEGMENT_ID, nodes: validChain.nodes.slice(2) }).success, true);
    },
  },
  {
    name: "inactive missing-parent wrong-level duplicate and cyclic chains fail closed",
    run: () => {
      for (const nodes of [
        [{ ...validChain.nodes[0], status: "inactive" }, ...validChain.nodes.slice(1)],
        [{ ...validChain.nodes[0], parentId: null }, ...validChain.nodes.slice(1)],
        [{ ...validChain.nodes[0], level: "niche" }, ...validChain.nodes.slice(1)],
        [validChain.nodes[0], { ...validChain.nodes[1], taxonId: ULTRA_ID }, validChain.nodes[2]],
        [validChain.nodes[0], { ...validChain.nodes[1], parentId: ULTRA_ID }, validChain.nodes[2]],
      ]) {
        assert.equal(landingPageGenerationProfileTaxonChainSchema.safeParse({ servedTaxonId: ULTRA_ID, nodes }).success, false);
      }
    },
  },
  {
    name: "source rejects profiles outside the chain and duplicate active owners",
    run: () => {
      assert.equal(landingPageGenerationProfileSourceSchema.safeParse({ taxonChain: validChain, profiles: [validProfile] }).success, true);
      assert.equal(landingPageGenerationProfileSourceSchema.safeParse({ taxonChain: validChain, profiles: [{ ...validProfile, ownerTaxonId: "40000000-0000-4000-8000-000000000001" }] }).success, false);
      assert.equal(landingPageGenerationProfileSourceSchema.safeParse({ taxonChain: validChain, profiles: [validProfile, { ...validProfile, id: "20000000-0000-4000-8000-000000000002", version: 2 }] }).success, false);
    },
  },
];

for (const validationCase of cases) {
  validationCase.run();
  console.log(`ok - ${validationCase.name}`);
}
