import assert from "node:assert/strict";

import { requestGenerationProfileProposal } from "../../adapters/landingPageGenerationProfileOpenAiAdapter";
import type { OpenAiWorkloadEvent } from "../../../openai-workloads";
import {
  loadLandingPageGenerationProfileSourceFromClient,
  resolveLandingPageGenerationProfileForTaxonFromClient,
  type LandingPageGenerationProfileReadClient,
} from "../../adapters/landingPageGenerationProfileAdapterCore";
import { normalizeLandingPageGenerationProfileItemRow } from "../../adapters/landingPageGenerationProfileRowNormalization";
import {
  composeAdminGenerationProfileListItem,
  fingerprintGenerationProfileProposal,
  getAdminGenerationProfilePresentation,
  normalizeGenerationProfileCandidate,
  normalizeGenerationProfileLifecycleReadiness,
  validateGenerationProfileDraft,
} from "./index";
import {
  landingPageGenerationProfileSchema,
  landingPageGenerationProfileSourceSchema,
  landingPageGenerationProfileTaxonChainSchema,
} from "./schema";
import {
  buildGenerationProfileInvalidDataMetadata,
  buildGenerationProfileResponsesRequest,
  GENERATION_PROFILE_INVALID_PROPOSAL_MESSAGE,
  isGenerationProfileAssistanceConfigured,
  mapProviderFailureToProposalError,
  mapResearchErrorToProposalError,
  normalizeGenerationProfileIncompleteMetadata,
  validateGenerationProfileResearchPriorities,
  validateGenerationProfileProviderPayload,
} from "./proposal";
import {
  listLandingPageModuleIdentities,
  listLandingPageModuleSelectionCatalog,
} from "../module-catalog";
import type { ResolvedLandingPageResearch } from "../research-resolution";
import {
  applyGenerationProfileCandidate,
  findGenerationProfileReplacements,
  receiveGenerationProfileProposal,
  hasGenerationProfileEditorContent,
} from "./editor-assistance";
import { resolveLandingPageGenerationProfile } from "./resolver";

const SEGMENT_ID = "10000000-0000-4000-8000-000000000001";
const GENERATION_PROFILE_MODEL = "gpt-5.4-mini";
const GENERATION_PROFILE_REASONING_EFFORT = "none" as const;
const NICHE_ID = "10000000-0000-4000-8000-000000000002";
const ULTRA_ID = "10000000-0000-4000-8000-000000000003";
const BUYER_SECTION_ITEM_ID = "42000000-0000-4000-8000-000000000001";
const CUSTOMER_SECTION_ITEM_ID = "42000000-0000-4000-8000-000000000002";
const REPEATED_BUYER_SECTION_ITEM_ID = "42000000-0000-4000-8000-000000000003";
const REALTOR_POSITIONING_SECTION_ITEM_ID = "42000000-0000-4000-8000-000000000004";
const REALTOR_LEAD_SECTION_ITEM_ID = "42000000-0000-4000-8000-000000000005";
const REALTOR_PROPERTY_SECTION_ITEM_ID = "42000000-0000-4000-8000-000000000006";
const REALTOR_CONTACT_SECTION_ITEM_ID = "42000000-0000-4000-8000-000000000007";
const BUYER_COVERAGE_ID = `business_buyer:${BUYER_SECTION_ITEM_ID}`;
const CUSTOMER_COVERAGE_ID = `end_customer:${CUSTOMER_SECTION_ITEM_ID}`;
const REPEATED_BUYER_COVERAGE_ID = `business_buyer:${REPEATED_BUYER_SECTION_ITEM_ID}`;
const REALTOR_COVERAGE_IDS = [
  `business_buyer:${REALTOR_POSITIONING_SECTION_ITEM_ID}`,
  `business_buyer:${REALTOR_LEAD_SECTION_ITEM_ID}`,
  `end_customer:${REALTOR_PROPERTY_SECTION_ITEM_ID}`,
  `end_customer:${REALTOR_CONTACT_SECTION_ITEM_ID}`,
] as const;

function compactResearchParent(
  audienceScope: "business_buyer" | "end_customer",
  researchBlock: "strategic_core" | "lp_overview" | "seo",
  suffix: string,
  itemText: string,
) {
  const researchId = `43000000-0000-4000-8000-0000000000${suffix}`;
  return {
    researchId,
    researchBlock,
    audienceScope,
    version: 1,
    sourceTaxonId: NICHE_ID,
    items: [{
      itemId: `44000000-0000-4000-8000-0000000000${suffix}`,
      researchId,
      itemKey: `${researchBlock}_${suffix}`,
      itemText,
      priority: 2,
      sortOrder: 1,
      servedTaxonId: NICHE_ID,
      sourceTaxonId: NICHE_ID,
      sourceRelation: "own" as const,
      audienceScope,
      researchVersion: 1,
    }],
  };
}

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
    researches: [
      compactResearchParent("business_buyer", "strategic_core", "01", "Estratégia do comprador"),
      compactResearchParent("business_buyer", "lp_overview", "02", "Visão da LP para o comprador"),
      compactResearchParent("business_buyer", "seo", "03", "SEO do comprador"),
      {
      researchId: "41000000-0000-4000-8000-000000000001",
      researchBlock: "lp_sections" as const,
      audienceScope: "business_buyer" as const,
      version: 1,
      sourceTaxonId: NICHE_ID,
      items: [{
        itemId: BUYER_SECTION_ITEM_ID,
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
      },
    ],
  },
  endCustomer: {
    audienceScope: "end_customer" as const,
    sourceTaxonId: NICHE_ID,
    sourceRelation: "own" as const,
    version: 1,
    researches: [
      compactResearchParent("end_customer", "strategic_core", "04", "Estratégia do cliente"),
      compactResearchParent("end_customer", "lp_overview", "05", "Visão da LP para o cliente"),
      compactResearchParent("end_customer", "seo", "06", "SEO do cliente"),
      {
      researchId: "41000000-0000-4000-8000-000000000002",
      researchBlock: "lp_sections" as const,
      audienceScope: "end_customer" as const,
      version: 1,
      sourceTaxonId: NICHE_ID,
      items: [{
        itemId: CUSTOMER_SECTION_ITEM_ID,
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
      },
    ],
  },
  versions: { endCustomer: 1, businessBuyer: 1 },
} as const;

const structuralPayload = {
  coverage: [
    {
      coverage_id: BUYER_COVERAGE_ID,
      status: "covered" as const,
      compatible_aliases: ["faq.accordion"],
      selected_aliases: ["faq.accordion"],
    },
    {
      coverage_id: CUSTOMER_COVERAGE_ID,
      status: "covered" as const,
      compatible_aliases: ["hero.form"],
      selected_aliases: ["hero.form"],
    },
  ],
};

function withBuyerSectionPriority(priority: number): ResolvedLandingPageResearch {
  return {
    ...structuralResearch,
    businessBuyer: {
      ...structuralResearch.businessBuyer,
      researches: structuralResearch.businessBuyer.researches.map((parent) => parent.researchBlock === "lp_sections"
        ? { ...parent, items: parent.items.map((item) => ({ ...item, priority })) }
        : parent),
    },
  };
}

function withRepeatedBuyerItemKey(): ResolvedLandingPageResearch {
  return {
    ...structuralResearch,
    businessBuyer: {
      ...structuralResearch.businessBuyer,
      researches: structuralResearch.businessBuyer.researches.map((parent) => parent.researchBlock === "lp_sections"
        ? {
            ...parent,
            items: [
              ...parent.items,
              {
                ...parent.items[0],
                itemId: REPEATED_BUYER_SECTION_ITEM_ID,
                itemText: "FAQ para objecoes",
                priority: 2,
                sortOrder: 2,
              },
            ],
          }
        : parent),
    },
  };
}

function buildCorretorImoveisInitialResearchFixture(): ResolvedLandingPageResearch {
  return {
    ...structuralResearch,
    businessBuyer: {
      ...structuralResearch.businessBuyer,
      researches: structuralResearch.businessBuyer.researches.map((parent) => parent.researchBlock === "lp_sections"
        ? {
            ...parent,
            items: [
              {
                ...parent.items[0],
                itemId: REALTOR_POSITIONING_SECTION_ITEM_ID,
                itemKey: "realtor_positioning",
                itemText: "Apresentar o posicionamento do corretor e a proposta principal para captar proprietários.",
                priority: 3,
                sortOrder: 20,
              },
              {
                ...parent.items[0],
                itemId: REALTOR_LEAD_SECTION_ITEM_ID,
                itemKey: "realtor_lead_capture",
                itemText: "Convidar o proprietário a solicitar uma avaliação pelo formulário de contato.",
                priority: 1,
                sortOrder: 40,
              },
            ],
          }
        : parent),
    },
    endCustomer: {
      ...structuralResearch.endCustomer,
      researches: structuralResearch.endCustomer.researches.map((parent) => parent.researchBlock === "lp_sections"
        ? {
            ...parent,
            items: [
              {
                ...parent.items[0],
                itemId: REALTOR_PROPERTY_SECTION_ITEM_ID,
                itemKey: "property_search_positioning",
                itemText: "Abrir a página com imóveis selecionados e uma proposta clara de atendimento.",
                priority: 2,
                sortOrder: 10,
              },
              {
                ...parent.items[0],
                itemId: REALTOR_CONTACT_SECTION_ITEM_ID,
                itemKey: "property_contact",
                itemText: "Permitir que o interessado envie seus dados para receber opções de imóveis.",
                priority: 3,
                sortOrder: 30,
              },
            ],
          }
        : parent),
    },
  };
}

const expectedStructuralRecommendations = [
  { moduleKey: "hero", moduleVersion: 1, variantKey: "hero.form", variantVersion: 1, priority: "P1" as const, recommendedOrder: 10 },
  { moduleKey: "faq", moduleVersion: 1, variantKey: "faq.accordion", variantVersion: 1, priority: "P2" as const, recommendedOrder: 20 },
];

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
    name: "active own profile remains visible beside own draft",
    run: () => {
      const item = composeAdminGenerationProfileListItem({
        taxon: {
          id: NICHE_ID,
          name: "Niche",
          slug: "niche",
          level: "niche",
          parentId: SEGMENT_ID,
        },
        draftVersion: 2,
        resolved: {
          state: "active_own",
          activeVersion: 1,
          ownerTaxonId: NICHE_ID,
          ownerTaxonName: "Niche",
        },
      });
      const presentation = getAdminGenerationProfilePresentation(item);

      assert.equal(item.resolvedState, "active_own");
      assert.equal(item.activeVersion, 1);
      assert.equal(item.draftVersion, 2);
      assert.equal(presentation.active.label, "Ativo — próprio v1");
      assert.equal(presentation.draft.label, "Rascunho — próprio v2");
      assert.equal(presentation.assistanceTaxonId, NICHE_ID);
      assert.equal(presentation.action.href, `/admin/perfis-de-orientacao/${NICHE_ID}`);
    },
  },
  {
    name: "active inherited profile remains visible beside own draft",
    run: () => {
      const item = composeAdminGenerationProfileListItem({
        taxon: {
          id: NICHE_ID,
          name: "Niche",
          slug: "niche",
          level: "niche",
          parentId: SEGMENT_ID,
        },
        draftVersion: 2,
        resolved: {
          state: "active_inherited",
          activeVersion: 1,
          ownerTaxonId: SEGMENT_ID,
          ownerTaxonName: "Segment",
        },
      });
      const presentation = getAdminGenerationProfilePresentation(item);

      assert.equal(item.resolvedState, "active_inherited");
      assert.equal(item.ownerTaxonId, SEGMENT_ID);
      assert.equal(item.draftVersion, 2);
      assert.equal(presentation.active.label, "Ativo — herdado v1");
      assert.equal(presentation.draft.label, "Rascunho — próprio v2");
      assert.equal(presentation.assistanceTaxonId, NICHE_ID);
      assert.equal(presentation.action.href, `/admin/perfis-de-orientacao/${NICHE_ID}`);
    },
  },
  {
    name: "AI assistance research target follows the editor owner",
    run: () => {
      const inherited = composeAdminGenerationProfileListItem({
        taxon: {
          id: NICHE_ID,
          name: "Niche",
          slug: "niche",
          level: "niche",
          parentId: SEGMENT_ID,
        },
        draftVersion: null,
        resolved: {
          state: "active_inherited",
          activeVersion: 1,
          ownerTaxonId: SEGMENT_ID,
          ownerTaxonName: "Segment",
        },
      });
      const own = composeAdminGenerationProfileListItem({
        taxon: inherited.taxon,
        draftVersion: null,
        resolved: {
          state: "active_own",
          activeVersion: 1,
          ownerTaxonId: NICHE_ID,
          ownerTaxonName: "Niche",
        },
      });
      const absent = composeAdminGenerationProfileListItem({
        taxon: inherited.taxon,
        draftVersion: null,
        resolved: {
          state: "absent",
          activeVersion: null,
          ownerTaxonId: null,
          ownerTaxonName: null,
        },
      });

      assert.equal(
        getAdminGenerationProfilePresentation(inherited).assistanceTaxonId,
        SEGMENT_ID,
      );
      assert.equal(
        getAdminGenerationProfilePresentation(inherited).action.href,
        `/admin/perfis-de-orientacao/${SEGMENT_ID}`,
      );
      assert.equal(getAdminGenerationProfilePresentation(own).assistanceTaxonId, NICHE_ID);
      assert.equal(getAdminGenerationProfilePresentation(absent).assistanceTaxonId, NICHE_ID);
    },
  },
  {
    name: "invalid proposal message preserves the current profile state for creation and evolution",
    run: () => {
      assert.equal(
        GENERATION_PROFILE_INVALID_PROPOSAL_MESSAGE,
        "A proposta da IA não atendeu às regras estruturais. Nenhuma alteração foi salva e o estado atual do perfil foi preservado.",
      );
      assert.doesNotMatch(GENERATION_PROFILE_INVALID_PROPOSAL_MESSAGE, /perfil ativo/);
    },
  },
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
    name: "lifecycle readiness fails closed before the versioned contract is applied",
    run: () => {
      assert.equal(normalizeGenerationProfileLifecycleReadiness({ ready: true }).ready, false);
      assert.equal(normalizeGenerationProfileLifecycleReadiness({ ready: true, contract_version: 1 }).ready, false);
      assert.equal(normalizeGenerationProfileLifecycleReadiness({ ready: true, contract_version: 2 }).ready, true);
      assert.equal(normalizeGenerationProfileLifecycleReadiness({ ready: false, contract_version: 2 }).ready, false);
    },
  },
  {
    name: "structural proposal accepts only reduced AI analysis and reconstructs canonical output",
    run: () => {
      const validate = (payload: unknown) => validateGenerationProfileProviderPayload({ payload, research: structuralResearch, moduleIdentities: listLandingPageModuleIdentities() });
      const valid = validate(structuralPayload);
      assert.equal(valid.ok, true, valid.ok ? undefined : valid.message);
      if (valid.ok) {
        assert.deepEqual(valid.value.coverage.map((item) => ({
          coverageId: item.coverageId,
          audienceScope: item.audienceScope,
          itemKey: item.itemKey,
          sectionName: item.sectionName,
          sourcePriority: item.sourcePriority,
          sourceOrder: item.sourceOrder,
        })), [
          { coverageId: BUYER_COVERAGE_ID, audienceScope: "business_buyer", itemKey: "buyer_faq", sectionName: "FAQ comercial", sourcePriority: 2, sourceOrder: 2 },
          { coverageId: CUSTOMER_COVERAGE_ID, audienceScope: "end_customer", itemKey: "customer_hero", sectionName: "Hero de conversao", sourcePriority: 3, sourceOrder: 1 },
        ]);
        assert.deepEqual(valid.value.recommendations, expectedStructuralRecommendations);
      }
      const invalidSchema = validate({ ...structuralPayload, generation_guidance: "Nao autorizado" });
      assert.equal(invalidSchema.ok, false);
      if (!invalidSchema.ok) assert.equal(invalidSchema.reason, "payload_schema_invalid");
      assert.equal(validate({ ...structuralPayload, recommendations: [] }).ok, false);
      assert.equal(validate({ ...structuralPayload, coverage: [{ ...structuralPayload.coverage[0], section_name: "Drift" }, structuralPayload.coverage[1]] }).ok, false);
      assert.equal(validate({ ...structuralPayload, coverage: structuralPayload.coverage.slice(1) }).ok, false);
      assert.equal(validate({ ...structuralPayload, coverage: [{ ...structuralPayload.coverage[0], coverage_id: "business_buyer:00000000-0000-4000-8000-000000000000" }, structuralPayload.coverage[1]] }).ok, false);
      assert.equal(validate({ ...structuralPayload, coverage: [structuralPayload.coverage[1], structuralPayload.coverage[0]] }).ok, true);
      assert.equal(validate({
        ...structuralPayload,
        coverage: [{ ...structuralPayload.coverage[0], compatible_aliases: ["invented"] }, structuralPayload.coverage[1]],
      }).ok, false);
      const coveredWithoutCompatibleAliases = validate({
        ...structuralPayload,
        coverage: [{ ...structuralPayload.coverage[0], compatible_aliases: [] }, structuralPayload.coverage[1]],
      });
      assert.equal(coveredWithoutCompatibleAliases.ok, false);
      if (!coveredWithoutCompatibleAliases.ok) {
        assert.equal(coveredWithoutCompatibleAliases.reason, "coverage_identity_count_invalid");
        assert.deepEqual(coveredWithoutCompatibleAliases.coverageDiagnostic, {
          coverageId: BUYER_COVERAGE_ID,
          coverageStatus: "covered",
          compatibleAliasCount: 0,
          selectedAliasCount: 1,
          coverageIndex: 0,
        });
      }
      assert.equal(validate({
        ...structuralPayload,
        coverage: [{ ...structuralPayload.coverage[0], status: "partial", compatible_aliases: [], reason: "Cobertura parcial.", impact: "Estrutura incompleta." }, structuralPayload.coverage[1]],
      }).ok, false);
      assert.equal(validate({
        ...structuralPayload,
        coverage: [{ ...structuralPayload.coverage[0], status: "partial", selected_aliases: [], reason: "Cobertura parcial.", impact: "Estrutura incompleta." }, structuralPayload.coverage[1]],
      }).ok, false);
      assert.equal(validate({
        ...structuralPayload,
        coverage: [{ ...structuralPayload.coverage[0], status: "missing", compatible_aliases: ["faq.accordion"], reason: "Modulo indisponivel.", impact: "Estrutura incompleta." }, structuralPayload.coverage[1]],
      }).ok, false);
      assert.equal(validate({
        ...structuralPayload,
        coverage: [{ ...structuralPayload.coverage[0], status: "missing", compatible_aliases: [], reason: "Modulo indisponivel.", impact: "Estrutura incompleta." }, structuralPayload.coverage[1]],
      }).ok, false);
    },
  },
  {
    name: "lp_sections priority accepts only the explicit one-to-three mapping",
    run: () => {
      for (const [sourcePriority, expectedPriority] of [[1, "P3"], [2, "P2"], [3, "P1"]] as const) {
        const research = withBuyerSectionPriority(sourcePriority);
        assert.equal(validateGenerationProfileResearchPriorities(research), true);
        const validated = validateGenerationProfileProviderPayload({ payload: structuralPayload, research, moduleIdentities: listLandingPageModuleIdentities() });
        assert.equal(validated.ok, true, validated.ok ? undefined : validated.message);
        if (validated.ok) assert.equal(validated.value.recommendations.find((item) => item.moduleKey === "faq")?.priority, expectedPriority);
      }
      for (const invalidPriority of [0, -1, 4]) {
        const research = withBuyerSectionPriority(invalidPriority);
        assert.equal(validateGenerationProfileResearchPriorities(research), false);
        const validated = validateGenerationProfileProviderPayload({ payload: structuralPayload, research, moduleIdentities: listLandingPageModuleIdentities() });
        assert.equal(validated.ok, false);
        if (!validated.ok) assert.equal(validated.reason, "coverage_source_priority_invalid");
      }
    },
  },
  {
    name: "selected aliases exclusively and deterministically choose recommendation identities",
    run: () => {
      const validate = (payload: unknown) => validateGenerationProfileProviderPayload({ payload, research: structuralResearch, moduleIdentities: listLandingPageModuleIdentities() });
      const withCustomerSelection = (compatibleAliases: string[], selectedAliases: string[], status: "covered" | "partial" | "missing" = "covered") => ({
        coverage: [
          structuralPayload.coverage[0],
          {
            ...structuralPayload.coverage[1],
            status,
            compatible_aliases: compatibleAliases,
            selected_aliases: selectedAliases,
            ...(status === "covered" ? {} : { reason: "Cobertura incompleta.", impact: "Estrutura afetada." }),
          },
        ],
      });

      const selectedVariant = validate(withCustomerSelection(["hero", "hero.standard"], ["hero.standard"]));
      assert.equal(selectedVariant.ok, true);
      if (!selectedVariant.ok) return;
      assert.deepEqual(selectedVariant.value.recommendations.find((item) => item.moduleKey === "hero"), {
        moduleKey: "hero",
        moduleVersion: 1,
        variantKey: "hero.standard",
        variantVersion: 1,
        priority: "P1",
        recommendedOrder: 10,
      });

      const selectedBase = validate(withCustomerSelection(["hero", "hero.standard"], ["hero"]));
      assert.equal(selectedBase.ok, true);
      if (selectedBase.ok) assert.deepEqual(selectedBase.value.recommendations.find((item) => item.moduleKey === "hero"), {
        moduleKey: "hero",
        moduleVersion: 1,
        priority: "P1",
        recommendedOrder: 10,
      });

      for (const [payload, reason] of [
        [withCustomerSelection(["hero"], ["hero.form"]), "coverage_selected_identity_invalid"],
        [withCustomerSelection(["hero.form"], ["hero.form", "hero.form"]), "coverage_selected_identity_invalid"],
        [withCustomerSelection(["hero", "hero.form"], ["hero", "hero.form"]), "coverage_selected_module_conflict"],
        [withCustomerSelection(["hero.form"], []), "coverage_selected_identity_count_invalid"],
        [withCustomerSelection(["hero.form"], [], "partial"), "coverage_selected_identity_count_invalid"],
      ] as const) {
        const result = validate(payload);
        assert.equal(result.ok, false);
        if (!result.ok) assert.equal(result.reason, reason);
      }

      const partial = validate(withCustomerSelection(["hero.form"], ["hero.form"], "partial"));
      assert.equal(partial.ok, true, partial.ok ? undefined : partial.message);
      const missingWithAliases = validate(withCustomerSelection(["hero.form"], ["hero.form"], "missing"));
      assert.equal(missingWithAliases.ok, false);

      const repeatedSelection = validate({
        coverage: structuralPayload.coverage.map((item) => ({
          ...item,
          compatible_aliases: ["hero.form"],
          selected_aliases: ["hero.form"],
        })),
      });
      assert.equal(repeatedSelection.ok, true);
      if (repeatedSelection.ok) {
        assert.equal(repeatedSelection.value.recommendations.length, 1);
        assert.equal(repeatedSelection.value.recommendations[0].variantKey, "hero.form");
      }

      for (const selectedAliases of [["hero"], ["hero.standard"]] as const) {
        const conflict = validate({
          coverage: [
            { ...structuralPayload.coverage[0], compatible_aliases: [...selectedAliases], selected_aliases: [...selectedAliases] },
            { ...structuralPayload.coverage[1], compatible_aliases: ["hero.form"], selected_aliases: ["hero.form"] },
          ],
        });
        assert.equal(conflict.ok, false);
        if (!conflict.ok) assert.equal(conflict.reason, "coverage_selected_identity_conflict");
      }

      const ordered = validate({
        coverage: [
          { ...structuralPayload.coverage[0], compatible_aliases: ["hero.form", "faq.accordion"], selected_aliases: ["hero.form", "faq.accordion"] },
          { ...structuralPayload.coverage[1], status: "missing", compatible_aliases: [], selected_aliases: [], reason: "Sem modulo.", impact: "Cobertura indisponivel." },
        ],
      });
      const reversed = validate({
        coverage: [
          { ...structuralPayload.coverage[0], compatible_aliases: ["faq.accordion", "hero.form"], selected_aliases: ["faq.accordion", "hero.form"] },
          { ...structuralPayload.coverage[1], status: "missing", compatible_aliases: [], selected_aliases: [], reason: "Sem modulo.", impact: "Cobertura indisponivel." },
        ],
      });
      assert.equal(ordered.ok && reversed.ok, true);
      if (ordered.ok && reversed.ok) assert.deepEqual(ordered.value, reversed.value);
    },
  },
  {
    name: "initial realtor fixture requires one global identity per module independently of coverage alias priority and order",
    run: () => {
      const research = buildCorretorImoveisInitialResearchFixture();
      const moduleIdentities = listLandingPageModuleIdentities();
      const moduleSelectionCatalog = listLandingPageModuleSelectionCatalog();
      const validate = (payload: unknown) => validateGenerationProfileProviderPayload({ payload, research, moduleIdentities });
      const compatibleAliases = ["hero", "hero.standard", "hero.form"];
      const coherentCoverage = REALTOR_COVERAGE_IDS.map((coverageId) => ({
        coverage_id: coverageId,
        status: "covered" as const,
        compatible_aliases: [...compatibleAliases],
        selected_aliases: ["hero.form"],
      }));

      const coherent = validate({ coverage: coherentCoverage });
      assert.equal(coherent.ok, true, coherent.ok ? undefined : coherent.message);
      if (!coherent.ok) return;
      assert.deepEqual(coherent.value.recommendations, [{
        moduleKey: "hero",
        moduleVersion: 1,
        variantKey: "hero.form",
        variantVersion: 1,
        priority: "P1",
        recommendedOrder: 10,
      }]);

      const reversedCoverage = validate({ coverage: [...coherentCoverage].reverse() });
      assert.equal(reversedCoverage.ok, true, reversedCoverage.ok ? undefined : reversedCoverage.message);
      if (reversedCoverage.ok) assert.deepEqual(reversedCoverage.value, coherent.value);
      const reversedAliases = validate({
        coverage: coherentCoverage.map((item) => ({ ...item, compatible_aliases: [...item.compatible_aliases].reverse() })),
      });
      assert.equal(reversedAliases.ok, true, reversedAliases.ok ? undefined : reversedAliases.message);
      if (reversedAliases.ok) assert.deepEqual(reversedAliases.value, coherent.value);

      for (const conflictingAlias of ["hero", "hero.standard"] as const) {
        const conflictingCoverage = coherentCoverage.map((item, index) => index === 0
          ? { ...item, selected_aliases: [conflictingAlias] }
          : item);
        for (const coverage of [conflictingCoverage, [...conflictingCoverage].reverse()]) {
          const conflict = validate({ coverage });
          assert.equal(conflict.ok, false);
          if (!conflict.ok) assert.equal(conflict.reason, "coverage_selected_identity_conflict");
        }
      }

      const request = buildGenerationProfileResponsesRequest({
        model: GENERATION_PROFILE_MODEL,
        reasoningEffort: GENERATION_PROFILE_REASONING_EFFORT,
        research,
        moduleIdentities,
        moduleSelectionCatalog,
        requestKind: "creation",
        activeBaseline: null,
        currentCandidate: null,
      });
      assert.equal(request.ok, true);
      const input = JSON.parse(request.body.input[1].content[0].text);
      assert.deepEqual(
        input.module_catalog.map((module: { module_alias: string }) => module.module_alias),
        moduleSelectionCatalog.modules.map((module) => module.moduleAlias),
      );
      assert.deepEqual(
        [...input.research.business_buyer.lp_sections, ...input.research.end_customer.lp_sections]
          .map((item: { coverage_id: string }) => item.coverage_id),
        REALTOR_COVERAGE_IDS,
      );
      const evolutionRequest = buildGenerationProfileResponsesRequest({
        model: GENERATION_PROFILE_MODEL,
        reasoningEffort: GENERATION_PROFILE_REASONING_EFFORT,
        research,
        moduleIdentities,
        moduleSelectionCatalog,
        requestKind: "evolution",
        activeBaseline: expectedStructuralRecommendations,
        currentCandidate: null,
        humanFeedback: "",
      });
      const evolutionInput = JSON.parse(evolutionRequest.body.input[1].content[0].text);
      assert.equal(evolutionRequest.ok, true);
      assert.equal(evolutionInput.request_kind, "evolution");
      assert.equal(evolutionInput.human_feedback, null);
      assert.deepEqual(evolutionInput.active_baseline, expectedStructuralRecommendations.map((item) => ({
        alias: item.variantKey ?? item.moduleKey,
        priority: item.priority,
        order: item.recommendedOrder,
      })));
      assert.equal(evolutionInput.module_catalog.length, moduleSelectionCatalog.modules.length);
      assert.equal(validate({ coverage: coherentCoverage }).ok, true);
      const prompt = request.body.input[0].content[0].text;
      assert.match(prompt, /opções mutuamente exclusivas da mesma decisão global/);
      assert.match(prompt, /necessidades conjuntas de todas as lp_sections/);
      assert.match(prompt, /Reutilize exatamente esse alias em toda cobertura/);
      assert.match(prompt, /Nunca desempate por prioridade, ordem ou posição/);
    },
  },
  {
    name: "repeated item_key remains distinct through provider candidate refinement gaps and diff",
    run: () => {
      const research = withRepeatedBuyerItemKey();
      const previousPayload = {
        coverage: [
          { ...structuralPayload.coverage[0], status: "missing" as const, compatible_aliases: [], selected_aliases: [], reason: "Modulo indisponivel.", impact: "FAQ comercial ausente." },
          { coverage_id: REPEATED_BUYER_COVERAGE_ID, status: "covered" as const, compatible_aliases: ["faq.accordion"], selected_aliases: ["faq.accordion"] },
          structuralPayload.coverage[1],
        ],
      };
      const previous = validateGenerationProfileProviderPayload({ payload: previousPayload, research, moduleIdentities: listLandingPageModuleIdentities() });
      assert.equal(previous.ok, true, previous.ok ? undefined : previous.message);
      if (!previous.ok) return;
      const previousCandidate = { ...previous.value, researchVersions: research.versions, requestId: "50000000-0000-4000-8000-000000000030" };
      const currentPayload = {
        coverage: [
          structuralPayload.coverage[0],
          { coverage_id: REPEATED_BUYER_COVERAGE_ID, status: "missing" as const, compatible_aliases: [], selected_aliases: [], reason: "Modulo indisponivel.", impact: "FAQ para objecoes ausente." },
          structuralPayload.coverage[1],
        ],
      };
      const current = validateGenerationProfileProviderPayload({
        payload: currentPayload,
        research,
        moduleIdentities: listLandingPageModuleIdentities(),
        previousCandidate,
      });
      assert.equal(current.ok, true, current.ok ? undefined : current.message);
      if (!current.ok) return;

      assert.deepEqual(current.value.coverage.filter((item) => item.itemKey === "buyer_faq").map((item) => item.coverageId), [BUYER_COVERAGE_ID, REPEATED_BUYER_COVERAGE_ID]);
      assert.deepEqual(current.value.gaps.map((gap) => [gap.coverageId, gap.itemKey]), [[REPEATED_BUYER_COVERAGE_ID, "buyer_faq"]]);
      assert.deepEqual(current.value.diff.gaps.added.map((gap) => gap.coverageId), [REPEATED_BUYER_COVERAGE_ID]);
      assert.deepEqual(current.value.diff.gaps.resolved.map((gap) => gap.coverageId), [BUYER_COVERAGE_ID]);
      assert.equal(fingerprintGenerationProfileProposal(previous.value), fingerprintGenerationProfileProposal(current.value));

      const candidate = { ...current.value, researchVersions: research.versions, requestId: "50000000-0000-4000-8000-000000000031" };
      assert.equal(normalizeGenerationProfileCandidate(candidate).ok, true);
      assert.equal(normalizeGenerationProfileCandidate({ ...candidate, coverage: [candidate.coverage[0], { ...candidate.coverage[1], coverageId: candidate.coverage[0].coverageId }, ...candidate.coverage.slice(2)] }).ok, false);
      assert.equal(normalizeGenerationProfileCandidate({ ...candidate, gaps: [...candidate.gaps, candidate.gaps[0]] }).ok, false);

      const request = buildGenerationProfileResponsesRequest({
        model: GENERATION_PROFILE_MODEL,
        reasoningEffort: GENERATION_PROFILE_REASONING_EFFORT,
        research,
        moduleIdentities: listLandingPageModuleIdentities(),
        moduleSelectionCatalog: listLandingPageModuleSelectionCatalog(),
        requestKind: "evolution",
        activeBaseline: null,
        currentCandidate: candidate,
      });
      assert.equal(request.ok, true);
      const input = JSON.parse(request.body.input[1].content[0].text);
      assert.deepEqual(input.research.business_buyer.lp_sections.map((item: { coverage_id: string }) => item.coverage_id), [BUYER_COVERAGE_ID, REPEATED_BUYER_COVERAGE_ID]);
      assert.equal(input.research.business_buyer.lp_sections.some((item: Record<string, unknown>) => Object.hasOwn(item, "item_id")), false);
      assert.deepEqual(input.current_candidate.coverage.map((item: { coverage_id: string }) => item.coverage_id), [BUYER_COVERAGE_ID, REPEATED_BUYER_COVERAGE_ID, CUSTOMER_COVERAGE_ID]);
    },
  },
  {
    name: "coverage derives transient gaps and gap decisions require complete audit metadata",
    run: () => {
      const missingBuyer = {
        ...structuralPayload,
        coverage: [
          { ...structuralPayload.coverage[0], status: "missing" as const, compatible_aliases: [], selected_aliases: [], reason: "Modulo indisponivel.", impact: "FAQ comercial parcial." },
          structuralPayload.coverage[1],
        ],
      };
      const validated = validateGenerationProfileProviderPayload({ payload: missingBuyer, research: structuralResearch, moduleIdentities: listLandingPageModuleIdentities() });
      assert.equal(validated.ok, true);
      if (!validated.ok) return;
      assert.deepEqual(validated.value.gaps.map((gap) => gap.itemKey), ["buyer_faq"]);
      assert.deepEqual(validated.value.recommendations.map((item) => item.moduleKey), ["hero"]);
      assert.deepEqual(validated.value.diff.gaps.added.map((gap) => gap.itemKey), ["buyer_faq"]);
      const previousCandidate = { ...validated.value, researchVersions: structuralResearch.versions, requestId: "50000000-0000-4000-8000-000000000020" };
      const resolvedGap = validateGenerationProfileProviderPayload({
        payload: structuralPayload,
        research: structuralResearch,
        moduleIdentities: listLandingPageModuleIdentities(),
        previousCandidate,
      });
      assert.equal(resolvedGap.ok, true);
      if (resolvedGap.ok) assert.deepEqual(resolvedGap.value.diff.gaps.resolved.map((gap) => gap.itemKey), ["buyer_faq"]);
      const partialBuyer = validateGenerationProfileProviderPayload({
        payload: {
          ...structuralPayload,
          coverage: [
            { ...structuralPayload.coverage[0], status: "partial", reason: "Cobertura parcial.", impact: "FAQ exige complemento." },
            structuralPayload.coverage[1],
          ],
        },
        research: structuralResearch,
        moduleIdentities: listLandingPageModuleIdentities(),
      });
      assert.equal(partialBuyer.ok, true);
      if (partialBuyer.ok) assert.deepEqual(partialBuyer.value.gaps.map((gap) => [gap.itemKey, gap.status]), [["buyer_faq", "partial"]]);
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
        gapAnalysisCompleted: true,
        gapDecision: "wait_for_modules",
        gapItemKeys: ["buyer_faq"],
        gapImpactSummary: "FAQ comercial parcial.",
        researchVersions: structuralResearch.versions,
      }).ok, true);
      assert.equal(validateGenerationProfileDraft({
        ownerTaxonId: NICHE_ID,
        recommendations: validated.value.recommendations,
        origin: "ai",
        gapAnalysisCompleted: true,
        gapItemKeys: [],
        researchVersions: structuralResearch.versions,
      }).ok, true);
    },
  },
  {
    name: "server derivation handles one-to-many many-to-one priority order and deterministic ties",
    run: () => {
      const validate = (payload: unknown, research: ResolvedLandingPageResearch = structuralResearch) => validateGenerationProfileProviderPayload({ payload, research, moduleIdentities: listLandingPageModuleIdentities() });
      const oneToMany = validate({
        coverage: [
          {
            ...structuralPayload.coverage[0],
            compatible_aliases: ["hero.form", "faq.accordion"],
            selected_aliases: ["hero.form", "faq.accordion"],
          },
          { ...structuralPayload.coverage[1], status: "missing", compatible_aliases: [], selected_aliases: [], reason: "Sem modulo.", impact: "Cobertura indisponivel." },
        ],
      });
      assert.equal(oneToMany.ok, true);
      if (!oneToMany.ok) return;
      assert.deepEqual(oneToMany.value.recommendations.map((item) => [item.moduleKey, item.priority, item.recommendedOrder]), [
        ["faq", "P2", 10],
        ["hero", "P2", 20],
      ]);

      const manyToOne = validate({
        coverage: structuralPayload.coverage.map((item) => ({
          ...item,
          compatible_aliases: ["hero.form"],
          selected_aliases: ["hero.form"],
        })),
      });
      assert.equal(manyToOne.ok, true);
      if (!manyToOne.ok) return;
      assert.deepEqual(manyToOne.value.recommendations, [
        { moduleKey: "hero", moduleVersion: 1, variantKey: "hero.form", variantVersion: 1, priority: "P1", recommendedOrder: 10 },
      ]);

      const tiedResearch = {
        ...structuralResearch,
        endCustomer: {
          ...structuralResearch.endCustomer,
          researches: structuralResearch.endCustomer.researches.map((parent) => ({
            ...parent,
            items: parent.items.map((item) => ({ ...item, sortOrder: 2 })),
          })),
        },
      };
      const firstOccurrenceTie = validate({
        coverage: [
          { ...structuralPayload.coverage[0], compatible_aliases: ["hero.form"], selected_aliases: ["hero.form"] },
          { ...structuralPayload.coverage[1], compatible_aliases: ["faq.accordion"], selected_aliases: ["faq.accordion"] },
        ],
      }, tiedResearch);
      assert.equal(firstOccurrenceTie.ok, true);
      if (!firstOccurrenceTie.ok) return;
      assert.deepEqual(firstOccurrenceTie.value.recommendations.map((item) => item.moduleKey), ["hero", "faq"]);
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
    name: "Responses API request is compact structural stateless tool-free and bounded",
    run: () => {
      const request = buildGenerationProfileResponsesRequest({
        model: GENERATION_PROFILE_MODEL,
        reasoningEffort: GENERATION_PROFILE_REASONING_EFFORT,
        research: structuralResearch,
        moduleIdentities: listLandingPageModuleIdentities(),
        moduleSelectionCatalog: listLandingPageModuleSelectionCatalog(),
        requestKind: "creation",
        activeBaseline: null,
        currentCandidate: null,
      });
      assert.equal(request.ok, true);
      assert.equal(request.body.store, false);
      assert.equal(request.body.max_output_tokens, 2000);
      assert.match(request.body.input[0].content[0].text, /selected_aliases/);
      assert.match(request.body.input[0].content[0].text, /module_catalog/);
      assert.equal(Object.hasOwn(request.body, "tools"), false);
      assert.equal(request.body.text.format.strict, true);
      assert.equal(request.body.text.format.schema.additionalProperties, false);
      assert.equal(Object.hasOwn(request.body, "previous_response_id"), false);
      const input = JSON.parse(request.body.input[1].content[0].text);
      assert.equal(Object.hasOwn(input, "taxon_id"), false);
      assert.equal(Object.hasOwn(input, "current_editor"), false);
      assert.equal(Object.hasOwn(input, "previous_active_profile"), false);
      assert.equal(input.active_baseline, null);
      assert.equal(Object.hasOwn(input, "raw_research"), false);
      assert.deepEqual(input.research.business_buyer.lp_sections, [{ coverage_id: BUYER_COVERAGE_ID, text: "FAQ comercial" }]);
      assert.deepEqual(input.research.end_customer.lp_sections, [{ coverage_id: CUSTOMER_COVERAGE_ID, text: "Hero de conversao" }]);
      assert.deepEqual(input.research.business_buyer.strategic_core, ["Estratégia do comprador"]);
      assert.deepEqual(input.research.business_buyer.lp_overview, ["Visão da LP para o comprador"]);
      assert.deepEqual(input.research.business_buyer.seo, ["SEO do comprador"]);
      assert.equal(Object.hasOwn(input, "identity_aliases"), false);
      const heroCatalog = input.module_catalog.find((module: { module_alias: string }) => module.module_alias === "hero");
      assert.deepEqual(heroCatalog, {
        module_alias: "hero",
        purpose: "Present the primary proposition and lead to the priority route.",
        variants: [
          { alias: "hero.standard", capabilities: ["primary_action", "image_asset"], interactions: [] },
          { alias: "hero.form", capabilities: ["primary_action", "image_asset", "embedded_form"], interactions: ["form"] },
        ],
      });
      assert.equal(JSON.stringify(input.module_catalog).includes("moduleVersion"), false);
      assert.equal(JSON.stringify(input.module_catalog).includes("fieldContract"), false);
      assert.equal(request.bytes < 96 * 1024, true);
      assert.deepEqual(request.body.text.format.schema.required, ["coverage"]);
      const itemSchemas = request.body.text.format.schema.properties.coverage.items.anyOf;
      assert.equal(itemSchemas.length, 3);
      assert.deepEqual(itemSchemas[0].required, ["coverage_id", "status", "compatible_aliases", "selected_aliases"]);
      assert.deepEqual(itemSchemas[1].required, ["coverage_id", "status", "compatible_aliases", "selected_aliases", "reason", "impact"]);
      assert.deepEqual(itemSchemas[2].required, ["coverage_id", "status", "compatible_aliases", "selected_aliases", "reason", "impact"]);
      assert.deepEqual(itemSchemas.map((schema) => schema.properties.status.enum), [["covered"], ["partial"], ["missing"]]);
      assert.equal("minItems" in itemSchemas[0].properties.compatible_aliases ? itemSchemas[0].properties.compatible_aliases.minItems : undefined, 1);
      assert.equal("minItems" in itemSchemas[0].properties.selected_aliases ? itemSchemas[0].properties.selected_aliases.minItems : undefined, 1);
      assert.equal("minItems" in itemSchemas[1].properties.compatible_aliases ? itemSchemas[1].properties.compatible_aliases.minItems : undefined, 1);
      assert.equal("minItems" in itemSchemas[1].properties.selected_aliases ? itemSchemas[1].properties.selected_aliases.minItems : undefined, 1);
      assert.equal("maxItems" in itemSchemas[2].properties.compatible_aliases ? itemSchemas[2].properties.compatible_aliases.maxItems : undefined, 0);
      assert.equal("maxItems" in itemSchemas[2].properties.selected_aliases ? itemSchemas[2].properties.selected_aliases.maxItems : undefined, 0);
      const prompt = request.body.input[0].content[0].text;
      assert.match(prompt, /covered = compatíveis > 0 e escolhidas > 0/);
      assert.match(prompt, /partial = compatíveis > 0 e escolhidas > 0/);
      assert.match(prompt, /missing = compatíveis = 0 e escolhidas = 0/);
      assert.match(prompt, /Preservar uma identidade quando continuar adequada é válido/);
      assert.equal(Object.hasOwn(request.body.text.format.schema.properties, "recommendations"), false);
      const oversized = buildGenerationProfileResponsesRequest({
        model: GENERATION_PROFILE_MODEL,
        reasoningEffort: GENERATION_PROFILE_REASONING_EFFORT,
        research: structuralResearch,
        moduleIdentities: listLandingPageModuleIdentities(),
        moduleSelectionCatalog: listLandingPageModuleSelectionCatalog(),
        requestKind: "creation",
        activeBaseline: null,
        currentCandidate: null,
        humanFeedback: "x".repeat(100_000),
      });
      assert.equal(oversized.ok, false);
    },
  },
  {
    name: "creation and evolution expose structural baseline candidate and latest feedback only",
    run: () => {
      const initial = buildGenerationProfileResponsesRequest({
        model: GENERATION_PROFILE_MODEL,
        reasoningEffort: GENERATION_PROFILE_REASONING_EFFORT,
        research: structuralResearch,
        moduleIdentities: listLandingPageModuleIdentities(),
        moduleSelectionCatalog: listLandingPageModuleSelectionCatalog(),
        requestKind: "creation",
        activeBaseline: null,
        currentCandidate: null,
      });
      const initialInput = JSON.parse(initial.body.input[1].content[0].text);
      assert.equal(initialInput.request_kind, "creation");
      assert.equal(initialInput.human_feedback, null);

      const currentEditor = {
        generationGuidance: validProfile.generationGuidance,
        recommendations: validProfile.items.map(({ id: _id, ...item }) => item),
      };
      const evolution = buildGenerationProfileResponsesRequest({
        model: GENERATION_PROFILE_MODEL,
        reasoningEffort: GENERATION_PROFILE_REASONING_EFFORT,
        research: structuralResearch,
        moduleIdentities: listLandingPageModuleIdentities(),
        moduleSelectionCatalog: listLandingPageModuleSelectionCatalog(),
        requestKind: "evolution",
        activeBaseline: currentEditor.recommendations,
        currentCandidate: null,
        humanFeedback: "",
      });
      const evolutionInput = JSON.parse(evolution.body.input[1].content[0].text);
      assert.equal(evolutionInput.request_kind, "evolution");
      assert.equal(Object.hasOwn(evolutionInput, "current_editor"), false);
      assert.equal(Object.hasOwn(evolutionInput, "previous_active_profile"), false);
      assert.deepEqual(evolutionInput.active_baseline, currentEditor.recommendations.map((item) => ({
        alias: item.variantKey ?? item.moduleKey,
        priority: item.priority,
        order: item.recommendedOrder,
      })));
      assert.equal(Object.hasOwn(evolutionInput.active_baseline[0], "itemGuidance"), false);
      assert.equal(Object.hasOwn(evolutionInput.active_baseline[0], "moduleVersion"), false);
      assert.equal(evolutionInput.human_feedback, null);

      const validated = validateGenerationProfileProviderPayload({ payload: structuralPayload, research: structuralResearch, moduleIdentities: listLandingPageModuleIdentities(), currentEditor });
      assert.equal(validated.ok, true);
      if (!validated.ok) return;
      assert.deepEqual(validated.value.recommendations.find((item) => item.moduleKey === "hero"), {
        moduleKey: "hero",
        moduleVersion: 1,
        variantKey: "hero.form",
        variantVersion: 1,
        priority: "P1",
        recommendedOrder: 10,
      });
      const candidate = { ...validated.value, researchVersions: structuralResearch.versions, requestId: "50000000-0000-4000-8000-000000000010" };
      assert.equal(normalizeGenerationProfileCandidate(candidate).ok, true);
      assert.equal(normalizeGenerationProfileCandidate({ ...candidate, generationGuidance: "Nao autorizado" }).ok, false);
      assert.equal(normalizeGenerationProfileCandidate({ ...candidate, recommendations: [{ ...candidate.recommendations[0], itemGuidance: "Nao autorizado" }] }).ok, false);
      assert.equal(normalizeGenerationProfileCandidate({ ...candidate, fingerprint: "a".repeat(64) }).ok, false);
      assert.equal(normalizeGenerationProfileCandidate({
        ...candidate,
        coverage: candidate.coverage.map((item, index) => index === 0 ? {
          ...item,
          compatibleIdentities: [{ moduleKey: "invented", moduleVersion: 1 }],
        } : item),
      }).ok, false);
      assert.equal(normalizeGenerationProfileCandidate({
        ...candidate,
        coverage: candidate.coverage.map((item, index) => index === 0 ? {
          ...item,
          selectedIdentities: [{ moduleKey: "hero", moduleVersion: 1 }],
        } : item),
      }).ok, false);
      assert.equal(normalizeGenerationProfileCandidate({
        ...candidate,
        coverage: candidate.coverage.map((item, index) => index === 0 ? {
          ...item,
          selectedIdentities: [],
        } : item),
      }).ok, false);
      assert.equal(normalizeGenerationProfileCandidate({
        ...candidate,
        coverage: candidate.coverage.map((item, index) => index === 0 ? {
          ...item,
          reason: "Nao permitido para covered.",
          impact: "Nao permitido para covered.",
        } : item),
      }).ok, false);
      const nextRound = buildGenerationProfileResponsesRequest({
        model: GENERATION_PROFILE_MODEL,
        reasoningEffort: GENERATION_PROFILE_REASONING_EFFORT,
        research: structuralResearch,
        moduleIdentities: listLandingPageModuleIdentities(),
        moduleSelectionCatalog: listLandingPageModuleSelectionCatalog(),
        requestKind: "evolution",
        activeBaseline: currentEditor.recommendations,
        currentCandidate: candidate,
        humanFeedback: "Refine novamente.",
      });
      const nextRoundInput = JSON.parse(nextRound.body.input[1].content[0].text);
      assert.deepEqual(nextRoundInput.active_baseline, evolutionInput.active_baseline);
      assert.deepEqual(nextRoundInput.current_candidate.coverage[0].compatible_aliases, ["faq.accordion"]);
      assert.deepEqual(nextRoundInput.current_candidate.coverage[0].selected_aliases, ["faq.accordion"]);
      assert.equal(Object.hasOwn(nextRoundInput.current_candidate, "recommendations"), false);
      assert.equal(nextRoundInput.human_feedback, "Refine novamente.");
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
      const validated = validateGenerationProfileProviderPayload({ payload: structuralPayload, research: structuralResearch, moduleIdentities: listLandingPageModuleIdentities(), currentEditor });
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
      assert.deepEqual(received.candidate.diff.recommendations, [
        { moduleKey: "faq", status: "added", changes: [] },
        { moduleKey: "hero", status: "kept", changes: [] },
      ]);
      assert.deepEqual(findGenerationProfileReplacements({
        editor: currentEditor,
        recommendations: [{ moduleKey: "faq", moduleVersion: 1, variantKey: "faq.accordion", variantVersion: 1, priority: "P1", recommendedOrder: 10 }],
      }), [{ fromModuleKey: "hero", toModuleKey: "faq", recommendedOrder: 10 }]);
      assert.deepEqual(findGenerationProfileReplacements({
        editor: {
          generationGuidance: currentEditor.generationGuidance,
          recommendations: [
            { moduleKey: "hero", moduleVersion: 1, variantKey: "hero.form", variantVersion: 1, priority: "P1", recommendedOrder: 10 },
            { moduleKey: "faq", moduleVersion: 1, variantKey: "faq.accordion", variantVersion: 1, priority: "P2", recommendedOrder: 20 },
          ],
        },
        recommendations: [
          { moduleKey: "hero", moduleVersion: 1, variantKey: "hero.form", variantVersion: 1, priority: "P1", recommendedOrder: 20 },
          { moduleKey: "faq", moduleVersion: 1, variantKey: "faq.accordion", variantVersion: 1, priority: "P2", recommendedOrder: 10 },
        ],
      }), []);

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
    name: "invalid provider payload metadata is safely allowlisted without runtime cost",
    run: () => {
      const invalid = validateGenerationProfileProviderPayload({
        payload: { ...structuralPayload, coverage: structuralPayload.coverage.slice(1) },
        research: structuralResearch,
        moduleIdentities: listLandingPageModuleIdentities(),
      });
      assert.equal(invalid.ok, false);
      if (invalid.ok) return;
      assert.equal(invalid.reason, "coverage_items_mismatch");

      const unsafeInput = {
        validationReason: invalid.reason,
        responseId: "resp_invalid_123",
        inputTokens: 20856,
        outputTokens: 4000,
        coverageDiagnostic: {
          coverageId: BUYER_COVERAGE_ID,
          coverageStatus: "covered" as const,
          compatibleAliasCount: 0,
          selectedAliasCount: 1,
          coverageIndex: 0,
        },
        payload: "sensitive candidate content",
        research: "raw research must not cross the boundary",
      } as const;
      const metadata = buildGenerationProfileInvalidDataMetadata(unsafeInput);
      assert.deepEqual(metadata, {
        validationReason: "coverage_items_mismatch",
        coverageId: BUYER_COVERAGE_ID,
        coverageStatus: "covered",
        compatibleAliasCount: 0,
        selectedAliasCount: 1,
        coverageIndex: 0,
        responseId: "resp_invalid_123",
        inputTokens: 20856,
        outputTokens: 4000,
      });
      assert.deepEqual(Object.keys(metadata).sort(), [
        "compatibleAliasCount",
        "coverageId",
        "coverageIndex",
        "coverageStatus",
        "inputTokens",
        "outputTokens",
        "responseId",
        "selectedAliasCount",
        "validationReason",
      ]);
    },
  },
  {
    name: "incomplete response metadata is allowlisted nullable and independent from partial output",
    run: () => {
      const completeMetadata = normalizeGenerationProfileIncompleteMetadata({
        id: "resp_incomplete_123",
        status: "incomplete",
        incomplete_details: { reason: "future_provider_reason" },
        usage: { input_tokens: 20856, output_tokens: 2000, total_tokens: 22856 },
        output: [{ content: [{ type: "output_text", text: "partial sensitive content" }] }],
        recommendations: [{ module_key: "invented" }],
        current_candidate: { secret: "must not cross the boundary" },
      });
      assert.deepEqual(completeMetadata, {
        incompleteReason: "future_provider_reason",
        responseId: "resp_incomplete_123",
        inputTokens: 20856,
        outputTokens: 2000,
      });
      assert.deepEqual(Object.keys(completeMetadata).sort(), ["incompleteReason", "inputTokens", "outputTokens", "responseId"]);

      const nullUsageMetadata = normalizeGenerationProfileIncompleteMetadata({
        id: "resp_null_usage",
        status: "incomplete",
        incomplete_details: { reason: "max_output_tokens" },
        usage: null,
      });
      assert.deepEqual(nullUsageMetadata, {
        incompleteReason: "max_output_tokens",
        responseId: "resp_null_usage",
        inputTokens: null,
        outputTokens: null,
      });

      const missingUsageMetadata = normalizeGenerationProfileIncompleteMetadata({
        status: "incomplete",
        incomplete_details: { reason: "unknown_but_valid_reason" },
      });
      assert.deepEqual(missingUsageMetadata, {
        incompleteReason: "unknown_but_valid_reason",
        responseId: null,
        inputTokens: null,
        outputTokens: null,
      });

      const partialUsageMetadata = normalizeGenerationProfileIncompleteMetadata({
        status: "incomplete",
        incomplete_details: { reason: "max_output_tokens" },
        usage: { input_tokens: 20856 },
      });
      assert.equal(partialUsageMetadata.inputTokens, 20856);
      assert.equal(partialUsageMetadata.outputTokens, null);

      assert.deepEqual(normalizeGenerationProfileIncompleteMetadata({
        id: 123,
        incomplete_details: { reason: " " },
        usage: { input_tokens: -1, output_tokens: 1.5 },
      }), {
        incompleteReason: null,
        responseId: null,
        inputTokens: null,
        outputTokens: null,
      });
    },
  },
  {
    name: "provider request uses resolved model and effort and emits normalized usage",
    run: async () => {
      let requestBody: Record<string, unknown> | null = null;
      const events: OpenAiWorkloadEvent[] = [];
      const providerInput = {
        model: GENERATION_PROFILE_MODEL,
        reasoningEffort: GENERATION_PROFILE_REASONING_EFFORT,
        research: structuralResearch,
        moduleIdentities: listLandingPageModuleIdentities(),
        moduleSelectionCatalog: listLandingPageModuleSelectionCatalog(),
        requestKind: "creation" as const,
        activeBaseline: null,
        currentCandidate: null,
      };
      const result = await requestGenerationProfileProposal(providerInput, {
        apiKey: "test-key",
        fetchImpl: async (_url, init) => {
          requestBody = JSON.parse(String(init?.body));
          return new Response(JSON.stringify({
            id: "resp_profile_123",
            usage: {
              input_tokens: 120,
              input_tokens_details: { cached_tokens: 80 },
              output_tokens: 35,
              output_tokens_details: { reasoning_tokens: 5 },
              total_tokens: -1,
            },
            output: [{
              content: [{ type: "output_text", text: JSON.stringify(structuralPayload) }],
            }],
          }), { status: 200, headers: { "Content-Type": "application/json" } });
        },
        emitEvent: (event) => events.push(event),
        now: (() => {
          let current = 100;
          return () => (current += 12);
        })(),
      });

      assert.equal(result.ok, true);
      const capturedRequest = requestBody as unknown as Record<string, unknown>;
      assert.equal(capturedRequest.model, GENERATION_PROFILE_MODEL);
      assert.deepEqual(capturedRequest.reasoning, { effort: GENERATION_PROFILE_REASONING_EFFORT });
      assert.equal(events.length, 1);
      assert.deepEqual(events[0], {
        workload: "landing_page_generation_profile_proposal",
        apiKind: "responses_text",
        attemptId: null,
        requestId: null,
        promptVersion: null,
        contractVersion: null,
        environment: "unknown",
        configurationSource: "repo_catalog",
        configurationRevision: "v2",
        model: GENERATION_PROFILE_MODEL,
        reasoningEffort: GENERATION_PROFILE_REASONING_EFFORT,
        responseId: "resp_profile_123",
        result: "success",
        failureCategory: null,
        latencyMs: 12,
        inputTokens: 120,
        cachedInputTokens: 80,
        cacheWriteTokens: null,
        outputTokens: 35,
        reasoningTokens: 5,
        totalTokens: null,
      });

      let transportCalls = 0;
      const invalidEvents: OpenAiWorkloadEvent[] = [];
      const invalid = await requestGenerationProfileProposal(providerInput, {
        apiKey: "",
        fetchImpl: async () => {
          transportCalls += 1;
          return new Response();
        },
        emitEvent: (event) => invalidEvents.push(event),
      });
      assert.equal(invalid.ok, false);
      assert.equal(transportCalls, 0);
      assert.equal(invalidEvents[0]?.result, "failure");
      assert.equal(invalidEvents[0]?.failureCategory, "configuration_invalid");
      assert.equal(invalidEvents[0]?.latencyMs, null);
    },
  },
  {
    name: "provider failures and availability fail closed",
    run: () => {
      assert.equal(mapProviderFailureToProposalError("refusal"), "technical_failure");
      assert.equal(mapProviderFailureToProposalError("incomplete"), "technical_failure");
      assert.equal(mapProviderFailureToProposalError("timeout"), "technical_failure");
      assert.equal(mapProviderFailureToProposalError("request_too_large"), "invalid_data");
      assert.equal(isGenerationProfileAssistanceConfigured({ apiKey: "" }), false);
      assert.equal(isGenerationProfileAssistanceConfigured({ apiKey: "test-key" }), true);
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
