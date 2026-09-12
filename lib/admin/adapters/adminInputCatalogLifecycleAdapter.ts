import "server-only";

import { createHash, randomUUID } from "node:crypto";

import {
  CURRENT_LANDING_PAGE_INPUT_CATALOG_VERSION,
  applyLandingPageInputCatalogDraftOperation,
  createNextLandingPageInputCatalogDraft,
  landingPageInputCatalogRegistry,
  listLandingPageInputCatalogVersions,
  projectLandingPageInputCatalogDraftReleaseTaxons,
  validateLandingPageInputCatalogDraftProjectedImpacts,
  validateLandingPageInputCatalogDraft,
  serializeLandingPageInputCatalogEntry,
  type LandingPageInputCatalogDraftImpact,
  type LandingPageInputCatalogDraftOperation,
  type LandingPageInputCatalogRegistryEntry,
} from "@/conversion-content/landing-page/input-catalog";
import { reconstructDraftInputCatalogEvaluationContext } from "@/conversion-content/adapters/inputCatalogEvaluationContextAdapter";
import {
  fingerprintInputCatalogEvaluationContextIdentity,
  type BuildInputCatalogEvaluationContextResult,
} from "@/conversion-content/landing-page/taxon-preparation";
import { createServiceClient } from "@/lib/supabase/service";
import {
  authorizeAdminInputCatalogFactualPublication,
  closeAdminTaxonFactualReviewWithoutChangeForCurrentCoverage,
  reconcileAdminInputCatalogFactualPublication,
  saveAdminInputCatalogDraftAndInvalidateFactualReviews,
} from "./adminTaxonFactualReviewAdapter";
import { readCompleteLifecycleContext, type LifecycleContext } from "./adminInputCatalogLifecycleContext";
import {
  collectRequiredFactualReviewTaxonIds,
  createInputCatalogLifecycleProof,
  hasCompleteFactualReviewCoverage,
  serializeInputCatalogLifecycleValue,
} from "./adminInputCatalogLifecycleValidation";

type ServiceClient = ReturnType<typeof createServiceClient>;

export type AdminInputCatalogLifecycleState = Readonly<{
  currentVersion: number;
  publishedVersions: readonly number[];
  totalActiveTaxons: number;
  draft: null | Readonly<{
    baseVersion: number;
    targetVersion: number;
    catalogJson: string;
    contentFingerprint: string;
    lifecycleContextFingerprint: string;
    revision: number;
    validationCurrent: boolean;
    publicationPrepared: boolean;
    publishedReconciliationRequired: boolean;
    publishedReconciliationAllowed: boolean;
    reviewedTaxonIds: readonly string[];
    updatedAt: string;
    impacts: readonly LandingPageInputCatalogDraftImpact[];
    totals: Readonly<{
      noMaterialChange: number;
      compatibleEvolution: number;
      reviewRequired: number;
    }>;
  }>;
  error: string | null;
}>;

export type AdminInputCatalogLifecycleMutationResult =
  | Readonly<{ ok: true; state: AdminInputCatalogLifecycleState; handoff?: string }>
  | Readonly<{
      ok: false;
      code: "INVALID_INPUT" | "CONFLICT" | "UNAVAILABLE" | "BLOCKED";
      message: string;
    }>;

export async function readAdminInputCatalogLifecycle(): Promise<AdminInputCatalogLifecycleState> {
  const client = createServiceClient();
  const early = await readDraftRow(client);
  const context = await readCandidateLifecycleContext(client, early.ok ? early.value?.catalogJson : undefined);
  if (!context.ok) return unavailableState(context.message);
  const row = await readDraftRow(client);
  if (!row.ok) return unavailableState(row.message, context);
  if (!sameDraftIdentity(early, row)) return unavailableState(DRAFT_CHANGED, context);
  return await buildState(context, row.value);
}

export async function initializeAdminInputCatalogDraft(input: Readonly<{
  actorUserId: string;
}>): Promise<AdminInputCatalogLifecycleMutationResult> {
  const client = createServiceClient();
  const draft = createNextLandingPageInputCatalogDraft();
  const context = await readCandidateLifecycleContext(client, draft);
  if (!context.ok) return unavailable(context.message);
  const candidate = validateLandingPageInputCatalogDraft({
    draft,
    taxons: context.value.taxons,
  });
  if (!candidate.ok) return blocked(candidate.error.message);
  const contentFingerprint = fingerprint(candidate.value.canonicalJson);
  const { data, error } = await client
    .from("landing_page_input_catalog_drafts")
    .insert({
      singleton: true,
      base_version: CURRENT_LANDING_PAGE_INPUT_CATALOG_VERSION,
      target_version: CURRENT_LANDING_PAGE_INPUT_CATALOG_VERSION + 1,
      catalog_json: candidate.value.entry,
      content_fingerprint: contentFingerprint,
      revision: 1,
      validation_fingerprint: null,
      validation_context_fingerprint: null,
      validated_at: null,
      publication_fingerprint: null,
      publication_context_fingerprint: null,
      publication_prepared_at: null,
      taxon_review_evidence: {},
      created_by: input.actorUserId,
      updated_by: input.actorUserId,
    })
    .select(DRAFT_SELECT)
    .maybeSingle();
  if (error?.code === "23505") return conflict("Já existe um draft administrativo.");
  const row = normalizeDraftRow(data);
  if (error || !row) return unavailable("O draft não pôde ser criado.");
  return { ok: true, state: await buildState(context, row) };
}

export async function saveAdminInputCatalogDraft(input: Readonly<{
  actorUserId: string;
  expectedRevision: number;
  catalogJson: string;
}>): Promise<AdminInputCatalogLifecycleMutationResult> {
  if (
    !Number.isSafeInteger(input.expectedRevision) ||
    input.expectedRevision <= 0 ||
    typeof input.catalogJson !== "string" ||
    input.catalogJson.length > 1_000_000
  ) {
    return invalid("O draft informado é inválido.");
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(input.catalogJson);
  } catch {
    return invalid("O draft não contém JSON válido.");
  }
  const client = createServiceClient();
  const context = await readCandidateLifecycleContext(client, parsed);
  if (!context.ok) return unavailable(context.message);
  const candidate = validateLandingPageInputCatalogDraft({
    draft: parsed,
    taxons: context.value.taxons,
  });
  if (!candidate.ok) return invalid(candidate.error.message);
  const contentFingerprint = fingerprint(candidate.value.canonicalJson);
  const saved = await saveAdminInputCatalogDraftAndInvalidateFactualReviews({
    operationId: randomUUID(),
    actorUserId: input.actorUserId,
    expectedRevision: input.expectedRevision,
    catalogJson: candidate.value.entry,
    contentFingerprint,
  });
  if (!saved.ok) return conflict(saved.message);
  const refreshed = await readDraftRow(client);
  if (!refreshed.ok || !refreshed.value || refreshed.value.revision !== saved.revision) {
    return unavailable("O draft salvo não pôde ser relido integralmente.");
  }
  return { ok: true, state: await buildState(context, refreshed.value) };
}

export async function applyAdminInputCatalogDraftOperation(input: Readonly<{
  actorUserId: string;
  expectedRevision: number;
  operation: LandingPageInputCatalogDraftOperation;
}>): Promise<AdminInputCatalogLifecycleMutationResult> {
  if (!Number.isSafeInteger(input.expectedRevision) || input.expectedRevision <= 0) {
    return invalid("A revisão esperada do draft é inválida.");
  }
  const client = createServiceClient();
  const current = await readDraftRow(client);
  if (!current.ok || !current.value) {
    return unavailable(current.ok ? "O draft não existe." : current.message);
  }
  if (current.value.revision !== input.expectedRevision) {
    return conflict("O draft mudou em outra sessão. Recarregue antes de editar.");
  }
  const context = await readCompleteLifecycleContext(client, { fingerprint: false });
  if (!context.ok) return unavailable(context.message);
  const applied = applyLandingPageInputCatalogDraftOperation({
    draft: current.value.catalogJson,
    operation: input.operation,
    taxons: context.value.taxons,
    releaseTaxonIds: context.value.unclosedReleaseTaxonIds,
  });
  if (!applied.ok) return invalid(applied.error.message);
  const contentFingerprint = fingerprint(applied.value.canonicalJson);
  const saved = await saveAdminInputCatalogDraftAndInvalidateFactualReviews({
    operationId: randomUUID(),
    actorUserId: input.actorUserId,
    expectedRevision: input.expectedRevision,
    catalogJson: applied.value.entry,
    contentFingerprint,
  });
  if (!saved.ok) return conflict(saved.message);

  const refreshedContext = await readProjectedCandidateLifecycleContext(
    client,
    applied.value.entry,
  );
  if (!refreshedContext.ok) return unavailable(refreshedContext.message);
  const refreshed = await readDraftRow(client);
  if (!refreshed.ok || !refreshed.value || refreshed.value.revision !== saved.revision) {
    return unavailable("O draft editado não pôde ser relido integralmente.");
  }
  return {
    ok: true,
    state: await buildState(refreshedContext, refreshed.value),
  };
}

export async function validateAdminInputCatalogDraft(input: Readonly<{
  actorUserId: string;
  expectedRevision: number;
}>): Promise<AdminInputCatalogLifecycleMutationResult> {
  const client = createServiceClient();
  const early = await readDraftRow(client);
  const context = await readCandidateLifecycleContext(client, early.ok ? early.value?.catalogJson : undefined);
  if (!context.ok) return unavailable(context.message);
  const current = await readDraftRow(client);
  if (!current.ok || !current.value) {
    return unavailable(current.ok ? "O draft não existe." : current.message);
  }
  if (current.value.revision !== input.expectedRevision) {
    return conflict("O draft mudou em outra sessão. Recarregue antes de validar.");
  }
  const candidate = validateLandingPageInputCatalogDraft({
    draft: current.value.catalogJson,
    taxons: context.value.taxons,
  });
  if (!candidate.ok) return blocked(candidate.error.message);
  if (!sameDraftIdentity(early, current)) return conflict(DRAFT_CHANGED);
  const proof = proofForCandidate(context.value, candidate.value);
  if (!proof) return unavailable(DRAFT_CHANGED);
  const fingerprintValue = fingerprint(candidate.value.canonicalJson);
  const lifecycleContextFingerprint = proof.fingerprint;
  if (fingerprintValue !== current.value.contentFingerprint) {
    return conflict("A identidade do draft não corresponde ao conteúdo salvo.");
  }
  const { data, error } = await client
    .from("landing_page_input_catalog_drafts")
    .update({
      validation_fingerprint: fingerprintValue,
      validation_context_fingerprint: lifecycleContextFingerprint,
      validated_at: new Date().toISOString(),
      publication_fingerprint: null,
      publication_context_fingerprint: null,
      publication_prepared_at: null,
      updated_by: input.actorUserId,
    })
    .eq("singleton", true)
    .eq("revision", input.expectedRevision)
    .eq("content_fingerprint", fingerprintValue)
    .maxAffected(1)
    .select(DRAFT_SELECT)
    .maybeSingle();
  if (error) return unavailable("A validação do draft não pôde ser registrada.");
  const row = normalizeDraftRow(data);
  if (!row) return conflict("O draft mudou durante a validação.");
  return { ok: true, state: await buildState(context, row) };
}

export async function prepareAdminInputCatalogPublication(input: Readonly<{
  actorUserId: string;
  expectedRevision: number;
}>): Promise<AdminInputCatalogLifecycleMutationResult> {
  const client = createServiceClient();
  const early = await readDraftRow(client);
  const context = await readCandidateLifecycleContext(client, early.ok ? early.value?.catalogJson : undefined);
  if (!context.ok) return unavailable(context.message);
  const current = await readDraftRow(client);
  if (!current.ok || !current.value) {
    return unavailable(current.ok ? "O draft não existe." : current.message);
  }
  if (current.value.revision !== input.expectedRevision) {
    return conflict("O draft mudou em outra sessão.");
  }
  const candidate = validateLandingPageInputCatalogDraft({
    draft: current.value.catalogJson,
    taxons: context.value.taxons,
  });
  if (!candidate.ok) return blocked(candidate.error.message);
  if (!sameDraftIdentity(early, current)) return conflict(DRAFT_CHANGED);
  const proof = proofForCandidate(context.value, candidate.value);
  if (!proof) return unavailable(DRAFT_CHANGED);
  const fingerprintValue = fingerprint(candidate.value.canonicalJson);
  const lifecycleContextFingerprint = proof.fingerprint;
  if (
    current.value.validationFingerprint !== fingerprintValue ||
    current.value.validationContextFingerprint !== lifecycleContextFingerprint ||
    current.value.contentFingerprint !== fingerprintValue
  ) {
    return blocked("Valide novamente o conteúdo exato antes de preparar a publicação.");
  }
  const requiredTaxonIds = requiredFactualReviewTaxonIds(candidate.value, context.value);
  const reviewStatus = await validateReviewEvidence(
    candidate.value,
    current.value,
    requiredTaxonIds,
  );
  if (!hasCompleteFactualReviewCoverage({
    requiredTaxonIds,
    evidenceTaxonIds: reviewStatus.validTaxonIds,
  })) {
    return blocked("Todas as decisões factuais do draft exato são obrigatórias antes da autorização.");
  }
  const authorized = await authorizeAdminInputCatalogFactualPublication({
    operationId: randomUUID(),
    actorUserId: input.actorUserId,
    expectedRevision: input.expectedRevision,
    contentFingerprint: fingerprintValue,
    contextFingerprint: lifecycleContextFingerprint,
    requiredTaxonIds,
  });
  if (!authorized.ok) return blocked(authorized.message);
  const refreshed = await readDraftRow(client);
  if (!refreshed.ok || !refreshed.value) {
    return unavailable("O draft autorizado não pôde ser relido.");
  }
  const row = refreshed.value;
  return {
    ok: true,
    state: await buildState(context, row),
    handoff: buildPublicationHandoff(
      row,
      candidate.value.canonicalJson,
      lifecycleContextFingerprint,
    ),
  };
}

export async function reconcileAdminInputCatalogPublishedDraft(input: Readonly<{
  actorUserId: string;
  expectedRevision: number;
  runtimeEnvironment: string | undefined;
}>): Promise<AdminInputCatalogLifecycleMutationResult> {
  if (input.runtimeEnvironment !== "production") {
    return blocked("A reconciliação do draft só pode ocorrer no runtime de Production.");
  }
  if (!Number.isSafeInteger(input.expectedRevision) || input.expectedRevision <= 0) {
    return invalid("A revisão administrativa do draft é inválida.");
  }
  const client = createServiceClient();
  const current = await readDraftRow(client);
  if (!current.ok) return unavailable(current.message);
  if (!current.value) return unavailable("O draft não existe.");
  const currentEntry = landingPageInputCatalogRegistry[
    CURRENT_LANDING_PAGE_INPUT_CATALOG_VERSION
  ];
  const deployedFingerprint = fingerprint(
    serializeLandingPageInputCatalogEntry(currentEntry),
  );
  const storedDraftFingerprint = fingerprint(
    serializeLandingPageInputCatalogEntry(
      current.value.catalogJson as LandingPageInputCatalogRegistryEntry,
    ),
  );
  if (
    current.value.revision !== input.expectedRevision ||
    current.value.targetVersion !== CURRENT_LANDING_PAGE_INPUT_CATALOG_VERSION ||
    current.value.baseVersion !== CURRENT_LANDING_PAGE_INPUT_CATALOG_VERSION - 1 ||
    storedDraftFingerprint !== deployedFingerprint ||
    current.value.contentFingerprint !== deployedFingerprint ||
    current.value.publicationFingerprint !== deployedFingerprint ||
    current.value.publicationContextFingerprint === null
  ) {
    return blocked(
      "O registry implantado ainda não comprova exatamente o draft congelado.",
    );
  }

  const reconciled = await reconcileAdminInputCatalogFactualPublication({
    operationId: randomUUID(),
    actorUserId: input.actorUserId,
    expectedRevision: input.expectedRevision,
    deployedVersion: CURRENT_LANDING_PAGE_INPUT_CATALOG_VERSION,
    deployedContentFingerprint: deployedFingerprint,
    publicationContextFingerprint: current.value.publicationContextFingerprint,
  });
  if (!reconciled.ok) return conflict(reconciled.message);
  const finalContext = await readCompleteLifecycleContext(client);
  if (!finalContext.ok) return unavailable(finalContext.message);
  return {
    ok: true,
    state: await buildState(finalContext, null),
    handoff: `Versão ${CURRENT_LANDING_PAGE_INPUT_CATALOG_VERSION} reconciliada atomicamente com ${reconciled.reconciledTaxonCount} sessão(ões) factual(is); a residência temporária foi encerrada.`,
  };
}

export async function loadAdminInputCatalogDraftEvaluationContext(input: Readonly<{
  expectedRevision: number;
  taxonId: string;
  mode?: import("@/conversion-content/landing-page/taxon-preparation").InputCatalogEvaluationMode;
}>): Promise<
  | Readonly<{
      ok: true;
      value: Readonly<{
        context: Extract<BuildInputCatalogEvaluationContextResult, { ok: true }>["value"];
        contentFingerprint: string;
        targetVersion: number;
      }>;
    }>
  | Readonly<{ ok: false; message: string }>
> {
  if (!Number.isSafeInteger(input.expectedRevision) || input.expectedRevision <= 0) {
    return { ok: false, message: "A revisão administrativa do draft é inválida." };
  }
  const client = createServiceClient();
  const [context, row] = await Promise.all([
    readCompleteLifecycleContext(client),
    readDraftRow(client),
  ]);
  if (!context.ok || !row.ok || !row.value) {
    return { ok: false, message: "O draft ou seu contexto administrativo está indisponível." };
  }
  if (row.value.revision !== input.expectedRevision) {
    return { ok: false, message: "O draft mudou; recarregue antes de avaliar." };
  }
  const candidate = validateLandingPageInputCatalogDraft({
    draft: row.value.catalogJson,
    taxons: context.value.taxons,
  });
  if (!candidate.ok) return { ok: false, message: candidate.error.message };
  const impact = candidate.value.impacts.find(
    (candidateImpact) => candidateImpact.taxon.id === input.taxonId,
  );
  if (
    (!impact || impact.classification !== "review_required") &&
    !context.value.unclosedReleaseTaxonIds.includes(input.taxonId)
  ) {
    return {
      ok: false,
      message: "O taxon não exige avaliação semântica para o conteúdo atual do draft.",
    };
  }
  const evaluation = await reconstructDraftInputCatalogEvaluationContext(
    {
      taxonId: input.taxonId,
      inputCatalogVersion: candidate.value.entry.version,
      mode: input.mode,
    },
    candidate.value.registry,
  );
  if (!evaluation.ok) return { ok: false, message: evaluation.error.message };
  return {
    ok: true,
    value: Object.freeze({
      context: evaluation.value,
      contentFingerprint: row.value.contentFingerprint,
      targetVersion: row.value.targetVersion,
    }),
  };
}

export async function recordAdminInputCatalogDraftSufficiencyDecision(input: Readonly<{
  actorUserId: string;
  expectedRevision: number;
  taxonId: string;
  expectedContentFingerprint: string;
  expectedEvaluationContextFingerprint: string;
  decision: "confirm_sufficient" | "reject_candidates_and_confirm_sufficient";
  recommendationCandidateCount?: number;
  recommendationEventId?: string;
  recommendationOutputFingerprint?: string;
  recommendationEvaluationContextFingerprint?: string;
  mode?: import("@/conversion-content/landing-page/taxon-preparation").InputCatalogEvaluationMode;
}>): Promise<Readonly<{
  ok: true;
  revision: number;
  reviewedVersion: number;
}> | Readonly<{ ok: false; message: string }>> {
  const current = await loadAdminInputCatalogDraftEvaluationContext({
    expectedRevision: input.expectedRevision,
    taxonId: input.taxonId,
    mode: input.mode,
  });
  if (!current.ok) return current;
  const contextFingerprint = fingerprintInputCatalogEvaluationContextIdentity(
    current.value.context.identity,
  );
  if (
    current.value.contentFingerprint !== input.expectedContentFingerprint ||
    contextFingerprint !== input.expectedEvaluationContextFingerprint
  ) {
    return { ok: false, message: "O draft, a pesquisa ou a cadeia mudaram desde a avaliação." };
  }
  const client = createServiceClient();
  const row = await readDraftRow(client);
  if (!row.ok || !row.value || row.value.revision !== input.expectedRevision) {
    return { ok: false, message: "O draft mudou durante a decisão." };
  }
  const recommendationCandidateCount = input.decision === "confirm_sufficient"
    ? 0
    : input.recommendationCandidateCount;
  if (
    !Number.isSafeInteger(recommendationCandidateCount) ||
    Number(recommendationCandidateCount) < 0 ||
    Number(recommendationCandidateCount) > 100 ||
    (Number(recommendationCandidateCount) > 0 &&
      (!input.recommendationEventId ||
        !input.recommendationOutputFingerprint ||
        !input.recommendationEvaluationContextFingerprint)) ||
    (Number(recommendationCandidateCount) === 0 &&
      Boolean(
        input.recommendationEventId ||
        input.recommendationOutputFingerprint ||
        input.recommendationEvaluationContextFingerprint,
      ))
  ) {
    return { ok: false, message: "A quantidade de recomendações rejeitadas é inválida." };
  }
  const { data: reviewRow, error: reviewError } = await client
    .from("business_taxon_factual_reviews")
    .select("id,revision,context_fingerprint")
    .eq("taxon_id", input.taxonId)
    .eq("status", "open")
    .limit(1)
    .maybeSingle();
  if (
    reviewError ||
    !isRecord(reviewRow) ||
    typeof reviewRow.id !== "string" ||
    !Number.isSafeInteger(Number(reviewRow.revision)) ||
    typeof reviewRow.context_fingerprint !== "string"
  ) {
    return { ok: false, message: "Abra uma sessão factual antes de decidir sobre o draft." };
  }
  const recorded = await closeAdminTaxonFactualReviewWithoutChangeForCurrentCoverage({
    reviewId: reviewRow.id,
    operationId: randomUUID(),
    actorUserId: input.actorUserId,
    taxonId: input.taxonId,
    expectedRevision: Number(reviewRow.revision),
    expectedContextFingerprint: reviewRow.context_fingerprint,
    recommendationEventId: input.recommendationEventId,
    recommendationOutputFingerprint: input.recommendationOutputFingerprint,
    recommendationEvaluationContextFingerprint:
      input.recommendationEvaluationContextFingerprint,
    humanDecision: {
      recommendationCandidateCount: Number(recommendationCandidateCount),
      recommendationSelection: "zero",
      acceptedCandidates: [],
      rejectedCandidateIndexes: Array.from(
        { length: Number(recommendationCandidateCount) },
        (_, index) => index,
      ),
      ownCandidate: null,
    },
  });
  if (!recorded.ok) return recorded;
  return {
    ok: true,
    revision: row.value.revision,
    reviewedVersion: recorded.value.coverage.inputCatalogVersion,
  };
}

type DraftRow = Readonly<{
  baseVersion: number;
  targetVersion: number;
  catalogJson: unknown;
  contentFingerprint: string;
  revision: number;
  validationFingerprint: string | null;
  validationContextFingerprint: string | null;
  publicationFingerprint: string | null;
  publicationContextFingerprint: string | null;
  taxonReviewEvidence: Readonly<Record<string, DraftTaxonReviewEvidence>>;
  updatedAt: string;
}>;

type DraftTaxonReviewEvidence = Readonly<{
  reviewId: string;
  decisionEventId: string;
  draftRevision: number;
  contentFingerprint: string;
  contextFingerprint: string;
}>;

const DRAFT_SELECT =
  "base_version,target_version,catalog_json,content_fingerprint,revision,validation_fingerprint,validation_context_fingerprint,publication_fingerprint,publication_context_fingerprint,taxon_review_evidence,updated_at";

const DRAFT_CHANGED = "O draft mudou durante a leitura do contexto. Recarregue antes de continuar.";

async function readCandidateLifecycleContext(client: ServiceClient, draft: unknown) {
  if (draft === undefined) {
    return readCompleteLifecycleContext(client, { fingerprint: false });
  }
  const projected = await readProjectedCandidateLifecycleContext(client, draft);
  return projected.ok
    ? { ok: true as const, value: projected.value }
    : projected;
}

async function readProjectedCandidateLifecycleContext(
  client: ServiceClient,
  draft: unknown,
): Promise<
  | Readonly<{
      ok: true;
      value: LifecycleContext;
    }>
  | Readonly<{ ok: false; message: string }>
> {
  const context = await readCompleteLifecycleContext(client, { fingerprint: false });
  if (!context.ok) return context;
  const projection = projectLandingPageInputCatalogDraftReleaseTaxons({
    taxons: context.value.taxons,
    releaseTaxonIds: context.value.unclosedReleaseTaxonIds,
  });
  if (!projection.ok) return { ok: false, message: projection.error.message };
  const candidate = validateLandingPageInputCatalogDraftProjectedImpacts({
    draft,
    taxons: projection.value,
    projectedTaxonIds: context.value.unclosedReleaseTaxonIds,
  });
  if (!candidate.ok) return { ok: false, message: candidate.error.message };
  const projectedContext = {
    taxons: projection.value,
    unclosedReleaseTaxonIds: context.value.unclosedReleaseTaxonIds,
  };
  return {
    ok: true,
    value: {
      ...projectedContext,
      lifecycleProof: createInputCatalogLifecycleProof({
        fingerprint: true,
        candidate: candidate.value,
      }).finish(projectedContext),
    },
  };
}

function sameDraftIdentity(
  early: Awaited<ReturnType<typeof readDraftRow>>,
  current: Awaited<ReturnType<typeof readDraftRow>>,
): boolean {
  if (!early.ok || !current.ok) return false;
  if (!early.value || !current.value) return early.value === current.value;
  return early.value.baseVersion === current.value.baseVersion &&
    early.value.targetVersion === current.value.targetVersion &&
    early.value.revision === current.value.revision &&
    early.value.contentFingerprint === current.value.contentFingerprint &&
    serializeInputCatalogLifecycleValue(early.value.catalogJson) ===
      serializeInputCatalogLifecycleValue(current.value.catalogJson);
}

function proofForCandidate(
  context: LifecycleContext,
  candidate: Extract<ReturnType<typeof validateLandingPageInputCatalogDraft>, { ok: true }>["value"],
) {
  const proof = context.lifecycleProof;
  if (!proof || proof.candidateContentFingerprint !== fingerprint(candidate.canonicalJson)) {
    return null;
  }
  return proof;
}

async function readDraftRow(
  client: ServiceClient,
): Promise<
  | Readonly<{ ok: true; value: DraftRow | null }>
  | Readonly<{ ok: false; message: string }>
> {
  const { data, error } = await client
    .from("landing_page_input_catalog_drafts")
    .select(DRAFT_SELECT)
    .eq("singleton", true)
    .limit(1)
    .maybeSingle();
  if (error) return { ok: false, message: "A residência do draft está indisponível." };
  if (!data) return { ok: true, value: null };
  const row = normalizeDraftRow(data);
  return row
    ? { ok: true, value: row }
    : { ok: false, message: "A residência do draft contém estado inválido." };
}

async function buildState(
  contextResult: Extract<Awaited<ReturnType<typeof readCompleteLifecycleContext>>, { ok: true }> | LifecycleContext,
  row: DraftRow | null,
): Promise<AdminInputCatalogLifecycleState> {
  const context = "value" in contextResult ? contextResult.value : contextResult;
  const releaseTaxonIds = new Set(context.unclosedReleaseTaxonIds);
  const totalActiveTaxons = context.taxons.filter(
    (taxon) => taxon.identity.isActive && !releaseTaxonIds.has(taxon.identity.id),
  ).length;
  if (!row) {
    return {
      currentVersion: CURRENT_LANDING_PAGE_INPUT_CATALOG_VERSION,
      publishedVersions: listLandingPageInputCatalogVersions(),
      totalActiveTaxons,
      draft: null,
      error: null,
    };
  }
  const lifecycleContextFingerprint = context.lifecycleProof?.fingerprint ?? "";
  if (row.targetVersion === CURRENT_LANDING_PAGE_INPUT_CATALOG_VERSION) {
    const deployedFingerprint = fingerprint(
      serializeLandingPageInputCatalogEntry(
        landingPageInputCatalogRegistry[CURRENT_LANDING_PAGE_INPUT_CATALOG_VERSION],
      ),
    );
    const storedDraftFingerprint = fingerprint(
      serializeLandingPageInputCatalogEntry(
        row.catalogJson as LandingPageInputCatalogRegistryEntry,
      ),
    );
    if (
      row.baseVersion !== CURRENT_LANDING_PAGE_INPUT_CATALOG_VERSION - 1 ||
      storedDraftFingerprint !== deployedFingerprint ||
      row.contentFingerprint !== deployedFingerprint ||
      row.publicationFingerprint !== deployedFingerprint ||
      row.publicationContextFingerprint === null
    ) {
      return unavailableState(
        "O draft implantado diverge do registry atual e não pode ser reconciliado automaticamente.",
        { ok: true, value: context },
      );
    }
    return {
      currentVersion: CURRENT_LANDING_PAGE_INPUT_CATALOG_VERSION,
      publishedVersions: listLandingPageInputCatalogVersions(),
      totalActiveTaxons,
      draft: {
        baseVersion: row.baseVersion,
        targetVersion: row.targetVersion,
        catalogJson: JSON.stringify(row.catalogJson, null, 2),
        contentFingerprint: row.contentFingerprint,
        lifecycleContextFingerprint,
        revision: row.revision,
        validationCurrent: row.validationFingerprint === row.contentFingerprint,
        publicationPrepared: true,
        publishedReconciliationRequired: true,
        publishedReconciliationAllowed: process.env.VERCEL_ENV === "production",
        reviewedTaxonIds: Object.keys(row.taxonReviewEvidence).sort(),
        updatedAt: row.updatedAt,
        impacts: [],
        totals: {
          noMaterialChange: 0,
          compatibleEvolution: 0,
          reviewRequired: 0,
        },
      },
      error: null,
    };
  }
  if (row.baseVersion !== CURRENT_LANDING_PAGE_INPUT_CATALOG_VERSION) {
    return unavailableState(
      "A residência temporária não corresponde à versão atual nem ao próximo draft sequencial.",
      { ok: true, value: context },
    );
  }
  const projectedReleaseTaxonIds = context.unclosedReleaseTaxonIds.filter((taxonId) =>
    context.taxons.some(
      (taxon) => taxon.identity.id === taxonId && taxon.identity.isActive,
    ),
  );
  if (
    projectedReleaseTaxonIds.length > 0 &&
    projectedReleaseTaxonIds.length !== context.unclosedReleaseTaxonIds.length
  ) {
    return unavailableState(
      "A projeção das releases está incompleta.",
      { ok: true, value: context },
    );
  }
  const candidate = projectedReleaseTaxonIds.length > 0
    ? validateLandingPageInputCatalogDraftProjectedImpacts({
        draft: row.catalogJson,
        taxons: context.taxons,
        projectedTaxonIds: projectedReleaseTaxonIds,
      })
    : validateLandingPageInputCatalogDraft({
        draft: row.catalogJson,
        taxons: context.taxons,
      });
  if (!candidate.ok) return unavailableState(candidate.error.message, { ok: true, value: context });
  const proof = proofForCandidate(context, candidate.value);
  if (!proof) return unavailableState(DRAFT_CHANGED, { ok: true, value: context });
  const reviewStatus = await validateReviewEvidence(
    candidate.value,
    row,
    requiredFactualReviewTaxonIds(candidate.value, context),
  );
  return {
    currentVersion: CURRENT_LANDING_PAGE_INPUT_CATALOG_VERSION,
    publishedVersions: listLandingPageInputCatalogVersions(),
    totalActiveTaxons,
    draft: {
      baseVersion: row.baseVersion,
      targetVersion: row.targetVersion,
      catalogJson: JSON.stringify(row.catalogJson, null, 2),
      contentFingerprint: row.contentFingerprint,
      lifecycleContextFingerprint,
      revision: row.revision,
      validationCurrent:
        row.validationFingerprint === row.contentFingerprint &&
        row.validationContextFingerprint === lifecycleContextFingerprint,
      publicationPrepared:
        row.publicationFingerprint === row.contentFingerprint &&
        row.publicationContextFingerprint === lifecycleContextFingerprint,
      publishedReconciliationRequired: false,
      publishedReconciliationAllowed: false,
      reviewedTaxonIds: reviewStatus.validTaxonIds,
      updatedAt: row.updatedAt,
      impacts: candidate.value.impacts,
      totals: {
        ...candidate.value.totals,
      },
    },
    error: null,
  };
}

async function validateReviewEvidence(
  candidate: Extract<
    ReturnType<typeof validateLandingPageInputCatalogDraft>,
    { ok: true }
  >["value"],
  row: DraftRow,
  requiredTaxonIds: readonly string[],
): Promise<Readonly<{ validTaxonIds: readonly string[] }>> {
  const client = createServiceClient();
  const validTaxonIds: string[] = [];
  for (const taxonId of requiredTaxonIds) {
    const evidence = row.taxonReviewEvidence[taxonId];
    if (
      !evidence ||
      evidence.draftRevision !== row.revision ||
      evidence.contentFingerprint !== row.contentFingerprint
    ) {
      continue;
    }
    const [{ data: review }, { data: decision }] = await Promise.all([
      client
        .from("business_taxon_factual_reviews")
        .select("id,taxon_id,status,draft_revision,draft_content_fingerprint,draft_context_fingerprint")
        .eq("id", evidence.reviewId)
        .maybeSingle(),
      client
        .from("business_taxon_factual_review_events")
        .select("id,review_id,event_kind,decision_kind,context_fingerprint,content_fingerprint")
        .eq("id", evidence.decisionEventId)
        .maybeSingle(),
    ]);
    if (
      !isRecord(review) ||
      review.taxon_id !== taxonId ||
      review.status !== "awaiting_catalog_publication" ||
      Number(review.draft_revision) !== row.revision ||
      review.draft_content_fingerprint !== row.contentFingerprint ||
      review.draft_context_fingerprint !== evidence.contextFingerprint ||
      !isRecord(decision) ||
      decision.review_id !== evidence.reviewId ||
      decision.event_kind !== "decision_recorded" ||
      decision.decision_kind !== "catalog_change" ||
      decision.context_fingerprint !== evidence.contextFingerprint ||
      decision.content_fingerprint !== row.contentFingerprint
    ) {
      continue;
    }
    const current = await reconstructDraftInputCatalogEvaluationContext(
      { taxonId, inputCatalogVersion: candidate.entry.version },
      candidate.registry,
    );
    if (
      !current.ok ||
      fingerprintInputCatalogEvaluationContextIdentity(current.value.identity) !==
        evidence.contextFingerprint
    ) {
      continue;
    }
    validTaxonIds.push(taxonId);
  }
  return Object.freeze({
    validTaxonIds: Object.freeze(validTaxonIds.sort()),
  });
}

function requiredFactualReviewTaxonIds(
  candidate: Extract<
    ReturnType<typeof validateLandingPageInputCatalogDraft>,
    { ok: true }
  >["value"],
  context: LifecycleContext,
): readonly string[] {
  return collectRequiredFactualReviewTaxonIds({
    activeReviewRequiredTaxonIds: candidate.impacts
      .filter((impact) => impact.classification === "review_required")
      .map((impact) => impact.taxon.id),
    unclosedReleaseTaxonIds: context.unclosedReleaseTaxonIds,
  });
}

function normalizeDraftRow(value: unknown): DraftRow | null {
  if (!isRecord(value)) return null;
  if (
    !Number.isSafeInteger(value.base_version) ||
    !Number.isSafeInteger(value.target_version) ||
    value.target_version !== Number(value.base_version) + 1 ||
    !isRecord(value.catalog_json) ||
    typeof value.content_fingerprint !== "string" ||
    !/^[0-9a-f]{64}$/.test(value.content_fingerprint) ||
    !Number.isSafeInteger(value.revision) ||
    Number(value.revision) <= 0 ||
    (value.validation_fingerprint !== null &&
      (typeof value.validation_fingerprint !== "string" ||
        !/^[0-9a-f]{64}$/.test(value.validation_fingerprint))) ||
    (value.validation_context_fingerprint !== null &&
      (typeof value.validation_context_fingerprint !== "string" ||
        !/^[0-9a-f]{64}$/.test(value.validation_context_fingerprint))) ||
    (value.publication_fingerprint !== null &&
      (typeof value.publication_fingerprint !== "string" ||
        !/^[0-9a-f]{64}$/.test(value.publication_fingerprint))) ||
    (value.publication_context_fingerprint !== null &&
      (typeof value.publication_context_fingerprint !== "string" ||
        !/^[0-9a-f]{64}$/.test(value.publication_context_fingerprint))) ||
    typeof value.updated_at !== "string"
  ) return null;
  const taxonReviewEvidence = normalizeDraftTaxonReviewEvidence(
    value.taxon_review_evidence,
  );
  if (!taxonReviewEvidence) return null;
  return {
    baseVersion: value.base_version as number,
    targetVersion: value.target_version as number,
    catalogJson: value.catalog_json,
    contentFingerprint: value.content_fingerprint,
    revision: value.revision as number,
    validationFingerprint: value.validation_fingerprint as string | null,
    validationContextFingerprint:
      value.validation_context_fingerprint as string | null,
    publicationFingerprint: value.publication_fingerprint as string | null,
    publicationContextFingerprint:
      value.publication_context_fingerprint as string | null,
    taxonReviewEvidence,
    updatedAt: value.updated_at,
  };
}

function normalizeDraftTaxonReviewEvidence(
  value: unknown,
): Readonly<Record<string, DraftTaxonReviewEvidence>> | null {
  if (!isRecord(value)) return null;
  const normalized: Record<string, DraftTaxonReviewEvidence> = {};
  for (const [taxonId, raw] of Object.entries(value)) {
    if (
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(taxonId) ||
      !isRecord(raw) ||
      typeof raw.review_id !== "string" ||
      typeof raw.decision_event_id !== "string" ||
      !Number.isSafeInteger(raw.draft_revision) ||
      Number(raw.draft_revision) <= 0 ||
      typeof raw.content_fingerprint !== "string" ||
      !/^[0-9a-f]{64}$/.test(raw.content_fingerprint) ||
      typeof raw.context_fingerprint !== "string" ||
      !/^[0-9a-f]{64}$/.test(raw.context_fingerprint)
    ) return null;
    normalized[taxonId] = Object.freeze({
      reviewId: raw.review_id,
      decisionEventId: raw.decision_event_id,
      draftRevision: Number(raw.draft_revision),
      contentFingerprint: raw.content_fingerprint,
      contextFingerprint: raw.context_fingerprint,
    });
  }
  return Object.freeze(normalized);
}

function buildPublicationHandoff(
  row: DraftRow,
  canonicalJson: string,
  lifecycleContextFingerprint: string,
): string {
  return [
    `E20.2.8 — materializar versão ${row.targetVersion} no registry repo-only`,
    `Base publicada: ${row.baseVersion}`,
    `Fingerprint do conteúdo SHA-256: ${row.contentFingerprint}`,
    `Fingerprint do contexto E20 SHA-256: ${lifecycleContextFingerprint}`,
    "",
    "Instruções vinculantes:",
    "- materializar este conteúdo como nova versão imutável no registry;",
    "- alterar a declaração explícita de versão atual no mesmo diff;",
    "- imediatamente antes da revisão/merge, reabrir o Admin e comprovar que validação e handoff continuam atuais para estes dois fingerprints;",
    "- validar CI/Preview e obter revisão/merge humanos;",
    "- somente o deploy de Production torna a versão atual observável;",
    "- não copiar este draft para uma autoridade publicada em banco.",
    "",
    canonicalJson,
  ].join("\n");
}

function fingerprint(canonicalJson: string): string {
  return createHash("sha256").update(canonicalJson).digest("hex");
}

function unavailableState(
  message: string,
  context?: Extract<Awaited<ReturnType<typeof readCompleteLifecycleContext>>, { ok: true }>,
): AdminInputCatalogLifecycleState {
  return {
    currentVersion: CURRENT_LANDING_PAGE_INPUT_CATALOG_VERSION,
    publishedVersions: listLandingPageInputCatalogVersions(),
    totalActiveTaxons: context?.value.taxons.length ?? 0,
    draft: null,
    error: message,
  };
}

function invalid(message: string): AdminInputCatalogLifecycleMutationResult {
  return { ok: false, code: "INVALID_INPUT", message };
}

function conflict(message: string): AdminInputCatalogLifecycleMutationResult {
  return { ok: false, code: "CONFLICT", message };
}

function unavailable(message: string): AdminInputCatalogLifecycleMutationResult {
  return { ok: false, code: "UNAVAILABLE", message };
}

function blocked(message: string): AdminInputCatalogLifecycleMutationResult {
  return { ok: false, code: "BLOCKED", message };
}

function isRecord(value: unknown): value is Record<string, any> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
