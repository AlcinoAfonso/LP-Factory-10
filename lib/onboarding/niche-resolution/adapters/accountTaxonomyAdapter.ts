import "server-only";

import { createServiceClient } from "@/lib/supabase/service";
import { hasHumanNicheConfirmation, type DeterministicMatchDecision } from "../contracts";

const ACCOUNT_TAXONOMY_DETERMINISTIC_SOURCE_TYPE = "taxonomy_match" as const;
const ACCOUNT_TAXONOMY_USER_CONFIRMED_AI_SOURCE_TYPE = "user_confirmed_ai" as const;
const ACCOUNT_TAXONOMY_STATUS = "active" as const;

type AccountTaxonomySourceType =
  | typeof ACCOUNT_TAXONOMY_DETERMINISTIC_SOURCE_TYPE
  | typeof ACCOUNT_TAXONOMY_USER_CONFIRMED_AI_SOURCE_TYPE;

type AccountTaxonomyPrimaryLinkRow = {
  account_id: string;
  taxon_id: string;
  is_primary: boolean;
  status: typeof ACCOUNT_TAXONOMY_STATUS;
  source_type: AccountTaxonomySourceType;
};


export type ActivePrimaryAccountTaxon = {
  taxonId: string;
  name: string;
  slug: string;
  confirmed: boolean;
  confirmedAt: string | null;
  revision: string;
};

export function isAccountNicheEditingEnabled(): boolean {
  return process.env.D14D_ACCOUNT_NICHE_EDITING_ENABLED === "true";
}

export async function getActivePrimaryAccountTaxon(input: {
  accountId: string;
}): Promise<ActivePrimaryAccountTaxon | null> {
  const result = await readActivePrimaryAccountTaxon(input);
  return result.ok ? result.taxon : null;
}

export type ActivePrimaryAccountTaxonReadResult =
  | Readonly<{ ok: true; taxon: ActivePrimaryAccountTaxon | null }>
  | Readonly<{ ok: false }>;

export async function readActivePrimaryAccountTaxon(input: {
  accountId: string;
}): Promise<ActivePrimaryAccountTaxonReadResult> {

  try {
    const supabase = createServiceClient();
    const { data: primary, error: primaryError } = await supabase
      .from("account_taxonomy")
      .select("taxon_id,source_type,updated_at,user_confirmed_at")
      .eq("account_id", input.accountId)
      .eq("is_primary", true)
      .eq("status", ACCOUNT_TAXONOMY_STATUS)
      .maybeSingle();

    if (primaryError) {
      console.error("getActivePrimaryAccountTaxon primary lookup failed:", {
        code: (primaryError as any)?.code,
        message: (primaryError as any)?.message ?? String(primaryError),
      });
      return { ok: false };
    }

    const taxonId = (primary as { taxon_id?: string | null } | null)?.taxon_id ?? null;
    if (!taxonId) return { ok: true, taxon: null };

    const { data: taxon, error: taxonError } = await supabase
      .from("business_taxons")
      .select("id,name,slug")
      .eq("id", taxonId)
      .eq("is_active", true)
      .limit(1)
      .maybeSingle();

    if (taxonError) {
      console.error("getActivePrimaryAccountTaxon taxon lookup failed:", {
        code: (taxonError as any)?.code,
        message: (taxonError as any)?.message ?? String(taxonError),
      });
      return { ok: false };
    }

    const row = taxon as { id?: string | null; name?: string | null; slug?: string | null } | null;
    if (!row?.id || !row.name || !row.slug) return { ok: false };

    const link = primary as unknown as { source_type: string; updated_at: string; user_confirmed_at?: string | null };
    let confirmed = hasHumanNicheConfirmation({ taxonId, sourceType: link.source_type, confirmedAt: link.user_confirmed_at });
    if (!confirmed) {
      const { data: resolution, error } = await supabase.from("account_niche_resolutions")
        .select("user_resolution_status,user_selected_taxon_id,user_confirmed_at").eq("account_id", input.accountId).maybeSingle();
      if (error) { console.error("getActivePrimaryAccountTaxon confirmation lookup failed", { code: error.code }); return { ok: false }; }
      confirmed = hasHumanNicheConfirmation({ taxonId, sourceType: link.source_type,
        resolution: resolution ? { status: resolution.user_resolution_status, taxonId: resolution.user_selected_taxon_id, confirmedAt: resolution.user_confirmed_at } : undefined });
    }
    return { ok: true, taxon: { taxonId: row.id, name: row.name, slug: row.slug,
      confirmed,
      confirmedAt: link.user_confirmed_at ?? null, revision: link.updated_at } };
  } catch (error) {
    console.error("getActivePrimaryAccountTaxon failed:", {
      code: error instanceof Error ? error.name : undefined,
      message: error instanceof Error ? error.message : String(error),
    });
    return { ok: false };
  }
}

export async function readAccountNicheProductGuard(accountId: string): Promise<boolean | null> {
  try {
    const { count, error } = await createServiceClient().from("account_landing_pages")
      .select("id", { count: "exact", head: true }).eq("account_id", accountId);
    return error || count === null ? null : count > 0;
  } catch { return null; }
}

export async function confirmAccountNiche(input: Readonly<{
  accountId: string; actorUserId: string; taxonId: string; expectedTaxonId: string | null;
}>) {
  if (!isAccountNicheEditingEnabled()) return { ok: false as const, reason: "unavailable" };
  try {
    const { error, data } = await createServiceClient().rpc("confirm_account_niche_v1", {
      p_account_id: input.accountId, p_actor_user_id: input.actorUserId,
      p_taxon_id: input.taxonId, p_expected_taxon_id: input.expectedTaxonId, p_confirmed: true,
    });
    if (error || data !== input.taxonId) {
      const reason = error?.message === "niche_changed" ? "conflict"
        : error?.message === "niche_product_exists" ? "product_exists" : "unavailable";
      console.error("confirmAccountNiche failed", { code: error?.code ?? "invalid_result" });
      return { ok: false as const, reason };
    }
    return { ok: true as const };
  } catch { return { ok: false as const, reason: "unavailable" }; }
}

export type AccountTaxonomyLinkResult =
  | { status: "saved"; taxonId: string }
  | { status: "skipped_not_high_confidence"; taxonId: string | null }
  | { status: "skipped_conflicting_primary"; taxonId: string; existingPrimaryTaxonId: string }
  | { status: "failed"; taxonId: string | null };

export function shouldLinkAccountTaxonomyFromDecision(
  decision: DeterministicMatchDecision,
): boolean {
  return (
    decision.confidence === "high" &&
    decision.shouldUseDeterministicMatch === true &&
    decision.selectedCandidate !== null &&
    Boolean(decision.selectedCandidate.taxonId) &&
    decision.needsAdminReview === false
  );
}

export async function linkAccountTaxonomyFromDeterministicDecision(input: {
  accountId: string;
  decision: DeterministicMatchDecision;
}): Promise<AccountTaxonomyLinkResult> {
  const taxonId = input.decision.selectedCandidate?.taxonId ?? null;

  if (!shouldLinkAccountTaxonomyFromDecision(input.decision) || !taxonId) {
    return { status: "skipped_not_high_confidence", taxonId };
  }

  return upsertPrimaryAccountTaxonomyLink({
    accountId: input.accountId,
    taxonId,
    sourceType: ACCOUNT_TAXONOMY_DETERMINISTIC_SOURCE_TYPE,
  });
}

export async function linkPrimaryAccountTaxonomyFromUserConfirmedAi(input: {
  accountId: string;
  taxonId: string;
}): Promise<AccountTaxonomyLinkResult> {
  return upsertPrimaryAccountTaxonomyLink({
    accountId: input.accountId,
    taxonId: input.taxonId,
    sourceType: ACCOUNT_TAXONOMY_USER_CONFIRMED_AI_SOURCE_TYPE,
  });
}

async function upsertPrimaryAccountTaxonomyLink(input: {
  accountId: string;
  taxonId: string;
  sourceType: AccountTaxonomySourceType;
}): Promise<AccountTaxonomyLinkResult> {
  const supabase = createServiceClient();

  try {
    const { data: existingPrimary, error: existingPrimaryError } = await supabase
      .from("account_taxonomy")
      .select("taxon_id")
      .eq("account_id", input.accountId)
      .eq("is_primary", true)
      .eq("status", ACCOUNT_TAXONOMY_STATUS)
      .maybeSingle();

    if (existingPrimaryError) {
      console.error("accountTaxonomyLink primary lookup failed:", {
        code: (existingPrimaryError as any)?.code,
        message: (existingPrimaryError as any)?.message ?? String(existingPrimaryError),
      });
      return { status: "failed", taxonId: input.taxonId };
    }

    const existingPrimaryTaxonId = (existingPrimary as { taxon_id?: string } | null)?.taxon_id ?? null;

    if (existingPrimaryTaxonId && existingPrimaryTaxonId !== input.taxonId) {
      console.warn("accountTaxonomyLink conflicting primary skipped:", {
        accountId: input.accountId,
        sourceType: input.sourceType,
      });

      return {
        status: "skipped_conflicting_primary",
        taxonId: input.taxonId,
        existingPrimaryTaxonId,
      };
    }

    const payload: AccountTaxonomyPrimaryLinkRow = {
      account_id: input.accountId,
      taxon_id: input.taxonId,
      is_primary: true,
      status: ACCOUNT_TAXONOMY_STATUS,
      source_type: input.sourceType,
    };

    const { data: existingLink, error: existingLinkError } = await supabase
      .from("account_taxonomy")
      .select("account_id,taxon_id")
      .eq("account_id", input.accountId)
      .eq("taxon_id", input.taxonId)
      .limit(1)
      .maybeSingle();

    if (existingLinkError) {
      console.error("accountTaxonomyLink existing link lookup failed:", {
        code: (existingLinkError as any)?.code,
        message: (existingLinkError as any)?.message ?? String(existingLinkError),
      });
      return { status: "failed", taxonId: input.taxonId };
    }

    if (existingLink) {
      let updateQuery: any = supabase
        .from("account_taxonomy")
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq("account_id", input.accountId)
        .eq("taxon_id", input.taxonId);

      if (typeof updateQuery?.maxAffected === "function") updateQuery = updateQuery.maxAffected(1);

      const { error: updateError } = await updateQuery;

      if (updateError) {
        console.error("accountTaxonomyLink update failed:", {
          code: (updateError as any)?.code,
          message: (updateError as any)?.message ?? String(updateError),
        });
        return { status: "failed", taxonId: input.taxonId };
      }

      return { status: "saved", taxonId: input.taxonId };
    }

    let insertQuery: any = supabase.from("account_taxonomy").insert(payload);

    if (typeof insertQuery?.maxAffected === "function") insertQuery = insertQuery.maxAffected(1);

    const { error: insertError } = await insertQuery;

    if (insertError) {
      console.error("accountTaxonomyLink insert failed:", {
        code: (insertError as any)?.code,
        message: (insertError as any)?.message ?? String(insertError),
      });
      return { status: "failed", taxonId: input.taxonId };
    }

    return { status: "saved", taxonId: input.taxonId };
  } catch (error) {
    console.error("accountTaxonomyLink failed:", {
      code: error instanceof Error ? error.name : undefined,
      message: error instanceof Error ? error.message : String(error),
    });
    return { status: "failed", taxonId: input.taxonId };
  }
}
