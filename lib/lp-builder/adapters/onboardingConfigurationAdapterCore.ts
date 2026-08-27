import {
  resolveLandingPageInputCatalog,
  type LandingPageInputCatalogTaxonChain,
} from "../../conversion-content/landing-page/input-catalog";
import type { TaxonPreparationResult } from "../../conversion-content/landing-page/taxon-preparation";
import type { CommercialEntitlementSignal } from "../../commercial-entitlements";
import { isOperationalLandingPageStatus } from "../../types/status";
import {
  type AccountLandingPage,
  type AccountLandingPageDraftsResult,
  type AccountLandingPageOnboardingResult,
  type AccountLandingPageOnboardingRevalidationResult,
  type AccountLandingPageOnboardingStoredValues,
  type BindAccountLandingPageOnboardingConfigurationInput,
  type SaveAccountLandingPageOnboardingConfigurationInput,
} from "../contracts";
import {
  isAccountLandingPageOnboardingActorAuthorized,
  isUnavailableOnboardingConfigurationError,
  resolveAccountLandingPageOnboardingConfiguration,
  stripAuthoritativeOnboardingValues,
} from "../onboardingConfiguration";

type QueryClient = {
  from: (relation: string) => any;
};

export type AccountLandingPageOnboardingEntitlementLoader = (input: {
  accountId: string;
}) => Promise<CommercialEntitlementSignal>;

export type AccountLandingPageOnboardingCatalogVersionLoader = (input: {
  taxonId: string;
}) => Promise<TaxonPreparationResult>;

type AccountRow = {
  id: string;
  name: string | null;
  status: string | null;
};

type ConfigurationRow = {
  account_id: string;
  landing_page_id: string | null;
  catalog_version: number;
  values: unknown;
  revision: number;
};

type RuntimeContext = {
  account: AccountRow;
  planKey: string;
  taxonChain: LandingPageInputCatalogTaxonChain;
  authoritativeValues: Readonly<Record<string, unknown>>;
  row: ConfigurationRow | null;
  operationalCatalogVersion: number;
};

type RuntimeContextResult =
  | { ok: true; context: RuntimeContext }
  | Extract<AccountLandingPageOnboardingResult, { ok: false }>;

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const LANDING_PAGE_DRAFT_PAGE_SIZE = 500;

export async function getAccountLandingPageOnboardingConfigurationFromClient(
  input: { accountId: string; actorUserId: string },
  client: QueryClient,
  entitlementLoader: AccountLandingPageOnboardingEntitlementLoader,
  catalogVersionLoader: AccountLandingPageOnboardingCatalogVersionLoader,
): Promise<AccountLandingPageOnboardingResult> {
  const runtime = await loadRuntimeContext(
    input,
    client,
    entitlementLoader,
    catalogVersionLoader,
  );
  if (!runtime.ok) return runtime;
  return resolveRuntimeContext(runtime.context);
}

export async function getAccountLandingPageOnboardingRevalidationAuthorityFromClient(
  input: { accountId: string; actorUserId: string },
  client: QueryClient,
  entitlementLoader: AccountLandingPageOnboardingEntitlementLoader,
  catalogVersionLoader: AccountLandingPageOnboardingCatalogVersionLoader,
): Promise<AccountLandingPageOnboardingRevalidationResult> {
  const runtime = await loadRuntimeContext(
    input,
    client,
    entitlementLoader,
    catalogVersionLoader,
  );
  if (!runtime.ok) return runtime;
  if (!runtime.context.row) return failure("configuration_not_found");
  return resolveAccountLandingPageOnboardingRevalidationAuthority({
    accountId: runtime.context.account.id,
    landingPageId: runtime.context.row.landing_page_id,
    historicalCatalogVersion: runtime.context.row.catalog_version,
    revision: runtime.context.row.revision,
    currentPlanKey: runtime.context.planKey,
    currentTaxonChain: runtime.context.taxonChain,
    historicalStoredValues: runtime.context.row.values as AccountLandingPageOnboardingStoredValues,
    currentAuthoritativeValues: runtime.context.authoritativeValues,
  });
}

export function resolveAccountLandingPageOnboardingRevalidationAuthority(input: {
  accountId: string;
  landingPageId: string | null;
  historicalCatalogVersion: number;
  revision: number;
  currentPlanKey: string;
  currentTaxonChain: LandingPageInputCatalogTaxonChain;
  historicalStoredValues: AccountLandingPageOnboardingStoredValues;
  currentAuthoritativeValues: Readonly<Record<string, unknown>>;
}): AccountLandingPageOnboardingRevalidationResult {
  const historicalCatalog = resolveLandingPageInputCatalog({
    version: input.historicalCatalogVersion,
    plan: input.currentPlanKey,
    taxonChain: input.currentTaxonChain,
  });
  if (!historicalCatalog.ok) return failure("catalog_unavailable");

  const historicalFieldKeys = new Set(
    historicalCatalog.value.fields.map((field) => field.fieldKey),
  );
  const historicalAuthoritativeValues = Object.fromEntries(
    Object.entries(input.currentAuthoritativeValues).filter(([fieldKey]) =>
      historicalFieldKeys.has(fieldKey),
    ),
  );
  const historicalConfiguration =
    resolveAccountLandingPageOnboardingConfiguration({
      accountId: input.accountId,
      landingPageId: input.landingPageId,
      catalogVersion: input.historicalCatalogVersion,
      revision: input.revision,
      planKey: input.currentPlanKey,
      taxonChain: input.currentTaxonChain,
      storedValues: input.historicalStoredValues,
      authoritativeValues: historicalAuthoritativeValues,
    });
  if (!historicalConfiguration.ok) {
    return failure(
      historicalConfiguration.error === "CATALOG_UNAVAILABLE"
        ? "catalog_unavailable"
        : "invalid_configuration",
      historicalConfiguration.fieldKey,
    );
  }

  return {
    ok: true,
    authority: Object.freeze({
      historicalConfiguration: historicalConfiguration.configuration,
      currentPlanKey: historicalConfiguration.configuration.planKey,
      currentTaxonChain: historicalConfiguration.configuration.taxonChain,
      currentAuthoritativeValues: Object.freeze({
        ...input.currentAuthoritativeValues,
      }),
    }),
  };
}

export async function saveAccountLandingPageOnboardingConfigurationFromClient(
  input: SaveAccountLandingPageOnboardingConfigurationInput & {
    actorUserId: string;
  },
  client: QueryClient,
  entitlementLoader: AccountLandingPageOnboardingEntitlementLoader,
  catalogVersionLoader: AccountLandingPageOnboardingCatalogVersionLoader,
): Promise<AccountLandingPageOnboardingResult> {
  if (
    !Number.isInteger(input.expectedRevision) ||
    input.expectedRevision < 0 ||
    !isRecord(input.values)
  ) {
    return failure("invalid_values");
  }

  const runtime = await loadRuntimeContext(
    input,
    client,
    entitlementLoader,
    catalogVersionLoader,
  );
  if (!runtime.ok) return runtime;

  if (runtime.context.row && runtime.context.row.landing_page_id !== null) {
    return failure("landing_page_already_bound");
  }

  const currentRevision = runtime.context.row?.revision ?? 0;
  if (currentRevision !== input.expectedRevision) {
    return failure("revision_conflict");
  }
  const persistableValues = Object.fromEntries(
    Object.entries(
      stripAuthoritativeOnboardingValues(
        input.values,
        runtime.context.authoritativeValues,
      ),
    ).filter(([fieldKey]) => fieldKey !== "brand_logo_asset"),
  );
  const candidate = resolveAccountLandingPageOnboardingConfiguration({
    accountId: runtime.context.account.id,
    landingPageId: runtime.context.row?.landing_page_id ?? null,
    catalogVersion: runtime.context.operationalCatalogVersion,
    revision: Math.max(1, input.expectedRevision + 1),
    planKey: runtime.context.planKey,
    taxonChain: runtime.context.taxonChain,
    storedValues: persistableValues,
    authoritativeValues: runtime.context.authoritativeValues,
  });
  if (!candidate.ok) {
    return failure(
      candidate.error === "CATALOG_UNAVAILABLE"
        ? "catalog_unavailable"
        : "invalid_values",
      candidate.fieldKey,
    );
  }

  const payload = {
    catalog_version: runtime.context.operationalCatalogVersion,
    values: persistableValues,
    updated_by: input.actorUserId,
  };

  let written: unknown = null;
  if (!runtime.context.row) {
    // PostgREST max-affected applies only to PATCH/DELETE. A single-object
    // insert plus the account_id primary key bounds creation to one row and
    // turns a concurrent second creation into an explicit 23505 conflict.
    const { data, error } = await client
      .from("account_landing_page_onboarding_configurations")
      .insert({
        account_id: runtime.context.account.id,
        landing_page_id: null,
        ...payload,
        revision: 1,
        created_by: input.actorUserId,
      })
      .select(
        "account_id,landing_page_id,catalog_version,values,revision",
      )
      .maybeSingle();

    if (error) {
      if (error.code === "23505") return failure("revision_conflict");
      if (isUnavailableOnboardingConfigurationError(error)) {
        return failure("configuration_unavailable");
      }
      logDatabaseError("configuration insert failed", error, input.accountId);
      return failure("write_failed");
    }
    written = data;
  } else {
    const { data, error } = await client
      .from("account_landing_page_onboarding_configurations")
      .update({
        ...payload,
        revision: input.expectedRevision + 1,
      })
      .eq("account_id", runtime.context.account.id)
      .eq("revision", input.expectedRevision)
      .maxAffected(1)
      .select(
        "account_id,landing_page_id,catalog_version,values,revision",
      )
      .maybeSingle();

    if (error) {
      if (isUnavailableOnboardingConfigurationError(error)) {
        return failure("configuration_unavailable");
      }
      logDatabaseError("configuration update failed", error, input.accountId);
      return failure("write_failed");
    }
    if (!data) {
      return classifyZeroRowMutation(
        runtime.context.account.id,
        input.expectedRevision,
        client,
      );
    }
    written = data;
  }

  const row = normalizeConfigurationRow(written, runtime.context.account.id);
  if (!row) return failure("write_failed");

  return resolveRuntimeContext({ ...runtime.context, row });
}

export async function listAccountLandingPageDraftsFromClient(
  input: { accountId: string; actorUserId: string },
  client: QueryClient,
  entitlementLoader: AccountLandingPageOnboardingEntitlementLoader,
  catalogVersionLoader: AccountLandingPageOnboardingCatalogVersionLoader,
): Promise<AccountLandingPageDraftsResult> {
  const runtime = await loadRuntimeContext(
    input,
    client,
    entitlementLoader,
    catalogVersionLoader,
  );
  if (!runtime.ok) return runtime;

  const configuration = resolveRuntimeContext(runtime.context);
  if (!configuration.ok) return configuration;
  if (!configuration.configuration.complete) {
    return failure("configuration_incomplete");
  }

  const drafts: AccountLandingPage[] = [];
  let offset = 0;
  while (true) {
    const { data, error } = await client
      .from("account_landing_pages")
      .select("id,account_id,name,slug,status")
      .eq("account_id", runtime.context.account.id)
      .in("status", ["draft", "active"])
      .order("created_at", { ascending: true })
      .order("id", { ascending: true })
      .range(offset, offset + LANDING_PAGE_DRAFT_PAGE_SIZE - 1);

    if (error) {
      logDatabaseError("landing page drafts read failed", error, input.accountId);
      return failure("read_failed");
    }
    if (!Array.isArray(data)) return failure("read_failed");
    const page = data.map((value) =>
      normalizeLandingPageDraft(value, runtime.context.account.id),
    );
    if (page.some((draft) => draft === null)) return failure("read_failed");
    drafts.push(...(page as AccountLandingPage[]));
    if (data.length < LANDING_PAGE_DRAFT_PAGE_SIZE) break;
    offset += data.length;
  }
  return { ok: true, drafts };
}

export async function bindAccountLandingPageOnboardingConfigurationFromClient(
  input: BindAccountLandingPageOnboardingConfigurationInput & {
    actorUserId: string;
  },
  client: QueryClient,
  entitlementLoader: AccountLandingPageOnboardingEntitlementLoader,
  catalogVersionLoader: AccountLandingPageOnboardingCatalogVersionLoader,
): Promise<AccountLandingPageOnboardingResult> {
  if (
    !UUID_RE.test(String(input.landingPageId ?? "").trim()) ||
    !Number.isInteger(input.expectedRevision) ||
    input.expectedRevision <= 0
  ) {
    return failure("invalid_values");
  }

  const runtime = await loadRuntimeContext(
    input,
    client,
    entitlementLoader,
    catalogVersionLoader,
  );
  if (!runtime.ok) return runtime;
  const configuration = resolveRuntimeContext(runtime.context);
  if (!configuration.ok) return configuration;
  if (!configuration.configuration.complete) {
    return failure("configuration_incomplete");
  }
  if (!runtime.context.row) return failure("configuration_not_found");
  if (runtime.context.row.revision !== input.expectedRevision) {
    return failure("revision_conflict");
  }
  if (runtime.context.row.landing_page_id !== null) {
    return failure("landing_page_already_bound");
  }

  const landingPageId = input.landingPageId.trim();
  const { data: draft, error: draftError } = await client
    .from("account_landing_pages")
    .select("id,account_id,name,slug,status")
    .eq("id", landingPageId)
    .eq("account_id", runtime.context.account.id)
    .in("status", ["draft", "active"])
    .limit(1)
    .maybeSingle();
  if (draftError) {
    logDatabaseError("landing page draft gate failed", draftError, input.accountId);
    return failure("read_failed");
  }
  if (!normalizeLandingPageDraft(draft, runtime.context.account.id)) {
    return failure("landing_page_not_found");
  }

  const { data, error } = await client
    .from("account_landing_page_onboarding_configurations")
    .update({
      landing_page_id: landingPageId,
      revision: input.expectedRevision + 1,
      updated_by: input.actorUserId,
    })
    .eq("account_id", runtime.context.account.id)
    .eq("revision", input.expectedRevision)
    .is("landing_page_id", null)
    .maxAffected(1)
    .select("account_id,landing_page_id,catalog_version,values,revision")
    .maybeSingle();

  if (error) {
    if (isUnavailableOnboardingConfigurationError(error)) {
      return failure("configuration_unavailable");
    }
    logDatabaseError("configuration bind failed", error, input.accountId);
    return failure("write_failed");
  }
  if (!data) {
    return classifyZeroRowBind(
      runtime.context.account.id,
      input.expectedRevision,
      client,
    );
  }

  const row = normalizeConfigurationRow(data, runtime.context.account.id);
  if (!row || row.landing_page_id !== landingPageId) {
    return failure("write_failed");
  }
  return resolveRuntimeContext({ ...runtime.context, row });
}

async function loadRuntimeContext(
  input: { accountId: string; actorUserId: string },
  client: QueryClient,
  entitlementLoader: AccountLandingPageOnboardingEntitlementLoader,
  catalogVersionLoader: AccountLandingPageOnboardingCatalogVersionLoader,
): Promise<RuntimeContextResult> {
  const accountId = String(input.accountId ?? "").trim();
  const actorUserId = String(input.actorUserId ?? "").trim();
  if (!UUID_RE.test(accountId)) return failure("invalid_account_id");
  if (!UUID_RE.test(actorUserId)) return failure("unauthenticated");

  try {
    const { data: accountData, error: accountError } = await client
      .from("accounts")
      .select("id,name,status")
      .eq("id", accountId)
      .limit(1)
      .maybeSingle();
    if (accountError) {
      logDatabaseError("account gate failed", accountError, accountId);
      return failure("read_failed");
    }
    const account = normalizeAccountRow(accountData);
    if (!account) return failure("account_not_found");
    if (account.status !== "active") return failure("account_not_active");

    const { data: membership, error: membershipError } = await client
      .from("account_users")
      .select("role,status")
      .eq("account_id", accountId)
      .eq("user_id", actorUserId)
      .limit(1)
      .maybeSingle();
    if (membershipError) {
      logDatabaseError("membership gate failed", membershipError, accountId);
      return failure("read_failed");
    }
    if (!isAuthorizedMembership(membership)) {
      return failure("membership_inactive");
    }

    const entitlement = await entitlementLoader({ accountId });
    if (!entitlement.isCommerciallyEligible || !entitlement.planKey) {
      return failure("commercial_entitlement_required");
    }

    const taxonChain = await readAuthoritativeTaxonChain(client, accountId);
    if (!taxonChain.ok) return taxonChain;

    const { data: configurationData, error: configurationError } = await client
      .from("account_landing_page_onboarding_configurations")
      .select("account_id,landing_page_id,catalog_version,values,revision")
      .eq("account_id", accountId)
      .limit(1)
      .maybeSingle();
    if (configurationError) {
      if (isUnavailableOnboardingConfigurationError(configurationError)) {
        return failure("configuration_unavailable");
      }
      logDatabaseError("configuration read failed", configurationError, accountId);
      return failure("read_failed");
    }

    const row = configurationData
      ? normalizeConfigurationRow(configurationData, accountId)
      : null;
    if (configurationData && !row) return failure("invalid_configuration");

    let operationalCatalogVersion: number;
    if (row && row.landing_page_id !== null) {
      operationalCatalogVersion = row.catalog_version;
    } else {
      const servedTaxonId = (
        taxonChain.value.ultraNiche ??
        taxonChain.value.niche ??
        taxonChain.value.segment
      ).id;
      const preparation = await catalogVersionLoader({ taxonId: servedTaxonId });
      if (!preparation.ok) {
        return failure("catalog_unavailable");
      }
      if (
        !Number.isSafeInteger(preparation.value.effectiveInputCatalogVersion) ||
        preparation.value.effectiveInputCatalogVersion <= 0
      ) {
        return failure("catalog_unavailable");
      }
      operationalCatalogVersion = preparation.value.effectiveInputCatalogVersion;
    }

    return {
      ok: true,
      context: {
        account,
        planKey: entitlement.planKey,
        taxonChain: taxonChain.value,
        authoritativeValues: buildAuthoritativeValues(account),
        row,
        operationalCatalogVersion,
      },
    };
  } catch (error) {
    console.error("[lp-builder] onboarding configuration read failed", {
      message: error instanceof Error ? error.message : String(error),
      account_id: accountId,
    });
    return failure("read_failed");
  }
}

function resolveRuntimeContext(
  context: RuntimeContext,
): AccountLandingPageOnboardingResult {
  const resolved = resolveAccountLandingPageOnboardingConfiguration({
    accountId: context.account.id,
    landingPageId: context.row?.landing_page_id ?? null,
    catalogVersion: context.operationalCatalogVersion,
    revision: context.row?.revision ?? 0,
    planKey: context.planKey,
    taxonChain: context.taxonChain,
    storedValues: (context.row?.values ?? {}) as AccountLandingPageOnboardingStoredValues,
    authoritativeValues: context.authoritativeValues,
  });

  if (!resolved.ok) {
    if (resolved.error === "CATALOG_UNAVAILABLE") {
      return failure("catalog_unavailable", resolved.fieldKey);
    }
    return failure("invalid_configuration", resolved.fieldKey);
  }
  return { ok: true, configuration: resolved.configuration };
}

async function readAuthoritativeTaxonChain(
  client: QueryClient,
  accountId: string,
): Promise<
  | { ok: true; value: LandingPageInputCatalogTaxonChain }
  | Extract<AccountLandingPageOnboardingResult, { ok: false }>
> {
  const { data: link, error: linkError } = await client
    .from("account_taxonomy")
    .select("taxon_id")
    .eq("account_id", accountId)
    .eq("is_primary", true)
    .eq("status", "active")
    .limit(1)
    .maybeSingle();
  if (linkError) {
    logDatabaseError("primary taxon link read failed", linkError, accountId);
    return failure("read_failed");
  }
  const primaryTaxonId = isRecord(link) ? link.taxon_id : null;
  if (typeof primaryTaxonId !== "string") return failure("taxon_unavailable");

  const nodes: Array<{
    id: string;
    name: string;
    slug: string;
    level: "segment" | "niche" | "ultra_niche";
    isActive: boolean;
    parentId: string | null;
  }> = [];
  let currentId: string | null = primaryTaxonId;

  for (let depth = 0; depth < 3 && currentId; depth += 1) {
    const { data, error } = await client
      .from("business_taxons")
      .select("id,name,slug,level,is_active,parent_id")
      .eq("id", currentId)
      .limit(1)
      .maybeSingle();
    if (error) {
      logDatabaseError("taxon chain read failed", error, accountId);
      return failure("read_failed");
    }
    const node = normalizeTaxon(data);
    if (!node || !node.isActive) return failure("taxon_unavailable");
    nodes.push(node);
    if (node.level === "segment") break;
    currentId = node.parentId;
  }

  const ordered = [...nodes].reverse();
  if (
    ordered.length === 0 ||
    ordered[0].level !== "segment" ||
    ordered[0].parentId !== null ||
    ordered.some(
      (node, index) => index > 0 && node.parentId !== ordered[index - 1].id,
    )
  ) {
    return failure("taxon_unavailable");
  }

  const segment = ordered.find((node) => node.level === "segment");
  const niche = ordered.find((node) => node.level === "niche");
  const ultraNiche = ordered.find((node) => node.level === "ultra_niche");
  if (!segment || (ultraNiche && !niche)) return failure("taxon_unavailable");

  return {
    ok: true,
    value: { segment, ...(niche ? { niche } : {}), ...(ultraNiche ? { ultraNiche } : {}) },
  };
}

async function classifyZeroRowMutation(
  accountId: string,
  expectedRevision: number,
  client: QueryClient,
): Promise<AccountLandingPageOnboardingResult> {
  const { data, error } = await client
    .from("account_landing_page_onboarding_configurations")
    .select("revision")
    .eq("account_id", accountId)
    .limit(1)
    .maybeSingle();
  if (error) {
    if (isUnavailableOnboardingConfigurationError(error)) {
      return failure("configuration_unavailable");
    }
    return failure("read_failed");
  }
  if (!data) return failure("configuration_not_found");
  if (!isRecord(data) || data.revision !== expectedRevision) {
    return failure("revision_conflict");
  }
  return failure("write_failed");
}

async function classifyZeroRowBind(
  accountId: string,
  expectedRevision: number,
  client: QueryClient,
): Promise<AccountLandingPageOnboardingResult> {
  const { data, error } = await client
    .from("account_landing_page_onboarding_configurations")
    .select("landing_page_id,revision")
    .eq("account_id", accountId)
    .limit(1)
    .maybeSingle();
  if (error) {
    if (isUnavailableOnboardingConfigurationError(error)) {
      return failure("configuration_unavailable");
    }
    return failure("read_failed");
  }
  if (!data) return failure("configuration_not_found");
  if (!isRecord(data)) return failure("read_failed");
  if (data.landing_page_id !== null) {
    return failure("landing_page_already_bound");
  }
  if (data.revision !== expectedRevision) return failure("revision_conflict");
  return failure("write_failed");
}

function normalizeAccountRow(value: unknown): AccountRow | null {
  if (!isRecord(value)) return null;
  if (typeof value.id !== "string" || !UUID_RE.test(value.id)) return null;
  return {
    id: value.id,
    name: typeof value.name === "string" ? value.name : null,
    status: typeof value.status === "string" ? value.status : null,
  };
}

function normalizeConfigurationRow(
  value: unknown,
  expectedAccountId: string,
): ConfigurationRow | null {
  if (!isRecord(value)) return null;
  if (
    value.account_id !== expectedAccountId ||
    (value.landing_page_id !== null &&
      (typeof value.landing_page_id !== "string" ||
        !UUID_RE.test(value.landing_page_id))) ||
    !Number.isInteger(value.catalog_version) ||
    Number(value.catalog_version) <= 0 ||
    !Number.isInteger(value.revision) ||
    Number(value.revision) <= 0 ||
    !isRecord(value.values)
  ) {
    return null;
  }
  return {
    account_id: expectedAccountId,
    landing_page_id: value.landing_page_id as string | null,
    catalog_version: Number(value.catalog_version),
    values: value.values,
    revision: Number(value.revision),
  };
}

function normalizeLandingPageDraft(
  value: unknown,
  expectedAccountId: string,
): AccountLandingPage | null {
  if (
    !isRecord(value) ||
    typeof value.id !== "string" ||
    !UUID_RE.test(value.id) ||
    value.account_id !== expectedAccountId ||
    typeof value.name !== "string" ||
    !value.name.trim() ||
    typeof value.slug !== "string" ||
    !value.slug.trim() ||
    !isOperationalLandingPageStatus(value.status)
  ) {
    return null;
  }
  return {
    id: value.id,
    account_id: expectedAccountId,
    name: value.name,
    slug: value.slug,
    status: value.status,
  };
}

function normalizeTaxon(value: unknown) {
  if (!isRecord(value)) return null;
  if (
    typeof value.id !== "string" ||
    !UUID_RE.test(value.id) ||
    typeof value.name !== "string" ||
    !value.name.trim() ||
    typeof value.slug !== "string" ||
    !value.slug.trim() ||
    !["segment", "niche", "ultra_niche"].includes(String(value.level)) ||
    typeof value.is_active !== "boolean" ||
    (value.parent_id !== null &&
      (typeof value.parent_id !== "string" || !UUID_RE.test(value.parent_id)))
  ) {
    return null;
  }
  return {
    id: value.id,
    name: value.name,
    slug: value.slug,
    level: value.level as "segment" | "niche" | "ultra_niche",
    isActive: value.is_active,
    parentId: value.parent_id as string | null,
  };
}

function isAuthorizedMembership(value: unknown): boolean {
  return (
    isRecord(value) &&
    isAccountLandingPageOnboardingActorAuthorized({
      role: value.role,
      status: value.status,
    })
  );
}

function buildAuthoritativeValues(
  account: AccountRow,
): Readonly<Record<string, unknown>> {
  const values: Record<string, unknown> = {};
  if (account.name?.trim()) values.business_display_name = account.name.trim();
  return values;
}

function logDatabaseError(message: string, error: unknown, accountId: string) {
  const record = isRecord(error) ? error : {};
  console.error(`[lp-builder] ${message}`, {
    code: typeof record.code === "string" ? record.code : undefined,
    message:
      typeof record.message === "string" ? record.message : String(error),
    account_id: accountId,
  });
}

function failure(
  error: Extract<AccountLandingPageOnboardingResult, { ok: false }>["error"],
  fieldKey?: string,
): Extract<AccountLandingPageOnboardingResult, { ok: false }> {
  return { ok: false, error, ...(fieldKey ? { fieldKey } : {}) };
}

function isRecord(value: unknown): value is Record<string, any> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
