import type {
  AccountLandingPageMaterialization,
  ProbeLandingPageMaterializationReadinessResult,
  ReadLandingPageMaterializationResult,
} from "./landingPageMaterializationContracts";

export type LandingPageDraftExperienceState =
  | Readonly<{ status: "unavailable" }>
  | Readonly<{ status: "empty" }>
  | Readonly<{ status: "invalid" }>
  | Readonly<{
      status: "ready";
      materialization: AccountLandingPageMaterialization;
    }>;

export type LandingPageDraftExperienceDependencies = Readonly<{
  probeReadiness: () => Promise<ProbeLandingPageMaterializationReadinessResult>;
  readMaterialization: (input: {
    accountId: string;
    landingPageId: string;
  }) => Promise<ReadLandingPageMaterializationResult>;
}>;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function getLandingPageDraftExperienceStateWithDependencies(
  input: unknown,
  dependencies: LandingPageDraftExperienceDependencies,
): Promise<LandingPageDraftExperienceState> {
  if (!isInputValid(input)) return { status: "invalid" };

  const normalized = {
    accountId: input.accountId.trim(),
    landingPageId: input.landingPageId.trim(),
  };
  const readiness = await dependencies.probeReadiness();
  if (!readiness.ok) return { status: "unavailable" };

  const materialization = await dependencies.readMaterialization(normalized);
  if (!materialization.ok) {
    return materialization.error === "MATERIALIZATION_INVALID"
      ? { status: "invalid" }
      : { status: "unavailable" };
  }
  if (!materialization.value) return { status: "empty" };
  if (
    materialization.value.accountId !== normalized.accountId ||
    materialization.value.landingPageId !== normalized.landingPageId
  ) {
    return { status: "invalid" };
  }
  return { status: "ready", materialization: materialization.value };
}

function isInputValid(value: unknown): value is {
  accountId: string;
  landingPageId: string;
} {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const input = value as Record<string, unknown>;
  if (
    Object.keys(input).length !== 2 ||
    typeof input.accountId !== "string" ||
    typeof input.landingPageId !== "string"
  ) {
    return false;
  }
  return UUID_RE.test(input.accountId.trim()) && UUID_RE.test(input.landingPageId.trim());
}
