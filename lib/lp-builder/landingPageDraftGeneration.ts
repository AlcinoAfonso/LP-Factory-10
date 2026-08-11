import type { CompileLandingPageGenerationContextResult } from "./generationContextContracts";
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

export async function generateLandingPageDraftCandidateWithDependencies(
  input: unknown,
  dependencies: LandingPageDraftGenerationDependencies,
): Promise<GenerateLandingPageDraftCandidateResult> {
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

  const generated = await dependencies.requestCandidate({
    context: compiled.value,
    actorUserId,
    ...(normalized.requestId ? { requestId: normalized.requestId } : {}),
  });
  if (!generated.ok) return { ok: false, stage: "provider", kind: generated.kind };
  return {
    ok: true,
    context: compiled.value,
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
