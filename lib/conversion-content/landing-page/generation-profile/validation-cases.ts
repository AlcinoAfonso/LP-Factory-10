import assert from "node:assert/strict";

import {
  loadLandingPageGenerationProfileSourceFromClient,
  resolveLandingPageGenerationProfileForTaxonFromClient,
  type LandingPageGenerationProfileReadClient,
} from "../../adapters/landingPageGenerationProfileAdapterCore";
import { normalizeLandingPageGenerationProfileItemRow } from "../../adapters/landingPageGenerationProfileRowNormalization";
import {
  landingPageGenerationProfileSchema,
  landingPageGenerationProfileSourceSchema,
  landingPageGenerationProfileTaxonChainSchema,
} from "./schema";
import { resolveLandingPageGenerationProfile } from "./resolver";

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

const cases: readonly Readonly<{
  name: string;
  run: () => void | Promise<void>;
}>[] = [
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

      const row = {
        id: validProfile.items[0].id,
        profile_id: validProfile.id,
        module_key: validProfile.items[0].moduleKey,
        module_version: validProfile.items[0].moduleVersion,
        variant_key: validProfile.items[0].variantKey,
        variant_version: validProfile.items[0].variantVersion,
        priority: validProfile.items[0].priority,
        recommended_order: validProfile.items[0].recommendedOrder,
        item_guidance: validProfile.items[0].itemGuidance,
      };
      assert.notEqual(normalizeLandingPageGenerationProfileItemRow(row), null);
      assert.equal(normalizeLandingPageGenerationProfileItemRow({ ...row, variant_key: null }), null);
      assert.equal(normalizeLandingPageGenerationProfileItemRow({ ...row, variant_version: null }), null);
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
  {
    name: "resolver returns own profile with immutable recommendations in ascending order",
    run: () => {
      const result = resolveLandingPageGenerationProfile({
        taxonChain: {
          servedTaxonId: NICHE_ID,
          nodes: validChain.nodes.slice(1),
        },
        profiles: [
          {
            ...validProfile,
            items: [
              validProfile.items[0],
              {
                ...validProfile.items[0],
                id: "30000000-0000-4000-8000-000000000002",
                moduleKey: "faq",
                variantKey: "faq.accordion",
                recommendedOrder: 5,
              },
            ],
          },
        ],
      });

      assert.equal(result.ok, true);
      if (result.ok && result.value.kind === "resolved") {
        assert.equal(result.value.relation, "own");
        assert.equal(result.value.servedTaxonId, NICHE_ID);
        assert.equal(result.value.ownerTaxonId, NICHE_ID);
        assert.deepEqual(
          result.value.recommendations.map((item) => item.recommendedOrder),
          [5, 10],
        );
        assert.equal(Object.isFrozen(result.value), true);
        assert.equal(Object.isFrozen(result.value.recommendations), true);
      } else {
        assert.fail("expected resolved own profile");
      }
    },
  },
  {
    name: "resolver inherits the nearest active niche or segment profile",
    run: () => {
      const fromNiche = resolveLandingPageGenerationProfile({
        taxonChain: validChain,
        profiles: [validProfile],
      });
      assert.equal(fromNiche.ok, true);
      if (fromNiche.ok && fromNiche.value.kind === "resolved") {
        assert.equal(fromNiche.value.relation, "inherited");
        assert.equal(fromNiche.value.ownerTaxonId, NICHE_ID);
      } else {
        assert.fail("expected inherited niche profile");
      }

      const fromSegment = resolveLandingPageGenerationProfile({
        taxonChain: validChain,
        profiles: [{ ...validProfile, ownerTaxonId: SEGMENT_ID }],
      });
      assert.equal(fromSegment.ok, true);
      if (fromSegment.ok && fromSegment.value.kind === "resolved") {
        assert.equal(fromSegment.value.relation, "inherited");
        assert.equal(fromSegment.value.ownerTaxonId, SEGMENT_ID);
      } else {
        assert.fail("expected inherited segment profile");
      }
    },
  },
  {
    name: "resolver distinguishes legitimate absence from invalid chain and profile",
    run: () => {
      const absent = resolveLandingPageGenerationProfile({
        taxonChain: validChain,
        profiles: [{ ...validProfile, status: "draft" }],
      });
      assert.deepEqual(absent, {
        ok: true,
        value: { kind: "absent", servedTaxonId: ULTRA_ID },
      });

      const invalidChain = resolveLandingPageGenerationProfile({
        taxonChain: { ...validChain, servedTaxonId: NICHE_ID },
        profiles: [],
      });
      assert.equal(invalidChain.ok, false);
      if (!invalidChain.ok) assert.equal(invalidChain.error.code, "INVALID_TAXON_CHAIN");

      const invalidProfile = resolveLandingPageGenerationProfile({
        taxonChain: validChain,
        profiles: [{ ...validProfile, status: "published" }],
      });
      assert.equal(invalidProfile.ok, false);
      if (!invalidProfile.ok) assert.equal(invalidProfile.error.code, "INVALID_PROFILE");
    },
  },
  {
    name: "invalid nearest active profile blocks fallback to a farther ancestor",
    run: () => {
      const result = resolveLandingPageGenerationProfile({
        taxonChain: validChain,
        profiles: [
          {
            ...validProfile,
            items: [{ ...validProfile.items[0], moduleVersion: 2 }],
          },
          {
            ...validProfile,
            id: "20000000-0000-4000-8000-000000000002",
            ownerTaxonId: SEGMENT_ID,
          },
        ],
      });

      assert.equal(result.ok, false);
      if (!result.ok) assert.equal(result.error.code, "INVALID_PROFILE");
    },
  },
  {
    name: "adapter boundary preserves READ_FAILED instead of returning profile absence",
    run: async () => {
      const readFailureClient = {
        from: () => ({
          select: () => ({
            eq: () => ({
              limit: () => ({
                maybeSingle: async () => ({
                  data: null,
                  error: { message: "forced read failure" },
                }),
              }),
            }),
          }),
        }),
      } as unknown as LandingPageGenerationProfileReadClient;

      const source = await loadLandingPageGenerationProfileSourceFromClient(
        { taxonId: SEGMENT_ID },
        readFailureClient,
      );
      assert.equal(source.ok, false);
      if (!source.ok) assert.equal(source.error.code, "READ_FAILED");

      const resolved = await resolveLandingPageGenerationProfileForTaxonFromClient(
        { taxonId: SEGMENT_ID },
        readFailureClient,
      );
      const resolutionKind = resolved.ok ? resolved.value.kind : "error";
      assert.equal(resolved.ok, false);
      if (!resolved.ok) assert.equal(resolved.error.code, "READ_FAILED");
      assert.equal(resolutionKind, "error");
    },
  },
];

async function runValidationCases() {
  for (const validationCase of cases) {
    await validationCase.run();
    console.log(`ok - ${validationCase.name}`);
  }
}

runValidationCases().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
