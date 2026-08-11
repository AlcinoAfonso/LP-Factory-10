import type { GenerateLandingPageDraftCandidateResult } from "./landingPageGenerationContracts";
import type {
  PrepareLandingPageDraftGenerationResult,
  PreparedLandingPageDraftGeneration,
} from "./landingPageDraftGeneration";
import { buildLandingPageInitialMaterialization } from "./landingPageMaterialization";
import type {
  InsertLandingPageMaterializationResult,
  MaterializeFirstLandingPageDraftResult,
  ProbeLandingPageMaterializationReadinessResult,
  ReadLandingPageMaterializationResult,
} from "./landingPageMaterializationContracts";

export type MaterializeFirstLandingPageDraftDependencies = Readonly<{
  probeReadiness: () => Promise<ProbeLandingPageMaterializationReadinessResult>;
  readMaterialization: (input: { accountId: string; landingPageId: string }) => Promise<ReadLandingPageMaterializationResult>;
  prepareGeneration: (input: { accountId: string; landingPageId: string; requestId?: string }) => Promise<PrepareLandingPageDraftGenerationResult>;
  requestCandidate: (prepared: PreparedLandingPageDraftGeneration) => Promise<GenerateLandingPageDraftCandidateResult>;
  insertMaterialization: (input: {
    landingPageId: string;
    accountId: string;
    content: unknown;
    generationContextSnapshot: unknown;
    createdBy: string;
  }) => Promise<InsertLandingPageMaterializationResult>;
}>;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const REQUEST_ID_RE = /^[A-Za-z0-9._:-]{1,128}$/;

export async function materializeFirstLandingPageDraftWithDependencies(
  input: unknown,
  dependencies: MaterializeFirstLandingPageDraftDependencies,
): Promise<MaterializeFirstLandingPageDraftResult> {
  if (!isInputValid(input)) return { ok: false, error: "INVALID_INPUT" };
  const normalized = {
    accountId: input.accountId.trim(),
    landingPageId: input.landingPageId.trim(),
    ...(input.requestId ? { requestId: input.requestId.trim() } : {}),
  };
  const readiness = await dependencies.probeReadiness();
  if (!readiness.ok) return { ok: false, error: "NOT_READY" };

  const prepared = await dependencies.prepareGeneration(normalized);
  if (!prepared.ok) return { ok: false, error: "GENERATION_FAILED" };

  const current = await dependencies.readMaterialization(normalized);
  if (!current.ok) return { ok: false, error: current.error };
  if (current.value) return { ok: false, error: "ALREADY_MATERIALIZED" };

  const generated = await dependencies.requestCandidate(prepared.value);
  if (!generated.ok) return { ok: false, error: "GENERATION_FAILED" };
  const materialization = buildLandingPageInitialMaterialization({
    context: generated.context,
    candidate: generated.candidate,
    exposedGenerationContext: generated.exposedGenerationContext,
  });
  if (!materialization.ok) return { ok: false, error: "INVALID_CANDIDATE" };

  const inserted = await dependencies.insertMaterialization({
    landingPageId: normalized.landingPageId,
    accountId: normalized.accountId,
    content: materialization.content,
    generationContextSnapshot: materialization.snapshot,
    createdBy: generated.actorUserId,
  });
  if (!inserted.ok) return { ok: false, error: inserted.error };
  return inserted;
}

function isInputValid(value: unknown): value is { accountId: string; landingPageId: string; requestId?: string } {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const input = value as Record<string, unknown>;
  if (Object.keys(input).some((key) => !["accountId", "landingPageId", "requestId"].includes(key))) return false;
  if (typeof input.accountId !== "string" || typeof input.landingPageId !== "string" ||
    !UUID_RE.test(input.accountId.trim()) || !UUID_RE.test(input.landingPageId.trim())) return false;
  return !Object.hasOwn(input, "requestId") ||
    (typeof input.requestId === "string" && REQUEST_ID_RE.test(input.requestId.trim()));
}
