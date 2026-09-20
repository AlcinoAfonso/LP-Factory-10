import "server-only";

import type { OpenAiCostEconomicContext } from "../../../openai-costs";
import {
  AI_NICHE_RESOLUTION_SCHEMA_VERSION,
  evaluateDeterministicTaxonMatch,
  shouldConfirmDeterministicAlias,
  type AiNicheResolutionOutput,
  type MatchBusinessTaxonsResult,
  type TaxonMatchCandidate,
} from "../../niche-resolution";
import {
  mapDecisionToResolutionStatus,
  updateAccountNicheResolutionAiResult,
  upsertAccountNicheResolution,
} from "../../niche-resolution/adapters/accountNicheResolutionAdapter";
import {
  confirmDeterministicNicheForPendingSetup,
  confirmOperationalNicheForPendingSetup,
} from "../../niche-resolution/adapters/accountNicheResolutionUserAdapter";
import {
  linkAccountTaxonomyFromDeterministicDecision,
} from "../../niche-resolution/adapters/accountTaxonomyAdapter";
import {
  resolveNicheWithOpenAi,
  type ResolveAiNicheResolutionResult,
} from "../../niche-resolution/adapters/openAiResolver";
import { matchBusinessTaxonsDeterministic } from "../../niche-resolution/adapters/taxonMatchAdapter";
import type { PendingSetupStage } from "../contracts";
import {
  buildAliasConfirmationOutput,
  decidePendingSetupAiTurn,
  shouldUseAutomaticOfficialPath,
} from "../turn-policy";

export type PendingSetupNicheTurnResult =
  | Readonly<{
      ok: true;
      nextStage: Extract<PendingSetupStage, "business_understanding" | "niche_confirmation" | "ready_to_complete">;
      assistantContent: string;
      resolutionOutcome: "official" | "operational_fallback" | null;
    }>
  | Readonly<{ ok: false; reason: string }>;

type Dependencies = Readonly<{
  match?: (query: string, limit: number) => Promise<MatchBusinessTaxonsResult>;
  resolveAi?: typeof resolveNicheWithOpenAi;
}>;

export async function orchestratePendingSetupNicheTurn(input: {
  accountId: string;
  businessContext: string;
  aiContextProjection: string;
  apiKey?: string;
  financialContext: OpenAiCostEconomicContext;
}, dependencies: Dependencies = {}): Promise<PendingSetupNicheTurnResult> {
  const match = dependencies.match ?? matchBusinessTaxonsDeterministic;
  const matched = await match(input.businessContext, 10);
  if (!matched.ok) {
    return persistOperationalFallback(input.accountId, input.businessContext);
  }

  const candidates = [...matched.candidates];
  const decision = evaluateDeterministicTaxonMatch(candidates, input.businessContext);
  const selected = decision.selectedCandidate;
  const resolutionSaved = await upsertAccountNicheResolution({
    accountId: input.accountId,
    rawInput: input.businessContext,
    selectedTaxonId: selected?.taxonId ?? null,
    confidence: decision.confidence,
    shouldUseDeterministicMatch: decision.shouldUseDeterministicMatch,
    shouldEscalateToAi: decision.shouldEscalateToAi,
    aiEscalationMode: decision.aiEscalationMode,
    needsAdminReview: decision.needsAdminReview,
    reason: decision.reason,
    resolutionStatus: mapDecisionToResolutionStatus(decision),
    matchSource: selected?.matchSource ?? null,
    score: selected?.score ?? null,
  });
  if (!resolutionSaved) return { ok: false, reason: "resolution_write_failed" };

  if (shouldUseAutomaticOfficialPath(decision)) {
    const linked = await linkAccountTaxonomyFromDeterministicDecision({
      accountId: input.accountId,
      decision,
    });
    if (linked.status !== "saved") {
      return { ok: false, reason: `taxonomy_${linked.status}` };
    }
    const confirmed = await confirmDeterministicNicheForPendingSetup({
      accountId: input.accountId,
      taxonId: decision.selectedCandidate.taxonId,
    });
    if (!confirmed.ok) return { ok: false, reason: confirmed.reason };
    return {
      ok: true,
      nextStage: "ready_to_complete",
      assistantContent: `Entendi: seu negócio se encaixa em ${decision.selectedCandidate.name}. Já podemos seguir.`,
      resolutionOutcome: "official",
    };
  }

  if (shouldConfirmDeterministicAlias(decision) && selected) {
    const output = buildAliasConfirmationOutput(selected);
    const persisted = await persistAiOutput(input.accountId, output, null);
    if (!persisted) return { ok: false, reason: "resolution_write_failed" };
    return {
      ok: true,
      nextStage: "niche_confirmation",
      assistantContent: `Pelo que entendi, seu negócio se encaixa em ${selected.name}. É isso mesmo?`,
      resolutionOutcome: null,
    };
  }

  const resolveAi = dependencies.resolveAi ?? resolveNicheWithOpenAi;
  const aiResult = await resolveAi({
    rawInput: input.aiContextProjection,
    decision,
    candidates,
    apiKey: input.apiKey,
    financialContext: input.financialContext,
    executionOrigin: "runtime",
  });

  if (!aiResult.ok) {
    await persistAiFailure(input.accountId, aiResult);
    return persistOperationalFallback(input.accountId, input.businessContext);
  }

  const aiDecision = decidePendingSetupAiTurn({
    output: aiResult.output,
    allowedCandidates: candidates,
  });
  const singleOfficialId = aiDecision.kind === "confirm_official"
    ? aiDecision.candidate.taxonId
    : null;
  const persisted = await persistAiOutput(input.accountId, aiResult.output, aiResult.model, singleOfficialId);
  if (!persisted) return { ok: false, reason: "resolution_write_failed" };

  if (aiDecision.kind === "confirm_official") {
    return {
      ok: true,
      nextStage: "niche_confirmation",
      assistantContent: aiDecision.assistantContent,
      resolutionOutcome: null,
    };
  }
  if (aiDecision.kind === "ask_clarifying_question") {
    return {
      ok: true,
      nextStage: "business_understanding",
      assistantContent: aiDecision.assistantContent,
      resolutionOutcome: null,
    };
  }
  return persistOperationalFallback(input.accountId, input.businessContext);
}

async function persistAiOutput(
  accountId: string,
  output: AiNicheResolutionOutput,
  model: string | null,
  suggestedTaxonId = output.options.find((option) => option.isOfficial)?.taxonId ?? null,
): Promise<boolean> {
  return updateAccountNicheResolutionAiResult({
    accountId,
    status: "resolved",
    errorCode: null,
    model,
    schemaVersion: AI_NICHE_RESOLUTION_SCHEMA_VERSION,
    result: output,
    uxMode: output.uxMode,
    suggestedTaxonId,
    suggestedNewTaxonLabel: output.suggestedNewTaxonLabel,
    needsUserConfirmation: output.needsUserConfirmation,
    needsAdminReview: output.needsAdminReview,
    reason: output.reason,
  });
}

async function persistAiFailure(
  accountId: string,
  result: Exclude<ResolveAiNicheResolutionResult, { ok: true }>,
): Promise<void> {
  await updateAccountNicheResolutionAiResult({
    accountId,
    status: result.status === "failed" ? "failed" : "skipped",
    errorCode: result.reason,
    model: result.model,
    schemaVersion: result.schemaVersion,
    result: null,
    uxMode: null,
    suggestedTaxonId: null,
    suggestedNewTaxonLabel: null,
    needsUserConfirmation: false,
    needsAdminReview: false,
    reason: result.reason,
  });
}

async function persistOperationalFallback(
  accountId: string,
  businessContext: string,
): Promise<PendingSetupNicheTurnResult> {
  const confirmed = await confirmOperationalNicheForPendingSetup({
    accountId,
    label: businessContext,
  });
  if (!confirmed.ok) return { ok: false, reason: confirmed.reason };
  return {
    ok: true,
    nextStage: "ready_to_complete",
    assistantContent: "Entendi o contexto. Vou preservar essa descrição sem associar um nicho oficial incorreto. Já podemos seguir.",
    resolutionOutcome: "operational_fallback",
  };
}
