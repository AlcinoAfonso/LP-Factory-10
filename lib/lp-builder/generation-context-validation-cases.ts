import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  realEstateBrokerNicheTaxon,
  realEstateSegmentTaxon,
  resolveLandingPageInputCatalog,
} from "../conversion-content/landing-page/input-catalog";
import type { LandingPageResearchResolutionResult } from "../conversion-content/landing-page/research-resolution";
import type { ResolveLandingPageGenerationProfileResult } from "../conversion-content/landing-page/generation-profile";
import { compileLandingPageGenerationContextForDraftWithDependencies } from "./adapters/generationContextAdapterCore";
import type {
  AccountLandingPage,
  AccountLandingPageOnboardingConfiguration,
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
  name: "LP deterministica",
  slug: "lp-deterministica",
  status: "draft",
};

const configuration = buildConfiguration();
const research = buildResearch();
const generationProfile = buildGenerationProfile();

const cases: readonly Readonly<{ name: string; run: () => void | Promise<void> }>[] = [
  {
    name: "complete package selects every eligible recommendation and tracks legitimate omissions",
    run: () => {
      const result = compileLandingPageGenerationContext({
        landingPage,
        configuration,
        research,
        generationProfile,
      });
      assert.equal(result.ok, true);
      assert.equal(result.value.contractVersion, LANDING_PAGE_GENERATION_CONTEXT_CONTRACT_VERSION);
      assert.equal(result.value.partA.versions.valuesInputCatalogVersion, 2);
      assert.equal(result.value.partA.versions.bindingInputCatalogVersion, 3);
      assert.equal(result.value.partA.root.rootVersion, 1);
      assert.equal(result.value.partA.root.resolvedPresetKey.length > 0, true);
      assert.deepEqual(
        result.value.partA.selection.map((item) => [
          item.recommendation.moduleKey,
          item.recommendation.priority,
          item.recommendation.recommendedOrder,
          item.decision,
        ]),
        [
          ["hero", "P1", 10, "selected"],
          ["trust_bar", "P1", 20, "selected"],
          ["lead_capture", "P1", 30, "omitted"],
          ["problem_solution", "P1", 40, "selected"],
          ["offer", "P1", 50, "selected"],
          ["process", "P1", 60, "selected"],
          ["social_proof", "P1", 70, "omitted"],
          ["technical_assurance", "P1", 80, "selected"],
          ["faq", "P1", 90, "selected"],
          ["benefits", "P2", 100, "selected"],
          ["final_cta", "P1", 110, "selected"],
        ],
      );
      assert.deepEqual(result.value.partB.capabilitySupport, [
        {
          slotKey: "applicable_capabilities",
          fieldKeys: [
            "financing_support_available",
            "document_support_available",
          ],
        },
      ]);
      assert.equal(
        result.value.partB.facts.some((fact) => fact.fieldKey === "whatsapp_destination"),
        true,
      );
      assert.deepEqual(
        result.value.partB.research.endCustomer.researches.flatMap((parent) =>
          parent.items.map((item) => item.itemKey),
        ),
        ["trigger"],
      );
      assert.deepEqual(result.value.partB.research.businessBuyer.researches, []);
      assert.equal(Object.isFrozen(result.value), true);
      assert.equal(Object.isFrozen(result), true);
      assert.equal(Object.isFrozen(result.value.partA.modules[0].fieldContract.fields), true);
      assert.throws(() => {
        (result.value.partA.selection as unknown[]).push({});
      }, TypeError);
    },
  },
  {
    name: "false capability booleans provide no support without making benefits ineligible",
    run: () => {
      const result = compileLandingPageGenerationContext({
        landingPage,
        configuration: buildConfiguration({
          financing_support_available: false,
          document_support_available: false,
        }),
        research,
        generationProfile,
      });
      assert.equal(result.ok, true);
      assert.deepEqual(result.value.partB.capabilitySupport, []);
      assert.equal(
        result.value.partA.modules.some((selectedModule) => selectedModule.module.moduleKey === "benefits"),
        true,
      );
    },
  },
  {
    name: "one eligible alternative is selected and multiple alternatives remain ambiguous",
    run: () => {
      assert.equal(generationProfile.ok, true);
      assert.equal(generationProfile.value.kind, "resolved");
      const hero = generationProfile.value.recommendations[0];
      const fallback = compileLandingPageGenerationContext({
        landingPage,
        configuration,
        research,
        generationProfile: {
          ok: true,
          value: {
            ...generationProfile.value,
            recommendations: [
              { ...hero, variantKey: "hero.form", variantVersion: 1 },
            ],
          },
        },
      });
      assert.equal(fallback.ok, true);
      assert.equal(fallback.value.partA.selection[0].cause, "single_eligible_alternative");
      assert.equal(fallback.value.partA.selection[0].effectiveVariantKey, "hero.standard");

      const faq = generationProfile.value.recommendations.find(
        (item) => item.moduleKey === "faq",
      );
      assert.ok(faq);
      const {
        variantKey: _variantKey,
        variantVersion: _variantVersion,
        ...faqWithoutPreference
      } = faq;
      const ambiguous = compileLandingPageGenerationContext({
        landingPage,
        configuration,
        research,
        generationProfile: {
          ok: true,
          value: {
            ...generationProfile.value,
            recommendations: [faqWithoutPreference],
          },
        },
      });
      assert.equal(ambiguous.ok, false);
      assert.equal(ambiguous.error.code, "MODULE_VARIANT_AMBIGUOUS");
    },
  },
  {
    name: "profile absence and profile read failure remain distinct without partial package",
    run: () => {
      const absent = compileLandingPageGenerationContext({
        landingPage,
        configuration,
        research,
        generationProfile: {
          ok: true,
          value: { kind: "absent", servedTaxonId: TAXON_ID },
        },
      });
      assert.equal(absent.ok, false);
      assert.equal(absent.error.code, "GENERATION_PROFILE_ABSENT");
      assert.equal(Object.isFrozen(absent), true);
      assert.equal(Object.hasOwn(absent, "partA"), false);
      assert.equal(Object.hasOwn(absent, "partB"), false);

      const readFailed = compileLandingPageGenerationContext({
        landingPage,
        configuration,
        research,
        generationProfile: {
          ok: false,
          error: { code: "READ_FAILED", message: "safe fixture" },
        },
      });
      assert.equal(readFailed.ok, false);
      assert.equal(readFailed.error.code, "GENERATION_PROFILE_READ_FAILED");

      assert.equal(generationProfile.ok, true);
      assert.equal(generationProfile.value.kind, "resolved");
      const {
        generationGuidance: _generationGuidance,
        ...profileWithoutCurrentGuidance
      } = generationProfile.value;
      const withoutCurrentGuidance = compileLandingPageGenerationContext({
        landingPage,
        configuration,
        research,
        generationProfile: { ok: true, value: profileWithoutCurrentGuidance },
      });
      assert.equal(withoutCurrentGuidance.ok, false);
      assert.equal(withoutCurrentGuidance.error.code, "GENERATION_PROFILE_INVALID");
    },
  },
  {
    name: "binding compatibility and draft binding fail closed",
    run: () => {
      const incompatible: AccountLandingPageOnboardingConfiguration = {
        ...configuration,
        fields: configuration.fields.map((state, index) =>
          index === 0
            ? { ...state, field: { ...state.field, purpose: "divergent" } }
            : state,
        ),
      };
      const incompatibleResult = compileLandingPageGenerationContext({
        landingPage,
        configuration: incompatible,
        research,
        generationProfile,
      });
      assert.equal(incompatibleResult.ok, false);
      assert.equal(incompatibleResult.error.code, "BINDING_CATALOG_INCOMPATIBLE");

      const unbound = compileLandingPageGenerationContext({
        landingPage,
        configuration: { ...configuration, landingPageId: null },
        research,
        generationProfile,
      });
      assert.equal(unbound.ok, false);
      assert.equal(unbound.error.code, "CONFIGURATION_NOT_BOUND");
    },
  },
  {
    name: "malformed runtime inputs return a frozen invalid-input failure",
    run: async () => {
      for (const malformed of [null, {}, { landingPage: null }]) {
        const compiled = compileLandingPageGenerationContext(malformed);
        assert.equal(compiled.ok, false);
        assert.equal(compiled.error.code, "INVALID_INPUT");
        assert.equal(Object.isFrozen(compiled), true);
      }
      const boundary = await compileLandingPageGenerationContextForDraftWithDependencies(
        null,
        {
          loadConfiguration: async () => ({ ok: true, configuration }),
          loadLandingPage: async () => ({ ok: true, landingPage }),
          loadResearch: async () => research,
          loadGenerationProfile: async () => generationProfile,
          log: () => undefined,
          now: () => 1,
        },
      );
      assert.equal(boundary.ok, false);
      assert.equal(boundary.error.code, "INVALID_INPUT");
      assert.equal(Object.isFrozen(boundary), true);
    },
  },
  {
    name: "server boundary emits only safe outcome metadata and logger failure is inert",
    run: async () => {
      const logs: Readonly<Record<string, unknown>>[] = [];
      const dependencies = {
        loadConfiguration: async () => ({ ok: true as const, configuration }),
        loadLandingPage: async () => ({ ok: true as const, landingPage }),
        loadResearch: async () => research,
        loadGenerationProfile: async () => generationProfile,
        now: (() => {
          let value = 100;
          return () => value++;
        })(),
      };
      const input = {
        accountId: ACCOUNT_ID,
        landingPageId: LANDING_PAGE_ID,
        requestId: "req-e19-3",
      };
      const result = await compileLandingPageGenerationContextForDraftWithDependencies(
        input,
        { ...dependencies, log: (payload) => logs.push(payload) },
      );
      assert.equal(result.ok, true);
      assert.deepEqual(Object.keys(logs[0]).sort(), [
        "event",
        "latency_ms",
        "reason",
        "request_id",
        "result",
      ]);
      assert.deepEqual(logs[0], {
        event: "landing_page_generation_context_compilation",
        result: "success",
        reason: "compiled",
        request_id: "req-e19-3",
        latency_ms: 1,
      });
      const withBrokenLogger = await compileLandingPageGenerationContextForDraftWithDependencies(
        input,
        {
          ...dependencies,
          log: () => {
            throw new Error("logger unavailable");
          },
        },
      );
      assert.deepEqual(withBrokenLogger, result);

      const failureLogs: Readonly<Record<string, unknown>>[] = [];
      const failureDependencies = {
        ...dependencies,
        loadConfiguration: async () => ({
          ok: false as const,
          error: "membership_inactive" as const,
        }),
      };
      const failed = await compileLandingPageGenerationContextForDraftWithDependencies(
        input,
        { ...failureDependencies, log: (payload) => failureLogs.push(payload) },
      );
      assert.equal(failed.ok, false);
      assert.equal(failed.error.code, "ACCOUNT_CONTEXT_UNAUTHORIZED");
      assert.deepEqual(Object.keys(failureLogs[0]).sort(), [
        "event",
        "latency_ms",
        "reason",
        "request_id",
        "result",
      ]);
      assert.equal(failureLogs[0].result, "failure");
      assert.equal(failureLogs[0].reason, "ACCOUNT_CONTEXT_UNAUTHORIZED");
      const failedWithBrokenLogger = await compileLandingPageGenerationContextForDraftWithDependencies(
        input,
        {
          ...failureDependencies,
          log: () => {
            throw new Error("logger unavailable");
          },
        },
      );
      assert.deepEqual(failedWithBrokenLogger, failed);
    },
  },
  {
    name: "pure compiler and public boundary preserve the approved dependencies",
    run: () => {
      const compilerSource = readFileSync(new URL("./generationContext.ts", import.meta.url), "utf8");
      const boundaryCoreSource = readFileSync(
        new URL("./adapters/generationContextAdapterCore.ts", import.meta.url),
        "utf8",
      );
      const publicIndexSource = readFileSync(new URL("./index.ts", import.meta.url), "utf8");
      assert.equal(
        /supabase|DBRow|[\\/](?:registry|schema)|from\s+["'][^"']*auth/i.test(compilerSource),
        false,
      );
      assert.equal(/supabase|DBRow|from\s+["'][^"']*auth/i.test(boundaryCoreSource), false);
      assert.equal(publicIndexSource.includes("compileLandingPageGenerationContext"), true);
      assert.equal(publicIndexSource.includes("compileLandingPageGenerationContextForDraft"), true);
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

function buildConfiguration(
  overrides: Readonly<Record<string, unknown>> = {},
): AccountLandingPageOnboardingConfiguration {
  const values: Readonly<Record<string, unknown>> = {
    primary_service_or_offer: "Consultoria imobiliaria",
    primary_service_or_offer_description: "Apoio factual na compra de imoveis",
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
    service_locations: ["Sao Paulo"],
    transaction_intent: "buy",
    financing_support_available: true,
    document_support_available: true,
    creci_registration: "CRECI 12345",
    ...overrides,
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
  const storedValues = Object.fromEntries(
    Object.entries(values).map(([fieldKey, value]) => {
      const field = catalog.value.fields.find((candidate) => candidate.fieldKey === fieldKey);
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
    authoritativeValues: { business_display_name: "Conta legitima" },
  });
  assert.equal(result.ok, true);
  assert.equal(result.configuration.complete, true);
  return result.configuration;
}

function buildResearch(): LandingPageResearchResolutionResult {
  const audience = (audienceScope: "business_buyer" | "end_customer") => ({
    audienceScope,
    sourceTaxonId: TAXON_ID,
    sourceRelation: "own" as const,
    version: 1,
    researches: [
      {
        researchId: audienceScope === "end_customer" ? "research-end" : "research-business",
        researchBlock: "strategic_core" as const,
        audienceScope,
        version: 1,
        sourceTaxonId: TAXON_ID,
        items: [
          {
            itemId: `${audienceScope}-trigger`,
            researchId: audienceScope === "end_customer" ? "research-end" : "research-business",
            itemKey: "trigger",
            itemText: "Contexto autorizado",
            priority: 1,
            sortOrder: 1,
            servedTaxonId: TAXON_ID,
            sourceTaxonId: TAXON_ID,
            sourceRelation: "own" as const,
            audienceScope,
            researchVersion: 1,
          },
          {
            itemId: `${audienceScope}-unrelated`,
            researchId: audienceScope === "end_customer" ? "research-end" : "research-business",
            itemKey: "unrelated",
            itemText: "Nao autorizado pelos contratos selecionados",
            priority: 2,
            sortOrder: 2,
            servedTaxonId: TAXON_ID,
            sourceTaxonId: TAXON_ID,
            sourceRelation: "own" as const,
            audienceScope,
            researchVersion: 1,
          },
        ],
      },
    ],
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

function buildGenerationProfile(): ResolveLandingPageGenerationProfileResult {
  const recommendations = [
    ["hero", "hero.standard", "P1", 10],
    ["trust_bar", "trust_bar.standard", "P1", 20],
    ["lead_capture", "lead_capture.form", "P1", 30],
    ["problem_solution", "problem_solution.standard", "P1", 40],
    ["offer", "offer.standard", "P1", 50],
    ["process", "process.standard", "P1", 60],
    ["social_proof", "social_proof.standard", "P1", 70],
    ["technical_assurance", "technical_assurance.standard", "P1", 80],
    ["faq", "faq.standard", "P1", 90],
    ["benefits", "benefits.standard", "P2", 100],
    ["final_cta", "final_cta.standard", "P1", 110],
  ] as const;
  return {
    ok: true,
    value: {
      kind: "resolved",
      servedTaxonId: TAXON_ID,
      ownerTaxonId: TAXON_ID,
      profileId: "c211015e-d9c6-4241-a29a-7cd41e93b8fc",
      profileVersion: 1,
      relation: "own",
      generationGuidance: "Use somente o contexto autorizado.",
      recommendations: recommendations.map(
        ([moduleKey, variantKey, priority, recommendedOrder], index) => ({
          id: `recommendation-${index + 1}`,
          moduleKey,
          moduleVersion: 1,
          variantKey,
          variantVersion: 1,
          priority,
          recommendedOrder,
        }),
      ),
    },
  };
}
