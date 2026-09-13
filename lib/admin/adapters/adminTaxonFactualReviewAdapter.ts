import "server-only";

import {
  CURRENT_LANDING_PAGE_INPUT_CATALOG_VERSION,
  resolveLandingPageInputCatalog,
  type LandingPageInputCatalogTaxonIdentity,
} from "@/conversion-content/landing-page/input-catalog";
import {
  FACTUAL_REVIEW_HUMAN_ADDED_ORIGIN,
  isInputCatalogReviewEnabled,
  normalizeFactualReviewCatalogChangeDecision,
  parseInputCatalogEvaluationOutput,
  resolveInheritedInputCatalogCoverage,
  type FactualReviewHumanDecision,
  type FactualReviewPersistedDecision,
  type FactualReviewSession,
  type InheritedInputCatalogCoverage,
  type InputCatalogEvaluationMode,
  type InputCatalogEvaluationOutput,
} from "@/conversion-content/landing-page/taxon-preparation";
import { createServiceClient } from "@/lib/supabase/service";
import { collectCompletePaginatedRows } from "./adminInputCatalogLifecyclePagination";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type AdminTaxonFactualReviewSummary = Readonly<{
  id: string;
  taxonId: string;
  kind: FactualReviewSession["kind"];
  status: FactualReviewSession["status"];
  outcome: "no_change" | "catalog_change" | "invalidated" | null;
  revision: number;
  contextFingerprint: string;
}>;

export type AdminTaxonFactualReviewListResult =
  | Readonly<{ ok: true; reviews: readonly AdminTaxonFactualReviewSummary[] }>
  | Readonly<{ ok: false; message: string }>;

export type AdminTaxonFactualReviewReadResult =
  | Readonly<{ ok: true; review: AdminTaxonFactualReviewSummary | null }>
  | Readonly<{ ok: false; message: string }>;

export type AdminTaxonFactualEvaluationEvidence = Readonly<{
  review: FactualReviewSession;
  output: InputCatalogEvaluationOutput;
  inputCatalogVersion: number;
  source: "published" | "draft";
  draftRevision: number | null;
  evaluationContextFingerprint: string;
}>;

type ReviewMutationResult =
  | Readonly<{ ok: true; review: FactualReviewSession; coverage: InheritedInputCatalogCoverage }>
  | Readonly<{ ok: false; message: string }>;

export async function loadOpenAdminTaxonFactualReview(taxonId: string) {
  if (!isInputCatalogReviewEnabled()) return failure("A revisão factual E20.6 está desabilitada.");
  if (!UUID_PATTERN.test(taxonId)) return failure("O taxon da revisão factual é inválido.");
  const client = createServiceClient();
  const { data, error } = await (client as any)
    .from("business_taxon_factual_reviews")
    .select(REVIEW_SELECT)
    .eq("taxon_id", taxonId)
    .eq("status", "open")
    .limit(1)
    .maybeSingle();
  const review = normalizeStoredReviewRow(data);
  if (error || !review) {
    return failure("Abra uma revisão factual para este taxon antes de solicitar a avaliação.");
  }
  return { ok: true as const, review };
}

export async function listLatestAdminTaxonFactualReviews(
  taxonIds: readonly string[],
): Promise<AdminTaxonFactualReviewListResult> {
  if (!isInputCatalogReviewEnabled()) return { ok: true, reviews: [] };
  const ids = [...new Set(taxonIds.filter((id) => UUID_PATTERN.test(id)))];
  if (ids.length === 0) return { ok: true, reviews: [] };
  const client = createServiceClient();
  const rows = await collectCompletePaginatedRows({
    pageSize: 500,
    readPage: async (offset, limit) => {
      const { data, error, count } = await (client as any)
        .from("business_taxon_factual_reviews")
        .select(`${REVIEW_SELECT},outcome,opened_at`, { count: "exact" })
        .in("taxon_id", ids)
        .order("taxon_id", { ascending: true })
        .order("opened_at", { ascending: false })
        .order("id", { ascending: false })
        .range(offset, offset + limit - 1);
      if (error || !Array.isArray(data) || count === null || data.length > limit) return null;
      return { rows: data, total: count };
    },
  });
  if (!rows.ok) return failure("As sessões factuais estão temporariamente indisponíveis.");
  const latest = new Map<string, AdminTaxonFactualReviewSummary>();
  for (const row of rows.rows) {
    const review = normalizeStoredReviewRow(row);
    if (!review || !isRecord(row) || !isOutcome(row.outcome)) {
      return failure("As revisões factuais contêm estado indisponível para leitura.");
    }
    if (!latest.has(review.taxonId)) {
      latest.set(review.taxonId, {
        id: review.id,
        taxonId: review.taxonId,
        kind: review.kind,
        status: review.status,
        outcome: row.outcome,
        revision: review.revision,
        contextFingerprint: review.contextFingerprint,
      });
    }
  }
  return { ok: true, reviews: [...latest.values()] };
}

export async function loadLatestAdminTaxonFactualReview(
  taxonId: string,
): Promise<AdminTaxonFactualReviewReadResult> {
  if (!UUID_PATTERN.test(taxonId)) return failure("O taxon da revisão factual é inválido.");
  const result = await listLatestAdminTaxonFactualReviews([taxonId]);
  return result.ok ? { ok: true, review: result.reviews[0] ?? null } : result;
}

export async function openAdminTaxonFactualReview(input: Readonly<{
  taxonId: string;
  actorUserId: string;
}>): Promise<ReviewMutationResult> {
  if (!isInputCatalogReviewEnabled()) return failure("A revisão factual E20.6 está desabilitada.");
  if (!UUID_PATTERN.test(input.taxonId) || !UUID_PATTERN.test(input.actorUserId)) {
    return failure("A abertura da revisão factual possui entrada inválida.");
  }
  const client = createServiceClient();
  const context = await loadFactualReviewContext(client as any, input.taxonId);
  if (!context.ok) return context;
  const coverage = resolveCoverage(context.value);
  if (!coverage.ok) return failure(coverage.error.message);
  const { data, error } = await (client as any)
    .from("business_taxon_factual_reviews")
    .insert({
      taxon_id: input.taxonId,
      kind: context.value.selected.isActive ? "revision" : "release",
      baseline_is_active: context.value.selected.isActive,
      baseline_selected_end_customer_research_version: context.value.selectedResearchVersion,
      baseline_reviewed_input_catalog_version: context.value.reviewedInputCatalogVersion,
      context_fingerprint: coverage.value.contextFingerprint,
      chain_snapshot: coverage.value.chainSnapshot,
      opened_by: input.actorUserId,
    })
    .select(REVIEW_SELECT)
    .maybeSingle();
  const review = normalizeStoredReviewRow(data);
  if (error || !review) {
    return failure(error?.code === "23505"
      ? "Já existe uma revisão factual aberta para este taxon."
      : "Não foi possível abrir a revisão factual sem alterar o taxon.");
  }
  return { ok: true, review, coverage: coverage.value };
}

export async function persistAdminTaxonFactualEvaluation(input: Readonly<{
  review: FactualReviewSession;
  actorUserId: string;
  mode: InputCatalogEvaluationMode;
  source: "published" | "draft";
  draftRevision: number | null;
  inputCatalogVersion: number;
  evaluationContextFingerprint: string;
  output: InputCatalogEvaluationOutput;
}>): Promise<Readonly<{ ok: true; reviewRevision: number }> | Readonly<{ ok: false; message: string }>> {
  if (!isInputCatalogReviewEnabled()) return failure("A revisão factual E20.6 está desabilitada.");
  const parsedOutput = parseInputCatalogEvaluationOutput(input.output);
  if (
    !UUID_PATTERN.test(input.review.id) ||
    !UUID_PATTERN.test(input.review.taxonId) ||
    !UUID_PATTERN.test(input.actorUserId) ||
    !Number.isSafeInteger(input.review.revision) ||
    input.review.revision <= 0 ||
    (input.mode !== "systematic" && input.mode !== "hypothesis") ||
    (input.source !== "published" && input.source !== "draft") ||
    !Number.isSafeInteger(input.inputCatalogVersion) ||
    input.inputCatalogVersion <= 0 ||
    !/^[0-9a-f]{64}$/.test(input.evaluationContextFingerprint) ||
    (input.source === "draft") !== (
      Number.isSafeInteger(input.draftRevision) && Number(input.draftRevision) > 0
    ) ||
    !parsedOutput.ok ||
    parsedOutput.value.mode !== input.mode
  ) {
    return failure("A avaliação factual concluída possui identidade inválida para persistência.");
  }
  const client = createServiceClient();
  const { data, error } = await (client as any)
    .from("business_taxon_factual_reviews")
    .update({
      evaluation_mode: input.mode,
      evaluation_source: input.source,
      evaluation_input_catalog_version: input.inputCatalogVersion,
      evaluation_draft_revision: input.source === "draft" ? input.draftRevision : null,
      evaluation_context_fingerprint: input.evaluationContextFingerprint,
      evaluation_output: parsedOutput.value,
      evaluation_by: input.actorUserId,
      evaluated_at: new Date().toISOString(),
      revision: input.review.revision + 1,
    })
    .eq("id", input.review.id)
    .eq("taxon_id", input.review.taxonId)
    .eq("status", "open")
    .eq("revision", input.review.revision)
    .eq("context_fingerprint", input.review.contextFingerprint)
    .maxAffected(1)
    .select("revision")
    .maybeSingle();
  if (error || !isRecord(data) || Number(data.revision) !== input.review.revision + 1) {
    return failure("A avaliação não pôde ser persistida na revisão factual aberta.");
  }
  return { ok: true, reviewRevision: Number(data.revision) };
}

export async function loadAdminTaxonFactualEvaluationEvidence(input: Readonly<{
  reviewId: string;
  expectedRevision: number;
}>): Promise<Readonly<{ ok: true; evidence: AdminTaxonFactualEvaluationEvidence }> | Readonly<{ ok: false; message: string }>> {
  if (!isInputCatalogReviewEnabled()) return failure("A revisão factual E20.6 está desabilitada.");
  if (!UUID_PATTERN.test(input.reviewId) || !Number.isSafeInteger(input.expectedRevision)) {
    return failure("A referência persistida da avaliação factual é inválida.");
  }
  const client = createServiceClient();
  const { data, error } = await (client as any)
    .from("business_taxon_factual_reviews")
    .select(`${REVIEW_SELECT},evaluation_mode,evaluation_source,evaluation_input_catalog_version,evaluation_draft_revision,evaluation_context_fingerprint,evaluation_output`)
    .eq("id", input.reviewId)
    .eq("status", "open")
    .eq("revision", input.expectedRevision)
    .limit(1)
    .maybeSingle();
  const review = normalizeStoredReviewRow(data);
  const parsed = isRecord(data) ? parseInputCatalogEvaluationOutput(data.evaluation_output) : null;
  if (error || !review || !parsed?.ok || !isRecord(data)
      || (data.evaluation_source !== "published" && data.evaluation_source !== "draft")
      || data.evaluation_mode !== parsed.value.mode
      || !Number.isSafeInteger(Number(data.evaluation_input_catalog_version))
      || Number(data.evaluation_input_catalog_version) <= 0
      || (data.evaluation_source === "draft") !== (
        Number.isSafeInteger(Number(data.evaluation_draft_revision)) &&
        Number(data.evaluation_draft_revision) > 0
      )
      || typeof data.evaluation_context_fingerprint !== "string"
      || !/^[0-9a-f]{64}$/.test(data.evaluation_context_fingerprint)) {
    return failure("A revisão factual aberta não autentica uma avaliação persistida.");
  }
  return {
    ok: true,
    evidence: {
      review,
      output: parsed.value,
      inputCatalogVersion: Number(data.evaluation_input_catalog_version),
      source: data.evaluation_source,
      draftRevision: data.evaluation_draft_revision === null ? null : Number(data.evaluation_draft_revision),
      evaluationContextFingerprint: data.evaluation_context_fingerprint,
    },
  };
}

export async function finalizeAdminTaxonFactualReview(input: Readonly<{
  reviewId: string;
  expectedRevision: number;
  actorUserId: string;
  decision: FactualReviewHumanDecision;
  draft: null | Readonly<{ revision: number; contentFingerprint: string; contextFingerprint: string }>;
}>): Promise<Readonly<{ ok: true; reviewedVersion: number; decisionKind: "no_change" | "catalog_change" }> | Readonly<{ ok: false; message: string }>> {
  if (!isInputCatalogReviewEnabled()) return failure("A revisão factual E20.6 está desabilitada.");
  const evidence = await loadAdminTaxonFactualEvaluationEvidence({
    reviewId: input.reviewId,
    expectedRevision: input.expectedRevision,
  });
  if (!evidence.ok) return evidence;
  const normalized = normalizeFactualReviewCatalogChangeDecision(input.decision);
  if (!normalized.ok
      || evidence.evidence.output.status === "inconclusive"
      || normalized.value.recommendationCandidateCount !== evidence.evidence.output.candidates.length
      || (input.draft === null && normalized.value.decisionKind !== "no_change")) {
    return failure(normalized.ok ? "A decisão não corresponde à recomendação persistida." : normalized.error.message);
  }
  const client = createServiceClient();
  const persistedDecision: FactualReviewPersistedDecision = {
    ...normalized.value,
    ownCandidate: normalized.value.ownCandidate
      ? {
          ...normalized.value.ownCandidate,
          origin: FACTUAL_REVIEW_HUMAN_ADDED_ORIGIN,
        }
      : null,
  };
  const { data, error } = await (client as any).rpc("finalize_business_taxon_factual_review_v1", {
    p_review_id: input.reviewId,
    p_expected_revision: input.expectedRevision,
    p_actor_user_id: input.actorUserId,
    p_reviewed_version: evidence.evidence.inputCatalogVersion,
    p_decision_payload: persistedDecision,
    p_expected_draft_revision: input.draft?.revision ?? null,
    p_expected_draft_content_fingerprint: input.draft?.contentFingerprint ?? null,
    p_expected_draft_context_fingerprint: input.draft?.contextFingerprint ?? null,
  });
  const row = Array.isArray(data) ? data[0] : data;
  if (error || !isRecord(row) || row.review_status !== "closed"
      || row.decision_kind !== normalized.value.decisionKind
      || !Number.isSafeInteger(Number(row.reviewed_version))) {
    return failure("A decisão factual não pôde ser concluída sobre o estado exato.");
  }
  return {
    ok: true,
    reviewedVersion: Number(row.reviewed_version),
    decisionKind: normalized.value.decisionKind,
  };
}

export async function closeAdminTaxonFactualReviewWithoutEvaluation(input: Readonly<{
  reviewId: string;
  expectedRevision: number;
  actorUserId: string;
}>): Promise<Readonly<{ ok: true; reviewedVersion: number }> | Readonly<{ ok: false; message: string }>> {
  if (!isInputCatalogReviewEnabled()) return failure("A revisão factual E20.6 está desabilitada.");
  if (!UUID_PATTERN.test(input.reviewId) || !Number.isSafeInteger(input.expectedRevision)) {
    return failure("A referência da revisão factual é inválida.");
  }
  const client = createServiceClient();
  const { data: stored, error: storedError } = await (client as any)
    .from("business_taxon_factual_reviews")
    .select(REVIEW_SELECT)
    .eq("id", input.reviewId)
    .eq("status", "open")
    .eq("revision", input.expectedRevision)
    .maybeSingle();
  const review = normalizeStoredReviewRow(stored);
  if (storedError || !review) return failure("A revisão factual aberta mudou.");
  const context = await loadFactualReviewContext(client as any, review.taxonId);
  if (!context.ok) return context;
  const coverage = resolveCoverage(context.value);
  if (!coverage.ok || coverage.value.contextFingerprint !== review.contextFingerprint) {
    return failure("A cobertura herdada mudou. Reabra a revisão factual.");
  }
  const decision = {
    decisionKind: "no_change",
    recommendationCandidateCount: 0,
    recommendationSelection: "zero",
    acceptedCandidates: [],
    rejectedCandidateIndexes: [],
    ownCandidate: null,
  };
  const { data, error } = await (client as any).rpc("finalize_business_taxon_factual_review_v1", {
    p_review_id: input.reviewId,
    p_expected_revision: input.expectedRevision,
    p_actor_user_id: input.actorUserId,
    p_reviewed_version: coverage.value.inputCatalogVersion,
    p_decision_payload: decision,
    p_expected_draft_revision: null,
    p_expected_draft_content_fingerprint: null,
    p_expected_draft_context_fingerprint: null,
  });
  const row = Array.isArray(data) ? data[0] : data;
  if (error || !isRecord(row) || row.review_status !== "closed") {
    return failure("Não foi possível concluir a revisão factual sem avaliação opcional.");
  }
  return { ok: true, reviewedVersion: coverage.value.inputCatalogVersion };
}

export async function saveAdminInputCatalogDraft(input: Readonly<{
  actorUserId: string;
  expectedRevision: number;
  catalogJson: unknown;
  contentFingerprint: string;
}>) {
  const client = createServiceClient();
  const { data, error } = await (client as any)
    .from("landing_page_input_catalog_drafts")
    .update({
      catalog_json: input.catalogJson,
      content_fingerprint: input.contentFingerprint,
      revision: input.expectedRevision + 1,
      validation_fingerprint: null,
      validation_context_fingerprint: null,
      validated_at: null,
      publication_fingerprint: null,
      publication_context_fingerprint: null,
      publication_context_snapshot: null,
      publication_required_taxon_ids: [],
      publication_prepared_at: null,
      taxon_review_evidence: {},
      updated_by: input.actorUserId,
    })
    .eq("singleton", true)
    .eq("revision", input.expectedRevision)
    .maxAffected(1)
    .select("revision")
    .maybeSingle();
  if (error || !isRecord(data) || Number(data.revision) !== input.expectedRevision + 1) {
    return failure("O draft mudou durante a edição.");
  }
  return { ok: true as const, revision: Number(data.revision) };
}

export async function authorizeAdminInputCatalogFactualPublication(input: Readonly<{
  actorUserId: string;
  expectedRevision: number;
  contentFingerprint: string;
  contextFingerprint: string;
  contextSnapshot: Readonly<Record<string, unknown>>;
  requiredTaxonIds: readonly string[];
}>) {
  const client = createServiceClient();
  const { data, error } = await (client as any)
    .from("landing_page_input_catalog_drafts")
    .update({
      publication_fingerprint: input.contentFingerprint,
      publication_context_fingerprint: input.contextFingerprint,
      publication_context_snapshot: input.contextSnapshot,
      publication_required_taxon_ids: [...input.requiredTaxonIds],
      publication_prepared_at: new Date().toISOString(),
      updated_by: input.actorUserId,
    })
    .eq("singleton", true)
    .eq("revision", input.expectedRevision)
    .eq("content_fingerprint", input.contentFingerprint)
    .eq("validation_fingerprint", input.contentFingerprint)
    .eq("validation_context_fingerprint", input.contextFingerprint)
    .maxAffected(1)
    .select("revision")
    .maybeSingle();
  if (error || !isRecord(data) || Number(data.revision) !== input.expectedRevision) {
    return failure("A publicação não pôde ser preparada para o draft exato.");
  }
  return { ok: true as const, revision: Number(data.revision) };
}

export async function reconcileAdminInputCatalogFactualPublication(input: Readonly<{
  actorUserId: string;
  expectedRevision: number;
  deployedVersion: number;
  deployedContentFingerprint: string;
  publicationContextFingerprint: string;
}>) {
  const client = createServiceClient();
  const { data, error } = await (client as any).rpc("reconcile_business_taxon_factual_review_publication_v1", {
    p_actor_user_id: input.actorUserId,
    p_expected_draft_revision: input.expectedRevision,
    p_deployed_version: input.deployedVersion,
    p_deployed_content_fingerprint: input.deployedContentFingerprint,
    p_publication_context_fingerprint: input.publicationContextFingerprint,
  });
  const row = Array.isArray(data) ? data[0] : data;
  if (error || !isRecord(row) || !Number.isSafeInteger(Number(row.reconciled_taxon_count))) {
    return failure("A publicação implantada não pôde ser reconciliada atomicamente.");
  }
  return { ok: true as const, reconciledTaxonCount: Number(row.reconciled_taxon_count) };
}

const REVIEW_SELECT = "id,taxon_id,kind,status,baseline_is_active,baseline_selected_end_customer_research_version,baseline_reviewed_input_catalog_version,context_fingerprint,revision";

async function loadFactualReviewContext(client: any, taxonId: string) {
  const taxons: LandingPageInputCatalogTaxonIdentity[] = [];
  const visited = new Set<string>();
  let nextId: string | null = taxonId;
  let selectedResearchVersion: number | null = null;
  let reviewedInputCatalogVersion: number | null = null;
  while (nextId !== null && taxons.length < 3) {
    if (visited.has(nextId)) return failure("A cadeia taxonômica contém um ciclo.");
    visited.add(nextId);
    const { data, error } = await client.from("business_taxons")
      .select("id,parent_id,level,name,slug,is_active,selected_end_customer_research_version,reviewed_input_catalog_version")
      .eq("id", nextId).maybeSingle();
    const taxon = normalizeTaxonRow(data);
    if (error || !taxon) return failure("Não foi possível reconstruir integralmente a cadeia do taxon.");
    if (taxons.length === 0) {
      selectedResearchVersion = data.selected_end_customer_research_version === null
        ? null : Number(data.selected_end_customer_research_version);
      if (selectedResearchVersion !== null && (
        !Number.isSafeInteger(selectedResearchVersion) || selectedResearchVersion <= 0
      )) {
        return failure("A pesquisa E20.5 selecionada do taxon é inválida.");
      }
      reviewedInputCatalogVersion = data.reviewed_input_catalog_version === null
        ? null : Number(data.reviewed_input_catalog_version);
      if (reviewedInputCatalogVersion !== null && (
        !Number.isSafeInteger(reviewedInputCatalogVersion) || reviewedInputCatalogVersion <= 0
      )) {
        return failure("O marcador factual vigente do taxon é inválido.");
      }
    }
    taxons.push(taxon);
    nextId = taxon.parentId;
  }
  if (nextId !== null || taxons.length === 0) return failure("A cadeia taxonômica excede os níveis autorizados.");
  return { ok: true as const, value: {
    selected: taxons[0], selectedResearchVersion, reviewedInputCatalogVersion, taxons,
  } };
}

function resolveCoverage(context: Readonly<{
  selected: LandingPageInputCatalogTaxonIdentity;
  selectedResearchVersion: number | null;
  reviewedInputCatalogVersion: number | null;
  taxons: readonly LandingPageInputCatalogTaxonIdentity[];
}>) {
  return resolveInheritedInputCatalogCoverage({
    baseline: {
      taxon: context.selected,
      selectedResearchVersion: context.selectedResearchVersion,
      reviewedInputCatalogVersion: context.reviewedInputCatalogVersion,
    },
    taxons: context.taxons,
    inputCatalogVersion: CURRENT_LANDING_PAGE_INPUT_CATALOG_VERSION,
    resolvePlan: resolveLandingPageInputCatalog,
  });
}

function normalizeStoredReviewRow(value: unknown): FactualReviewSession | null {
  if (!isRecord(value) || typeof value.id !== "string" || typeof value.taxon_id !== "string"
      || (value.kind !== "release" && value.kind !== "revision")
      || (value.status !== "open" && value.status !== "closed")
      || typeof value.baseline_is_active !== "boolean"
      || (value.baseline_selected_end_customer_research_version !== null && (
        !Number.isSafeInteger(Number(value.baseline_selected_end_customer_research_version)) ||
        Number(value.baseline_selected_end_customer_research_version) <= 0
      ))
      || (value.baseline_reviewed_input_catalog_version !== null && (
        !Number.isSafeInteger(Number(value.baseline_reviewed_input_catalog_version)) ||
        Number(value.baseline_reviewed_input_catalog_version) <= 0
      ))
      || typeof value.context_fingerprint !== "string"
      || !Number.isSafeInteger(Number(value.revision))) return null;
  return {
    id: value.id,
    taxonId: value.taxon_id,
    kind: value.kind,
    status: value.status,
    baselineIsActive: value.baseline_is_active,
    baselineSelectedResearchVersion: value.baseline_selected_end_customer_research_version === null
      ? null : Number(value.baseline_selected_end_customer_research_version),
    baselineReviewedInputCatalogVersion: value.baseline_reviewed_input_catalog_version === null
      ? null : Number(value.baseline_reviewed_input_catalog_version),
    contextFingerprint: value.context_fingerprint,
    revision: Number(value.revision),
  };
}

function normalizeTaxonRow(value: unknown): LandingPageInputCatalogTaxonIdentity | null {
  if (!isRecord(value) || typeof value.id !== "string"
      || (value.parent_id !== null && typeof value.parent_id !== "string")
      || !["segment", "niche", "ultra_niche"].includes(value.level)
      || typeof value.name !== "string" || typeof value.slug !== "string"
      || typeof value.is_active !== "boolean") return null;
  return { id: value.id, parentId: value.parent_id, level: value.level,
    name: value.name, slug: value.slug, isActive: value.is_active } as LandingPageInputCatalogTaxonIdentity;
}

function isOutcome(value: unknown): value is AdminTaxonFactualReviewSummary["outcome"] {
  return value === null || value === "no_change" || value === "catalog_change" || value === "invalidated";
}

function isRecord(value: unknown): value is Record<string, any> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function failure(message: string): Readonly<{ ok: false; message: string }> {
  return { ok: false, message };
}
