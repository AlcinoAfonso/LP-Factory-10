"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requirePlatformAdmin } from "@/lib/access/guards";
import { reconstructCanonicalInputCatalogEvaluationContext } from "@/conversion-content/adapters/inputCatalogEvaluationContextAdapter";
import { evaluateInputCatalogWithOpenAi } from "@/conversion-content/adapters/inputCatalogEvaluationOpenAiAdapter";
import { resolveInputCatalogEvaluationRuntimeReadiness } from "@/conversion-content/adapters/inputCatalogEvaluationRuntimeGate";
import {
  coordinateInputCatalogEvaluation,
  fingerprintInputCatalogEvaluationContextIdentity,
  fingerprintInputCatalogEvaluationOutput,
  normalizeFactualReviewCatalogChangeDecision,
  type FactualReviewDecisionLayer,
  revalidateInputCatalogEvaluationContext,
  type InputCatalogEvaluationMode,
  type InputCatalogEvaluationOutput,
} from "@/conversion-content/landing-page/taxon-preparation";
import { CURRENT_LANDING_PAGE_INPUT_CATALOG_VERSION } from "@/conversion-content/landing-page/input-catalog";
import {
  loadAdminInputCatalogDraftEvaluationContext,
  recordAdminInputCatalogDraftHumanDecision,
} from "@/lib/admin/adapters/adminInputCatalogLifecycleAdapter";
import {
  appendAdminTaxonFactualEvaluationEvent,
  closeAdminTaxonFactualReviewWithoutChangeForCurrentCoverage,
  loadAdminTaxonFactualEvaluationEvidence,
  loadLatestAdminTaxonFactualReview,
  loadOpenAdminTaxonFactualReview,
  openAdminTaxonFactualReview,
} from "@/lib/admin/adapters/adminTaxonFactualReviewAdapter";
import {
  addAdminTaxonAlias,
  createAdminTaxon,
  deleteAdminTaxon,
  deleteAdminTaxonAlias,
  selectAdminEndCustomerResearchVersion,
  updateAdminTaxon,
} from "@/lib/admin/adapters/adminReadOnlyAdapter";

export type CreateTaxonActionState = {
  error: string | null;
};

export type ManageTaxonActionState = {
  error: string | null;
};

export type SelectEndCustomerResearchActionState = {
  error: string | null;
  selectedVersion: number | null;
};

export type FactualReviewLifecycleActionState = {
  error: string | null;
  message: string | null;
  revision: number;
};

export type InputCatalogEvaluationReference = Readonly<{
  taxonId?: string;
  reviewId?: string;
  reviewRevision?: number;
  reviewContextFingerprint?: string;
  evaluationContextFingerprint?: string;
  recommendationEventId?: string;
  outputFingerprint?: string;
  source?: "published" | "draft";
  draftRevision?: number;
  draftContentFingerprint?: string;
}>;

export type InputCatalogEvaluationActionResult =
  | Readonly<{
      ok: true;
      output: InputCatalogEvaluationOutput;
      reference: InputCatalogEvaluationReference;
    }>
  | Readonly<{ ok: false; code: string; message: string }>;

export type InputCatalogHumanDecisionActionResult =
  | Readonly<{ ok: true; decisionKind: "no_change" | "catalog_change"; reviewedVersion: number }>
  | Readonly<{ ok: false; stale: boolean; message: string }>;

export async function evaluateInputCatalogAction(input: Readonly<{
  taxonId: string;
  inputCatalogVersion: number;
  mode: InputCatalogEvaluationMode;
  focalHypothesis: string | null;
  feedback: Readonly<{
    text: string;
    previousOutput: InputCatalogEvaluationOutput;
    reference: InputCatalogEvaluationReference;
  }> | null;
  draftRevision?: number;
}>): Promise<InputCatalogEvaluationActionResult> {
  const evaluationDeadlineAtMs = Date.now() + 45_000;
  const gate = await requirePlatformAdmin();
  if (!gate.allowed) {
    return { ok: false, code: "UNAUTHORIZED", message: "Acesso administrativo não autorizado." };
  }

  const runtime = await resolveInputCatalogEvaluationRuntimeReadiness();
  if (!runtime.ok) {
    return { ok: false, code: runtime.code, message: runtime.message };
  }

  const source = input.draftRevision === undefined ? "published" : "draft";
  let draftContentFingerprint: string | undefined;
  const baseReconstructContext: typeof reconstructCanonicalInputCatalogEvaluationContext =
    source === "published"
      ? reconstructCanonicalInputCatalogEvaluationContext
      : async (reconstructionInput) => {
          const draft = await loadAdminInputCatalogDraftEvaluationContext({
            expectedRevision: input.draftRevision as number,
            taxonId: reconstructionInput.taxonId,
            mode: reconstructionInput.mode,
          });
          if (!draft.ok || draft.value.targetVersion !== reconstructionInput.inputCatalogVersion) {
            return {
              ok: false as const,
              error: {
                code: "CONTEXT_IDENTITY_INVALID" as const,
                message: draft.ok
                  ? "A versão solicitada não corresponde ao draft atual."
                  : draft.message,
              },
            };
          }
          draftContentFingerprint = draft.value.contentFingerprint;
          return { ok: true as const, value: draft.value.context };
        };
  let cachedReconstruction:
    | Readonly<{
        key: string;
        value: Awaited<ReturnType<typeof reconstructCanonicalInputCatalogEvaluationContext>>;
      }>
    | undefined;
  const reconstructContext: typeof reconstructCanonicalInputCatalogEvaluationContext = async (
    reconstructionInput,
  ) => {
    const key = JSON.stringify(reconstructionInput);
    if (cachedReconstruction?.key === key) return cachedReconstruction.value;
    const value = await baseReconstructContext(reconstructionInput);
    cachedReconstruction = { key, value };
    return value;
  };

  let feedback: Parameters<typeof coordinateInputCatalogEvaluation>[0]["feedback"] = null;
  if (input.feedback) {
    const previousEventId = input.feedback.reference.recommendationEventId;
    const previousReviewId = input.feedback.reference.reviewId;
    const previousOutputFingerprint = input.feedback.reference.outputFingerprint;
    const previousEvaluationContextFingerprint =
      input.feedback.reference.evaluationContextFingerprint;
    if (
      !previousEventId ||
      !previousReviewId ||
      !previousOutputFingerprint ||
      !previousEvaluationContextFingerprint
    ) {
      return {
        ok: false,
        code: "CONTEXT_STALE",
        message: "A referência factual da avaliação anterior está incompleta.",
      };
    }
    const previousPersisted = await loadAdminTaxonFactualEvaluationEvidence({
      reviewId: previousReviewId,
      eventId: previousEventId,
      outputFingerprint: previousOutputFingerprint,
      evaluationContextFingerprint: previousEvaluationContextFingerprint,
      output: input.feedback.previousOutput,
    });
    const previousEvidence = previousPersisted.ok ? previousPersisted.evidence : null;
    if (
      !previousEvidence ||
      previousEvidence.taxonId !== input.taxonId ||
      previousEvidence.inputCatalogVersion !== input.inputCatalogVersion ||
      (input.feedback.reference.source ?? "published") !== source ||
      (source === "draft" && input.feedback.reference.draftRevision !== input.draftRevision) ||
      previousEvidence.status !== input.feedback.previousOutput.status ||
      fingerprintInputCatalogEvaluationOutput(input.feedback.previousOutput) !==
        previousEvidence.outputFingerprint
    ) {
      return {
        ok: false,
        code: "CONTEXT_STALE",
        message: "O contexto da avaliação anterior não corresponde à execução atual.",
      };
    }
    const previousContext = await reconstructContext({
      taxonId: previousEvidence.taxonId,
      inputCatalogVersion: previousEvidence.inputCatalogVersion,
      mode: input.mode,
    });
    if (
      !previousContext.ok ||
      fingerprintInputCatalogEvaluationContextIdentity(previousContext.value.identity) !==
        previousEvidence.evaluationContextFingerprint
    ) {
      return {
        ok: false,
        code: "CONTEXT_STALE",
        message: previousContext.ok
          ? "As fontes mudaram desde a avaliação anterior."
          : previousContext.error.message,
      };
    }
    feedback = {
      text: input.feedback.text,
      previousOutput: input.feedback.previousOutput,
      previousContextIdentity: previousContext.value.identity,
    };
  }

  const requestedContext = await reconstructContext({
    taxonId: input.taxonId,
    inputCatalogVersion: input.inputCatalogVersion,
    mode: input.mode,
  });
  if (!requestedContext.ok) {
    return {
      ok: false,
      code: requestedContext.error.code,
      message: requestedContext.error.message,
    };
  }
  const requestedEvaluationContextFingerprint =
    fingerprintInputCatalogEvaluationContextIdentity(requestedContext.value.identity);
  const factualReview = await loadOpenAdminTaxonFactualReview(input.taxonId);
  if (!factualReview.ok) {
    return { ok: false, code: "FACTUAL_REVIEW_REQUIRED", message: factualReview.message };
  }
  if (Date.now() >= evaluationDeadlineAtMs) {
    return { ok: false, code: "PROVIDER_FAILURE", message: "O prazo total da avaliação expirou." };
  }
  const requestedEvent = await appendAdminTaxonFactualEvaluationEvent({
    review: factualReview.review,
    operationId: randomUUID(),
    actorUserId: gate.actorUserId,
    eventKind: "evaluation_requested",
    sourceStrategy: requestedContext.value.identity.sourceStrategy,
    contentFingerprint: null,
    evaluationContextFingerprint: requestedEvaluationContextFingerprint,
    deadlineAtMs: evaluationDeadlineAtMs,
    payload: {
      inputCatalogVersion: input.inputCatalogVersion,
      mode: input.mode,
      sourceState: requestedContext.value.identity.sourceState,
      schemaVersion: 2,
    },
  });
  if (!requestedEvent.ok) {
    return { ok: false, code: "FACTUAL_EVENT_WRITE_FAILED", message: requestedEvent.message };
  }

  const requestId = randomUUID();
  const result = await coordinateInputCatalogEvaluation(
    {
      taxonId: input.taxonId,
      inputCatalogVersion: input.inputCatalogVersion,
      mode: input.mode,
      focalHypothesis: input.focalHypothesis,
      feedback,
      deadlineAtMs: evaluationDeadlineAtMs,
    },
    {
      reconstructContext,
      evaluate: async (request) => {
        return evaluateInputCatalogWithOpenAi({
          apiKey: process.env.OPENAI_API_KEY,
          configuration: runtime.configuration,
          environment: runtime.environment,
          request,
          requestId,
          safetyIdentifier: `platform_admin_${gate.actorUserId.replaceAll("-", "")}`,
        }, {
          timeoutMs: request.timeoutMs,
        });
      },
    },
  );

  if (!result.ok) {
    if (Date.now() >= evaluationDeadlineAtMs) {
      return { ok: false, code: result.error.code, message: result.error.message };
    }
    const inconclusiveEvent = await appendAdminTaxonFactualEvaluationEvent({
      review: factualReview.review,
      operationId: randomUUID(),
      actorUserId: gate.actorUserId,
      eventKind: "evaluation_inconclusive",
      sourceStrategy: requestedContext.value.identity.sourceStrategy,
      contentFingerprint: null,
      evaluationContextFingerprint: requestedEvaluationContextFingerprint,
      deadlineAtMs: evaluationDeadlineAtMs,
      payload: {
        requestedEventId: requestedEvent.eventId,
        inputCatalogVersion: input.inputCatalogVersion,
        mode: input.mode,
        sourceState: requestedContext.value.identity.sourceState,
        errorCode: result.error.code,
      },
    });
    if (!inconclusiveEvent.ok) {
      return { ok: false, code: "FACTUAL_EVENT_WRITE_FAILED", message: inconclusiveEvent.message };
    }
    return { ok: false, code: result.error.code, message: result.error.message };
  }
  const contextFingerprint = result.value.evaluationContextFingerprint;
  const outputFingerprint = fingerprintInputCatalogEvaluationOutput(result.value.output);
  if (Date.now() >= evaluationDeadlineAtMs) {
    return { ok: false, code: "PROVIDER_FAILURE", message: "O prazo total da avaliação expirou." };
  }
  const completedEvent = await appendAdminTaxonFactualEvaluationEvent({
    review: factualReview.review,
    operationId: randomUUID(),
    actorUserId: gate.actorUserId,
    eventKind: "evaluation_completed",
    sourceStrategy: result.value.contextIdentity.sourceStrategy,
    contentFingerprint: outputFingerprint,
    evaluationContextFingerprint: contextFingerprint,
    deadlineAtMs: evaluationDeadlineAtMs,
    payload: {
      requestedEventId: requestedEvent.eventId,
      inputCatalogVersion: input.inputCatalogVersion,
      mode: input.mode,
      sourceState: result.value.contextIdentity.sourceState,
      outputFingerprint,
      candidateCount: result.value.output.candidates.length,
      output: result.value.output,
      webSearchCallCount: result.value.sourceEvidence.webSearchCallCount,
      webSearchSources: result.value.sourceEvidence.webSearchSources,
      materialTextUrlProjection: result.value.sourceEvidence.materialTextUrlProjection,
    },
  });
  if (!completedEvent.ok) {
    return { ok: false, code: "FACTUAL_EVENT_WRITE_FAILED", message: completedEvent.message };
  }
  return {
    ok: true,
    output: result.value.output,
    reference: {
      taxonId: result.value.contextIdentity.taxonId,
      reviewId: factualReview.review.id,
      reviewRevision: factualReview.review.revision,
      reviewContextFingerprint: factualReview.review.contextFingerprint,
      evaluationContextFingerprint: contextFingerprint,
      recommendationEventId: completedEvent.eventId,
      outputFingerprint,
      source,
      ...(source === "draft"
        ? {
            draftRevision: input.draftRevision,
            draftContentFingerprint,
          }
        : {}),
    },
  };
}

export async function recordInputCatalogHumanDecisionAction(input: Readonly<{
  reference: InputCatalogEvaluationReference;
  output: InputCatalogEvaluationOutput;
  acceptedCandidates: readonly Readonly<{ index: number; layer: FactualReviewDecisionLayer }>[];
  ownCandidate: Readonly<{ factualNeed: string; layer: FactualReviewDecisionLayer }> | null;
}>): Promise<InputCatalogHumanDecisionActionResult> {
  const gate = await requirePlatformAdmin();
  if (!gate.allowed) {
    return { ok: false, stale: false, message: "Acesso administrativo não autorizado." };
  }
  const candidateCount = input.output.candidates.length;
  const acceptedIndexes = new Set(input.acceptedCandidates.map((candidate) => candidate.index));
  const normalized = normalizeFactualReviewCatalogChangeDecision({
    recommendationCandidateCount: candidateCount,
    recommendationSelection: input.acceptedCandidates.length === 0
      ? "zero"
      : input.acceptedCandidates.length === candidateCount
        ? "total"
        : "partial",
    acceptedCandidates: input.acceptedCandidates,
    rejectedCandidateIndexes: Array.from({ length: candidateCount }, (_, index) => index)
      .filter((index) => !acceptedIndexes.has(index)),
    ownCandidate: input.ownCandidate,
  });
  if (!normalized.ok) return { ok: false, stale: false, message: normalized.error.message };
  const { reviewId, recommendationEventId, outputFingerprint, evaluationContextFingerprint } = input.reference;
  if (!reviewId || !recommendationEventId || !outputFingerprint || !evaluationContextFingerprint) {
    return { ok: false, stale: true, message: "A referência factual persistida está incompleta." };
  }
  const persisted = await loadAdminTaxonFactualEvaluationEvidence({
    reviewId,
    eventId: recommendationEventId,
    outputFingerprint,
    evaluationContextFingerprint,
    output: input.output,
  });
  if (!persisted.ok) return { ok: false, stale: true, message: persisted.message };
  const evidence = persisted.evidence;
  const recommendationBinding = candidateCount > 0
    ? {
        recommendationEventId,
        recommendationOutputFingerprint: outputFingerprint,
        recommendationEvaluationContextFingerprint: evaluationContextFingerprint,
      }
    : {};

  if ((input.reference.source ?? "published") === "draft") {
    const expectedRevision = Number(input.reference.draftRevision);
    const expectedContentFingerprint = input.reference.draftContentFingerprint;
    if (!Number.isSafeInteger(expectedRevision) || expectedRevision <= 0 || !expectedContentFingerprint) {
      return { ok: false, stale: true, message: "A referência do draft é inválida." };
    }
    const recorded = await recordAdminInputCatalogDraftHumanDecision({
      actorUserId: gate.actorUserId,
      expectedRevision,
      taxonId: evidence.taxonId,
      expectedContentFingerprint,
      expectedEvaluationContextFingerprint: evidence.evaluationContextFingerprint,
      decision: normalized.value,
      ...recommendationBinding,
      mode: input.output.mode,
    });
    if (!recorded.ok) return { ok: false, stale: true, message: recorded.message };
    revalidatePath("/admin/estrutura-lp");
    revalidatePath("/admin/taxonomia");
    revalidatePath(`/admin/taxonomia/${evidence.taxonId}`);
    return { ok: true, decisionKind: recorded.decisionKind, reviewedVersion: recorded.reviewedVersion };
  }

  if (normalized.value.decisionKind === "catalog_change") {
    return { ok: false, stale: false, message: "Decisão com mudança exige o draft exato aberto pela Estrutura da LP." };
  }
  if (evidence.inputCatalogVersion !== CURRENT_LANDING_PAGE_INPUT_CATALOG_VERSION) {
    return {
      ok: false,
      stale: false,
      message: "Avaliações de versões históricas são somente leitura; avalie a versão atual antes de registrar uma decisão.",
    };
  }
  if (!input.reference.reviewContextFingerprint || !Number.isSafeInteger(input.reference.reviewRevision)) {
    return { ok: false, stale: true, message: "A referência da sessão factual é inválida." };
  }
  const current = await reconstructCanonicalInputCatalogEvaluationContext({
    taxonId: evidence.taxonId,
    inputCatalogVersion: evidence.inputCatalogVersion,
    mode: input.output.mode,
  });
  if (
    !current.ok ||
    fingerprintInputCatalogEvaluationContextIdentity(current.value.identity) !== evidence.evaluationContextFingerprint
  ) {
    return { ok: false, stale: true, message: current.ok ? "As fontes mudaram desde a avaliação." : current.error.message };
  }
  const recorded = await closeAdminTaxonFactualReviewWithoutChangeForCurrentCoverage({
    reviewId,
    operationId: randomUUID(),
    actorUserId: gate.actorUserId,
    taxonId: evidence.taxonId,
    expectedRevision: Number(input.reference.reviewRevision),
    expectedContextFingerprint: input.reference.reviewContextFingerprint,
    ...recommendationBinding,
    humanDecision: normalized.value,
  });
  if (!recorded.ok) return { ok: false, stale: true, message: recorded.message };
  revalidatePath("/admin/taxonomia");
  revalidatePath(`/admin/taxonomia/${evidence.taxonId}`);
  return { ok: true, decisionKind: "no_change", reviewedVersion: recorded.value.coverage.inputCatalogVersion };
}

export async function createTaxonAction(
  _previousState: CreateTaxonActionState,
  formData: FormData,
): Promise<CreateTaxonActionState> {
  const gate = await requirePlatformAdmin();

  if (!gate.allowed) {
    return { error: "Acesso administrativo nao autorizado." };
  }

  const result = await createAdminTaxon({
    name: String(formData.get("name") ?? ""),
    level: String(formData.get("level") ?? ""),
    parentId: String(formData.get("parentId") ?? ""),
    slug: String(formData.get("slug") ?? ""),
    aliases: [String(formData.get("aliases") ?? "")],
  });

  if (!result.ok) return { error: result.error };

  revalidatePath("/admin/taxonomia");
  revalidatePath(`/admin/taxonomia/${result.taxonId}`);
  redirect(`/admin/taxonomia/${result.taxonId}`);
}

export async function updateTaxonAction(
  _previousState: ManageTaxonActionState,
  formData: FormData,
): Promise<ManageTaxonActionState> {
  const gate = await requirePlatformAdmin();

  if (!gate.allowed) {
    return { error: "Acesso administrativo nao autorizado." };
  }

  const result = await updateAdminTaxon({
    id: String(formData.get("taxonId") ?? ""),
    name: String(formData.get("name") ?? ""),
    slug: String(formData.get("slug") ?? ""),
    isActive: formData.get("operationalState") === "active",
    actorUserId: gate.actorUserId,
    invalidateAffectedReviews: formData.get("invalidateAffectedReviews") === "yes",
  });

  if (!result.ok) return { error: result.error };

  revalidatePath("/admin/taxonomia");
  revalidatePath(`/admin/taxonomia/${result.taxonId}`);
  return { error: null };
}

export async function selectEndCustomerResearchAction(
  _previousState: SelectEndCustomerResearchActionState,
  formData: FormData,
): Promise<SelectEndCustomerResearchActionState> {
  const gate = await requirePlatformAdmin();

  if (!gate.allowed) {
    return { error: "Acesso administrativo não autorizado.", selectedVersion: null };
  }

  const result = await selectAdminEndCustomerResearchVersion({
    taxonId: String(formData.get("taxonId") ?? ""),
    researchVersion: Number(formData.get("researchVersion")),
  });

  if (!result.ok) return { error: result.error, selectedVersion: null };

  revalidatePath("/admin/taxonomia");
  revalidatePath(`/admin/taxonomia/${result.taxonId}`);
  return { error: null, selectedVersion: result.selectedVersion };
}

export async function openFactualReviewAction(
  previousState: FactualReviewLifecycleActionState,
  formData: FormData,
): Promise<FactualReviewLifecycleActionState> {
  const revision = nextActionRevision(previousState.revision);
  const gate = await requirePlatformAdmin();
  if (!gate.allowed) {
    return { error: "Acesso administrativo não autorizado.", message: null, revision };
  }
  const taxonId = String(formData.get("taxonId") ?? "");
  const result = await openAdminTaxonFactualReview({
    taxonId,
    operationId: randomUUID(),
    actorUserId: gate.actorUserId,
  });
  if (!result.ok) return { error: result.message, message: null, revision };
  revalidatePath("/admin/taxonomia");
  revalidatePath(`/admin/taxonomia/${taxonId}`);
  return { error: null, message: "Sessão factual aberta sem alterar o estado operacional.", revision };
}

export async function closeFactualReviewWithoutChangeAction(
  previousState: FactualReviewLifecycleActionState,
  formData: FormData,
): Promise<FactualReviewLifecycleActionState> {
  const revision = nextActionRevision(previousState.revision);
  const gate = await requirePlatformAdmin();
  if (!gate.allowed) {
    return { error: "Acesso administrativo não autorizado.", message: null, revision };
  }
  const taxonId = String(formData.get("taxonId") ?? "");
  const reviewId = String(formData.get("reviewId") ?? "");
  const expectedRevision = Number(formData.get("expectedRevision"));
  const expectedContextFingerprint = String(formData.get("expectedContextFingerprint") ?? "");
  const currentResult = await loadLatestAdminTaxonFactualReview(taxonId);
  if (!currentResult.ok) {
    return { error: currentResult.message, message: null, revision };
  }
  const current = currentResult.review;
  if (!current || current.status !== "open") {
    return { error: "Não há sessão factual aberta que possa ser fechada sem mudança.", message: null, revision };
  }
  if (
    current.id !== reviewId ||
    current.revision !== expectedRevision ||
    current.contextFingerprint !== expectedContextFingerprint
  ) {
    return {
      error: "A sessão factual mudou desde a renderização. Recarregue antes de fechar.",
      message: null,
      revision,
    };
  }
  const result = await closeAdminTaxonFactualReviewWithoutChangeForCurrentCoverage({
    reviewId,
    operationId: randomUUID(),
    actorUserId: gate.actorUserId,
    taxonId,
    expectedRevision,
    expectedContextFingerprint,
  });
  if (!result.ok) return { error: result.message, message: null, revision };
  revalidatePath("/admin/taxonomia");
  revalidatePath(`/admin/taxonomia/${taxonId}`);
  return {
    error: null,
    message: result.value.review.kind === "release"
      ? "Liberação factual concluída por decisão humana; o taxon foi ativado pelo lifecycle."
      : "Revisão factual fechada sem mudança no catálogo.",
    revision,
  };
}

function nextActionRevision(value: number): number {
  return Number.isSafeInteger(value) && value >= 0 ? value + 1 : 1;
}

export async function addTaxonAliasAction(
  _previousState: ManageTaxonActionState,
  formData: FormData,
): Promise<ManageTaxonActionState> {
  const gate = await requirePlatformAdmin();

  if (!gate.allowed) {
    return { error: "Acesso administrativo nao autorizado." };
  }

  const result = await addAdminTaxonAlias({
    taxonId: String(formData.get("taxonId") ?? ""),
    aliasText: String(formData.get("aliasText") ?? ""),
  });

  if (!result.ok) return { error: result.error };

  revalidatePath("/admin/taxonomia");
  revalidatePath(`/admin/taxonomia/${result.taxonId}`);
  return { error: null };
}

export async function deleteTaxonAliasAction(
  _previousState: ManageTaxonActionState,
  formData: FormData,
): Promise<ManageTaxonActionState> {
  const gate = await requirePlatformAdmin();

  if (!gate.allowed) {
    return { error: "Acesso administrativo nao autorizado." };
  }

  const result = await deleteAdminTaxonAlias({
    taxonId: String(formData.get("taxonId") ?? ""),
    aliasId: String(formData.get("aliasId") ?? ""),
  });

  if (!result.ok) return { error: result.error };

  revalidatePath("/admin/taxonomia");
  revalidatePath(`/admin/taxonomia/${result.taxonId}`);
  return { error: null };
}

export async function deleteTaxonAction(
  _previousState: ManageTaxonActionState,
  formData: FormData,
): Promise<ManageTaxonActionState> {
  const gate = await requirePlatformAdmin();

  if (!gate.allowed) {
    return { error: "Acesso administrativo nao autorizado." };
  }

  const result = await deleteAdminTaxon({
    taxonId: String(formData.get("taxonId") ?? ""),
    confirmSlug: String(formData.get("confirmSlug") ?? ""),
  });

  if (!result.ok) return { error: result.error };

  revalidatePath("/admin/taxonomia");
  redirect("/admin/taxonomia");
}
