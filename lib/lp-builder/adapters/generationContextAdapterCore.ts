import type { TaxonPreparationResult } from "../../conversion-content/landing-page/taxon-preparation";
import type {
  AccountLandingPage,
  AccountLandingPageOperationalRevalidationResult,
} from "../contracts";
import { compileLandingPageGenerationContext } from "../generationContext";
import { LANDING_PAGE_WORKSPACE_REQUIRED_INPUT_CATALOG_VERSION } from "../landingPageWorkspace";
import type {
  CompileLandingPageGenerationContextResult,
  LandingPageGenerationContextFailureCode,
} from "../generationContextContracts";

export type LandingPageGenerationContextBoundaryDependencies = Readonly<{
  loadRevalidationAuthority: (input: {
    accountId: string;
    landingPageId: string;
  }) => Promise<AccountLandingPageOperationalRevalidationResult>;
  loadLandingPage: (input: {
    accountId: string;
    landingPageId: string;
  }) => Promise<
    | Readonly<{ ok: true; landingPage: AccountLandingPage }>
    | Readonly<{ ok: false; error: "not_found" | "read_failed" }>
  >;
  loadPreparation: (input: {
    taxonId: string;
    requiredInputCatalogVersion: number;
  }) => Promise<TaxonPreparationResult>;
  log?: (payload: Readonly<Record<string, unknown>>) => void;
  now?: () => number;
}>;

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const REQUEST_ID_RE = /^[A-Za-z0-9._:-]{1,128}$/;

export async function compileLandingPageGenerationContextForDraftWithDependencies(
  input: unknown,
  dependencies: LandingPageGenerationContextBoundaryDependencies,
): Promise<CompileLandingPageGenerationContextResult> {
  const now = dependencies.now ?? Date.now;
  const startedAt = now();
  if (!isRecord(input)) {
    const result = failure("INVALID_INPUT", "Server generation context input is invalid.");
    safeLog(dependencies.log, result, undefined, now() - startedAt);
    return result;
  }
  const requestId = normalizeRequestId(
    typeof input.requestId === "string" ? input.requestId : undefined,
  );
  const accountId =
    typeof input.accountId === "string" ? input.accountId.trim() : "";
  const landingPageId =
    typeof input.landingPageId === "string" ? input.landingPageId.trim() : "";
  let result: CompileLandingPageGenerationContextResult;
  let preparationReason:
    | Extract<TaxonPreparationResult, { ok: false }>["error"]["code"]
    | undefined;

  if (
    !UUID_RE.test(accountId) ||
    !UUID_RE.test(landingPageId) ||
    (Object.hasOwn(input, "requestId") && requestId === undefined)
  ) {
    result = failure("INVALID_INPUT", "Server generation context input is invalid.");
    safeLog(dependencies.log, result, requestId, now() - startedAt);
    return result;
  }

  try {
    const revalidation = await dependencies.loadRevalidationAuthority({
      accountId,
      landingPageId,
    });
    if (!revalidation.ok) {
      const unauthorized = [
        "unauthenticated",
        "invalid_account_id",
        "account_not_found",
        "account_not_active",
        "membership_inactive",
        "commercial_entitlement_required",
      ].includes(revalidation.error);
      result = failure(
        unauthorized ? "ACCOUNT_CONTEXT_UNAUTHORIZED" : "CONTEXT_READ_FAILED",
        unauthorized
          ? "Account context is not authorized for generation."
          : "Landing-page configuration could not be read.",
      );
      safeLog(dependencies.log, result, requestId, now() - startedAt);
      return result;
    }

    const { currentTaxonChain } = revalidation.authority;

    const landingPage = await dependencies.loadLandingPage({ accountId, landingPageId });
    if (!landingPage.ok) {
      result = failure(
        landingPage.error === "not_found" ? "LANDING_PAGE_NOT_FOUND" : "CONTEXT_READ_FAILED",
        landingPage.error === "not_found"
          ? "Requested landing-page draft was not found."
          : "Landing-page draft could not be read.",
      );
      safeLog(dependencies.log, result, requestId, now() - startedAt);
      return result;
    }

    const servedTaxon =
      currentTaxonChain.ultraNiche ??
      currentTaxonChain.niche ??
      currentTaxonChain.segment;
    const preparation = await dependencies.loadPreparation({
      taxonId: servedTaxon.id,
      requiredInputCatalogVersion:
        LANDING_PAGE_WORKSPACE_REQUIRED_INPUT_CATALOG_VERSION,
    });
    if (!preparation.ok) preparationReason = preparation.error.code;
    result = compileLandingPageGenerationContext({
      landingPage: landingPage.landingPage,
      revalidationAuthority: revalidation.authority,
      preparation,
    });
  } catch {
    result = failure("CONTEXT_READ_FAILED", "Generation context dependencies failed.");
  }

  safeLog(
    dependencies.log,
    result,
    requestId,
    now() - startedAt,
    preparationReason,
  );
  return result;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function safeLog(
  logger: LandingPageGenerationContextBoundaryDependencies["log"],
  result: CompileLandingPageGenerationContextResult,
  requestId: string | undefined,
  latencyMs: number,
  preparationReason?: Extract<
    TaxonPreparationResult,
    { ok: false }
  >["error"]["code"],
): void {
  try {
    (logger ?? console.log)({
      event: "landing_page_generation_context_compilation",
      result: result.ok ? "success" : "failure",
      reason: result.ok ? "compiled" : result.error.code,
      ...(requestId ? { request_id: requestId } : {}),
      ...(preparationReason
        ? { preparation_reason: preparationReason }
        : {}),
      ...(Number.isFinite(latencyMs) && latencyMs >= 0
        ? { latency_ms: latencyMs }
        : {}),
    });
  } catch {
    // Logging is diagnostic only and must never change the deterministic result.
  }
}

function normalizeRequestId(value: string | undefined): string | undefined {
  if (value === undefined) return undefined;
  const normalized = value.trim();
  return REQUEST_ID_RE.test(normalized) ? normalized : undefined;
}

function failure(
  code: LandingPageGenerationContextFailureCode,
  message: string,
): CompileLandingPageGenerationContextResult {
  return Object.freeze({
    ok: false,
    error: Object.freeze({ code, message }),
  });
}
