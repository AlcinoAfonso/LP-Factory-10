import { notFound } from "next/navigation";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminStatusBadge } from "@/components/admin/AdminStatusBadge";
import { getAdminArea } from "@/components/admin/adminNavigation";
import { readAdminGenerationProfileDetail, readAdminGenerationProfileLifecycleReadiness } from "@/conversion-content/adapters/landingPageGenerationProfileAdminAdapter";
import { resolveLandingPageGenerationProfileForTaxon } from "@/conversion-content/adapters/landingPageGenerationProfileAdapter";
import { resolveLandingPageResearchForTaxon } from "@/conversion-content/adapters/landingPageResearchAdapter";
import { isGenerationProfileAssistanceConfigured } from "@/conversion-content/landing-page/generation-profile";
import { GenerationProfileEditor } from "../_components/GenerationProfileEditor";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminGenerationProfileDetailPage({ params }: { params: Promise<{ taxonId: string }> }) {
  const { taxonId } = await params;
  const area = getAdminArea("/admin/perfis-de-orientacao");
  const detail = await readAdminGenerationProfileDetail({ taxonId });
  if (!area || !detail.ok) notFound();
  const [resolved, lifecycle, researchPreflight] = await Promise.all([
    resolveLandingPageGenerationProfileForTaxon({ taxonId }),
    readAdminGenerationProfileLifecycleReadiness(),
    resolveLandingPageResearchForTaxon({ taxonId }),
  ]);
  const current = resolved.ok ? resolved.value : null;
  const aiConfigured = isGenerationProfileAssistanceConfigured({
    apiKey: process.env.OPENAI_API_KEY,
    model: process.env.OPENAI_LANDING_PAGE_GENERATION_PROFILE_MODEL,
  });
  const researchAvailability = researchPreflight.ok
    ? { available: true as const, reason: null }
    : {
        available: false as const,
        reason:
          researchPreflight.error.code === "RESEARCH_INCOMPLETE" ||
          researchPreflight.error.code === "RESEARCH_MISSING"
            ? "Assistencia indisponivel: a pesquisa E10.8 esta incompleta."
            : `Assistencia indisponivel: preflight E10.8 rejeitado (${researchPreflight.error.code}).`,
      };

  return <div className="space-y-6"><AdminPageHeader title={`${area.title}: ${detail.taxon.name}`} description="Crie uma nova versao, revise a proposta e ative somente apos confirmacao humana." meta={`${detail.taxon.level} · ${detail.taxon.slug}`} /><section className="rounded-lg border border-border bg-card p-4 shadow-card"><div className="flex flex-wrap items-center gap-2"><h2 className="font-semibold">Perfil resolvido atual</h2>{current?.kind === "resolved" ? <><AdminStatusBadge tone="success">{current.relation}</AdminStatusBadge><AdminStatusBadge>v{current.profileVersion}</AdminStatusBadge></> : current?.kind === "absent" ? <AdminStatusBadge>ausente</AdminStatusBadge> : <AdminStatusBadge tone="danger">indisponivel</AdminStatusBadge>}</div><p className="mt-2 text-sm text-muted-foreground">O perfil ativo permanece imutavel; alteracoes exigem um novo draft.</p></section><GenerationProfileEditor taxon={detail.taxon} profiles={detail.profiles} aiConfigured={aiConfigured} researchAvailability={researchAvailability} lifecycle={lifecycle} /></div>;
}
