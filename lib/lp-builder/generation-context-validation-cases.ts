import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

import {
  realEstateBrokerNicheTaxon,
  realEstateSegmentTaxon,
  resolveLandingPageInputCatalog,
  type LandingPageInputValueType,
} from "../conversion-content/landing-page/input-catalog";
import type {
  LandingPageResearchResolutionResult,
  ResolvedLandingPageResearchAudience,
} from "../conversion-content/landing-page/research-resolution";
import { compileLandingPageGenerationContextForDraftWithDependencies } from "./adapters/generationContextAdapterCore";
import type {
  AccountLandingPage,
  AccountLandingPageOnboardingConfiguration,
  AccountLandingPageOnboardingFieldState,
  AccountLandingPageOnboardingStoredValues,
} from "./contracts";
import { compileLandingPageGenerationContext } from "./generationContext";
import { LANDING_PAGE_GENERATION_CONTEXT_CONTRACT_VERSION } from "./generationContextContracts";
import { resolveAccountLandingPageOnboardingConfiguration } from "./onboardingConfiguration";

const ACCOUNT_ID = "6ecaf813-957e-4f2b-9ea7-3f2cb204a603";
const LANDING_PAGE_ID = "4d91020a-07e5-4bf9-a1aa-272bbc0366ff";
const TAXON_ID = realEstateBrokerNicheTaxon.id;

const landingPage: AccountLandingPage = {
  id: LANDING_PAGE_ID,
  account_id: ACCOUNT_ID,
  name: "LP Cenário D",
  slug: "lp-cenario-d",
  status: "draft",
};

const configuration = buildConfiguration();
const research = buildResearch();

const cases: readonly Readonly<{ name: string; run: () => void | Promise<void> }>[] = [
  {
    name: "contract v2 exposes only identities, modelContext and serverContext",
    run: () => {
      const result = compileLandingPageGenerationContext({
        landingPage,
        configuration,
        research,
      });
      assert.equal(result.ok, true);
      assert.equal(
        result.value.contractVersion,
        LANDING_PAGE_GENERATION_CONTEXT_CONTRACT_VERSION,
      );
      assert.deepEqual(Object.keys(result.value).sort(), [
        "contractVersion",
        "identities",
        "modelContext",
        "serverContext",
      ]);
      assert.deepEqual(result.value.identities, {
        accountId: ACCOUNT_ID,
        landingPage: { id: LANDING_PAGE_ID, status: "draft" },
        planKey: "starter",
        servedTaxon: realEstateBrokerNicheTaxon,
        catalogVersion: 2,
        configurationRevision: 7,
        rootVersion: 1,
        endCustomerResearchVersion: 1,
      });
      assert.deepEqual(
        result.value.modelContext.research.researches.map(
          (parent) => parent.researchBlock,
        ),
        ["strategic_core", "lp_overview", "lp_sections", "seo"],
      );
      assert.equal(
        result.value.modelContext.research.researches.every(
          (parent) => parent.items.length === 2,
        ),
        true,
      );
      assert.equal(
        JSON.stringify(result.value.modelContext).includes("business_buyer"),
        false,
      );
      assert.equal(
        result.value.modelContext.facts.some(
          (fact) => fact.fieldKey === "primary_conversion_channel",
        ),
        true,
      );
      assert.equal(
        result.value.modelContext.facts.some(
          (fact) => fact.fieldKey === "whatsapp_destination",
        ),
        false,
      );
      assert.equal(
        result.value.serverContext.facts.some(
          (fact) => fact.fieldKey === "whatsapp_destination",
        ),
        true,
      );
      assert.equal(
        result.value.serverContext.facts.some(
          (fact) => fact.fieldKey === "brand_color_palette",
        ),
        true,
      );
      const creci = result.value.modelContext.facts.find(
        (fact) => fact.fieldKey === "creci_registration",
      );
      assert.ok(creci);
      assert.equal(Object.hasOwn(creci, "verified"), false);
      assert.equal(Object.hasOwn(creci, "evidence"), false);
      assert.equal(Object.isFrozen(result), true);
      assert.equal(Object.isFrozen(result.value.modelContext.research), true);
      assert.equal(Object.isFrozen(result.value.serverContext.facts), true);
      assert.throws(() => {
        (result.value.modelContext.facts as unknown[]).push({});
      }, TypeError);
    },
  },
  {
    name: "all 23 current fields are classified only by canonical valueType",
    run: () => {
      assert.equal(configuration.fields.length, 23);
      const everyFieldConfiguration: AccountLandingPageOnboardingConfiguration = {
        ...configuration,
        fields: configuration.fields.map((state) => ({
          ...state,
          applicable: true,
          source: "configuration" as const,
          value: sampleValue(state.field.valueType, state.field.validation),
        })),
      };
      const result = compileLandingPageGenerationContext({
        landingPage,
        configuration: everyFieldConfiguration,
        research,
      });
      assert.equal(result.ok, true);
      const allFacts = [
        ...result.value.modelContext.facts,
        ...result.value.serverContext.facts,
      ];
      assert.equal(allFacts.length, 23);
      assert.equal(new Set(allFacts.map((fact) => fact.fieldKey)).size, 23);
      const modelTypes = new Set([
        "string",
        "enum",
        "string_list",
        "boolean",
        "number_range",
        "keyword_map",
      ]);
      assert.equal(
        result.value.modelContext.facts.every((fact) =>
          modelTypes.has(fact.valueType),
        ),
        true,
      );
      const serverTypes = new Set([
        "phone",
        "email",
        "url",
        "asset_reference",
        "color_palette",
      ]);
      assert.equal(
        result.value.serverContext.facts.every((fact) =>
          serverTypes.has(fact.valueType),
        ),
        true,
      );
    },
  },
  {
    name: "missing facts remain absent and operational values never leak to modelContext",
    run: () => {
      const missingCreclConfiguration: AccountLandingPageOnboardingConfiguration = {
        ...configuration,
        fields: configuration.fields.map((state) =>
          state.field.fieldKey === "creci_registration"
            ? { ...state, source: "missing" as const, value: undefined }
            : state,
        ),
      };
      const result = compileLandingPageGenerationContext({
        landingPage,
        configuration: missingCreclConfiguration,
        research,
      });
      assert.equal(result.ok, true);
      assert.equal(
        result.value.modelContext.facts.some(
          (fact) => fact.fieldKey === "creci_registration",
        ),
        false,
      );
      assert.equal(
        JSON.stringify(result.value.modelContext).includes("+5511999999999"),
        false,
      );
    },
  },
  {
    name: "canonical authority failures fail closed without a partial package",
    run: () => {
      const scenarios = [
        {
          expected: "LANDING_PAGE_NOT_DRAFT",
          input: { landingPage: { ...landingPage, account_id: "other" }, configuration, research },
        },
        {
          expected: "CONFIGURATION_NOT_BOUND",
          input: { landingPage, configuration: { ...configuration, landingPageId: null }, research },
        },
        {
          expected: "CONFIGURATION_INCOMPLETE",
          input: { landingPage, configuration: { ...configuration, complete: false }, research },
        },
        {
          expected: "INPUT_CATALOG_INCOMPATIBLE",
          input: { landingPage, configuration: { ...configuration, catalogVersion: 3 }, research },
        },
        {
          expected: "RESEARCH_UNAVAILABLE",
          input: {
            landingPage,
            configuration,
            research: {
              ok: false,
              error: { code: "READ_FAILED", message: "safe fixture" },
            },
          },
        },
      ] as const;
      for (const scenario of scenarios) {
        const result = compileLandingPageGenerationContext(scenario.input);
        assert.equal(result.ok, false);
        assert.equal(result.error.code, scenario.expected);
        assert.equal(Object.hasOwn(result, "value"), false);
      }
    },
  },
  {
    name: "server boundary authorizes first and logs only safe outcome metadata",
    run: async () => {
      const logs: Readonly<Record<string, unknown>>[] = [];
      const dependencyCalls: string[] = [];
      const dependencies = {
        loadConfiguration: async () => {
          dependencyCalls.push("configuration");
          return { ok: true as const, configuration };
        },
        loadLandingPage: async () => {
          dependencyCalls.push("landing-page");
          return { ok: true as const, landingPage };
        },
        loadResearch: async () => {
          dependencyCalls.push("research");
          return research;
        },
        now: (() => {
          let value = 100;
          return () => value++;
        })(),
      };
      const result = await compileLandingPageGenerationContextForDraftWithDependencies(
        {
          accountId: ACCOUNT_ID,
          landingPageId: LANDING_PAGE_ID,
          requestId: "req-e19-3-d",
        },
        { ...dependencies, log: (payload) => logs.push(payload) },
      );
      assert.equal(result.ok, true);
      assert.deepEqual(dependencyCalls, [
        "configuration",
        "landing-page",
        "research",
      ]);
      assert.deepEqual(logs[0], {
        event: "landing_page_generation_context_compilation",
        result: "success",
        reason: "compiled",
        request_id: "req-e19-3-d",
        latency_ms: 1,
      });

      const unauthorizedCalls: string[] = [];
      const unauthorized =
        await compileLandingPageGenerationContextForDraftWithDependencies(
          { accountId: ACCOUNT_ID, landingPageId: LANDING_PAGE_ID },
          {
            loadConfiguration: async () => ({
              ok: false,
              error: "commercial_entitlement_required",
            }),
            loadLandingPage: async () => {
              unauthorizedCalls.push("landing-page");
              return { ok: true, landingPage };
            },
            loadResearch: async () => {
              unauthorizedCalls.push("research");
              return research;
            },
            log: () => undefined,
          },
        );
      assert.equal(unauthorized.ok, false);
      assert.equal(unauthorized.error.code, "ACCOUNT_CONTEXT_UNAUTHORIZED");
      assert.deepEqual(unauthorizedCalls, []);
    },
  },
  {
    name: "public boundary has no E18.5, E20.3, Stripe or E19.4 runtime dependency",
    run: () => {
      const compilerSource = readFileSync(
        new URL("./generationContext.ts", import.meta.url),
        "utf8",
      );
      const boundaryCoreSource = readFileSync(
        new URL("./adapters/generationContextAdapterCore.ts", import.meta.url),
        "utf8",
      );
      const publicIndexSource = readFileSync(
        new URL("./index.ts", import.meta.url),
        "utf8",
      );
      assert.doesNotMatch(
        compilerSource,
        /module-catalog|generation-profile|copySourceMap|prioritizedSources|funnelCopyProfiles|generationGuidance|itemGuidance/,
      );
      assert.doesNotMatch(
        boundaryCoreSource,
        /Stripe|OpenAI|GenerationProfile|loadGenerationProfile/,
      );
      assert.doesNotMatch(
        publicIndexSource,
        /generateLandingPageDraftCandidate|materializeFirstLandingPageDraft|getLandingPageDraftExperienceState|landingPageGenerationContracts|landingPageMaterializationContracts/,
      );
      for (const relativePath of [
        "../../app/a/[account]/landing-page-actions.ts",
        "../../app/a/[account]/_components/LandingPageDraftJourney.tsx",
        "../../app/a/[account]/landing-pages/[landingPageId]/preview/page.tsx",
        "./landingPageGeneration.ts",
        "./landingPageMaterialization.ts",
        "./landingPagePreview.ts",
      ]) {
        assert.equal(existsSync(new URL(relativePath, import.meta.url)), false);
      }
    },
  },
];

void runCases();

async function runCases(): Promise<void> {
  for (const validationCase of cases) {
    await validationCase.run();
    console.log(`ok - ${validationCase.name}`);
  }
}

function buildConfiguration(): AccountLandingPageOnboardingConfiguration {
  const values: Readonly<Record<string, unknown>> = {
    primary_service_or_offer: "Consultoria imobiliária",
    primary_service_or_offer_description: "Apoio factual na compra de imóveis",
    brand_color_palette: {
      primary: "#000000",
      secondary: "#111111",
      accent: "#222222",
      background: "#FFFFFF",
      text: "#000000",
    },
    funnel_stage: "bofu",
    primary_conversion_channel: "whatsapp",
    whatsapp_destination: "+5511999999999",
    service_locations: ["São Paulo"],
    transaction_intent: "buy",
    financing_support_available: true,
    document_support_available: true,
    creci_registration: "CRECI 12345",
  };
  const catalog = resolveLandingPageInputCatalog({
    version: 2,
    plan: "starter",
    taxonChain: {
      segment: realEstateSegmentTaxon,
      niche: realEstateBrokerNicheTaxon,
    },
  });
  assert.equal(catalog.ok, true);
  assert.equal(catalog.value.fields.length, 23);
  const storedValues = Object.fromEntries(
    Object.entries(values).map(([fieldKey, value]) => {
      const field = catalog.value.fields.find(
        (candidate) => candidate.fieldKey === fieldKey,
      );
      assert.ok(field);
      return [fieldKey, { scope: field.valueScope, value }];
    }),
  ) as AccountLandingPageOnboardingStoredValues;
  const result = resolveAccountLandingPageOnboardingConfiguration({
    accountId: ACCOUNT_ID,
    landingPageId: LANDING_PAGE_ID,
    catalogVersion: 2,
    revision: 7,
    planKey: "starter",
    taxonChain: {
      segment: realEstateSegmentTaxon,
      niche: realEstateBrokerNicheTaxon,
    },
    storedValues,
    authoritativeValues: { business_display_name: "Conta legítima" },
  });
  assert.equal(result.ok, true);
  assert.equal(result.configuration.complete, true);
  return result.configuration;
}

function buildResearch(): LandingPageResearchResolutionResult {
  const audience = (
    audienceScope: "business_buyer" | "end_customer",
  ): ResolvedLandingPageResearchAudience => ({
    audienceScope,
    sourceTaxonId: TAXON_ID,
    sourceRelation: "own",
    version: 1,
    researches: [
      "strategic_core",
      "lp_overview",
      "lp_sections",
      "seo",
    ].map((researchBlock, blockIndex) => ({
      researchId: `${audienceScope}-${researchBlock}`,
      researchBlock: researchBlock as
        | "strategic_core"
        | "lp_overview"
        | "lp_sections"
        | "seo",
      audienceScope,
      version: 1,
      sourceTaxonId: TAXON_ID,
      items: [1, 2].map((position) => ({
        itemId: `${audienceScope}-${researchBlock}-${position}`,
        researchId: `${audienceScope}-${researchBlock}`,
        itemKey: `${researchBlock}_item_${position}`,
        itemText: `Contexto autorizado ${blockIndex + 1}.${position}`,
        priority: position,
        sortOrder: position,
        servedTaxonId: TAXON_ID,
        sourceTaxonId: TAXON_ID,
        sourceRelation: "own",
        audienceScope,
        researchVersion: 1,
      })),
    })),
  });
  return {
    ok: true,
    value: {
      servedTaxonId: TAXON_ID,
      endCustomer: audience("end_customer"),
      businessBuyer: audience("business_buyer"),
      versions: { endCustomer: 1, businessBuyer: 1 },
    },
  };
}

function sampleValue(
  valueType: LandingPageInputValueType,
  validation: AccountLandingPageOnboardingFieldState["field"]["validation"],
): unknown {
  switch (valueType) {
    case "string":
      return "valor";
    case "phone":
      return "+5511999999999";
    case "email":
      return "contato@example.com";
    case "url":
      return "https://example.com";
    case "enum":
      return validation.kind === "enum"
        ? validation.allowedValues[0]
        : "valor";
    case "string_list":
      return validation.kind === "string_list" && validation.allowedValues?.length
        ? [validation.allowedValues[0]]
        : ["valor"];
    case "boolean":
      return true;
    case "number_range":
      return { minimum: 100, maximum: 200, currency: "BRL" };
    case "keyword_map":
      return { principal: ["valor"] };
    case "asset_reference":
      return "brand/logo-primary";
    case "color_palette":
      return {
        primary: "#000000",
        secondary: "#111111",
        accent: "#222222",
        background: "#FFFFFF",
        text: "#000000",
      };
  }
}
