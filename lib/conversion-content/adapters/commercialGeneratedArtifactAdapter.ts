import "server-only";

import { createServiceClient } from "@/lib/supabase/service";
import {
  COMMERCIAL_RESEARCH_BLOCKS,
  type CommercialResearchBlock,
} from "../contracts";
import type {
  ActivateCommercialGeneratedArtifactResult,
  CommercialGeneratedArtifactDraft,
  CommercialGeneratedArtifactIdentity,
  CommercialGeneratedArtifactRecord,
  CommercialGeneratedArtifactStatus,
  CreateCommercialGeneratedArtifactResult,
} from "../contracts";
import {
  createCommercialGeneratedArtifactIdentityKey,
  validateCommercialGeneratedContent,
} from "../generatedCommercialContent";

type ArtifactRow = {
  id: string;
  identity_key: string;
  artifact_version: number;
  status: string;
  identity_json: unknown;
  content_schema_version: string;
  content_json: unknown;
  created_at: string;
  updated_at: string;
  activated_at: string | null;
  archived_at: string | null;
};

type CreateDraftRpcRow = {
  artifact_id: string;
  artifact_version: number;
  artifact_status: string;
};

const ARTIFACT_SELECT =
  "id,identity_key,artifact_version,status,identity_json,content_schema_version,content_json,created_at,updated_at,activated_at,archived_at";

export async function createCommercialGeneratedArtifactDraftRecord(input: {
  artifact: CommercialGeneratedArtifactDraft;
}): Promise<CreateCommercialGeneratedArtifactResult> {
  const supabase = createServiceClient();
  const content = validateCommercialGeneratedContent(input.artifact.content);
  if (!content.ok) {
    return { status: "failed", errorCode: "invalid_artifact_content" };
  }

  const identityKey = createCommercialGeneratedArtifactIdentityKey(
    input.artifact.identity,
  );

  try {
    const { data, error } = await supabase.rpc(
      "create_commercial_generated_artifact_draft",
      {
        p_identity_key: identityKey,
        p_template_key: input.artifact.identity.templateKey,
        p_template_version: input.artifact.identity.templateVersion,
        p_content_schema_version: input.artifact.contentSchemaVersion,
        p_audience_scope: input.artifact.identity.audienceScope,
        p_locale: input.artifact.identity.locale,
        p_resolution_source: input.artifact.identity.source,
        p_research_taxon_id: input.artifact.identity.researchTaxonId,
        p_identity_json: input.artifact.identity,
        p_research_sources_json: input.artifact.identity.researchSources,
        p_content_json: content.content,
      },
    );

    if (error) {
      logArtifactError("create draft", error);
      return { status: "failed", errorCode: safeErrorCode(error) };
    }

    const row = firstRow<CreateDraftRpcRow>(data);
    if (
      !row?.artifact_id ||
      !Number.isInteger(row.artifact_version) ||
      row.artifact_status !== "draft"
    ) {
      return { status: "failed", errorCode: "invalid_create_draft_result" };
    }

    return {
      status: "created",
      artifactId: row.artifact_id,
      artifactVersion: row.artifact_version,
    };
  } catch (error) {
    logArtifactError("create draft", error);
    return { status: "failed", errorCode: safeErrorCode(error) };
  }
}

export async function activateCommercialGeneratedArtifact(input: {
  artifactId: string;
}): Promise<ActivateCommercialGeneratedArtifactResult> {
  const supabase = createServiceClient();

  try {
    const { data, error } = await supabase.rpc(
      "activate_commercial_generated_artifact",
      { p_artifact_id: input.artifactId },
    );

    if (error) {
      logArtifactError("activate", error);
      return {
        status: "failed",
        artifactId: input.artifactId,
        errorCode: safeErrorCode(error),
      };
    }

    if (data !== true) {
      return {
        status: "not_activatable",
        artifactId: input.artifactId,
      };
    }

    return { status: "activated", artifactId: input.artifactId };
  } catch (error) {
    logArtifactError("activate", error);
    return {
      status: "failed",
      artifactId: input.artifactId,
      errorCode: safeErrorCode(error),
    };
  }
}

export async function getActiveCommercialGeneratedArtifact(input: {
  identity: CommercialGeneratedArtifactIdentity;
}): Promise<CommercialGeneratedArtifactRecord | null> {
  const supabase = createServiceClient();
  const identityKey = createCommercialGeneratedArtifactIdentityKey(
    input.identity,
  );

  try {
    const { data, error } = await supabase
      .from("commercial_generated_artifacts")
      .select(ARTIFACT_SELECT)
      .eq("identity_key", identityKey)
      .eq("status", "active")
      .limit(1)
      .maybeSingle();

    if (error) {
      logArtifactError("get active", error);
      return null;
    }

    return mapArtifactRow(data as ArtifactRow | null);
  } catch (error) {
    logArtifactError("get active", error);
    return null;
  }
}

function mapArtifactRow(
  row: ArtifactRow | null,
): CommercialGeneratedArtifactRecord | null {
  if (
    !row?.id ||
    !row.identity_key ||
    !Number.isInteger(row.artifact_version) ||
    !isArtifactStatus(row.status) ||
    !isArtifactIdentity(row.identity_json) ||
    row.content_schema_version !== "account_dashboard.commercial_page.v1"
  ) {
    return null;
  }

  const content = validateCommercialGeneratedContent(row.content_json);
  if (!content.ok) return null;

  return {
    id: row.id,
    identityKey: row.identity_key,
    artifactVersion: row.artifact_version,
    status: row.status,
    identity: row.identity_json,
    contentSchemaVersion: row.content_schema_version,
    content: content.content,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    activatedAt: row.activated_at,
    archivedAt: row.archived_at,
  };
}

function firstRow<T>(value: unknown): T | null {
  if (Array.isArray(value)) return (value[0] as T | undefined) ?? null;
  if (isRecord(value)) return value as T;
  return null;
}

function isArtifactStatus(value: string): value is CommercialGeneratedArtifactStatus {
  return value === "draft" || value === "active" || value === "archived";
}

function isArtifactIdentity(
  value: unknown,
): value is CommercialGeneratedArtifactIdentity {
  if (!isRecord(value) || !Array.isArray(value.researchSources)) return false;

  return (
    value.templateKey === "account_dashboard.commercial_page" &&
    value.templateVersion === 1 &&
    value.audienceScope === "business_buyer" &&
    typeof value.locale === "string" &&
    isResolutionSource(value.source) &&
    (value.researchTaxonId === null ||
      typeof value.researchTaxonId === "string") &&
    value.researchSources.every(
      (source) =>
        isRecord(source) &&
        typeof source.researchId === "string" &&
        typeof source.taxonId === "string" &&
        isCommercialResearchBlock(source.block) &&
        Number.isInteger(source.version) &&
        typeof source.updatedAt === "string",
    )
  );
}

function isCommercialResearchBlock(
  value: unknown,
): value is CommercialResearchBlock {
  return COMMERCIAL_RESEARCH_BLOCKS.includes(value as CommercialResearchBlock);
}

function isResolutionSource(value: unknown): boolean {
  return (
    value === "resolved_taxon" ||
    value === "parent" ||
    value === "ancestor" ||
    value === "generic"
  );
}

function safeErrorCode(error: unknown): string {
  if (isRecord(error) && typeof error.code === "string" && error.code) {
    return error.code;
  }
  return error instanceof Error ? error.name : "unknown_error";
}

function logArtifactError(operation: string, error: unknown): void {
  console.error(`commercialGeneratedArtifact ${operation} failed:`, {
    code: safeErrorCode(error),
    message:
      isRecord(error) && typeof error.message === "string"
        ? error.message
        : error instanceof Error
          ? error.message
          : String(error),
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
