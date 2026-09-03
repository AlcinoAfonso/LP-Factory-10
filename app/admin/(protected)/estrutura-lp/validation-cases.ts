import { validateLifecycleE20Contracts } from "./lifecycle-e20-validation-cases";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";

import { collectCompletePaginatedRows } from "../../../../lib/admin/adapters/adminInputCatalogLifecyclePagination";
import {
  fingerprintInputCatalogLifecycleContext,
  planPublishedInputCatalogReviewReconciliation,
  validatePublishedInputCatalogReviewEvidenceContext,
} from "../../../../lib/admin/adapters/adminInputCatalogLifecycleValidation";
import {
  createNextLandingPageInputCatalogDraft,
  realEstateBrokerNicheTaxon,
  realEstateSegmentTaxon,
  validateLandingPageInputCatalogDraft,
} from "../../../../lib/conversion-content/landing-page/input-catalog";
import {
  deriveEffectiveTaxonPreparation,
  fingerprintInputCatalogEvaluationContextIdentity,
  type InputCatalogEvaluationContextIdentity,
} from "../../../../lib/conversion-content/landing-page/taxon-preparation";

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
assert.doesNotMatch(
  lifecycleContext,
  /account_landing_page_|account_taxonomy|commercial_entitlement|operationalTaxonIds|preparedTaxonIds/,
);
assert.match(lifecycleContext, /business_taxons/);
assert.match(lifecycleContext, /selected_end_customer_research_version/);
assert.match(lifecycleContext, /reviewed_input_catalog_version/);
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
const publishedReviewWriteIndex = lifecycleAdapter.indexOf(
  "const advanced = await advancePublishedReviewMarker",
);
const publishedDraftDeleteIndex = lifecycleAdapter.indexOf(
  '.from("landing_page_input_catalog_drafts")\n    .delete()',
);
assert.ok(publishedEvidenceValidationIndex >= 0);
assert.ok(publishedReviewWriteIndex > publishedEvidenceValidationIndex);
assert.ok(publishedDraftDeleteIndex > publishedReviewWriteIndex);
assert.doesNotMatch(
  lifecycleAdapter,
  /blockingTaxonIds|blockingOperationalReviews|invalidOperationalConfigurations|collectCommercialIdentityReviewBlockers|preparedTaxonIds/,
);
assert.doesNotMatch(lifecycleAdapter, /coordinateInputCatalogEvaluation|executeInputCatalogEvaluationProvider/);
assert.doesNotMatch(lifecycleAdapter, /Math\.max|versions\.at\(-1\)|latest/i);
assert.match(lifecycleComponent, /Preparar handoff repo-only/);
assert.doesNotMatch(lifecycleComponent, /Taxons operacionais|Bloqueios operacionais|Configurações inválidas/);
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
    { identity: realEstateSegmentTaxon, reviewedVersion: 5 },
    { identity: realEstateBrokerNicheTaxon, reviewedVersion: 5 },
  ],
});
assert.equal(candidate.ok, true);
if (!candidate.ok) throw new Error("Expected executable draft candidate");
const lifecycleFingerprintContext = {
  taxons: [
    { identity: realEstateSegmentTaxon, reviewedVersion: 5, selectedResearchVersion: 1 },
    { identity: realEstateBrokerNicheTaxon, reviewedVersion: 5, selectedResearchVersion: 1 },
  ],
};
const originalContextFingerprint = fingerprintInputCatalogLifecycleContext(
  lifecycleFingerprintContext,
);
const staleContextFingerprint = fingerprintInputCatalogLifecycleContext({
  taxons: lifecycleFingerprintContext.taxons.map((taxon) => ({
    ...taxon,
    reviewedVersion: taxon.identity.id === realEstateBrokerNicheTaxon.id ? 6 : taxon.reviewedVersion,
  })),
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

const beforePublicationReconciliation = planPublishedInputCatalogReviewReconciliation({
  currentVersion: 5,
  impacts: [{
    taxonId: realEstateBrokerNicheTaxon.id,
    reviewedVersion: 4,
  }],
  validEvidenceTaxonIds: new Set([realEstateBrokerNicheTaxon.id]),
});
assert.deepEqual(beforePublicationReconciliation.taxonIdsToAdvance, [realEstateBrokerNicheTaxon.id]);
const afterPublicationReconciliation = planPublishedInputCatalogReviewReconciliation({
  currentVersion: 5,
  impacts: [{
    taxonId: realEstateBrokerNicheTaxon.id,
    reviewedVersion: 5,
  }],
  validEvidenceTaxonIds: new Set([realEstateBrokerNicheTaxon.id]),
});
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

const missingEvidence = planPublishedInputCatalogReviewReconciliation({
  currentVersion: 5,
  impacts: [{
    taxonId: realEstateBrokerNicheTaxon.id,
    reviewedVersion: 4,
  }],
  validEvidenceTaxonIds: new Set(),
});
assert.deepEqual(missingEvidence.taxonIdsToAdvance, []);

await validateLifecycleE20Contracts();
console.log("ok - admin preserves consumers and proves complete service-only lifecycle pagination");
}

void validateBehavioralContracts().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});

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
