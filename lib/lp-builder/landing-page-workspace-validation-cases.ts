import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { runInThisContext } from "node:vm";
import ts from "typescript";
import { createClient as createTestClient } from "@supabase/supabase-js";



import type { AccountLandingPageOnboardingConfiguration } from "./contracts";
import { CURRENT_LANDING_PAGE_INPUT_CATALOG_VERSION } from "../conversion-content/landing-page/input-catalog";
import {
  deriveLandingPageWorkspaceState,
  evaluateLandingPageCommercialIdentityMutation,
  isLandingPageWorkspaceEnabled,
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
    name: "commercial identity guards execute against v6 and projected v5 baselines",
    run: () => {
      const legacySnapshot = generationContextSnapshot([
        { fieldKey: "funnel_stage", value: "decision" },
        { fieldKey: "transaction_intent", value: "buy" },
        { fieldKey: "primary_conversion_goal", value: "contact" },
        { fieldKey: "primary_service_or_offer", value: "  Oferta Alpha  " },
      ]);
      const originalSnapshot = structuredClone(legacySnapshot);
      const baseValues = {
        funnel_stage: { scope: "landing_page" as const, value: "decision" },
        transaction_intent: { scope: "landing_page" as const, value: "buy" },
        primary_conversion_goal: { scope: "landing_page" as const, value: "purchase" },
        landing_page_offering_scope: {
          scope: "landing_page" as const,
          value: { mode: "single", offerings: ["oferta alpha"] },
        },
      };
      assert.deepEqual(
        evaluateLandingPageCommercialIdentityMutation({
          generationContextSnapshots: [legacySnapshot],
          currentConfiguredOfferingScope: undefined,
          values: baseValues,
          sameCommercialWorkConfirmed: false,
        }),
        { ok: true },
      );
      assert.deepEqual(legacySnapshot, originalSnapshot);

      assert.deepEqual(
        evaluateLandingPageCommercialIdentityMutation({
          generationContextSnapshots: [legacySnapshot],
          currentConfiguredOfferingScope: {
            mode: "multiple",
            offerings: [" Oferta Alpha ", "Oferta Beta"],
          },
          values: {
            ...baseValues,
            landing_page_offering_scope: {
              scope: "landing_page",
              value: {
                mode: "multiple",
                offerings: [" oferta beta ", "OFERTA ALPHA"],
              },
            },
          },
          sameCommercialWorkConfirmed: false,
        }),
        { ok: true },
      );

      for (const [fieldKey, value] of [
        ["funnel_stage", "awareness"],
        ["transaction_intent", "rent"],
      ] as const) {
        assert.deepEqual(
          evaluateLandingPageCommercialIdentityMutation({
            generationContextSnapshots: [legacySnapshot],
            currentConfiguredOfferingScope: undefined,
            values: {
              ...baseValues,
              [fieldKey]: { scope: "landing_page", value },
            },
            sameCommercialWorkConfirmed: true,
          }),
          {
            ok: false,
            error: "identity_change_requires_new_landing_page",
            fieldKey,
          },
        );
      }

      for (const changedScope of [
        { mode: "portfolio", offerings: ["Oferta Alpha"] },
        { mode: "single", offerings: ["Oferta Beta"] },
      ]) {
        assert.deepEqual(
          evaluateLandingPageCommercialIdentityMutation({
            generationContextSnapshots: [legacySnapshot],
            currentConfiguredOfferingScope: undefined,
            values: {
              ...baseValues,
              landing_page_offering_scope: {
                scope: "landing_page",
                value: changedScope,
              },
            },
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
            generationContextSnapshots: [legacySnapshot],
            currentConfiguredOfferingScope: undefined,
            values: {
              ...baseValues,
              landing_page_offering_scope: {
                scope: "landing_page",
                value: changedScope,
              },
            },
            sameCommercialWorkConfirmed: true,
          }),
          { ok: true },
        );
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
    name: "adapter and migration encode lazy atomic paginated tenant-safe boundaries",
    run: () => {
      const adapter = readFileSync(
        new URL("./adapters/landingPageWorkspaceAdapter.ts", import.meta.url),
        "utf8",
      );
      const domain = readFileSync(
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
      assert.ok(
        adapter.indexOf("if (!candidate.ok)") <
          adapter.indexOf('client.rpc(\n      "save_account_landing_page_configuration_v1"'),
      );
      assert.match(adapter, /evaluateLandingPageCommercialIdentityMutation/);
      assert.match(domain, /areLandingPageOfferingScopesMateriallyEqual/);
      assert.match(adapter, /projectLegacyLandingPageOfferingScope/);
      assert.match(adapter, /parseLandingPageOfferingScope/);
      assert.match(domain, /fieldKey:\s*"landing_page_offering_scope"/);
      assert.match(
        domain,
        /COMMERCIAL_IDENTITY_FIELDS = \[\s*"funnel_stage",\s*"transaction_intent",\s*\] as const/,
      );
      assert.doesNotMatch(
        domain,
        /COMMERCIAL_IDENTITY_FIELDS = \[[\s\S]*?primary_conversion_goal[\s\S]*?\] as const/,
      );
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
      assert.match(
        sqlTest,
        /same values must remain a no-op without revision increment/,
      );
      assert.match(sqlTest, /stale materialization baseline must fail/);
      assert.match(sqlTest, /append with stale configuration provenance must fail/);
      assert.match(sqlTest, /approval must be idempotent/);
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
    missingRequiredFieldKeys: complete ? [] : ["landing_page_offering_scope"],
    complete,
  };
}

function generationContextSnapshot(
  facts: readonly Readonly<{ fieldKey: string; value: unknown }>[],
) {
  return {
    generationContext: {
      modelContext: { facts },
      bindingFacts: [],
    },
  };
}
const adapterPath = new URL("./adapters/landingPageWorkspaceAdapter.ts", import.meta.url);
const requireAdapter = createRequire(adapterPath);
const accountA = "10000000-0000-4000-8000-000000000001";
const accountB = "10000000-0000-4000-8000-000000000002";
const pageId = (i: number) => `20000000-0000-4000-8000-${String(i).padStart(12, "0")}`;
const revisionId = (i: number, r: number) => `30000000-0000-4000-8000-${String(i * 1000 + r).padStart(12, "0")}`;
// Raw transport fixtures intentionally include malformed database shapes.
type Row = Record<string, any>;
type Scenario = { size: number; approval?: "none" | "mixed" | "all" | "latest"; history?: number; cursor?: string; role?: string; denied?: boolean; gate?: boolean; authenticated?: boolean; fault?: string; complete?: boolean; entitled?: boolean; prepared?: boolean; residence?: "bootstrap" | "historical"; detailCursor?: string; differentDates?: boolean };
const source = readFileSync(adapterPath, "utf8");
const compiled = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, esModuleInterop: true } }).outputText;

// Test-only module boundary: execute the unmodified adapter, real domain resolvers,
// and real supabase-js URL builder; replace only external I/O. No production seam.
async function exercise(s: Scenario) {
  const calls: URL[] = [];
  const boundaryCalls: string[] = [];
  let revisionRows = 0;
  let revisionBytes = 0;
  const pages: Row[] = Array.from({ length: s.size }, (_, n) => {
    const i = n + 1;
    return { id: pageId(i), account_id: accountA, name: `LP ${i}`, slug: `lp-${i}`, status: i % 2 ? "draft" : "active", updated_at: s.differentDates && i === 2 ? "2026-08-31T10:00:00Z" : "2026-08-30T10:00:00Z", approved_materialization_id: s.approval === "all" || s.approval === "latest" || (s.approval === "mixed" && i % 2 === 0) ? revisionId(i, s.approval === "latest" ? s.history ?? 101 : 1) : null };
  }).reverse();
  pages.push({ id: pageId(999), account_id: accountB, name: "Other tenant", slug: "other", status: "draft", updated_at: "2026-08-31T10:00:00Z", approved_materialization_id: null });
  pages.push({ id: pageId(998), account_id: accountA, name: "Archived", slug: "archived", status: "archived", updated_at: "2026-08-31T10:00:00Z", approved_materialization_id: null });
  const revisions: Row[] = pages.flatMap((p) => Array.from({ length: s.history ?? 101 }, (_, n) => ({
    id: revisionId(Number(p.id.slice(-12)), n + 1), landing_page_id: p.id, account_id: p.account_id, revision_number: n + 1,
    // Deliberately reverse chronological dates: revision number is the authority.
    created_at: new Date(Date.UTC(2026, 0, 1) - n * 1000).toISOString(),
    content_json: { forbidden: "x".repeat(1024) }, generation_context_snapshot_json: { forbidden: "x".repeat(1024) },
  })));
  const metadata = (r: Row) => Object.fromEntries(["id", "revision_number", "created_at", "account_id", "landing_page_id"].map(k => [k, r[k]]));
  const core = requireAdapter("../onboardingConfiguration");
  const catalog = requireAdapter("../../conversion-content/landing-page/input-catalog");
  const taxon = catalog.realEstateSegmentTaxon;
  const rawValues: Row = s.complete ? {
    landing_page_offering_scope: { mode: "single", offerings: ["Consultoria"] },
    landing_page_offering_scope_description: "Consultoria para compra de imóveis.",
    brand_color_palette: { primary: "#000000", secondary: "#111111", accent: "#222222", background: "#FFFFFF", text: "#000000" },
    funnel_stage: "bofu", transaction_intent: "buy",
    primary_conversion_goal: "contact", primary_conversion_channel: "whatsapp",
    whatsapp_destination: "+5511999999999", service_locations: ["São Paulo"],
  } : {};
  const resolvedCatalog = catalog.resolveLandingPageInputCatalog({ version: 6, plan: "starter", taxonChain: { segment: taxon } });
  assert.equal(resolvedCatalog.ok, true);
  const values = Object.fromEntries(resolvedCatalog.value.fields.filter((f: { fieldKey: string }) => Object.hasOwn(rawValues, f.fieldKey)).map((f: { fieldKey: string; valueScope: string }) => [f.fieldKey, { scope: f.valueScope, value: rawValues[f.fieldKey] }]));
  const split = requireAdapter("../landingPageWorkspace").splitLandingPageWorkspaceValues(values);
  const client = createTestClient("https://workspace.test", "test-only-key", {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: async (input, init) => {
      const url = new URL(String(input));
      calls.push(url);
      assert.equal(init?.method, "GET");
      const table = url.pathname.split("/").pop()!;
      const q = url.searchParams;
      if (s.fault === table) return new Response(JSON.stringify({ message: "fixture read error" }), { status: 500 });
      let rows: Row[];
      switch (table) {
        case "accounts": rows = [{ id: accountA, name: "Conta", status: "active" }]; break;
        case "account_users": rows = s.denied ? [] : [{ account_id: accountA, user_id: "actor", role: s.role ?? "owner", status: "active" }]; break;
        case "account_taxonomy": rows = [{ account_id: accountA, taxon_id: taxon.id, is_primary: true, status: "active" }]; break;
        case "business_taxons": rows = [{ ...taxon, is_active: true, parent_id: null }]; break;
        case "account_landing_pages": rows = pages; break;
        case "account_landing_page_materializations": rows = revisions; break;
        case "account_landing_page_shared_configurations": rows = s.residence === "bootstrap" ? [] : [{ account_id: accountA, catalog_version: s.residence === "historical" ? 5 : 6, revision: 2, values: split.sharedValues }]; break;
        case "account_landing_page_onboarding_configurations": rows = [{ account_id: accountA, landing_page_id: pageId(1), values: s.residence === "bootstrap" ? values : {} }]; break;
        case "account_landing_page_configurations": rows = s.residence === "bootstrap" ? [] : pages.map(p => ({ landing_page_id: p.id, account_id: p.account_id, catalog_version: s.residence === "historical" ? 5 : 6, revision: 1, values: split.landingPageValues })); break;
        default: throw new Error(`Unexpected table ${table}`);
      }
      for (const [key, filter] of q) {
        if (filter.startsWith("eq.")) rows = rows.filter(row => String(row[key]) === filter.slice(3));
        if (filter.startsWith("in.(")) rows = rows.filter(row => filter.slice(4, -1).split(",").includes(String(row[key])));
      }
      const order = q.get("order");
      if (order) rows = [...rows].sort((a, b) => {
        for (const term of order.split(",")) {
          const [key, dir] = term.split(".");
          if (a[key] !== b[key]) return (a[key] < b[key] ? -1 : 1) * (dir === "desc" ? -1 : 1);
        }
        return 0;
      });
      const count = rows.length;
      rows = rows.slice(Number(q.get("offset") ?? 0), Number(q.get("offset") ?? 0) + Number(q.get("limit") ?? rows.length));
      const select = q.get("select") ?? "";
      if (table === "account_landing_pages" && select.includes("latest:")) {
        assert.ok(select.includes("latest:account_landing_page_materializations!account_landing_page_materializations_landing_page_fkey("));
        assert.ok(select.includes("approved:account_landing_page_materializations!account_landing_pages_approved_materialization_fkey("));
        assert.ok(!select.includes("!inner"));
        assert.equal(q.get("latest.order"), "revision_number.desc");
        assert.equal(q.get("latest.limit"), "1");
        assert.ok(!/content_json|snapshot|\*/.test(select));
        rows = rows.map(p => {
          const related = revisions.filter(r => r.account_id === p.account_id && r.landing_page_id === p.id);
          const latest = related.sort((a, b) => b.revision_number - a.revision_number).slice(0, Number(q.get("latest.limit"))).map(metadata);
          const approved = related.find(r => r.id === p.approved_materialization_id);
          return { ...p, latest, approved: approved ? metadata(approved) : null };
        });
        for (const p of rows) {
          revisionRows += p.latest.length + Number(p.approved !== null);
          revisionBytes += Buffer.byteLength(JSON.stringify([p.latest, p.approved]));
        }
        if (s.fault === "approved_shape" && rows[0]) rows[0].approved = [];
        if (s.fault === "approved_metadata" && rows[0]?.approved) rows[0].approved.revision_number = 0;
        if (s.fault === "latest_shape" && rows[0]) rows[0].latest = {};
        if (s.fault === "latest_many" && rows[0]) rows[0].latest.push(rows[0].latest[0]);
        if (s.fault === "latest_metadata" && rows[0]?.latest[0]) rows[0].latest[0].revision_number = 0;
        if (s.fault === "latest_tenant" && rows[0]?.latest[0]) rows[0].latest[0].account_id = accountB;
        if (s.fault === "latest_lp" && rows[0]?.latest[0]) rows[0].latest[0].landing_page_id = pageId(999);
        if (s.fault === "approved_missing" && rows[0]) rows[0].approved = null;
        if (s.fault === "approved_tenant" && rows[0]?.approved) rows[0].approved.account_id = accountB;
        if (s.fault === "approved_lp" && rows[0]?.approved) rows[0].approved.landing_page_id = pageId(999);
        if (s.fault === "approved_pointer" && rows[0]?.approved) rows[0].approved.id = revisionId(999, 1);
      }
      if (table === "account_landing_page_materializations") {
        rows = rows.map(r => Object.fromEntries(select.split(",").map(k => [k, r[k]])));
        revisionRows += rows.length;
        revisionBytes += Buffer.byteLength(JSON.stringify(rows));
        if (s.fault === "latest_metadata" && q.has("order") && rows[0]) rows[0].revision_number = 0;
        if (s.fault === "approved_missing" && q.has("id")) rows = [];
      }
      if (s.fault === "page_tenant" && table === "account_landing_pages" && rows[0]) rows[0] = { ...rows[0], account_id: accountB };
      const headers = new Headers({ "content-type": "application/json" });
      if (s.fault !== "count_missing" && new Headers(init?.headers).get("prefer")?.includes("count=exact")) headers.set("content-range", `0-${Math.max(0, rows.length - 1)}/${count}`);
      // maybeSingle GET is normalized by supabase-js itself from this array.
      return new Response(JSON.stringify(s.fault === "page_shape" && table === "account_landing_pages" ? {} : rows), { status: 200, headers });
    } },
  });
  const imports: Record<string, unknown> = {
    "server-only": {},
    "../../supabase/service": { createServiceClient: () => client },
    "../../supabase/server": { createClient: async () => ({ auth: { getUser: async () => { boundaryCalls.push("auth"); return { data: { user: s.authenticated === false ? null : { id: "actor" } }, error: null }; } } }) },
    "../../commercial-entitlements": { getCommercialEntitlementSignal: async () => { boundaryCalls.push("entitlement"); return { isCommerciallyEligible: s.entitled !== false, planKey: "starter" }; } },
    "../../conversion-content/adapters/selectedEndCustomerResearchAdapter": { loadTaxonPreparationForCurrentVersion: async () => { boundaryCalls.push("preparation"); return { ok: s.prepared !== false, value: { effectiveInputCatalogVersion: 6 } }; } },
    "./landingPagesAdapter": { createAccountLandingPage: () => { throw new Error("No mutations in listing QA"); } },
    "../onboardingConfiguration": core,
  };
  const exports = {} as typeof import("./adapters/landingPageWorkspaceAdapter");
  runInThisContext(`(function(require, exports) { ${compiled}\n})`)((id: string) => Object.hasOwn(imports, id) ? imports[id] : requireAdapter(id), exports);
  const previous = process.env.E19_5_WORKSPACE_ENABLED;
  process.env.E19_5_WORKSPACE_ENABLED = s.gate === false ? "false" : "true";
  try {
    const output = await exports.listAccountLandingPageWorkspace({ accountId: accountA, cursor: s.cursor });
    const detail = s.detailCursor === undefined ? undefined : await exports.getAccountLandingPageWorkspaceDetail({ accountId: accountA, landingPageId: pageId(1), historyCursor: s.detailCursor });
    return { output, detail, calls: calls.map(u => u.href), boundaryCalls, revisionRows, revisionBytes };
  } finally {
    if (previous === undefined) delete process.env.E19_5_WORKSPACE_ENABLED;
    else process.env.E19_5_WORKSPACE_ENABLED = previous;
  }
}


async function validateWorkspaceReads() {
  for (const size of [0, 1, 25]) {
    for (const approval of ["none", "mixed", "all", "latest"] as const) {
      for (const history of [0, 1, 101]) {
        if (history === 0 && approval !== "none") continue;
        const result = await exercise({ size, approval, history, complete: true });
        assert.equal(result.output.ok, true);
        if (!result.output.ok) throw new Error("workspace unavailable");
        assert.equal(result.calls.length, size === 0 ? 7 : 8);
        assert.deepEqual(result.boundaryCalls, ["auth", "entitlement", "preparation"]);
        assert.equal(result.calls.filter(u => new URL(u).pathname.endsWith("/account_landing_page_materializations")).length, 0);
        assert.ok(result.revisionRows <= size * 2);
        assert.ok(result.revisionBytes <= size * 450);
        assert.equal(result.output.page.items.length, size);
        assert.equal(result.output.page.complete, true);
        assert.equal(result.output.page.nextCursor, null);
        for (const [index, item] of result.output.page.items.entries()) {
          const i = index + 1;
          const approved = approval === "all" || approval === "latest" || (approval === "mixed" && i % 2 === 0);
          assert.deepEqual(item, {
            id: pageId(i), accountId: accountA, name: `LP ${i}`, slug: `lp-${i}`,
            status: i % 2 ? "draft" : "active", updatedAt: "2026-08-30T10:00:00Z",
            latestRevision: history ? { id: revisionId(i, history), number: history, createdAt: new Date(Date.UTC(2026, 0, 1) - (history - 1) * 1000).toISOString() } : null,
            approvedRevision: approved ? { id: revisionId(i, approval === "latest" ? history : 1), number: approval === "latest" ? history : 1 } : null,
            state: !history ? "ready_to_generate" : !approved ? "in_review" : approval === "latest" || history === 1 ? "delivered" : "new_version_in_review",
          });
        }
      }
    }
  }
  for (const role of ["viewer", "owner", "admin"]) {
    const result = await exercise({ size: 1, role });
    assert.equal(result.output.ok, true);
    if (result.output.ok) {
      assert.equal(result.output.canMutate, role !== "viewer");
      assert.equal(result.output.page.items[0].state, "configuration_incomplete");
    }
  }
  for (const residence of ["bootstrap", "historical"] as const) {
    const result = await exercise({ size: 1, residence, history: 1, approval: "latest", complete: true });
    assert.equal(result.output.ok, true);
    if (result.output.ok) assert.equal(result.output.page.items[0].state, "delivered");
  }
  const dated = await exercise({ size: 3, differentDates: true });
  assert.equal(dated.output.ok, true);
  if (dated.output.ok) assert.deepEqual(dated.output.page.items.map(item => item.id), [pageId(2), pageId(1), pageId(3)]);
  for (const cursor of [undefined, "25", "26"]) {
    const result = await exercise({ size: 26, cursor, approval: "all" });
    assert.equal(result.output.ok, true);
    if (!result.output.ok) throw new Error("workspace unavailable");
    assert.equal(result.output.page.items.length, cursor === undefined ? 25 : cursor === "25" ? 1 : 0);
    assert.equal(result.output.page.nextCursor, cursor === undefined ? "25" : null);
    assert.equal(result.output.page.complete, cursor !== undefined);
    if (cursor === "25") assert.equal(result.output.page.items[0].id, pageId(26));
  }
  for (const cursor of ["-1", "x", "9007199254740992"]) {
    const result = await exercise({ size: 1, cursor });
    assert.deepEqual(result.output, { ok: false, error: "unavailable" });
    assert.equal(result.calls.filter(u => new URL(u).pathname.endsWith("/account_landing_pages")).length, 0);
  }
  for (const [scenario, error] of [
    [{ gate: false }, "disabled"], [{ authenticated: false }, "unauthenticated"],
    [{ denied: true }, "unauthorized"], [{ entitled: false }, "unauthorized"],
    [{ prepared: false }, "unavailable"],
  ] as const) {
    const result = await exercise({ size: 25, ...scenario });
    assert.deepEqual(result.output, { ok: false, error });
    assert.equal(result.calls.filter(u => new URL(u).pathname.endsWith("/account_landing_pages")).length, 0);
  }
  for (const fault of [
    "accounts", "account_users", "account_landing_pages", "count_missing",
    "account_landing_page_shared_configurations", "account_landing_page_configurations",
    "account_landing_page_onboarding_configurations", "page_shape", "page_tenant",
    "latest_shape", "latest_many", "latest_tenant", "latest_lp",
    "approved_missing", "approved_tenant", "approved_lp", "approved_pointer", "approved_shape", "approved_metadata",
  ]) {
    const result = await exercise({ size: 1, approval: "all", fault });
    assert.deepEqual(result.output, { ok: false, error: "unavailable" }, fault);
  }
  const malformedLatest = await exercise({ size: 1, fault: "latest_metadata", complete: true });
  assert.equal(malformedLatest.output.ok, true);
  if (malformedLatest.output.ok) assert.equal(malformedLatest.output.page.items[0].latestRevision, null);
  const detail = await exercise({ size: 1, approval: "all", history: 101, detailCursor: "25", complete: true });
  assert.equal(detail.detail?.ok, true);
  if (detail.detail?.ok) {
    assert.equal(detail.detail.revisions.items.length, 25);
    assert.equal(detail.detail.revisions.items[0].number, 76);
    assert.equal(detail.detail.revisions.nextCursor, "50");
    assert.equal(detail.detail.landingPage.latestRevision?.number, 101);
    assert.equal(detail.detail.landingPage.approvedRevision?.number, 1);
  }
  assert.equal(detail.calls.filter(u => new URL(u).pathname.endsWith("/account_landing_page_materializations")).length, 3);
  console.log("ok - workspace real adapter: bounded requests, metadata, paging, tenants, states, failures and unchanged detail");
}

async function runWorkspaceValidation() {
  for (const validationCase of cases) {
    validationCase.run();
    console.log(`ok - ${validationCase.name}`);
  }
  await validateWorkspaceReads();
}
void runWorkspaceValidation().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
