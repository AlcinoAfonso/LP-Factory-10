import { validateLifecycleE20Contracts } from "./lifecycle-e20-validation-cases";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";

import { collectCompletePaginatedRows } from "../../../../lib/admin/adapters/adminInputCatalogLifecyclePagination";
import { fingerprintInputCatalogLifecycleContext } from "../../../../lib/admin/adapters/adminInputCatalogLifecycleValidation";
import {
  createNextLandingPageInputCatalogDraft,
  realEstateBrokerNicheTaxon,
  realEstateSegmentTaxon,
  validateLandingPageInputCatalogDraft,
} from "../../../../lib/conversion-content/landing-page/input-catalog";

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
assert.match(taxonomyDetail, /AdminTaxonFactualCoverage/);
assert.doesNotMatch(taxonomyDetail, /AdminTaxonInputCatalogReview/);
assert.doesNotMatch(taxonomyAdapter, /landingPageResearchAdapter|research-resolution|resolveLandingPageResearch|E10\.8/);
assert.match(taxonomyAdapter, /selected_end_customer_research_version,reviewed_input_catalog_version/);
assert.doesNotMatch(taxonomyAdapter, /loadSelectedEndCustomerResearchFromClient/);
assert.match(taxonomyAdapter, /handoff: buildInputCatalogReviewHandoff\(\{/);
assert.match(taxonomyAdapter, /researchVersion: data\.selected_end_customer_research_version/);
assert.match(taxonomyAdapter, /inputCatalogVersion: CURRENT_LANDING_PAGE_INPUT_CATALOG_VERSION/);
assert.doesNotMatch(taxonomyAdapter, /A pesquisa E20\.5 não está selecionada\. Libere sem IA/);
assert.match(taxonomyAdapter, /readAdminCommercialActivationOverview/);
assert.doesNotMatch(conversionIndex, /landingPageResearch|landingPageResearchAdapter|research-resolution/);
assert.doesNotMatch(packageJson, /validate:landing-page-research|research-resolution\/validation-cases/);
assert.match(packageJson, /validate:commercial-activation/);
assert.match(packageJson, /validate:taxon-preparation/);
assert.match(packageJson, /validate:account-onboarding-journey/);
assert.doesNotMatch(packageJson, /validate:lp-builder-/);
assert.match(page, /view === "entradas"[\s\S]*AdminInputCatalogLifecycle/);
assert.match(lifecycleAdapter, /CURRENT_LANDING_PAGE_INPUT_CATALOG_VERSION/);
assert.doesNotMatch(
  lifecycleContext,
  /account_landing_page_|account_taxonomy|commercial_entitlement|operationalTaxonIds|preparedTaxonIds/,
);
assert.match(lifecycleContext, /business_taxons/);
assert.doesNotMatch(lifecycleContext, /selected_end_customer_research_version|reviewed_input_catalog_version/);
assert.doesNotMatch(lifecycleValidation, /lp-builder|OperationalConfiguration|operationalTaxonIds/);
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
assert.doesNotMatch(lifecycleAdapter, /taxon_review_evidence/);
assert.doesNotMatch(lifecycleAdapter, /reconstructDraftInputCatalogEvaluationContext/);
assert.doesNotMatch(lifecycleAdapter, /recordAdminInputCatalogDraftSufficiencyDecision/);
assert.match(lifecycleAdapter, /reconcileAdminInputCatalogPublishedDraft/);
assert.match(lifecycleAdapter, /runtimeEnvironment !== "production"/);
assert.doesNotMatch(lifecycleAdapter, /reconstructCanonicalInputCatalogEvaluationContext/);
assert.doesNotMatch(lifecycleAdapter, /advancePublishedReviewMarker/);
assert.doesNotMatch(lifecycleAdapter, /selected_end_customer_research_version/);
assert.match(lifecycleAdapter, /storedDraftFingerprint !== deployedFingerprint/);
assert.match(lifecycleAdapter, /landing_page_input_catalog_drafts"\)[\s\S]*\.delete\(\)/);
assert.doesNotMatch(lifecycleAdapter, /\.from\("business_taxons"\)[\s\S]*\.update\(/);
assert.doesNotMatch(
  lifecycleAdapter,
  /blockingTaxonIds|blockingOperationalReviews|invalidOperationalConfigurations|collectCommercialIdentityReviewBlockers|preparedTaxonIds/,
);
assert.doesNotMatch(lifecycleAdapter, /coordinateInputCatalogEvaluation|executeInputCatalogEvaluationProvider/);
assert.doesNotMatch(lifecycleAdapter, /Math\.max|versions\.at\(-1\)|latest/i);
assert.match(lifecycleComponent, /Preparar handoff repo-only/);
assert.doesNotMatch(lifecycleComponent, /Taxons operacionais|Bloqueios operacionais|Configurações inválidas/);
assert.match(lifecycleComponent, /fieldChanges/);
assert.match(lifecycleComponent, /affectedTaxonIds/);
assert.match(lifecycleComponent, /attributeChanges/);
assert.match(lifecycleComponent, /sameFactConfirmed/);
assert.match(lifecycleComponent, /expectedContentFingerprint/);
assert.match(lifecycleComponent, /expectedLifecycleContextFingerprint/);
assert.match(lifecycleComponent, /Confirmação vinculada à revisão/);
assert.match(lifecycleActions, /expectedContentFingerprint/);
assert.match(lifecycleActions, /expectedLifecycleContextFingerprint/);
assert.match(lifecycleAdapter, /current\.value\.contentFingerprint !== input\.expectedContentFingerprint/);
assert.match(lifecycleAdapter, /matchesInputCatalogLifecycleConfirmation/);
assert.match(lifecycleAdapter, /candidate\.value\.sameFactConfirmationFieldKeys/);
assert.doesNotMatch(
  lifecycleActions.match(/export async function saveInputCatalogDraftAction[\s\S]*?export async function validateInputCatalogDraftAction/)?.[0] ?? "",
  /sameFactConfirmed/,
);
assert.doesNotMatch(lifecycleComponent, /catalogDraftRevision|Decisão vinculada ao draft atual/);
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
    { identity: realEstateSegmentTaxon },
    { identity: realEstateBrokerNicheTaxon },
  ],
});
assert.equal(candidate.ok, true);
if (!candidate.ok) throw new Error("Expected executable draft candidate");
const lifecycleFingerprintContext = {
  taxons: [
    { identity: realEstateSegmentTaxon },
    { identity: realEstateBrokerNicheTaxon },
  ],
};
const originalContextFingerprint = fingerprintInputCatalogLifecycleContext(
  lifecycleFingerprintContext,
);
const activationOnlyFingerprint = fingerprintInputCatalogLifecycleContext({
  taxons: lifecycleFingerprintContext.taxons.map((taxon) => ({
    identity: taxon.identity.id === realEstateBrokerNicheTaxon.id
      ? { ...taxon.identity, isActive: !taxon.identity.isActive }
      : taxon.identity,
  })),
});
assert.match(originalContextFingerprint, /^[0-9a-f]{64}$/);
assert.equal(activationOnlyFingerprint, originalContextFingerprint);
const identityChangeFingerprint = fingerprintInputCatalogLifecycleContext({
  taxons: lifecycleFingerprintContext.taxons.map((taxon) => ({
    identity: taxon.identity.id === realEstateBrokerNicheTaxon.id
      ? { ...taxon.identity, slug: "corretor-imoveis-atualizado" }
      : taxon.identity,
  })),
});
assert.notEqual(identityChangeFingerprint, originalContextFingerprint);

await validateLifecycleE20Contracts();
console.log("ok - admin preserves consumers and proves complete service-only lifecycle pagination");
}

void validateBehavioralContracts().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
