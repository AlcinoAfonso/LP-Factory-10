import "server-only";

import { createClient } from "../../supabase/server";
import { compileLandingPageGenerationContextForDraft } from "./generationContextAdapter";
import { requestLandingPageDraftCandidate } from "./landingPageGenerationOpenAiAdapter";
import {
  generateLandingPageDraftCandidateWithDependencies,
  prepareLandingPageDraftGenerationWithDependencies,
  requestPreparedLandingPageDraftCandidateWithDependencies,
  type PrepareLandingPageDraftGenerationResult,
  type PreparedLandingPageDraftGeneration,
} from "../landingPageDraftGeneration";
import type {
  GenerateLandingPageDraftCandidateInput,
  GenerateLandingPageDraftCandidateResult,
} from "../landingPageGenerationContracts";

export function generateLandingPageDraftCandidate(
  input: GenerateLandingPageDraftCandidateInput,
): Promise<GenerateLandingPageDraftCandidateResult> {
  return generateLandingPageDraftCandidateWithDependencies(input, {
    loadAuthenticatedActorId,
    compileContext: compileLandingPageGenerationContextForDraft,
    requestCandidate: requestLandingPageDraftCandidate,
  });
}

export function prepareLandingPageDraftGeneration(
  input: GenerateLandingPageDraftCandidateInput,
): Promise<PrepareLandingPageDraftGenerationResult> {
  return prepareLandingPageDraftGenerationWithDependencies(input, {
    loadAuthenticatedActorId,
    compileContext: compileLandingPageGenerationContextForDraft,
  });
}

export function requestPreparedLandingPageDraftCandidate(
  prepared: PreparedLandingPageDraftGeneration,
): Promise<GenerateLandingPageDraftCandidateResult> {
  return requestPreparedLandingPageDraftCandidateWithDependencies(prepared, {
    requestCandidate: requestLandingPageDraftCandidate,
  });
}

async function loadAuthenticatedActorId(): Promise<string | null> {
  try {
    const client = await createClient();
    const { data: { user }, error } = await client.auth.getUser();
    return error || !user?.id ? null : user.id;
  } catch {
    return null;
  }
}
