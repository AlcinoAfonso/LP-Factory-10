import "server-only";

import { createServiceClient } from "@/lib/supabase/service";
import type { DeterministicMatchDecision } from "../contracts";

const ACCOUNT_TAXONOMY_SOURCE_TYPE = "taxonomy_match" as const;
const ACCOUNT_TAXONOMY_STATUS = "active" as const;

type AccountTaxonomyPrimaryLinkRow = {
  account_id: string;
  taxon_id: string;
  is_primary: boolean;
  status: typeof ACCOUNT_TAXONOMY_STATUS;
  source_type: typeof ACCOUNT_TAXONOMY_SOURCE_TYPE;
};

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
  });
}

async function upsertPrimaryAccountTaxonomyLink(input: {
  accountId: string;
  taxonId: string;
}): Promise<AccountTaxonomyLinkResult> {
  const supabase = createServiceClient();

  try {
    const { data: existingPrimary, error: existingPrimaryError } = await supabase
      .from("account_taxonomy")
      .select("taxon_id")
      .eq("account_id", input.accountId)
      .eq("is_primary", true)
      .eq("status", ACCOUNT_TAXONOMY_STATUS)
      .limit(1)
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
      source_type: ACCOUNT_TAXONOMY_SOURCE_TYPE,
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
