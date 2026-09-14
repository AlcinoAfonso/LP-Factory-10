"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requirePlatformAdmin } from "@/lib/access/guards";
import { reconstructCanonicalInputCatalogEvaluationContext } from "@/conversion-content/adapters/inputCatalogEvaluationContextAdapter";
import { evaluateInputCatalogWithOpenAi } from "@/conversion-content/adapters/inputCatalogEvaluationOpenAiAdapter";
import { resolveInputCatalogEvaluationRuntimeReadiness } from "@/conversion-content/adapters/inputCatalogEvaluationRuntimeGate";
import { buildInputCatalogEvaluationPrompt, inputCatalogEvaluationOutputJsonSchema, parseInputCatalogEvaluationOutput, type InputCatalogEvaluationMode, type InputCatalogEvaluationOutput } from "@/conversion-content/landing-page/taxon-preparation";
import { addAdminTaxonAlias, createAdminTaxon, deleteAdminTaxon, deleteAdminTaxonAlias, releaseAdminTaxon, selectAdminEndCustomerResearchVersion, updateAdminTaxon } from "@/lib/admin/adapters/adminReadOnlyAdapter";

export type CreateTaxonActionState = { error: string | null };
export type ManageTaxonActionState = { error: string | null };
export type ReleaseTaxonActionState = { error: string | null; released: boolean; revision: number };
export type SelectEndCustomerResearchActionState = { error: string | null; selectedVersion: number | null };
export type InputCatalogEvaluationActionResult = Readonly<{ ok: true; output: InputCatalogEvaluationOutput }> | Readonly<{ ok: false; code: string; message: string }>;

export async function evaluateInputCatalogAction(input: Readonly<{ taxonId: string; mode: InputCatalogEvaluationMode; focalHypothesis: string | null }>): Promise<InputCatalogEvaluationActionResult> {
  const gate = await requirePlatformAdmin();
  if (!gate.allowed) return { ok: false, code: "UNAUTHORIZED", message: "Acesso administrativo não autorizado." };
  const runtime = await resolveInputCatalogEvaluationRuntimeReadiness();
  if (!runtime.ok) return { ok: false, code: runtime.code, message: runtime.message };
  const context = await reconstructCanonicalInputCatalogEvaluationContext({ taxonId: input.taxonId, mode: input.mode });
  if (!context.ok) return { ok: false, code: "CONTEXT_UNAVAILABLE", message: context.error.message };
  let prompt;
  try { prompt = buildInputCatalogEvaluationPrompt({ context: context.value, focalHypothesis: input.focalHypothesis }); }
  catch { return { ok: false, code: "INVALID_HYPOTHESIS", message: "Informe uma hipótese focal válida." }; }
  const provider = await evaluateInputCatalogWithOpenAi({
    configuration: runtime.configuration, environment: runtime.environment, requestId: randomUUID(),
    safetyIdentifier: `platform_admin_${gate.actorUserId.replace(/-/g, "").slice(0, 32)}`,
    request: { mode: input.mode, sourceStrategy: context.value.sourceStrategy, deadlineAtMs: Date.now() + 45_000, prompt, outputSchema: inputCatalogEvaluationOutputJsonSchema },
  });
  if (provider.status !== "completed") return { ok: false, code: provider.status.toUpperCase(), message: "A assistência por IA está indisponível; a operação humana permanece liberada." };
  const parsed = parseInputCatalogEvaluationOutput(provider.output);
  if (!parsed.ok) return { ok: false, code: parsed.error.code, message: parsed.error.message };
  const allowedUrls = new Set(provider.provenance?.webSources.map((source) => source.url) ?? []);
  const citedUrls = [ ...parsed.value.summarySourceUrls, ...parsed.value.candidates.flatMap((candidate) => candidate.sourceUrls) ];
  if (citedUrls.some((url) => !allowedUrls.has(url))) return { ok: false, code: "SOURCE_PROVENANCE_INVALID", message: "A resposta citou fonte não comprovada pelo provider." };
  return { ok: true, output: parsed.value };
}

export async function createTaxonAction(_previousState: CreateTaxonActionState, formData: FormData): Promise<CreateTaxonActionState> {
  const gate = await requirePlatformAdmin();
  if (!gate.allowed) return { error: "Acesso administrativo nao autorizado." };
  const result = await createAdminTaxon({ name: String(formData.get("name") ?? ""), level: String(formData.get("level") ?? ""), parentId: String(formData.get("parentId") ?? ""), slug: String(formData.get("slug") ?? ""), aliases: [String(formData.get("aliases") ?? "")] });
  if (!result.ok) return { error: result.error };
  revalidatePath("/admin/taxonomia"); revalidatePath(`/admin/taxonomia/${result.taxonId}`); redirect(`/admin/taxonomia/${result.taxonId}`);
}
export async function updateTaxonAction(_previousState: ManageTaxonActionState, formData: FormData): Promise<ManageTaxonActionState> {
  const gate = await requirePlatformAdmin(); if (!gate.allowed) return { error: "Acesso administrativo nao autorizado." };
  const result = await updateAdminTaxon({ id: String(formData.get("taxonId") ?? ""), name: String(formData.get("name") ?? ""), slug: String(formData.get("slug") ?? ""), isActive: formData.get("isActive") === "on" });
  if (!result.ok) return { error: result.error }; revalidateTaxon(result.taxonId); return { error: null };
}
export async function releaseTaxonAction(previousState: ReleaseTaxonActionState, formData: FormData): Promise<ReleaseTaxonActionState> {
  const revision = previousState.revision + 1; const gate = await requirePlatformAdmin(); if (!gate.allowed) return { error: "Acesso administrativo não autorizado.", released: false, revision };
  const result = await releaseAdminTaxon({ taxonId: String(formData.get("taxonId") ?? ""), coverageFingerprint: String(formData.get("coverageFingerprint") ?? "") });
  if (!result.ok) return { error: result.error, released: false, revision }; revalidateTaxon(result.taxonId); return { error: null, released: true, revision };
}
export async function selectEndCustomerResearchAction(_previousState: SelectEndCustomerResearchActionState, formData: FormData): Promise<SelectEndCustomerResearchActionState> {
  const gate = await requirePlatformAdmin(); if (!gate.allowed) return { error: "Acesso administrativo não autorizado.", selectedVersion: null };
  const result = await selectAdminEndCustomerResearchVersion({ taxonId: String(formData.get("taxonId") ?? ""), researchVersion: Number(formData.get("researchVersion")) });
  if (!result.ok) return { error: result.error, selectedVersion: null }; revalidateTaxon(result.taxonId); return { error: null, selectedVersion: result.selectedVersion };
}
export async function addTaxonAliasAction(_previousState: ManageTaxonActionState, formData: FormData): Promise<ManageTaxonActionState> {
  const gate = await requirePlatformAdmin(); if (!gate.allowed) return { error: "Acesso administrativo nao autorizado." };
  const result = await addAdminTaxonAlias({ taxonId: String(formData.get("taxonId") ?? ""), aliasText: String(formData.get("aliasText") ?? "") });
  if (!result.ok) return { error: result.error }; revalidateTaxon(result.taxonId); return { error: null };
}
export async function deleteTaxonAliasAction(_previousState: ManageTaxonActionState, formData: FormData): Promise<ManageTaxonActionState> {
  const gate = await requirePlatformAdmin(); if (!gate.allowed) return { error: "Acesso administrativo nao autorizado." };
  const result = await deleteAdminTaxonAlias({ taxonId: String(formData.get("taxonId") ?? ""), aliasId: String(formData.get("aliasId") ?? "") });
  if (!result.ok) return { error: result.error }; revalidateTaxon(result.taxonId); return { error: null };
}
export async function deleteTaxonAction(_previousState: ManageTaxonActionState, formData: FormData): Promise<ManageTaxonActionState> {
  const gate = await requirePlatformAdmin(); if (!gate.allowed) return { error: "Acesso administrativo nao autorizado." };
  const result = await deleteAdminTaxon({ taxonId: String(formData.get("taxonId") ?? ""), confirmSlug: String(formData.get("confirmSlug") ?? "") });
  if (!result.ok) return { error: result.error }; revalidatePath("/admin/taxonomia"); redirect("/admin/taxonomia");
}
function revalidateTaxon(taxonId: string) { revalidatePath("/admin/taxonomia"); revalidatePath(`/admin/taxonomia/${taxonId}`); }
