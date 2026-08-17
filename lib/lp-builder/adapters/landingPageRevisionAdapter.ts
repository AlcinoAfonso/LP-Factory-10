import "server-only";

import { createServiceClient } from "../../supabase/service";
import {
  landingPageRevisionContentSchema,
  validateLandingPageRevisionSnapshot,
  type LandingPageRevisionContent,
  type LandingPageRevisionSnapshot,
} from "../landingPageRevision";
import type { AppendLandingPageRevisionResult } from "../landingPageRevisionWorkflow";

export async function appendLandingPageRevision(input: Readonly<{
  accountId: string;
  landingPageId: string;
  attemptId: string;
  content: LandingPageRevisionContent;
  snapshot: LandingPageRevisionSnapshot;
  createdBy: string;
}>): Promise<AppendLandingPageRevisionResult> {
  try {
    const { data, error } = await createServiceClient().rpc(
      "append_account_landing_page_materialization_v1",
      {
        p_account_id: input.accountId,
        p_landing_page_id: input.landingPageId,
        p_attempt_id: input.attemptId,
        p_content_json: input.content,
        p_generation_context_snapshot_json: input.snapshot,
        p_created_by: input.createdBy,
      },
    );
    if (error) return { ok: false, error: "APPEND_FAILED" };
    const row = Array.isArray(data) ? data[0] : data;
    if (
      !isRecord(row) ||
      typeof row.materialization_id !== "string" ||
      !isPositiveInteger(row.revision_number)
    ) {
      return { ok: false, error: "APPEND_RESPONSE_INVALID" };
    }
    return {
      ok: true,
      revisionId: row.materialization_id,
      revisionNumber: row.revision_number,
    };
  } catch {
    return { ok: false, error: "APPEND_FAILED" };
  }
}

export type CurrentLandingPageRevision = Readonly<{
  id: string;
  accountId: string;
  landingPageId: string;
  revisionNumber: number;
  attemptId: string | null;
  content: LandingPageRevisionContent;
  snapshot: LandingPageRevisionSnapshot;
  createdBy: string;
  createdAt: string;
}>;

export async function readCurrentLandingPageRevision(input: Readonly<{
  accountId: string;
  landingPageId: string;
}>): Promise<
  | Readonly<{ ok: true; value: CurrentLandingPageRevision | null }>
  | Readonly<{ ok: false; error: "READ_FAILED" }>
> {
  try {
    const { data, error } = await createServiceClient()
      .from("account_landing_page_materializations")
      .select("id,account_id,landing_page_id,revision_number,attempt_id,content_json,generation_context_snapshot_json,created_by,created_at")
      .eq("account_id", input.accountId)
      .eq("landing_page_id", input.landingPageId)
      .order("revision_number", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) return { ok: false, error: "READ_FAILED" };
    if (data === null) return { ok: true, value: null };
    const mapped = mapRevision(data);
    return mapped
      ? { ok: true, value: mapped }
      : { ok: false, error: "READ_FAILED" };
  } catch {
    return { ok: false, error: "READ_FAILED" };
  }
}

function mapRevision(value: unknown): CurrentLandingPageRevision | null {
  if (!isRecord(value)) return null;
  const content = landingPageRevisionContentSchema.safeParse(value.content_json);
  if (
    !content.success ||
    typeof value.id !== "string" ||
    typeof value.account_id !== "string" ||
    typeof value.landing_page_id !== "string" ||
    !isPositiveInteger(value.revision_number) ||
    (value.attempt_id !== null && typeof value.attempt_id !== "string") ||
    !validateLandingPageRevisionSnapshot(value.generation_context_snapshot_json) ||
    typeof value.created_by !== "string" ||
    typeof value.created_at !== "string"
  ) {
    return null;
  }
  return {
    id: value.id,
    accountId: value.account_id,
    landingPageId: value.landing_page_id,
    revisionNumber: value.revision_number,
    attemptId: value.attempt_id,
    content: content.data,
    snapshot: value.generation_context_snapshot_json,
    createdBy: value.created_by,
    createdAt: value.created_at,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isPositiveInteger(value: unknown): value is number {
  return Number.isSafeInteger(value) && (value as number) > 0;
}
