import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

import {
  realEstateBrokerNicheTaxon,
  realEstateSegmentTaxon,
  resolveLandingPageInputCatalog,
  type LandingPageInputValueType,
} from "../conversion-content/landing-page/input-catalog";
import type { TaxonPreparationResult } from "../conversion-content/landing-page/taxon-preparation";
import {
  compileLandingPageGenerationContextForDraftWithDependencies,
  compileLegacyLandingPageGenerationContextForDraftWithDependencies,
} from "./adapters/generationContextAdapterCore";
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
  sharedRevision: 11,
  sharedCatalogVersion: 6,
  landingPageRevision: 13,
  landingPageCatalogVersion: 6,
};
const preparation = buildPreparation();

const cases: readonly Readonly<{ name: string; run: () => void | Promise<void> }>[] = [
  {
    name: "contract v4 exposes integral research and operational residence provenance",
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
        sharedCatalogVersion: 6,
        landingPageCatalogVersion: 6,
        effectiveInputCatalogVersion: 6,
        sharedRevision: 11,
        landingPageRevision: 13,
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
    name: "expand compatibility accepts active and keeps archived fail-closed",
    run: () => {
      const activeResult = compileLandingPageGenerationContext({
        landingPage: { ...landingPage, status: "active" },
        revalidationAuthority,
        preparation,
      });
      assert.equal(activeResult.ok, true);
      if (!activeResult.ok) throw new Error("Expected active compatibility");
      assert.equal(
        activeResult.value.identities.landingPage.status,
        "active",
      );

      const archivedResult = compileLandingPageGenerationContext({
        landingPage: { ...landingPage, status: "archived" },
        revalidationAuthority,
        preparation,
      });
      assert.equal(archivedResult.ok, false);
      if (archivedResult.ok) throw new Error("Expected archived rejection");
      assert.equal(archivedResult.error.code, "LANDING_PAGE_NOT_DRAFT");
    },
  },
  {
    name: "E19.2 boundary preserves later current authority through target revalidation",
    run: () => {
      const laterFieldKeys = new Set([
        "landing_page_offering_scope",
        "landing_page_offering_scope_description",
        "brand_color_palette",
        "business_offerings_summary",
        "primary_conversion_goal",
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
          landing_page_offering_scope:
            configuration.storedValues.landing_page_offering_scope.value,
          landing_page_offering_scope_description:
            configuration.storedValues.landing_page_offering_scope_description.value,
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

      assert.equal(result.ok, false);
      assert.equal(result.error.code, "CONFIGURATION_REVALIDATION_REQUIRED");
    },
  },
  {
    name: "every applicable current field is classified only by canonical valueType",
    run: () => {
      assert.equal(configuration.fields.length, 25);
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
        catalogVersion: 6,
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
        "offering_scope",
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
        catalogVersion: 6,
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
      const preparedTaxonIds: string[] = [];
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
        loadPreparation: async ({ taxonId }: { taxonId: string }) => {
          dependencyCalls.push("preparation");
          preparedTaxonIds.push(taxonId);
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
      assert.deepEqual(preparedTaxonIds, [TAXON_ID]);
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
      assert.deepEqual(preparedTaxonIds, [TAXON_ID, TAXON_ID]);
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
      logs.length = 0;
      const incompatibleCatalog =
        await compileLandingPageGenerationContextForDraftWithDependencies(
          { accountId: ACCOUNT_ID, landingPageId: LANDING_PAGE_ID },
          {
            ...dependencies,
            loadPreparation: async ({ taxonId }: { taxonId: string }) => {
              dependencyCalls.push("preparation");
              preparedTaxonIds.push(taxonId);
              return {
                ok: false as const,
                error: {
                  code: "INPUT_CATALOG_REVIEW_VERSION_MISMATCH" as const,
                  message: "Reviewed input catalog version does not match v5.",
                },
              };
            },
            log: (payload) => logs.push(payload),
          },
        );
      assert.equal(incompatibleCatalog.ok, false);
      if (!incompatibleCatalog.ok) {
        assert.equal(incompatibleCatalog.error.code, "INPUT_CATALOG_INCOMPATIBLE");
      }
      assert.deepEqual(dependencyCalls, [
        "revalidation-authority",
        "landing-page",
        "preparation",
      ]);
      assert.equal(preparedTaxonIds.at(-1), TAXON_ID);
      assert.equal(
        logs[0]?.preparation_reason,
        "INPUT_CATALOG_REVIEW_VERSION_MISMATCH",
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
    name: "gate-off boundary preserves the E19.4 context v3 path without E19.5 residences",
    run: async () => {
      const calls: string[] = [];
      const legacyAuthority = {
        historicalConfiguration: revalidationAuthority.historicalConfiguration,
        currentPlanKey: revalidationAuthority.currentPlanKey,
        currentTaxonChain: revalidationAuthority.currentTaxonChain,
        currentAuthoritativeValues: revalidationAuthority.currentAuthoritativeValues,
      };
      const original = JSON.stringify({ legacyAuthority, landingPage, preparation });
      const result =
        await compileLegacyLandingPageGenerationContextForDraftWithDependencies(
          { accountId: ACCOUNT_ID, landingPageId: LANDING_PAGE_ID },
          {
            loadRevalidationAuthority: async ({ accountId }) => {
              calls.push(`authority:${accountId}`);
              return { ok: true, authority: legacyAuthority };
            },
            loadLandingPage: async () => {
              calls.push("landing-page");
              return { ok: true, landingPage };
            },
            loadPreparation: async ({ taxonId }) => {
              calls.push(`preparation:${taxonId}`);
              return preparation;
            },
            log: () => undefined,
          },
        );
      assert.equal(result.ok, true);
      if (!result.ok) return;
      assert.equal(result.value.contractVersion, 3);
      if (result.value.contractVersion !== 3) throw new Error("Expected legacy context");
      const operational = compileLandingPageGenerationContext({
        landingPage,
        revalidationAuthority,
        preparation,
      });
      assert.equal(operational.ok, true);
      if (!operational.ok || operational.value.contractVersion !== 4) throw new Error("Expected operational context");
      assert.deepEqual(result.value.modelContext, operational.value.modelContext);
      assert.deepEqual(result.value.serverContext, operational.value.serverContext);
      const { sharedCatalogVersion: _sharedCatalog, landingPageCatalogVersion: _pageCatalog,
        sharedRevision: _sharedRevision, landingPageRevision: _pageRevision, ...commonIdentity } = operational.value.identities;
      assert.deepEqual(result.value.identities, {
        ...commonIdentity,
        historicalConfigurationCatalogVersion: legacyAuthority.historicalConfiguration.catalogVersion,
        configurationRevision: legacyAuthority.historicalConfiguration.revision,
      });
      assert.equal(JSON.stringify({ legacyAuthority, landingPage, preparation }), original);
      assert.equal(
        Object.hasOwn(result.value.identities, "landingPageRevision"),
        false,
      );
      assert.deepEqual(calls, [
        `authority:${ACCOUNT_ID}`,
        "landing-page",
        `preparation:${TAXON_ID}`,
      ]);
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
        /research-resolution|loadResearch|Stripe|OpenAI|GenerationProfile|loadGenerationProfile|landingPagePreview/,
      );
      assert.doesNotMatch(compilerSource, /landingPagePreview/);
      for (const relativePath of [
        "../../app/a/[account]/landing-page-actions.ts",
        "../../app/a/[account]/_components/LandingPageDraftJourney.tsx",
        "./landingPageMaterialization.ts",
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
    landing_page_offering_scope: {
      mode: "single",
      offerings: ["Consultoria imobiliária"],
    },
    landing_page_offering_scope_description: "Apoio factual na compra de imóveis",
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
    primary_conversion_goal: "contact",
    financing_support_available: true,
    document_support_available: true,
    creci_registration: "CRECI 12345",
  };
  const catalog = resolveLandingPageInputCatalog({
    version: 6,
    plan: "starter",
    taxonChain: {
      segment: realEstateSegmentTaxon,
      niche: realEstateBrokerNicheTaxon,
    },
  });
  assert.equal(catalog.ok, true);
  assert.equal(catalog.value.fields.length, 25);
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
    catalogVersion: 6,
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
      reviewedInputCatalogVersion: 6,
      requiredInputCatalogVersion: 6,
      effectiveInputCatalogVersion: 6,
      transitionClassification: "no_material_change",
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
    case "offering_scope":
      return { mode: "single", offerings: ["Oferta livre"] };
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
