import type { LandingPageGenerationContextPackage } from "./generationContextContracts";
import type { LandingPageDraftCandidateWorkflowResult } from "./landingPageDraftCandidateWorkflow";
import {
  buildLandingPageRevisionDocuments,
  createLandingPageRevisionAssetReference,
  type LandingPageRevisionAssetReference,
  type LandingPageRevisionContent,
  type LandingPageRevisionSnapshot,
} from "./landingPageRevision";

export type AppendLandingPageRevisionResult =
  | Readonly<{ ok: true; revisionId: string; revisionNumber: number }>
  | Readonly<{ ok: false; error: "APPEND_FAILED" | "APPEND_RESPONSE_INVALID" }>;

export type MaterializeLandingPageDraftRevisionResult =
  | Readonly<{
      ok: true;
      attemptId: string;
      requestId: string;
      revisionId: string;
      revisionNumber: number;
    }>
  | Readonly<{
      ok: false;
      attemptId: string | null;
      requestId: string | null;
      stage:
        | "candidate"
        | "documents"
        | "upload"
        | "revalidation"
        | "append";
      reason: string;
    }>;

type Dependencies = Readonly<{
  prepareCandidate: (input: Readonly<{
    context: LandingPageGenerationContextPackage;
    requestId?: string | null;
  }>) => Promise<LandingPageDraftCandidateWorkflowResult>;
  uploadAsset: (input: Readonly<{
    asset: LandingPageRevisionAssetReference;
    bytes: Uint8Array;
  }>) => Promise<Readonly<{ ok: true }> | Readonly<{ ok: false; error: string }>>;
  cleanupAsset: (asset: LandingPageRevisionAssetReference) => Promise<void>;
  revalidate: () => Promise<boolean>;
  appendRevision: (input: Readonly<{
    accountId: string;
    landingPageId: string;
    attemptId: string;
    content: LandingPageRevisionContent;
    snapshot: LandingPageRevisionSnapshot;
    createdBy: string;
  }>) => Promise<AppendLandingPageRevisionResult>;
  now?: () => Date;
}>;

export async function materializeLandingPageDraftRevisionWithDependencies(
  input: Readonly<{
    context: LandingPageGenerationContextPackage;
    createdBy: string;
    requestId?: string | null;
  }>,
  dependencies: Dependencies,
): Promise<MaterializeLandingPageDraftRevisionResult> {
  const candidate = await dependencies.prepareCandidate({
    context: input.context,
    requestId: input.requestId,
  });
  if (!candidate.ok) {
    return {
      ok: false,
      attemptId: candidate.attemptId,
      requestId: candidate.requestId,
      stage: "candidate",
      reason: `${candidate.stage}:${candidate.reason}`,
    };
  }

  const hero = candidate.candidate.sections.find((section) => section.kind === "hero");
  const asset = hero
    ? createLandingPageRevisionAssetReference({
        accountId: input.context.identities.accountId,
        landingPageId: input.context.identities.landingPage.id,
        attemptId: candidate.attemptId,
        bytes: candidate.image.bytes.byteLength,
        alt: hero.heading,
        imageConfigVersion: candidate.image.configuration.revision,
        visualBriefVersion: candidate.image.visualBriefVersion,
      })
    : null;
  if (!asset) {
    return failure(candidate, "documents", "INVALID_ASSET_REFERENCE");
  }

  const documents = buildLandingPageRevisionDocuments({
    context: input.context,
    candidate,
    asset,
    generatedAt: (dependencies.now ?? (() => new Date()))().toISOString(),
  });
  if (!documents.ok) {
    return failure(candidate, "documents", documents.error);
  }

  const upload = await dependencies.uploadAsset({
    asset,
    bytes: candidate.image.bytes,
  });
  if (!upload.ok) {
    return failure(candidate, "upload", upload.error);
  }

  if (!(await dependencies.revalidate())) {
    await dependencies.cleanupAsset(asset);
    return failure(candidate, "revalidation", "AUTHORITY_CHANGED");
  }

  const appended = await dependencies.appendRevision({
    accountId: input.context.identities.accountId,
    landingPageId: input.context.identities.landingPage.id,
    attemptId: candidate.attemptId,
    content: documents.content,
    snapshot: documents.snapshot,
    createdBy: input.createdBy,
  });
  if (!appended.ok) {
    await dependencies.cleanupAsset(asset);
    return failure(candidate, "append", appended.error);
  }

  return {
    ok: true,
    attemptId: candidate.attemptId,
    requestId: candidate.requestId,
    revisionId: appended.revisionId,
    revisionNumber: appended.revisionNumber,
  };
}

function failure(
  candidate: Extract<LandingPageDraftCandidateWorkflowResult, { ok: true }>,
  stage: Extract<MaterializeLandingPageDraftRevisionResult, { ok: false }>["stage"],
  reason: string,
): MaterializeLandingPageDraftRevisionResult {
  return {
    ok: false,
    attemptId: candidate.attemptId,
    requestId: candidate.requestId,
    stage,
    reason,
  };
}
