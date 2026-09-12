"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requirePlatformAdmin } from "@/lib/access/guards";
import { reconstructCanonicalInputCatalogEvaluationContext } from "@/conversion-content/adapters/inputCatalogEvaluationContextAdapter";
import { evaluateInputCatalogWithOpenAi } from "@/conversion-content/adapters/inputCatalogEvaluationOpenAiAdapter";
import { resolveInputCatalogEvaluationRuntimeReadiness } from "@/conversion-content/adapters/inputCatalogEvaluationRuntimeGate";
import {
  executeInputCatalogEvaluationAdministrativeActionCore,
  executeLegacyInputCatalogReviewRecordCore,
} from "@/conversion-content/adapters/inputCatalogEvaluationAdministrativeActionCore";
import {
  coordinateInputCatalogEvaluation,
  createInputCatalogEvaluationDecisionToken,
  fingerprintInputCatalogEvaluationContextIdentity,
  fingerprintInputCatalogEvaluationOutput,
  revalidateInputCatalogEvaluationContext,
  type InputCatalogEvaluationMode,
  type InputCatalogEvaluationOutput,
} from "@/conversion-content/landing-page/taxon-preparation";
import { nextInputCatalogReviewActionRevision } from "@/lib/admin/adapters/adminTaxonomyReviewPolicy";
import {
  loadAdminInputCatalogDraftEvaluationContext,
  recordAdminInputCatalogDraftSufficiencyDecision,
} from "@/lib/admin/adapters/adminInputCatalogLifecycleAdapter";
import {
  appendAdminTaxonFactualEvaluationEvent,
  closeAdminTaxonFactualReviewWithoutChangeForCurrentCoverage,
  loadAdminTaxonFactualEvaluationEvidence,
  loadOpenAdminTaxonFactualReview,
} from "@/lib/admin/adapters/adminTaxonFactualReviewAdapter";
import {
  addAdminTaxonAlias,
  createAdminTaxon,
  deleteAdminTaxon,
  deleteAdminTaxonAlias,
  selectAdminEndCustomerResearchVersion,
  recordAdminInputCatalogReview,
  reopenAdminInputCatalogReview,
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

export type InputCatalogReviewActionState = {
  error: string | null;
  reviewedVersion: number | null;
  reopened: boolean;
  revision: number;
};

export type InputCatalogEvaluationReference = Readonly<{
  decisionToken: string;
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

export type ConfirmInputCatalogEvaluationActionResult =
  | Readonly<{ ok: true; kind: "sufficiency_confirmed"; reviewedVersion: number }>
  | Readonly<{ ok: false; stale: boolean; message: string }>;

export type RejectInputCatalogCandidatesActionResult =
  | Readonly<{
      ok: true;
      kind: "candidates_rejected_and_sufficiency_confirmed";
      reviewedVersion: number;
    }>
  | Readonly<{ ok: false; stale: boolean; message: string }>;

export type AcknowledgeInputCatalogGapActionResult =
  | Readonly<{ ok: true; handoff: string; selectedCandidateCount: number }>
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
  const decisionToken = createInputCatalogEvaluationDecisionToken(
    {
      taxonId: result.value.contextIdentity.taxonId,
      inputCatalogVersion: result.value.contextIdentity.inputCatalog.version,
      contextFingerprint,
      outputFingerprint,
      status: result.value.output.status,
    },
    process.env.OPENAI_API_KEY,
  );
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
      decisionToken: decisionToken ?? "",
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

export async function confirmInputCatalogEvaluationAction(input: Readonly<{
  reference: InputCatalogEvaluationReference;
  output: InputCatalogEvaluationOutput;
}>): Promise<ConfirmInputCatalogEvaluationActionResult> {
  const result = await executeAdministrativeEvaluationDecision({
    decision: "confirm_sufficient",
    reference: input.reference,
    output: input.output,
  });
  if (!result.ok) return result;
  if (result.kind !== "sufficiency_confirmed") {
    return { ok: false, stale: false, message: "A confirmação não produziu a decisão esperada." };
  }
  revalidatePath("/admin/taxonomia");
  if (input.reference.taxonId) revalidatePath(`/admin/taxonomia/${input.reference.taxonId}`);
  return { ok: true, kind: result.kind, reviewedVersion: result.reviewedVersion };
}

export async function rejectInputCatalogCandidatesAndConfirmSufficientAction(input: Readonly<{
  reference: InputCatalogEvaluationReference;
  output: InputCatalogEvaluationOutput;
  selectedCandidateIndexes: readonly number[];
}>): Promise<RejectInputCatalogCandidatesActionResult> {
  const result = await executeAdministrativeEvaluationDecision({
    decision: "reject_candidates_and_confirm_sufficient",
    reference: input.reference,
    output: input.output,
    selectedCandidateIndexes: input.selectedCandidateIndexes,
  });
  if (!result.ok) return result;
  if (result.kind !== "candidates_rejected_and_sufficiency_confirmed") {
    return { ok: false, stale: false, message: "A rejeição dos candidatos não produziu a decisão esperada." };
  }
  revalidatePath("/admin/taxonomia");
  if (input.reference.taxonId) revalidatePath(`/admin/taxonomia/${input.reference.taxonId}`);
  return { ok: true, kind: result.kind, reviewedVersion: result.reviewedVersion };
}

export async function acknowledgeInputCatalogGapAction(input: Readonly<{
  reference: InputCatalogEvaluationReference;
  output: InputCatalogEvaluationOutput;
  selectedCandidateIndexes: readonly number[];
}>): Promise<AcknowledgeInputCatalogGapActionResult> {
  const result = await executeAdministrativeEvaluationDecision({
    decision: "acknowledge_factual_gap",
    reference: input.reference,
    output: input.output,
    selectedCandidateIndexes: input.selectedCandidateIndexes,
  });
  if (!result.ok) return result;
  return result.kind === "factual_gap_acknowledged" && result.handoff
    ? {
        ok: true,
        handoff: result.handoff,
        selectedCandidateCount: result.selectedCandidates.length,
      }
    : { ok: false, stale: false, message: "O reconhecimento do gap não produziu a decisão esperada." };
}

async function executeAdministrativeEvaluationDecision(input: Readonly<{
  decision:
    | "confirm_sufficient"
    | "reject_candidates_and_confirm_sufficient"
    | "acknowledge_factual_gap";
  reference: InputCatalogEvaluationReference;
  output: InputCatalogEvaluationOutput;
  selectedCandidateIndexes?: readonly number[];
}>) {
  const gate = await requirePlatformAdmin();
  if (!gate.allowed) {
    return { ok: false as const, stale: false, message: "Acesso administrativo não autorizado." };
  }
  const loadPersistedEvidence = async () => {
    if (
      !input.reference.reviewId ||
      !input.reference.recommendationEventId ||
      !input.reference.outputFingerprint ||
      !input.reference.evaluationContextFingerprint
    ) {
      return { ok: false as const, message: "A referência factual persistida está incompleta." };
    }
    return loadAdminTaxonFactualEvaluationEvidence({
      reviewId: input.reference.reviewId,
      eventId: input.reference.recommendationEventId,
      outputFingerprint: input.reference.outputFingerprint,
      evaluationContextFingerprint: input.reference.evaluationContextFingerprint,
      output: input.output,
    });
  };
  if ((input.reference.source ?? "published") === "draft") {
    const expectedRevision = input.reference.draftRevision;
    const expectedContentFingerprint = input.reference.draftContentFingerprint;
    if (
      !Number.isSafeInteger(expectedRevision) ||
      Number(expectedRevision) <= 0 ||
      typeof expectedContentFingerprint !== "string"
    ) {
      return { ok: false as const, stale: true, message: "A referência do draft é inválida." };
    }
    const result = await executeInputCatalogEvaluationAdministrativeActionCore(
      {
        decision: input.decision,
        decisionToken: input.reference.decisionToken,
        decisionTokenSecret: process.env.OPENAI_API_KEY,
        output: input.output,
        selectedCandidateIndexes: input.selectedCandidateIndexes,
      },
      {
        requireRuntime: async () => {
          const runtime = await resolveInputCatalogEvaluationRuntimeReadiness();
          return runtime.ok
            ? { ok: true as const }
            : { ok: false as const, message: runtime.message };
        },
        loadPersistedEvidence,
        revalidate: async (evidence) => {
          const draft = await loadAdminInputCatalogDraftEvaluationContext({
            expectedRevision: Number(expectedRevision),
            taxonId: evidence.taxonId,
            mode: input.output.mode,
          });
          if (
            !draft.ok ||
            draft.value.targetVersion !== evidence.inputCatalogVersion ||
            draft.value.contentFingerprint !== expectedContentFingerprint ||
            fingerprintInputCatalogEvaluationContextIdentity(draft.value.context.identity) !==
              evidence.evaluationContextFingerprint
          ) {
            return {
              ok: false as const,
              message: draft.ok
                ? "O draft ou suas fontes mudaram desde a avaliação."
                : draft.message,
            };
          }
          return { ok: true as const };
        },
        recordReviewedVersion: async (evidence) => {
          if (input.decision === "acknowledge_factual_gap") {
            return { ok: false as const, message: "Reconhecimento de gap não registra suficiência." };
          }
          const recorded = await recordAdminInputCatalogDraftSufficiencyDecision({
            actorUserId: gate.actorUserId,
            expectedRevision: Number(expectedRevision),
            taxonId: evidence.taxonId,
            expectedContentFingerprint,
            expectedEvaluationContextFingerprint: evidence.evaluationContextFingerprint,
            decision: input.decision,
            recommendationCandidateCount: input.output.candidates.length,
            ...(input.decision !== "confirm_sufficient" && input.output.candidates.length > 0
              ? {
                  recommendationEventId: input.reference.recommendationEventId,
                  recommendationOutputFingerprint: input.reference.outputFingerprint,
                  recommendationEvaluationContextFingerprint:
                    input.reference.evaluationContextFingerprint,
                }
              : {}),
            mode: input.output.mode,
          });
          if (!recorded.ok) return recorded;
          return { ok: true as const, reviewedVersion: recorded.reviewedVersion };
        },
      },
    );
    if (result.ok && result.kind !== "factual_gap_acknowledged") {
      revalidatePath("/admin/estrutura-lp");
    }
    return result;
  }
  return executeInputCatalogEvaluationAdministrativeActionCore(
    {
      decision: input.decision,
      decisionToken: input.reference.decisionToken,
      decisionTokenSecret: process.env.OPENAI_API_KEY,
      output: input.output,
      selectedCandidateIndexes: input.selectedCandidateIndexes,
    },
    {
      requireRuntime: async () => {
        const runtime = await resolveInputCatalogEvaluationRuntimeReadiness();
        return runtime.ok
          ? { ok: true as const }
          : { ok: false as const, message: runtime.message };
      },
      loadPersistedEvidence,
      revalidate: async (evidence) => {
        const current = await reconstructCanonicalInputCatalogEvaluationContext({
          taxonId: evidence.taxonId,
          inputCatalogVersion: evidence.inputCatalogVersion,
          mode: input.output.mode,
        });
        if (!current.ok) return { ok: false as const, message: current.error.message };
        const revalidated = await revalidateInputCatalogEvaluationContext(
          current.value.identity,
          {
            taxonId: evidence.taxonId,
            inputCatalogVersion: evidence.inputCatalogVersion,
            mode: input.output.mode,
          },
          reconstructCanonicalInputCatalogEvaluationContext,
        );
        if (
          !revalidated.ok ||
          fingerprintInputCatalogEvaluationContextIdentity(revalidated.value.contextIdentity) !==
            evidence.evaluationContextFingerprint
        ) {
          return {
            ok: false as const,
            message: revalidated.ok
              ? "As fontes mudaram desde a avaliação. Execute uma nova avaliação."
              : revalidated.error.message,
          };
        }
        return { ok: true as const };
      },
      recordReviewedVersion: async (evidence) => {
        if (
          !input.reference.reviewId ||
          !Number.isSafeInteger(input.reference.reviewRevision) ||
          !input.reference.reviewContextFingerprint
        ) {
          return { ok: false as const, message: "A referência da sessão factual é inválida." };
        }
        const recommendationCandidateCount = input.decision === "confirm_sufficient"
          ? 0
          : input.output.candidates.length;
        const recorded = await closeAdminTaxonFactualReviewWithoutChangeForCurrentCoverage({
          reviewId: input.reference.reviewId,
          operationId: randomUUID(),
          actorUserId: gate.actorUserId,
          taxonId: evidence.taxonId,
          expectedRevision: Number(input.reference.reviewRevision),
          expectedContextFingerprint: input.reference.reviewContextFingerprint,
          ...(recommendationCandidateCount > 0
            ? {
                recommendationEventId: input.reference.recommendationEventId,
                recommendationOutputFingerprint: input.reference.outputFingerprint,
                recommendationEvaluationContextFingerprint:
                  input.reference.evaluationContextFingerprint,
              }
            : {}),
          humanDecision: {
            recommendationCandidateCount,
            recommendationSelection: "zero",
            acceptedCandidates: [],
            rejectedCandidateIndexes: Array.from(
              { length: recommendationCandidateCount },
              (_, index) => index,
            ),
            ownCandidate: null,
          },
        });
        if (!recorded.ok) return recorded;
        return {
          ok: true as const,
          reviewedVersion: recorded.value.coverage.inputCatalogVersion,
        };
      },
    },
  );
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
    isActive: formData.get("isActive") === "on",
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

export async function recordInputCatalogReviewAction(
  previousState: InputCatalogReviewActionState,
  formData: FormData,
): Promise<InputCatalogReviewActionState> {
  const revision = nextInputCatalogReviewActionRevision(previousState.revision);
  const gate = await requirePlatformAdmin();
  if (!gate.allowed) {
    return { error: "Acesso administrativo não autorizado.", reviewedVersion: null, reopened: false, revision };
  }
  const legacy = await executeLegacyInputCatalogReviewRecordCore({
    resolveRuntime: resolveInputCatalogEvaluationRuntimeReadiness,
    record: () => recordAdminInputCatalogReview({
      taxonId: String(formData.get("taxonId") ?? ""),
      inputCatalogVersion: Number(formData.get("inputCatalogVersion")),
    }),
  });
  if (!legacy.ok) {
    return { error: legacy.message, reviewedVersion: null, reopened: false, revision };
  }
  const result = legacy.value;
  if (!result.ok) return { error: result.error, reviewedVersion: null, reopened: false, revision };
  revalidatePath("/admin/taxonomia");
  revalidatePath(`/admin/taxonomia/${result.taxonId}`);
  return { error: null, reviewedVersion: result.reviewedVersion, reopened: false, revision };
}

export async function reopenInputCatalogReviewAction(
  previousState: InputCatalogReviewActionState,
  formData: FormData,
): Promise<InputCatalogReviewActionState> {
  const revision = nextInputCatalogReviewActionRevision(previousState.revision);
  const gate = await requirePlatformAdmin();
  if (!gate.allowed) {
    return { error: "Acesso administrativo não autorizado.", reviewedVersion: null, reopened: false, revision };
  }
  const result = await reopenAdminInputCatalogReview({
    taxonId: String(formData.get("taxonId") ?? ""),
  });
  if (!result.ok) return { error: result.error, reviewedVersion: null, reopened: false, revision };
  revalidatePath("/admin/taxonomia");
  revalidatePath(`/admin/taxonomia/${result.taxonId}`);
  return { error: null, reviewedVersion: null, reopened: true, revision };
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
