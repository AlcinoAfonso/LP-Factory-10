import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

import {
  realEstateBrokerNicheTaxon,
  realEstateSegmentTaxon,
  resolveLandingPageInputCatalog,
  type LandingPageInputValueType,
} from "../conversion-content/landing-page/input-catalog";
import type { TaxonPreparationResult } from "../conversion-content/landing-page/taxon-preparation";
import { compileLandingPageGenerationContextForDraftWithDependencies } from "./adapters/generationContextAdapterCore";
import { resolveAccountLandingPageOnboardingRevalidationAuthority } from "./adapters/onboardingConfigurationAdapterCore";
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
  name: "LP Cenário E",
  slug: "lp-cenario-e",
  status: "draft",
};

const configuration = buildConfiguration();
const authoritativeValues = { business_display_name: "Conta legítima" };
const revalidationAuthority = {
  historicalConfiguration: configuration,
  currentPlanKey: configuration.planKey,
  currentTaxonChain: configuration.taxonChain,
  currentAuthoritativeValues: authoritativeValues,
};
const preparation = buildPreparation();

const cases: readonly Readonly<{ name: string; run: () => void | Promise<void> }>[] = [
  {
    name: "contract v3 exposes integral research and distinct historical and effective versions",
    run: () => {
      const result = compileLandingPageGenerationContext({
        landingPage,
        revalidationAuthority,
        preparation,
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
        taxonChain: {
          segment: realEstateSegmentTaxon,
          niche: realEstateBrokerNicheTaxon,
        },
        historicalConfigurationCatalogVersion: 2,
        effectiveInputCatalogVersion: 4,
        configurationRevision: 7,
        rootVersion: 1,
        endCustomerResearchVersion: 1,
      });
      assert.equal(
        result.value.modelContext.research.content,
        preparation.value.research.content,
      );
      assert.equal(
        Object.hasOwn(result.value.modelContext.research, "relativePath"),
        false,
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
    name: "E19.2 boundary preserves later current authority through target revalidation",
    run: () => {
      const laterFieldKeys = new Set([
        "primary_service_or_offer",
        "primary_service_or_offer_description",
        "brand_color_palette",
      ]);
      const historicalStoredValues = Object.fromEntries(
        Object.entries(configuration.storedValues).filter(
          ([fieldKey]) => !laterFieldKeys.has(fieldKey),
        ),
      ) as AccountLandingPageOnboardingStoredValues;
      const boundary = resolveAccountLandingPageOnboardingRevalidationAuthority({
        accountId: ACCOUNT_ID,
        landingPageId: LANDING_PAGE_ID,
        historicalCatalogVersion: 1,
        revision: 7,
        currentPlanKey: "starter",
        currentTaxonChain: configuration.taxonChain,
        historicalStoredValues,
        currentAuthoritativeValues: {
          business_display_name: "Conta atual pela autoridade E19.2",
          primary_service_or_offer:
            configuration.storedValues.primary_service_or_offer.value,
          primary_service_or_offer_description:
            configuration.storedValues.primary_service_or_offer_description.value,
          brand_color_palette:
            configuration.storedValues.brand_color_palette.value,
        },
      });

      assert.equal(boundary.ok, true);
      assert.equal(
        boundary.authority.historicalConfiguration.fields.some(
          (state) => state.field.fieldKey === "brand_color_palette",
        ),
        false,
      );
      assert.equal(boundary.authority.historicalConfiguration.complete, true);
      assert.deepEqual(
        boundary.authority.currentAuthoritativeValues.brand_color_palette,
        configuration.storedValues.brand_color_palette.value,
      );

      const result = compileLandingPageGenerationContext({
        landingPage,
        revalidationAuthority: boundary.authority,
        preparation,
      });

      assert.equal(result.ok, true);
      const businessDisplayName = result.value.modelContext.facts.find(
        (fact) => fact.fieldKey === "business_display_name",
      );
      assert.deepEqual(businessDisplayName, {
        fieldKey: "business_display_name",
        purpose: businessDisplayName?.purpose,
        valueType: "string",
        value: "Conta atual pela autoridade E19.2",
        source: "authoritative",
        provenance: businessDisplayName?.provenance,
      });
      const brandColorPalette = result.value.serverContext.facts.find(
        (fact) => fact.fieldKey === "brand_color_palette",
      );
      assert.equal(brandColorPalette?.source, "authoritative");
      assert.deepEqual(
        brandColorPalette?.value,
        boundary.authority.currentAuthoritativeValues.brand_color_palette,
      );
    },
  },
  {
    name: "every applicable current field is classified only by canonical valueType",
    run: () => {
      assert.equal(configuration.fields.length, 23);
      const everyStoredValues = Object.fromEntries(
        configuration.fields
          .filter((state) => state.field.fieldKey !== "business_display_name")
          .map((state) => [
            state.field.fieldKey,
            {
              scope: state.field.valueScope,
              value: sampleValue(state.field.valueType, state.field.validation),
            },
          ]),
      ) as AccountLandingPageOnboardingStoredValues;
      const everyFieldResolution = resolveAccountLandingPageOnboardingConfiguration({
        accountId: ACCOUNT_ID,
        landingPageId: LANDING_PAGE_ID,
        catalogVersion: 2,
        revision: 7,
        planKey: "starter",
        taxonChain: {
          segment: realEstateSegmentTaxon,
          niche: realEstateBrokerNicheTaxon,
        },
        storedValues: everyStoredValues,
        authoritativeValues: { business_display_name: "Conta legítima" },
      });
      assert.equal(everyFieldResolution.ok, true);
      if (!everyFieldResolution.ok) {
        throw new Error("Expected all-field configuration to resolve");
      }
      const everyFieldConfiguration = everyFieldResolution.configuration;
      const result = compileLandingPageGenerationContext({
        landingPage,
        revalidationAuthority: {
          ...revalidationAuthority,
          historicalConfiguration: everyFieldConfiguration,
        },
        preparation,
      });
      assert.equal(result.ok, true);
      const allFacts = [
        ...result.value.modelContext.facts,
        ...result.value.serverContext.facts,
      ];
      const applicableFieldCount = everyFieldConfiguration.fields.filter(
        (state) => state.applicable && state.source !== "missing",
      ).length;
      assert.equal(allFacts.length, applicableFieldCount);
      assert.equal(
        new Set(allFacts.map((fact) => fact.fieldKey)).size,
        applicableFieldCount,
      );
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
      const missingOptionalStoredValues = Object.fromEntries(
        Object.entries(configuration.storedValues).filter(
          ([fieldKey]) => fieldKey !== "financing_support_available",
        ),
      ) as AccountLandingPageOnboardingStoredValues;
      const missingOptionalResolution = resolveAccountLandingPageOnboardingConfiguration({
        accountId: ACCOUNT_ID,
        landingPageId: LANDING_PAGE_ID,
        catalogVersion: 2,
        revision: 7,
        planKey: "starter",
        taxonChain: {
          segment: realEstateSegmentTaxon,
          niche: realEstateBrokerNicheTaxon,
        },
        storedValues: missingOptionalStoredValues,
        authoritativeValues: { business_display_name: "Conta legítima" },
      });
      assert.equal(missingOptionalResolution.ok, true);
      if (!missingOptionalResolution.ok) {
        throw new Error("Expected configuration with optional missing fact");
      }
      const missingOptionalConfiguration = missingOptionalResolution.configuration;
      const result = compileLandingPageGenerationContext({
        landingPage,
        revalidationAuthority: {
          ...revalidationAuthority,
          historicalConfiguration: missingOptionalConfiguration,
        },
        preparation,
      });
      assert.equal(result.ok, true);
      assert.equal(
        result.value.modelContext.facts.some(
          (fact) => fact.fieldKey === "financing_support_available",
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
          input: {
            landingPage: { ...landingPage, account_id: "other" },
            revalidationAuthority,
            preparation,
          },
        },
        {
          expected: "CONFIGURATION_NOT_BOUND",
          input: {
            landingPage,
            revalidationAuthority: {
              ...revalidationAuthority,
              historicalConfiguration: {
                ...configuration,
                landingPageId: null,
              },
            },
            preparation,
          },
        },
        {
          expected: "CONFIGURATION_INCOMPLETE",
          input: {
            landingPage,
            revalidationAuthority: {
              ...revalidationAuthority,
              historicalConfiguration: {
                ...configuration,
                complete: false,
              },
            },
            preparation,
          },
        },
        {
          expected: "CONFIGURATION_REVALIDATION_REQUIRED",
          input: {
            landingPage,
            revalidationAuthority: {
              ...revalidationAuthority,
              historicalConfiguration: {
                ...configuration,
                storedValues: {
                  ...configuration.storedValues,
                  transaction_intent: {
                    scope: "landing_page",
                    value: "invalid-intent",
                  },
                },
              },
            },
            preparation,
          },
        },
        {
          expected: "TAXON_PREPARATION_UNAVAILABLE",
          input: {
            landingPage,
            revalidationAuthority,
            preparation: {
              ok: false,
              error: { code: "FILESYSTEM_READ_FAILED", message: "safe fixture" },
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
        loadRevalidationAuthority: async () => {
          dependencyCalls.push("revalidation-authority");
          return {
            ok: true as const,
            authority: revalidationAuthority,
          };
        },
        loadLandingPage: async () => {
          dependencyCalls.push("landing-page");
          return { ok: true as const, landingPage };
        },
        loadPreparation: async () => {
          dependencyCalls.push("preparation");
          return preparation;
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
          requestId: "req-e19-3-e",
        },
        { ...dependencies, log: (payload) => logs.push(payload) },
      );
      assert.equal(result.ok, true);
      assert.deepEqual(dependencyCalls, [
        "revalidation-authority",
        "landing-page",
        "preparation",
      ]);
      assert.deepEqual(logs[0], {
        event: "landing_page_generation_context_compilation",
        result: "success",
        reason: "compiled",
        request_id: "req-e19-3-e",
        latency_ms: 1,
      });
      assert.equal(Object.hasOwn(logs[0], "preparation_reason"), false);

      dependencyCalls.length = 0;
      logs.length = 0;
      const withoutRequestId =
        await compileLandingPageGenerationContextForDraftWithDependencies(
          { accountId: ACCOUNT_ID, landingPageId: LANDING_PAGE_ID },
          { ...dependencies, log: (payload) => logs.push(payload) },
        );
      assert.equal(withoutRequestId.ok, true);
      assert.deepEqual(dependencyCalls, [
        "revalidation-authority",
        "landing-page",
        "preparation",
      ]);
      assert.equal(Object.hasOwn(logs[0], "request_id"), false);
      assert.equal(Object.hasOwn(logs[0], "preparation_reason"), false);

      dependencyCalls.length = 0;
      logs.length = 0;
      const preparationFailureMessage = "must-not-enter-generation-context-log";
      const preparationFailurePayload = "must-not-enter-log-payload";
      const failedPreparation =
        await compileLandingPageGenerationContextForDraftWithDependencies(
          { accountId: ACCOUNT_ID, landingPageId: LANDING_PAGE_ID },
          {
            ...dependencies,
            loadPreparation: async () => {
              dependencyCalls.push("preparation");
              return {
                ok: false as const,
                error: {
                  code: "FILESYSTEM_READ_FAILED" as const,
                  message: preparationFailureMessage,
                  payload: preparationFailurePayload,
                },
              };
            },
            log: (payload) => logs.push(payload),
          },
        );
      assert.equal(failedPreparation.ok, false);
      if (!failedPreparation.ok) {
        assert.equal(failedPreparation.error.code, "TAXON_PREPARATION_UNAVAILABLE");
      }
      assert.deepEqual(dependencyCalls, [
        "revalidation-authority",
        "landing-page",
        "preparation",
      ]);
      assert.deepEqual(logs[0], {
        event: "landing_page_generation_context_compilation",
        result: "failure",
        reason: "TAXON_PREPARATION_UNAVAILABLE",
        preparation_reason: "FILESYSTEM_READ_FAILED",
        latency_ms: 1,
      });
      assert.doesNotMatch(
        JSON.stringify(logs[0]),
        new RegExp(`${preparationFailureMessage}|${preparationFailurePayload}`),
      );

      dependencyCalls.length = 0;
      const invalidRequestId =
        await compileLandingPageGenerationContextForDraftWithDependencies(
          {
            accountId: ACCOUNT_ID,
            landingPageId: LANDING_PAGE_ID,
            requestId: "invalid request id",
          },
          { ...dependencies, log: () => undefined },
        );
      assert.equal(invalidRequestId.ok, false);
      if (!invalidRequestId.ok) {
        assert.equal(invalidRequestId.error.code, "INVALID_INPUT");
      }
      assert.deepEqual(dependencyCalls, []);

      const unauthorizedCalls: string[] = [];
      const unauthorizedLogs: Readonly<Record<string, unknown>>[] = [];
      const unauthorized =
        await compileLandingPageGenerationContextForDraftWithDependencies(
          { accountId: ACCOUNT_ID, landingPageId: LANDING_PAGE_ID },
          {
            loadRevalidationAuthority: async () => ({
              ok: false,
              error: "commercial_entitlement_required",
            }),
            loadLandingPage: async () => {
              unauthorizedCalls.push("landing-page");
              return { ok: true, landingPage };
            },
            loadPreparation: async () => {
              unauthorizedCalls.push("preparation");
              return preparation;
            },
            log: (payload) => unauthorizedLogs.push(payload),
          },
        );
      assert.equal(unauthorized.ok, false);
      assert.equal(unauthorized.error.code, "ACCOUNT_CONTEXT_UNAUTHORIZED");
      assert.deepEqual(unauthorizedCalls, []);
      assert.equal(
        Object.hasOwn(unauthorizedLogs[0], "preparation_reason"),
        false,
      );
    },
  },
  {
    name: "E19.3 compiler boundary stays independent from downstream E19.4 runtime",
    run: () => {
      const compilerSource = readFileSync(
        new URL("./generationContext.ts", import.meta.url),
        "utf8",
      );
      const boundaryCoreSource = readFileSync(
        new URL("./adapters/generationContextAdapterCore.ts", import.meta.url),
        "utf8",
      );
      assert.doesNotMatch(
        compilerSource,
        /research-resolution|module-catalog|generation-profile|copySourceMap|prioritizedSources|funnelCopyProfiles|generationGuidance|itemGuidance/,
      );
      assert.doesNotMatch(
        boundaryCoreSource,
        /research-resolution|loadResearch|Stripe|OpenAI|GenerationProfile|loadGenerationProfile/,
      );
      for (const relativePath of [
        "../../app/a/[account]/landing-page-actions.ts",
        "../../app/a/[account]/_components/LandingPageDraftJourney.tsx",
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

function buildPreparation(): Extract<TaxonPreparationResult, { ok: true }> {
  return {
    ok: true,
    value: {
      prepared: true,
      taxonId: TAXON_ID,
      taxonSlug: realEstateBrokerNicheTaxon.slug,
      selectedResearchVersion: 1,
      reviewedInputCatalogVersion: 4,
      requiredInputCatalogVersion: 4,
      research: {
        taxonSlug: realEstateBrokerNicheTaxon.slug,
        audienceScope: "end_customer",
        researchVersion: 1,
        relativePath: "corretor-imoveis/end_customer/v1.md",
        content: "# Pesquisa integral\n\nConteúdo integral autorizado.\n\n## Fontes\n\n- Fonte factual.",
      },
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
      return {
        minimum:
          validation.kind === "number_range"
            ? validation.minimum ?? 0
            : 0,
        maximum:
          validation.kind === "number_range"
            ? validation.maximum ?? validation.minimum ?? 0
            : 0,
        currency: "BRL",
      };
    case "keyword_map":
      return [
        {
          keyword_or_cluster: "termo principal",
          message_anchor: "mensagem factual",
        },
      ];
    case "asset_reference":
      return { asset_id: "asset-canonico" };
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
