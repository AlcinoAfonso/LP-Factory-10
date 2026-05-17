import "server-only";

import { createServiceClient } from "@/lib/supabase/service";
import type {
  ActionableNicheResolution,
  ActionableNicheResolutionOption,
  AiNicheResolutionOutput,
  AiNicheResolutionUxMode,
  NicheResolutionUserActionResult,
  TaxonMatchCandidate,
  UserNicheResolutionStatus,
} from "../contracts";
import { AI_NICHE_RESOLUTION_SCHEMA_VERSION } from "../contracts";
import { evaluateDeterministicTaxonMatch } from "../deterministicConfidence";
import { linkPrimaryAccountTaxonomyFromUserConfirmedAi } from "./accountTaxonomyAdapter";
import { matchBusinessTaxonsDeterministic } from "./taxonMatchAdapter";
import { resolveNicheWithOpenAi } from "./openAiResolver";

const ACTIONABLE_UX_MODES = new Set<AiNicheResolutionUxMode>([
  "confirm_single",
  "choose_from_options",
  "fallback_review",
]);
const FINAL_USER_STATUSES = new Set<UserNicheResolutionStatus>([
  "confirmed",
  "rejected",
  "rewritten",
  "dismissed",
]);
const REWRITE_LIMIT = 120;

type ResolutionRow = {
  account_id: string;
  ai_status: string | null;
  ai_result_json: unknown;
  ai_ux_mode: AiNicheResolutionUxMode | null;
  ai_suggested_taxon_id: string | null;
  user_resolution_status: UserNicheResolutionStatus | null;
  user_rewrite_input: string | null;
};

type TaxonRow = {
  id: string;
  name: string;
  slug: string;
};

type ValidatedActionContext = {
  resolution: ResolutionRow;
  actionable: ActionableNicheResolution;
};

export async function getActionableNicheResolutionForAccount(input: {
  accountId: string;
  accountStatus: string | null;
}): Promise<ActionableNicheResolution | null> {
  if (input.accountStatus !== "active") return null;

  const validated = await getValidatedActionContext({
    accountId: input.accountId,
    requireUxMode: null,
  });

  if (!validated.ok) return null;

  return validated.context.actionable;
}

export async function confirmAiSuggestedTaxonForAccount(input: {
  accountId: string;
}): Promise<NicheResolutionUserActionResult> {
  const validated = await getValidatedActionContext({
    accountId: input.accountId,
    requireUxMode: "confirm_single",
  });

  if (!validated.ok) return { ok: false, reason: validated.reason };

  const taxonId = validated.context.resolution.ai_suggested_taxon_id;
  const suggestedTaxonId = validated.context.actionable.suggestedTaxon?.taxonId ?? null;

  if (!taxonId || taxonId !== suggestedTaxonId) {
    return { ok: false, reason: "invalid_suggested_taxon" };
  }

  return confirmValidatedTaxon(input.accountId, taxonId);
}

export async function confirmAiOptionForAccount(input: {
  accountId: string;
  taxonId: string;
}): Promise<NicheResolutionUserActionResult> {
  const validated = await getValidatedActionContext({
    accountId: input.accountId,
    requireUxMode: "choose_from_options",
  });

  if (!validated.ok) return { ok: false, reason: validated.reason };

  const allowedTaxonIds = new Set(
    validated.context.actionable.options
      .filter((option) => option.isOfficial && option.taxonId)
      .map((option) => option.taxonId),
  );

  if (!allowedTaxonIds.has(input.taxonId)) {
    console.warn("nicheResolution arbitrary taxon rejected:", {
      accountId: input.accountId,
      uxMode: validated.context.actionable.uxMode,
    });
    return { ok: false, reason: "invalid_option_taxon" };
  }

  return confirmValidatedTaxon(input.accountId, input.taxonId);
}

export async function rewriteAiNicheResolutionForAccount(input: {
  accountId: string;
  rewriteInput: string;
}): Promise<NicheResolutionUserActionResult> {
  const rewriteInput = input.rewriteInput.replace(/\s+/g, " ").trim();

  if (!rewriteInput) return { ok: false, reason: "empty_rewrite" };
  if (rewriteInput.length > REWRITE_LIMIT) return { ok: false, reason: "rewrite_too_long" };

  const validated = await getValidatedActionContext({
    accountId: input.accountId,
    requireUxMode: null,
  });

  if (!validated.ok) return { ok: false, reason: validated.reason };

  if (
    validated.context.actionable.uxMode !== "confirm_single" &&
    validated.context.actionable.uxMode !== "choose_from_options"
  ) {
    return { ok: false, reason: "rewrite_not_allowed" };
  }

  if (validated.context.resolution.user_rewrite_input) {
    const finalFallbackSaved = await persistRetryAiResolution({
      accountId: input.accountId,
      rewriteInput,
      output: finalFallbackOutput("rewrite_retry_limit_reached"),
      model: null,
      reason: "rewrite_retry_limit_reached",
    });

    return finalFallbackSaved
      ? { ok: true, status: "rewritten" }
      : { ok: false, reason: "update_failed" };
  }

  const retryOutput = await resolveRewriteInputOnce(rewriteInput);
  const retrySaved = await persistRetryAiResolution({
    accountId: input.accountId,
    rewriteInput,
    output: retryOutput.output,
    model: retryOutput.model,
    reason: retryOutput.reason,
  });

  return retrySaved
    ? { ok: true, status: "rewritten" }
    : { ok: false, reason: "update_failed" };
}

export async function dismissAiNicheResolutionForAccount(input: {
  accountId: string;
}): Promise<NicheResolutionUserActionResult> {
  const validated = await getValidatedActionContext({
    accountId: input.accountId,
    requireUxMode: "fallback_review",
  });

  if (!validated.ok) return { ok: false, reason: validated.reason };

  const supabase = createServiceClient();
  const now = new Date().toISOString();

  let query: any = supabase
    .from("account_niche_resolutions")
    .update({
      user_resolution_status: "dismissed",
      user_dismissed_at: now,
    })
    .eq("account_id", input.accountId)
    .or("user_resolution_status.is.null,user_resolution_status.eq.pending_confirmation");

  if (typeof query?.maxAffected === "function") query = query.maxAffected(1);

  const { error } = await query;

  if (error) {
    console.error("dismissAiNicheResolutionForAccount failed:", {
      code: (error as any)?.code,
      message: (error as any)?.message ?? String(error),
    });
    return { ok: false, reason: "update_failed" };
  }

  return { ok: true, status: "dismissed" };
}

async function confirmValidatedTaxon(
  accountId: string,
  taxonId: string,
): Promise<NicheResolutionUserActionResult> {
  const taxonomyResult = await linkPrimaryAccountTaxonomyFromUserConfirmedAi({
    accountId,
    taxonId,
  });

  if (taxonomyResult.status === "skipped_conflicting_primary") {
    console.warn("nicheResolution confirm skipped by conflicting primary:", { accountId });
    return { ok: false, reason: "conflicting_primary" };
  }

  if (taxonomyResult.status !== "saved") {
    return { ok: false, reason: "taxonomy_link_failed" };
  }

  const supabase = createServiceClient();
  const now = new Date().toISOString();

  let query: any = supabase
    .from("account_niche_resolutions")
    .update({
      user_resolution_status: "confirmed",
      user_selected_taxon_id: taxonId,
      user_confirmed_at: now,
    })
    .eq("account_id", accountId)
    .or("user_resolution_status.is.null,user_resolution_status.eq.pending_confirmation");

  if (typeof query?.maxAffected === "function") query = query.maxAffected(1);

  const { error } = await query;

  if (error) {
    console.error("confirmValidatedTaxon resolution update failed:", {
      code: (error as any)?.code,
      message: (error as any)?.message ?? String(error),
    });
    return { ok: false, reason: "update_failed" };
  }

  return { ok: true, status: "confirmed" };
}


type RetryAiResolution = {
  output: AiNicheResolutionOutput;
  model: string | null;
  reason: string;
};

async function resolveRewriteInputOnce(rewriteInput: string): Promise<RetryAiResolution> {
  const candidates = await matchBusinessTaxonsDeterministic(rewriteInput, 10);
  const decision = evaluateDeterministicTaxonMatch(candidates);

  if (decision.selectedCandidate && decision.confidence === "high") {
    return {
      output: officialCandidatesOutput([decision.selectedCandidate], "rewrite_high_confidence_candidate"),
      model: null,
      reason: "rewrite_high_confidence_candidate",
    };
  }

  const aiResult = await resolveNicheWithOpenAi({
    rawInput: rewriteInput,
    decision,
    candidates,
  });

  if (aiResult.ok && aiResult.output.options.length > 0) {
    return {
      output: aiResult.output,
      model: aiResult.model,
      reason: aiResult.output.reason,
    };
  }

  if (candidates.length > 0) {
    return {
      output: officialCandidatesOutput(candidates.slice(0, 3), "rewrite_official_candidates_without_ai"),
      model: aiResult.model,
      reason: aiResult.ok ? aiResult.output.reason : aiResult.reason,
    };
  }

  return {
    output: finalFallbackOutput(aiResult.ok ? aiResult.output.reason : aiResult.reason),
    model: aiResult.model,
    reason: aiResult.ok ? aiResult.output.reason : aiResult.reason,
  };
}

function officialCandidatesOutput(
  candidates: TaxonMatchCandidate[],
  reason: string,
): AiNicheResolutionOutput {
  const options = candidates.slice(0, 3).map((candidate) => ({
    taxonId: candidate.taxonId,
    name: candidate.name,
    slug: candidate.slug,
    confidence:
      candidate.score >= 0.92 ? "high" as const : candidate.score >= 0.7 ? "medium" as const : "low" as const,
    reason: "official_candidate_after_rewrite",
    isOfficial: true,
  }));

  return {
    uxMode: options.length === 1 ? "confirm_single" : "choose_from_options",
    message: options.length === 1
      ? "Você quis dizer este nicho?"
      : "Encontramos algumas possibilidades para seu nicho.",
    options,
    needsAdminReview: false,
    needsUserConfirmation: true,
    shouldCreateOfficialLink: false,
    suggestedNewTaxonLabel: null,
    reason,
  };
}

function finalFallbackOutput(reason: string): AiNicheResolutionOutput {
  return {
    uxMode: "fallback_review",
    message: "Vamos revisar essa informação para personalizar melhor sua conta.",
    options: [],
    needsAdminReview: true,
    needsUserConfirmation: false,
    shouldCreateOfficialLink: false,
    suggestedNewTaxonLabel: null,
    reason,
  };
}

async function persistRetryAiResolution(input: {
  accountId: string;
  rewriteInput: string;
  output: AiNicheResolutionOutput;
  model: string | null;
  reason: string;
}): Promise<boolean> {
  const supabase = createServiceClient();
  const now = new Date().toISOString();
  const suggestedTaxonId = input.output.options.find((option) => option.isOfficial)?.taxonId ?? null;

  try {
    let query: any = supabase
      .from("account_niche_resolutions")
      .update({
        ai_status: "resolved",
        ai_error_code: null,
        ai_model: input.model,
        ai_schema_version: AI_NICHE_RESOLUTION_SCHEMA_VERSION,
        ai_result_json: input.output,
        ai_ux_mode: input.output.uxMode,
        ai_suggested_taxon_id: suggestedTaxonId,
        ai_suggested_new_taxon_label: input.output.suggestedNewTaxonLabel,
        ai_needs_user_confirmation: input.output.needsUserConfirmation,
        ai_needs_admin_review: input.output.needsAdminReview,
        ai_reason: input.reason,
        ai_processed_at: now,
        user_resolution_status: "pending_confirmation",
        user_rewrite_input: input.rewriteInput,
        user_rejected_at: now,
      })
      .eq("account_id", input.accountId)
      .or("user_resolution_status.is.null,user_resolution_status.eq.pending_confirmation");

    if (typeof query?.maxAffected === "function") query = query.maxAffected(1);

    const { error } = await query;

    if (error) {
      console.error("persistRetryAiResolution failed:", {
        code: (error as any)?.code,
        message: (error as any)?.message ?? String(error),
      });
      return false;
    }

    return true;
  } catch (error) {
    console.error("persistRetryAiResolution failed:", {
      code: error instanceof Error ? error.name : undefined,
      message: error instanceof Error ? error.message : String(error),
    });
    return false;
  }
}

async function getValidatedActionContext(input: {
  accountId: string;
  requireUxMode: AiNicheResolutionUxMode | null;
}): Promise<
  | { ok: true; context: ValidatedActionContext }
  | { ok: false; reason: string }
> {
  const supabase = createServiceClient();

  const { data: resolution, error: resolutionError } = await supabase
    .from("account_niche_resolutions")
    .select(
      "account_id,ai_status,ai_result_json,ai_ux_mode,ai_suggested_taxon_id,user_resolution_status,user_rewrite_input",
    )
    .eq("account_id", input.accountId)
    .limit(1)
    .maybeSingle();

  if (resolutionError) {
    console.error("nicheResolution action lookup failed:", {
      code: (resolutionError as any)?.code,
      message: (resolutionError as any)?.message ?? String(resolutionError),
    });
    return { ok: false, reason: "resolution_lookup_failed" };
  }

  if (!resolution) return { ok: false, reason: "resolution_not_found" };

  const row = resolution as ResolutionRow;

  if (row.ai_status !== "resolved") return { ok: false, reason: "resolution_not_resolved" };
  if (!row.ai_ux_mode || !ACTIONABLE_UX_MODES.has(row.ai_ux_mode)) {
    return { ok: false, reason: "ux_mode_not_actionable" };
  }
  if (input.requireUxMode && row.ai_ux_mode !== input.requireUxMode) {
    return { ok: false, reason: "unexpected_ux_mode" };
  }
  if (row.user_resolution_status && FINAL_USER_STATUSES.has(row.user_resolution_status)) {
    return { ok: false, reason: "already_finalized" };
  }
  if (row.user_resolution_status && row.user_resolution_status !== "pending_confirmation") {
    return { ok: false, reason: "user_status_not_actionable" };
  }

  const { data: existingPrimary, error: primaryError } = await supabase
    .from("account_taxonomy")
    .select("taxon_id")
    .eq("account_id", input.accountId)
    .eq("is_primary", true)
    .eq("status", "active")
    .limit(1)
    .maybeSingle();

  if (primaryError) {
    console.error("nicheResolution primary lookup failed:", {
      code: (primaryError as any)?.code,
      message: (primaryError as any)?.message ?? String(primaryError),
    });
    return { ok: false, reason: "primary_lookup_failed" };
  }

  if ((existingPrimary as { taxon_id?: string } | null)?.taxon_id) {
    return { ok: false, reason: "primary_already_exists" };
  }

  const result = parseAiResult(row.ai_result_json);
  if (!result) return { ok: false, reason: "invalid_ai_result" };

  const optionTaxonIds = result.options
    .filter((option) => option.isOfficial)
    .map((option) => option.taxonId)
    .filter(Boolean);
  const taxonIds = Array.from(
    new Set([row.ai_suggested_taxon_id, ...optionTaxonIds].filter((id): id is string => Boolean(id))),
  );

  const taxons = await getActiveTaxonsByIds(taxonIds);
  const taxonMap = new Map(taxons.map((taxon) => [taxon.id, taxon]));

  const suggestedTaxon = row.ai_suggested_taxon_id
    ? taxonToOption(taxonMap.get(row.ai_suggested_taxon_id) ?? null)
    : null;
  const options = result.options
    .map((option) => {
      if (!option.isOfficial) {
        return {
          taxonId: null,
          name: option.name,
          slug: null,
          isOfficial: false,
        } satisfies ActionableNicheResolutionOption;
      }

      return taxonToOption(option.taxonId ? taxonMap.get(option.taxonId) ?? null : null);
    })
    .filter((option): option is ActionableNicheResolutionOption => Boolean(option));

  if (row.ai_ux_mode === "confirm_single" && !suggestedTaxon) {
    return { ok: false, reason: "missing_suggested_taxon" };
  }
  if (row.ai_ux_mode === "choose_from_options" && options.length === 0) {
    return { ok: false, reason: "missing_options" };
  }

  return {
    ok: true,
    context: {
      resolution: row,
      actionable: {
        accountId: input.accountId,
        uxMode: row.ai_ux_mode as ActionableNicheResolution["uxMode"],
        suggestedTaxon,
        options,
      },
    },
  };
}

async function getActiveTaxonsByIds(ids: string[]): Promise<TaxonRow[]> {
  if (ids.length === 0) return [];

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("business_taxons")
    .select("id,name,slug")
    .in("id", ids)
    .eq("is_active", true);

  if (error) {
    console.error("nicheResolution taxon lookup failed:", {
      code: (error as any)?.code,
      message: (error as any)?.message ?? String(error),
    });
    return [];
  }

  return (data ?? []) as TaxonRow[];
}

function taxonToOption(taxon: TaxonRow | null): ActionableNicheResolutionOption | null {
  if (!taxon?.id || !taxon.name || !taxon.slug) return null;
  return { taxonId: taxon.id, name: taxon.name, slug: taxon.slug, isOfficial: true };
}

function parseAiResult(value: unknown): AiNicheResolutionOutput | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;

  const result = value as Partial<AiNicheResolutionOutput>;
  if (!Array.isArray(result.options)) return null;

  const options = result.options
    .map((option) => {
      if (!option || typeof option !== "object" || typeof option.name !== "string") return null;

      const name = option.name.trim();
      if (!name) return null;

      const hasOfficialTaxonId =
        typeof option.taxonId === "string" && option.taxonId.trim().length > 0;
      const isOfficial = option.isOfficial === true || (option.isOfficial !== false && hasOfficialTaxonId);

      if (isOfficial && !hasOfficialTaxonId) return null;

      return {
        taxonId: isOfficial ? (option.taxonId as string).trim() : null,
        name,
        slug: isOfficial && typeof option.slug === "string" ? option.slug : null,
        confidence: option.confidence ?? "low",
        reason: option.reason ?? "ai_option",
        isOfficial,
      };
    })
    .filter((option): option is AiNicheResolutionOutput["options"][number] => Boolean(option));

  return {
    uxMode: result.uxMode ?? "none",
    message: typeof result.message === "string" ? result.message : "",
    options,
    needsAdminReview: result.needsAdminReview === true,
    needsUserConfirmation: result.needsUserConfirmation === true,
    shouldCreateOfficialLink: false,
    suggestedNewTaxonLabel:
      typeof result.suggestedNewTaxonLabel === "string" ? result.suggestedNewTaxonLabel : null,
    reason: typeof result.reason === "string" ? result.reason : "",
  };
}
