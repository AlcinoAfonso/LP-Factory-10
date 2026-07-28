import { notFound } from "next/navigation";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminStatusBadge } from "@/components/admin/AdminStatusBadge";
import { getAdminArea } from "@/components/admin/adminNavigation";
import { readAdminGenerationProfileDetail, readAdminGenerationProfileLifecycleReadiness } from "@/conversion-content/adapters/landingPageGenerationProfileAdminAdapter";
import { resolveLandingPageGenerationProfileForTaxon } from "@/conversion-content/adapters/landingPageGenerationProfileAdapter";
import { GenerationProfileEditor } from "../_components/GenerationProfileEditor";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminGenerationProfileDetailPage({ params }: { params: Promise<{ taxonId: string }> }) {
  const { taxonId } = await params;
  const area = getAdminArea("/admin/perfis-de-orientacao");
  const detail = await readAdminGenerationProfileDetail({ taxonId });
  if (!area || !detail.ok) notFound();
  const [resolved, lifecycle] = await Promise.all([
    resolveLandingPageGenerationProfileForTaxon({ taxonId }),
    readAdminGenerationProfileLifecycleReadiness(),
  ]);
  const current = resolved.ok ? resolved.value : null;
  return <div className="space-y-6"><AdminPageHeader title={`${area.title}: ${detail.taxon.name}`} description="Crie uma nova versao, revise a proposta e ative somente apos confirmacao humana." meta={`${detail.taxon.level} · ${detail.taxon.slug}`} /><section className="rounded-lg border border-border bg-card p-4 shadow-card"><div className="flex flex-wrap items-center gap-2"><h2 className="font-semibold">Perfil resolvido atual</h2>{current?.kind === "resolved" ? <><AdminStatusBadge tone="success">{current.relation}</AdminStatusBadge><AdminStatusBadge>v{current.profileVersion}</AdminStatusBadge></> : current?.kind === "absent" ? <AdminStatusBadge>ausente</AdminStatusBadge> : <AdminStatusBadge tone="danger">indisponivel</AdminStatusBadge>}</div><p className="mt-2 text-sm text-muted-foreground">O perfil ativo permanece imutavel; alteracoes exigem um novo draft.</p></section><GenerationProfileEditor taxon={detail.taxon} profiles={detail.profiles} aiConfigured={Boolean(process.env.OPENAI_API_KEY?.trim() && process.env.OPENAI_LANDING_PAGE_GENERATION_PROFILE_MODEL?.trim())} lifecycle={lifecycle} /></div>;
}
