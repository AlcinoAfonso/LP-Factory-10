import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import type { AccountLandingPageOnboardingConfiguration } from "./contracts";
import { CURRENT_LANDING_PAGE_INPUT_CATALOG_VERSION } from "../conversion-content/landing-page/input-catalog";
import { areLandingPageOfferingScopesMateriallyEqual } from "../conversion-content/landing-page/input-catalog";
import {
  deriveLandingPageWorkspaceState,
  evaluateLandingPageCommercialIdentityMutation,
  isLandingPageWorkspaceEnabled,
  landingPageWorkspaceIdentityFieldKeys,
  landingPageWorkspaceStateLabels,
  splitLandingPageWorkspaceValues,
} from "./landingPageWorkspace";

const cases: readonly Readonly<{ name: string; run: () => void }>[] = [
  {
    name: "workspace rollout accepts only literal true and consumes the explicit repo current version",
    run: () => {
      const previous = process.env.E19_5_WORKSPACE_ENABLED;
      try {
        delete process.env.E19_5_WORKSPACE_ENABLED;
        assert.equal(isLandingPageWorkspaceEnabled(), false);
        process.env.E19_5_WORKSPACE_ENABLED = "TRUE";
        assert.equal(isLandingPageWorkspaceEnabled(), false);
        process.env.E19_5_WORKSPACE_ENABLED = "true";
        assert.equal(isLandingPageWorkspaceEnabled(), true);
        assert.equal(CURRENT_LANDING_PAGE_INPUT_CATALOG_VERSION, 6);
      } finally {
        if (previous === undefined) delete process.env.E19_5_WORKSPACE_ENABLED;
        else process.env.E19_5_WORKSPACE_ENABLED = previous;
      }
    },
  },
  {
    name: "derived states keep completeness latest and approval independent",
    run: () => {
      const incomplete = configuration(false);
      const complete = configuration(true);
      assert.equal(deriveLandingPageWorkspaceState({ configuration: incomplete, latestRevisionId: null, approvedRevisionId: null }), "configuration_incomplete");
      assert.equal(deriveLandingPageWorkspaceState({ configuration: complete, latestRevisionId: null, approvedRevisionId: null }), "ready_to_generate");
      assert.equal(deriveLandingPageWorkspaceState({ configuration: complete, latestRevisionId: "latest", approvedRevisionId: null }), "in_review");
      assert.equal(deriveLandingPageWorkspaceState({ configuration: complete, latestRevisionId: "latest", approvedRevisionId: "latest" }), "delivered");
      assert.equal(deriveLandingPageWorkspaceState({ configuration: complete, latestRevisionId: "latest", approvedRevisionId: "older" }), "new_version_in_review");
      assert.deepEqual(Object.values(landingPageWorkspaceStateLabels), [
        "Configuração incompleta",
        "Pronta para gerar",
        "Em análise",
        "Entregue",
        "Nova versão em análise",
      ]);
    },
  },
  {
    name: "stored values split into the two physical residences without copying LP scopes",
    run: () => {
      const split = splitLandingPageWorkspaceValues({
        business_offerings_summary: { scope: "business", value: "Resumo aberto" },
        landing_page_offering_scope: {
          scope: "landing_page",
          value: { mode: "single", offerings: ["Oferta concreta"] },
        },
        traffic_source: { scope: "campaign", value: "paid_search" },
        primary_conversion_goal: { scope: "landing_page", value: "contact" },
      });
      assert.deepEqual(Object.keys(split.sharedValues), ["business_offerings_summary"]);
      assert.deepEqual(Object.keys(split.landingPageValues), [
        "landing_page_offering_scope",
        "traffic_source",
        "primary_conversion_goal",
      ]);
    },
  },
  {
    name: "offering scope material equality ignores order casing and trim but preserves mode and membership",
    run: () => {
      assert.equal(
        areLandingPageOfferingScopesMateriallyEqual(
          { mode: "selected", offerings: ["Oferta A", "Oferta B"] },
          { mode: "selected", offerings: [" oferta b ", "OFERTA A"] },
        ),
        true,
      );
      assert.equal(
        areLandingPageOfferingScopesMateriallyEqual(
          { mode: "selected", offerings: ["Oferta A", "Oferta B"] },
          { mode: "portfolio", offerings: ["Oferta A", "Oferta B"] },
        ),
        false,
      );
      assert.equal(
        areLandingPageOfferingScopesMateriallyEqual(
          { mode: "selected", offerings: ["Oferta A", "Oferta B"] },
          { mode: "selected", offerings: ["Oferta A", "Oferta C"] },
        ),
        false,
      );
    },
  },
  {
    name: "adapter and migration encode lazy atomic paginated tenant-safe boundaries",
    run: () => {
      const adapter = readFileSync(
        new URL("./adapters/landingPageWorkspaceAdapter.ts", import.meta.url),
        "utf8",
      );
      const workspaceDomain = readFileSync(
        new URL("./landingPageWorkspace.ts", import.meta.url),
        "utf8",
      );
      const migration = readFileSync(
        new URL("../../supabase/migrations/20260822170000_e19_5_3_landing_page_workspace.sql", import.meta.url),
        "utf8",
      );
      const lifecycleMigration = readFileSync(
        new URL("../../supabase/migrations/20260824180000_e20_2_8_input_catalog_lifecycle.sql", import.meta.url),
        "utf8",
      );
      const generationAdapter = readFileSync(
        new URL("./adapters/generationContextAdapter.ts", import.meta.url),
        "utf8",
      );
      const revisionAdapter = readFileSync(
        new URL("./adapters/landingPageRevisionAdapter.ts", import.meta.url),
        "utf8",
      );
      const snippet = readFileSync(
        new URL("../../supabase/snippets/e19_5_3_landing_page_workspace_verify.sql", import.meta.url),
        "utf8",
      );
      const sqlTest = readFileSync(
        new URL("../../supabase/tests/e19_5_3_landing_page_workspace.test.sql", import.meta.url),
        "utf8",
      );
      assert.ok(adapter.indexOf("isLandingPageWorkspaceEnabled()") < adapter.indexOf("account_landing_page_shared_configurations"));
      assert.match(adapter, /loadTaxonPreparationForCurrentVersion\(\{/);
      assert.match(adapter, /effectiveInputCatalogVersion/);
      assert.doesNotMatch(adapter, /LANDING_PAGE_WORKSPACE_REQUIRED_INPUT_CATALOG_VERSION/);
      assert.doesNotMatch(adapter, /loadTaxonPreparationForReviewedVersion|readAllLandingPageMaterializations|is_initialized|archive/i);
      assert.match(adapter, /count:\s*"exact"/);
      assert.match(adapter, /\.range\(/);
      assert.match(adapter, /p_expected_latest_materialization_id:\s*identity\.latestMaterializationId/);
      assert.match(adapter, /candidate\.configuration\.storedValues/);
      assert.match(adapter, /landingPageWorkspaceIdentityFieldKeys/);
      assert.doesNotMatch(adapter, /primary_conversion_goal/);
      assert.match(adapter, /evaluateLandingPageCommercialIdentityMutation/);
      assert.match(adapter, /projectLegacyLandingPageOfferingScope/);
      assert.match(workspaceDomain, /fieldKey: "landing_page_offering_scope"/);
      assert.match(
        adapter,
        /if \(isRecord\(operational\)\) \{[\s\S]*?return undefined;[\s\S]*?\}\s*const \{ data: onboarding/,
      );
      assert.match(generationAdapter, /if \(!isLandingPageWorkspaceEnabled\(\)\)/);
      assert.match(generationAdapter, /compileLegacyLandingPageGenerationContextForDraftWithDependencies/);
      assert.match(generationAdapter, /loadTaxonPreparationForCurrentVersion/);
      assert.doesNotMatch(generationAdapter, /loadTaxonPreparationForReviewedVersion|loadTaxonPreparationForVersion/);
      assert.match(lifecycleMigration, /p_catalog_version is null or p_catalog_version <= 0/);
      assert.doesNotMatch(lifecycleMigration, /p_catalog_version is distinct from 5/);
      assert.match(revisionAdapter, /append_account_landing_page_materialization_v2/);
      assert.match(migration, /p_expected_shared_revision is null/);
      assert.match(migration, /p_expected_landing_page_revision is null/);
      assert.match(migration, /materialization_baseline_conflict/);
      assert.match(migration, /create or replace function public\.append_account_landing_page_materialization_v2/);
      assert.match(migration, /create or replace function public\.approve_account_landing_page_materialization_v1[\s\S]*?security invoker/);
      assert.match(migration, /deferrable initially deferred/);
      assert.match(migration, /grant select, insert, update on table public\.account_landing_page_shared_configurations/);
      assert.match(migration, /grant select, insert, update on table public\.account_landing_page_configurations/);
      assert.doesNotMatch(migration, /is_initialized|set_account_landing_page_archived/i);
      assert.doesNotMatch(migration, /from public\.account_landing_pages landing_page/i);
      assert.match(snippet, /raise exception 'E19\.5\.3/);
      assert.match(snippet, /prosecdef/);
      assert.match(snippet, /pg_get_userbyid/);
      assert.match(sqlTest, /failed atomic save must roll back the shared update/);
      assert.match(sqlTest, /stale materialization baseline must fail/);
      assert.match(sqlTest, /append with stale configuration provenance must fail/);
      assert.match(sqlTest, /approval must be idempotent/);
    },
  },
  {
    name: "identity guard allows conversion strategy and equivalent scope while confirming only material scope changes",
    run: () => {
      assert.deepEqual(landingPageWorkspaceIdentityFieldKeys, [
        "funnel_stage",
        "transaction_intent",
      ]);
      const identityBaselines = new Map<string, unknown>([
        ["funnel_stage", "bofu"],
        ["transaction_intent", "buy"],
      ]);
      const baselineOfferingScope = {
        mode: "selected",
        offerings: ["Oferta A", "Oferta B"],
      };
      const baseValues = {
        funnel_stage: { scope: "landing_page" as const, value: "bofu" },
        transaction_intent: { scope: "landing_page" as const, value: "buy" },
        primary_conversion_goal: {
          scope: "landing_page" as const,
          value: "purchase",
        },
        landing_page_offering_scope: {
          scope: "landing_page" as const,
          value: {
            mode: "selected",
            offerings: [" oferta b ", "OFERTA A"],
          },
        },
      };
      assert.deepEqual(
        evaluateLandingPageCommercialIdentityMutation({
          hasRevision: true,
          identityBaselines,
          baselineOfferingScope,
          currentOfferingScope: undefined,
          nextValues: baseValues,
          sameCommercialWorkConfirmed: false,
        }),
        { ok: true },
      );
      const changedScope = {
        ...baseValues,
        landing_page_offering_scope: {
          scope: "landing_page" as const,
          value: { mode: "portfolio", offerings: ["Oferta A", "Oferta B"] },
        },
      };
      assert.deepEqual(
        evaluateLandingPageCommercialIdentityMutation({
          hasRevision: true,
          identityBaselines,
          baselineOfferingScope,
          currentOfferingScope: undefined,
          nextValues: changedScope,
          sameCommercialWorkConfirmed: false,
        }),
        {
          ok: false,
          error: "offer_change_confirmation_required",
          fieldKey: "landing_page_offering_scope",
        },
      );
      assert.deepEqual(
        evaluateLandingPageCommercialIdentityMutation({
          hasRevision: true,
          identityBaselines,
          baselineOfferingScope,
          currentOfferingScope: undefined,
          nextValues: changedScope,
          sameCommercialWorkConfirmed: true,
        }),
        { ok: true },
      );
      assert.deepEqual(
        evaluateLandingPageCommercialIdentityMutation({
          hasRevision: true,
          identityBaselines,
          baselineOfferingScope,
          currentOfferingScope: undefined,
          nextValues: {
            ...baseValues,
            funnel_stage: { scope: "landing_page", value: "mofu" },
          },
          sameCommercialWorkConfirmed: true,
        }),
        {
          ok: false,
          error: "identity_change_requires_new_landing_page",
          fieldKey: "funnel_stage",
        },
      );
    },
  },
  {
    name: "route surface exposes read-only viewers history selection and explicit approval",
    run: () => {
      const workspace = readFileSync(
        new URL("../../app/a/[account]/_components/LandingPageWorkspace.tsx", import.meta.url),
        "utf8",
      );
      const detail = readFileSync(
        new URL("../../app/a/[account]/landing-pages/[landingPageId]/page.tsx", import.meta.url),
        "utf8",
      );
      const preview = readFileSync(
        new URL("../../app/a/[account]/landing-pages/[landingPageId]/preview/page.tsx", import.meta.url),
        "utf8",
      );
      assert.match(workspace, /Somente leitura/);
      assert.match(workspace, /workspace_cursor/);
      assert.doesNotMatch(workspace, /Arquivar|Restaurar|Excluir/);
      assert.match(detail, /history_cursor/);
      assert.match(detail, /preview\?revision=/);
      assert.match(detail, /Gerar primeira versão/);
      assert.match(preview, /canMutate\s*\?/);
      assert.match(preview, /<GenerationTrigger/);
      assert.match(preview, /workspaceEnabled && preview\.status === "ready"/);
      assert.match(preview, /Aprovar esta versão/);
    },
  },
];

for (const validationCase of cases) {
  validationCase.run();
  console.log(`ok - ${validationCase.name}`);
}

function configuration(complete: boolean): AccountLandingPageOnboardingConfiguration {
  return {
    accountId: "10000000-0000-4000-8000-000000000001",
    landingPageId: "20000000-0000-4000-8000-000000000002",
    catalogVersion: 6,
    revision: 1,
    planKey: "starter",
    taxonChain: {
      segment: {
        id: "30000000-0000-4000-8000-000000000003",
        name: "Segmento",
        slug: "segmento",
        level: "segment",
        isActive: true,
        parentId: null,
      },
    },
    storedValues: {},
    fields: [],
    missingRequiredFieldKeys: complete ? [] : ["primary_conversion_goal"],
    complete,
  };
}
