import "server-only";

import { createServiceClient } from "@/lib/supabase/service";
import {
  COMMERCIAL_ACTIVATION_AUDIENCE_SCOPE,
  type ContentArtifactStatus,
  type ContentComposition,
} from "@/conversion-content/contracts";
import { resolveCommercialActivationCompositionForTaxon } from "@/conversion-content/commercial-activation/composition";
import { resolveCommercialActivationRenderModel } from "@/conversion-content/commercial-activation/resolve";
import { isRecord } from "@/conversion-content/validation";

const RESEARCH_VERSION = 1;
const REQUIRED_RESEARCH_BLOCKS = [
  "strategic_core",
  "lp_overview",
  "lp_sections",
  "seo",
] as const;
const REQUIRED_AUDIENCES = ["business_buyer", "end_customer"] as const;

type RequiredAudience = (typeof REQUIRED_AUDIENCES)[number];
type RequiredResearchBlock = (typeof REQUIRED_RESEARCH_BLOCKS)[number];

type AdminCommercialActivationTaxon = {
  id: string;
  name: string;
  slug: string;
};

type AdminCommercialActivationResearchSummary = {
  businessBuyerBlocks: number;
  businessBuyerItems: number;
  endCustomerBlocks: number;
  endCustomerItems: number;
};

export type AdminCommercialActivationListItem = {
  taxon: AdminCommercialActivationTaxon;
  state: "published" | "review" | "eligible";
  stateLabel: "Publicado" | "Em revisao" | "Elegivel para gerar";
  research: AdminCommercialActivationResearchSummary;
  hasActiveComposition: boolean;
  latestDraftVersion: number | null;
  publishedVersion: number | null;
};

export type AdminCommercialActivationArtifact = {
  id: string;
  templateId: string;
  compositionId: string;
  taxonId: string;
  audienceScope: string;
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

export type AdminCommercialActivationOverview =
  | {
      ok: true;
      items: AdminCommercialActivationListItem[];
      selected: AdminCommercialActivationState | null;
    }
  | {
      ok: false;
      reason: "template_not_found" | "eligible_taxons_read_failed";
    };

export type AdminCommercialActivationState =
  | {
      ok: true;
      taxon: AdminCommercialActivationTaxon;
      composition: ContentComposition | null;
      latestDraft: AdminCommercialActivationArtifact | null;
      publishableDraft: AdminCommercialActivationArtifact | null;
      published: AdminCommercialActivationArtifact | null;
      artifacts: AdminCommercialActivationArtifact[];
    }
  | {
      ok: false;
      reason:
        | "taxon_not_found"
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
  | {
      ok: false;
      reason:
        | "artifact_not_found"
        | "artifact_not_draft"
        | "artifact_not_current_review"
        | "artifact_bundle_mismatch"
        | "artifact_content_invalid"
        | "read_failed";
    };

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

export async function readAdminCommercialActivationOverview(input: {
  selectedTaxonSlug?: string;
} = {}): Promise<AdminCommercialActivationOverview> {
  try {
    const templateId = await readCommercialActivationPageTemplateId();
    if (!templateId) return { ok: false, reason: "template_not_found" };

    const items = await readEligibleCommercialActivationTaxons({ templateId });
    const selectedSlug = input.selectedTaxonSlug?.trim();
    const selectedItem = selectedSlug
      ? items.find((item) => item.taxon.slug === selectedSlug)
      : null;
    const selected = selectedItem
      ? await readAdminCommercialActivationState({
          taxonId: selectedItem.taxon.id,
          templateId,
        })
      : null;

    return { ok: true, items, selected };
  } catch (error) {
    console.error("readAdminCommercialActivationOverview failed", {
      message: error instanceof Error ? error.message : String(error),
    });
    return { ok: false, reason: "eligible_taxons_read_failed" };
  }
}

export async function readAdminCommercialActivationState(input: {
  taxonSlug?: string;
  taxonId?: string;
  templateId?: string;
} = {}): Promise<AdminCommercialActivationState> {
  const supabase = createServiceClient();

  try {
    const templateId =
      input.templateId ?? (await readCommercialActivationPageTemplateId());
    if (!templateId) return { ok: false, reason: "artifacts_read_failed" };

    let query = supabase
      .from("business_taxons")
      .select("id,name,slug")
      .eq("is_active", true)
      .limit(1);

    if (input.taxonId) {
      query = query.eq("id", input.taxonId.trim());
    } else if (input.taxonSlug) {
      query = query.eq("slug", input.taxonSlug.trim());
    } else {
      return { ok: false, reason: "taxon_not_found" };
    }

    const { data: taxonRow, error: taxonError } = await query.maybeSingle();

    if (taxonError) throw taxonError;
    if (!isRecord(taxonRow) || !isString(taxonRow.id)) {
      return { ok: false, reason: "taxon_not_found" };
    }

    const compositionResult = await resolveCommercialActivationCompositionForTaxon({
      taxonId: taxonRow.id,
    });
    if (compositionResult.status === "composition_invalid") {
      return { ok: false, reason: "composition_invalid" };
    }

    const artifacts = await readCommercialActivationArtifacts({
      templateId,
      taxonId: taxonRow.id,
    });

    const latestDraft =
      artifacts.find((artifact) => artifact.status === "draft") ?? null;
    const published =
      artifacts.find((artifact) => artifact.status === "published") ?? null;
    const publishableDraft = getPublishableDraft({ artifacts, published });

    return {
      ok: true,
      taxon: {
        id: taxonRow.id,
        name: isString(taxonRow.name) ? taxonRow.name : "",
        slug: isString(taxonRow.slug) ? taxonRow.slug : "",
      },
      composition:
        compositionResult.status === "ready"
          ? compositionResult.composition
          : null,
      latestDraft,
      publishableDraft,
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
      .select("id,taxon_id,status")
      .eq("id", artifactId)
      .maybeSingle();

    if (targetError) throw targetError;
    if (!isRecord(targetRow) || !isString(targetRow.taxon_id)) {
      return { ok: false, reason: "artifact_not_found" };
    }

    const state = await readAdminCommercialActivationState({
      taxonId: targetRow.taxon_id,
    });
    if (!state.ok || !state.composition) {
      return { ok: false, reason: "read_failed" };
    }

    if (!state.publishableDraft || state.publishableDraft.id !== artifactId) {
      const requested = state.artifacts.find(
        (artifact) => artifact.id === artifactId,
      );
      if (!requested) return { ok: false, reason: "artifact_not_found" };
      if (requested.status !== "draft") {
        return { ok: false, reason: "artifact_not_draft" };
      }
      return { ok: false, reason: "artifact_not_current_review" };
    }

    const target = state.publishableDraft;
    const contentValidation = resolveCommercialActivationRenderModel({
      composition: state.composition,
      contentJson: target.contentJson,
    });

    if (contentValidation.status !== "ready") {
      return { ok: false, reason: "artifact_content_invalid" };
    }

    if (
      target.status !== "draft" ||
      target.sourceCount !== 4 ||
      target.templateId !== state.composition.template.id ||
      target.compositionId !== state.composition.id ||
      target.taxonId !== state.taxon.id ||
      target.audienceScope !== COMMERCIAL_ACTIVATION_AUDIENCE_SCOPE
    ) {
      return { ok: false, reason: "artifact_bundle_mismatch" };
    }

    return {
      ok: true,
      target: {
        id: target.id,
        templateId: target.templateId,
        taxonId: target.taxonId,
        audienceScope: target.audienceScope,
        status: target.status,
      },
      previousPublishedId: state.published?.id ?? null,
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

async function readCommercialActivationPageTemplateId() {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("content_templates")
    .select("id")
    .eq("template_key", "commercial_activation_page")
    .eq("template_family", "commercial_activation")
    .eq("template_scope", "page")
    .eq("version", 1)
    .eq("status", "active")
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return isRecord(data) && isString(data.id) ? data.id : null;
}

async function readEligibleCommercialActivationTaxons(input: {
  templateId: string;
}): Promise<AdminCommercialActivationListItem[]> {
  const supabase = createServiceClient();
  const { data: taxonRows, error: taxonError } = await supabase
    .from("business_taxons")
    .select("id,name,slug")
    .eq("is_active", true)
    .order("name", { ascending: true })
    .order("slug", { ascending: true })
    .limit(500);

  if (taxonError) throw taxonError;

  const taxons = (taxonRows ?? [])
    .map(mapTaxon)
    .filter((taxon): taxon is AdminCommercialActivationTaxon => taxon !== null);
  if (taxons.length === 0) return [];

  const taxonIds = taxons.map((taxon) => taxon.id);
  const research = await readResearchEligibility(taxonIds);
  const compositionTaxonIds = await readActiveCompositionTaxonIds({
    templateId: input.templateId,
    taxonIds,
  });
  const artifactsByTaxon = await readArtifactSummaries({
    templateId: input.templateId,
    taxonIds,
  });

  return taxons
    .map((taxon) => {
      const researchSummary = research.get(taxon.id);
      if (!researchSummary) return null;

      const artifactSummary = artifactsByTaxon.get(taxon.id) ?? {
        latestDraftVersion: null,
        publishedVersion: null,
      };
      const state = resolveListState(artifactSummary);

      return {
        taxon,
        state,
        stateLabel:
          state === "published"
            ? "Publicado"
            : state === "review"
              ? "Em revisao"
              : "Elegivel para gerar",
        research: researchSummary,
        hasActiveComposition: compositionTaxonIds.has(taxon.id),
        latestDraftVersion: artifactSummary.latestDraftVersion,
        publishedVersion: artifactSummary.publishedVersion,
      };
    })
    .filter((item): item is AdminCommercialActivationListItem => item !== null);
}

async function readResearchEligibility(taxonIds: string[]) {
  const supabase = createServiceClient();
  const { data: researchRows, error: researchError } = await supabase
    .from("taxon_market_research")
    .select("id,taxon_id,audience_scope,research_block")
    .in("taxon_id", taxonIds)
    .eq("version", RESEARCH_VERSION)
    .eq("status", "active")
    .in("audience_scope", [...REQUIRED_AUDIENCES])
    .in("research_block", [...REQUIRED_RESEARCH_BLOCKS])
    .order("taxon_id", { ascending: true })
    .order("audience_scope", { ascending: true })
    .order("research_block", { ascending: true });

  if (researchError) throw researchError;

  const researchIds = (researchRows ?? [])
    .map((row) => (isRecord(row) && isString(row.id) ? row.id : null))
    .filter((id): id is string => Boolean(id));
  const itemCounts = new Map<string, number>();

  if (researchIds.length > 0) {
    const { data: itemRows, error: itemError } = await supabase
      .from("taxon_market_research_items")
      .select("research_id")
      .in("research_id", researchIds)
      .eq("is_active", true)
      .order("research_id", { ascending: true });

    if (itemError) throw itemError;

    for (const row of itemRows ?? []) {
      if (!isRecord(row) || !isString(row.research_id)) continue;
      itemCounts.set(row.research_id, (itemCounts.get(row.research_id) ?? 0) + 1);
    }
  }

  const coverage = new Map<
    string,
    Map<RequiredAudience, Map<RequiredResearchBlock, number>>
  >();

  for (const row of researchRows ?? []) {
    if (!isRecord(row)) continue;
    if (
      !isString(row.id) ||
      !isString(row.taxon_id) ||
      !isRequiredAudience(row.audience_scope) ||
      !isRequiredResearchBlock(row.research_block)
    ) {
      continue;
    }

    const taxonCoverage = coverage.get(row.taxon_id) ?? new Map();
    const audienceCoverage =
      taxonCoverage.get(row.audience_scope) ?? new Map();
    audienceCoverage.set(row.research_block, itemCounts.get(row.id) ?? 0);
    taxonCoverage.set(row.audience_scope, audienceCoverage);
    coverage.set(row.taxon_id, taxonCoverage);
  }

  const eligible = new Map<string, AdminCommercialActivationResearchSummary>();
  for (const [taxonId, taxonCoverage] of coverage.entries()) {
    const businessBuyer = taxonCoverage.get("business_buyer") ?? new Map();
    const endCustomer = taxonCoverage.get("end_customer") ?? new Map();
    const businessBuyerReady = [...REQUIRED_RESEARCH_BLOCKS].every(
      (block) => (businessBuyer.get(block) ?? 0) > 0,
    );
    const endCustomerReady = [...REQUIRED_RESEARCH_BLOCKS].every(
      (block) => (endCustomer.get(block) ?? 0) > 0,
    );

    if (!businessBuyerReady || !endCustomerReady) continue;

    eligible.set(taxonId, {
      businessBuyerBlocks: businessBuyer.size,
      businessBuyerItems: sumCounts(businessBuyer),
      endCustomerBlocks: endCustomer.size,
      endCustomerItems: sumCounts(endCustomer),
    });
  }

  return eligible;
}

async function readActiveCompositionTaxonIds(input: {
  templateId: string;
  taxonIds: string[];
}) {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("content_template_compositions")
    .select("taxon_id")
    .eq("template_id", input.templateId)
    .in("taxon_id", input.taxonIds)
    .eq("status", "active")
    .order("taxon_id", { ascending: true });

  if (error) throw error;

  return new Set(
    (data ?? [])
      .map((row) => (isRecord(row) && isString(row.taxon_id) ? row.taxon_id : null))
      .filter((taxonId): taxonId is string => Boolean(taxonId)),
  );
}

async function readArtifactSummaries(input: {
  templateId: string;
  taxonIds: string[];
}) {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("content_artifacts")
    .select("taxon_id,status,artifact_version")
    .eq("template_id", input.templateId)
    .in("taxon_id", input.taxonIds)
    .eq("audience_scope", COMMERCIAL_ACTIVATION_AUDIENCE_SCOPE)
    .order("taxon_id", { ascending: true })
    .order("artifact_version", { ascending: false });

  if (error) throw error;

  const summaries = new Map<
    string,
    { latestDraftVersion: number | null; publishedVersion: number | null }
  >();

  for (const row of data ?? []) {
    if (!isRecord(row) || !isString(row.taxon_id)) continue;
    const current = summaries.get(row.taxon_id) ?? {
      latestDraftVersion: null,
      publishedVersion: null,
    };

    if (row.status === "draft" && isPositiveInteger(row.artifact_version)) {
      current.latestDraftVersion = Math.max(
        current.latestDraftVersion ?? 0,
        row.artifact_version,
      );
    }

    if (row.status === "published" && isPositiveInteger(row.artifact_version)) {
      current.publishedVersion = Math.max(
        current.publishedVersion ?? 0,
        row.artifact_version,
      );
    }

    summaries.set(row.taxon_id, current);
  }

  return summaries;
}

async function readCommercialActivationArtifacts(input: {
  templateId: string;
  taxonId: string;
}): Promise<AdminCommercialActivationArtifact[]> {
  const supabase = createServiceClient();

  const { data: artifactRows, error: artifactsError } = await supabase
    .from("content_artifacts")
    .select(
      "id,template_id,composition_id,taxon_id,audience_scope,template_version,composition_version,research_version,artifact_version,status,content_json,provenance_json,created_at,updated_at,published_at,archived_at",
    )
    .eq("template_id", input.templateId)
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
      .in("artifact_id", artifactIds)
      .order("artifact_id", { ascending: true });

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

function resolveListState(input: {
  latestDraftVersion: number | null;
  publishedVersion: number | null;
}): AdminCommercialActivationListItem["state"] {
  if (
    input.latestDraftVersion &&
    (!input.publishedVersion || input.latestDraftVersion > input.publishedVersion)
  ) {
    return "review";
  }

  if (input.publishedVersion) return "published";
  return "eligible";
}

function getPublishableDraft(input: {
  artifacts: AdminCommercialActivationArtifact[];
  published: AdminCommercialActivationArtifact | null;
}) {
  const latestDraft =
    input.artifacts.find((artifact) => artifact.status === "draft") ?? null;

  if (!latestDraft) return null;
  if (
    input.published &&
    input.published.artifactVersion >= latestDraft.artifactVersion
  ) {
    return null;
  }

  return latestDraft;
}

function mapAdminArtifact(
  value: unknown,
  sourceCounts: Map<string, number>,
): AdminCommercialActivationArtifact | null {
  if (!isRecord(value)) return null;
  if (
    !isString(value.id) ||
    !isString(value.template_id) ||
    !isString(value.composition_id) ||
    !isString(value.taxon_id) ||
    !isString(value.audience_scope) ||
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
    templateId: value.template_id,
    compositionId: value.composition_id,
    taxonId: value.taxon_id,
    audienceScope: value.audience_scope,
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

function mapTaxon(value: unknown): AdminCommercialActivationTaxon | null {
  if (!isRecord(value)) return null;
  if (!isString(value.id) || !isString(value.name) || !isString(value.slug)) {
    return null;
  }
  return {
    id: value.id,
    name: value.name,
    slug: value.slug,
  };
}

function isArtifactStatus(value: unknown): value is ContentArtifactStatus {
  return value === "draft" || value === "published" || value === "archived";
}

function isRequiredAudience(value: unknown): value is RequiredAudience {
  return value === "business_buyer" || value === "end_customer";
}

function isRequiredResearchBlock(value: unknown): value is RequiredResearchBlock {
  return REQUIRED_RESEARCH_BLOCKS.includes(value as RequiredResearchBlock);
}

function isString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isPositiveInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value > 0;
}

function sumCounts(value: Map<RequiredResearchBlock, number>) {
  return [...value.values()].reduce((sum, count) => sum + count, 0);
}
