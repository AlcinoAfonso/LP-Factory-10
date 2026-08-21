import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  landingPageInputCatalogRegistry,
  resolveLandingPageInputCatalog,
  realEstateBrokerNicheTaxon,
  realEstateSegmentTaxon,
} from "../conversion-content/landing-page/input-catalog";
import { deriveLandingPageWorkspaceState } from "./landingPageWorkspace";

const migrationUrl = new URL("../../supabase/migrations/20260821091539_e19_5_landing_page_workspace.sql", import.meta.url);
const sqlTestUrl = new URL("../../supabase/tests/e19_5_landing_page_workspace.test.sql", import.meta.url);
const snippetUrl = new URL("../../supabase/snippets/e19_5_landing_page_workspace_verify.sql", import.meta.url);
const adapterUrl = new URL("./adapters/landingPageWorkspaceAdapter.ts", import.meta.url);
const previewUrl = new URL("./landingPagePreview.ts", import.meta.url);
const accountPageUrl = new URL("../../app/a/[account]/page.tsx", import.meta.url);
const previewPageUrl = new URL("../../app/a/[account]/landing-pages/[landingPageId]/preview/page.tsx", import.meta.url);
const pendingButtonUrl = new URL("../../app/a/[account]/_components/WorkspaceSubmitButton.tsx", import.meta.url);

const cases = [
  {
    name: "catalog v5 deep-copies v4 and appends only the human landing-page objective",
    run: () => {
      const v4 = landingPageInputCatalogRegistry[4];
      const v5 = landingPageInputCatalogRegistry[5];
      assert.ok(v4 && v5);
      assert.deepEqual(v5.taxonLayers, v4.taxonLayers);
      assert.deepEqual(v5.universal.entries.slice(0, -1), v4.universal.entries);
      const objective = v5.universal.entries.at(-1);
      assert.equal(objective?.kind, "field");
      if (!objective || objective.kind !== "field") return;
      assert.equal(objective.fieldKey, "landing_page_objective");
      assert.equal(objective.createdInVersion, 5);
      assert.equal(objective.valueScope, "landing_page");
      assert.equal(objective.obligation, "required");
      assert.equal(objective.landingPageSubstitutionPolicy, "not_applicable");
      assert.deepEqual(objective.evidence.references, ["decision:e19-5-human-v1"]);
      for (const plan of ["starter", "lite", "pro", "ultra"] as const) {
        const resolved = resolveLandingPageInputCatalog({ version:5, plan, taxonChain:{segment:realEstateSegmentTaxon,niche:realEstateBrokerNicheTaxon} });
        assert.equal(resolved.ok, true);
        if (resolved.ok) assert.equal(resolved.value.fields.filter((field) => field.originLayer === "universal").at(-1)?.fieldKey, "landing_page_objective");
      }
    },
  },
  {
    name: "workspace UX state is derived from configuration latest and approved revisions",
    run: () => {
      const configuration = (complete: boolean) => ({ complete, missingRequiredFieldKeys: complete ? [] : ["landing_page_objective"] }) as never;
      assert.equal(deriveLandingPageWorkspaceState({status:"active",configuration:configuration(false),latestRevisionId:null,approvedRevisionId:null}),"configuration_incomplete");
      assert.equal(deriveLandingPageWorkspaceState({status:"draft",configuration:configuration(true),latestRevisionId:null,approvedRevisionId:null}),"ready_to_generate");
      assert.equal(deriveLandingPageWorkspaceState({status:"active",configuration:configuration(true),latestRevisionId:"latest",approvedRevisionId:null}),"in_review");
      assert.equal(deriveLandingPageWorkspaceState({status:"active",configuration:configuration(true),latestRevisionId:"latest",approvedRevisionId:"latest"}),"delivered");
      assert.equal(deriveLandingPageWorkspaceState({status:"active",configuration:configuration(true),latestRevisionId:"latest",approvedRevisionId:"old"}),"new_version_in_review");
      assert.equal(deriveLandingPageWorkspaceState({status:"archived",configuration:configuration(true),latestRevisionId:"latest",approvedRevisionId:"old"}),"archived");
    },
  },
  {
    name: "forward-only schema keeps the transitional status contract and isolates configuration residences",
    run: async () => {
      const migration = await readFile(migrationUrl,"utf8");
      assert.match(migration,/account_landing_page_shared_configurations/);
      assert.match(migration,/account_landing_page_configurations/);
      assert.match(migration,/approved_materialization_id/);
      assert.match(migration,/foreign key \(approved_materialization_id, id, account_id\)/i);
      assert.match(migration,/on delete no action[\s\S]+deferrable initially deferred/i);
      assert.match(migration,/e19_5_configuration_values_valid_for_account/);
      assert.match(migration,/e19_5_configuration_values_applicable/);
      assert.match(migration,/whatsapp_destination[\s\S]+primary_conversion_channel[\s\S]+paid_search_keyword_map[\s\S]+traffic_source/);
      assert.match(migration,/slug = 'imobiliario'/);
      assert.match(migration,/slug = 'corretor-imoveis'/);
      assert.match(migration,/p_values \? 'business_display_name'/);
      assert.match(migration,/grant select, insert, update[\s\S]+service_role/i);
      assert.match(migration,/revoke delete on table public\.account_landing_pages from service_role/i);
      assert.doesNotMatch(migration,/alter column status set default 'active'/i);
      assert.doesNotMatch(migration,/where\s+status\s*=\s*'draft'[\s\S]{0,120}set\s+status\s*=\s*'active'/i);
      assert.doesNotMatch(migration,/drop constraint account_landing_pages_status_chk/i);
    },
  },
  {
    name: "readiness SQL tests and versioned snippet fail closed over workspace RPCs and invariants",
    run: async () => {
      const [migration,test,snippet]=await Promise.all([readFile(migrationUrl,"utf8"),readFile(sqlTestUrl,"utf8"),readFile(snippetUrl,"utf8")]);
      assert.match(migration,/e19_5_landing_page_workspace_readiness/);
      assert.match(test,/new archived append must fail/);
      assert.match(test,/append must preserve prior approval/);
      assert.match(test,/restore must preserve history and approval/);
      assert.match(test,/contract default was anticipated/);
      assert.match(test,/current account authority must not be copied/);
      assert.match(test,/field outside the current taxon chain must fail/);
      assert.match(test,/destination outside applicable conversion channel must fail/);
      assert.match(test,/paid search map outside paid search traffic must fail/);
      assert.match(test,/materialized handoff retry must ignore later bootstrap drift/);
      assert.match(migration,/if found then[\s\S]+return query select v_shared_revision, v_landing_page_revision;[\s\S]+select \* into v_onboarding/i);
      assert.match(snippet,/persisted_configuration_valid/);
      assert.match(snippet,/e19_5_configuration_values_applicable/);
      assert.match(snippet,/status_contract_transitional/);
    },
  },
  {
    name: "runtime uses explicit tenant-safe projections and historical preview selection",
    run: async () => {
      const [adapter,preview,accountPage,previewPage,pendingButton]=await Promise.all([readFile(adapterUrl,"utf8"),readFile(previewUrl,"utf8"),readFile(accountPageUrl,"utf8"),readFile(previewPageUrl,"utf8"),readFile(pendingButtonUrl,"utf8")]);
      assert.match(adapter,/\.select\("id,account_id,name,slug,status,approved_materialization_id,updated_at"\)/);
      assert.match(adapter,/\.eq\("account_id", authority\.value\.accountId\)/);
      assert.match(adapter,/e19_5_landing_page_workspace_readiness/);
      assert.match(adapter,/catalogVersion: 5/);
      assert.doesNotMatch(adapter,/account_landing_page_onboarding_configurations/);
      assert.match(preview,/materializationId: revisionId/);
      assert.match(preview,/\["draft", "active", "archived"\]/);
      assert.match(accountPage,/handoffAccountLandingPageOnboarding/);
      assert.match(accountPage,/if \(!handoff\.ok\) return <LandingPageOperationalState/);
      assert.match(previewPage,/previewLandingPage\.status !== "archived"/);
      assert.match(previewPage,/Voltar para/);
      assert.match(pendingButton,/useFormStatus/);
      assert.match(pendingButton,/disabled=\{pending\}/);
    },
  },
];

async function main() {
  for (const testCase of cases) {
    await testCase.run();
    console.log(`ok - ${testCase.name}`);
  }
}

void main();
