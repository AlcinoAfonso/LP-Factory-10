import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import * as ts from "typescript";
import * as catalog from "../../../../lib/conversion-content/landing-page/input-catalog";
import * as compatibility from "../../../../lib/lp-builder/operationalCompatibility";
import * as pagination from "../../../../lib/admin/adapters/adminInputCatalogLifecyclePagination";
import * as validation from "../../../../lib/admin/adapters/adminInputCatalogLifecycleValidation";
import { fingerprintInputCatalogEvaluationContextIdentity } from "../../../../lib/conversion-content/landing-page/taxon-preparation";

const localRequire = createRequire(import.meta.url);
const root = resolve(new URL("../../../../", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1"));
const read = (path: string) => readFileSync(resolve(root, path), "utf8").replace(/\r\n/g, "\n");
const hash = (text: string) => createHash("sha256").update(text).digest("hex");
const adapterPath = "lib/admin/adapters/adminInputCatalogLifecycleAdapter.ts";
const contextPath = "lib/admin/adapters/adminInputCatalogLifecycleContext.ts";
const validationPath = "lib/admin/adapters/adminInputCatalogLifecycleValidation.ts";
const paginationPath = "lib/admin/adapters/adminInputCatalogLifecyclePagination.ts";
const baseline = read("app/admin/(protected)/estrutura-lp/__fixtures__/lifecycle-adapter-baseline.txt");
const aid = (i = 1) => `10000000-0000-4000-8000-${String(i).padStart(12, "0")}`;
const pid = (i = 1) => `20000000-0000-4000-8000-${String(i).padStart(12, "0")}`;
const taxonId = catalog.realEstateBrokerNicheTaxon.id;
const timestamp = "2026-08-30T12:00:00.000Z";
type Row = Record<string, any>;
type Data = Record<string, Row[]>;
const baseTaxons = () => [catalog.realEstateSegmentTaxon, catalog.realEstateBrokerNicheTaxon].map((t) => ({
  id: t.id, parent_id: t.parentId, level: t.level, name: t.name, slug: t.slug,
  is_active: t.isActive, reviewed_input_catalog_version: 6, selected_end_customer_research_version: 1,
}));
function data(n = 1): Data {
  return {
    business_taxons: baseTaxons(),
    accounts: Array.from({ length: n }, (_, i) => ({ id: aid(i + 1), name: " Empresa ", status: "active" })),
    v_account_commercial_entitlement_effective: Array.from({ length: n }, (_, i) => ({ account_id: aid(i + 1), plan_key: catalog.landingPageInputCatalogPlans[i % 4], is_commercially_eligible: true })),
    account_taxonomy: Array.from({ length: n }, (_, i) => ({ account_id: aid(i + 1), taxon_id: taxonId, is_primary: true, status: "active" })),
    account_landing_pages: Array.from({ length: n }, (_, i) => ({ id: pid(i + 1), account_id: aid(i + 1), status: "draft" })),
    account_landing_page_shared_configurations: Array.from({ length: n }, (_, i) => ({ account_id: aid(i + 1), values: { business_offerings_summary: { scope: "business", value: "Factual" } } })),
    account_landing_page_configurations: Array.from({ length: n }, (_, i) => ({ landing_page_id: pid(i + 1), account_id: aid(i + 1), values: { primary_conversion_goal: { scope: "landing_page", value: "contact" } } })),
    account_landing_page_onboarding_configurations: [],
  };
}
function draft(entry: any = catalog.createNextLandingPageInputCatalogDraft()): Row {
  const fp = hash(catalog.serializeLandingPageInputCatalogEntry(entry));
  return { singleton: true, base_version: entry.version - 1, target_version: entry.version,
    catalog_json: structuredClone(entry), content_fingerprint: fp, revision: 1,
    validation_fingerprint: null, validation_context_fingerprint: null,
    publication_fingerprint: null, publication_context_fingerprint: null,
    taxon_review_evidence: {}, updated_at: timestamp };
}
function evidenceIdentity(version = 7): any {
  return { taxonId, taxonSlug: catalog.realEstateBrokerNicheTaxon.slug,
    taxonChain: { segment: catalog.realEstateSegmentTaxon, niche: catalog.realEstateBrokerNicheTaxon, ultraNiche: null },
    research: { taxonSlug: catalog.realEstateBrokerNicheTaxon.slug, audienceScope: "end_customer", researchVersion: 1, relativePath: "fixture.md", content: "Factual." },
    inputCatalog: { version, plans: ["starter"], catalogs: [] } };
}
const emittedJs = new Map<string, string>();
function compile(source: string) {
  let output = emittedJs.get(source);
  if (!output) {
    output = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } }).outputText;
    emittedJs.set(source, output);
  }
  return output;
}
function harness(old: boolean, rows: Data, options: {
  draft?: Row | null;
  short?: number;
  lazy?: { n: number; one?: boolean };
  page?: (relation: string, offset: number, result: any) => any;
  beforeScan?: (scan: number, rows: Data) => void;
  beforeDraft?: (readNumber: number, current: Row | null) => Row | null | "error";
  updateError?: boolean;
  mutationMiss?: boolean;
  evidence?: boolean;
} = {}) {
  let saved = structuredClone(options.draft ?? null);
  let scans = 0, reads = 0;
  const metrics = { compatibility: 0, hashUpdates: 0, operationalHashUpdates: 0, requests: 0, emittedRows: 0, maxSetSize: 0 };
  const writes: any[] = [];
  const singletonReads: any[] = [];
  const one = data(1);
  const client = { from(relation: string) {
    const filters: Array<[string, unknown, boolean?]> = [];
    const order: string[] = [];
    let operation = "read", payload: any;
    const query: any = {
      select() { return this; }, limit() { return this; },
      order(key: string) { order.push(key); return this; },
      maxAffected(n: number) { assert.equal(n, 1); return this; },
      eq(k: string, v: unknown) { filters.push([k, v]); return this; },
      is(k: string, v: unknown) { filters.push([k, v]); return this; },
      in(k: string, v: unknown) { filters.push([k, v, true]); return this; },
      update(value: unknown) { operation = "update"; payload = value; return this; },
      insert(value: unknown) { operation = "insert"; payload = value; return this; },
      delete() { operation = "delete"; return this; },
      async range(offset: number, end: number) {
        metrics.requests += 1;
        if (relation === "business_taxons" && offset === 0) options.beforeScan?.(++scans, rows);
        const limit = Math.min(end - offset + 1, options.short ?? Infinity);
        let result: any;
        if (options.lazy && relation !== "business_taxons") {
          const { n, one: oneAccount } = options.lazy;
          const isPage = ["account_landing_pages", "account_landing_page_configurations"].includes(relation);
          const total = relation === "account_landing_page_onboarding_configurations" ? 0 : oneAccount && !isPage ? Math.min(n, 1) : n;
          // Generate only the requested page. There is no backing array of N rows.
          const page = Array.from({ length: Math.max(0, Math.min(limit, total - offset)) }, (_, j) => {
            const i = offset + j + 1, row = structuredClone(one[relation][0]);
            if (relation === "accounts") row.id = aid(i);
            else row.account_id = aid(oneAccount && isPage ? 1 : i);
            if (relation === "account_landing_pages") row.id = pid(i);
            if (relation === "account_landing_page_configurations") row.landing_page_id = pid(i);
            if (relation === "v_account_commercial_entitlement_effective") row.plan_key = catalog.landingPageInputCatalogPlans[(i - 1) % 4];
            return row;
          });
          result = { data: page, count: total, error: null };
        } else {
          const filtered = rows[relation].filter((r) => filters.every(([k, v, many]) => many ? (v as unknown[]).includes(r[k]) : r[k] === v));
          filtered.sort((a, b) => { for (const k of order) { const comparison = String(a[k]).localeCompare(String(b[k])); if (comparison) return comparison; } return 0; });
          result = { data: structuredClone(filtered.slice(offset, offset + limit)), count: filtered.length, error: null };
        }
        metrics.emittedRows += result.data.length;
        return options.page ? options.page(relation, offset, result) : result;
      },
      async maybeSingle() {
        metrics.requests += 1;
        if (operation === "read") {
          const changed = options.beforeDraft?.(++reads, structuredClone(saved));
          if (changed === "error") return { data: null, error: { code: "synthetic" } };
          if (changed !== undefined) saved = changed;
          singletonReads.push(reads);
          return { data: structuredClone(saved), error: null };
        }
        writes.push({ relation, operation, payload, filters: structuredClone(filters) });
        if (options.updateError) return { data: null, error: { code: "synthetic" } };
        if (options.mutationMiss) return { data: null, error: null };
        if (relation === "business_taxons") {
          const row = rows.business_taxons.find((r) => filters.every(([k, v]) => r[k] === v));
          if (!row) return { data: null, error: null };
          Object.assign(row, payload);
          return { data: structuredClone(row), error: null };
        }
        if (operation === "insert") {
          if (saved) return { data: null, error: { code: "23505" } };
          saved = { ...payload, updated_at: timestamp };
        } else {
          if (!saved || filters.some(([k, v]) => saved![k] !== v)) return { data: null, error: null };
          if (operation === "delete") { saved = null; return { data: { revision: 1 }, error: null }; }
          saved = { ...saved, ...payload };
        }
        return { data: structuredClone(saved), error: null };
      },
    };
    return query;
  } };
  const modules = new Map<string, any>();
  const evaluate = (source: string) => {
    const mod = { exports: {} as any };
    const fixedDate = class extends Date { constructor() { super(timestamp); } };
    const observedSet = class<T> extends Set<T> {
      add(value: T): this { super.add(value); metrics.maxSetSize = Math.max(metrics.maxSetSize, this.size); return this; }
    };
    new Function("require", "module", "exports", "Date", "Set", compile(source))(controlledRequire, mod, mod.exports, fixedDate, observedSet);
    return mod.exports;
  };
  const controlledRequire = (id: string): any => {
    if (id === "server-only") return {};
    if (id === "@/lib/supabase/service") return { createServiceClient: () => client };
    if (id === "node:crypto") return { createHash: (...args: Parameters<typeof createHash>) => {
      const h = createHash(...args);
      return { update(text: string) { metrics.hashUpdates += 1; if (text.startsWith('{"operationalConfigurations":[')) metrics.operationalHashUpdates += 1; h.update(text); return this; }, digest: (encoding: any) => h.digest(encoding) };
    } };
    if (id === "@/lp-builder/operationalCompatibility") return { ...compatibility,
      isAccountLandingPageOperationalConfigurationCompatible: (input: any) => { metrics.compatibility += 1; return compatibility.isAccountLandingPageOperationalConfigurationCompatible(input); } };
    if (id === "@/conversion-content/adapters/inputCatalogEvaluationContextAdapter") return {
      reconstructDraftInputCatalogEvaluationContext: async (input: any) => {
        assert.ok(options.evidence, "unexpected evidence IO"); return { ok: true, value: { identity: evidenceIdentity(input.inputCatalogVersion) } };
      },
      reconstructCanonicalInputCatalogEvaluationContext: async (input: any) => {
        assert.ok(options.evidence, "unexpected canonical IO"); return { ok: true, value: { identity: evidenceIdentity(input.inputCatalogVersion) } };
      },
    };
    if (id.startsWith("./adminInputCatalogLifecycle")) {
      if (!modules.has(id)) modules.set(id, evaluate(read(`lib/admin/adapters/${id.slice(2)}.ts`)));
      return modules.get(id);
    }
    if (id.startsWith("@/")) return localRequire(resolve(root, "lib", id.slice(2)));
    return localRequire(id);
  };
  const api = evaluate((old ? baseline : read(adapterPath)) + "\nexport { readCompleteLifecycleContext as inspectContext };");
  return { api, client, metrics, writes, singletonReads, get draft() { return saved; }, get scans() { return scans; } };
}

function assertFrozenOracle() {
  assert.equal(hash(baseline), "88cee168a14cd46055916943c25d7a921a57013e9591bee8dd371dea5e6e85ee", "baseline integral changed");
  const protectedFiles: Record<string, string> = {
    "lib/lp-builder/operationalCompatibility.ts": "db21de667763a79bf4157c5832297ff543a3134b32ad43ea4186180f6e6ce35c",
    "lib/lp-builder/onboardingConfiguration.ts": "3f9ea252cdd5d3c3653c4f3f78cdffa7bc84bdbee32f5c9f275a42467e3fc282",
    "lib/conversion-content/landing-page/input-catalog/draft.ts": "1c39f001d5bba1fad63fb55e1e266e4b64ae81aa411991255d2066f3c86622c5",
    "lib/conversion-content/landing-page/input-catalog/registry.ts": "9bbe6135d80465613a13813996f61c4a4822f34f1db369ce210ba2fa0681cb78",
  };
  for (const [file, expected] of Object.entries(protectedFiles)) assert.equal(hash(read(file)), expected, file);
  const helpers: Record<string, string> = {
    collectCompletePaginatedRows: "3e20bc80a44b218a5124609576028faec6fdf44f5042c9247a78fc56c9da8e9e",
    countInvalidInputCatalogOperationalConfigurations: "27e3bc23796a32d5f37f4283920ff272b6d8705b76f7a27e8865dbc506771c73",
    fingerprintInputCatalogOperationalContext: "bc69a5037aabdc92c3b8b627801b55c27d4c1b6a795c48691887000978726334",
    stableJson: "7e8e1fab10b155c3068f38a6b21a53930c3494f928d84b2f9c1a47f06a3df6cf",
    resolveInputCatalogOperationalAccountAuthorities: "bc0b9dbc0217b1034dde47854e8eb779edb409024d805b431853327732a75a8c",
  };
  for (const [name, expected] of Object.entries(helpers)) {
    const file = name === "collectCompletePaginatedRows" ? paginationPath : validationPath;
    const ast = ts.createSourceFile(file, read(file), ts.ScriptTarget.Latest, true);
    const fn = ast.statements.find((n) => ts.isFunctionDeclaration(n) && n.name?.text === name);
    assert.ok(fn); assert.equal(hash(fn.getText(ast)), expected, name);
  }
  for (const file of [adapterPath, contextPath, validationPath, paginationPath]) assert.doesNotMatch(read(file), /lifecycle-validation-cases|lifecycle-adapter-baseline/);
}

export async function validateLifecycleBoundedContracts() {
  assertFrozenOracle();
  const next = catalog.createNextLandingPageInputCatalogDraft();
  const pairedContext = async (rows: Data, options: Parameters<typeof harness>[2] = {}) => {
    const old = harness(true, structuredClone(rows), options), current = harness(false, structuredClone(rows), options);
    const expected = await old.api.inspectContext(old.client);
    const actual = await current.api.inspectContext(current.client, { fingerprint: true, prepareCandidate: (taxons: any) => catalog.validateLandingPageInputCatalogDraft({ draft: next, taxons }) });
    assert.equal(actual.ok, expected.ok);
    if (!expected.ok) { assert.deepEqual(actual, expected); return { old, current, actual }; }
    assert.deepEqual(actual.value.taxons, expected.value.taxons);
    assert.deepEqual([...actual.value.operationalTaxonIds].sort(), [...expected.value.operationalTaxonIds].sort());
    assert.equal(actual.value.operationalProof.fingerprint, validation.fingerprintInputCatalogOperationalContext(expected.value));
    const candidate = catalog.validateLandingPageInputCatalogDraft({ draft: next, taxons: expected.value.taxons });
    if (candidate.ok) {
      assert.equal(actual.value.operationalProof.invalidOperationalConfigurations, validation.countInvalidInputCatalogOperationalConfigurations(candidate.value, expected.value.operationalConfigurations));
      assert.equal(current.metrics.compatibility, expected.value.operationalConfigurations.length);
      const before = catalog.validateLandingPageInputCatalogDraft({ draft: next, taxons: expected.value.taxons.map((t: any) => ({ ...t, operational: !t.operational })) });
      assert.ok(before.ok);
      assert.deepEqual([before.value.entry, before.value.registry, before.value.canonicalJson], [candidate.value.entry, candidate.value.registry, candidate.value.canonicalJson]);
    }
    return { old, current, actual };
  };
  for (const n of [0, 500, 501]) await pairedContext(data(0), { lazy: { n } });
  await pairedContext(data(0), { lazy: { n: 501, one: true }, short: 173 });
  const scenarios: Array<[string, (d: Data) => void]> = [
    ["missing entitlement", (d) => { d.v_account_commercial_entitlement_effective = []; }],
    ["inactive unreadable payload", (d) => { d.accounts[0].status = "inactive"; d.account_landing_page_shared_configurations[0].values = null; }],
    ["ineligible", (d) => { d.v_account_commercial_entitlement_effective[0].is_commercially_eligible = false; }],
    ["noncandidate malformed account", (d) => { d.account_landing_pages = []; d.accounts[0].name = null; }],
    ["noncandidate malformed entitlement", (d) => { d.account_landing_pages = []; d.v_account_commercial_entitlement_effective[0].is_commercially_eligible = null; }],
    ["noncandidate malformed shared key", (d) => { d.account_landing_pages = []; d.account_landing_page_shared_configurations[0].account_id = null; }],
    ["noncandidate ignored shared values", (d) => { d.account_landing_pages = []; d.account_landing_page_shared_configurations[0].values = null; }],
    ["unknown plan", (d) => { d.v_account_commercial_entitlement_effective[0].plan_key = "unknown"; }],
    ["missing account", (d) => { d.accounts = []; }],
    ["missing primary", (d) => { d.account_taxonomy = []; }],
    ["invalid chain", (d) => { d.business_taxons[1].parent_id = aid(999); }],
    ["unknown field", (d) => { d.account_landing_page_configurations[0].values = { absent: { scope: "business", value: 1 } }; }],
    ["name authority collision", (d) => { d.account_landing_page_shared_configurations[0].values = { business_display_name: { scope: "business", value: "Empresa" } }; }],
    ["no configurations incomplete compatible", (d) => { d.account_landing_page_shared_configurations = []; d.account_landing_page_configurations = []; }],
    ["pre and LP", (d) => { d.account_landing_page_onboarding_configurations = [{ account_id: aid(), landing_page_id: null, values: {} }]; }],
    ["pre invalid", (d) => { d.account_landing_page_onboarding_configurations = [{ account_id: aid(), landing_page_id: null, values: null }]; }],
    ["bound excluded", (d) => { d.account_landing_pages = []; d.account_landing_page_onboarding_configurations = [{ account_id: aid(), landing_page_id: pid(), values: {} }]; }],
    ["number range", (d) => { d.v_account_commercial_entitlement_effective[0].plan_key = "pro"; d.account_landing_page_configurations[0].values = { property_price_range: { scope: "offer", value: { currency: "BRL", min: 0, max: 900000 } } }; }],
    ["inverted number range", (d) => { d.v_account_commercial_entitlement_effective[0].plan_key = "pro"; d.account_landing_page_configurations[0].values = { property_price_range: { scope: "offer", value: { currency: "BRL", min: 10, max: 1 } } }; }],
    ["empty name", (d) => { d.accounts[0].name = " "; }],
  ];
  for (const [name, change] of scenarios) { const d = data(); change(d); try { await pairedContext(d); } catch (e) { throw new Error(name, { cause: e }); } }
  // Baseline LP authority errors are ordered by global LP id, not account id.
  const inverted = data(2);
  inverted.account_landing_pages[0].id = pid(2); inverted.account_landing_pages[1].id = pid(1);
  inverted.account_landing_page_configurations = [];
  inverted.account_taxonomy[0].taxon_id = aid(999);
  inverted.business_taxons[1].parent_id = aid(998);
  const inverseResult = await pairedContext(inverted);
  assert.match(inverseResult.actual.message, /cadeia taxonômica inválida/);
  for (const change of ["transport", "count", "empty"] as const) {
    const result = await pairedContext(data(0), { lazy: { n: 501 }, page: (relation, offset, p) => {
      if (relation === "account_landing_pages" && offset > 0) return change === "transport" ? { data: null, error: {}, count: null } : { ...p, ...(change === "count" ? { count: 502 } : { data: [] }) };
      return p;
    } });
    assert.match(result.actual.message, /lida integralmente/);
  }
  await pairedContext(data(0), { lazy: { n: 501 }, page: (r, o, p) => {
    if (r === "accounts" && o === 0) p.data[0].name = null;
    if (r === "account_landing_pages" && o > 0) return { data: null, error: {}, count: null };
    return p;
  } });
  // Approved transport deltas: PK/FK-valid data cannot repeat/order backwards or
  // lack config.account_id. The old map only checked landing_page_id for configs.
  for (const mode of ["duplicate", "reverse", "oversized", "config-account"] as const) {
    const h = harness(false, data(2), { page: (r, _o, p) => {
      if (r === "account_landing_pages" && mode === "duplicate") p.data[1] = p.data[0];
      if (r === "account_landing_pages" && mode === "reverse") p.data.reverse();
      if (r === "account_landing_pages" && mode === "oversized") { p.data = Array(501).fill(p.data[0]); p.count = 501; }
      if (r === "account_landing_page_configurations" && mode === "config-account") p.data[0].account_id = null;
      return p;
    } });
    assert.equal((await h.api.inspectContext(h.client)).ok, false, mode);
    assert.equal(h.writes.length, 0);
  }
  const missingTaxons = harness(false, data(0), { lazy: { n: 1501 }, page: (relation, offset, page) => {
    if (relation === "account_taxonomy") page.data.forEach((row: Row, index: number) => { row.taxon_id = pid(offset + index + 1); });
    return page;
  } });
  assert.equal((await missingTaxons.api.inspectContext(missingTaxons.client)).ok, false);
  assert.ok(missingTaxons.metrics.maxSetSize <= 2, "failed scan cannot retain N missing taxon IDs");
  const noDraft = harness(false, data());
  assert.equal((await noDraft.api.readAdminInputCatalogLifecycle()).error, null);
  assert.equal(noDraft.metrics.compatibility, 0); assert.equal(noDraft.metrics.hashUpdates, 0);
  await validateLifecycleOperations();
  await validatePageScheduler();
  console.log("ok - frozen lifecycle oracle, bounded lazy scans, draft identity, errors and cleanup");
}

async function validateLifecycleOperations() {
  const actorUserId = aid();
  const input = { actorUserId, expectedRevision: 1 };
  const methods = ["readAdminInputCatalogLifecycle", "validateAdminInputCatalogDraft", "prepareAdminInputCatalogPublication"];
  for (const name of methods) {
    for (const shape of ["valid", "invalid", "absent"] as const) {
      const initial = shape === "absent" ? null : draft();
      if (initial && shape === "invalid") initial.catalog_json = { version: 7, invalid: true };
      const left = harness(true, data(), { draft: initial }), right = harness(false, data(), { draft: initial });
      assert.deepEqual(await right.api[name](input), await left.api[name](input), `${name}/${shape}`);
      assert.deepEqual(right.writes, left.writes);
    }
  }
  // Full mutation effects and guards, using the real adapter on both sides.
  const left = harness(true, data()), right = harness(false, data());
  for (const [name, args] of [
    ["initializeAdminInputCatalogDraft", { actorUserId }],
    ["validateAdminInputCatalogDraft", input],
    ["prepareAdminInputCatalogPublication", input],
    ["saveAdminInputCatalogDraft", { ...input, catalogJson: JSON.stringify(catalog.createNextLandingPageInputCatalogDraft()) }],
    ["readAdminInputCatalogLifecycle", undefined],
  ] as const) {
    const expected = await left.api[name](args), actual = await right.api[name](args);
    assert.deepEqual(actual, expected, name);
    assert.deepEqual(right.draft, left.draft, name);
    assert.deepEqual(right.writes, left.writes, name);
  }
  for (const flag of ["updateError", "mutationMiss"] as const) {
    for (const name of ["initializeAdminInputCatalogDraft", "saveAdminInputCatalogDraft", "validateAdminInputCatalogDraft"]) {
      const initial = name === "initializeAdminInputCatalogDraft" ? null : draft();
      const a = harness(true, data(), { draft: initial, [flag]: true });
      const b = harness(false, data(), { draft: initial, [flag]: true });
      const args = { ...input, catalogJson: JSON.stringify(catalog.createNextLandingPageInputCatalogDraft()) };
      assert.deepEqual(await b.api[name](args), await a.api[name](args), `${name}/${flag}`);
      assert.deepEqual(b.writes, a.writes);
    }
  }
  for (const name of ["saveAdminInputCatalogDraft", "validateAdminInputCatalogDraft", "prepareAdminInputCatalogPublication"]) {
    const a = harness(true, data(), { draft: draft() }), b = harness(false, data(), { draft: draft() });
    assert.deepEqual(await b.api[name]({ ...input, expectedRevision: 2, catalogJson: "bad-json" }), await a.api[name]({ ...input, expectedRevision: 2, catalogJson: "bad-json" }));
  }
  for (const name of methods) {
    for (const drift of ["invalid", "material", "remove", "appear", "metadata", "early-error", "late-error"] as const) {
      const initial = drift === "appear" ? null : draft();
      const changed = (current: Row | null) => {
        if (drift === "remove") return null;
        if (drift === "appear") return draft();
        assert.ok(current);
        if (drift === "invalid") current.catalog_json = { version: 7, invalid: true };
        if (drift === "material") current.catalog_json.universal.entries.reverse();
        if (drift === "metadata") current.updated_at = "2026-08-31T00:00:00.000Z";
        return current;
      };
      const h = harness(false, data(), { draft: initial, beforeDraft: (n, row) => {
        if (drift === "early-error" && n === 1 || drift === "late-error" && n === 2) return "error";
        return n === 2 && !drift.endsWith("error") ? changed(row) : row;
      } });
      const result = await h.api[name](input);
      if (drift === "metadata") {
        const expectedRow = changed(draft());
        const old = harness(true, data(), { draft: expectedRow });
        assert.deepEqual(result, await old.api[name](input));
      } else if (name === "readAdminInputCatalogLifecycle") {
        assert.ok(result.error);
        if (drift !== "late-error") assert.match(result.error, /Recarregue/);
      } else if (drift === "invalid") {
        assert.equal(result.code, "BLOCKED", "final invalid candidate precedes drift conflict");
      } else if (drift === "remove" || drift === "late-error") {
        assert.equal(result.code, "UNAVAILABLE");
      } else {
        assert.equal(result.code, "CONFLICT");
      }
      if (drift !== "metadata") assert.equal(h.writes.length, 0);
    }
  }
  // Context failure takes priority over early/final draft and candidate state.
  for (const name of methods) {
    const rows = data(); rows.accounts[0].name = null;
    const h = harness(false, rows, { draft: draft(), beforeDraft: () => null });
    const result = await h.api[name](input);
    assert.match(result.error ?? result.message, /autoridade operacional/);
    assert.equal(h.writes.length, 0);
  }
  // Final invalid row and expected revision precede material conflict.
  for (const name of methods.slice(1)) {
    for (const invalidRow of [false, true]) {
      const h = harness(false, data(), { draft: draft(), beforeDraft: (n, row) => {
        if (n === 2 && row) { row.revision = invalidRow ? -1 : 2; row.catalog_json = { invalid: true }; }
        return row;
      } });
      assert.equal((await h.api[name](input)).code, invalidRow ? "UNAVAILABLE" : "CONFLICT");
    }
  }
  // Entitlement's clock can expire between validate and prepare without DML.
  for (const old of [true, false]) {
    const rows = data();
    let expired = false;
    const h = harness(old, rows, { draft: draft(), page: (relation, _offset, page) => {
      if (expired && relation === "v_account_commercial_entitlement_effective") page.data[0].is_commercially_eligible = false;
      return page;
    } });
    assert.equal((await h.api.validateAdminInputCatalogDraft(input)).ok, true);
    expired = true;
    assert.equal((await h.api.prepareAdminInputCatalogPublication(input)).code, "BLOCKED");
  }
  // Draft already deployed: read still fingerprints, without candidate count.
  const published = draft(catalog.landingPageInputCatalogRegistry[6]);
  published.validation_fingerprint = published.content_fingerprint;
  published.publication_fingerprint = published.content_fingerprint;
  published.publication_context_fingerprint = "a".repeat(64);
  const publishedOld = harness(true, data(), { draft: published }), publishedNew = harness(false, data(), { draft: published });
  assert.deepEqual(await publishedNew.api.readAdminInputCatalogLifecycle(), await publishedOld.api.readAdminInputCatalogLifecycle());
  assert.equal(publishedNew.metrics.compatibility, 0);
  const evidenceOnly = harness(false, data(), { draft: published, beforeDraft: (n, row) => {
    if (n === 2 && row) row.taxon_review_evidence[taxonId] = {
      content_fingerprint: row.content_fingerprint, context_fingerprint: "b".repeat(64),
      decision: "confirm_sufficient", decided_by: aid(), decided_at: timestamp,
    };
    return row;
  } });
  const evidenceState = await evidenceOnly.api.readAdminInputCatalogLifecycle();
  assert.equal(evidenceState.error, null);
  assert.deepEqual(evidenceState.draft.reviewedTaxonIds, [taxonId], "nonmaterial evidence comes from final row");
  assert.equal(evidenceOnly.writes.length, 0);
  for (const mode of ["stable", "expire", "final-marker", "final-research"] as const) {
    const results: any[] = [];
    for (const old of [true, false]) {
      const h = harness(old, data(), { draft: published, beforeScan: (n, rows) => {
        if (n === 2 && mode === "expire") rows.v_account_commercial_entitlement_effective[0].is_commercially_eligible = false;
        if (n === 2 && mode === "final-marker") rows.business_taxons[1].reviewed_input_catalog_version = 99;
        if (n === 2 && mode === "final-research") rows.business_taxons[1].selected_end_customer_research_version = -1;
      } });
      const result = await h.api.reconcileAdminInputCatalogPublishedDraft({ expectedRevision: 1, runtimeEnvironment: "production" });
      assert.equal(result.ok, mode === "stable" || mode === "expire");
      assert.equal(h.scans, 2);
      if (!old) { assert.equal(h.metrics.compatibility, 0); assert.equal(h.metrics.operationalHashUpdates, 0); }
      assert.equal(h.draft === null, result.ok);
      results.push([result, h.writes, h.draft]);
    }
    assert.deepEqual(results[1], results[0], mode);
  }
  // Both semantic evaluation entrypoints, including their extra reload/guards.
  const results: any[] = [];
  for (const old of [true, false]) {
    const rows = data(); rows.business_taxons[1].reviewed_input_catalog_version = null;
    const h = harness(old, rows, { draft: draft(), evidence: true });
    const loaded = await h.api.loadAdminInputCatalogDraftEvaluationContext({ expectedRevision: 1, taxonId });
    assert.equal(loaded.ok, true);
    const decision = await h.api.recordAdminInputCatalogDraftSufficiencyDecision({ ...input, taxonId,
      expectedContentFingerprint: loaded.value.contentFingerprint,
      expectedContextFingerprint: fingerprintInputCatalogEvaluationContextIdentity(loaded.value.context.identity), decision: "confirm_sufficient" });
    assert.equal(decision.ok, true);
    results.push([loaded, decision, h.draft, h.writes]);
    if (!old) { assert.equal(h.metrics.compatibility, 0); assert.equal(h.metrics.operationalHashUpdates, 0); }
  }
  assert.deepEqual(results[1], results[0]);
}

async function validatePageScheduler() {
  const tick = () => new Promise<void>((resolveTick) => setImmediate(resolveTick));
  for (const mode of ["success", "reject", "oversized", "stop"] as const) {
    const scan = new pagination.LifecyclePageScan();
    const waits: Array<Array<{ offset: number; resolve: (page: any) => void; reject: (error: Error) => void }>> = Array.from({ length: 7 }, () => []);
    const cursors = waits.map((queue) => new pagination.CompleteLifecyclePageCursor({
      pageSize: 2, scan, key: (row) => String(row),
      readPage: (offset) => new Promise((resolvePage, reject) => queue.push({ offset, resolve: resolvePage, reject })),
    }));
    const state = (cursor: any) => cursor as { current: unknown[] | null; pending: Promise<pagination.CompletePage | null> | null };
    let requests = 0;
    const fulfill = (oversized = false) => waits.forEach((queue, i) => {
      const pending = queue.shift(); assert.ok(pending); requests += 1;
      if (mode === "reject" && pending.offset === 2 && i === 0) pending.reject(new Error("late transport"));
      else pending.resolve({ rows: oversized && i === 0 ? [2, 3, 4] : [pending.offset, pending.offset + 1], total: 6 });
    });
    await tick(); fulfill(); await tick();
    for (const c of cursors) assert.equal(await c.take(), 0);
    await tick(); fulfill(mode === "oversized"); await tick();
    // Resolving every prefetch does not start a third request or install a third buffer.
    assert.equal(requests, 14);
    assert.ok(waits.every((queue) => queue.length === 0));
    for (const cursor of cursors) {
      const buffers = state(cursor), pending = await buffers.pending;
      assert.equal(buffers.current?.length, 2);
      assert.ok(!pending || pending.rows.length <= 2);
      assert.ok((buffers.current ? 1 : 0) + (pending ? 1 : 0) <= 2);
    }
    if (mode === "success") {
      for (const c of cursors) { assert.equal(await c.take(), 1); assert.equal(await c.take(), 2); }
      await tick(); fulfill(); await tick();
      for (const c of cursors) { assert.equal(await c.take(), 3); assert.equal(await c.take(), 4); assert.equal(await c.take(), 5); assert.equal(await c.take(), undefined); }
      assert.equal(scan.failed, false);
    } else if (mode !== "stop") assert.equal(scan.failed, true);
    scan.stopped = true;
    await Promise.all(cursors.map((cursor) => cursor.close()));
    for (const cursor of cursors) { assert.equal(state(cursor).current, null); assert.equal(state(cursor).pending, null); }
    assert.ok(waits.every((queue) => queue.length === 0));
  }
  // On early termination, observe outstanding rejections without new reads.
  const scan = new pagination.LifecyclePageScan();
  let rejectPending!: (error: Error) => void;
  let calls = 0;
  const cursor = new pagination.CompleteLifecyclePageCursor({ pageSize: 1, scan, key: String,
    readPage: async () => { calls += 1; if (calls === 1) return { rows: ["a"], total: 2 };
      return new Promise((_resolve, reject) => { rejectPending = reject; }); } });
  assert.equal(await cursor.take(), "a"); await tick();
  scan.stopped = true;
  const closing = cursor.close(); rejectPending(new Error("observed rejection")); await closing;
  assert.equal(calls, 2);
}
