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
  normalizeFactualReviewCatalogChangeDecision,
  type FactualReviewDecisionLayer,
  revalidateInputCatalogEvaluationContext,
  type InputCatalogEvaluationMode,
  type InputCatalogEvaluationOutput,
} from "@/conversion-content/landing-page/taxon-preparation";
import { CURRENT_LANDING_PAGE_INPUT_CATALOG_VERSION } from "@/conversion-content/landing-page/input-catalog";
import {
  loadAdminInputCatalogDraftEvaluationContext,
} from "@/lib/admin/adapters/adminInputCatalogLifecycleAdapter";
import {
  closeAdminTaxonFactualReviewWithoutEvaluation,
  finalizeAdminTaxonFactualReview,
  loadAdminTaxonFactualEvaluationEvidence,
  loadLatestAdminTaxonFactualReview,
  loadOpenAdminTaxonFactualReview,
  openAdminTaxonFactualReview,
  persistAdminTaxonFactualEvaluation,
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
  reviewId: string;
  reviewRevision: number;
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
    reviewId: string;
    expectedRevision: number;
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
    const previousPersisted = await loadAdminTaxonFactualEvaluationEvidence({
      reviewId: input.feedback.reviewId,
      expectedRevision: input.feedback.expectedRevision,
    });
    const previousEvidence = previousPersisted.ok ? previousPersisted.evidence : null;
    if (
      !previousEvidence ||
      previousEvidence.review.taxonId !== input.taxonId ||
      previousEvidence.inputCatalogVersion !== input.inputCatalogVersion ||
      previousEvidence.source !== source ||
      (source === "draft" && previousEvidence.draftRevision !== input.draftRevision)
    ) {
      return {
        ok: false,
        code: "CONTEXT_STALE",
        message: "O contexto da avaliação anterior não corresponde à execução atual.",
      };
    }
    const previousContext = await reconstructContext({
      taxonId: previousEvidence.review.taxonId,
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
      previousOutput: previousEvidence.output,
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

  if (!result.ok) return { ok: false, code: result.error.code, message: result.error.message };
  const contextFingerprint = result.value.evaluationContextFingerprint;
  if (Date.now() >= evaluationDeadlineAtMs) {
    return { ok: false, code: "PROVIDER_FAILURE", message: "O prazo total da avaliação expirou." };
  }
  const persisted = await persistAdminTaxonFactualEvaluation({
    review: factualReview.review,
    actorUserId: gate.actorUserId,
    mode: input.mode,
    source,
    draftRevision: input.draftRevision ?? null,
    inputCatalogVersion: input.inputCatalogVersion,
    evaluationContextFingerprint: contextFingerprint,
    output: result.value.output,
  });
  if (!persisted.ok) {
    return { ok: false, code: "FACTUAL_REVIEW_WRITE_FAILED", message: persisted.message };
  }
  return {
    ok: true,
    output: result.value.output,
    reference: {
      reviewId: factualReview.review.id,
      reviewRevision: persisted.reviewRevision,
    },
  };
}

export async function recordInputCatalogHumanDecisionAction(input: Readonly<{
  reviewId: string;
  expectedRevision: number;
  acceptedCandidates: readonly Readonly<{ index: number; layer: FactualReviewDecisionLayer }>[];
  ownCandidate: Readonly<{ factualNeed: string; layer: FactualReviewDecisionLayer }> | null;
}>): Promise<InputCatalogHumanDecisionActionResult> {
  const gate = await requirePlatformAdmin();
  if (!gate.allowed) {
    return { ok: false, stale: false, message: "Acesso administrativo não autorizado." };
  }
  const persisted = await loadAdminTaxonFactualEvaluationEvidence({
    reviewId: input.reviewId,
    expectedRevision: input.expectedRevision,
  });
  if (!persisted.ok) return { ok: false, stale: true, message: persisted.message };
  const evidence = persisted.evidence;
  if (evidence.output.status === "inconclusive") {
    return {
      ok: false,
      stale: false,
      message: "Uma avaliação inconclusiva não autoriza decisão; refine a avaliação ou use o caminho humano sem IA.",
    };
  }
  const candidateCount = evidence.output.candidates.length;
  if (input.acceptedCandidates.some(({ index }) => {
    const conclusion = evidence.output.candidates[index]?.conclusion;
    return conclusion !== "refine_existing_field" && conclusion !== "possible_new_field";
  })) {
    return { ok: false, stale: false, message: "A decisão tenta aceitar um candidato não acionável." };
  }
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
  if (evidence.source === "draft") {
    const draftRevision = evidence.draftRevision;
    if (!draftRevision) return { ok: false, stale: true, message: "A referência do draft é inválida." };
    const draft = await loadAdminInputCatalogDraftEvaluationContext({
      expectedRevision: draftRevision,
      taxonId: evidence.review.taxonId,
      mode: evidence.output.mode,
    });
    if (!draft.ok) return { ok: false, stale: true, message: draft.message };
    const contextFingerprint = fingerprintInputCatalogEvaluationContextIdentity(draft.value.context.identity);
    if (contextFingerprint !== evidence.evaluationContextFingerprint) {
      return { ok: false, stale: true, message: "O draft ou suas fontes mudaram desde a avaliação." };
    }
    const recorded = await finalizeAdminTaxonFactualReview({
      reviewId: input.reviewId,
      expectedRevision: input.expectedRevision,
      actorUserId: gate.actorUserId,
      decision: normalized.value,
      draft: {
        revision: draftRevision,
        contentFingerprint: draft.value.contentFingerprint,
        contextFingerprint,
      },
    });
    if (!recorded.ok) return { ok: false, stale: true, message: recorded.message };
    revalidatePath("/admin/estrutura-lp");
    revalidatePath("/admin/taxonomia");
    revalidatePath(`/admin/taxonomia/${evidence.review.taxonId}`);
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
  const current = await reconstructCanonicalInputCatalogEvaluationContext({
    taxonId: evidence.review.taxonId,
    inputCatalogVersion: evidence.inputCatalogVersion,
    mode: evidence.output.mode,
  });
  if (
    !current.ok ||
    fingerprintInputCatalogEvaluationContextIdentity(current.value.identity) !== evidence.evaluationContextFingerprint
  ) {
    return { ok: false, stale: true, message: current.ok ? "As fontes mudaram desde a avaliação." : current.error.message };
  }
  const recorded = await finalizeAdminTaxonFactualReview({
    reviewId: input.reviewId,
    expectedRevision: input.expectedRevision,
    actorUserId: gate.actorUserId,
    decision: normalized.value,
    draft: null,
  });
  if (!recorded.ok) return { ok: false, stale: true, message: recorded.message };
  revalidatePath("/admin/taxonomia");
  revalidatePath(`/admin/taxonomia/${evidence.review.taxonId}`);
  return { ok: true, decisionKind: "no_change", reviewedVersion: recorded.reviewedVersion };
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
    current.revision !== expectedRevision
  ) {
    return {
      error: "A sessão factual mudou desde a renderização. Recarregue antes de fechar.",
      message: null,
      revision,
    };
  }
  const result = await closeAdminTaxonFactualReviewWithoutEvaluation({
    reviewId,
    actorUserId: gate.actorUserId,
    expectedRevision,
  });
  if (!result.ok) return { error: result.message, message: null, revision };
  revalidatePath("/admin/taxonomia");
  revalidatePath(`/admin/taxonomia/${taxonId}`);
  return {
    error: null,
    message: current.kind === "release"
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
