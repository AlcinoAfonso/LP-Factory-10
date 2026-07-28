"use server";

import { revalidatePath } from "next/cache";

import { requirePlatformAdmin } from "@/lib/access/guards";
import { createClient } from "@/lib/supabase/server";
import {
  activateAdminGenerationProfile,
  archiveAdminGenerationProfile,
  saveAdminGenerationProfileDraft,
} from "@/conversion-content/adapters/landingPageGenerationProfileAdminAdapter";
import { fingerprintGenerationProfileProposal, getGenerationProfileProposalCorrelation, type GenerationProfileDraftInput } from "@/conversion-content/landing-page/generation-profile";
import { proposeLandingPageGenerationProfile } from "@/conversion-content/landing-page/generation-profile/proposal-server";

export async function saveGenerationProfileAction(input: GenerationProfileDraftInput) {
  const gate = await requirePlatformAdmin();
  if (!gate.allowed) return { ok: false as const, error: { code: "unauthorized", message: "Acesso administrativo nao autorizado." } };
  const result = await saveAdminGenerationProfileDraft(input);
  if (result.ok) {
    revalidateGenerationProfilePaths(input.ownerTaxonId);
    const correlation = getGenerationProfileProposalCorrelation(input);
    if (correlation) {
      console.info("generation_profile_proposal_review", {
        requestId: correlation.requestId,
        taxonId: input.ownerTaxonId,
        profileId: result.profileId,
        result: fingerprintGenerationProfileProposal(input) === correlation.proposalFingerprint ? "accepted" : "adjusted",
      });
    } else if (input.origin === "ai") {
      console.info("generation_profile_proposal_review", {
        taxonId: input.ownerTaxonId,
        profileId: result.profileId,
        result: "correlation_unavailable",
      });
    }
  }
  return result;
}

export async function proposeGenerationProfileAction(input: { taxonId: string; adminGuidance?: string }) {
  const gate = await requirePlatformAdmin();
  if (!gate.allowed) return { ok: false as const, requestId: "", error: { code: "technical_failure" as const, message: "Acesso administrativo nao autorizado." } };
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.id) return { ok: false as const, requestId: "", error: { code: "technical_failure" as const, message: "Sessao administrativa indisponivel." } };
  return proposeLandingPageGenerationProfile({ ...input, actorUserId: user.id });
}

export async function discardGenerationProfileProposalAction(input: { taxonId: string; requestId: string }) {
  const gate = await requirePlatformAdmin();
  if (!gate.allowed) return { ok: false as const };
  console.info("generation_profile_proposal_review", { requestId: input.requestId, taxonId: input.taxonId, result: "discarded" });
  return { ok: true as const };
}

export async function activateGenerationProfileAction(input: { taxonId: string; profileId: string; expectedUpdatedAt: string }) {
  const gate = await requirePlatformAdmin();
  if (!gate.allowed) return { ok: false as const, error: { code: "unauthorized", message: "Acesso administrativo nao autorizado." } };
  const result = await activateAdminGenerationProfile(input);
  if (result.ok) revalidateGenerationProfilePaths(input.taxonId);
  return result;
}

export async function archiveGenerationProfileAction(input: { taxonId: string; profileId: string; expectedUpdatedAt: string }) {
  const gate = await requirePlatformAdmin();
  if (!gate.allowed) return { ok: false as const, error: { code: "unauthorized", message: "Acesso administrativo nao autorizado." } };
  const result = await archiveAdminGenerationProfile(input);
  if (result.ok) revalidateGenerationProfilePaths(input.taxonId);
  return result;
}

function revalidateGenerationProfilePaths(taxonId: string) {
  revalidatePath("/admin/perfis-de-orientacao");
  revalidatePath(`/admin/perfis-de-orientacao/${taxonId}`);
}
