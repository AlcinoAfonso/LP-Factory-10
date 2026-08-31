import "server-only";

import type { LandingPageGenerationContextPackage } from "../generationContextContracts";
import { createOpenAiLpCostTracker } from "../../openai-costs/adapters/lpCostTrackingAdapter";
import { loadLandingPageGenerationKnowledge } from "./landingPageGenerationKnowledgeAdapter";
import {
  prepareLandingPageDraftRevisionCandidate as prepareLandingPageDraftRevisionCandidateCore,
  type LandingPageDraftCandidateWorkflowResult,
} from "../landingPageDraftCandidateWorkflow";

export function prepareLandingPageDraftRevisionCandidate(input: Readonly<{
  context: LandingPageGenerationContextPackage;
  requestId: string;
  deadlineAtMs?: number;
  signal?: AbortSignal;
}>): Promise<LandingPageDraftCandidateWorkflowResult> {
  return prepareLandingPageDraftRevisionCandidateCore(input, {
    apiKey: process.env.OPENAI_API_KEY,
    costTracker: createOpenAiLpCostTracker(),
    loadKnowledge: loadLandingPageGenerationKnowledge,
  });
}
