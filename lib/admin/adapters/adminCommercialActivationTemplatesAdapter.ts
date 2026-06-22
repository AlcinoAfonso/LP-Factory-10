import "server-only";

import { createServiceClient } from "@/lib/supabase/service";
import {
  COMMERCIAL_ACTIVATION_AUDIENCE_SCOPE,
  COMMERCIAL_ACTIVATION_TEMPLATE_FAMILY,
  type ContentArtifactStatus,
  type ContentComposition,
} from "@/conversion-content/contracts";
import {
  mapContentComposition,
  isRecord,
} from "@/conversion-content/validation";
import { COMMERCIAL_ACTIVATION_PILOT_TAXON_SLUG } from "@/conversion-content/commercial-activation/draft-generation";

const TEMPLATE_COLUMNS =
  "id,template_key,name,slug,template_family,template_scope,status,version,is_active,payload_json";

export type AdminCommercialActivationArtifact = {
  id: string;
  status: ContentArtifactStatus;
  artifactVersion: number;
  templateVersion: number;
  compositionVersion: number;
  researchVersion: number;
  contentJson: Record<string, unknown>;
  provenanceJson: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
  archivedAt: string | null;
  sourceCount: number;
};

export type AdminCommercialActivationState =
  | {
      ok: true;
      taxon: {
        id: string;
        name: string;
        slug: string;
      };
      composition: ContentComposition;
      latestDraft: AdminCommercialActivationArtifact | null;
      published: AdminCommercialActivationArtifact | null;
      artifacts: AdminCommercialActivationArtifact[];
    }
  | {
      ok: false;
      reason:
        | "taxon_not_found"
        | "composition_not_found"
        | "composition_invalid"
        | "artifacts_read_failed";
    };

export type PublishContext =
  | {
      ok: true;
      target: {
        id: string;
        templateId: string;
        taxonId: string;
        audienceScope: string;
        status: ContentArtifactStatus;
      };
      previousPublishedId: string | null;
    }
  | { ok: false; reason: "artifact_not_found" | "artifact_not_draft" | "read_failed" };

export type PublishValidation =
  | {
      ok: true;
      publishedCount: number;
      targetPublished: boolean;
      previousArchived: boolean | null;
    }
  | {
      ok: false;
      reason:
        | "target_not_published"
        | "multiple_published"
        | "previous_not_archived"
        | "validation_read_failed";
      publishedCount?: number;
    };

export async function readAdminCommercialActivationState(
  taxonSlug = COMMERCIAL_ACTIVATION_PILOT_TAXON_SLUG,
): Promise<AdminCommercialActivationState> {
  const supabase = createServiceClient();

  try {
    const { data: taxonRow, error: taxonError } = await supabase
      .from("business_taxons")
      .select("id,name,slug")
      .eq("slug", taxonSlug)
      .eq("is_active", true)
      .maybeSingle();

    if (taxonError) throw taxonError;
    if (!isRecord(taxonRow) || !isString(taxonRow.id)) {
      return { ok: false, reason: "taxon_not_found" };
    }

    const composition = await readCommercialActivationComposition({
      taxonId: taxonRow.id,
    });

    if (composition.status !== "ready") {
      return { ok: false, reason: composition.status };
    }

    const artifacts = await readCommercialActivationArtifacts({
      templateId: composition.composition.template.id,
      compositionId: composition.composition.id,
      taxonId: taxonRow.id,
    });

    const latestDraft =
      artifacts.find((artifact) => artifact.status === "draft") ?? null;
    const published =
      artifacts.find((artifact) => artifact.status === "published") ?? null;

    return {
      ok: true,
      taxon: {
        id: taxonRow.id,
        name: isString(taxonRow.name) ? taxonRow.name : taxonSlug,
        slug: isString(taxonRow.slug) ? taxonRow.slug : taxonSlug,
      },
      composition: composition.composition,
      latestDraft,
      published,
      artifacts,
    };
  } catch (error) {
    console.error("readAdminCommercialActivationState failed", {
      message: error instanceof Error ? error.message : String(error),
    });
    return { ok: false, reason: "artifacts_read_failed" };
  }
}

export async function readPublishContext(
  artifactId: string,
): Promise<PublishContext> {
  const supabase = createServiceClient();

  try {
    const { data: targetRow, error: targetError } = await supabase
      .from("content_artifacts")
      .select("id,template_id,taxon_id,audience_scope,status")
      .eq("id", artifactId)
      .maybeSingle();

    if (targetError) throw targetError;
    if (!isRecord(targetRow) || !isString(targetRow.id)) {
      return { ok: false, reason: "artifact_not_found" };
    }

    const target = {
      id: targetRow.id,
      templateId: isString(targetRow.template_id) ? targetRow.template_id : "",
      taxonId: isString(targetRow.taxon_id) ? targetRow.taxon_id : "",
      audienceScope: isString(targetRow.audience_scope)
        ? targetRow.audience_scope
        : "",
      status: targetRow.status as ContentArtifactStatus,
    };

    if (
      target.status !== "draft" ||
      !target.templateId ||
      !target.taxonId ||
      target.audienceScope !== COMMERCIAL_ACTIVATION_AUDIENCE_SCOPE
    ) {
      return { ok: false, reason: "artifact_not_draft" };
    }

    const { data: previousRow, error: previousError } = await supabase
      .from("content_artifacts")
      .select("id")
      .eq("template_id", target.templateId)
      .eq("taxon_id", target.taxonId)
      .eq("audience_scope", target.audienceScope)
      .eq("status", "published")
      .neq("id", target.id)
      .maybeSingle();

    if (previousError) throw previousError;

    return {
      ok: true,
      target,
      previousPublishedId:
        isRecord(previousRow) && isString(previousRow.id) ? previousRow.id : null,
    };
  } catch (error) {
    console.error("readPublishContext failed", {
      artifactId,
      message: error instanceof Error ? error.message : String(error),
    });
    return { ok: false, reason: "read_failed" };
  }
}

export async function validatePublicationResult(input: {
  targetArtifactId: string;
  previousPublishedId: string | null;
}): Promise<PublishValidation> {
  const supabase = createServiceClient();

  try {
    const { data: targetRow, error: targetError } = await supabase
      .from("content_artifacts")
      .select("id,template_id,taxon_id,audience_scope,status")
      .eq("id", input.targetArtifactId)
      .maybeSingle();

    if (targetError) throw targetError;

    if (!isRecord(targetRow) || targetRow.status !== "published") {
      return { ok: false, reason: "target_not_published" };
    }

    const { data: publishedRows, error: publishedError } = await supabase
      .from("content_artifacts")
      .select("id")
      .eq("template_id", targetRow.template_id as string)
      .eq("taxon_id", targetRow.taxon_id as string)
      .eq("audience_scope", targetRow.audience_scope as string)
      .eq("status", "published");

    if (publishedError) throw publishedError;

    const publishedCount = Array.isArray(publishedRows)
      ? publishedRows.length
      : 0;

    if (publishedCount > 1) {
      return { ok: false, reason: "multiple_published", publishedCount };
    }

    if (input.previousPublishedId) {
      const { data: previousRow, error: previousError } = await supabase
        .from("content_artifacts")
        .select("id,status,archived_at")
        .eq("id", input.previousPublishedId)
        .maybeSingle();

      if (previousError) throw previousError;

      if (
        !isRecord(previousRow) ||
        previousRow.status !== "archived" ||
        !isString(previousRow.archived_at)
      ) {
        return { ok: false, reason: "previous_not_archived", publishedCount };
      }
    }

    return {
      ok: true,
      publishedCount,
      targetPublished: true,
      previousArchived: input.previousPublishedId ? true : null,
    };
  } catch (error) {
    console.error("validatePublicationResult failed", {
      targetArtifactId: input.targetArtifactId,
      message: error instanceof Error ? error.message : String(error),
    });
    return { ok: false, reason: "validation_read_failed" };
  }
}

async function readCommercialActivationComposition(input: {
  taxonId: string;
}): Promise<
  | { status: "ready"; composition: ContentComposition }
  | { status: "composition_not_found" | "composition_invalid" }
> {
  const supabase = createServiceClient();
  const { data: templateLinkRow, error: templateLinkError } = await supabase
    .from("content_template_taxons")
    .select(
      `id,template_id,taxon_id,is_primary,priority,created_at,template:content_templates!content_template_taxons_template_id_fkey!inner(${TEMPLATE_COLUMNS})`,
    )
    .eq("taxon_id", input.taxonId)
    .eq("is_active", true)
    .eq("template.template_family", COMMERCIAL_ACTIVATION_TEMPLATE_FAMILY)
    .eq("template.template_scope", "page")
    .eq("template.status", "active")
    .eq("template.is_active", true)
    .order("is_primary", { ascending: false })
    .order("priority", { ascending: false })
    .order("created_at", { ascending: true })
    .order("id", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (templateLinkError) throw templateLinkError;
  if (!isRecord(templateLinkRow) || !isString(templateLinkRow.template_id)) {
    return { status: "composition_not_found" };
  }

  const { data: compositionRow, error: compositionError } = await supabase
    .from("content_template_compositions")
    .select("id,template_id,taxon_id,version,status")
    .eq("template_id", templateLinkRow.template_id)
    .eq("taxon_id", input.taxonId)
    .eq("status", "active")
    .maybeSingle();

  if (compositionError) throw compositionError;
  if (!compositionRow) return { status: "composition_not_found" };

  const { data: itemRows, error: itemsError } = await supabase
    .from("content_template_composition_items")
    .select(
      `id,composition_id,module_template_id,variant_key,sort_order,is_required,config_json,module:content_templates!content_template_composition_items_module_template_id_fkey!inner(${TEMPLATE_COLUMNS})`,
    )
    .eq("composition_id", (compositionRow as Record<string, unknown>).id as string)
    .eq("module.template_family", COMMERCIAL_ACTIVATION_TEMPLATE_FAMILY)
    .eq("module.template_scope", "section")
    .eq("module.status", "active")
    .eq("module.is_active", true)
    .order("sort_order", { ascending: true });

  if (itemsError) throw itemsError;

  const composition = mapContentComposition({
    composition: compositionRow,
    template: templateLinkRow.template,
    items: (itemRows ?? []) as unknown[],
  });

  return composition
    ? { status: "ready", composition }
    : { status: "composition_invalid" };
}

async function readCommercialActivationArtifacts(input: {
  templateId: string;
  compositionId: string;
  taxonId: string;
}): Promise<AdminCommercialActivationArtifact[]> {
  const supabase = createServiceClient();

  const { data: artifactRows, error: artifactsError } = await supabase
    .from("content_artifacts")
    .select(
      "id,template_version,composition_version,research_version,artifact_version,status,content_json,provenance_json,created_at,updated_at,published_at,archived_at",
    )
    .eq("template_id", input.templateId)
    .eq("composition_id", input.compositionId)
    .eq("taxon_id", input.taxonId)
    .eq("audience_scope", COMMERCIAL_ACTIVATION_AUDIENCE_SCOPE)
    .order("artifact_version", { ascending: false })
    .limit(20);

  if (artifactsError) throw artifactsError;

  const rows = Array.isArray(artifactRows) ? artifactRows : [];
  const artifactIds = rows
    .map((row) => (isRecord(row) && isString(row.id) ? row.id : null))
    .filter((id): id is string => Boolean(id));

  const sourceCounts = new Map<string, number>();
  if (artifactIds.length > 0) {
    const { data: sourceRows, error: sourcesError } = await supabase
      .from("content_artifact_research_sources")
      .select("artifact_id")
      .in("artifact_id", artifactIds);

    if (sourcesError) throw sourcesError;

    for (const sourceRow of sourceRows ?? []) {
      if (!isRecord(sourceRow) || !isString(sourceRow.artifact_id)) continue;
      sourceCounts.set(
        sourceRow.artifact_id,
        (sourceCounts.get(sourceRow.artifact_id) ?? 0) + 1,
      );
    }
  }

  return rows
    .map((row) => mapAdminArtifact(row, sourceCounts))
    .filter((artifact): artifact is AdminCommercialActivationArtifact =>
      Boolean(artifact),
    );
}

function mapAdminArtifact(
  value: unknown,
  sourceCounts: Map<string, number>,
): AdminCommercialActivationArtifact | null {
  if (!isRecord(value)) return null;
  if (
    !isString(value.id) ||
    !isPositiveInteger(value.template_version) ||
    !isPositiveInteger(value.composition_version) ||
    !isPositiveInteger(value.research_version) ||
    !isPositiveInteger(value.artifact_version) ||
    !isArtifactStatus(value.status) ||
    !isRecord(value.content_json) ||
    !isRecord(value.provenance_json) ||
    !isString(value.created_at) ||
    !isString(value.updated_at)
  ) {
    return null;
  }

  return {
    id: value.id,
    status: value.status,
    artifactVersion: value.artifact_version,
    templateVersion: value.template_version,
    compositionVersion: value.composition_version,
    researchVersion: value.research_version,
    contentJson: value.content_json,
    provenanceJson: value.provenance_json,
    createdAt: value.created_at,
    updatedAt: value.updated_at,
    publishedAt: isString(value.published_at) ? value.published_at : null,
    archivedAt: isString(value.archived_at) ? value.archived_at : null,
    sourceCount: sourceCounts.get(value.id) ?? 0,
  };
}

function isArtifactStatus(value: unknown): value is ContentArtifactStatus {
  return value === "draft" || value === "published" || value === "archived";
}

function isString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isPositiveInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value > 0;
}
