import "server-only";

import type { LandingPageGenerationContextPackage } from "../generationContextContracts";
import {
  materializeLandingPageDraftRevisionWithDependencies,
  type MaterializeLandingPageDraftRevisionResult,
} from "../landingPageRevisionWorkflow";
import { prepareLandingPageDraftRevisionCandidate } from "./landingPageDraftCandidateWorkflowAdapter";
import { appendLandingPageRevision } from "./landingPageRevisionAdapter";
import {
  cleanupLandingPageRevisionAsset,
  uploadLandingPageRevisionAsset,
} from "./landingPageRevisionStorageAdapter";

export function materializeLandingPageDraftRevision(input: Readonly<{
  context: LandingPageGenerationContextPackage;
  createdBy: string;
  requestId?: string | null;
  revalidate: () => Promise<boolean>;
}>): Promise<MaterializeLandingPageDraftRevisionResult> {
  return materializeLandingPageDraftRevisionWithDependencies(input, {
    prepareCandidate: prepareLandingPageDraftRevisionCandidate,
    uploadAsset: uploadLandingPageRevisionAsset,
    cleanupAsset: cleanupLandingPageRevisionAsset,
    revalidate: input.revalidate,
    appendRevision: appendLandingPageRevision,
  });
}
