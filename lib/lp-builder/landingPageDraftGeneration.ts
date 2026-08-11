import type {
  CompileLandingPageGenerationContextResult,
  LandingPageGenerationContextPackage,
} from "./generationContextContracts";
import type {
  GenerateLandingPageDraftCandidateInput,
  GenerateLandingPageDraftCandidateResult,
  LandingPageDraftGenerationInput,
  LandingPageDraftGenerationResult,
} from "./landingPageGenerationContracts";

export type LandingPageDraftGenerationDependencies = Readonly<{
  loadAuthenticatedActorId: () => Promise<string | null>;
  compileContext: (input: {
    accountId: string;
    landingPageId: string;
    requestId?: string;
  }) => Promise<CompileLandingPageGenerationContextResult>;
  requestCandidate: (
    input: LandingPageDraftGenerationInput & Readonly<{ requestId?: string }>,
  ) => Promise<LandingPageDraftGenerationResult>;
}>;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const REQUEST_ID_RE = /^[A-Za-z0-9._:-]{1,128}$/;

export type PreparedLandingPageDraftGeneration = Readonly<{
  accountId: string;
  landingPageId: string;
  actorUserId: string;
  requestId?: string;
  context: LandingPageGenerationContextPackage;
}>;

export type PrepareLandingPageDraftGenerationResult =
  | Readonly<{ ok: true; value: PreparedLandingPageDraftGeneration }>
  | Extract<GenerateLandingPageDraftCandidateResult, { ok: false; stage: "context" }>;

export async function generateLandingPageDraftCandidateWithDependencies(
  input: unknown,
  dependencies: LandingPageDraftGenerationDependencies,
): Promise<GenerateLandingPageDraftCandidateResult> {
  const prepared = await prepareLandingPageDraftGenerationWithDependencies(input, dependencies);
  if (!prepared.ok) return prepared;
  return requestPreparedLandingPageDraftCandidateWithDependencies(prepared.value, dependencies);
}

export async function prepareLandingPageDraftGenerationWithDependencies(
  input: unknown,
  dependencies: Pick<LandingPageDraftGenerationDependencies, "loadAuthenticatedActorId" | "compileContext">,
): Promise<PrepareLandingPageDraftGenerationResult> {
  if (!isValidInput(input)) return { ok: false, stage: "context", code: "INVALID_INPUT" };
  const normalized = {
    accountId: input.accountId.trim(),
    landingPageId: input.landingPageId.trim(),
    ...(input.requestId ? { requestId: input.requestId.trim() } : {}),
  };
  const actorUserId = await dependencies.loadAuthenticatedActorId();
  if (!actorUserId || !UUID_RE.test(actorUserId)) {
    return { ok: false, stage: "context", code: "ACCOUNT_CONTEXT_UNAUTHORIZED" };
  }
  const compiled = await dependencies.compileContext({
    accountId: normalized.accountId,
    landingPageId: normalized.landingPageId,
    ...(normalized.requestId ? { requestId: normalized.requestId } : {}),
  });
  if (!compiled.ok) return { ok: false, stage: "context", code: compiled.error.code };

  return { ok: true, value: { ...normalized, actorUserId, context: compiled.value } };
}

export async function requestPreparedLandingPageDraftCandidateWithDependencies(
  prepared: PreparedLandingPageDraftGeneration,
  dependencies: Pick<LandingPageDraftGenerationDependencies, "requestCandidate">,
): Promise<GenerateLandingPageDraftCandidateResult> {
  const generated = await dependencies.requestCandidate({
    context: prepared.context,
    actorUserId: prepared.actorUserId,
    ...(prepared.requestId ? { requestId: prepared.requestId } : {}),
  });
  if (!generated.ok) return { ok: false, stage: "provider", kind: generated.kind };
  return {
    ok: true,
    actorUserId: prepared.actorUserId,
    context: prepared.context,
    candidate: generated.candidate,
    exposedGenerationContext: generated.exposedGenerationContext,
    responseId: generated.responseId,
    inputTokens: generated.inputTokens,
    outputTokens: generated.outputTokens,
  };
}

function isValidInput(value: unknown): value is GenerateLandingPageDraftCandidateInput {
  if (!isRecord(value)) return false;
  if (
    typeof value.accountId !== "string" ||
    typeof value.landingPageId !== "string" ||
    !UUID_RE.test(value.accountId.trim()) ||
    !UUID_RE.test(value.landingPageId.trim())
  ) {
    return false;
  }
  const allowedKeys = new Set(["accountId", "landingPageId", "requestId"]);
  if (Object.keys(value).some((key) => !allowedKeys.has(key))) return false;
  return !Object.hasOwn(value, "requestId") ||
    (typeof value.requestId === "string" && REQUEST_ID_RE.test(value.requestId.trim()));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
