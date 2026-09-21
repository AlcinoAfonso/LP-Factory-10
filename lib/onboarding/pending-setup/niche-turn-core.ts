import type { OpenAiCostEconomicContext, OpenAiCostExecutionOrigin } from "../../openai-costs";
import type {
  AiNicheResolutionOutput,
  DeterministicMatchDecision,
  TaxonMatchCandidate,
} from "../niche-resolution/contracts";
import type { ResolveAiNicheResolutionResult } from "../niche-resolution/adapters/openAiResolver";
import type {
  PendingSetupConfirmationKind,
  PendingSetupOpenAiCallClaimResult,
  PendingSetupStage,
} from "./contracts";
import {
  decidePendingSetupAiTurn,
  hasReachedPendingSetupOpenAiCallLimit,
  PENDING_SETUP_OPENAI_RETRY_MESSAGE,
  PENDING_SETUP_TERMINAL_FALLBACK_MESSAGE,
  shouldFallbackFromRepeatedClarification,
} from "./turn-policy";

export type PendingSetupNicheTurnResult =
  | Readonly<{
      ok: true;
      nextStage: Extract<PendingSetupStage, "business_understanding" | "niche_confirmation" | "ready_to_complete">;
      assistantContent: string;
      resolutionOutcome: "official" | "operational_fallback" | null;
      confirmationKind: PendingSetupConfirmationKind | null;
    }>
  | Readonly<{ ok: false; reason: string }>;

type PendingSetupAiResolver = (input: {
  rawInput: string;
  decision: DeterministicMatchDecision;
  candidates: TaxonMatchCandidate[];
  apiKey?: string;
  financialContext: OpenAiCostEconomicContext;
  executionOrigin?: OpenAiCostExecutionOrigin;
}) => Promise<ResolveAiNicheResolutionResult>;

type Dependencies = Readonly<{
  resolveAi: PendingSetupAiResolver;
  persistAiOutput: (
    output: AiNicheResolutionOutput,
    model: string | null,
    suggestedTaxonId: string | null,
  ) => Promise<boolean>;
  persistAiFailure: (
    result: Exclude<ResolveAiNicheResolutionResult, { ok: true }>,
  ) => Promise<void>;
  reserveOpenAiCall: () => Promise<PendingSetupOpenAiCallClaimResult>;
}>;

export async function resolvePendingSetupAiTurn(input: {
  aiContextProjection: string;
  decision: DeterministicMatchDecision;
  candidates: readonly TaxonMatchCandidate[];
  previousAssistantContents: readonly string[];
  openAiCallCount: number | null;
  apiKey?: string;
  financialContext: OpenAiCostEconomicContext;
}, dependencies: Dependencies): Promise<PendingSetupNicheTurnResult> {
  if (hasReachedPendingSetupOpenAiCallLimit(input.openAiCallCount)) {
    return prepareOperationalFallback();
  }

  const reserved = await dependencies.reserveOpenAiCall();
  if (!reserved.ok) return prepareOperationalFallback();

  const currentOpenAiCallReachesLimit = hasReachedPendingSetupOpenAiCallLimit(
    reserved.count,
  );
  const aiResult = await dependencies.resolveAi({
    rawInput: input.aiContextProjection,
    decision: input.decision,
    candidates: [...input.candidates],
    apiKey: input.apiKey,
    financialContext: input.financialContext,
    executionOrigin: "runtime",
  });

  if (!aiResult.ok) {
    await dependencies.persistAiFailure(aiResult);
    return currentOpenAiCallReachesLimit
      ? prepareOperationalFallback()
      : retryAfterOpenAiFailure();
  }

  const aiDecision = decidePendingSetupAiTurn({
    output: aiResult.output,
    allowedCandidates: input.candidates,
  });
  const singleOfficialId = aiDecision.kind === "confirm_official"
    ? aiDecision.candidate.taxonId
    : null;
  const persisted = await dependencies.persistAiOutput(
    aiResult.output,
    aiResult.model,
    singleOfficialId,
  );
  if (!persisted) {
    return currentOpenAiCallReachesLimit
      ? prepareOperationalFallback()
      : { ok: false, reason: "ai_resolution_write_failed" };
  }

  if (aiDecision.kind === "confirm_official") {
    return {
      ok: true,
      nextStage: "niche_confirmation",
      assistantContent: aiDecision.assistantContent,
      resolutionOutcome: null,
      confirmationKind: "official",
    };
  }
  if (aiDecision.kind === "ask_clarifying_question") {
    if (currentOpenAiCallReachesLimit || shouldFallbackFromRepeatedClarification({
      previousAssistantContents: input.previousAssistantContents,
      nextAssistantContent: aiDecision.assistantContent,
    })) {
      return prepareOperationalFallback();
    }
    return {
      ok: true,
      nextStage: "business_understanding",
      assistantContent: aiDecision.assistantContent,
      resolutionOutcome: null,
      confirmationKind: null,
    };
  }
  return prepareOperationalFallback();
}

function retryAfterOpenAiFailure(): PendingSetupNicheTurnResult {
  return {
    ok: true,
    nextStage: "business_understanding",
    assistantContent: PENDING_SETUP_OPENAI_RETRY_MESSAGE,
    resolutionOutcome: null,
    confirmationKind: null,
  };
}

function prepareOperationalFallback(): PendingSetupNicheTurnResult {
  return {
    ok: true,
    nextStage: "niche_confirmation",
    assistantContent: PENDING_SETUP_TERMINAL_FALLBACK_MESSAGE,
    resolutionOutcome: null,
    confirmationKind: "operational_fallback",
  };
}
