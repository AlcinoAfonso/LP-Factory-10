import "server-only";

import { getCommercialEntitlementSignal } from "../../commercial-entitlements";
import { loadTaxonPreparationForCurrentVersion } from "../../conversion-content/adapters/selectedEndCustomerResearchAdapter";
import type {
  LandingPageInputCatalogPlan,
  LandingPageInputCatalogTaxonChain,
} from "../../conversion-content/landing-page/input-catalog";
import { createClient } from "../../supabase/server";
import type { createServiceClient } from "../../supabase/service";
import type {
  AccountLandingPageWorkspaceDetailResult,
  AccountLandingPageWorkspaceResult,
  LandingPageWorkspaceMutationResult,
  SaveAccountLandingPageOperationalConfigurationResult,
} from "../contracts";

type ServiceClient = ReturnType<typeof createServiceClient>;
export type Authority = Readonly<{
  actorUserId: string;
  accountId: string;
  canMutate: boolean;
  planKey: LandingPageInputCatalogPlan;
  taxonChain: LandingPageInputCatalogTaxonChain;
  effectiveInputCatalogVersion: number;
  authoritativeValues: Readonly<Record<string, unknown>>;
}>;

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isWorkspaceUuid(value: string): boolean {
  return UUID_RE.test(value);
}

export async function loadAuthority(
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
    const preparation = await loadTaxonPreparationForCurrentVersion({
      taxonId: servedTaxon.id,
    });
    if (
      !preparation.ok ||
      !Number.isSafeInteger(preparation.value.effectiveInputCatalogVersion) ||
      preparation.value.effectiveInputCatalogVersion <= 0
    ) return authorityFailure("unavailable");
    return {
      ok: true,
      value: {
        actorUserId,
        accountId,
        canMutate: ["owner", "admin"].includes(String(membership.role)),
        planKey: entitlement.planKey as LandingPageInputCatalogPlan,
        taxonChain,
        effectiveInputCatalogVersion:
          preparation.value.effectiveInputCatalogVersion,
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
    .select("taxon_id,taxon:business_taxons!account_taxonomy_taxon_id_fkey(id,name,slug,level,is_active,parent_id)")
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
    const response: { data: unknown; error: unknown } = depth === 0
      ? { data: link.taxon, error: null }
      : await client
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

function isRecord(value: unknown): value is Record<string, any> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
