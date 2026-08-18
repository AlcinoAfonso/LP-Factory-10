import type { LandingPageGenerationContextPackage } from "./generationContextContracts";
import {
  LANDING_PAGE_DRAFT_TOTAL_TIMEOUT_MS,
  type LandingPageDraftCandidateWorkflowResult,
} from "./landingPageDraftCandidateWorkflow";
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
        | "append"
        | "budget";
      reason: string;
    }>;

type Dependencies = Readonly<{
  prepareCandidate: (input: Readonly<{
    context: LandingPageGenerationContextPackage;
    requestId: string;
    deadlineAtMs?: number;
    signal?: AbortSignal;
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
  nowMs?: () => number;
}>;

export async function materializeLandingPageDraftRevisionWithDependencies(
  input: Readonly<{
    context: LandingPageGenerationContextPackage;
    createdBy: string;
    requestId: string;
  }>,
  dependencies: Dependencies,
): Promise<MaterializeLandingPageDraftRevisionResult> {
  const nowMs = dependencies.nowMs ?? Date.now;
  const deadlineAtMs = nowMs() + LANDING_PAGE_DRAFT_TOTAL_TIMEOUT_MS;
  const controller = new AbortController();
  const deadlineTimer = setTimeout(
    () => controller.abort(),
    LANDING_PAGE_DRAFT_TOTAL_TIMEOUT_MS,
  );

  try {
    const candidate = await dependencies.prepareCandidate({
      context: input.context,
      requestId: input.requestId,
      deadlineAtMs,
      signal: controller.signal,
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
    if (budgetExpired(deadlineAtMs, nowMs, controller.signal)) {
      return failure(candidate, "budget", "TOTAL_TIMEOUT_BEFORE_DOCUMENTS");
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
    if (budgetExpired(deadlineAtMs, nowMs, controller.signal)) {
      return failure(candidate, "budget", "TOTAL_TIMEOUT_BEFORE_UPLOAD");
    }

    const upload = await dependencies.uploadAsset({
      asset,
      bytes: candidate.image.bytes,
    });
    if (!upload.ok) {
      return failure(candidate, "upload", upload.error);
    }
    if (budgetExpired(deadlineAtMs, nowMs, controller.signal)) {
      await dependencies.cleanupAsset(asset);
      return failure(candidate, "budget", "TOTAL_TIMEOUT_AFTER_UPLOAD");
    }

    if (!(await dependencies.revalidate())) {
      await dependencies.cleanupAsset(asset);
      return failure(candidate, "revalidation", "AUTHORITY_CHANGED");
    }
    if (budgetExpired(deadlineAtMs, nowMs, controller.signal)) {
      await dependencies.cleanupAsset(asset);
      return failure(candidate, "budget", "TOTAL_TIMEOUT_BEFORE_APPEND");
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
  } finally {
    clearTimeout(deadlineTimer);
  }
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

function budgetExpired(
  deadlineAtMs: number,
  nowMs: () => number,
  signal: AbortSignal,
) {
  return signal.aborted || nowMs() >= deadlineAtMs;
}
