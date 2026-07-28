import Link from "next/link";
import { notFound } from "next/navigation";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminStatusBadge } from "@/components/admin/AdminStatusBadge";
import { getAdminArea } from "@/components/admin/adminNavigation";
import { EmptyState } from "@/components/ui/empty-state";
import { listAdminGenerationProfiles } from "@/conversion-content/adapters/landingPageGenerationProfileAdminAdapter";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminGenerationProfilesPage() {
  const area = getAdminArea("/admin/perfis-de-orientacao");
  const result = await listAdminGenerationProfiles();
  if (!area) notFound();
  return <div className="space-y-6"><AdminPageHeader title={area.title} description="Gerencie versoes orientativas de segmentos e nichos sem alterar landing pages materializadas." meta="E12.4.3" />{!result.ok ? <EmptyState title="Perfis indisponiveis" description={`Falha de leitura: ${result.error}.`} /> : result.items.length === 0 ? <EmptyState title="Nenhum taxon elegivel" description="Cadastre um segmento ou nicho ativo antes de criar perfis." /> : <section className="overflow-hidden rounded-lg border border-border bg-card shadow-card"><div className="overflow-x-auto"><table className="min-w-full divide-y divide-border text-sm"><thead className="bg-muted/60 text-left text-xs font-medium uppercase text-muted-foreground"><tr><th className="px-4 py-3">Taxon</th><th className="px-4 py-3">Nivel</th><th className="px-4 py-3">Perfil atual</th><th className="px-4 py-3">Rascunho</th><th className="px-4 py-3">Historico</th><th className="px-4 py-3">Acao</th></tr></thead><tbody className="divide-y divide-border">{result.items.map((item) => <tr key={item.taxon.id}><td className="px-4 py-3"><p className="font-medium">{item.taxon.name}</p><p className="text-xs text-muted-foreground">{item.taxon.slug}</p></td><td className="px-4 py-3 capitalize">{item.taxon.level}</td><td className="px-4 py-3">{item.activeVersion ? <AdminStatusBadge tone="success">active v{item.activeVersion}</AdminStatusBadge> : <AdminStatusBadge>ausente</AdminStatusBadge>}</td><td className="px-4 py-3">{item.draftVersion ? <AdminStatusBadge tone="warning">draft v{item.draftVersion}</AdminStatusBadge> : "—"}</td><td className="px-4 py-3 text-muted-foreground">{item.archivedCount} archived</td><td className="px-4 py-3"><Link className="font-medium text-brand-700 hover:underline" href={`/admin/perfis-de-orientacao/${item.taxon.id}`}>Gerenciar</Link></td></tr>)}</tbody></table></div></section>}</div>;
}
