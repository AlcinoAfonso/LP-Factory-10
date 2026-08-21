"use server";

import { createHash, randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requirePlatformAdmin } from "@/lib/access/guards";
import { reconstructCanonicalInputCatalogEvaluationContext } from "@/conversion-content/adapters/inputCatalogEvaluationContextAdapter";
import { evaluateInputCatalogWithOpenAi } from "@/conversion-content/adapters/inputCatalogEvaluationOpenAiAdapter";
import {
  coordinateInputCatalogEvaluation,
  revalidateInputCatalogEvaluationContext,
  type InputCatalogEvaluationContextIdentity,
  type InputCatalogEvaluationMode,
  type InputCatalogEvaluationOutput,
} from "@/conversion-content/landing-page/taxon-preparation";
import { loadTaxonPreparationForReviewedVersion } from "@/conversion-content/adapters/selectedEndCustomerResearchAdapter";
import { nextInputCatalogReviewActionRevision } from "@/lib/admin/adapters/adminTaxonomyReviewPolicy";
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
import {
  resolveOpenAiProductWorkload,
  resolveOpenAiWorkloadEnvironment,
} from "@/openai-workloads";

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
  taxonId: string;
  inputCatalogVersion: number;
  contextFingerprint: string;
}>;

export type InputCatalogEvaluationActionResult =
  | Readonly<{
      ok: true;
      output: InputCatalogEvaluationOutput;
      reference: InputCatalogEvaluationReference;
    }>
  | Readonly<{ ok: false; code: string; message: string }>;

export type ConfirmInputCatalogEvaluationActionResult =
  | Readonly<{ ok: true; reviewedVersion: number }>
  | Readonly<{ ok: false; stale: boolean; message: string }>;

export async function evaluateInputCatalogAction(input: Readonly<{
  taxonId: string;
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

  const preparation = await loadTaxonPreparationForReviewedVersion({
    taxonId: input.taxonId,
  });
  if (!preparation.ok) {
    return { ok: false, code: preparation.error.code, message: preparation.error.message };
  }

  let feedback: Parameters<typeof coordinateInputCatalogEvaluation>[0]["feedback"] = null;
  if (input.feedback) {
    if (
      input.feedback.reference.taxonId !== input.taxonId ||
      input.feedback.reference.inputCatalogVersion !==
        preparation.value.requiredInputCatalogVersion
    ) {
      return {
        ok: false,
        code: "CONTEXT_STALE",
        message: "O contexto da avaliação anterior não corresponde à execução atual.",
      };
    }
    const previousContext = await reconstructCanonicalInputCatalogEvaluationContext({
      taxonId: input.feedback.reference.taxonId,
      inputCatalogVersion: input.feedback.reference.inputCatalogVersion,
    });
    if (
      !previousContext.ok ||
      fingerprintEvaluationContext(previousContext.value.identity) !==
        input.feedback.reference.contextFingerprint
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

  const environment = resolveOpenAiWorkloadEnvironment();
  const requestId = randomUUID();
  const result = await coordinateInputCatalogEvaluation(
    {
      taxonId: input.taxonId,
      inputCatalogVersion: preparation.value.requiredInputCatalogVersion,
      mode: input.mode,
      focalHypothesis: input.focalHypothesis,
      feedback,
    },
    {
      reconstructContext: reconstructCanonicalInputCatalogEvaluationContext,
      evaluate: async (request) => {
        const configuration = await resolveOpenAiProductWorkload(
          "taxon_input_catalog_sufficiency_evaluation",
          environment,
        );
        if (!configuration.ok) {
          return { status: "failure", message: configuration.error.code };
        }
        return evaluateInputCatalogWithOpenAi({
          apiKey: process.env.OPENAI_API_KEY,
          configuration: configuration.value,
          environment,
          request,
          requestId,
          safetyIdentifier: `platform_admin_${gate.actorUserId.replaceAll("-", "")}`,
        });
      },
    },
  );

  if (!result.ok) {
    return { ok: false, code: result.error.code, message: result.error.message };
  }
  return {
    ok: true,
    output: result.value.output,
    reference: {
      taxonId: result.value.contextIdentity.taxonId,
      inputCatalogVersion: result.value.contextIdentity.inputCatalog.version,
      contextFingerprint: fingerprintEvaluationContext(result.value.contextIdentity),
    },
  };
}

export async function confirmInputCatalogEvaluationAction(input: Readonly<{
  reference: InputCatalogEvaluationReference;
}>): Promise<ConfirmInputCatalogEvaluationActionResult> {
  const gate = await requirePlatformAdmin();
  if (!gate.allowed) {
    return { ok: false, stale: false, message: "Acesso administrativo não autorizado." };
  }

  const current = await reconstructCanonicalInputCatalogEvaluationContext({
    taxonId: input.reference.taxonId,
    inputCatalogVersion: input.reference.inputCatalogVersion,
  });
  if (!current.ok) {
    return { ok: false, stale: true, message: current.error.message };
  }
  const revalidated = await revalidateInputCatalogEvaluationContext(
    current.value.identity,
    {
      taxonId: input.reference.taxonId,
      inputCatalogVersion: input.reference.inputCatalogVersion,
    },
    reconstructCanonicalInputCatalogEvaluationContext,
  );
  if (
    !revalidated.ok ||
    fingerprintEvaluationContext(revalidated.value.contextIdentity) !==
      input.reference.contextFingerprint
  ) {
    return {
      ok: false,
      stale: true,
      message: revalidated.ok
        ? "As fontes mudaram desde a avaliação. Execute uma nova avaliação."
        : revalidated.error.message,
    };
  }

  const recorded = await recordAdminInputCatalogReview({
    taxonId: input.reference.taxonId,
    inputCatalogVersion: input.reference.inputCatalogVersion,
  });
  if (!recorded.ok) {
    return { ok: false, stale: true, message: recorded.error };
  }
  if (recorded.reviewedVersion === null) {
    return {
      ok: false,
      stale: true,
      message: "A versão E20.2 não foi preservada pela confirmação.",
    };
  }
  revalidatePath("/admin/taxonomia");
  revalidatePath(`/admin/taxonomia/${recorded.taxonId}`);
  return { ok: true, reviewedVersion: recorded.reviewedVersion };
}

function fingerprintEvaluationContext(identity: InputCatalogEvaluationContextIdentity) {
  return createHash("sha256").update(JSON.stringify(identity)).digest("hex");
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
    isActive: formData.get("isActive") === "on",
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
  const result = await recordAdminInputCatalogReview({
    taxonId: String(formData.get("taxonId") ?? ""),
    inputCatalogVersion: Number(formData.get("inputCatalogVersion")),
  });
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
