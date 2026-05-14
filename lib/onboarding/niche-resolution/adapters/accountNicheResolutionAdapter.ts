import "server-only";

import { createServiceClient } from "@/lib/supabase/service";
import type {
  AccountNicheResolutionStatus,
  DeterministicMatchDecision,
  UpsertAccountNicheResolutionInput,
  UpdateAccountNicheResolutionAiResultInput,
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
    ai_status: null,
    ai_error_code: null,
    ai_model: null,
    ai_schema_version: null,
    ai_result_json: null,
    ai_ux_mode: null,
    ai_suggested_taxon_id: null,
    ai_suggested_new_taxon_label: null,
    ai_needs_user_confirmation: false,
    ai_needs_admin_review: false,
    ai_reason: null,
    ai_processed_at: null,
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

export async function updateAccountNicheResolutionAiResult(
  input: UpdateAccountNicheResolutionAiResultInput,
): Promise<boolean> {
  const supabase = createServiceClient();

  const payload = {
    ai_status: input.status,
    ai_error_code: input.errorCode,
    ai_model: input.model,
    ai_schema_version: input.schemaVersion,
    ai_result_json: input.result,
    ai_ux_mode: input.uxMode,
    ai_suggested_taxon_id: input.suggestedTaxonId,
    ai_suggested_new_taxon_label: input.suggestedNewTaxonLabel,
    ai_needs_user_confirmation: input.needsUserConfirmation,
    ai_needs_admin_review: input.needsAdminReview,
    ai_reason: input.reason,
    ai_processed_at: new Date().toISOString(),
  };

  try {
    let q: any = supabase
      .from("account_niche_resolutions")
      .update(payload)
      .eq("account_id", input.accountId);

    if (typeof q?.maxAffected === "function") q = q.maxAffected(1);

    const { error } = await q;

    if (error) {
      console.error("updateAccountNicheResolutionAiResult failed:", {
        code: (error as any)?.code,
        message: (error as any)?.message ?? String(error),
      });
      return false;
    }

    return true;
  } catch (error) {
    console.error("updateAccountNicheResolutionAiResult failed:", {
      code: error instanceof Error ? error.name : undefined,
      message: error instanceof Error ? error.message : String(error),
    });
    return false;
  }
}
