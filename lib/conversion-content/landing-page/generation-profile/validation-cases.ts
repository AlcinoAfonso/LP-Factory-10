import assert from "node:assert/strict";

import {
  loadLandingPageGenerationProfileSourceFromClient,
  resolveLandingPageGenerationProfileForTaxonFromClient,
  type LandingPageGenerationProfileReadClient,
} from "../../adapters/landingPageGenerationProfileAdapterCore";
import { normalizeLandingPageGenerationProfileItemRow } from "../../adapters/landingPageGenerationProfileRowNormalization";
import {
  fingerprintGenerationProfileProposal,
  validateGenerationProfileDraft,
} from "./index";
import {
  landingPageGenerationProfileSchema,
  landingPageGenerationProfileSourceSchema,
  landingPageGenerationProfileTaxonChainSchema,
} from "./schema";
import {
  buildGenerationProfileResponsesRequest,
  estimateGenerationProfileCostUsd,
  GENERATION_PROFILE_APPROVED_MODEL,
  isGenerationProfileAssistanceConfigured,
  mapProviderFailureToProposalError,
  mapResearchErrorToProposalError,
  validateGenerationProfileProviderPayload,
} from "./proposal";
import { listLandingPageModuleIdentities } from "../module-catalog";
import {
  applyGenerationProfileProposalToEditor,
  hasGenerationProfileEditorContent,
} from "./editor-assistance";
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
  {
    name: "admin draft validation accepts only eligible identities and optimistic snapshots",
    run: () => {
      const input = {
        ownerTaxonId: NICHE_ID,
        generationGuidance: validProfile.generationGuidance,
        recommendations: validProfile.items.map(({ id: _id, ...item }) => item),
        origin: "manual",
      } as const;
      assert.equal(validateGenerationProfileDraft(input).ok, true);
      assert.equal(validateGenerationProfileDraft({ ...input, recommendations: [{ ...input.recommendations[0], moduleKey: "invented" }] }).ok, false);
      assert.equal(validateGenerationProfileDraft({ ...input, profileId: validProfile.id }).ok, false);
      assert.equal(validateGenerationProfileDraft({ ...input, expectedUpdatedAt: "2026-07-28T12:00:00Z" }).ok, false);
      const unavailableCorrelation = validateGenerationProfileDraft({
        ...input,
        origin: "ai",
        requestId: "invalid-request-id",
        proposalFingerprint: "invalid-fingerprint",
      });
      assert.equal(unavailableCorrelation.ok, true);
      if (unavailableCorrelation.ok) {
        assert.equal(unavailableCorrelation.value.origin, "ai");
        assert.equal(unavailableCorrelation.value.requestId, undefined);
        assert.equal(unavailableCorrelation.value.proposalFingerprint, undefined);
      }
      const nonTextCorrelation = validateGenerationProfileDraft({
        ...input,
        origin: "ai",
        requestId: null,
        proposalFingerprint: { unexpected: true },
      });
      assert.equal(nonTextCorrelation.ok, true);
    },
  },
  {
    name: "proposal schema rejects invented identities duplicate order and extra properties",
    run: () => {
      const payload = {
        generation_guidance: "Oriente a progressao narrativa.",
        recommendations: [{
          module_key: "hero",
          module_version: 1,
          variant_key: "hero.form",
          variant_version: 1,
          priority: "P1",
          recommended_order: 10,
          item_guidance: null,
        }],
      };
      assert.equal(validateGenerationProfileProviderPayload(payload).ok, true);
      assert.equal(validateGenerationProfileProviderPayload({ ...payload, extra: true }).ok, false);
      assert.equal(validateGenerationProfileProviderPayload({ ...payload, recommendations: [{ ...payload.recommendations[0], module_key: "invented" }] }).ok, false);
      assert.equal(validateGenerationProfileProviderPayload({ ...payload, recommendations: [payload.recommendations[0], { ...payload.recommendations[0], module_key: "faq" }] }).ok, false);
      assert.equal(validateGenerationProfileProviderPayload({ ...payload, recommendations: [{ ...payload.recommendations[0], variant_key: null }] }).ok, false);
      assert.equal(validateGenerationProfileProviderPayload({ ...payload, recommendations: [{ ...payload.recommendations[0], variant_version: null }] }).ok, false);
    },
  },
  {
    name: "proposal fingerprint is deterministic and detects human adjustment",
    run: () => {
      const proposal = {
        generationGuidance: validProfile.generationGuidance,
        recommendations: validProfile.items.map(({ id: _id, ...item }) => item),
      };
      const fingerprint = fingerprintGenerationProfileProposal(proposal);
      assert.match(fingerprint, /^[a-f0-9]{64}$/);
      assert.equal(fingerprintGenerationProfileProposal(proposal), fingerprint);
      assert.notEqual(fingerprintGenerationProfileProposal({ ...proposal, generationGuidance: "Ajustada" }), fingerprint);
    },
  },
  {
    name: "Responses API request is strict stateless tool-free and bounded",
    run: () => {
      const request = buildGenerationProfileResponsesRequest({
        model: GENERATION_PROFILE_APPROVED_MODEL,
        taxonId: NICHE_ID,
        research: {
          servedTaxonId: NICHE_ID,
          endCustomer: { audienceScope: "end_customer", sourceTaxonId: NICHE_ID, sourceRelation: "own", version: 1, researches: [] },
          businessBuyer: { audienceScope: "business_buyer", sourceTaxonId: NICHE_ID, sourceRelation: "own", version: 1, researches: [] },
          versions: { endCustomer: 1, businessBuyer: 1 },
        },
        moduleIdentities: listLandingPageModuleIdentities(),
        previousActiveProfile: null,
        currentEditor: null,
      });
      assert.equal(request.ok, true);
      assert.equal(request.body.store, false);
      assert.equal(request.body.max_output_tokens, 2000);
      assert.equal(Object.hasOwn(request.body, "tools"), false);
      assert.equal(request.body.text.format.strict, true);
      assert.equal(request.body.text.format.schema.additionalProperties, false);
      assert.equal(Object.hasOwn(request.body, "previous_response_id"), false);
      const oversized = buildGenerationProfileResponsesRequest({
        model: GENERATION_PROFILE_APPROVED_MODEL,
        taxonId: NICHE_ID,
        research: {
          servedTaxonId: NICHE_ID,
          endCustomer: { audienceScope: "end_customer", sourceTaxonId: NICHE_ID, sourceRelation: "own", version: 1, researches: [] },
          businessBuyer: { audienceScope: "business_buyer", sourceTaxonId: NICHE_ID, sourceRelation: "own", version: 1, researches: [] },
          versions: { endCustomer: 1, businessBuyer: 1 },
        },
        moduleIdentities: listLandingPageModuleIdentities(),
        previousActiveProfile: null,
        currentEditor: null,
        humanFeedback: "x".repeat(100_000),
      });
      assert.equal(oversized.ok, false);
    },
  },
  {
    name: "initial proposal and refinement expose only the authorized current editor and latest feedback",
    run: () => {
      const research = {
        servedTaxonId: NICHE_ID,
        endCustomer: { audienceScope: "end_customer" as const, sourceTaxonId: NICHE_ID, sourceRelation: "own" as const, version: 1, researches: [] },
        businessBuyer: { audienceScope: "business_buyer" as const, sourceTaxonId: NICHE_ID, sourceRelation: "own" as const, version: 1, researches: [] },
        versions: { endCustomer: 1, businessBuyer: 1 },
      };
      const initial = buildGenerationProfileResponsesRequest({
        model: GENERATION_PROFILE_APPROVED_MODEL,
        taxonId: NICHE_ID,
        research,
        moduleIdentities: listLandingPageModuleIdentities(),
        previousActiveProfile: null,
        currentEditor: null,
      });
      const initialInput = JSON.parse(initial.body.input[1].content[0].text);
      assert.equal(initialInput.request_kind, "initial");
      assert.equal(initialInput.current_editor, null);
      assert.equal(initialInput.human_feedback, null);

      const currentEditor = {
        generationGuidance: validProfile.generationGuidance,
        recommendations: validProfile.items.map(({ id: _id, ...item }) => item),
      };
      const refined = buildGenerationProfileResponsesRequest({
        model: GENERATION_PROFILE_APPROVED_MODEL,
        taxonId: NICHE_ID,
        research,
        moduleIdentities: listLandingPageModuleIdentities(),
        previousActiveProfile: null,
        currentEditor,
        humanFeedback: "Priorize a prova antes da FAQ.",
      });
      const refinedInput = JSON.parse(refined.body.input[1].content[0].text);
      assert.equal(refinedInput.request_kind, "refinement");
      assert.deepEqual(refinedInput.current_editor, currentEditor);
      assert.equal(refinedInput.human_feedback, "Priorize a prova antes da FAQ.");
      assert.equal(Object.hasOwn(refined.body, "previous_response_id"), false);
    },
  },
  {
    name: "validated refinement replaces only the editor while failure preserves it and its dirty state",
    run: () => {
      const currentEditor = {
        generationGuidance: validProfile.generationGuidance,
        recommendations: validProfile.items.map(({ id: _id, ...item }) => item),
      };
      assert.equal(hasGenerationProfileEditorContent({ generationGuidance: "", recommendations: [] }), false);
      assert.equal(hasGenerationProfileEditorContent(currentEditor), true);

      const refinedPayload = validateGenerationProfileProviderPayload({
        generation_guidance: "Priorize prova e clareza.",
        recommendations: [{
          module_key: "hero",
          module_version: 1,
          variant_key: "hero.form",
          variant_version: 1,
          priority: "P1",
          recommended_order: 10,
          item_guidance: "Conecte a prova ao CTA.",
        }],
      });
      assert.equal(refinedPayload.ok, true);
      if (!refinedPayload.ok) return;
      const success = applyGenerationProfileProposalToEditor({
        currentEditor,
        currentDirty: false,
        result: {
          ok: true,
          value: {
            ...refinedPayload.value,
            requestId: "50000000-0000-4000-8000-000000000001",
          },
        },
      });
      assert.equal(success.applied, true);
      assert.equal(success.dirty, true);
      assert.equal(success.editor.generationGuidance, "Priorize prova e clareza.");
      assert.deepEqual(Object.keys(success).sort(), ["applied", "dirty", "editor"]);

      const failure = applyGenerationProfileProposalToEditor({
        currentEditor,
        currentDirty: true,
        result: {
          ok: false,
          requestId: "50000000-0000-4000-8000-000000000002",
          error: { code: "technical_failure", message: "Provider unavailable." },
        },
      });
      assert.equal(failure.applied, false);
      assert.equal(failure.editor, currentEditor);
      assert.equal(failure.dirty, true);
      assert.deepEqual(Object.keys(failure).sort(), ["applied", "dirty", "editor"]);
    },
  },
  {
    name: "research failures preserve missing invalid and technical categories",
    run: () => {
      assert.equal(mapResearchErrorToProposalError("RESEARCH_INCOMPLETE"), "missing_information");
      assert.equal(mapResearchErrorToProposalError("RESEARCH_INVALID"), "invalid_data");
      assert.equal(mapResearchErrorToProposalError("RESEARCH_AMBIGUOUS"), "invalid_data");
      assert.equal(mapResearchErrorToProposalError("READ_FAILED"), "technical_failure");
      assert.equal(mapResearchErrorToProposalError("SOURCE_NOT_NORMALIZABLE"), "technical_failure");
    },
  },
  {
    name: "provider failures and any unapproved model fail closed",
    run: () => {
      assert.equal(mapProviderFailureToProposalError("refusal"), "technical_failure");
      assert.equal(mapProviderFailureToProposalError("incomplete"), "technical_failure");
      assert.equal(mapProviderFailureToProposalError("timeout"), "technical_failure");
      assert.equal(mapProviderFailureToProposalError("request_too_large"), "invalid_data");
      assert.equal(isGenerationProfileAssistanceConfigured({ apiKey: "", model: GENERATION_PROFILE_APPROVED_MODEL }), false);
      assert.equal(isGenerationProfileAssistanceConfigured({ apiKey: "secret", model: "" }), false);
      assert.equal(isGenerationProfileAssistanceConfigured({ apiKey: "secret", model: "gpt-5.4" }), false);
      assert.equal(isGenerationProfileAssistanceConfigured({ apiKey: "secret", model: GENERATION_PROFILE_APPROVED_MODEL }), true);
      assert.equal(estimateGenerationProfileCostUsd("gpt-5.4", 1000, 1000), null);
      assert.equal(estimateGenerationProfileCostUsd(GENERATION_PROFILE_APPROVED_MODEL, 1000, 1000), 0.0035);
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
