import type {
  LandingPageGenerationContextSnapshotV1,
  LandingPageMaterializedContentV1,
} from "../conversion-content/landing-page";

export const LANDING_PAGE_MATERIALIZATION_PROJECTION =
  "landing_page_id,account_id,content_json,generation_context_snapshot_json,created_by,created_at" as const;

export type AccountLandingPageMaterialization = Readonly<{
  landingPageId: string;
  accountId: string;
  content: LandingPageMaterializedContentV1;
  generationContextSnapshot: LandingPageGenerationContextSnapshotV1;
  createdBy: string;
  createdAt: string;
}>;

export type LandingPageMaterializationStorageError =
  | "MATERIALIZATION_STORAGE_UNAVAILABLE"
  | "MATERIALIZATION_READ_FAILED"
  | "MATERIALIZATION_INVALID"
  | "MATERIALIZATION_INSERT_FAILED";

export type ProbeLandingPageMaterializationReadinessResult =
  | Readonly<{ ok: true; ready: true; sample: AccountLandingPageMaterialization | null }>
  | Readonly<{ ok: false; ready: false; error: LandingPageMaterializationStorageError }>;

export type ReadLandingPageMaterializationResult =
  | Readonly<{ ok: true; value: AccountLandingPageMaterialization | null }>
  | Readonly<{ ok: false; error: LandingPageMaterializationStorageError }>;

export type InsertLandingPageMaterializationResult =
  | Readonly<{ ok: true; value: AccountLandingPageMaterialization }>
  | Readonly<{ ok: false; error: "ALREADY_MATERIALIZED" | LandingPageMaterializationStorageError }>;

export type MaterializeFirstLandingPageDraftResult =
  | Readonly<{ ok: true; value: AccountLandingPageMaterialization }>
  | Readonly<{
      ok: false;
      error:
        | "INVALID_INPUT"
        | "NOT_READY"
        | "ALREADY_MATERIALIZED"
        | "GENERATION_FAILED"
        | "INVALID_CANDIDATE"
        | LandingPageMaterializationStorageError;
    }>;
