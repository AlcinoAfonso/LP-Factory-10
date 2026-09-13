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
} from "@/conversion-content/adapters/inputCatalogEvaluationAdministrativeActionCore";
import {
  CURRENT_LANDING_PAGE_INPUT_CATALOG_VERSION,
} from "@/conversion-content/landing-page/input-catalog";
import {
  coordinateInputCatalogEvaluation,
  createInputCatalogEvaluationDecisionToken,
  fingerprintInputCatalogEvaluationContextIdentity,
  fingerprintInputCatalogEvaluationOutput,
  readInputCatalogEvaluationDecisionToken,
  revalidateInputCatalogEvaluationContext,
  type InputCatalogEvaluationMode,
  type InputCatalogEvaluationOutput,
  type InputCatalogEvaluationProviderProvenance,
} from "@/conversion-content/landing-page/taxon-preparation";
import {
  addAdminTaxonAlias,
  createAdminTaxon,
  deleteAdminTaxon,
  deleteAdminTaxonAlias,
  releaseAdminTaxon,
  selectAdminEndCustomerResearchVersion,
  updateAdminTaxon,
} from "@/lib/admin/adapters/adminReadOnlyAdapter";

export type CreateTaxonActionState = {
  error: string | null;
};

export type ManageTaxonActionState = {
  error: string | null;
};

export type ReleaseTaxonActionState = {
  error: string | null;
  released: boolean;
  revision: number;
};

export type SelectEndCustomerResearchActionState = {
  error: string | null;
  selectedVersion: number | null;
};

export type InputCatalogEvaluationReference = Readonly<{
  decisionToken: string;
}>;

export type InputCatalogEvaluationActionResult =
  | Readonly<{
      ok: true;
      output: InputCatalogEvaluationOutput;
      provenance: InputCatalogEvaluationProviderProvenance;
      reference: InputCatalogEvaluationReference;
    }>
  | Readonly<{ ok: false; code: string; message: string }>;

export type ConfirmInputCatalogEvaluationActionResult =
  | Readonly<{ ok: true; kind: "sufficiency_acknowledged" }>
  | Readonly<{ ok: false; stale: boolean; message: string }>;

export type RejectInputCatalogCandidatesActionResult =
  | Readonly<{
      ok: true;
      kind: "candidates_rejected";
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
}>): Promise<InputCatalogEvaluationActionResult> {
  const gate = await requirePlatformAdmin();
  if (!gate.allowed) {
    return { ok: false, code: "UNAUTHORIZED", message: "Acesso administrativo não autorizado." };
  }

  if (input.inputCatalogVersion !== CURRENT_LANDING_PAGE_INPUT_CATALOG_VERSION) {
    return {
      ok: false,
      code: "INVALID_INPUT_CATALOG_VERSION",
      message: `A avaliação publicada deve usar a versão E20.2 corrente ${CURRENT_LANDING_PAGE_INPUT_CATALOG_VERSION}.`,
    };
  }

  const runtime = await resolveInputCatalogEvaluationRuntimeReadiness();
  if (!runtime.ok) {
    return { ok: false, code: runtime.code, message: runtime.message };
  }

  const reconstructContext = reconstructCanonicalInputCatalogEvaluationContext;

  let feedback: Parameters<typeof coordinateInputCatalogEvaluation>[0]["feedback"] = null;
  if (input.feedback) {
    const previousEvidence = readInputCatalogEvaluationDecisionToken(
      input.feedback.reference.decisionToken,
      process.env.OPENAI_API_KEY,
    );
    if (
      !previousEvidence ||
      previousEvidence.taxonId !== input.taxonId ||
      previousEvidence.inputCatalogVersion !== input.inputCatalogVersion ||
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
    });
    if (
      !previousContext.ok ||
      fingerprintInputCatalogEvaluationContextIdentity(previousContext.value.identity) !==
        previousEvidence.contextFingerprint
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

  const requestId = randomUUID();
  const result = await coordinateInputCatalogEvaluation(
    {
      taxonId: input.taxonId,
      inputCatalogVersion: input.inputCatalogVersion,
      mode: input.mode,
      focalHypothesis: input.focalHypothesis,
      feedback,
    },
    {
      reconstructContext,
      evaluate: async (request) => {
        const economicEventId = randomUUID();
        return evaluateInputCatalogWithOpenAi({
          apiKey: process.env.OPENAI_API_KEY,
          configuration: runtime.configuration,
          environment: runtime.environment,
          request,
          requestId,
          economicEvent: { eventId: economicEventId, taxonId: input.taxonId },
          safetyIdentifier: `platform_admin_${gate.actorUserId.replaceAll("-", "")}`,
        });
      },
    },
  );

  if (!result.ok) {
    return { ok: false, code: result.error.code, message: result.error.message };
  }
  const contextFingerprint = fingerprintInputCatalogEvaluationContextIdentity(
    result.value.contextIdentity,
  );
  const outputFingerprint = fingerprintInputCatalogEvaluationOutput(result.value.output);
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
  if (!decisionToken) {
    return {
      ok: false,
      code: "DECISION_EVIDENCE_UNAVAILABLE",
      message: "A avaliação foi descartada porque sua evidência administrativa não pôde ser autenticada.",
    };
  }
  return {
    ok: true,
    output: result.value.output,
    provenance: result.value.provenance,
    reference: {
      decisionToken,
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
  if (result.kind !== "sufficiency_acknowledged") {
    return { ok: false, stale: false, message: "A confirmação não produziu a decisão esperada." };
  }
  return { ok: true, kind: result.kind };
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
  if (result.kind !== "candidates_rejected") {
    return { ok: false, stale: false, message: "A rejeição dos candidatos não produziu a decisão esperada." };
  }
  return { ok: true, kind: result.kind };
}

export async function acknowledgeInputCatalogGapAction(input: Readonly<{
  reference: InputCatalogEvaluationReference;
  output: InputCatalogEvaluationOutput;
  selectedCandidateIndexes: readonly number[];
  humanCandidate?: Readonly<{
    factualNeed: string;
    suggestedTaxonomyLayer: "universal" | "segment" | "niche" | "ultra_niche";
  }> | null;
}>): Promise<AcknowledgeInputCatalogGapActionResult> {
  const result = await executeAdministrativeEvaluationDecision({
    decision: "acknowledge_factual_gap",
    reference: input.reference,
    output: input.output,
    selectedCandidateIndexes: input.selectedCandidateIndexes,
    humanCandidate: input.humanCandidate,
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
  humanCandidate?: Readonly<{
    factualNeed: string;
    suggestedTaxonomyLayer: "universal" | "segment" | "niche" | "ultra_niche";
  }> | null;
}>) {
  const gate = await requirePlatformAdmin();
  if (!gate.allowed) {
    return { ok: false as const, stale: false, message: "Acesso administrativo não autorizado." };
  }
  return executeInputCatalogEvaluationAdministrativeActionCore(
    {
      decision: input.decision,
      decisionToken: input.reference.decisionToken,
      decisionTokenSecret: process.env.OPENAI_API_KEY,
      output: input.output,
      selectedCandidateIndexes: input.selectedCandidateIndexes,
      humanCandidate: input.humanCandidate,
    },
    {
      requireRuntime: async () => {
        const runtime = await resolveInputCatalogEvaluationRuntimeReadiness();
        return runtime.ok
          ? { ok: true as const }
          : { ok: false as const, message: runtime.message };
      },
      revalidate: async (evidence) => {
        const current = await reconstructCanonicalInputCatalogEvaluationContext({
          taxonId: evidence.taxonId,
          inputCatalogVersion: evidence.inputCatalogVersion,
        });
        if (!current.ok) return { ok: false as const, message: current.error.message };
        const revalidated = await revalidateInputCatalogEvaluationContext(
          current.value.identity,
          {
            taxonId: evidence.taxonId,
            inputCatalogVersion: evidence.inputCatalogVersion,
          },
          reconstructCanonicalInputCatalogEvaluationContext,
        );
        if (
          !revalidated.ok ||
          fingerprintInputCatalogEvaluationContextIdentity(revalidated.value.contextIdentity) !==
            evidence.contextFingerprint
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

export async function releaseTaxonAction(
  previousState: ReleaseTaxonActionState,
  formData: FormData,
): Promise<ReleaseTaxonActionState> {
  const revision = previousState.revision + 1;
  const gate = await requirePlatformAdmin();
  if (!gate.allowed) {
    return {
      error: "Acesso administrativo não autorizado.",
      released: false,
      revision,
    };
  }

  const result = await releaseAdminTaxon({
    taxonId: String(formData.get("taxonId") ?? ""),
    coverageFingerprint: String(formData.get("coverageFingerprint") ?? ""),
  });
  if (!result.ok) {
    return { error: result.error, released: false, revision };
  }

  revalidatePath("/admin/taxonomia");
  revalidatePath(`/admin/taxonomia/${result.taxonId}`);
  return { error: null, released: true, revision };
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
