import "server-only";

import { getCommercialEntitlementSignal } from "../../commercial-entitlements";
import {
  resolveLandingPageInputCatalog,
  type LandingPageInputCatalogPlan,
  type LandingPageInputCatalogTaxonChain,
} from "../../conversion-content/landing-page/input-catalog";
import { createClient } from "../../supabase/server";
import { createServiceClient } from "../../supabase/service";
import { isOperationalLandingPageStatus, type LandingPageStatus } from "../../types/status";
import type {
  AccountLandingPageOnboardingRevalidationResult,
  AccountLandingPageOnboardingStoredValues,
  AccountLandingPageOperationalConfiguration,
  AccountLandingPageWorkspaceDetailResult,
  AccountLandingPageWorkspaceItem,
  AccountLandingPageWorkspaceResult,
  LandingPageWorkspaceMutationResult,
  SaveAccountLandingPageOperationalConfigurationResult,
} from "../contracts";
import { ACCOUNT_LANDING_PAGE_OPERATIONAL_CATALOG_VERSION } from "../contracts";
import { deriveLandingPageWorkspaceState } from "../landingPageWorkspace";
import { resolveAccountLandingPageOnboardingConfiguration } from "../onboardingConfiguration";

type ServiceClient = ReturnType<typeof createServiceClient>;
type Authority = Readonly<{
  actorUserId: string;
  accountId: string;
  planKey: LandingPageInputCatalogPlan;
  taxonChain: LandingPageInputCatalogTaxonChain;
  authoritativeValues: Readonly<Record<string, unknown>>;
}>;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function listAccountLandingPageWorkspace(input: {
  accountId: string;
}): Promise<AccountLandingPageWorkspaceResult> {
  const client = createServiceClient();
  const authority = await loadAuthority(input.accountId, client);
  if (!authority.ok) return authority.result;
  if (!(await workspaceReady(client))) return { ok: false, error: "unavailable" };

  try {
    const [{ data: pages, error: pagesError }, { data: shared, error: sharedError }, { data: configurations, error: configurationsError }, { data: revisions, error: revisionsError }] = await Promise.all([
      client.from("account_landing_pages")
        .select("id,account_id,name,slug,status,approved_materialization_id,updated_at")
        .eq("account_id", authority.value.accountId)
        .in("status", ["draft", "active", "archived"])
        .order("updated_at", { ascending: false })
        .order("id", { ascending: true }),
      client.from("account_landing_page_shared_configurations")
        .select("account_id,catalog_version,values,revision")
        .eq("account_id", authority.value.accountId).limit(1).maybeSingle(),
      client.from("account_landing_page_configurations")
        .select("landing_page_id,account_id,catalog_version,values,revision")
        .eq("account_id", authority.value.accountId),
      client.from("account_landing_page_materializations")
        .select("id,account_id,landing_page_id,revision_number,created_at")
        .eq("account_id", authority.value.accountId)
        .order("revision_number", { ascending: false }),
    ]);
    if (pagesError || sharedError || configurationsError || revisionsError || !isRecord(shared)) {
      return { ok: false, error: "unavailable" };
    }
    const configurationMap = new Map((Array.isArray(configurations) ? configurations : []).filter(isRecord).map((row) => [row.landing_page_id, row]));
    const revisionRows = (Array.isArray(revisions) ? revisions : []).filter(isRecord);
    const items: AccountLandingPageWorkspaceItem[] = [];
    for (const page of (Array.isArray(pages) ? pages : [])) {
      if (!isRecord(page) || typeof page.id !== "string") return { ok: false, error: "unavailable" };
      const configuration = resolveConfiguration(authority.value, page.id, shared, configurationMap.get(page.id));
      if (!configuration) return { ok: false, error: "unavailable" };
      const pageRevisions = revisionRows.filter((row) => row.landing_page_id === page.id);
      const latest = pageRevisions[0];
      const approved = pageRevisions.find((row) => row.id === page.approved_materialization_id);
      const item = mapWorkspaceItem(page, configuration, latest, approved);
      if (!item) return { ok: false, error: "unavailable" };
      items.push(item);
    }
    return {
      ok: true,
      active: items.filter((item) => item.status !== "archived"),
      archived: items.filter((item) => item.status === "archived"),
    };
  } catch {
    return { ok: false, error: "unavailable" };
  }
}

export async function getAccountLandingPageWorkspaceDetail(input: {
  accountId: string;
  landingPageId: string;
}): Promise<AccountLandingPageWorkspaceDetailResult> {
  if (!UUID_RE.test(input.landingPageId)) return { ok: false, error: "not_found" };
  const client = createServiceClient();
  const authority = await loadAuthority(input.accountId, client);
  if (!authority.ok) return authority.result;
  if (!(await workspaceReady(client))) return { ok: false, error: "unavailable" };
  try {
    const [{ data: page, error: pageError }, { data: shared, error: sharedError }, { data: configuration, error: configurationError }, { data: revisions, error: revisionsError }] = await Promise.all([
      client.from("account_landing_pages")
        .select("id,account_id,name,slug,status,approved_materialization_id,updated_at")
        .eq("id", input.landingPageId).eq("account_id", authority.value.accountId).limit(1).maybeSingle(),
      client.from("account_landing_page_shared_configurations")
        .select("account_id,catalog_version,values,revision")
        .eq("account_id", authority.value.accountId).limit(1).maybeSingle(),
      client.from("account_landing_page_configurations")
        .select("landing_page_id,account_id,catalog_version,values,revision")
        .eq("landing_page_id", input.landingPageId).eq("account_id", authority.value.accountId).limit(1).maybeSingle(),
      client.from("account_landing_page_materializations")
        .select("id,account_id,landing_page_id,revision_number,created_at")
        .eq("account_id", authority.value.accountId).eq("landing_page_id", input.landingPageId)
        .order("revision_number", { ascending: false }),
    ]);
    if (pageError || sharedError || configurationError || revisionsError) return { ok: false, error: "unavailable" };
    if (!isRecord(page)) return { ok: false, error: "not_found" };
    if (!isRecord(shared) || !isRecord(configuration)) return { ok: false, error: "unavailable" };
    const resolved = resolveConfiguration(authority.value, input.landingPageId, shared, configuration);
    if (!resolved) return { ok: false, error: "invalid_configuration" };
    const rows = (Array.isArray(revisions) ? revisions : []).filter(isRecord);
    const latest = rows[0];
    const approved = rows.find((row) => row.id === page.approved_materialization_id);
    const item = mapWorkspaceItem(page, resolved, latest, approved);
    if (!item) return { ok: false, error: "unavailable" };
    return {
      ok: true,
      landingPage: item,
      configuration: resolved,
      revisions: rows.map((row, index) => ({
        id: String(row.id),
        number: Number(row.revision_number),
        createdAt: String(row.created_at),
        latest: index === 0,
        approved: row.id === page.approved_materialization_id,
      })),
    };
  } catch {
    return { ok: false, error: "unavailable" };
  }
}

export async function getAccountLandingPageOperationalRevalidationAuthority(input: {
  accountId: string;
  landingPageId: string;
}): Promise<AccountLandingPageOnboardingRevalidationResult> {
  const detail = await getAccountLandingPageWorkspaceDetail(input);
  if (!detail.ok) {
    const mapping = detail.error === "unauthenticated" ? "unauthenticated"
      : detail.error === "unauthorized" ? "membership_inactive"
      : detail.error === "not_found" ? "landing_page_not_found"
      : detail.error === "invalid_configuration" ? "invalid_configuration"
      : "read_failed";
    return { ok: false, error: mapping };
  }
  const authority = await loadAuthority(input.accountId, createServiceClient());
  if (!authority.ok) return { ok: false, error: "read_failed" };
  return {
    ok: true,
    authority: {
      historicalConfiguration: detail.configuration.resolved,
      currentPlanKey: authority.value.planKey,
      currentTaxonChain: authority.value.taxonChain,
      currentAuthoritativeValues: authority.value.authoritativeValues,
    },
  };
}

export async function saveAccountLandingPageOperationalConfiguration(input: {
  accountId: string;
  landingPageId: string;
  sharedValues: AccountLandingPageOnboardingStoredValues;
  landingPageValues: AccountLandingPageOnboardingStoredValues;
  expectedSharedRevision: number;
  expectedLandingPageRevision: number;
}): Promise<SaveAccountLandingPageOperationalConfigurationResult> {
  const client = createServiceClient();
  const authority = await loadAuthority(input.accountId, client);
  if (!authority.ok) return {
    ok: false,
    error: authority.mutationResult.error === "not_found" || authority.mutationResult.error === "revision_not_found"
      ? "unavailable"
      : authority.mutationResult.error,
  };
  if (!(await workspaceReady(client))) return { ok: false, error: "unavailable" };
  const resolved = resolveAccountLandingPageOnboardingConfiguration({
    accountId: authority.value.accountId,
    landingPageId: input.landingPageId,
    catalogVersion: ACCOUNT_LANDING_PAGE_OPERATIONAL_CATALOG_VERSION,
    revision: input.expectedLandingPageRevision,
    planKey: authority.value.planKey,
    taxonChain: authority.value.taxonChain,
    storedValues: { ...input.sharedValues, ...input.landingPageValues },
    authoritativeValues: authority.value.authoritativeValues,
  });
  if (!resolved.ok) return { ok: false, error: "invalid_values", ...(resolved.fieldKey ? { fieldKey: resolved.fieldKey } : {}) };
  try {
    const { data, error } = await client.rpc("save_account_landing_page_configuration_v1", {
      p_account_id: authority.value.accountId,
      p_landing_page_id: input.landingPageId,
      p_shared_values: input.sharedValues,
      p_landing_page_values: input.landingPageValues,
      p_expected_shared_revision: input.expectedSharedRevision,
      p_expected_landing_page_revision: input.expectedLandingPageRevision,
      p_actor_user_id: authority.value.actorUserId,
    });
    if (error) return { ok: false, error: error.code === "40001" ? "revision_conflict" : error.message?.includes("not_operational") ? "not_operational" : "unavailable" };
    const row = Array.isArray(data) ? data[0] : data;
    return isRecord(row) && Number.isSafeInteger(row.shared_revision) && Number.isSafeInteger(row.landing_page_revision)
      ? { ok: true, sharedRevision: Number(row.shared_revision), landingPageRevision: Number(row.landing_page_revision) }
      : { ok: false, error: "unavailable" };
  } catch { return { ok: false, error: "unavailable" }; }
}

export async function createOperationalAccountLandingPage(input: {
  accountId: string;
  name: string;
  slug: string;
}): Promise<LandingPageWorkspaceMutationResult & { landingPageId?: string }> {
  return mutateWorkspace(input.accountId, async (authority, client) => {
    const { data, error } = await client.rpc("create_account_landing_page_v1", {
      p_account_id: authority.accountId,
      p_name: input.name.trim(),
      p_slug: input.slug.trim(),
      p_actor_user_id: authority.actorUserId,
    });
    const row = Array.isArray(data) ? data[0] : data;
    if (error || !isRecord(row) || typeof row.landing_page_id !== "string" || row.status !== "active") {
      return { ok: false, error: "unavailable" };
    }
    return { ok: true, status: "active", landingPageId: row.landing_page_id };
  });
}

export async function approveAccountLandingPageRevision(input: { accountId: string; landingPageId: string; materializationId: string }): Promise<LandingPageWorkspaceMutationResult> {
  return mutateWorkspace(input.accountId, async (authority, client) => {
    const { data, error } = await client.rpc("approve_account_landing_page_materialization_v1", {
      p_account_id: authority.accountId, p_landing_page_id: input.landingPageId,
      p_materialization_id: input.materializationId, p_actor_user_id: authority.actorUserId,
    });
    return error || typeof data !== "string" ? { ok: false, error: error?.message?.includes("materialization_not_found") ? "revision_not_found" : "not_operational" } : { ok: true, approvedMaterializationId: data };
  });
}

export async function setAccountLandingPageArchived(input: { accountId: string; landingPageId: string; archived: boolean }): Promise<LandingPageWorkspaceMutationResult> {
  return mutateWorkspace(input.accountId, async (authority, client) => {
    const { data, error } = await client.rpc("set_account_landing_page_archived_v1", {
      p_account_id: authority.accountId, p_landing_page_id: input.landingPageId,
      p_archived: input.archived, p_actor_user_id: authority.actorUserId,
    });
    return error || !["active", "archived"].includes(String(data)) ? { ok: false, error: "not_found" } : { ok: true, status: data as LandingPageStatus };
  });
}

export async function handoffAccountLandingPageOnboarding(input: { accountId: string; landingPageId: string; expectedOnboardingRevision: number }): Promise<LandingPageWorkspaceMutationResult> {
  return mutateWorkspace(input.accountId, async (authority, client) => {
    const { error } = await client.rpc("handoff_account_landing_page_onboarding_v1", {
      p_account_id: authority.accountId, p_landing_page_id: input.landingPageId,
      p_expected_onboarding_revision: input.expectedOnboardingRevision, p_actor_user_id: authority.actorUserId,
    });
    return error ? { ok: false, error: "unavailable" } : { ok: true };
  });
}

async function mutateWorkspace(accountId: string, operation: (authority: Authority, client: ServiceClient) => Promise<LandingPageWorkspaceMutationResult>): Promise<LandingPageWorkspaceMutationResult> {
  const client = createServiceClient();
  const authority = await loadAuthority(accountId, client);
  if (!authority.ok) return authority.mutationResult;
  if (!(await workspaceReady(client))) return { ok: false, error: "unavailable" };
  try { return await operation(authority.value, client); } catch { return { ok: false, error: "unavailable" }; }
}

function resolveConfiguration(authority: Authority, landingPageId: string, shared: Record<string, unknown>, page: Record<string, unknown> | undefined): AccountLandingPageOperationalConfiguration | null {
  if (!page || shared.account_id !== authority.accountId || page.account_id !== authority.accountId || page.landing_page_id !== landingPageId || shared.catalog_version !== 5 || page.catalog_version !== 5 || !isRecord(shared.values) || !isRecord(page.values) || !Number.isSafeInteger(shared.revision) || !Number.isSafeInteger(page.revision)) return null;
  const resolved = resolveAccountLandingPageOnboardingConfiguration({
    accountId: authority.accountId, landingPageId, catalogVersion: 5,
    revision: Number(page.revision), planKey: authority.planKey, taxonChain: authority.taxonChain,
    storedValues: { ...(shared.values as AccountLandingPageOnboardingStoredValues), ...(page.values as AccountLandingPageOnboardingStoredValues) },
    authoritativeValues: authority.authoritativeValues,
  });
  if (!resolved.ok) return null;
  return { accountId: authority.accountId, landingPageId, catalogVersion: 5, sharedRevision: Number(shared.revision), landingPageRevision: Number(page.revision), sharedValues: shared.values as AccountLandingPageOnboardingStoredValues, landingPageValues: page.values as AccountLandingPageOnboardingStoredValues, resolved: resolved.configuration };
}

function mapWorkspaceItem(page: Record<string, unknown>, configuration: AccountLandingPageOperationalConfiguration, latest: Record<string, unknown> | undefined, approved: Record<string, unknown> | undefined): AccountLandingPageWorkspaceItem | null {
  if (page.account_id !== configuration.accountId || typeof page.id !== "string" || typeof page.name !== "string" || typeof page.slug !== "string" || !["draft", "active", "archived"].includes(String(page.status)) || typeof page.updated_at !== "string") return null;
  const latestRevision = latest && typeof latest.id === "string" && Number.isSafeInteger(latest.revision_number) && typeof latest.created_at === "string" ? { id: latest.id, number: Number(latest.revision_number), createdAt: latest.created_at } : null;
  const approvedRevision = approved && typeof approved.id === "string" && Number.isSafeInteger(approved.revision_number) ? { id: approved.id, number: Number(approved.revision_number) } : null;
  const status = page.status as LandingPageStatus;
  return { id: page.id, accountId: configuration.accountId, name: page.name, slug: page.slug, status, latestRevision, approvedRevision, updatedAt: page.updated_at, state: deriveLandingPageWorkspaceState({ status, configuration: configuration.resolved, latestRevisionId: latestRevision?.id ?? null, approvedRevisionId: approvedRevision?.id ?? null }) };
}

async function workspaceReady(client: ServiceClient): Promise<boolean> {
  try {
    const { data, error } = await client.rpc("e19_5_landing_page_workspace_readiness");
    return !error && isRecord(data) && data.ready === true && data.schema_version === 1;
  } catch { return false; }
}

async function loadAuthority(accountIdInput: string, client: ServiceClient): Promise<
  | { ok: true; value: Authority }
  | { ok: false; result: Extract<AccountLandingPageWorkspaceResult,{ok:false}>; mutationResult: Extract<LandingPageWorkspaceMutationResult,{ok:false}> }
> {
  const accountId = String(accountIdInput ?? "").trim();
  const actorUserId = await getAuthenticatedUserId();
  if (!actorUserId) return authorityFailure("unauthenticated");
  if (!UUID_RE.test(accountId)) return authorityFailure("unauthorized");
  const [{ data: account }, { data: membership }] = await Promise.all([
    client.from("accounts").select("id,name,status").eq("id",accountId).limit(1).maybeSingle(),
    client.from("account_users").select("role,status").eq("account_id",accountId).eq("user_id",actorUserId).limit(1).maybeSingle(),
  ]);
  if (!isRecord(account) || account.status !== "active" || !isRecord(membership) || membership.status !== "active" || !["owner","admin"].includes(String(membership.role))) return authorityFailure("unauthorized");
  const entitlement = await getCommercialEntitlementSignal({ accountId });
  if (!entitlement.isCommerciallyEligible || !["starter","lite","pro","ultra"].includes(String(entitlement.planKey))) return authorityFailure("unauthorized");
  const taxonChain = await readTaxonChain(client, accountId);
  if (!taxonChain) return authorityFailure("unavailable");
  return { ok: true, value: { actorUserId, accountId, planKey: entitlement.planKey as LandingPageInputCatalogPlan, taxonChain, authoritativeValues: typeof account.name === "string" && account.name.trim() ? { business_display_name: account.name.trim() } : {} } };
}

async function readTaxonChain(client: ServiceClient, accountId: string): Promise<LandingPageInputCatalogTaxonChain | null> {
  const { data: link, error } = await client.from("account_taxonomy").select("taxon_id").eq("account_id",accountId).eq("is_primary",true).eq("status","active").limit(1).maybeSingle();
  if (error || !isRecord(link) || typeof link.taxon_id !== "string") return null;
  const nodes: Record<string, unknown>[] = []; let currentId: string | null = link.taxon_id;
  for (let depth=0; depth<3 && currentId; depth+=1) {
    const response: { data: unknown; error: unknown } = await client.from("business_taxons").select("id,name,slug,level,is_active,parent_id").eq("id",currentId).limit(1).maybeSingle();
    const data = response.data;
    const nodeError = response.error;
    if (nodeError || !isRecord(data) || data.is_active !== true) return null;
    nodes.push(data); currentId = typeof data.parent_id === "string" ? data.parent_id : null;
    if (data.level === "segment") break;
  }
  const ordered = nodes.reverse();
  const mapped = ordered.map((node) => ({ id:String(node.id), name:String(node.name), slug:String(node.slug), level:node.level as "segment"|"niche"|"ultra_niche", isActive:true, parentId:typeof node.parent_id === "string" ? node.parent_id : null }));
  const segment=mapped.find((node)=>node.level==="segment"), niche=mapped.find((node)=>node.level==="niche"), ultraNiche=mapped.find((node)=>node.level==="ultra_niche");
  if (!segment || (ultraNiche && !niche)) return null;
  const catalog = resolveLandingPageInputCatalog({ version:5, plan:(await getCommercialEntitlementSignal({accountId})).planKey ?? "", taxonChain:{segment,...(niche?{niche}:{}),...(ultraNiche?{ultraNiche}:{})} });
  return catalog.ok ? { segment, ...(niche?{niche}:{}), ...(ultraNiche?{ultraNiche}:{}) } : null;
}

async function getAuthenticatedUserId() {
  try { const client=await createClient(); const {data:{user},error}=await client.auth.getUser(); return error || !user?.id ? null : user.id; } catch { return null; }
}

function authorityFailure(error: "unauthenticated"|"unauthorized"|"unavailable") {
  return { ok:false as const, result:{ok:false as const,error}, mutationResult:{ok:false as const,error} };
}
function isRecord(value: unknown): value is Record<string, any> { return typeof value === "object" && value !== null && !Array.isArray(value); }
