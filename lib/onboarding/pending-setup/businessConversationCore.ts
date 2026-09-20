import type {
  AiNicheResolutionOutput,
  DeterministicMatchDecision,
  MatchBusinessTaxonsResult,
  TaxonMatchCandidate,
  UpdateAccountNicheResolutionAiResultInput,
  UpsertAccountNicheResolutionInput,
} from "../niche-resolution/contracts";
import {
  AI_NICHE_RESOLUTION_SCHEMA_VERSION,
  evaluateDeterministicTaxonMatch,
  shouldConfirmDeterministicAlias,
} from "../niche-resolution";

export const BUSINESS_DESCRIPTION_MAX_LENGTH = 500;

export type PendingSetupBusinessTurnResult =
  | { ok: true; status: "ready_official"; taxonId: string }
  | {
      ok: true;
      status: "awaiting_confirmation";
      mode: "confirm_single" | "choose_from_options" | "fallback_review";
    }
  | {
      ok: false;
      reason:
        | "invalid_input"
        | "resolution_persist_failed"
        | "official_link_failed"
        | "result_persist_failed";
    };

type AiResolutionResult =
  | { ok: true; model: string; output: AiNicheResolutionOutput }
  | { ok: false; model: string | null; reason: string };

type OfficialLinkResult =
  | { status: "saved"; taxonId: string }
  | { status: "skipped_not_high_confidence"; taxonId: string | null }
  | {
      status: "skipped_conflicting_primary";
      taxonId: string;
      existingPrimaryTaxonId: string;
    }
  | { status: "failed"; taxonId: string | null };

export type PendingSetupBusinessDependencies = {
  match: (rawInput: string, limit: number) => Promise<MatchBusinessTaxonsResult>;
  persistResolution: (input: UpsertAccountNicheResolutionInput) => Promise<boolean>;
  linkOfficial: (input: {
    accountId: string;
    decision: DeterministicMatchDecision;
  }) => Promise<OfficialLinkResult>;
  resolveWithAi: (input: {
    rawInput: string;
    decision: DeterministicMatchDecision;
    candidates: TaxonMatchCandidate[];
  }) => Promise<AiResolutionResult>;
  persistAiResult: (input: UpdateAccountNicheResolutionAiResultInput) => Promise<boolean>;
};

export function validateBusinessDescription(input: unknown):
  | { ok: true; value: string }
  | { ok: false; error: string } {
  const value = typeof input === "string" ? input.trim().replace(/\s+/g, " ") : "";
  if (value.length < 3) {
    return { ok: false, error: "Conte em poucas palavras o que seu negócio oferece." };
  }
  if (value.length > BUSINESS_DESCRIPTION_MAX_LENGTH) {
    return {
      ok: false,
      error: `Use no máximo ${BUSINESS_DESCRIPTION_MAX_LENGTH} caracteres.`,
    };
  }
  return { ok: true, value };
}

export function appendBusinessClarification(
  currentDescription: string | null,
  clarification: string,
): ReturnType<typeof validateBusinessDescription> {
  const current = String(currentDescription ?? "").trim().replace(/\s+/g, " ");
  const next = clarification.trim().replace(/\s+/g, " ");
  if (!current || current.toLocaleLowerCase("pt-BR") === next.toLocaleLowerCase("pt-BR")) {
    return validateBusinessDescription(next);
  }
  const combined = `${current}. ${next}`;
  return validateBusinessDescription(
    combined.length <= BUSINESS_DESCRIPTION_MAX_LENGTH ? combined : next,
  );
}

export async function processPendingSetupBusinessTurn(
  input: { accountId: string; turnId: string; rawInput: unknown },
  dependencies: PendingSetupBusinessDependencies,
): Promise<PendingSetupBusinessTurnResult> {
  const parsed = validateBusinessDescription(input.rawInput);
  if (!parsed.ok) return { ok: false, reason: "invalid_input" };

  const match = await dependencies.match(parsed.value, 10);
  const candidates = match.ok ? [...match.candidates] : [];
  const decision = evaluateDeterministicTaxonMatch(candidates, parsed.value);
  const selected = decision.selectedCandidate;

  const resolutionPersisted = await dependencies.persistResolution({
    accountId: input.accountId,
    turnId: input.turnId,
    rawInput: parsed.value,
    selectedTaxonId: selected?.taxonId ?? null,
    confidence: decision.confidence,
    shouldUseDeterministicMatch: decision.shouldUseDeterministicMatch,
    shouldEscalateToAi: decision.shouldEscalateToAi,
    aiEscalationMode: decision.aiEscalationMode,
    needsAdminReview: decision.needsAdminReview,
    reason: decision.reason,
    resolutionStatus:
      decision.confidence === "high" && decision.shouldUseDeterministicMatch
        ? "deterministic_high_confidence"
        : decision.confidence === "medium"
          ? "review_required"
          : "unclassified",
    matchSource: selected?.matchSource ?? null,
    score: selected?.score ?? null,
    resetUserResolution: true,
  });
  if (!resolutionPersisted) return { ok: false, reason: "resolution_persist_failed" };

  if (!match.ok) {
    return persistActionableResult(
      dependencies,
      input.accountId,
      input.turnId,
      parsed.value,
      fallbackOutput("deterministic_match_failed"),
      null,
      match.error.code,
    );
  }

  if (shouldCreateOfficialLink(decision, candidates) && selected) {
    const linked = await dependencies.linkOfficial({
      accountId: input.accountId,
      decision,
    });
    return linked.status === "saved"
      ? { ok: true, status: "ready_official", taxonId: linked.taxonId }
      : { ok: false, reason: "official_link_failed" };
  }

  if (shouldConfirmDeterministicAlias(decision) && selected) {
    return persistActionableResult(
      dependencies,
      input.accountId,
      input.turnId,
      parsed.value,
      aliasConfirmationOutput(selected),
      null,
      null,
    );
  }

  const aiResult = await dependencies.resolveWithAi({
    rawInput: parsed.value,
    decision,
    candidates,
  });
  const output = aiResult.ok
    ? aiResult.output
    : fallbackOutput("ai_unavailable_human_fallback");

  return persistActionableResult(
    dependencies,
    input.accountId,
    input.turnId,
    parsed.value,
    output,
    aiResult.model,
    aiResult.ok ? null : aiResult.reason,
  );
}

function shouldCreateOfficialLink(
  decision: DeterministicMatchDecision,
  candidates: TaxonMatchCandidate[],
): boolean {
  return (
    candidates.length === 1 &&
    decision.confidence === "high" &&
    decision.shouldUseDeterministicMatch &&
    decision.selectedCandidate !== null &&
    decision.needsAdminReview === false
  );
}

async function persistActionableResult(
  dependencies: PendingSetupBusinessDependencies,
  accountId: string,
  turnId: string,
  expectedRawInput: string,
  output: AiNicheResolutionOutput,
  model: string | null,
  errorCode: string | null,
): Promise<PendingSetupBusinessTurnResult> {
  const actionableMode: Exclude<AiNicheResolutionOutput["uxMode"], "none"> =
    output.uxMode === "none" ? "fallback_review" : output.uxMode;
  const actionableOutput: AiNicheResolutionOutput = {
    ...output,
    uxMode: actionableMode,
  };
  const suggestedTaxonId =
    actionableOutput.uxMode === "confirm_single"
      ? actionableOutput.options.find((option) => option.isOfficial)?.taxonId ?? null
      : null;
  const persisted = await dependencies.persistAiResult({
    accountId,
    turnId,
    expectedRawInput,
    status: "resolved",
    errorCode,
    model,
    schemaVersion: AI_NICHE_RESOLUTION_SCHEMA_VERSION,
    result: actionableOutput,
    uxMode: actionableOutput.uxMode,
    suggestedTaxonId,
    suggestedNewTaxonLabel: actionableOutput.suggestedNewTaxonLabel,
    needsUserConfirmation: actionableOutput.needsUserConfirmation,
    needsAdminReview: actionableOutput.needsAdminReview,
    reason: actionableOutput.reason,
  });

  if (!persisted) return { ok: false, reason: "result_persist_failed" };
  return {
    ok: true,
    status: "awaiting_confirmation",
    mode: actionableMode,
  };
}

function aliasConfirmationOutput(candidate: TaxonMatchCandidate): AiNicheResolutionOutput {
  return {
    uxMode: "confirm_single",
    message: "Confirme se esta opção representa seu negócio.",
    options: [
      {
        taxonId: candidate.taxonId,
        name: candidate.name,
        slug: candidate.slug,
        confidence: "high",
        reason: "official_alias_confirmation",
        isOfficial: true,
      },
    ],
    needsAdminReview: false,
    needsUserConfirmation: true,
    shouldCreateOfficialLink: false,
    suggestedNewTaxonLabel: null,
    reason: "deterministic_alias_confirmation_required",
  };
}

function fallbackOutput(reason: string): AiNicheResolutionOutput {
  return {
    uxMode: "fallback_review",
    message: "Ainda não encontrei uma categoria oficial segura. Você pode detalhar um pouco mais ou seguir com sua descrição.",
    options: [],
    needsAdminReview: true,
    needsUserConfirmation: true,
    shouldCreateOfficialLink: false,
    suggestedNewTaxonLabel: null,
    reason,
  };
}
