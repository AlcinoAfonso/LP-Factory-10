import {
  validateLandingPageGenerationContextSnapshotV1,
  validateLandingPageMaterializedContentV1,
  type LandingPageGenerationContextSnapshotV1,
  type LandingPageMaterializedContentV1,
} from "../../conversion-content/landing-page";
import {
  LANDING_PAGE_MATERIALIZATION_PROJECTION,
  type AccountLandingPageMaterialization,
  type InsertLandingPageMaterializationResult,
  type ProbeLandingPageMaterializationReadinessResult,
  type ReadLandingPageMaterializationResult,
} from "../landingPageMaterializationContracts";

type DbError = Readonly<{ code?: string; message?: string }>;
type DbResult = Promise<Readonly<{ data: unknown; error: DbError | null }>>;

export type LandingPageMaterializationStorageDependencies = Readonly<{
  probeProjection: (projection: typeof LANDING_PAGE_MATERIALIZATION_PROJECTION) => DbResult;
  readProjection: (input: {
    projection: typeof LANDING_PAGE_MATERIALIZATION_PROJECTION;
    accountId: string;
    landingPageId: string;
  }) => DbResult;
  insertRow: (input: {
    projection: typeof LANDING_PAGE_MATERIALIZATION_PROJECTION;
    row: Readonly<Record<string, unknown>>;
  }) => DbResult;
}>;

export async function probeLandingPageMaterializationReadinessWithDependencies(
  dependencies: LandingPageMaterializationStorageDependencies,
): Promise<ProbeLandingPageMaterializationReadinessResult> {
  try {
    const { data, error } = await dependencies.probeProjection(LANDING_PAGE_MATERIALIZATION_PROJECTION);
    if (error || !Array.isArray(data) || data.length > 1) {
      return { ok: false, ready: false, error: "MATERIALIZATION_STORAGE_UNAVAILABLE" };
    }
    if (data.length === 0) return { ok: true, ready: true, sample: null };
    const parsed = parseRow(data[0]);
    return parsed
      ? { ok: true, ready: true, sample: parsed }
      : { ok: false, ready: false, error: "MATERIALIZATION_INVALID" };
  } catch {
    return { ok: false, ready: false, error: "MATERIALIZATION_STORAGE_UNAVAILABLE" };
  }
}

export async function readLandingPageMaterializationWithDependencies(
  input: { accountId: string; landingPageId: string },
  dependencies: LandingPageMaterializationStorageDependencies,
): Promise<ReadLandingPageMaterializationResult> {
  try {
    const { data, error } = await dependencies.readProjection({
      projection: LANDING_PAGE_MATERIALIZATION_PROJECTION,
      accountId: input.accountId,
      landingPageId: input.landingPageId,
    });
    if (error) return { ok: false, error: "MATERIALIZATION_READ_FAILED" };
    if (data === null) return { ok: true, value: null };
    const parsed = parseRow(data);
    return parsed
      ? { ok: true, value: parsed }
      : { ok: false, error: "MATERIALIZATION_INVALID" };
  } catch {
    return { ok: false, error: "MATERIALIZATION_READ_FAILED" };
  }
}

export async function insertLandingPageMaterializationWithDependencies(
  input: Readonly<{
    landingPageId: string;
    accountId: string;
    content: unknown;
    generationContextSnapshot: unknown;
    createdBy: string;
  }>,
  dependencies: LandingPageMaterializationStorageDependencies,
): Promise<InsertLandingPageMaterializationResult> {
  const content = validateLandingPageMaterializedContentV1(input.content);
  const snapshot = validateLandingPageGenerationContextSnapshotV1(input.generationContextSnapshot);
  if (!content.ok || !snapshot.ok) return { ok: false, error: "MATERIALIZATION_INVALID" };
  try {
    const { data, error } = await dependencies.insertRow({
      projection: LANDING_PAGE_MATERIALIZATION_PROJECTION,
      row: {
        landing_page_id: input.landingPageId,
        account_id: input.accountId,
        content_json: content.value,
        generation_context_snapshot_json: snapshot.value,
        created_by: input.createdBy,
      },
    });
    if (error?.code === "23505") {
      const winner = await readLandingPageMaterializationWithDependencies({
        accountId: input.accountId,
        landingPageId: input.landingPageId,
      }, dependencies);
      if (!winner.ok) return winner;
      return winner.value
        ? { ok: true, value: winner.value }
        : { ok: false, error: "MATERIALIZATION_READ_FAILED" };
    }
    if (error) return { ok: false, error: "MATERIALIZATION_INSERT_FAILED" };
    const parsed = parseRow(data);
    return parsed
      ? { ok: true, value: parsed }
      : { ok: false, error: "MATERIALIZATION_INVALID" };
  } catch {
    return { ok: false, error: "MATERIALIZATION_INSERT_FAILED" };
  }
}

function parseRow(value: unknown): AccountLandingPageMaterialization | null {
  if (!isExactRecord(value, [
    "landing_page_id", "account_id", "content_json",
    "generation_context_snapshot_json", "created_by", "created_at",
  ])) return null;
  if (![value.landing_page_id, value.account_id, value.created_by]
    .every((item) => typeof item === "string" && UUID_RE.test(item))) return null;
  if (typeof value.created_at !== "string" || !Number.isFinite(Date.parse(value.created_at))) return null;
  const content = validateLandingPageMaterializedContentV1(value.content_json);
  const snapshot = validateLandingPageGenerationContextSnapshotV1(value.generation_context_snapshot_json);
  if (!content.ok || !snapshot.ok || !isSnapshotCoherent(content.value, snapshot.value)) return null;
  return deepFreeze({
    landingPageId: value.landing_page_id as string,
    accountId: value.account_id as string,
    content: content.value,
    generationContextSnapshot: snapshot.value,
    createdBy: value.created_by as string,
    createdAt: value.created_at as string,
  });
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isSnapshotCoherent(
  content: LandingPageMaterializedContentV1,
  snapshot: LandingPageGenerationContextSnapshotV1,
) {
  if (snapshot.structuralIdentities.modules.length !== content.modules.length) return false;
  const snapshotRootVersion = snapshot.structuralIdentities.versions.rootVersion;
  if (snapshotRootVersion !== content.root.rootVersion) return false;
  return content.modules.every((module, index) => {
    const identity = snapshot.structuralIdentities.modules[index];
    return identity?.order === index &&
      identity.moduleKey === module.moduleKey &&
      identity.moduleVersion === module.moduleVersion &&
      identity.variantKey === module.variantKey &&
      identity.variantVersion === module.variantVersion &&
      identity.fieldContractKey === module.fieldContractKey;
  });
}

function isExactRecord(value: unknown, expectedKeys: readonly string[]): value is Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const actual = Object.keys(value).sort();
  const expected = [...expectedKeys].sort();
  return actual.length === expected.length && actual.every((key, index) => key === expected[index]);
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    for (const nested of Object.values(value)) deepFreeze(nested);
    Object.freeze(value);
  }
  return value;
}
