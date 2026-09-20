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

  try {
    const { data, error } = await supabase.rpc(
      "upsert_pending_setup_niche_resolution_for_turn",
      {
        p_account_id: input.accountId,
        p_turn_id: input.turnId,
        p_raw_input: input.rawInput,
        p_selected_taxon_id: input.selectedTaxonId,
        p_confidence: input.confidence,
        p_should_use_deterministic_match: input.shouldUseDeterministicMatch,
        p_should_escalate_to_ai: input.shouldEscalateToAi,
        p_ai_escalation_mode: input.aiEscalationMode,
        p_needs_admin_review: input.needsAdminReview,
        p_reason: input.reason,
        p_resolution_status: input.resolutionStatus,
        p_match_source: input.matchSource,
        p_score: input.score,
      },
    );

    if (error) {
      console.error("upsertAccountNicheResolution failed:", {
        code: (error as any)?.code,
        message: (error as any)?.message ?? String(error),
      });
      return false;
    }

    return data === "saved";
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

  try {
    const { data, error } = await supabase.rpc(
      "update_pending_setup_niche_resolution_ai_for_turn",
      {
        p_account_id: input.accountId,
        p_turn_id: input.turnId,
        p_expected_raw_input: input.expectedRawInput,
        p_ai_status: input.status,
        p_ai_error_code: input.errorCode,
        p_ai_model: input.model,
        p_ai_schema_version: input.schemaVersion,
        p_ai_result_json: input.result,
        p_ai_ux_mode: input.uxMode,
        p_ai_suggested_taxon_id: input.suggestedTaxonId,
        p_ai_suggested_new_taxon_label: input.suggestedNewTaxonLabel,
        p_ai_needs_user_confirmation: input.needsUserConfirmation,
        p_ai_needs_admin_review: input.needsAdminReview,
        p_ai_reason: input.reason,
      },
    );

    if (error) {
      console.error("updateAccountNicheResolutionAiResult failed:", {
        code: (error as any)?.code,
        message: (error as any)?.message ?? String(error),
      });
      return false;
    }

    return data === "saved";
  } catch (error) {
    console.error("updateAccountNicheResolutionAiResult failed:", {
      code: error instanceof Error ? error.name : undefined,
      message: error instanceof Error ? error.message : String(error),
    });
    return false;
  }
}
