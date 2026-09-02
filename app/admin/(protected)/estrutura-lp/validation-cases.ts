import { validateLifecycleBoundedContracts } from "./lifecycle-validation-cases";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";

import { collectCompletePaginatedRows } from "../../../../lib/admin/adapters/adminInputCatalogLifecyclePagination";
import {
  countInvalidInputCatalogOperationalConfigurations,
  fingerprintInputCatalogOperationalContext,
  planPublishedInputCatalogReviewReconciliation,
  resolveInputCatalogOperationalAccountAuthorities,
  validatePublishedInputCatalogReviewEvidenceContext,
  type InputCatalogOperationalConfiguration,
} from "../../../../lib/admin/adapters/adminInputCatalogLifecycleValidation";
import {
  createNextLandingPageInputCatalogDraft,
  landingPageInputCatalogPlans,
  realEstateBrokerNicheTaxon,
  realEstateSegmentTaxon,
  validateLandingPageInputCatalogDraft,
  type LandingPageInputCatalogLayerEntry,
  type LandingPageInputCatalogRegistry,
  type LandingPageInputCatalogRegistryEntry,
} from "../../../../lib/conversion-content/landing-page/input-catalog";
import {
  deriveEffectiveTaxonPreparation,
  fingerprintInputCatalogEvaluationContextIdentity,
  type InputCatalogEvaluationContextIdentity,
} from "../../../../lib/conversion-content/landing-page/taxon-preparation";
import { resolveAccountLandingPageOnboardingConfiguration } from "../../../../lib/lp-builder/onboardingConfiguration";
import {
  isAccountLandingPageOperationalConfigurationCompatible,
  type AccountLandingPageOperationalCompatibilityInput,
} from "../../../../lib/lp-builder/operationalCompatibility";

const page = readFileSync(new URL("./page.tsx", import.meta.url), "utf8");
const adapter = readFileSync(
  new URL("../../../../lib/admin/adapters/adminLandingPageStructureAdapter.ts", import.meta.url),
  "utf8",
);
const lifecycleAdapter = readFileSync(
  new URL("../../../../lib/admin/adapters/adminInputCatalogLifecycleAdapter.ts", import.meta.url),
  "utf8",
);
const lifecycleContext = readFileSync(new URL("../../../../lib/admin/adapters/adminInputCatalogLifecycleContext.ts", import.meta.url), "utf8");
const lifecycleValidation = readFileSync(
  new URL("../../../../lib/admin/adapters/adminInputCatalogLifecycleValidation.ts", import.meta.url),
  "utf8",
);
const lifecycleComponent = readFileSync(
  new URL("./_components/AdminInputCatalogLifecycle.tsx", import.meta.url),
  "utf8",
);
const lifecycleActions = readFileSync(new URL("./actions.ts", import.meta.url), "utf8");
const lifecycleMigration = readFileSync(
  new URL("../../../../supabase/migrations/20260824180000_e20_2_8_input_catalog_lifecycle.sql", import.meta.url),
  "utf8",
);
const navigation = readFileSync(
  new URL("../../../../components/admin/adminNavigation.ts", import.meta.url),
  "utf8",
);
const taxonomyList = readFileSync(new URL("../taxonomia/page.tsx", import.meta.url), "utf8");
const taxonomyDetail = readFileSync(new URL("../taxonomia/[taxonId]/page.tsx", import.meta.url), "utf8");
const taxonomyAdapter = readFileSync(
  new URL("../../../../lib/admin/adapters/adminTaxonomyAdapter.ts", import.meta.url),
  "utf8",
);
const conversionIndex = readFileSync(
  new URL("../../../../lib/conversion-content/index.ts", import.meta.url),
  "utf8",
);
const packageJson = readFileSync(new URL("../../../../package.json", import.meta.url), "utf8");

assert.match(page, /allowedValues\.map\(inputOptionLabel\)/);
assert.match(page, /rent:\s*"Locação"/);
assert.match(page, /return labels\[value\] \?\? humanize\(value\)/);
assert.match(page, /offering_scope:\s*"Escopo de ofertas"/);
assert.match(page, /landing_page_offering_scope:\s*"Escopo comercial da landing page"/);
assert.doesNotMatch(page, /rent:\s*"rent"/);
assert.doesNotMatch(page, /Módulos e variantes|ModuleView|module-catalog/);
assert.doesNotMatch(adapter, /"modulos"|module-catalog|readModules/);
assert.doesNotMatch(page, /Pesquisas|ResearchView|ResearchAudience|research-resolution/);
assert.doesNotMatch(adapter, /"pesquisas"|readResearch|getAdminTaxonResearchPresentation|research-resolution/);
assert.match(adapter, /toInputCatalogTaxonIdentity/);
assert.doesNotMatch(adapter, /buildLandingPageInputCatalogTaxonChain\(selectedTaxon, taxonRead\.taxons\)/);
assert.doesNotMatch(navigation, /Módulos, variantes/);
assert.match(page, /parametros:\s*"Parâmetros"/);
assert.match(page, /entradas:\s*"Entradas"/);
assert.doesNotMatch(taxonomyList, /Pesquisa BB|Pesquisa EC|diagnostic\.(businessBuyer|endCustomer)/);
assert.doesNotMatch(taxonomyDetail, /Pesquisa BB|Pesquisa EC|diagnostic\.(businessBuyer|endCustomer)/);
assert.match(taxonomyDetail, /AdminTaxonResearchSelectionForm/);
assert.match(taxonomyDetail, /AdminTaxonInputCatalogReview/);
assert.doesNotMatch(taxonomyAdapter, /landingPageResearchAdapter|research-resolution|resolveLandingPageResearch|E10\.8/);
assert.match(taxonomyAdapter, /loadSelectedEndCustomerResearchFromClient/);
assert.match(taxonomyAdapter, /readAdminCommercialActivationOverview/);
assert.doesNotMatch(conversionIndex, /landingPageResearch|landingPageResearchAdapter|research-resolution/);
assert.doesNotMatch(packageJson, /validate:landing-page-research|research-resolution\/validation-cases/);
assert.match(packageJson, /validate:commercial-activation/);
assert.match(packageJson, /validate:taxon-preparation/);
assert.doesNotMatch(packageJson, /validate:lp-builder-generation-context/);
assert.match(page, /view === "entradas"[\s\S]*AdminInputCatalogLifecycle/);
assert.match(lifecycleAdapter, /CURRENT_LANDING_PAGE_INPUT_CATALOG_VERSION/);
assert.match(lifecycleContext, /account_landing_page_shared_configurations/);
assert.match(lifecycleContext, /account_landing_page_configurations/);
assert.match(lifecycleContext, /account_landing_page_onboarding_configurations/);
assert.match(lifecycleAdapter, /invalidOperationalConfigurations/);
assert.deepEqual(
  [...lifecycleValidation.matchAll(/from "(@\/lp-builder[^\"]*)"/g)].map((match) => match[1]),
  ["@/lp-builder/operationalCompatibility"],
);
assert.match(lifecycleValidation, /isAccountLandingPageOperationalConfigurationCompatible/);
assert.doesNotMatch(lifecycleValidation, /resolveAccountLandingPageOnboardingConfiguration|revision:|\.complete/);
assert.match(
  readFileSync(new URL("../../../../lib/lp-builder/index.ts", import.meta.url), "utf8"),
  /export \{\s*isAccountLandingPageOperationalConfigurationCompatible,\s*type AccountLandingPageOperationalCompatibilityInput,\s*\} from "\.\/operationalCompatibility"/,
);
assert.deepEqual(
  Object.keys(createRequire(import.meta.url).cache).filter((path) =>
    /[\\/]@supabase[\\/]|[\\/]next[\\/](headers|dist[\\/]server)|[\\/]lp-builder[\\/]adapters[\\/]/.test(path),
  ),
  [],
  "The focal API must load repo-only without server adapters, Supabase or Next headers",
);
assert.match(lifecycleAdapter, /publication_fingerprint/);
assert.match(lifecycleAdapter, /validation_context_fingerprint/);
assert.match(lifecycleAdapter, /publication_context_fingerprint/);
assert.match(lifecycleAdapter, /taxon_review_evidence/);
assert.match(lifecycleAdapter, /reconstructDraftInputCatalogEvaluationContext/);
assert.match(lifecycleAdapter, /recordAdminInputCatalogDraftSufficiencyDecision/);
assert.match(lifecycleAdapter, /reconcileAdminInputCatalogPublishedDraft/);
assert.match(lifecycleAdapter, /runtimeEnvironment !== "production"/);
assert.match(lifecycleAdapter, /reconstructCanonicalInputCatalogEvaluationContext/);
assert.match(lifecycleAdapter, /advancePublishedReviewMarker/);
assert.match(lifecycleAdapter, /selected_end_customer_research_version/);
assert.match(lifecycleAdapter, /storedDraftFingerprint !== deployedFingerprint/);
assert.match(lifecycleAdapter, /finalProof[\s\S]*landing_page_input_catalog_drafts"\)[\s\S]*\.delete\(\)/);
const publishedEvidenceValidationIndex = lifecycleAdapter.indexOf(
  "const initialProof = await validatePublishedReviewEvidence",
);
const publishedEvidenceBlockingIndex = lifecycleAdapter.indexOf(
  "if (initialPlan.blockingTaxonIds.length > 0)",
);
const publishedReviewWriteIndex = lifecycleAdapter.indexOf(
  "const advanced = await advancePublishedReviewMarker",
);
const publishedDraftDeleteIndex = lifecycleAdapter.indexOf(
  '.from("landing_page_input_catalog_drafts")\n    .delete()',
);
assert.ok(publishedEvidenceValidationIndex >= 0);
assert.ok(publishedEvidenceBlockingIndex > publishedEvidenceValidationIndex);
assert.ok(publishedReviewWriteIndex > publishedEvidenceBlockingIndex);
assert.ok(publishedDraftDeleteIndex > publishedReviewWriteIndex);
assert.match(lifecycleAdapter, /collectCommercialIdentityReviewBlockers/);
assert.doesNotMatch(lifecycleAdapter, /coordinateInputCatalogEvaluation|executeInputCatalogEvaluationProvider/);
assert.doesNotMatch(lifecycleAdapter, /Math\.max|versions\.at\(-1\)|latest/i);
assert.match(lifecycleComponent, /Preparar handoff repo-only/);
assert.match(lifecycleComponent, /Configurações inválidas/);
assert.match(lifecycleComponent, /catalogDraftRevision/);
assert.match(lifecycleComponent, /Decisão vinculada ao draft atual/);
assert.match(lifecycleComponent, /Reconciliar draft já implantado/);
assert.match(lifecycleActions, /requirePlatformAdmin/);
const lifecycleRuntimeExports = lifecycleActions.match(
  /^export\s+(?!type\b|interface\b)[^\r\n]+/gm,
) ?? [];
assert.ok(lifecycleRuntimeExports.length > 0);
assert.ok(
  lifecycleRuntimeExports.every((runtimeExport) =>
    /^export async function\b/.test(runtimeExport),
  ),
  `O módulo use server deve exportar em runtime somente Server Actions assíncronas: ${lifecycleRuntimeExports.join(", ")}`,
);
assert.doesNotMatch(lifecycleActions, /export const initialInputCatalogLifecycleActionState/);
assert.match(
  lifecycleComponent,
  /const initialInputCatalogLifecycleActionState:\s*InputCatalogLifecycleActionState\s*=\s*\{/,
);
assert.match(lifecycleMigration, /create table public\.landing_page_input_catalog_drafts/);
assert.match(lifecycleMigration, /revoke all on table public\.landing_page_input_catalog_drafts[\s\S]*from public, anon, authenticated/);
assert.match(lifecycleMigration, /grant select, insert, update, delete[\s\S]*to service_role/);
assert.match(lifecycleMigration, /taxon_review_evidence jsonb not null default '\{\}'::jsonb/);
assert.doesNotMatch(lifecycleMigration, /insert into public\.landing_page_input_catalog_drafts/);

async function validateBehavioralContracts(): Promise<void> {
const largeCollection = Array.from({ length: 1_207 }, (_, index) => index);
const completePagination = await collectCompletePaginatedRows({
  pageSize: 500,
  readPage: async (offset, limit) => ({
    rows: largeCollection.slice(offset, offset + Math.min(limit, 173)),
    total: largeCollection.length,
  }),
});
assert.equal(completePagination.ok, true);
if (!completePagination.ok) throw new Error("Expected complete pagination");
assert.deepEqual(completePagination.rows, largeCollection);

let divergentReads = 0;
const divergentPagination = await collectCompletePaginatedRows({
  pageSize: 500,
  readPage: async (offset) => ({
    rows: largeCollection.slice(offset, offset + 400),
    total: divergentReads++ === 0 ? largeCollection.length : largeCollection.length + 1,
  }),
});
assert.equal(divergentPagination.ok, false);

const truncatedPagination = await collectCompletePaginatedRows({
  pageSize: 500,
  readPage: async (offset) => ({
    rows: offset === 0 ? largeCollection.slice(0, 200) : [],
    total: largeCollection.length,
  }),
});
assert.equal(truncatedPagination.ok, false);

const candidate = validateLandingPageInputCatalogDraft({
  draft: createNextLandingPageInputCatalogDraft(),
  taxons: [
    { identity: realEstateSegmentTaxon, reviewedVersion: 5, operational: false },
    { identity: realEstateBrokerNicheTaxon, reviewedVersion: 5, operational: true },
  ],
});
assert.equal(candidate.ok, true);
if (!candidate.ok) throw new Error("Expected executable draft candidate");
const preHandoffBase = {
  accountId: "00000000-0000-4000-8000-000000000101",
  landingPageId: null,
  planKey: "starter" as const,
  taxonChain: { segment: realEstateSegmentTaxon, niche: realEstateBrokerNicheTaxon },
  authoritativeValues: { business_display_name: "Conta operacional" },
};
assert.equal(
  countInvalidInputCatalogOperationalConfigurations(candidate.value, [
    { ...preHandoffBase, storedValues: {} },
  ]),
  0,
);
assert.equal(
  countInvalidInputCatalogOperationalConfigurations(candidate.value, [
    {
      ...preHandoffBase,
      storedValues: {
        never_published: { scope: "business", value: "inválido" },
      },
    },
  ]),
  1,
);
const offeringScopeCandidate = validateLandingPageInputCatalogDraft({
  draft: offeringScopeDraft(),
  taxons: [
    { identity: realEstateSegmentTaxon, reviewedVersion: 5, operational: false },
    { identity: realEstateBrokerNicheTaxon, reviewedVersion: 5, operational: true },
  ],
});
assert.equal(offeringScopeCandidate.ok, true);
if (!offeringScopeCandidate.ok) {
  throw new Error("Expected offering-scope draft candidate");
}
const legacyOfferingConfiguration = {
  ...preHandoffBase,
  storedValues: {
    primary_service_or_offer: {
      scope: "offer" as const,
      value: " Oferta livre da configuração v5 ",
    },
    primary_service_or_offer_description: {
      scope: "offer" as const,
      value: " Descrição factual legada ",
    },
  },
};
assert.equal(
  countInvalidInputCatalogOperationalConfigurations(
    offeringScopeCandidate.value,
    [legacyOfferingConfiguration],
  ),
  0,
);
const projectionInput = {
  accountId: legacyOfferingConfiguration.accountId,
  landingPageId: legacyOfferingConfiguration.landingPageId,
  catalogVersion: 6,
  revision: 1,
  planKey: legacyOfferingConfiguration.planKey,
  taxonChain: legacyOfferingConfiguration.taxonChain,
  storedValues: legacyOfferingConfiguration.storedValues,
  authoritativeValues: legacyOfferingConfiguration.authoritativeValues,
  registry: offeringScopeCandidate.value.registry,
};
const inputBeforeProjection = JSON.parse(JSON.stringify(projectionInput));
const projected = resolveAccountLandingPageOnboardingConfiguration(
  projectionInput,
);
assert.equal(projected.ok, true);
if (!projected.ok) throw new Error("Expected read-only offering projection");
assert.deepEqual(projected.configuration.storedValues, {
  landing_page_offering_scope: {
    scope: "landing_page",
    value: {
      mode: "single",
      offerings: ["Oferta livre da configuração v5"],
    },
  },
  landing_page_offering_scope_description: {
    scope: "landing_page",
    value: "Descrição factual legada",
  },
});
assert.deepEqual(projectionInput, inputBeforeProjection);

const currentV5 = resolveAccountLandingPageOnboardingConfiguration({
  ...projectionInput,
  catalogVersion: 5,
  registry: undefined,
});
assert.equal(currentV5.ok, true);
if (!currentV5.ok) throw new Error("Expected unchanged published v5 resolution");
assert.equal(
  Object.hasOwn(
    currentV5.configuration.storedValues,
    "primary_service_or_offer",
  ),
  true,
);
assert.equal(
  Object.hasOwn(
    currentV5.configuration.storedValues,
    "landing_page_offering_scope",
  ),
  false,
);

const partialCandidate = resolveAccountLandingPageOnboardingConfiguration({
  ...projectionInput,
  registry: withoutOfferingScopeDescription(
    offeringScopeCandidate.value.registry,
  ),
});
assert.deepEqual(partialCandidate, {
  ok: false,
  error: "INVALID_CONFIGURATION",
  fieldKey: "landing_page_offering_scope",
});
assert.equal(
  countInvalidInputCatalogOperationalConfigurations(
    offeringScopeCandidate.value,
    [{
      ...legacyOfferingConfiguration,
      storedValues: {
        ...legacyOfferingConfiguration.storedValues,
        primary_service_or_offer: { scope: "offer", value: "   " },
      },
    }],
  ),
  1,
);
assert.equal(
  countInvalidInputCatalogOperationalConfigurations(
    offeringScopeCandidate.value,
    [{
      ...legacyOfferingConfiguration,
      storedValues: {
        ...legacyOfferingConfiguration.storedValues,
        primary_service_or_offer_description: {
          scope: "offer",
          value: "   ",
        },
      },
    }],
  ),
  1,
);
type ValidatedCandidate = Parameters<typeof countInvalidInputCatalogOperationalConfigurations>[0];
const versionSixCandidate: ValidatedCandidate = { ...candidate.value, entry: candidate.value.registry[6] };
type CompatibilityCase = Readonly<{
  name: string;
  configuration: InputCatalogOperationalConfiguration;
  compatible: boolean;
  candidate?: ValidatedCandidate;
}>;
const compatibilityCases: CompatibilityCase[] = [];
for (const planKey of landingPageInputCatalogPlans) {
  for (const landingPageId of [null, "00000000-0000-4000-8000-000000000102"]) {
    compatibilityCases.push({
      name: `${planKey}/${landingPageId === null ? "pre-handoff" : "E19.5"}/incomplete`,
      configuration: { ...preHandoffBase, planKey, landingPageId, storedValues: {} },
      compatible: true,
    });
  }
}
compatibilityCases.push(
  {
    name: "unknown field",
    configuration: { ...preHandoffBase, storedValues: { never_published: { scope: "business", value: "invalid" } } },
    compatible: false,
  },
  {
    name: "recognized retired field",
    configuration: { ...preHandoffBase, storedValues: { primary_service_or_offer: { scope: "offer", value: "Oferta histórica" } } },
    compatible: true,
  },
  {
    name: "incompatible scope",
    configuration: { ...preHandoffBase, storedValues: { traffic_source: { scope: "business", value: "organic" } } },
    compatible: false,
  },
  {
    name: "invalid value",
    configuration: { ...preHandoffBase, storedValues: { traffic_source: { scope: "landing_page", value: "invalid" } } },
    compatible: false,
  },
  {
    name: "authority collision",
    configuration: { ...preHandoffBase, storedValues: { business_display_name: { scope: "business", value: "Colisão" } } },
    compatible: false,
  },
  {
    name: "invalid authoritative value",
    configuration: { ...preHandoffBase, storedValues: {}, authoritativeValues: { business_display_name: 42 } },
    compatible: false,
  },
  { name: "legacy offering projected to v6", configuration: legacyOfferingConfiguration, candidate: versionSixCandidate, compatible: true },
  {
    name: "malformed offering candidate",
    configuration: legacyOfferingConfiguration,
    candidate: { ...versionSixCandidate, registry: withoutOfferingScopeDescription(versionSixCandidate.registry) },
    compatible: false,
  },
  {
    name: "missing candidate version",
    configuration: { ...preHandoffBase, storedValues: {} },
    candidate: { ...candidate.value, entry: { ...candidate.value.entry, version: 999 } },
    compatible: false,
  },
  {
    name: "empty candidate registry never falls back to published catalog",
    configuration: { ...preHandoffBase, storedValues: {} },
    candidate: { ...candidate.value, registry: {} },
    compatible: false,
  },
  {
    name: "catalog entry version mismatch",
    configuration: { ...preHandoffBase, storedValues: {} },
    candidate: { ...candidate.value, registry: { [candidate.value.entry.version]: { ...candidate.value.entry, version: 999 } } },
    compatible: false,
  },
  {
    name: "invalid runtime plan",
    configuration: { ...preHandoffBase, storedValues: {}, planKey: "invalid" as InputCatalogOperationalConfiguration["planKey"] },
    compatible: false,
  },
  {
    name: "incompatible taxon chain",
    configuration: { ...preHandoffBase, storedValues: {}, taxonChain: { segment: realEstateSegmentTaxon, niche: { ...realEstateBrokerNicheTaxon, parentId: "invalid-parent" } } },
    compatible: false,
  },
);
for (const testCase of compatibilityCases) {
  const evaluatedCandidate: ValidatedCandidate = testCase.candidate ?? candidate.value;
  const input: AccountLandingPageOperationalCompatibilityInput = structuredClone({
    candidateCatalog: { version: evaluatedCandidate.entry.version, registry: evaluatedCandidate.registry },
    configuration: testCase.configuration,
  });
  const before = structuredClone(input);
  const expected = resolveAccountLandingPageOnboardingConfiguration({
    ...structuredClone(input.configuration),
    catalogVersion: input.candidateCatalog.version,
    registry: input.candidateCatalog.registry,
    revision: 1,
  });
  assert.equal(expected.ok, testCase.compatible, testCase.name);
  if (testCase.name.endsWith("/incomplete")) {
    assert.ok(expected.ok);
    assert.equal(expected.configuration.complete, false, testCase.name);
  }
  assert.equal(isAccountLandingPageOperationalConfigurationCompatible(input), expected.ok, testCase.name);
  assert.deepEqual(input, before, `${testCase.name}: immutable input`);
  assert.equal(Object.isFrozen(input.configuration.taxonChain.segment), false);
  assert.equal(
    countInvalidInputCatalogOperationalConfigurations(evaluatedCandidate, [testCase.configuration]),
    countInvalidWithPreviousResolver(evaluatedCandidate, [testCase.configuration]),
    testCase.name,
  );
}
for (const configurations of [[], compatibilityCases.map((testCase) => testCase.configuration)]) {
  const before = fingerprintInputCatalogOperationalContext({ taxons: [], operationalTaxonIds: new Set(), operationalConfigurations: configurations });
  assert.equal(
    countInvalidInputCatalogOperationalConfigurations(candidate.value, configurations),
    countInvalidWithPreviousResolver(candidate.value, configurations),
  );
  assert.equal(fingerprintInputCatalogOperationalContext({ taxons: [], operationalTaxonIds: new Set(), operationalConfigurations: configurations }), before);
}
const missingRegistryInput = {
  candidateCatalog: { version: 6 },
  configuration: { ...preHandoffBase, storedValues: {} },
};
// @ts-expect-error A candidate registry is mandatory, including for published versions.
const missingRegistryContract: AccountLandingPageOperationalCompatibilityInput = missingRegistryInput;
assert.equal(isAccountLandingPageOperationalConfigurationCompatible(missingRegistryContract), false);
console.log(`ok - ARC-002: ${compatibilityCases.length} API/resolver/previous-counter cases; empty/mixed counts and fingerprints preserved`);
const operationalContext = {
  taxons: [
    { identity: realEstateSegmentTaxon, reviewedVersion: 5, selectedResearchVersion: 1, operational: false },
    { identity: realEstateBrokerNicheTaxon, reviewedVersion: 5, selectedResearchVersion: 1, operational: true },
  ],
  operationalTaxonIds: new Set([realEstateBrokerNicheTaxon.id]),
  operationalConfigurations: [{ ...preHandoffBase, storedValues: {} }],
};
const originalContextFingerprint = fingerprintInputCatalogOperationalContext(
  operationalContext,
);
const staleContextFingerprint = fingerprintInputCatalogOperationalContext({
  ...operationalContext,
  operationalConfigurations: [
    {
      ...preHandoffBase,
      storedValues: {
        traffic_source: { scope: "landing_page", value: "organic" },
      },
    },
  ],
});
assert.match(originalContextFingerprint, /^[0-9a-f]{64}$/);
assert.notEqual(staleContextFingerprint, originalContextFingerprint);

const preservedDraftIdentity = inputCatalogReviewEvidenceIdentity();
const deployedIdentity = reorderedInputCatalogReviewEvidenceIdentity(
  preservedDraftIdentity,
);
const legacyStoredFingerprint = createHash("sha256")
  .update(JSON.stringify(preservedDraftIdentity))
  .digest("hex");
const publishedEvidenceInput = {
  storedContextFingerprint: legacyStoredFingerprint,
  preservedDraftIdentity,
  deployedIdentity,
  expectedTaxonId: realEstateBrokerNicheTaxon.id,
  expectedResearchVersion: 2,
  expectedInputCatalogVersion: 6,
};
assert.notEqual(JSON.stringify(preservedDraftIdentity), JSON.stringify(deployedIdentity));
assert.equal(
  fingerprintInputCatalogEvaluationContextIdentity(preservedDraftIdentity),
  fingerprintInputCatalogEvaluationContextIdentity(deployedIdentity),
);
assert.equal(
  validatePublishedInputCatalogReviewEvidenceContext(publishedEvidenceInput),
  true,
);
const stalePublishedIdentityMutations: readonly ((
  identity: InputCatalogEvaluationContextIdentity,
) => void)[] = [
  (identity) => {
    (identity.research as { researchVersion: number }).researchVersion = 3;
  },
  (identity) => {
    (identity.research as { content: string }).content = "Conteúdo alterado.";
  },
  (identity) => {
    (identity.inputCatalog as { version: number }).version = 7;
  },
  (identity) => {
    (identity as { taxonId: string }).taxonId = realEstateSegmentTaxon.id;
  },
  (identity) => {
    (identity.taxonChain.segment as { slug: string }).slug = "segmento-alterado";
  },
  (identity) => {
    const catalogs = identity.inputCatalog.catalogs as unknown as Array<{
      fields: unknown[];
    }>;
    catalogs[0]?.fields.pop();
  },
];
for (const mutate of stalePublishedIdentityMutations) {
  const changed = structuredClone(deployedIdentity);
  mutate(changed);
  assert.equal(
    validatePublishedInputCatalogReviewEvidenceContext({
      ...publishedEvidenceInput,
      deployedIdentity: changed,
    }),
    false,
  );
}
assert.equal(
  validatePublishedInputCatalogReviewEvidenceContext({
    ...publishedEvidenceInput,
    storedContextFingerprint: createHash("sha256")
      .update(JSON.stringify(deployedIdentity))
      .digest("hex"),
  }),
  false,
);
assert.equal(
  validatePublishedInputCatalogReviewEvidenceContext({
    ...publishedEvidenceInput,
    storedContextFingerprint: "0".repeat(64),
  }),
  false,
);

const operationalAuthorities = resolveInputCatalogOperationalAccountAuthorities({
  candidateAccountIds: new Set(["active-eligible", "inactive-retained", "active-ineligible"]),
  accounts: [
    { id: "active-eligible", name: "Conta operacional", status: "active" },
    { id: "inactive-retained", name: "Conta histórica", status: "inactive" },
    { id: "active-ineligible", name: "Conta sem entitlement", status: "active" },
  ],
  entitlements: [
    { account_id: "active-eligible", plan_key: "pro", is_commercially_eligible: true },
    { account_id: "inactive-retained", plan_key: "historical-plan", is_commercially_eligible: true },
    { account_id: "active-ineligible", plan_key: null, is_commercially_eligible: false },
  ],
});
assert.equal(operationalAuthorities.ok, true);
if (!operationalAuthorities.ok) throw new Error("Expected valid operational authority fixture");
assert.deepEqual(operationalAuthorities.value, [
  { accountId: "active-eligible", accountName: "Conta operacional", planKey: "pro" },
]);
assert.match(lifecycleContext, /if \(pre && operational\)/);
assert.match(lifecycleContext, /operational && shared && !isRecord\(shared.values\)/);
assert.match(lifecycleContext, /operational && local && !isRecord\(local.values\)/);

const beforePublicationReconciliation = planPublishedInputCatalogReviewReconciliation({
  currentVersion: 5,
  impacts: [{
    taxonId: realEstateBrokerNicheTaxon.id,
    reviewedVersion: 4,
    operational: true,
    classification: "review_required",
  }],
  validEvidenceTaxonIds: new Set([realEstateBrokerNicheTaxon.id]),
});
assert.deepEqual(beforePublicationReconciliation.blockingTaxonIds, []);
assert.deepEqual(beforePublicationReconciliation.taxonIdsToAdvance, [realEstateBrokerNicheTaxon.id]);
const afterPublicationReconciliation = planPublishedInputCatalogReviewReconciliation({
  currentVersion: 5,
  impacts: [{
    taxonId: realEstateBrokerNicheTaxon.id,
    reviewedVersion: 5,
    operational: true,
    classification: "no_material_change",
  }],
  validEvidenceTaxonIds: new Set([realEstateBrokerNicheTaxon.id]),
});
assert.deepEqual(afterPublicationReconciliation.blockingTaxonIds, []);
assert.deepEqual(afterPublicationReconciliation.taxonIdsToAdvance, []);
const effectiveAfterReconciliation = deriveEffectiveTaxonPreparation({
  selectedResearch: {
    ok: true,
    value: {
      taxonId: realEstateBrokerNicheTaxon.id,
      taxonSlug: realEstateBrokerNicheTaxon.slug,
      selectedResearchVersion: 1,
      selectedResearchValid: true,
      reviewedInputCatalogVersion: 5,
      research: {
        taxonSlug: realEstateBrokerNicheTaxon.slug,
        audienceScope: "end_customer",
        researchVersion: 1,
        relativePath: "fixture.md",
        content: "Safe factual fixture.",
      },
    },
  },
  currentInputCatalogVersion: 5,
  taxonChain: {
    segment: realEstateSegmentTaxon,
    niche: realEstateBrokerNicheTaxon,
  },
});
assert.equal(effectiveAfterReconciliation.ok, true);
if (!effectiveAfterReconciliation.ok) throw new Error("Expected reconciled effective version");
assert.equal(effectiveAfterReconciliation.value.reviewedInputCatalogVersion, 5);
assert.equal(effectiveAfterReconciliation.value.effectiveInputCatalogVersion, 5);

const missingMandatoryDecision = planPublishedInputCatalogReviewReconciliation({
  currentVersion: 5,
  impacts: [{
    taxonId: realEstateBrokerNicheTaxon.id,
    reviewedVersion: 4,
    operational: true,
    classification: "review_required",
  }],
  validEvidenceTaxonIds: new Set(),
});
assert.deepEqual(missingMandatoryDecision.blockingTaxonIds, [realEstateBrokerNicheTaxon.id]);
assert.deepEqual(missingMandatoryDecision.taxonIdsToAdvance, []);

await validateLifecycleBoundedContracts();
console.log("ok - admin preserves consumers and proves complete service-only lifecycle pagination");
}

void validateBehavioralContracts().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});

function offeringScopeDraft(): LandingPageInputCatalogRegistryEntry {
  return createNextLandingPageInputCatalogDraft();
}

function countInvalidWithPreviousResolver(
  candidate: Parameters<typeof countInvalidInputCatalogOperationalConfigurations>[0],
  configurations: readonly InputCatalogOperationalConfiguration[],
): number {
  return configurations.filter((configuration) => !resolveAccountLandingPageOnboardingConfiguration({
    ...structuredClone(configuration),
    catalogVersion: candidate.entry.version,
    revision: 1,
    registry: candidate.registry,
  }).ok).length;
}

function inputCatalogReviewEvidenceIdentity(): InputCatalogEvaluationContextIdentity {
  return {
    taxonId: realEstateBrokerNicheTaxon.id,
    taxonSlug: realEstateBrokerNicheTaxon.slug,
    taxonChain: {
      segment: realEstateSegmentTaxon,
      niche: realEstateBrokerNicheTaxon,
      ultraNiche: null,
    },
    research: {
      taxonSlug: realEstateBrokerNicheTaxon.slug,
      audienceScope: "end_customer",
      researchVersion: 2,
      relativePath: "corretor-imoveis/end_customer/v2.md",
      content: "Pesquisa factual preservada.",
    },
    inputCatalog: {
      version: 6,
      plans: ["starter"],
      catalogs: [
        {
          version: 6,
          plan: "starter",
          taxonChain: {
            segment: realEstateSegmentTaxon,
            niche: realEstateBrokerNicheTaxon,
          },
          fields: [
            {
              fieldKey: "landing_page_offering_scope",
              valueType: "offering_scope",
            },
          ],
        },
      ],
    },
  } as unknown as InputCatalogEvaluationContextIdentity;
}

function reorderedInputCatalogReviewEvidenceIdentity(
  identity: InputCatalogEvaluationContextIdentity,
): InputCatalogEvaluationContextIdentity {
  return {
    inputCatalog: identity.inputCatalog,
    research: identity.research,
    taxonChain: identity.taxonChain,
    taxonSlug: identity.taxonSlug,
    taxonId: identity.taxonId,
  };
}

function withoutOfferingScopeDescription(
  registry: LandingPageInputCatalogRegistry,
): LandingPageInputCatalogRegistry {
  const partial = JSON.parse(
    JSON.stringify(registry),
  ) as LandingPageInputCatalogRegistry;
  const entries = partial[6].universal.entries as LandingPageInputCatalogLayerEntry[];
  entries.splice(
    entries.findIndex(
      (entry) =>
        entry.kind === "field" &&
        entry.fieldKey === "landing_page_offering_scope_description",
    ),
    1,
  );
  return partial;
}
