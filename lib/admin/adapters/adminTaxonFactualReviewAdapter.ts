import "server-only";

import {
  CURRENT_LANDING_PAGE_INPUT_CATALOG_VERSION,
  resolveLandingPageInputCatalog,
  type LandingPageInputCatalogTaxonIdentity,
} from "@/conversion-content/landing-page/input-catalog";
import {
  isInputCatalogReviewEnabled,
  fingerprintInputCatalogEvaluationOutput,
  normalizeFactualReviewCatalogChangeDecision,
  parseInputCatalogEvaluationOutput,
  resolveInheritedInputCatalogCoverage,
  type FactualReviewCatalogChangeDecision,
  type FactualReviewHumanDecision,
  type FactualReviewSession,
  type InheritedInputCatalogCoverage,
  type InputCatalogEvaluationOutput,
  type InputCatalogEvaluationSourceStrategy,
} from "@/conversion-content/landing-page/taxon-preparation";
import { createServiceClient } from "@/lib/supabase/service";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type OpenAdminTaxonFactualReviewInput = Readonly<{
  taxonId: string;
  operationId: string;
  actorUserId: string;
}>;

type CloseAdminTaxonFactualReviewWithoutChangeInput = Readonly<{
  reviewId: string;
  operationId: string;
  actorUserId: string;
  expectedRevision: number;
  expectedContextFingerprint: string;
  expectedContentFingerprint: string;
  taxonId: string;
  humanDecision?: FactualReviewHumanDecision;
  recommendationEventId?: string;
  recommendationOutputFingerprint?: string;
  recommendationEvaluationContextFingerprint?: string;
}>;

type CloseAdminTaxonFactualReviewForCurrentCoverageInput = Omit<
  CloseAdminTaxonFactualReviewWithoutChangeInput,
  "expectedContentFingerprint"
>;

type AdminTaxonFactualReviewResult =
  | Readonly<{
      ok: true;
      value: Readonly<{
        review: FactualReviewSession;
        coverage: InheritedInputCatalogCoverage;
      }>;
    }>
  | Readonly<{ ok: false; message: string }>;

export type AdminTaxonFactualEvaluationEventKind =
  | "evaluation_requested"
  | "evaluation_completed"
  | "evaluation_inconclusive";

export type AppendAdminTaxonFactualEvaluationEventInput = Readonly<{
  review: FactualReviewSession;
  operationId: string;
  actorUserId: string;
  eventKind: AdminTaxonFactualEvaluationEventKind;
  sourceStrategy: InputCatalogEvaluationSourceStrategy;
  contentFingerprint: string | null;
  evaluationContextFingerprint: string;
  deadlineAtMs: number;
  payload: Readonly<Record<string, unknown>>;
}>;

export type AppendAdminTaxonFactualEvaluationEventResult =
  | Readonly<{ ok: true; eventId: string; reviewRevision: number }>
  | Readonly<{ ok: false; message: string }>;

export type LoadAdminTaxonFactualEvaluationEvidenceInput = Readonly<{
  reviewId: string;
  eventId: string;
  outputFingerprint: string;
  evaluationContextFingerprint: string;
  output: InputCatalogEvaluationOutput;
}>;

export type LoadAdminTaxonFactualEvaluationEvidenceResult =
  | Readonly<{
      ok: true;
      evidence: Readonly<{
        taxonId: string;
        inputCatalogVersion: number;
        evaluationContextFingerprint: string;
        outputFingerprint: string;
        status: InputCatalogEvaluationOutput["status"];
      }>;
    }>
  | Readonly<{ ok: false; message: string }>;

export async function loadOpenAdminTaxonFactualReview(
  taxonId: string,
): Promise<Readonly<{ ok: true; review: FactualReviewSession }> | Readonly<{ ok: false; message: string }>> {
  if (!taxonId) return failure("O taxon da sessão factual é inválido.");
  const client = createServiceClient();
  const { data, error } = await (client as any)
    .from("business_taxon_factual_reviews")
    .select("id,taxon_id,review_kind,status,baseline_is_active,baseline_reviewed_input_catalog_version,context_fingerprint,revision")
    .eq("taxon_id", taxonId)
    .eq("status", "open")
    .limit(1)
    .maybeSingle();
  const review = normalizeStoredReviewRow(data);
  if (error || !review) {
    console.error("loadOpenAdminTaxonFactualReview failed:", {
      code: error?.code,
      message: error?.message,
    });
    return failure("Abra uma sessão factual para este taxon antes de solicitar a avaliação.");
  }
  return { ok: true, review };
}

export async function appendAdminTaxonFactualEvaluationEvent(
  input: AppendAdminTaxonFactualEvaluationEventInput,
): Promise<AppendAdminTaxonFactualEvaluationEventResult> {
  const client = createServiceClient();
  const { data, error } = await (client as any).rpc(
    "append_business_taxon_factual_review_evaluation_event_v1",
    {
      p_review_id: input.review.id,
      p_operation_id: input.operationId,
      p_actor_user_id: input.actorUserId,
      p_expected_review_revision: input.review.revision,
      p_review_context_fingerprint: input.review.contextFingerprint,
      p_event_kind: input.eventKind,
      p_source_strategy: input.sourceStrategy,
      p_content_fingerprint: input.contentFingerprint,
      p_payload_json: {
        ...input.payload,
        reviewContextFingerprint: input.review.contextFingerprint,
        evaluationContextFingerprint: input.evaluationContextFingerprint,
        deadlineAtMs: input.deadlineAtMs,
      },
    },
  );
  const row = Array.isArray(data) ? data[0] : data;
  if (
    error ||
    !isRecord(row) ||
    typeof row.event_id !== "string" ||
    !Number.isSafeInteger(Number(row.review_revision)) ||
    Number(row.review_revision) !== input.review.revision
  ) {
    console.error("appendAdminTaxonFactualEvaluationEvent failed:", {
      code: error?.code,
      message: error?.message,
    });
    return failure("O evento da avaliação não pôde ser vinculado à sessão factual aberta.");
  }
  return {
    ok: true,
    eventId: row.event_id,
    reviewRevision: Number(row.review_revision),
  };
}

export async function loadAdminTaxonFactualEvaluationEvidence(
  input: LoadAdminTaxonFactualEvaluationEvidenceInput,
): Promise<LoadAdminTaxonFactualEvaluationEvidenceResult> {
  const expectedOutputFingerprint = fingerprintInputCatalogEvaluationOutput(input.output);
  if (
    !UUID_PATTERN.test(input.reviewId) ||
    !UUID_PATTERN.test(input.eventId) ||
    input.outputFingerprint !== expectedOutputFingerprint
    || !/^[0-9a-f]{64}$/.test(input.evaluationContextFingerprint)
  ) {
    return failure("A referência persistida da avaliação factual é inválida.");
  }
  const client = createServiceClient();
  const { data: eventData, error: eventError } = await (client as any)
    .from("business_taxon_factual_review_events")
    .select("id,review_id,event_kind,source_strategy,context_fingerprint,content_fingerprint,payload_json")
    .eq("id", input.eventId)
    .eq("review_id", input.reviewId)
    .limit(1)
    .maybeSingle();
  const payload = isRecord(eventData) && isRecord(eventData.payload_json)
    ? eventData.payload_json
    : null;
  const parsedOutput = payload ? parseInputCatalogEvaluationOutput(payload.output) : null;
  const inputCatalogVersion = payload ? Number(payload.inputCatalogVersion) : Number.NaN;
  if (
    eventError ||
    !isRecord(eventData) ||
    eventData.event_kind !== "evaluation_completed" ||
    eventData.content_fingerprint !== expectedOutputFingerprint ||
    payload?.reviewContextFingerprint !== eventData.context_fingerprint ||
    payload?.evaluationContextFingerprint !== input.evaluationContextFingerprint ||
    payload?.outputFingerprint !== expectedOutputFingerprint ||
    Number(payload?.candidateCount) !== input.output.candidates.length ||
    !Number.isSafeInteger(inputCatalogVersion) ||
    inputCatalogVersion <= 0 ||
    !parsedOutput?.ok ||
    fingerprintInputCatalogEvaluationOutput(parsedOutput.value) !== expectedOutputFingerprint ||
    eventData.source_strategy !== parsedOutput.value.sourceStrategy
  ) {
    return failure("O evento factual persistido não autentica este resultado de avaliação.");
  }
  const { data: reviewData, error: reviewError } = await (client as any)
    .from("business_taxon_factual_reviews")
    .select("id,taxon_id,status,context_fingerprint")
    .eq("id", input.reviewId)
    .limit(1)
    .maybeSingle();
  if (
    reviewError ||
    !isRecord(reviewData) ||
    reviewData.status !== "open" ||
    typeof reviewData.taxon_id !== "string" ||
    typeof reviewData.context_fingerprint !== "string" ||
    eventData.context_fingerprint !== reviewData.context_fingerprint
  ) {
    return failure("A sessão factual vinculada à avaliação não está aberta ou mudou.");
  }
  return Object.freeze({
    ok: true,
    evidence: Object.freeze({
      taxonId: reviewData.taxon_id,
      inputCatalogVersion,
      evaluationContextFingerprint: input.evaluationContextFingerprint,
      outputFingerprint: expectedOutputFingerprint,
      status: parsedOutput.value.status,
    }),
  });
}

export type RecordAdminTaxonFactualCatalogChangeDecisionInput = Readonly<{
  reviewId: string;
  operationId: string;
  actorUserId: string;
  taxonId: string;
  expectedReviewRevision: number;
  expectedReviewContextFingerprint: string;
  draftRevision: number;
  targetInputCatalogVersion: number;
  draftContentFingerprint: string;
  draftContextFingerprint: string;
  decision: FactualReviewCatalogChangeDecision;
  recommendationEventId?: string;
  recommendationOutputFingerprint?: string;
  recommendationEvaluationContextFingerprint?: string;
}>;

type FactualDraftMutationResult =
  | Readonly<{ ok: true; revision: number }>
  | Readonly<{ ok: false; message: string }>;

export async function openAdminTaxonFactualReview(
  input: OpenAdminTaxonFactualReviewInput,
): Promise<AdminTaxonFactualReviewResult> {
  if (!isInputCatalogReviewEnabled()) {
    return failure("A revisão factual E20.6 está desabilitada.");
  }
  if (!input.taxonId || !input.operationId || !input.actorUserId) {
    return failure("A abertura da revisão factual possui entrada inválida.");
  }

  const supabase = createServiceClient();
  const context = await loadFactualReviewContext(supabase as any, input.taxonId);
  if (!context.ok) return context;

  const coverage = resolveInheritedInputCatalogCoverage({
    baseline: {
      taxon: context.value.selected,
      reviewedInputCatalogVersion: context.value.reviewedInputCatalogVersion,
    },
    taxons: context.value.taxons,
    inputCatalogVersion: CURRENT_LANDING_PAGE_INPUT_CATALOG_VERSION,
    resolvePlan: resolveLandingPageInputCatalog,
  });
  if (!coverage.ok) return failure(coverage.error.message);

  const { data, error } = await (supabase as any).rpc(
    "open_business_taxon_factual_review_v1",
    {
      p_taxon_id: input.taxonId,
      p_context_fingerprint: coverage.value.contextFingerprint,
      p_chain_snapshot: coverage.value.chainSnapshot,
      p_opened_operation_id: input.operationId,
      p_actor_user_id: input.actorUserId,
      p_expected_is_active: context.value.selected.isActive,
      p_expected_reviewed_input_catalog_version:
        context.value.reviewedInputCatalogVersion,
    },
  );
  const review = normalizeReviewRpcRow(data, input.taxonId, coverage.value.contextFingerprint);
  if (error || !review) {
    console.error("openAdminTaxonFactualReview failed:", {
      code: error?.code,
      message: error?.message,
    });
    return failure("Não foi possível abrir a revisão factual sem alterar o taxon.");
  }

  return { ok: true, value: { review, coverage: coverage.value } };
}

export async function closeAdminTaxonFactualReviewWithoutChange(
  input: CloseAdminTaxonFactualReviewWithoutChangeInput,
): Promise<AdminTaxonFactualReviewResult> {
  if (!isInputCatalogReviewEnabled()) {
    return failure("A revisão factual E20.6 está desabilitada.");
  }
  if (
    !input.reviewId ||
    !input.operationId ||
    !input.actorUserId ||
    !input.taxonId ||
    !Number.isSafeInteger(input.expectedRevision) ||
    input.expectedRevision <= 0
  ) {
    return failure("O fechamento da revisão factual possui entrada inválida.");
  }

  const supabase = createServiceClient();
  const context = await loadFactualReviewContext(supabase as any, input.taxonId);
  if (!context.ok) return context;
  const coverage = resolveInheritedInputCatalogCoverage({
    baseline: {
      taxon: context.value.selected,
      reviewedInputCatalogVersion: context.value.reviewedInputCatalogVersion,
    },
    taxons: context.value.taxons,
    inputCatalogVersion: CURRENT_LANDING_PAGE_INPUT_CATALOG_VERSION,
    resolvePlan: resolveLandingPageInputCatalog,
  });
  if (!coverage.ok) return failure(coverage.error.message);
  if (
    coverage.value.contextFingerprint !== input.expectedContextFingerprint ||
    coverage.value.contentFingerprint !== input.expectedContentFingerprint
  ) {
    return failure("A cobertura herdada mudou. Reabra a revisão factual.");
  }

  return closeAdminTaxonFactualReviewWithCoverage(input, coverage.value);
}

export async function closeAdminTaxonFactualReviewWithoutChangeForCurrentCoverage(
  input: CloseAdminTaxonFactualReviewForCurrentCoverageInput,
): Promise<AdminTaxonFactualReviewResult> {
  if (!isInputCatalogReviewEnabled()) {
    return failure("A revisão factual E20.6 está desabilitada.");
  }
  if (
    !input.reviewId ||
    !input.operationId ||
    !input.actorUserId ||
    !input.taxonId ||
    !Number.isSafeInteger(input.expectedRevision) ||
    input.expectedRevision <= 0
  ) {
    return failure("O fechamento da revisão factual possui entrada inválida.");
  }
  const supabase = createServiceClient();
  const context = await loadFactualReviewContext(supabase as any, input.taxonId);
  if (!context.ok) return context;
  const coverage = resolveInheritedInputCatalogCoverage({
    baseline: {
      taxon: context.value.selected,
      reviewedInputCatalogVersion: context.value.reviewedInputCatalogVersion,
    },
    taxons: context.value.taxons,
    inputCatalogVersion: CURRENT_LANDING_PAGE_INPUT_CATALOG_VERSION,
    resolvePlan: resolveLandingPageInputCatalog,
  });
  if (!coverage.ok) return failure(coverage.error.message);
  if (coverage.value.contextFingerprint !== input.expectedContextFingerprint) {
    return failure("A cobertura herdada mudou. Reabra a revisão factual.");
  }
  return closeAdminTaxonFactualReviewWithCoverage(input, coverage.value);
}

async function closeAdminTaxonFactualReviewWithCoverage(
  input: CloseAdminTaxonFactualReviewForCurrentCoverageInput,
  coverage: InheritedInputCatalogCoverage,
): Promise<AdminTaxonFactualReviewResult> {
  const decision = input.humanDecision === undefined
    ? null
    : normalizeFactualReviewCatalogChangeDecision(input.humanDecision);
  if (decision && (!decision.ok || decision.value.decisionKind !== "no_change")) {
    return failure("O fechamento sem mudança exige rejeição integral sem candidato próprio.");
  }
  if (decision?.ok && !hasValidRecommendationBinding(
    decision.value,
    input.recommendationEventId,
    input.recommendationOutputFingerprint,
    input.recommendationEvaluationContextFingerprint,
  )) {
    return failure("A decisão não corresponde à recomendação factual persistida.");
  }

  const supabase = createServiceClient();
  const { data, error } = await (supabase as any).rpc(
    "close_business_taxon_factual_review_without_change_v1",
    {
      p_review_id: input.reviewId,
      p_operation_id: input.operationId,
      p_actor_user_id: input.actorUserId,
      p_expected_revision: input.expectedRevision,
      p_input_catalog_version: CURRENT_LANDING_PAGE_INPUT_CATALOG_VERSION,
      p_context_fingerprint: coverage.contextFingerprint,
      p_content_fingerprint: coverage.contentFingerprint,
      p_chain_snapshot: coverage.chainSnapshot,
      p_human_decision: decision?.ok
        ? serializeHumanDecisionWithRecommendation(
            decision.value,
            input.recommendationEventId,
            input.recommendationOutputFingerprint,
            input.recommendationEvaluationContextFingerprint,
          )
        : null,
    },
  );
  const review = normalizeReviewRpcRow(data, input.taxonId, coverage.contextFingerprint);
  if (error || !review) {
    console.error("closeAdminTaxonFactualReviewWithoutChange failed:", {
      code: error?.code,
      message: error?.message,
    });
    return failure("Não foi possível confirmar a cobertura herdada. O estado anterior foi preservado.");
  }

  return { ok: true, value: { review, coverage } };
}

export async function recordAdminTaxonFactualCatalogChangeDecision(
  input: RecordAdminTaxonFactualCatalogChangeDecisionInput,
): Promise<AdminTaxonFactualReviewResult> {
  if (!isInputCatalogReviewEnabled()) {
    return failure("A revisão factual E20.6 está desabilitada.");
  }
  const decision = normalizeFactualReviewCatalogChangeDecision(input.decision);
  if (
    !decision.ok ||
    decision.value.decisionKind !== "catalog_change" ||
    !input.reviewId ||
    !input.operationId ||
    !input.actorUserId ||
    !input.taxonId ||
    !Number.isSafeInteger(input.expectedReviewRevision) ||
    input.expectedReviewRevision <= 0 ||
    !Number.isSafeInteger(input.draftRevision) ||
    input.draftRevision <= 0 ||
    !Number.isSafeInteger(input.targetInputCatalogVersion) ||
    input.targetInputCatalogVersion <= 0 ||
    !hasValidRecommendationBinding(
      decision.ok ? decision.value : null,
      input.recommendationEventId,
      input.recommendationOutputFingerprint,
      input.recommendationEvaluationContextFingerprint,
    )
  ) {
    return failure("A decisão factual com mudança possui entrada inválida.");
  }
  const supabase = createServiceClient();
  const context = await loadFactualReviewContext(supabase as any, input.taxonId);
  if (!context.ok) return context;
  const coverage = resolveInheritedInputCatalogCoverage({
    baseline: {
      taxon: context.value.selected,
      reviewedInputCatalogVersion: context.value.reviewedInputCatalogVersion,
    },
    taxons: context.value.taxons,
    inputCatalogVersion: CURRENT_LANDING_PAGE_INPUT_CATALOG_VERSION,
    resolvePlan: resolveLandingPageInputCatalog,
  });
  if (!coverage.ok) return failure(coverage.error.message);
  if (coverage.value.contextFingerprint !== input.expectedReviewContextFingerprint) {
    return failure("O baseline da sessão factual mudou. Reabra a revisão.");
  }
  const { data, error } = await (supabase as any).rpc(
    "record_business_taxon_factual_catalog_change_decision_v1",
    {
      p_review_id: input.reviewId,
      p_operation_id: input.operationId,
      p_actor_user_id: input.actorUserId,
      p_expected_review_revision: input.expectedReviewRevision,
      p_review_context_fingerprint: input.expectedReviewContextFingerprint,
      p_chain_snapshot: coverage.value.chainSnapshot,
      p_draft_revision: input.draftRevision,
      p_target_input_catalog_version: input.targetInputCatalogVersion,
      p_draft_content_fingerprint: input.draftContentFingerprint,
      p_draft_context_fingerprint: input.draftContextFingerprint,
      p_decision_payload: serializeHumanDecisionWithRecommendation(
        decision.value,
        input.recommendationEventId,
        input.recommendationOutputFingerprint,
        input.recommendationEvaluationContextFingerprint,
      ),
    },
  );
  const review = normalizeReviewRpcRow(
    data,
    input.taxonId,
    input.expectedReviewContextFingerprint,
  );
  if (error || !review) {
    console.error("recordAdminTaxonFactualCatalogChangeDecision failed:", {
      code: error?.code,
      message: error?.message,
    });
    return failure("A decisão factual não pôde ser vinculada ao draft exato.");
  }
  return { ok: true, value: { review, coverage: coverage.value } };
}

export async function saveAdminInputCatalogDraftAndInvalidateFactualReviews(input: Readonly<{
  operationId: string;
  actorUserId: string;
  expectedRevision: number;
  catalogJson: unknown;
  contentFingerprint: string;
}>): Promise<FactualDraftMutationResult> {
  const client = createServiceClient();
  const { data, error } = await (client as any).rpc(
    "save_business_taxon_factual_review_draft_v1",
    {
      p_operation_id: input.operationId,
      p_actor_user_id: input.actorUserId,
      p_expected_revision: input.expectedRevision,
      p_catalog_json: input.catalogJson,
      p_content_fingerprint: input.contentFingerprint,
    },
  );
  const row = Array.isArray(data) ? data[0] : data;
  if (error || !isRecord(row) || Number(row.draft_revision) !== input.expectedRevision + 1) {
    console.error("saveAdminInputCatalogDraftAndInvalidateFactualReviews failed:", {
      code: error?.code,
      message: error?.message,
    });
    return failure("O draft mudou ou suas decisões não puderam ser invalidadas atomicamente.");
  }
  return { ok: true, revision: Number(row.draft_revision) };
}

export async function authorizeAdminInputCatalogFactualPublication(input: Readonly<{
  operationId: string;
  actorUserId: string;
  expectedRevision: number;
  contentFingerprint: string;
  contextFingerprint: string;
  requiredTaxonIds: readonly string[];
}>): Promise<FactualDraftMutationResult> {
  const client = createServiceClient();
  const { data, error } = await (client as any).rpc(
    "authorize_business_taxon_factual_review_publication_v1",
    {
      p_operation_id: input.operationId,
      p_actor_user_id: input.actorUserId,
      p_expected_draft_revision: input.expectedRevision,
      p_draft_content_fingerprint: input.contentFingerprint,
      p_draft_context_fingerprint: input.contextFingerprint,
      p_required_taxon_ids: [...input.requiredTaxonIds].sort(),
    },
  );
  const row = Array.isArray(data) ? data[0] : data;
  if (error || !isRecord(row) || Number(row.draft_revision) !== input.expectedRevision) {
    console.error("authorizeAdminInputCatalogFactualPublication failed:", {
      code: error?.code,
      message: error?.message,
    });
    return failure("A publicação não pôde ser autorizada para todas as decisões factuais.");
  }
  return { ok: true, revision: Number(row.draft_revision) };
}

export async function reconcileAdminInputCatalogFactualPublication(input: Readonly<{
  operationId: string;
  actorUserId: string;
  expectedRevision: number;
  deployedVersion: number;
  deployedContentFingerprint: string;
  publicationContextFingerprint: string;
}>): Promise<Readonly<{ ok: true; reconciledTaxonCount: number }> | Readonly<{ ok: false; message: string }>> {
  const client = createServiceClient();
  const { data, error } = await (client as any).rpc(
    "reconcile_business_taxon_factual_review_publication_v1",
    {
      p_operation_id: input.operationId,
      p_actor_user_id: input.actorUserId,
      p_expected_draft_revision: input.expectedRevision,
      p_deployed_version: input.deployedVersion,
      p_deployed_content_fingerprint: input.deployedContentFingerprint,
      p_publication_context_fingerprint: input.publicationContextFingerprint,
    },
  );
  const row = Array.isArray(data) ? data[0] : data;
  if (
    error ||
    !isRecord(row) ||
    !Number.isSafeInteger(Number(row.reconciled_taxon_count)) ||
    Number(row.reconciled_taxon_count) < 0
  ) {
    console.error("reconcileAdminInputCatalogFactualPublication failed:", {
      code: error?.code,
      message: error?.message,
    });
    return failure("A publicação implantada não pôde ser reconciliada atomicamente.");
  }
  return { ok: true, reconciledTaxonCount: Number(row.reconciled_taxon_count) };
}

async function loadFactualReviewContext(
  client: any,
  taxonId: string,
): Promise<
  | Readonly<{
      ok: true;
      value: Readonly<{
        selected: LandingPageInputCatalogTaxonIdentity;
        reviewedInputCatalogVersion: number | null;
        taxons: readonly LandingPageInputCatalogTaxonIdentity[];
      }>;
    }>
  | Readonly<{ ok: false; message: string }>
> {
  const taxons: LandingPageInputCatalogTaxonIdentity[] = [];
  const visited = new Set<string>();
  let nextId: string | null = taxonId;
  let reviewedInputCatalogVersion: number | null = null;

  while (nextId !== null && taxons.length < 3) {
    if (visited.has(nextId)) return failure("A cadeia taxonômica contém um ciclo.");
    visited.add(nextId);
    const { data, error } = await client
      .from("business_taxons")
      .select("id,parent_id,level,name,slug,is_active,reviewed_input_catalog_version")
      .eq("id", nextId)
      .maybeSingle();
    const taxon = normalizeTaxonRow(data);
    if (error || !taxon) {
      return failure("Não foi possível reconstruir integralmente a cadeia do taxon.");
    }
    if (taxons.length === 0) {
      reviewedInputCatalogVersion = normalizePositiveIntegerOrNull(
        data.reviewed_input_catalog_version,
      );
      if (
        reviewedInputCatalogVersion === null &&
        data.reviewed_input_catalog_version !== null
      ) {
        return failure("O marcador factual atual do taxon é inválido.");
      }
    }
    taxons.push(taxon);
    nextId = taxon.parentId;
  }
  if (nextId !== null || taxons.length === 0) {
    return failure("A cadeia taxonômica excede os níveis autorizados.");
  }

  return {
    ok: true,
    value: {
      selected: taxons[0],
      reviewedInputCatalogVersion,
      taxons: Object.freeze(taxons),
    },
  };
}

function normalizeTaxonRow(value: unknown): LandingPageInputCatalogTaxonIdentity | null {
  if (!isRecord(value)) return null;
  if (
    typeof value.id !== "string" ||
    (value.parent_id !== null && typeof value.parent_id !== "string") ||
    (value.level !== "segment" && value.level !== "niche" && value.level !== "ultra_niche") ||
    typeof value.name !== "string" ||
    typeof value.slug !== "string" ||
    typeof value.is_active !== "boolean"
  ) {
    return null;
  }
  return {
    id: value.id,
    parentId: value.parent_id,
    level: value.level,
    name: value.name,
    slug: value.slug,
    isActive: value.is_active,
  };
}

function normalizeReviewRpcRow(
  value: unknown,
  taxonId: string,
  contextFingerprint: string,
): FactualReviewSession | null {
  const row = Array.isArray(value) ? value[0] : value;
  if (!isRecord(row)) return null;
  if (
    typeof row.review_id !== "string" ||
    (row.review_kind !== "release" && row.review_kind !== "revision") ||
    (row.review_status !== "open" &&
      row.review_status !== "awaiting_catalog_publication" &&
      row.review_status !== "closed_without_change" &&
      row.review_status !== "closed_published") ||
    !Number.isSafeInteger(Number(row.review_revision)) ||
    Number(row.review_revision) <= 0 ||
    typeof row.review_baseline_is_active !== "boolean" ||
    (row.review_baseline_reviewed_input_catalog_version !== null &&
      (!Number.isSafeInteger(Number(row.review_baseline_reviewed_input_catalog_version)) ||
        Number(row.review_baseline_reviewed_input_catalog_version) <= 0))
  ) {
    return null;
  }
  return {
    id: row.review_id,
    taxonId,
    kind: row.review_kind,
    status: row.review_status,
    baselineIsActive: row.review_baseline_is_active,
    baselineReviewedInputCatalogVersion:
      row.review_baseline_reviewed_input_catalog_version === null
        ? null
        : Number(row.review_baseline_reviewed_input_catalog_version),
    contextFingerprint,
    revision: Number(row.review_revision),
  };
}

function normalizeStoredReviewRow(value: unknown): FactualReviewSession | null {
  if (!isRecord(value) || typeof value.taxon_id !== "string" || typeof value.context_fingerprint !== "string") {
    return null;
  }
  return normalizeReviewRpcRow(
    {
      review_id: value.id,
      review_kind: value.review_kind,
      review_status: value.status,
      review_revision: value.revision,
      review_baseline_is_active: value.baseline_is_active,
      review_baseline_reviewed_input_catalog_version:
        value.baseline_reviewed_input_catalog_version,
    },
    value.taxon_id,
    value.context_fingerprint,
  );
}

function normalizePositiveIntegerOrNull(value: unknown): number | null {
  return Number.isSafeInteger(value) && Number(value) > 0 ? Number(value) : null;
}

function serializeHumanDecision(
  decision: FactualReviewHumanDecision,
): FactualReviewHumanDecision {
  return {
    recommendationCandidateCount: decision.recommendationCandidateCount,
    recommendationSelection: decision.recommendationSelection,
    acceptedCandidates: decision.acceptedCandidates,
    rejectedCandidateIndexes: decision.rejectedCandidateIndexes,
    ownCandidate: decision.ownCandidate,
  };
}

function serializeHumanDecisionWithRecommendation(
  decision: FactualReviewHumanDecision,
  recommendationEventId: string | undefined,
  recommendationOutputFingerprint: string | undefined,
  recommendationEvaluationContextFingerprint: string | undefined,
): FactualReviewHumanDecision & Readonly<Record<string, unknown>> {
  return {
    ...serializeHumanDecision(decision),
    ...(decision.recommendationCandidateCount > 0 && recommendationEventId && recommendationOutputFingerprint && recommendationEvaluationContextFingerprint
      ? { recommendationEventId, recommendationOutputFingerprint, recommendationEvaluationContextFingerprint }
      : {}),
  };
}

function hasValidRecommendationBinding(
  decision: FactualReviewHumanDecision | null,
  recommendationEventId: string | undefined,
  recommendationOutputFingerprint: string | undefined,
  recommendationEvaluationContextFingerprint: string | undefined,
): boolean {
  if (!decision) return false;
  const hasBinding = Boolean(
    recommendationEventId ||
    recommendationOutputFingerprint ||
    recommendationEvaluationContextFingerprint,
  );
  return decision.recommendationCandidateCount > 0
    ? Boolean(
        recommendationEventId &&
        recommendationOutputFingerprint &&
        /^[0-9a-f]{64}$/.test(recommendationEvaluationContextFingerprint ?? ""),
      )
    : !hasBinding;
}

function isRecord(value: unknown): value is Record<string, any> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function failure(message: string): Readonly<{ ok: false; message: string }> {
  return { ok: false, message };
}
