import assert from "node:assert/strict";
import { readFileSync, writeFileSync } from "node:fs";
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
type Scenario = { identity?: IdentityScenario; size: number; approval?: "none" | "mixed" | "all" | "latest"; history?: number; cursor?: string; role?: string; denied?: boolean; gate?: boolean; authenticated?: boolean; fault?: string; complete?: boolean; entitled?: boolean; prepared?: boolean; residence?: "bootstrap" | "historical"; detailCursor?: string; differentDates?: boolean };
const source = readFileSync(adapterPath, "utf8");
const compiled = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, esModuleInterop: true } }).outputText;

// Test-only module boundary: execute the unmodified adapter, real domain resolvers,
// and real supabase-js URL builder; replace only external I/O. No production seam.
async function exercise<S extends Scenario>(s: S) {
  const fixtureAccountId = s.identity?.uuidLetters ? "abcdefab-cdef-4abc-8def-abcdefabcdef" : accountA;
  const fixturePageId = s.identity?.uuidLetters
    ? (i: number) => "abcdefab-cdef-4abc-8def-" + String(i).padStart(12, "0")
    : pageId;
  const calls: URL[] = [];
  const boundaryCalls: string[] = [];
  const writerCalls: Row[] = [];
  let ownWrites = 0;
  let concurrent = false;
  let revisionRows = 0;
  let revisionBytes = 0;
  const pages: Row[] = Array.from({ length: s.size }, (_, n) => {
    const i = n + 1;
    return { id: fixturePageId(i), account_id: fixtureAccountId, name: `LP ${i}`, slug: `lp-${i}`, status: i % 2 ? "draft" : "active", updated_at: s.differentDates && i === 2 ? "2026-08-31T10:00:00Z" : "2026-08-30T10:00:00Z", approved_materialization_id: s.approval === "all" || s.approval === "latest" || (s.approval === "mixed" && i % 2 === 0) ? revisionId(i, s.approval === "latest" ? s.history ?? 101 : 1) : null };
  }).reverse();
  pages.push({ id: fixturePageId(999), account_id: accountB, name: "Other tenant", slug: "other", status: "draft", updated_at: "2026-08-31T10:00:00Z", approved_materialization_id: null });
  pages.push({ id: fixturePageId(998), account_id: fixtureAccountId, name: "Archived", slug: "archived", status: "archived", updated_at: "2026-08-31T10:00:00Z", approved_materialization_id: null });
  const revisions: Row[] = pages.flatMap((p) => Array.from({ length: s.identity?.snapshots.length ?? s.history ?? 101 }, (_, n) => ({
    id: revisionId(Number(p.id.slice(-12)), n + 1), landing_page_id: p.id, account_id: p.account_id, revision_number: n + 1,
    // Deliberately reverse chronological dates: revision number is the authority.
    created_at: new Date(Date.UTC(2026, 0, 1) - n * 1000).toISOString(),
    content_json: { forbidden: "x".repeat(1024) }, generation_context_snapshot_json: s.identity ? s.identity.snapshots[n] : { forbidden: "x".repeat(1024) },
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
  if (s.identity?.next) Object.assign(rawValues, s.identity.next);
  const resolvedCatalog = catalog.resolveLandingPageInputCatalog({ version: 6, plan: "starter", taxonChain: { segment: taxon } });
  assert.equal(resolvedCatalog.ok, true);
  const values = Object.fromEntries(resolvedCatalog.value.fields.filter((f: { fieldKey: string }) => Object.hasOwn(rawValues, f.fieldKey)).map((f: { fieldKey: string; valueScope: string }) => [f.fieldKey, { scope: f.valueScope, value: rawValues[f.fieldKey] }]));
  const split = requireAdapter("../landingPageWorkspace").splitLandingPageWorkspaceValues(values);
  const currentValues = { ...split.landingPageValues };
  if (s.identity?.missingCurrentScope) delete currentValues.landing_page_offering_scope;
  else if (s.identity?.currentScope !== undefined) currentValues.landing_page_offering_scope = { scope: "landing_page", value: s.identity.currentScope };
  const client = createTestClient("https://workspace.test", "test-only-key", {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: async (input, init) => {
      const url = new URL(String(input));
      calls.push(url);

      const table = url.pathname.split("/").pop()!;
      const q = url.searchParams;
      if (s.fault === table) return new Response(JSON.stringify({ message: "fixture read error" }), { status: 500 });
      if (url.pathname.includes("/rpc/")) {
        assert.equal(init?.method, "POST");
        const payload = JSON.parse(String(init?.body));
        assert.equal(payload.p_account_id.toLowerCase(), fixtureAccountId);
        assert.equal(payload.p_landing_page_id.toLowerCase(), fixturePageId(1));
        if (table === "read_account_landing_page_identity_baselines_v1") {
          const history = revisions.filter(r => r.account_id === payload.p_account_id.toLowerCase() && r.landing_page_id === payload.p_landing_page_id.toLowerCase());
          let selected: unknown = selectIdentityRows(history);
          const rows = selected as Row[];
          concurrent = s.identity?.interleave !== undefined;
          switch (s.identity?.rpcFault) {
            case "error": return new Response(JSON.stringify({ code: "PGRST202", message: "RPC not applied" }), { status: 404 });
            case "throw": throw new Error("fixture transport");
            case "object": selected = {}; break;
            case "null": selected = null; break;
            case "many": selected = Array(5).fill(rows[0]); break;
            case "duplicate": rows.push(rows[0]); break;
            case "reverse": rows.reverse(); break;
            case "id": rows[0].id = "invalid"; break;
            case "tenant": rows[0].account_id = accountB; break;
            case "lp": rows[0].landing_page_id = fixturePageId(999); break;
            case "revision": rows[0].revision_number = 0; break;
            case "fraction": rows[0].revision_number = 1.5; break;
            case "unsafe": rows[0].revision_number = Number.MAX_SAFE_INTEGER + 1; break;
            case "snapshot": rows[0].generation_context_snapshot_json = []; break;
            case "missing_snapshot": delete rows[0].generation_context_snapshot_json; break;
            case "token": rows[0].latest_materialization_id = revisionId(999, 1); break;
            case "token_missing": delete rows[0].latest_materialization_id; break;
          }
          revisionRows += Array.isArray(selected) ? selected.length : 0;
          revisionBytes += Buffer.byteLength(JSON.stringify(selected));
          return new Response(JSON.stringify(selected), { status: 200 });
        }
        assert.equal(table, "save_account_landing_page_configuration_v1");
        writerCalls.push(payload);
        const currentLatest = s.identity?.interleave === "append" && concurrent ? revisionId(1, 9999) : revisions.filter(r => r.account_id === fixtureAccountId && r.landing_page_id === fixturePageId(1)).at(-1)?.id ?? null;
        const sharedRevision = concurrent && s.identity?.interleave === "shared" ? 3 : 2;
        const lpRevision = concurrent && s.identity?.interleave === "lp" ? 2 : 1;
        if (payload.p_expected_latest_materialization_id !== currentLatest || payload.p_expected_shared_revision !== sharedRevision || payload.p_expected_landing_page_revision !== lpRevision) {
          return new Response(JSON.stringify({ code: "40001", message: "fixture revision conflict" }), { status: 409 });
        }
        ownWrites++;
        return new Response(JSON.stringify([{ shared_revision: 2, landing_page_revision: 1 }]), { status: 200 });
      }
      assert.equal(init?.method, "GET");
      let rows: Row[];
      switch (table) {
        case "accounts": rows = [{ id: fixtureAccountId, name: "Conta", status: "active" }]; break;
        case "account_users": rows = s.denied ? [] : [{ account_id: fixtureAccountId, user_id: "actor", role: s.role ?? "owner", status: "active" }]; break;
        case "account_taxonomy": rows = [{ account_id: fixtureAccountId, taxon_id: taxon.id, is_primary: true, status: "active" }]; break;
        case "business_taxons": rows = [{ ...taxon, is_active: true, parent_id: null }]; break;
        case "account_landing_pages": rows = pages; break;
        case "account_landing_page_materializations": rows = revisions; break;
        case "account_landing_page_shared_configurations": rows = s.residence === "bootstrap" ? [] : [{ account_id: fixtureAccountId, catalog_version: s.residence === "historical" ? 5 : 6, revision: 2, values: split.sharedValues }]; break;
        case "account_landing_page_onboarding_configurations": rows = [{ account_id: fixtureAccountId, landing_page_id: fixturePageId(1), values: s.residence === "bootstrap" ? values : {} }]; break;
        case "account_landing_page_configurations": rows = s.residence === "bootstrap" ? [] : pages.map(p => ({ landing_page_id: p.id, account_id: p.account_id, catalog_version: s.residence === "historical" ? 5 : 6, revision: 1, values: s.identity ? currentValues : split.landingPageValues })); break;
        default: throw new Error(`Unexpected table ${table}`);
      }
      for (const [key, filter] of q) {
        if (filter.startsWith("eq.")) {
          // PostgreSQL uuid equality ignores case; transport still returns lowercase.
          const value = filter.slice(3);
          rows = rows.filter(row => ["id", "account_id", "landing_page_id"].includes(key)
            ? String(row[key]).toLowerCase() === value.toLowerCase()
            : String(row[key]) === value);
        }
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
        if (s.fault === "latest_lp" && rows[0]?.latest[0]) rows[0].latest[0].landing_page_id = fixturePageId(999);
        if (s.fault === "approved_missing" && rows[0]) rows[0].approved = null;
        if (s.fault === "approved_tenant" && rows[0]?.approved) rows[0].approved.account_id = accountB;
        if (s.fault === "approved_lp" && rows[0]?.approved) rows[0].approved.landing_page_id = fixturePageId(999);
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
  runInThisContext(`(function(require, exports) { ${s.identity?.baseline ? baselineCompiled : compiled}\n})`)((id: string) => Object.hasOwn(imports, id) ? imports[id] : requireAdapter(id), exports);
  const previous = process.env.E19_5_WORKSPACE_ENABLED;
  process.env.E19_5_WORKSPACE_ENABLED = s.gate === false ? "false" : "true";
  try {
    const output = s.identity
      ? await exports.saveAccountLandingPageOperationalConfiguration({
          accountId: s.identity.accountId ?? fixtureAccountId, landingPageId: s.identity.landingPageId ?? fixturePageId(1), values,
          expectedSharedRevision: 2, expectedLandingPageRevision: 1, sameCommercialWorkConfirmed: s.identity.sameWork,
        })
      : await exports.listAccountLandingPageWorkspace({ accountId: fixtureAccountId, cursor: s.cursor });
    const detail = s.detailCursor === undefined ? undefined : await exports.getAccountLandingPageWorkspaceDetail({ accountId: fixtureAccountId, landingPageId: fixturePageId(1), historyCursor: s.detailCursor });
    return { output: output as S extends { identity: IdentityScenario } ? Awaited<ReturnType<typeof exports.saveAccountLandingPageOperationalConfiguration>> : Awaited<ReturnType<typeof exports.listAccountLandingPageWorkspace>>, detail, writerCalls, ownWrites, calls: calls.map(u => u.href), boundaryCalls, revisionRows, revisionBytes };
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


// Frozen executable reader from a024191 (AA05), injected only into the test module.
// This is a baseline, never a runtime fallback. Keep the canonical evaluator real.
const originalIdentityReader = String.raw`async function validateIdentityMutation(
  client: ServiceClient,
  input: Readonly<{
    accountId: string;
    landingPageId: string;
    values: AccountLandingPageOnboardingStoredValues;
    sameCommercialWorkConfirmed: boolean;
  }>,
): Promise<
  | Readonly<{ ok: true; latestMaterializationId: string | null }>
  | Readonly<{
      ok: false;
      result: Extract<SaveAccountLandingPageOperationalConfigurationResult, { ok: false }>;
    }>
> {
  const BASELINE_PAGE_SIZE = 100;
  const generationContextSnapshots: unknown[] = [];
  let offset = 0;
  let hasRevision = false;
  let latestMaterializationId: string | null = null;
  while (true) {
    const { data, error } = await client
      .from("account_landing_page_materializations")
      .select("id,generation_context_snapshot_json")
      .eq("account_id", input.accountId)
      .eq("landing_page_id", input.landingPageId)
      .order("revision_number", { ascending: true })
      .range(offset, offset + BASELINE_PAGE_SIZE - 1);
    if (error || !Array.isArray(data)) {
      return { ok: false, result: { ok: false, error: "unavailable" } };
    }
    if (data.length === 0) break;
    hasRevision = true;
    for (const row of data) {
      if (!isRecord(row) || typeof row.id !== "string") {
        return { ok: false, result: { ok: false, error: "unavailable" } };
      }
      latestMaterializationId = row.id;
      generationContextSnapshots.push(row.generation_context_snapshot_json);
    }
    if (data.length < BASELINE_PAGE_SIZE) break;
    offset += data.length;
  }
  const currentOfferingScope = hasRevision
    ? await readCurrentConfiguredOfferingScope(client, input.accountId, input.landingPageId)
    : undefined;
  const evaluation = evaluateLandingPageCommercialIdentityMutation({
    generationContextSnapshots,
    currentConfiguredOfferingScope: currentOfferingScope,
    values: input.values,
    sameCommercialWorkConfirmed: input.sameCommercialWorkConfirmed,
  });
  if (!evaluation.ok) return { ok: false, result: evaluation };
  return { ok: true, latestMaterializationId };
}

`;
const baselineSource = source.replace(
  /async function validateIdentityMutation\([\s\S]*?(?=async function readCurrentConfiguredOfferingScope)/,
  originalIdentityReader,
);
const baselineCompiled = ts.transpileModule(baselineSource, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, esModuleInterop: true } }).outputText;

// Use the actual private canonical reader for the oracle, not a copy of its guards.
const domainSource = readFileSync(new URL("./landingPageWorkspace.ts", import.meta.url), "utf8");
const oracleModule: Row = {};
const oracleCompiled = ts.transpileModule(domainSource + "\nexport { readSnapshotFacts };", { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } }).outputText;
runInThisContext("(function(require, exports) {" + oracleCompiled + "\n})")(
  createRequire(new URL("./landingPageWorkspace.ts", import.meta.url)), oracleModule,
);
const identityGroups = [["funnel_stage"], ["transaction_intent"], ["landing_page_offering_scope", "primary_service_or_offer"]];
function selectIdentityRows(rows: Row[]): Row[] {
  const selected = new Set<Row>();
  for (const keys of identityGroups) {
    const first = rows.find(r => oracleModule.readSnapshotFacts(r.generation_context_snapshot_json).some((f: Row) => keys.includes(f.fieldKey)));
    if (first) selected.add(first);
  }
  if (rows.length) selected.add(rows[rows.length - 1]);
  return [...selected].sort((a, b) => a.revision_number - b.revision_number).map(r => ({
    id: r.id, account_id: r.account_id, landing_page_id: r.landing_page_id,
    revision_number: r.revision_number, generation_context_snapshot_json: r.generation_context_snapshot_json,
    latest_materialization_id: rows[rows.length - 1].id,
  }));
}
type IdentityScenario = {
  snapshots: unknown[]; baseline?: boolean; sameWork?: boolean; next?: Row;
  currentScope?: unknown; missingCurrentScope?: boolean; interleave?: "append" | "shared" | "lp";
  rpcFault?: string; accountId?: string; landingPageId?: string; uuidLetters?: boolean;
};
const validIdentitySnapshot = generationContextSnapshot([
  { fieldKey: "funnel_stage", value: "bofu" },
  { fieldKey: "transaction_intent", value: "buy" },
  { fieldKey: "primary_service_or_offer", value: "Consultoria" },
]);
const identityShapes: unknown[] = [
  {}, { generationContext: {} }, { generationContext: [] },
  { generationContext: { modelContext: [] } },
  { generationContext: { modelContext: { facts: null }, bindingFacts: [{ fieldKey: "funnel_stage", value: "tofu" }] } },
  { generationContext: { bindingFacts: [{ fieldKey: "primary_service_or_offer", value: null }] } },
  { generationContext: { modelContext: { facts: {} }, bindingFacts: [{ fieldKey: "transaction_intent", value: "rent" }] } },
  generationContextSnapshot([]),
  ...identityGroups.flatMap(keys => keys.flatMap(fieldKey => [
    ...["model", "binding"].map(location => {
      const facts = [
        {}, null, { value: "ignored" }, { fieldKey: [fieldKey], value: "ignored" },
        [{ fieldKey, value: "ignored" }], { fieldKey },
        { fieldKey, value: fieldKey === "funnel_stage" ? "bofu" : fieldKey === "transaction_intent" ? "buy" : fieldKey === "primary_service_or_offer" ? "Consultoria" : { mode: "single", offerings: ["Consultoria"] } },
      ];
      return { generationContext: { modelContext: { facts: location === "model" ? facts : [] }, bindingFacts: location === "binding" ? facts : [] } };
    }),
    generationContextSnapshot([{ fieldKey, value: null }]),
    { generationContext: { modelContext: { facts: [{ fieldKey }] } } },
    { generationContext: { modelContext: { facts: [[{ fieldKey, value: "invalid" }]] } } },
    { generationContext: { modelContext: { facts: [{ fieldKey: [fieldKey], value: "invalid" }] } } },
    { generationContext: { modelContext: { facts: [{ fieldKey: { name: fieldKey }, value: "invalid" }] } } },
    { generationContext: { modelContext: { facts: [] }, bindingFacts: [{ fieldKey, value: null }] } },
    { generationContext: { modelContext: { facts: [] }, bindingFacts: { fieldKey, value: null } } },
  ])),
  generationContextSnapshot([{ fieldKey: "funnel_stage", value: "bofu" }, { fieldKey: "funnel_stage", value: "tofu" }]),
  generationContextSnapshot([{ fieldKey: "transaction_intent", value: "buy" }, { fieldKey: "transaction_intent", value: "rent" }]),
  generationContextSnapshot([{ fieldKey: "primary_service_or_offer", value: "Consultoria" }, { fieldKey: "landing_page_offering_scope", value: null }]),
  generationContextSnapshot([{ fieldKey: "landing_page_offering_scope", value: null }, { fieldKey: "primary_service_or_offer", value: "Consultoria" }]),
  { generationContext: { modelContext: { facts: [{ fieldKey: "funnel_stage", value: "tofu" }] }, bindingFacts: [{ fieldKey: "funnel_stage", value: "bofu" }] } },
  generationContextSnapshot([{ fieldKey: "primary_conversion_goal", value: "purchase" }]),
  generationContextSnapshot([{ fieldKey: "landing_page_offering_scope", value: { mode: "single", offerings: ["Consultoria"] } }]),
  generationContextSnapshot([{ fieldKey: "funnel_stage", value: { a: 1, b: 2 } }]),
  generationContextSnapshot([{ fieldKey: "transaction_intent", value: ["buy"] }]),
  validIdentitySnapshot,
];
function identityHistories(): unknown[][] {
  const histories: unknown[][] = [[], [{}], [validIdentitySnapshot]];
  for (const shape of identityShapes) {
    histories.push([shape], [{}, shape, validIdentitySnapshot], [validIdentitySnapshot, shape], [shape, {}, ...identityShapes.slice(0, 8), validIdentitySnapshot]);
  }
  for (let seed = 0; seed < 100; seed++) {
    histories.push(Array.from({ length: 7 }, (_, n) => identityShapes[(seed * 17 + n * 13) % identityShapes.length]));
  }
  return histories;
}
async function validateIdentityReads() {
  let comparisons = 0;
  for (const snapshots of identityHistories()) {
    for (const sameWork of [false, true]) {
      for (const next of [{}, { funnel_stage: "tofu" }, { transaction_intent: "rent" }, { landing_page_offering_scope: { mode: "single", offerings: ["Outra"] } }]) {
        const spec = { size: 1, complete: true, history: snapshots.length, identity: { snapshots, sameWork, next } };
        const old = await exercise({ ...spec, identity: { ...spec.identity, baseline: true } });
        const current = await exercise(spec);
        assert.deepEqual(current.output, old.output, "complete save result parity " + comparisons);
        assert.deepEqual(current.writerCalls, old.writerCalls, "latest token and writer payload parity");
        assert.ok(current.revisionRows <= 4);
        assert.equal(current.calls.filter(u => u.includes("/rpc/read_account_landing_page_identity_baselines_v1")).length, 1);
        assert.equal(current.calls.filter(u => new URL(u).pathname.endsWith("/account_landing_page_materializations")).length, 0);
        comparisons++;
      }
    }
  }
  for (const n of [0, 1, 7, 100, 101, 1001]) {
    // First occurrences are late and in distinct revisions; bytes include realistic ballast.
    const snapshots = Array.from({ length: n }, (_, i) => ({
      ...generationContextSnapshot(
        i === Math.max(0, n - 4) ? [{ fieldKey: "funnel_stage", value: "bofu" }] :
        i === Math.max(0, n - 3) ? [{ fieldKey: "transaction_intent", value: "buy" }] :
        i === Math.max(0, n - 2) ? [{ fieldKey: "primary_service_or_offer", value: "Consultoria" }] : []),
      ballast: "x".repeat(40000),
    }));
    const spec = { size: 1, complete: true, history: n, identity: { snapshots } };
    const old = await exercise({ ...spec, identity: { ...spec.identity, baseline: true } });
    const current = await exercise(spec);
    assert.deepEqual(current.output, old.output);
    assert.deepEqual(current.writerCalls, old.writerCalls);
    const oldQueries = old.calls.filter(u => new URL(u).pathname.endsWith("/account_landing_page_materializations")).length;
    assert.equal(oldQueries, Math.floor(n / 100) + 1);
    assert.equal(current.revisionRows, Math.min(n, 4));
    console.log("AA06 metrics " + JSON.stringify({ n, oldQueries, newQueries: 1, oldRows: old.revisionRows, newRows: current.revisionRows, oldBytes: old.revisionBytes, newBytes: current.revisionBytes }));
  }
  for (const current of [
    { missingCurrentScope: true }, { currentScope: { mode: "single", offerings: ["Atual"] } },
  ]) {
    for (const complete of [true, false]) {
      for (const sameWork of [true, false]) {
        const identity = { snapshots: [validIdentitySnapshot], sameWork, ...current };
        const old = await exercise({ size: 1, complete, identity: { ...identity, baseline: true } });
        const result = await exercise({ size: 1, complete, identity });
        assert.deepEqual(result.output, old.output);
        assert.deepEqual(result.writerCalls, old.writerCalls);
      }
    }
  }
  const uuidSpellings = (value: string) => [value, value.toUpperCase(), value.replace(/[a-f]/g, (letter, index) => index % 2 ? letter.toUpperCase() : letter)];
  let uuidComparisons = 0;
  for (const accountId of uuidSpellings("abcdefab-cdef-4abc-8def-abcdefabcdef")) {
    for (const landingPageId of uuidSpellings("abcdefab-cdef-4abc-8def-000000000001")) {
      for (const snapshots of [[], [validIdentitySnapshot]]) {
        for (const next of [{}, { funnel_stage: "tofu" }]) {
          const identity = { snapshots, next, accountId, landingPageId, uuidLetters: true };
          const old = await exercise({ size: 1, complete: true, identity: { ...identity, baseline: true } });
          const current = await exercise({ size: 1, complete: true, identity });
          assert.deepEqual(current.output, old.output, "UUID spelling save parity");
          assert.deepEqual(current.writerCalls, old.writerCalls, "UUID spelling preserves writer inputs/latest");
          assert.equal(current.output.ok, snapshots.length === 0 || !Object.hasOwn(next, "funnel_stage"));
          uuidComparisons++;
        }
      }
      for (const rpcFault of ["tenant", "lp"]) {
        const result = await exercise({ size: 1, complete: true, identity: {
          snapshots: [validIdentitySnapshot], accountId, landingPageId, uuidLetters: true, rpcFault,
        } });
        assert.deepEqual(result.output, { ok: false, error: "unavailable" }, "UUID normalization must preserve tenant/LP rejection");
        assert.equal(result.writerCalls.length, 0);
      }
    }
  }
  console.log("ok - AA06 UUID casing: " + uuidComparisons + " old/new comparisons; lowercase DB rows, account/LP separate and combined; 18 mismatches rejected");
  for (const interleave of ["append", "shared", "lp"] as const) {
    const result = await exercise({ size: 1, complete: true, identity: { snapshots: [validIdentitySnapshot], interleave } });
    assert.deepEqual(result.output, { ok: false, error: "revision_conflict" });
    assert.equal(result.writerCalls.length, 1);
    assert.equal(result.ownWrites, 0, "conflict must have no partial effects");
  }
  for (const rpcFault of ["error", "throw", "object", "null", "many", "duplicate", "reverse", "id", "tenant", "lp", "revision", "fraction", "unsafe", "snapshot", "missing_snapshot", "token", "token_missing"]) {
    const result = await exercise({ size: 1, complete: true, identity: { snapshots: [validIdentitySnapshot, {}], rpcFault } });
    assert.deepEqual(result.output, { ok: false, error: "unavailable" }, rpcFault);
    assert.equal(result.writerCalls.length, 0);
  }
  for (const [spec, error] of [
    [{ gate: false }, "disabled"], [{ authenticated: false }, "unauthenticated"],
    [{ denied: true }, "unauthorized"], [{ entitled: false }, "unauthorized"],
    [{ role: "viewer" }, "unauthorized"], [{ prepared: false }, "unavailable"],
    [{ fault: "account_users" }, "unavailable"], [{ fault: "account_landing_page_configurations" }, "unavailable"],
  ] as const) {
    const result = await exercise({ size: 1, complete: true, ...spec, identity: { snapshots: [validIdentitySnapshot] } });
    assert.deepEqual(result.output, { ok: false, error }, JSON.stringify(spec));
    assert.equal(result.writerCalls.length, 0);
  }
  const mismatch = await exercise({ size: 1, complete: true, identity: { snapshots: [validIdentitySnapshot], accountId: accountB } });
  assert.deepEqual(mismatch.output, { ok: false, error: "unauthorized" });
  assert.equal(mismatch.writerCalls.length, 0);
  console.log("ok - AA06 identity: " + comparisons + " full adapter old/new comparisons; bounded reads, shape guards, current scope, tokens and simulated interleavings (not two PostgreSQL sessions)");
}



const identityMigrationPath = "../../supabase/migrations/20260830201842_e19_identity_baselines.sql";
function identitySqlBody(): string {
  const migration = readFileSync(new URL(identityMigrationPath, import.meta.url), "utf8");
  return migration.split("$function$")[1].trim().replace(/;$/, "");
}
function buildIdentitySqlTest(): string {
  const shapes = identityShapes.map(s => JSON.stringify(s));
  const cases = identityHistories().map((history, i) => {
    const rows = history.map((s, n) => ({ id: revisionId(i + 1, n + 1), account_id: accountA, landing_page_id: pageId(i + 1), revision_number: n + 1, generation_context_snapshot_json: s }));
    return { case_number: i + 1, shape_indexes: history.map(s => shapes.indexOf(JSON.stringify(s))), expected: selectIdentityRows(rows).map(r => r.revision_number) };
  });
  assert.ok(cases.every(c => c.shape_indexes.every(n => n >= 0)));
  const body = identitySqlBody().replaceAll("public.account_landing_page_materializations", "history").replaceAll("p_account_id", "targets.account_id").replaceAll("p_landing_page_id", "targets.landing_page_id");
  return "-- AA06 read-only SQL differential fixtures; no DDL/DML, works before apply.\n" +
    "-- Generated by AA06_SQL_EXPORT=1 npm run validate:landing-page-workspace.\n" +
    "-- Expected revisions come from the actual canonical JS fact reader; body comes from the migration.\n" +
    "with shapes as (select value as snapshot, (ordinality - 1)::integer as shape_index from jsonb_array_elements($shapes$" + JSON.stringify(identityShapes) + "$shapes$::jsonb) with ordinality),\n" +
    "specimens as (select * from jsonb_to_recordset($cases$" + JSON.stringify(cases) + "$cases$::jsonb) as c(case_number integer, shape_indexes jsonb, expected jsonb)),\n" +
    "targets as (select case_number, '" + accountA + "'::uuid as account_id, ('20000000-0000-4000-8000-' || lpad(case_number::text, 12, '0'))::uuid as landing_page_id, expected from specimens\n" +
    " union all select 0, '" + accountB + "'::uuid, '" + pageId(1) + "'::uuid, '[]'::jsonb),\n" +
    "history as (select md5(s.case_number::text || ':' || f.ordinality::text)::uuid as id, '" + accountA + "'::uuid as account_id,\n" +
    " ('20000000-0000-4000-8000-' || lpad(s.case_number::text,12,'0'))::uuid as landing_page_id, f.ordinality::bigint as revision_number, shapes.snapshot as generation_context_snapshot_json\n" +
    " from specimens s cross join lateral jsonb_array_elements_text(s.shape_indexes) with ordinality f(shape_index, ordinality)\n" +
    " join shapes on shapes.shape_index = f.shape_index::integer),\n" +
    "results as (select targets.case_number, targets.expected,\n" +
    " coalesce(jsonb_agg(selected.revision_number order by selected.revision_number) filter (where selected.id is not null), '[]'::jsonb) as actual,\n" +
    " count(selected.id) as snapshots,\n" +
    " coalesce(bool_and(selected.account_id = targets.account_id and selected.landing_page_id = targets.landing_page_id and selected.latest_materialization_id = (select h.id from history h where h.account_id = targets.account_id and h.landing_page_id = targets.landing_page_id order by h.revision_number desc limit 1)), true) as tenant_and_latest\n" +
    " from targets left join lateral (\n" + body + "\n) selected on true group by targets.case_number, targets.expected)\n" +
    "select count(*) as cases, count(*) filter (where actual <> expected or snapshots > 4 or not tenant_and_latest) as failures,\n" +
    " max(snapshots) as max_snapshots, coalesce(jsonb_agg(case_number) filter (where actual <> expected or snapshots > 4 or not tenant_and_latest), '[]'::jsonb) as failed_cases from results;\n";
}
function validateIdentitySqlContract() {
  const test = readFileSync(new URL("../../supabase/tests/e19_identity_baselines.test.sql", import.meta.url), "utf8");
  assert.equal(test, buildIdentitySqlTest(), "versioned SQL must execute the exact migration body and current canonical oracle");
  const migration = readFileSync(new URL(identityMigrationPath, import.meta.url), "utf8");
  const predicates = [...migration.matchAll(/where (jsonb_typeof[\s\S]*?)\;/g)].map(m => m[1]);
  assert.equal(predicates.length, 3);
  for (const predicate of predicates) assert.ok(identitySqlBody().includes(predicate), "literal partial index predicate equals selection WHERE");
  assert.match(migration, /language sql\nstable\nsecurity invoker\nset search_path = pg_catalog/);
  assert.equal((migration.match(/create index /g) ?? []).length, 3);
  assert.equal((migration.match(/create function /g) ?? []).length, 1);
  assert.doesNotMatch(migration, /\bsecurity definer\b|\binclude\s*\(|\b(insert into|update public|delete from|create table|create view|alter table)\b/i);
  console.log("ok - AA06 exact SQL body, canonical oracle, literal index predicates and read-only contract");
}

async function runWorkspaceValidation() {
  for (const validationCase of cases) {
    validationCase.run();
    console.log(`ok - ${validationCase.name}`);
  }
  await validateWorkspaceReads();
  await validateIdentityReads();
  validateIdentitySqlContract();
}
if (process.env.AA06_SQL_EXPORT === "1") {
  writeFileSync(new URL("../../supabase/tests/e19_identity_baselines.test.sql", import.meta.url), buildIdentitySqlTest());
} else void runWorkspaceValidation().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
