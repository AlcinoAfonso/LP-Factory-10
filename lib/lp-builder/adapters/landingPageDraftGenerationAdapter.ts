import "server-only";

import { createClient } from "../../supabase/server";
import { compileLandingPageGenerationContextForDraft } from "./generationContextAdapter";
import { requestLandingPageDraftCandidate } from "./landingPageGenerationOpenAiAdapter";
import { generateLandingPageDraftCandidateWithDependencies } from "../landingPageDraftGeneration";
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

async function loadAuthenticatedActorId(): Promise<string | null> {
  try {
    const client = await createClient();
    const { data: { user }, error } = await client.auth.getUser();
    return error || !user?.id ? null : user.id;
  } catch {
    return null;
  }
}
