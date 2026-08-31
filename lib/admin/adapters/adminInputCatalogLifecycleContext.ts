import "server-only";

import {
  buildLandingPageInputCatalogTaxonChain,
  type LandingPageInputCatalogTaxonIdentity,
  type ValidateLandingPageInputCatalogDraftResult,
} from "@/conversion-content/landing-page/input-catalog";
import type { createServiceClient } from "@/lib/supabase/service";
import {
  collectCompletePaginatedRows,
  CompleteLifecyclePageCursor,
  LifecyclePageScan,
} from "./adminInputCatalogLifecyclePagination";
import {
  createInputCatalogOperationalProof,
  resolveInputCatalogOperationalAccountAuthorities,
} from "./adminInputCatalogLifecycleValidation";

type ServiceClient = ReturnType<typeof createServiceClient>;
export type LifecycleTaxon = Readonly<{
  identity: LandingPageInputCatalogTaxonIdentity;
  reviewedVersion: number | null;
  selectedResearchVersion: number | null;
  operational: boolean;
}>;
export type LifecycleContext = Readonly<{
  taxons: readonly LifecycleTaxon[];
  operationalTaxonIds: ReadonlySet<string>;
  operationalProof: ReturnType<ReturnType<typeof createInputCatalogOperationalProof>["finish"]> | null;
}>;
const PAGE_SIZE = 500;
const READ_ERROR = "A coleção administrativa não pôde ser lida integralmente.";
const AUTHORITY_ERROR = "A autoridade operacional de conta, entitlement ou plano é inválida.";
const VALUES_ERROR = "As configurações operacionais contêm estado inválido.";

type Row = Record<string, any>;
type Source = Readonly<{
  relation: string;
  columns: string;
  keys: readonly string[];
  refine?: (query: any) => any;
  phase: number;
  message: string;
  valid: (row: Row) => boolean;
}>;
const sources: readonly Source[] = [
  { relation: "accounts", columns: "id,name,status", keys: ["id"], phase: 4,
    message: AUTHORITY_ERROR, valid: (r) => typeof r.name === "string" && typeof r.status === "string" },
  { relation: "v_account_commercial_entitlement_effective", columns: "account_id,plan_key,is_commercially_eligible", keys: ["account_id"], phase: 4,
    message: AUTHORITY_ERROR, valid: (r) => typeof r.is_commercially_eligible === "boolean" && (r.plan_key === null || typeof r.plan_key === "string") },
  { relation: "account_taxonomy", columns: "account_id,taxon_id,is_primary,status", keys: ["account_id"], phase: 5,
    refine: (q) => q.eq("is_primary", true).eq("status", "active"),
    message: "A coleção de taxonomia operacional é inválida.", valid: (r) => typeof r.taxon_id === "string" },
  { relation: "account_landing_page_onboarding_configurations", columns: "account_id,landing_page_id,values", keys: ["account_id"], phase: 3,
    refine: (q) => q.is("landing_page_id", null),
    message: "A residência E19.2 pré-handoff é inválida.", valid: (r) => r.landing_page_id === null },
  { relation: "account_landing_page_shared_configurations", columns: "account_id,values", keys: ["account_id"], phase: 6,
    message: VALUES_ERROR, valid: () => true },
  { relation: "account_landing_pages", columns: "id,account_id,status", keys: ["account_id", "id"], phase: 2,
    refine: (q) => q.in("status", ["draft", "active"]),
    message: "A coleção de LPs operacionais é inválida.", valid: () => true },
  { relation: "account_landing_page_configurations", columns: "landing_page_id,account_id,values", keys: ["account_id", "landing_page_id"], phase: 6,
    message: VALUES_ERROR, valid: () => true },
];

/** Complete offset/count scans, not a transaction snapshot. Retention is O(T+B),
 * with at most two valid pages per stream, not a bound on transport bytes/RSS. */
export async function readCompleteLifecycleContext(
  client: ServiceClient,
  options: Readonly<{
    fingerprint: boolean;
    prepareCandidate?: (taxons: readonly LifecycleTaxon[]) => ValidateLandingPageInputCatalogDraftResult;
  }> = { fingerprint: false },
): Promise<Readonly<{ ok: true; value: LifecycleContext }> | Readonly<{ ok: false; message: string }>> {
  const scan = new LifecyclePageScan();
  let failure: { phase: number; key: string; check: number; message: string } | null = null;
  const fail = (phase: number, key: string, check: number, message: string) => {
    if (!failure || phase < failure.phase || (phase === failure.phase &&
        (key.localeCompare(failure.key) < 0 || (key === failure.key && check < failure.check)))) {
      failure = { phase, key, check, message };
    }
  };
  const readPage = async (source: Source, offset: number, limit: number) => {
    let query: any = client.from(source.relation).select(source.columns, { count: "exact" });
    if (source.refine) query = source.refine(query);
    for (const key of source.keys) query = query.order(key, { ascending: true });
    const { data, error, count } = await query.range(offset, offset + limit - 1);
    return error || !Array.isArray(data) || count === null ? null : { rows: data, total: count };
  };
  const cursors = sources.map((source) => new CompleteLifecyclePageCursor({
    pageSize: PAGE_SIZE, scan,
    readPage: (offset, limit) => readPage(source, offset, limit),
    key: (row) => isRecord(row) && source.keys.every((key) => typeof row[key] === "string")
      ? source.keys.map((key) => row[key]).join(":") : null,
  }));
  try {
    const taxonRows = await collectCompletePaginatedRows({
      pageSize: PAGE_SIZE,
      readPage: async (offset, limit) => {
        if (scan.stopped) return null;
        try {
          const { data, error, count } = await client.from("business_taxons")
            .select("id,parent_id,level,name,slug,is_active,selected_end_customer_research_version,reviewed_input_catalog_version", { count: "exact" })
            .in("level", ["segment", "niche", "ultra_niche"]).order("id", { ascending: true })
            .range(offset, offset + limit - 1);
          if (error || !Array.isArray(data) || count === null || data.length > limit) {
            scan.fail();
            return null;
          }
          return { rows: data, total: count };
        } catch {
          scan.fail();
          return null;
        }
      },
    });
    if (!taxonRows.ok) scan.fail();
    const taxons: LifecycleTaxon[] = [];
    if (taxonRows.ok) for (const raw of taxonRows.rows) {
      const taxon = normalizeTaxon(raw);
      if (!taxon) fail(1, "", 0, "A coleção de taxons contém estado inválido.");
      else taxons.push({ ...taxon, operational: false });
    }
    const identities = taxons.map((taxon) => taxon.identity);
    const operationalTaxonIds = new Set<string>();
    const candidate = !failure && !scan.failed ? options.prepareCandidate?.(taxons) : undefined;
    const proof = options.fingerprint || candidate?.ok ? createInputCatalogOperationalProof({
      fingerprint: options.fingerprint,
      candidate: candidate?.ok ? candidate.value : undefined,
    }) : null;

    const peek = async (index: number): Promise<Row | null> => {
      const source = sources[index];
      while (!scan.stopped) {
        const row = await cursors[index].peek();
        if (row === undefined) return null;
        if (isRecord(row) && source.keys.every((key) => typeof row[key] === "string") && source.valid(row)) return row;
        fail(source.phase, isRecord(row) && typeof row[source.keys[0]] === "string" ? row[source.keys[0]] : "", 0, source.message);
        await cursors[index].take();
      }
      return null;
    };
    const takeAccount = async (index: number, accountId: string): Promise<Row | null> => {
      const row = await peek(index);
      if (!row || row[sources[index].keys[0]] !== accountId) return null;
      await cursors[index].take();
      return row;
    };
    while (!scan.stopped) {
      const heads = await Promise.all(cursors.map((_, index) => peek(index)));
      const accountIds = heads.flatMap((row, index) => row ? [row[sources[index].keys[0]] as string] : []);
      if (!accountIds.length) break;
      const accountId = accountIds.sort((a, b) => a.localeCompare(b))[0];
      const account = await takeAccount(0, accountId);
      const entitlement = await takeAccount(1, accountId);
      const primary = await takeAccount(2, accountId);
      const pre = await takeAccount(3, accountId);
      const shared = await takeAccount(4, accountId);
      const pageHead = await peek(5);
      const candidateAccount = !!pre || pageHead?.account_id === accountId;
      const authority = resolveInputCatalogOperationalAccountAuthorities({
        candidateAccountIds: new Set(candidateAccount ? [accountId] : []),
        accounts: account ? [account] : [], entitlements: entitlement ? [entitlement] : [],
      });
      if (!authority.ok) fail(4, accountId, 0, AUTHORITY_ERROR);
      const operational = authority.ok ? authority.value[0] : undefined;

      if (operational && shared && !isRecord(shared.values)) fail(6, accountId, 0, VALUES_ERROR);
      const taxon = operational ? identities.find((identity) => identity.id === primary?.taxon_id) : undefined;
      if (taxon) operationalTaxonIds.add(taxon.id);
      const chain = taxon ? buildLandingPageInputCatalogTaxonChain(taxon, identities) : null;
      const emit = (landingPageId: string | null, values: Row, phase: number) => {
        if (!operational) return;
        const key = landingPageId ?? accountId;
        if (!primary?.taxon_id || !taxon) {
          fail(phase, key, 1, landingPageId === null
            ? "Uma configuração E19.2 não possui autoridade completa de conta, plano ou taxon."
            : "Uma LP operacional não possui autoridade completa de conta, plano ou taxon.");
          return;
        }
        if (!chain?.ok) {
          fail(phase, key, 2, landingPageId === null
            ? "Uma configuração E19.2 possui cadeia taxonômica inválida."
            : "Uma LP operacional possui cadeia taxonômica inválida.");
          return;
        }
        if (!failure && !scan.failed) proof?.add({
          accountId, landingPageId, planKey: operational.planKey,
          taxonChain: chain.value, storedValues: values,
          authoritativeValues: operational.accountName.trim()
            ? { business_display_name: operational.accountName.trim() } : {},
        });
      };
      // Null LP sorts before every LP of the account in the legacy digest.
      if (pre && operational) {
        if (!isRecord(pre.values)) fail(8, accountId, 0, "Uma configuração E19.2 operacional contém valores inválidos.");
        else emit(null, pre.values, 8);
      }
      let page = await peek(5);
      while (page?.account_id === accountId && !scan.stopped) {
        let config = await peek(6);
        while (config?.account_id === accountId && config.landing_page_id.localeCompare(page.id) < 0) {
          await cursors[6].take();
          config = await peek(6);
        }
        const local = config?.account_id === accountId && config.landing_page_id === page.id ? config : null;
        if (operational && local && !isRecord(local.values)) fail(6, page.id, 0, VALUES_ERROR);
        emit(page.id, { ...(shared?.values ?? {}), ...(local?.values ?? {}) }, 7);
        if (local) await cursors[6].take();
        await cursors[5].take();
        page = await peek(5);
      }
      // Non-operational payloads are ignored, but every row's keys were validated.
      let config = await peek(6);
      while (config?.account_id === accountId && !scan.stopped) {
        await cursors[6].take();
        config = await peek(6);
      }
    }
    if (scan.failed) return { ok: false, message: READ_ERROR };
    const semanticFailure = failure as { message: string } | null;
    if (semanticFailure) return { ok: false, message: semanticFailure.message };
    const finalTaxons = taxons.map((taxon) => ({ ...taxon, operational: operationalTaxonIds.has(taxon.identity.id) }));
    const context = { taxons: finalTaxons, operationalTaxonIds };
    return { ok: true, value: { ...context, operationalProof: proof?.finish(context) ?? null } };
  } finally {
    scan.stopped = true;
    await Promise.all(cursors.map((cursor) => cursor.close()));
  }
}

function isRecord(value: unknown): value is Row {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeTaxon(value: unknown): Readonly<{
  identity: LandingPageInputCatalogTaxonIdentity;
  reviewedVersion: number | null;
  selectedResearchVersion: number | null;
}> | null {
  if (!isRecord(value)) return null;
  if (
    typeof value.id !== "string" ||
    (value.parent_id !== null && typeof value.parent_id !== "string") ||
    (value.level !== "segment" && value.level !== "niche" && value.level !== "ultra_niche") ||
    typeof value.name !== "string" ||
    typeof value.slug !== "string" ||
    typeof value.is_active !== "boolean" ||
    (value.selected_end_customer_research_version !== null &&
      (!Number.isSafeInteger(value.selected_end_customer_research_version) ||
        Number(value.selected_end_customer_research_version) <= 0)) ||
    (value.reviewed_input_catalog_version !== null &&
      (!Number.isSafeInteger(value.reviewed_input_catalog_version) ||
        Number(value.reviewed_input_catalog_version) <= 0))
  ) return null;
  return {
    identity: {
      id: value.id,
      parentId: value.parent_id,
      level: value.level,
      name: value.name,
      slug: value.slug,
      isActive: value.is_active,
    },
    reviewedVersion: value.reviewed_input_catalog_version as number | null,
    selectedResearchVersion:
      value.selected_end_customer_research_version as number | null,
  };
}
