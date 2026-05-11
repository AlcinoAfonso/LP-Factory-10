import "server-only";

import { createServiceClient } from "@/lib/supabase/service";
import type {
  AccountNicheResolutionStatus,
  DeterministicMatchDecision,
  UpsertAccountNicheResolutionInput,
} from "../contracts";

export function mapDecisionToResolutionStatus(
  decision: Pick<
    DeterministicMatchDecision,
    "confidence" | "shouldUseDeterministicMatch"
  >,
): AccountNicheResolutionStatus {
  if (decision.confidence === "high" && decision.shouldUseDeterministicMatch) {
    return "deterministic_high_confidence";
  }

  if (decision.confidence === "medium") {
    return "review_required";
  }

  return "unclassified";
}

export async function upsertAccountNicheResolution(
  input: UpsertAccountNicheResolutionInput,
): Promise<boolean> {
  const supabase = createServiceClient();

  const payload = {
    account_id: input.accountId,
    raw_input: input.rawInput,
    selected_taxon_id: input.selectedTaxonId,
    confidence: input.confidence,
    should_use_deterministic_match: input.shouldUseDeterministicMatch,
    should_escalate_to_ai: input.shouldEscalateToAi,
    ai_escalation_mode: input.aiEscalationMode,
    needs_admin_review: input.needsAdminReview,
    reason: input.reason,
    resolution_status: input.resolutionStatus,
    match_source: input.matchSource,
    score: input.score,
  };

  try {
    let q: any = supabase
      .from("account_niche_resolutions")
      .upsert(payload, { onConflict: "account_id" });

    if (typeof q?.maxAffected === "function") q = q.maxAffected(1);

    const { error } = await q;

    if (error) {
      console.error("upsertAccountNicheResolution failed:", {
        code: (error as any)?.code,
        message: (error as any)?.message ?? String(error),
      });
      return false;
    }

    return true;
  } catch (error) {
    console.error("upsertAccountNicheResolution failed:", {
      code: error instanceof Error ? error.name : undefined,
      message: error instanceof Error ? error.message : String(error),
    });
    return false;
  }
}
