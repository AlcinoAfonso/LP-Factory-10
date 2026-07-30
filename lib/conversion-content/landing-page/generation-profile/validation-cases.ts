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
  applyGenerationProfileCandidate,
  diffGenerationProfileRecommendations,
  receiveGenerationProfileProposal,
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

const structuralResearch = {
  servedTaxonId: NICHE_ID,
  businessBuyer: {
    audienceScope: "business_buyer" as const,
    sourceTaxonId: NICHE_ID,
    sourceRelation: "own" as const,
    version: 1,
    researches: [{
      researchId: "41000000-0000-4000-8000-000000000001",
      researchBlock: "lp_sections" as const,
      audienceScope: "business_buyer" as const,
      version: 1,
      sourceTaxonId: NICHE_ID,
      items: [{
        itemId: "42000000-0000-4000-8000-000000000001",
        researchId: "41000000-0000-4000-8000-000000000001",
        itemKey: "buyer_faq",
        itemText: "FAQ comercial",
        priority: 2,
        sortOrder: 2,
        servedTaxonId: NICHE_ID,
        sourceTaxonId: NICHE_ID,
        sourceRelation: "own" as const,
        audienceScope: "business_buyer" as const,
        researchVersion: 1,
      }],
    }],
  },
  endCustomer: {
    audienceScope: "end_customer" as const,
    sourceTaxonId: NICHE_ID,
    sourceRelation: "own" as const,
    version: 1,
    researches: [{
      researchId: "41000000-0000-4000-8000-000000000002",
      researchBlock: "lp_sections" as const,
      audienceScope: "end_customer" as const,
      version: 1,
      sourceTaxonId: NICHE_ID,
      items: [{
        itemId: "42000000-0000-4000-8000-000000000002",
        researchId: "41000000-0000-4000-8000-000000000002",
        itemKey: "customer_hero",
        itemText: "Hero de conversao",
        priority: 3,
        sortOrder: 1,
        servedTaxonId: NICHE_ID,
        sourceTaxonId: NICHE_ID,
        sourceRelation: "own" as const,
        audienceScope: "end_customer" as const,
        researchVersion: 1,
      }],
    }],
  },
  versions: { endCustomer: 1, businessBuyer: 1 },
} as const;

const structuralPayload = {
  coverage: [
    {
      audience_scope: "business_buyer" as const,
      item_key: "buyer_faq",
      section_name: "FAQ comercial",
      source_priority: 2 as const,
      source_order: 2,
      status: "covered" as const,
      compatible_identities: [{ module_key: "faq", module_version: 1, variant_key: "faq.accordion", variant_version: 1 }],
      reason: null,
      impact: null,
    },
    {
      audience_scope: "end_customer" as const,
      item_key: "customer_hero",
      section_name: "Hero de conversao",
      source_priority: 3 as const,
      source_order: 1,
      status: "covered" as const,
      compatible_identities: [{ module_key: "hero", module_version: 1, variant_key: "hero.form", variant_version: 1 }],
      reason: null,
      impact: null,
    },
  ],
  recommendations: [
    { module_key: "hero", module_version: 1, variant_key: "hero.form", variant_version: 1, priority: "P1" as const, recommended_order: 10 },
    { module_key: "faq", module_version: 1, variant_key: "faq.accordion", variant_version: 1, priority: "P2" as const, recommended_order: 20 },
  ],
  source_notices: [],
};

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
    run: () => {
      assert.equal(landingPageGenerationProfileSchema.safeParse(validProfile).success, true);
      const { generationGuidance: _generationGuidance, ...withoutGuidance } = validProfile;
      assert.equal(landingPageGenerationProfileSchema.safeParse(withoutGuidance).success, true);
    },
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
      const { generationGuidance: _generationGuidance, ...withoutGuidance } = input;
      assert.equal(validateGenerationProfileDraft(withoutGuidance).ok, true);
      assert.equal(validateGenerationProfileDraft({ ...input, generationGuidance: " " }).ok, false);
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
    name: "structural proposal covers every lp_sections item and rejects output drift",
    run: () => {
      const validate = (payload: unknown) => validateGenerationProfileProviderPayload({ payload, research: structuralResearch, moduleIdentities: listLandingPageModuleIdentities() });
      const valid = validate(structuralPayload);
      assert.equal(valid.ok, true, valid.ok ? undefined : valid.message);
      assert.equal(validate({ ...structuralPayload, generation_guidance: "Nao autorizado" }).ok, false);
      assert.equal(validate({ ...structuralPayload, recommendations: [{ ...structuralPayload.recommendations[0], item_guidance: "Nao autorizado" }] }).ok, false);
      assert.equal(validate({ ...structuralPayload, coverage: structuralPayload.coverage.slice(1) }).ok, false);
      assert.equal(validate({ ...structuralPayload, recommendations: [{ ...structuralPayload.recommendations[0], module_key: "invented" }, structuralPayload.recommendations[1]] }).ok, false);
      assert.equal(validate({ ...structuralPayload, recommendations: [structuralPayload.recommendations[1], structuralPayload.recommendations[0]] }).ok, false);
    },
  },
  {
    name: "coverage derives transient gaps and gap decisions require complete audit metadata",
    run: () => {
      const missingBuyer = {
        ...structuralPayload,
        coverage: [
          { ...structuralPayload.coverage[0], status: "missing" as const, compatible_identities: [], reason: "Modulo indisponivel.", impact: "FAQ comercial parcial." },
          structuralPayload.coverage[1],
        ],
        recommendations: [structuralPayload.recommendations[0]],
      };
      const validated = validateGenerationProfileProviderPayload({ payload: missingBuyer, research: structuralResearch, moduleIdentities: listLandingPageModuleIdentities() });
      assert.equal(validated.ok, true);
      if (!validated.ok) return;
      assert.deepEqual(validated.value.gaps.map((gap) => gap.itemKey), ["buyer_faq"]);
      assert.equal(validateGenerationProfileDraft({
        ownerTaxonId: NICHE_ID,
        recommendations: validated.value.recommendations,
        origin: "ai",
        gapDecision: "wait_for_modules",
      }).ok, false);
      assert.equal(validateGenerationProfileDraft({
        ownerTaxonId: NICHE_ID,
        recommendations: validated.value.recommendations,
        origin: "ai",
        gapDecision: "wait_for_modules",
        gapItemKeys: ["buyer_faq"],
        gapImpactSummary: "FAQ comercial parcial.",
        researchVersions: structuralResearch.versions,
      }).ok, true);
    },
  },
  {
    name: "proposal fingerprint ignores human-only guidance and detects structural adjustment",
    run: () => {
      const proposal = { recommendations: validProfile.items.map(({ id: _id, ...item }) => item) };
      const fingerprint = fingerprintGenerationProfileProposal(proposal);
      assert.match(fingerprint, /^[a-f0-9]{64}$/);
      assert.equal(fingerprintGenerationProfileProposal(proposal), fingerprint);
      assert.equal(fingerprintGenerationProfileProposal({ recommendations: proposal.recommendations.map((item) => ({ ...item, itemGuidance: "Ajustada" })) }), fingerprint);
      assert.notEqual(fingerprintGenerationProfileProposal({ recommendations: proposal.recommendations.map((item) => ({ ...item, priority: "P2" as const })) }), fingerprint);
    },
  },
  {
    name: "Responses API request is structural stateless tool-free and bounded with whole raw files",
    run: () => {
      const request = buildGenerationProfileResponsesRequest({
        model: GENERATION_PROFILE_APPROVED_MODEL,
        taxonId: NICHE_ID,
        research: structuralResearch,
        moduleIdentities: listLandingPageModuleIdentities(),
        previousActiveProfile: null,
        currentEditor: { generationGuidance: "Segredo humano", recommendations: [] },
        currentCandidate: null,
        rawResearch: [{
          reference: { path: "docs/pesquisas-brutas/exemplo/business_buyer/v1.md", audienceScope: "business_buyer", sourceTaxonId: SEGMENT_ID, sourceRelation: "direct_parent", version: 1, blob: "a".repeat(40) },
          content: "arquivo completo",
        }],
        rawResearchNotices: [],
      });
      assert.equal(request.ok, true);
      assert.equal(request.body.store, false);
      assert.equal(request.body.max_output_tokens, 4000);
      assert.equal(Object.hasOwn(request.body, "tools"), false);
      assert.equal(request.body.text.format.strict, true);
      assert.equal(request.body.text.format.schema.additionalProperties, false);
      assert.equal(Object.hasOwn(request.body, "previous_response_id"), false);
      const input = JSON.parse(request.body.input[1].content[0].text);
      assert.equal(Object.hasOwn(input.current_editor, "generationGuidance"), false);
      assert.equal(input.raw_research[0].content, "arquivo completo");
      assert.equal(input.raw_research[0].reference.sourceRelation, "direct_parent");
      const omittedRaw = buildGenerationProfileResponsesRequest({
        model: GENERATION_PROFILE_APPROVED_MODEL,
        taxonId: NICHE_ID,
        research: structuralResearch,
        moduleIdentities: listLandingPageModuleIdentities(),
        previousActiveProfile: null,
        currentEditor: { generationGuidance: "", recommendations: [] },
        currentCandidate: null,
        rawResearch: [{
          reference: { path: "docs/pesquisas-brutas/exemplo/end_customer/v1.md", audienceScope: "end_customer", sourceTaxonId: NICHE_ID, sourceRelation: "own", version: 1, blob: "b".repeat(40) },
          content: "x".repeat(100_000),
        }],
        rawResearchNotices: ["Pesquisa bruta complementar ausente para business_buyer."],
      });
      assert.equal(omittedRaw.ok, true);
      assert.equal(omittedRaw.rawResearchReferences.length, 0);
      assert.equal(omittedRaw.notices.length, 2);
      assert.deepEqual(JSON.parse(omittedRaw.body.input[1].content[0].text).raw_research, []);
      const oversized = buildGenerationProfileResponsesRequest({
        model: GENERATION_PROFILE_APPROVED_MODEL,
        taxonId: NICHE_ID,
        research: structuralResearch,
        moduleIdentities: listLandingPageModuleIdentities(),
        previousActiveProfile: null,
        currentEditor: { generationGuidance: "", recommendations: [] },
        currentCandidate: null,
        rawResearch: [],
        rawResearchNotices: [],
        humanFeedback: "x".repeat(100_000),
      });
      assert.equal(oversized.ok, false);
    },
  },
  {
    name: "creation and evolution expose structural baseline candidate and latest feedback only",
    run: () => {
      const initial = buildGenerationProfileResponsesRequest({
        model: GENERATION_PROFILE_APPROVED_MODEL,
        taxonId: NICHE_ID,
        research: structuralResearch,
        moduleIdentities: listLandingPageModuleIdentities(),
        previousActiveProfile: null,
        currentEditor: { generationGuidance: "", recommendations: [] },
        currentCandidate: null,
        rawResearch: [],
        rawResearchNotices: [],
      });
      const initialInput = JSON.parse(initial.body.input[1].content[0].text);
      assert.equal(initialInput.request_kind, "creation");
      assert.deepEqual(initialInput.current_editor, { recommendations: [] });
      assert.equal(initialInput.human_feedback, null);

      const currentEditor = {
        generationGuidance: validProfile.generationGuidance,
        recommendations: validProfile.items.map(({ id: _id, ...item }) => item),
      };
      const evolution = buildGenerationProfileResponsesRequest({
        model: GENERATION_PROFILE_APPROVED_MODEL,
        taxonId: NICHE_ID,
        research: structuralResearch,
        moduleIdentities: listLandingPageModuleIdentities(),
        previousActiveProfile: { ...validProfile, recommendations: currentEditor.recommendations, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        currentEditor,
        currentCandidate: null,
        rawResearch: [],
        rawResearchNotices: [],
        humanFeedback: "Priorize a prova antes da FAQ.",
      });
      const evolutionInput = JSON.parse(evolution.body.input[1].content[0].text);
      assert.equal(evolutionInput.request_kind, "evolution");
      assert.equal(Object.hasOwn(evolutionInput.current_editor.recommendations[0], "itemGuidance"), false);
      assert.equal(Object.hasOwn(evolutionInput.previous_active_profile, "generationGuidance"), false);
      assert.equal(evolutionInput.human_feedback, "Priorize a prova antes da FAQ.");

      const validated = validateGenerationProfileProviderPayload({ payload: { ...structuralPayload, source_notices: ["Pesquisa bruta diverge da E10.8; a fonte estruturada foi preservada."] }, research: structuralResearch, moduleIdentities: listLandingPageModuleIdentities() });
      assert.equal(validated.ok, true);
      if (!validated.ok) return;
      const candidate = { ...validated.value, researchVersions: structuralResearch.versions, requestId: "50000000-0000-4000-8000-000000000010" };
      const nextRound = buildGenerationProfileResponsesRequest({
        model: GENERATION_PROFILE_APPROVED_MODEL,
        taxonId: NICHE_ID,
        research: structuralResearch,
        moduleIdentities: listLandingPageModuleIdentities(),
        previousActiveProfile: null,
        currentEditor,
        currentCandidate: candidate,
        rawResearch: [],
        rawResearchNotices: [],
        humanFeedback: "Refine novamente.",
      });
      const nextRoundInput = JSON.parse(nextRound.body.input[1].content[0].text);
      assert.deepEqual(nextRoundInput.current_candidate.recommendations, candidate.recommendations);
      assert.equal(nextRoundInput.human_feedback, "Refine novamente.");
      assert.equal(validated.value.notices.length, 1);
    },
  },
  {
    name: "candidate review preserves editor and apply preserves human guidance while marking dirty",
    run: () => {
      const currentEditor = {
        generationGuidance: validProfile.generationGuidance,
        recommendations: validProfile.items.map(({ id: _id, ...item }) => item),
      };
      assert.equal(hasGenerationProfileEditorContent({ generationGuidance: "", recommendations: [] }), false);
      assert.equal(hasGenerationProfileEditorContent(currentEditor), true);
      const validated = validateGenerationProfileProviderPayload({ payload: structuralPayload, research: structuralResearch, moduleIdentities: listLandingPageModuleIdentities() });
      assert.equal(validated.ok, true);
      if (!validated.ok) return;
      const result = { ok: true as const, value: { ...validated.value, researchVersions: structuralResearch.versions, requestId: "50000000-0000-4000-8000-000000000001" } };
      const received = receiveGenerationProfileProposal({
        currentEditor,
        currentDirty: false,
        currentCandidate: null,
        result,
      });
      assert.equal(received.received, true);
      assert.equal(received.editor, currentEditor);
      assert.equal(received.dirty, false);
      if (!received.candidate) return;
      const applied = applyGenerationProfileCandidate({ currentEditor, candidate: received.candidate });
      assert.equal(applied.editor.generationGuidance, currentEditor.generationGuidance);
      assert.equal(applied.editor.recommendations.find((item) => item.moduleKey === "hero")?.itemGuidance, validProfile.items[0].itemGuidance);
      assert.equal(applied.dirty, true);
      assert.deepEqual(diffGenerationProfileRecommendations({ editor: currentEditor, candidate: received.candidate }), [
        { moduleKey: "faq", status: "added", changes: [] },
        { moduleKey: "hero", status: "kept", changes: [] },
      ]);

      const failure = receiveGenerationProfileProposal({
        currentEditor,
        currentDirty: true,
        currentCandidate: received.candidate,
        result: {
          ok: false,
          requestId: "50000000-0000-4000-8000-000000000002",
          error: { code: "technical_failure", message: "Provider unavailable." },
        },
      });
      assert.equal(failure.received, false);
      assert.equal(failure.editor, currentEditor);
      assert.equal(failure.dirty, true);
      assert.equal(failure.candidate, received.candidate);
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
