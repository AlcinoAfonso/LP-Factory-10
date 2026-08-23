import "server-only";

import { getCommercialEntitlementSignal } from "../../commercial-entitlements";
import { loadTaxonPreparationForVersion } from "../../conversion-content/adapters/selectedEndCustomerResearchAdapter";
import type {
  LandingPageInputCatalogPlan,
  LandingPageInputCatalogTaxonChain,
} from "../../conversion-content/landing-page/input-catalog";
import { createClient } from "../../supabase/server";
import { createServiceClient } from "../../supabase/service";
import { isOperationalLandingPageStatus } from "../../types/status";
import type {
  AccountLandingPageOnboardingStoredValues,
  AccountLandingPageOperationalRevalidationResult,
  AccountLandingPageOperationalConfiguration,
  AccountLandingPageWorkspaceDetailResult,
  AccountLandingPageWorkspaceItem,
  AccountLandingPageWorkspaceResult,
  LandingPageWorkspaceMutationResult,
  SaveAccountLandingPageOperationalConfigurationResult,
} from "../contracts";
import {
  LANDING_PAGE_WORKSPACE_REQUIRED_INPUT_CATALOG_VERSION,
  deriveLandingPageWorkspaceState,
  isLandingPageWorkspaceEnabled,
  splitLandingPageWorkspaceValues,
} from "../landingPageWorkspace";
import { resolveAccountLandingPageOnboardingConfiguration } from "../onboardingConfiguration";
import { createAccountLandingPage } from "./landingPagesAdapter";

type ServiceClient = ReturnType<typeof createServiceClient>;
type Authority = Readonly<{
  actorUserId: string;
  accountId: string;
  canMutate: boolean;
  planKey: LandingPageInputCatalogPlan;
  taxonChain: LandingPageInputCatalogTaxonChain;
  authoritativeValues: Readonly<Record<string, unknown>>;
}>;

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const WORKSPACE_PAGE_SIZE = 25;
const HISTORY_PAGE_SIZE = 25;
const BASELINE_PAGE_SIZE = 100;
const IDENTITY_FIELDS = [
  "funnel_stage",
  "transaction_intent",
  "primary_conversion_goal",
] as const;

export async function listAccountLandingPageWorkspace(input: Readonly<{
  accountId: string;
  cursor?: string;
}>): Promise<AccountLandingPageWorkspaceResult> {
  if (!isLandingPageWorkspaceEnabled()) return { ok: false, error: "disabled" };
  const client = createServiceClient();
  const authority = await loadAuthority(input.accountId, client);
  if (!authority.ok) return authority.workspaceResult;
  const offset = parseCursor(input.cursor);
  if (offset === null) return { ok: false, error: "unavailable" };

  try {
    const { data, error, count } = await client
      .from("account_landing_pages")
      .select(
        "id,account_id,name,slug,status,approved_materialization_id,updated_at",
        { count: "exact" },
      )
      .eq("account_id", authority.value.accountId)
      .in("status", ["draft", "active"])
      .order("updated_at", { ascending: false })
      .order("id", { ascending: true })
      .range(offset, offset + WORKSPACE_PAGE_SIZE - 1);
    if (error || !Array.isArray(data) || !Number.isSafeInteger(count) || count === null) {
      return { ok: false, error: "unavailable" };
    }

    const rows = data.map((row) => normalizePage(row, authority.value.accountId));
    if (rows.some((row) => row === null)) return { ok: false, error: "unavailable" };
    const pages = rows as PageRow[];
    const configurations = await loadConfigurationRows(
      client,
      authority.value,
      pages.map((page) => page.id),
    );
    if (!configurations) return { ok: false, error: "unavailable" };

    const items = await Promise.all(
      pages.map(async (page) => {
        const configuration = resolveOperationalConfiguration(
          authority.value,
          page.id,
          configurations,
        );
        if (!configuration) return null;
        const revisions = await loadRevisionSummary(client, page);
        return revisions
          ? mapWorkspaceItem(page, configuration, revisions.latest, revisions.approved)
          : null;
      }),
    );
    if (items.some((item) => item === null)) return { ok: false, error: "unavailable" };
    const total = count as number;
    const nextOffset = offset + pages.length;
    return {
      ok: true,
      canMutate: authority.value.canMutate,
      page: {
        items: items as AccountLandingPageWorkspaceItem[],
        nextCursor: nextOffset < total ? String(nextOffset) : null,
        complete: nextOffset >= total,
      },
    };
  } catch {
    return { ok: false, error: "unavailable" };
  }
}

export async function getAccountLandingPageWorkspaceDetail(input: Readonly<{
  accountId: string;
  landingPageId: string;
  historyCursor?: string;
}>): Promise<AccountLandingPageWorkspaceDetailResult> {
  if (!isLandingPageWorkspaceEnabled()) return { ok: false, error: "disabled" };
  if (!UUID_RE.test(input.landingPageId)) return { ok: false, error: "not_found" };
  const historyOffset = parseCursor(input.historyCursor);
  if (historyOffset === null) return { ok: false, error: "unavailable" };
  const client = createServiceClient();
  const authority = await loadAuthority(input.accountId, client);
  if (!authority.ok) return authority.detailResult;

  try {
    const { data, error } = await client
      .from("account_landing_pages")
      .select("id,account_id,name,slug,status,approved_materialization_id,updated_at")
      .eq("id", input.landingPageId)
      .eq("account_id", authority.value.accountId)
      .in("status", ["draft", "active"])
      .limit(1)
      .maybeSingle();
    if (error) return { ok: false, error: "unavailable" };
    const page = normalizePage(data, authority.value.accountId);
    if (!page) return { ok: false, error: "not_found" };

    const configurations = await loadConfigurationRows(client, authority.value, [page.id]);
    if (!configurations) return { ok: false, error: "unavailable" };
    const configuration = resolveOperationalConfiguration(
      authority.value,
      page.id,
      configurations,
    );
    if (!configuration) return { ok: false, error: "invalid_configuration" };

    const { data: revisionData, error: revisionError, count } = await client
      .from("account_landing_page_materializations")
      .select("id,revision_number,created_at", { count: "exact" })
      .eq("account_id", authority.value.accountId)
      .eq("landing_page_id", page.id)
      .order("revision_number", { ascending: false })
      .order("id", { ascending: true })
      .range(historyOffset, historyOffset + HISTORY_PAGE_SIZE - 1);
    if (
      revisionError ||
      !Array.isArray(revisionData) ||
      count === null ||
      !Number.isSafeInteger(count)
    ) {
      return { ok: false, error: "unavailable" };
    }
    const revisions = revisionData.map(normalizeRevision);
    if (revisions.some((revision) => revision === null)) {
      return { ok: false, error: "unavailable" };
    }
    const normalizedRevisions = revisions as RevisionRow[];
    const latest = historyOffset === 0 ? normalizedRevisions[0] ?? null : await readLatest(client, page);
    const approved = page.approvedMaterializationId
      ? await readRevisionById(client, page, page.approvedMaterializationId)
      : null;
    if (page.approvedMaterializationId && !approved) {
      return { ok: false, error: "unavailable" };
    }
    const total = count as number;
    const nextOffset = historyOffset + normalizedRevisions.length;
    const landingPage = mapWorkspaceItem(page, configuration, latest, approved);
    return {
      ok: true,
      landingPage,
      configuration,
      canMutate: authority.value.canMutate,
      revisions: {
        items: normalizedRevisions.map((revision) => ({
          id: revision.id,
          number: revision.revisionNumber,
          createdAt: revision.createdAt,
          latest: revision.id === latest?.id,
          approved: revision.id === approved?.id,
        })),
        nextCursor: nextOffset < total ? String(nextOffset) : null,
        complete: nextOffset >= total,
      },
    };
  } catch {
    return { ok: false, error: "unavailable" };
  }
}

export async function saveAccountLandingPageOperationalConfiguration(input: Readonly<{
  accountId: string;
  landingPageId: string;
  values: AccountLandingPageOnboardingStoredValues;
  expectedSharedRevision: number | null;
  expectedLandingPageRevision: number | null;
  sameCommercialWorkConfirmed?: boolean;
}>): Promise<SaveAccountLandingPageOperationalConfigurationResult> {
  if (!isLandingPageWorkspaceEnabled()) return { ok: false, error: "disabled" };
  const client = createServiceClient();
  const authority = await loadAuthority(input.accountId, client);
  if (!authority.ok) return authority.saveResult;
  if (!authority.value.canMutate || !UUID_RE.test(input.landingPageId)) {
    return { ok: false, error: "unauthorized" };
  }

  const split = splitLandingPageWorkspaceValues(input.values);
  const candidate = resolveAccountLandingPageOnboardingConfiguration({
    accountId: authority.value.accountId,
    landingPageId: input.landingPageId,
    catalogVersion: LANDING_PAGE_WORKSPACE_REQUIRED_INPUT_CATALOG_VERSION,
    revision: input.expectedLandingPageRevision ?? 0,
    planKey: authority.value.planKey,
    taxonChain: authority.value.taxonChain,
    storedValues: { ...split.sharedValues, ...split.landingPageValues },
    authoritativeValues: authority.value.authoritativeValues,
  });
  if (!candidate.ok) {
    return {
      ok: false,
      error: "invalid_values",
      ...(candidate.fieldKey ? { fieldKey: candidate.fieldKey } : {}),
    };
  }
  const canonicalSplit = splitLandingPageWorkspaceValues(
    candidate.configuration.storedValues,
  );

  let identity: Awaited<ReturnType<typeof validateIdentityMutation>>;
  try {
    identity = await validateIdentityMutation(client, {
      accountId: authority.value.accountId,
      landingPageId: input.landingPageId,
      values: candidate.configuration.storedValues,
      sameCommercialWorkConfirmed: input.sameCommercialWorkConfirmed === true,
    });
  } catch {
    return { ok: false, error: "unavailable" };
  }
  if (!identity.ok) return identity.result;

  try {
    const { data, error } = await client.rpc(
      "save_account_landing_page_configuration_v1",
      {
        p_account_id: authority.value.accountId,
        p_landing_page_id: input.landingPageId,
        p_shared_values: canonicalSplit.sharedValues,
        p_landing_page_values: canonicalSplit.landingPageValues,
        p_expected_shared_revision: input.expectedSharedRevision,
        p_expected_landing_page_revision: input.expectedLandingPageRevision,
        p_catalog_version: LANDING_PAGE_WORKSPACE_REQUIRED_INPUT_CATALOG_VERSION,
        p_actor_user_id: authority.value.actorUserId,
        p_expected_latest_materialization_id: identity.latestMaterializationId,
      },
    );
    if (error) {
      if (error.code === "40001") return { ok: false, error: "revision_conflict" };
      if (error.message?.includes("landing_page_not_operational")) {
        return { ok: false, error: "not_operational" };
      }
      return { ok: false, error: "unavailable" };
    }
    const row = Array.isArray(data) ? data[0] : data;
    if (
      !isRecord(row) ||
      (row.shared_revision !== null && !isPositiveInteger(row.shared_revision)) ||
      !isPositiveInteger(row.landing_page_revision)
    ) {
      return { ok: false, error: "unavailable" };
    }
    return {
      ok: true,
      sharedRevision: row.shared_revision as number | null,
      landingPageRevision: row.landing_page_revision,
    };
  } catch {
    return { ok: false, error: "unavailable" };
  }
}

export async function getAccountLandingPageOperationalRevalidationAuthority(input: Readonly<{
  accountId: string;
  landingPageId: string;
}>): Promise<AccountLandingPageOperationalRevalidationResult> {
  const detail = await getAccountLandingPageWorkspaceDetail(input);
  if (!detail.ok) {
    const error =
      detail.error === "unauthenticated"
        ? "unauthenticated"
        : detail.error === "unauthorized"
          ? "membership_inactive"
          : detail.error === "not_found"
            ? "landing_page_not_found"
            : detail.error === "invalid_configuration"
              ? "invalid_configuration"
              : "read_failed";
    return { ok: false, error };
  }
  if (
    detail.configuration.landingPageRevision === null ||
    detail.configuration.landingPageCatalogVersion === null
  ) {
    return { ok: false, error: "configuration_not_found" };
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
      sharedRevision: detail.configuration.sharedRevision,
      sharedCatalogVersion: detail.configuration.sharedCatalogVersion,
      landingPageRevision: detail.configuration.landingPageRevision,
      landingPageCatalogVersion: detail.configuration.landingPageCatalogVersion,
    },
  };
}

export async function createWorkspaceLandingPage(input: Readonly<{
  accountId: string;
  name: string;
  slug: string;
}>): Promise<LandingPageWorkspaceMutationResult> {
  if (!isLandingPageWorkspaceEnabled()) return { ok: false, error: "disabled" };
  const authority = await loadAuthority(input.accountId, createServiceClient());
  if (!authority.ok) return authority.mutationResult;
  if (!authority.value.canMutate) return { ok: false, error: "unauthorized" };
  const result = await createAccountLandingPage(input);
  return result.ok
    ? { ok: true, landingPageId: result.landingPage.id }
    : {
        ok: false,
        error: ["unauthenticated", "membership_inactive"].includes(result.error)
          ? "unauthorized"
          : "unavailable",
      };
}

export async function approveAccountLandingPageRevision(input: Readonly<{
  accountId: string;
  landingPageId: string;
  materializationId: string;
}>): Promise<LandingPageWorkspaceMutationResult> {
  if (!isLandingPageWorkspaceEnabled()) return { ok: false, error: "disabled" };
  const client = createServiceClient();
  const authority = await loadAuthority(input.accountId, client);
  if (!authority.ok) return authority.mutationResult;
  if (
    !authority.value.canMutate ||
    !UUID_RE.test(input.landingPageId) ||
    !UUID_RE.test(input.materializationId)
  ) {
    return { ok: false, error: "unauthorized" };
  }
  try {
    const { data, error } = await client.rpc(
      "approve_account_landing_page_materialization_v1",
      {
        p_account_id: authority.value.accountId,
        p_landing_page_id: input.landingPageId,
        p_materialization_id: input.materializationId,
        p_actor_user_id: authority.value.actorUserId,
      },
    );
    if (error) {
      return {
        ok: false,
        error: error.message?.includes("materialization_not_found")
          ? "revision_not_found"
          : "not_operational",
      };
    }
    return data === input.materializationId
      ? { ok: true, approvedMaterializationId: input.materializationId }
      : { ok: false, error: "unavailable" };
  } catch {
    return { ok: false, error: "unavailable" };
  }
}

type PageRow = Readonly<{
  id: string;
  accountId: string;
  name: string;
  slug: string;
  status: "draft" | "active";
  approvedMaterializationId: string | null;
  updatedAt: string;
}>;
type RevisionRow = Readonly<{
  id: string;
  revisionNumber: number;
  createdAt: string;
}>;
type ConfigurationRows = Readonly<{
  shared: ResidenceRow | null;
  byLandingPage: ReadonlyMap<string, ResidenceRow>;
  onboarding: Readonly<{
    landingPageId: string | null;
    values: AccountLandingPageOnboardingStoredValues;
  }> | null;
}>;
type ResidenceRow = Readonly<{
  catalogVersion: number;
  revision: number;
  values: AccountLandingPageOnboardingStoredValues;
}>;

async function loadConfigurationRows(
  client: ServiceClient,
  authority: Authority,
  landingPageIds: readonly string[],
): Promise<ConfigurationRows | null> {
  const [sharedResult, pagesResult, onboardingResult] = await Promise.all([
    client
      .from("account_landing_page_shared_configurations")
      .select("account_id,catalog_version,values,revision")
      .eq("account_id", authority.accountId)
      .limit(1)
      .maybeSingle(),
    landingPageIds.length
      ? client
          .from("account_landing_page_configurations")
          .select("landing_page_id,account_id,catalog_version,values,revision")
          .eq("account_id", authority.accountId)
          .in("landing_page_id", [...landingPageIds])
      : Promise.resolve({ data: [], error: null }),
    client
      .from("account_landing_page_onboarding_configurations")
      .select("landing_page_id,values")
      .eq("account_id", authority.accountId)
      .limit(1)
      .maybeSingle(),
  ]);
  if (sharedResult.error || pagesResult.error || onboardingResult.error) return null;
  const shared = sharedResult.data
    ? normalizeResidence(sharedResult.data, authority.accountId, null)
    : null;
  if (sharedResult.data && !shared) return null;
  if (!Array.isArray(pagesResult.data)) return null;
  const byLandingPage = new Map<string, ResidenceRow>();
  for (const value of pagesResult.data) {
    if (!isRecord(value) || typeof value.landing_page_id !== "string") return null;
    const row = normalizeResidence(value, authority.accountId, value.landing_page_id);
    if (!row || byLandingPage.has(value.landing_page_id)) return null;
    byLandingPage.set(value.landing_page_id, row);
  }
  let onboarding: ConfigurationRows["onboarding"] = null;
  if (onboardingResult.data) {
    const value = onboardingResult.data;
    if (
      !isRecord(value) ||
      (value.landing_page_id !== null && typeof value.landing_page_id !== "string") ||
      !isRecord(value.values)
    ) return null;
    onboarding = {
      landingPageId: value.landing_page_id as string | null,
      values: value.values as AccountLandingPageOnboardingStoredValues,
    };
  }
  return { shared, byLandingPage, onboarding };
}

function resolveOperationalConfiguration(
  authority: Authority,
  landingPageId: string,
  rows: ConfigurationRows,
): AccountLandingPageOperationalConfiguration | null {
  const page = rows.byLandingPage.get(landingPageId) ?? null;
  const bootstrap =
    !page && rows.onboarding?.landingPageId === landingPageId
      ? splitLandingPageWorkspaceValues(rows.onboarding.values)
      : null;
  const sharedValues = rows.shared?.values ?? bootstrap?.sharedValues ?? {};
  const landingPageValues = page?.values ?? bootstrap?.landingPageValues ?? {};
  const resolved = resolveAccountLandingPageOnboardingConfiguration({
    accountId: authority.accountId,
    landingPageId,
    catalogVersion: LANDING_PAGE_WORKSPACE_REQUIRED_INPUT_CATALOG_VERSION,
    revision: page?.revision ?? 0,
    planKey: authority.planKey,
    taxonChain: authority.taxonChain,
    storedValues: { ...sharedValues, ...landingPageValues },
    authoritativeValues: authority.authoritativeValues,
  });
  if (!resolved.ok) return null;
  return {
    accountId: authority.accountId,
    landingPageId,
    sharedCatalogVersion: rows.shared?.catalogVersion ?? null,
    landingPageCatalogVersion: page?.catalogVersion ?? null,
    sharedRevision: rows.shared?.revision ?? null,
    landingPageRevision: page?.revision ?? null,
    sharedValues,
    landingPageValues,
    resolved: resolved.configuration,
  };
}

async function loadRevisionSummary(client: ServiceClient, page: PageRow) {
  const latest = await readLatest(client, page);
  const approved = page.approvedMaterializationId
    ? await readRevisionById(client, page, page.approvedMaterializationId)
    : null;
  return page.approvedMaterializationId && !approved ? null : { latest, approved };
}

async function readLatest(client: ServiceClient, page: PageRow): Promise<RevisionRow | null> {
  const { data, error } = await client
    .from("account_landing_page_materializations")
    .select("id,revision_number,created_at")
    .eq("account_id", page.accountId)
    .eq("landing_page_id", page.id)
    .order("revision_number", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error("latest_revision_read_failed");
  return data ? normalizeRevision(data) : null;
}

async function readRevisionById(
  client: ServiceClient,
  page: PageRow,
  revisionId: string,
): Promise<RevisionRow | null> {
  const { data, error } = await client
    .from("account_landing_page_materializations")
    .select("id,revision_number,created_at")
    .eq("id", revisionId)
    .eq("account_id", page.accountId)
    .eq("landing_page_id", page.id)
    .limit(1)
    .maybeSingle();
  if (error) throw new Error("approved_revision_read_failed");
  return data ? normalizeRevision(data) : null;
}

function mapWorkspaceItem(
  page: PageRow,
  configuration: AccountLandingPageOperationalConfiguration,
  latest: RevisionRow | null,
  approved: RevisionRow | null,
): AccountLandingPageWorkspaceItem {
  return {
    id: page.id,
    accountId: page.accountId,
    name: page.name,
    slug: page.slug,
    status: page.status,
    state: deriveLandingPageWorkspaceState({
      configuration: configuration.resolved,
      latestRevisionId: latest?.id ?? null,
      approvedRevisionId: approved?.id ?? null,
    }),
    latestRevision: latest
      ? { id: latest.id, number: latest.revisionNumber, createdAt: latest.createdAt }
      : null,
    approvedRevision: approved
      ? { id: approved.id, number: approved.revisionNumber }
      : null,
    updatedAt: page.updatedAt,
  };
}

async function validateIdentityMutation(
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
  const baselines = new Map<string, unknown>();
  let firstOffer: unknown = undefined;
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
      const facts = readSnapshotFacts(row.generation_context_snapshot_json);
      for (const fact of facts) {
        if (IDENTITY_FIELDS.includes(fact.fieldKey as (typeof IDENTITY_FIELDS)[number])) {
          if (!baselines.has(fact.fieldKey)) baselines.set(fact.fieldKey, fact.value);
        }
        if (fact.fieldKey === "primary_service_or_offer" && firstOffer === undefined) {
          firstOffer = fact.value;
        }
      }
    }
    if (data.length < BASELINE_PAGE_SIZE) break;
    offset += data.length;
  }
  for (const fieldKey of IDENTITY_FIELDS) {
    const baseline = baselines.get(fieldKey);
    const next = input.values[fieldKey]?.value;
    if (baseline !== undefined && next !== undefined && !deepEqual(baseline, next)) {
      return {
        ok: false,
        result: {
          ok: false,
          error: "identity_change_requires_new_landing_page",
          fieldKey,
        },
      };
    }
  }
  const nextOffer = input.values.primary_service_or_offer?.value;
  const currentOffer = hasRevision
    ? await readCurrentConfiguredOffer(client, input.accountId, input.landingPageId)
    : undefined;
  if (
    hasRevision &&
    nextOffer !== undefined &&
    !deepEqual(currentOffer ?? firstOffer, nextOffer) &&
    !input.sameCommercialWorkConfirmed
  ) {
    return {
      ok: false,
      result: {
        ok: false,
        error: "offer_change_confirmation_required",
        fieldKey: "primary_service_or_offer",
      },
    };
  }
  return { ok: true, latestMaterializationId };
}

async function readCurrentConfiguredOffer(
  client: ServiceClient,
  accountId: string,
  landingPageId: string,
): Promise<unknown> {
  const { data: operational, error } = await client
    .from("account_landing_page_configurations")
    .select("values")
    .eq("account_id", accountId)
    .eq("landing_page_id", landingPageId)
    .limit(1)
    .maybeSingle();
  if (error) throw new Error("landing_page_configuration_read_failed");
  if (isRecord(operational)) {
    if (isRecord(operational.values)) {
      const stored = operational.values.primary_service_or_offer;
      if (isRecord(stored) && Object.hasOwn(stored, "value")) return stored.value;
    }
    return undefined;
  }
  const { data: onboarding, error: onboardingError } = await client
    .from("account_landing_page_onboarding_configurations")
    .select("values")
    .eq("account_id", accountId)
    .eq("landing_page_id", landingPageId)
    .limit(1)
    .maybeSingle();
  if (onboardingError) throw new Error("onboarding_bootstrap_read_failed");
  if (isRecord(onboarding) && isRecord(onboarding.values)) {
    const stored = onboarding.values.primary_service_or_offer;
    if (isRecord(stored) && Object.hasOwn(stored, "value")) return stored.value;
  }
  return undefined;
}

function readSnapshotFacts(value: unknown): readonly Readonly<{ fieldKey: string; value: unknown }>[] {
  if (!isRecord(value) || !isRecord(value.generationContext)) return [];
  const context = value.generationContext;
  if (!isRecord(context.modelContext) || !Array.isArray(context.modelContext.facts)) return [];
  const serverFacts = Array.isArray(context.bindingFacts) ? context.bindingFacts : [];
  return [...context.modelContext.facts, ...serverFacts].filter(
    (fact): fact is { fieldKey: string; value: unknown } =>
      isRecord(fact) && typeof fact.fieldKey === "string" && Object.hasOwn(fact, "value"),
  );
}

async function loadAuthority(
  accountIdInput: string,
  client: ServiceClient,
): Promise<
  | Readonly<{ ok: true; value: Authority }>
  | Readonly<{
      ok: false;
      workspaceResult: Extract<AccountLandingPageWorkspaceResult, { ok: false }>;
      detailResult: Extract<AccountLandingPageWorkspaceDetailResult, { ok: false }>;
      saveResult: Extract<SaveAccountLandingPageOperationalConfigurationResult, { ok: false }>;
      mutationResult: Extract<LandingPageWorkspaceMutationResult, { ok: false }>;
    }>
> {
  const accountId = String(accountIdInput ?? "").trim();
  const actorUserId = await getAuthenticatedUserId();
  if (!actorUserId) return authorityFailure("unauthenticated");
  if (!UUID_RE.test(accountId)) return authorityFailure("unauthorized");
  try {
    const [{ data: account, error: accountError }, { data: membership, error: membershipError }] =
      await Promise.all([
        client.from("accounts").select("id,name,status").eq("id", accountId).limit(1).maybeSingle(),
        client
          .from("account_users")
          .select("role,status")
          .eq("account_id", accountId)
          .eq("user_id", actorUserId)
          .limit(1)
          .maybeSingle(),
      ]);
    if (accountError || membershipError) return authorityFailure("unavailable");
    if (
      !isRecord(account) ||
      account.status !== "active" ||
      !isRecord(membership) ||
      membership.status !== "active"
    ) return authorityFailure("unauthorized");
    const entitlement = await getCommercialEntitlementSignal({ accountId });
    if (
      !entitlement.isCommerciallyEligible ||
      !["starter", "lite", "pro", "ultra"].includes(String(entitlement.planKey))
    ) return authorityFailure("unauthorized");
    const taxonChain = await readTaxonChain(client, accountId);
    if (!taxonChain) return authorityFailure("unavailable");
    const servedTaxon = taxonChain.ultraNiche ?? taxonChain.niche ?? taxonChain.segment;
    const preparation = await loadTaxonPreparationForVersion({
      taxonId: servedTaxon.id,
      requiredInputCatalogVersion: LANDING_PAGE_WORKSPACE_REQUIRED_INPUT_CATALOG_VERSION,
    });
    if (
      !preparation.ok ||
      preparation.value.requiredInputCatalogVersion !== LANDING_PAGE_WORKSPACE_REQUIRED_INPUT_CATALOG_VERSION ||
      preparation.value.reviewedInputCatalogVersion !== LANDING_PAGE_WORKSPACE_REQUIRED_INPUT_CATALOG_VERSION
    ) return authorityFailure("unavailable");
    return {
      ok: true,
      value: {
        actorUserId,
        accountId,
        canMutate: ["owner", "admin"].includes(String(membership.role)),
        planKey: entitlement.planKey as LandingPageInputCatalogPlan,
        taxonChain,
        authoritativeValues:
          typeof account.name === "string" && account.name.trim()
            ? { business_display_name: account.name.trim() }
            : {},
      },
    };
  } catch {
    return authorityFailure("unavailable");
  }
}

async function readTaxonChain(
  client: ServiceClient,
  accountId: string,
): Promise<LandingPageInputCatalogTaxonChain | null> {
  const { data: link, error } = await client
    .from("account_taxonomy")
    .select("taxon_id")
    .eq("account_id", accountId)
    .eq("is_primary", true)
    .eq("status", "active")
    .limit(1)
    .maybeSingle();
  if (error || !isRecord(link) || typeof link.taxon_id !== "string") return null;
  const nodes: Array<{
    id: string;
    name: string;
    slug: string;
    level: "segment" | "niche" | "ultra_niche";
    isActive: true;
    parentId: string | null;
  }> = [];
  let currentId: string | null = link.taxon_id;
  for (let depth = 0; depth < 3 && currentId; depth += 1) {
    const response: { data: unknown; error: unknown } = await client
      .from("business_taxons")
      .select("id,name,slug,level,is_active,parent_id")
      .eq("id", currentId)
      .limit(1)
      .maybeSingle();
    const data = response.data;
    const nodeError = response.error;
    if (
      nodeError ||
      !isRecord(data) ||
      data.is_active !== true ||
      typeof data.id !== "string" ||
      typeof data.name !== "string" ||
      typeof data.slug !== "string" ||
      !["segment", "niche", "ultra_niche"].includes(String(data.level))
    ) return null;
    nodes.push({
      id: data.id,
      name: data.name,
      slug: data.slug,
      level: data.level as "segment" | "niche" | "ultra_niche",
      isActive: true,
      parentId: typeof data.parent_id === "string" ? data.parent_id : null,
    });
    if (data.level === "segment") break;
    currentId = typeof data.parent_id === "string" ? data.parent_id : null;
  }
  const ordered = nodes.reverse();
  const segment = ordered.find((node) => node.level === "segment");
  const niche = ordered.find((node) => node.level === "niche");
  const ultraNiche = ordered.find((node) => node.level === "ultra_niche");
  return segment && (!ultraNiche || niche)
    ? { segment, ...(niche ? { niche } : {}), ...(ultraNiche ? { ultraNiche } : {}) }
    : null;
}

async function getAuthenticatedUserId() {
  try {
    const client = await createClient();
    const { data: { user }, error } = await client.auth.getUser();
    return error || !user?.id ? null : user.id;
  } catch {
    return null;
  }
}

function authorityFailure(error: "unauthenticated" | "unauthorized" | "unavailable") {
  return {
    ok: false as const,
    workspaceResult: { ok: false as const, error },
    detailResult: { ok: false as const, error },
    saveResult: { ok: false as const, error },
    mutationResult: { ok: false as const, error },
  };
}

function normalizePage(value: unknown, accountId: string): PageRow | null {
  if (
    !isRecord(value) ||
    typeof value.id !== "string" ||
    value.account_id !== accountId ||
    typeof value.name !== "string" ||
    typeof value.slug !== "string" ||
    !isOperationalLandingPageStatus(value.status) ||
    (value.approved_materialization_id !== null && typeof value.approved_materialization_id !== "string") ||
    typeof value.updated_at !== "string"
  ) return null;
  return {
    id: value.id,
    accountId,
    name: value.name,
    slug: value.slug,
    status: value.status,
    approvedMaterializationId: value.approved_materialization_id as string | null,
    updatedAt: value.updated_at,
  };
}

function normalizeResidence(
  value: unknown,
  accountId: string,
  landingPageId: string | null,
): ResidenceRow | null {
  if (
    !isRecord(value) ||
    value.account_id !== accountId ||
    (landingPageId !== null && value.landing_page_id !== landingPageId) ||
    !isPositiveInteger(value.catalog_version) ||
    !isPositiveInteger(value.revision) ||
    !isRecord(value.values)
  ) return null;
  return {
    catalogVersion: value.catalog_version,
    revision: value.revision,
    values: value.values as AccountLandingPageOnboardingStoredValues,
  };
}

function normalizeRevision(value: unknown): RevisionRow | null {
  if (
    !isRecord(value) ||
    typeof value.id !== "string" ||
    !isPositiveInteger(value.revision_number) ||
    typeof value.created_at !== "string"
  ) return null;
  return {
    id: value.id,
    revisionNumber: value.revision_number,
    createdAt: value.created_at,
  };
}

function parseCursor(value: string | undefined): number | null {
  if (value === undefined || value === "") return 0;
  if (!/^\d+$/.test(value)) return null;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed >= 0 ? parsed : null;
}

function deepEqual(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

function isPositiveInteger(value: unknown): value is number {
  return Number.isSafeInteger(value) && (value as number) > 0;
}

function isRecord(value: unknown): value is Record<string, any> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
