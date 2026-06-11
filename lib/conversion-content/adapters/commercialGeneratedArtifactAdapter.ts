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
  CommercialGeneratedArtifactProvenance,
  CommercialGeneratedArtifactRecord,
  CommercialGeneratedArtifactStatus,
  CreateCommercialGeneratedArtifactResult,
} from "../contracts";
import {
  createCommercialGeneratedArtifactInputFingerprint,
  createCommercialGeneratedArtifactScopeKey,
  validateCommercialGeneratedContent,
} from "../generatedCommercialContent";

type ArtifactRow = {
  id: string;
  scope_key: string;
  input_fingerprint: string;
  artifact_version: number;
  status: string;
  provenance_json: unknown;
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
  "id,scope_key,input_fingerprint,artifact_version,status,provenance_json,content_schema_version,content_json,created_at,updated_at,activated_at,archived_at";

export async function createCommercialGeneratedArtifactDraftRecord(input: {
  artifact: CommercialGeneratedArtifactDraft;
}): Promise<CreateCommercialGeneratedArtifactResult> {
  const supabase = createServiceClient();
  const content = validateCommercialGeneratedContent(input.artifact.content);
  if (!content.ok) {
    return { status: "failed", errorCode: "invalid_artifact_content" };
  }

  const scopeKey = createCommercialGeneratedArtifactScopeKey(
    input.artifact.identity,
  );
  const inputFingerprint = createCommercialGeneratedArtifactInputFingerprint({
    identity: input.artifact.identity,
    contentSchemaVersion: input.artifact.contentSchemaVersion,
  });

  try {
    const { data, error } = await supabase.rpc(
      "create_generated_content_artifact_draft",
      {
        p_scope_key: scopeKey,
        p_input_fingerprint: inputFingerprint,
        p_template_key: input.artifact.identity.templateKey,
        p_template_version: input.artifact.identity.templateVersion,
        p_content_schema_version: input.artifact.contentSchemaVersion,
        p_audience_scope: input.artifact.identity.audienceScope,
        p_locale: input.artifact.identity.locale,
        p_scope_type:
          input.artifact.identity.source === "generic" ? "generic" : "taxon",
        p_research_taxon_id: input.artifact.identity.researchTaxonId,
        p_provenance_json: {
          identity: input.artifact.identity,
          contentSchemaVersion: input.artifact.contentSchemaVersion,
        },
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
      "activate_generated_content_artifact",
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
  contentSchemaVersion: CommercialGeneratedArtifactDraft["contentSchemaVersion"];
}): Promise<CommercialGeneratedArtifactRecord | null> {
  const supabase = createServiceClient();
  const scopeKey = createCommercialGeneratedArtifactScopeKey(
    input.identity,
  );
  const inputFingerprint = createCommercialGeneratedArtifactInputFingerprint({
    identity: input.identity,
    contentSchemaVersion: input.contentSchemaVersion,
  });

  try {
    const { data, error } = await supabase
      .from("generated_content_artifacts")
      .select(ARTIFACT_SELECT)
      .eq("scope_key", scopeKey)
      .eq("input_fingerprint", inputFingerprint)
      .eq("status", "active")
      .limit(1)
      .maybeSingle();

    if (error) {
      logArtifactError("get active", error);
      return null;
    }

    const artifact = mapArtifactRow(data as ArtifactRow | null);
    return artifact?.inputFingerprint === inputFingerprint ? artifact : null;
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
    !isSha256(row.scope_key) ||
    !isSha256(row.input_fingerprint) ||
    !Number.isInteger(row.artifact_version) ||
    !isArtifactStatus(row.status) ||
    !isArtifactProvenance(row.provenance_json) ||
    row.content_schema_version !== row.provenance_json.contentSchemaVersion
  ) {
    return null;
  }

  const content = validateCommercialGeneratedContent(row.content_json);
  if (!content.ok) return null;

  return {
    id: row.id,
    scopeKey: row.scope_key,
    inputFingerprint: row.input_fingerprint,
    artifactVersion: row.artifact_version,
    status: row.status,
    identity: row.provenance_json.identity,
    contentSchemaVersion: row.content_schema_version,
    content: content.content,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    activatedAt: row.activated_at,
    archivedAt: row.archived_at,
  };
}

function isSha256(value: string): boolean {
  return /^[a-f0-9]{64}$/.test(value);
}

function firstRow<T>(value: unknown): T | null {
  if (Array.isArray(value)) return (value[0] as T | undefined) ?? null;
  if (isRecord(value)) return value as T;
  return null;
}

function isArtifactStatus(value: string): value is CommercialGeneratedArtifactStatus {
  return value === "draft" || value === "active" || value === "archived";
}

function isArtifactProvenance(
  value: unknown,
): value is CommercialGeneratedArtifactProvenance {
  return (
    isRecord(value) &&
    value.contentSchemaVersion === "account_dashboard.commercial_page.v1" &&
    isArtifactIdentity(value.identity)
  );
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
