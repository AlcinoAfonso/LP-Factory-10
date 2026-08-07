import Link from "next/link";
import { notFound } from "next/navigation";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminStatusBadge } from "@/components/admin/AdminStatusBadge";
import { getAdminArea } from "@/components/admin/adminNavigation";
import {
  getGenerationProfileAssistanceAvailability,
  readAdminGenerationProfileDetail,
  readAdminGenerationProfileLifecycleReadiness,
} from "@/conversion-content/adapters/landingPageGenerationProfileAdminAdapter";
import { resolveLandingPageGenerationProfileForTaxon } from "@/conversion-content/adapters/landingPageGenerationProfileAdapter";
import { resolveLandingPageResearchForTaxon } from "@/conversion-content/adapters/landingPageResearchAdapter";
import { isGenerationProfileAssistanceConfigured } from "@/conversion-content/landing-page/generation-profile";
import { GenerationProfileEditor } from "../_components/GenerationProfileEditor";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminGenerationProfileDetailPage({
  params,
}: {
  params: Promise<{ taxonId: string }>;
}) {
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
  const researchAvailability = getGenerationProfileAssistanceAvailability({
    aiConfigured,
    research: researchPreflight,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-4 text-sm font-medium">
        <Link className="text-brand-700 hover:underline" href="/admin/perfis-de-orientacao">
          Voltar para perfis
        </Link>
        <Link className="text-brand-700 hover:underline" href={`/admin/taxonomia/${taxonId}`}>
          Ver diagnóstico do taxon
        </Link>
      </div>

      <AdminPageHeader
        title={`${area.title}: ${detail.taxon.name}`}
        description="Crie uma nova versao, revise a proposta e ative somente apos confirmacao humana."
        meta={`${detail.taxon.level} / ${detail.taxon.slug}`}
      />

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-border bg-card p-4 shadow-card">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-semibold">Perfil resolvido atual</h2>
            {current?.kind === "resolved" ? (
              <>
                <AdminStatusBadge tone="success">
                  {current.relation === "own" ? "Ativo — próprio" : "Ativo — herdado"}
                </AdminStatusBadge>
                <AdminStatusBadge>v{current.profileVersion}</AdminStatusBadge>
              </>
            ) : current?.kind === "absent" ? (
              <AdminStatusBadge>Ausente</AdminStatusBadge>
            ) : (
              <AdminStatusBadge tone="danger">Indisponível</AdminStatusBadge>
            )}
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            {current?.kind === "resolved"
              ? current.relation === "own"
                ? "Origem propria deste taxon."
                : `Origem herdada do taxon ${current.ownerTaxonId}.`
              : "Nenhuma origem ativa foi comprovada para este taxon."}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            O perfil ativo permanece imutavel; alteracoes exigem um novo draft.
          </p>
        </div>

        <div className="rounded-lg border border-border bg-card p-4 shadow-card">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-semibold">Assistência por IA</h2>
            <AdminStatusBadge tone={researchAvailability.available ? "success" : "neutral"}>
              {researchAvailability.available ? "Disponível" : "Indisponível"}
            </AdminStatusBadge>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            {researchAvailability.available
              ? "A proposta assistida pode ser solicitada por acao humana explicita."
              : researchAvailability.reason}
          </p>
          <p className="mt-2 text-sm font-medium text-foreground">
            O editor e o fluxo manual continuam disponiveis sem IA.
          </p>
        </div>
      </section>

      <GenerationProfileEditor
        taxon={detail.taxon}
        profiles={detail.profiles}
        aiConfigured={aiConfigured}
        researchAvailability={researchAvailability}
        lifecycle={lifecycle}
      />
    </div>
  );
}
