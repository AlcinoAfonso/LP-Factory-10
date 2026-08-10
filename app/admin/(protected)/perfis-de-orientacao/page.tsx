import Link from "next/link";
import { notFound } from "next/navigation";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminStatusBadge } from "@/components/admin/AdminStatusBadge";
import { getAdminArea } from "@/components/admin/adminNavigation";
import { EmptyState } from "@/components/ui/empty-state";
import {
  getGenerationProfileAssistanceAvailability,
  listAdminGenerationProfiles,
} from "@/conversion-content/adapters/landingPageGenerationProfileAdminAdapter";
import { resolveLandingPageResearchForTaxons } from "@/conversion-content/adapters/landingPageResearchAdapter";
import {
  getAdminGenerationProfilePresentation,
  isGenerationProfileAssistanceConfigured,
} from "@/conversion-content/landing-page/generation-profile";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminGenerationProfilesPage() {
  const area = getAdminArea("/admin/perfis-de-orientacao");
  const result = await listAdminGenerationProfiles();
  if (!area) notFound();

  const research = result.ok
    ? await resolveLandingPageResearchForTaxons({
        taxonIds: [...new Set(result.items.map(
          (item) => getAdminGenerationProfilePresentation(item).assistanceTaxonId,
        ))],
      })
    : new Map();
  const aiConfigured = isGenerationProfileAssistanceConfigured({
    apiKey: process.env.OPENAI_API_KEY,
  });

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={area.title}
        description="Gerencie perfis próprios e reconheça herança, rascunhos e assistência por IA sem bloquear o fluxo manual."
        meta="E12.4.3"
      />

      {!result.ok ? (
        <EmptyState
          title="Perfis indisponiveis"
          description={`Falha de leitura: ${result.error}.`}
        />
      ) : result.items.length === 0 ? (
        <EmptyState
          title="Nenhum taxon elegivel"
          description="Cadastre um segmento ou nicho ativo antes de criar perfis."
        />
      ) : (
        <section className="overflow-hidden rounded-lg border border-border bg-card shadow-card">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border text-sm">
              <thead className="bg-muted/60 text-left text-xs font-medium uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Taxon</th>
                  <th className="px-4 py-3">Perfil ativo</th>
                  <th className="px-4 py-3">Rascunho próprio</th>
                  <th className="px-4 py-3">Origem</th>
                  <th className="px-4 py-3">Assistência por IA</th>
                  <th className="px-4 py-3">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {result.items.map((item) => {
                  const presentation = getAdminGenerationProfilePresentation(item);
                  const assistance = getGenerationProfileAssistanceAvailability({
                    aiConfigured,
                    research: research.get(presentation.assistanceTaxonId),
                  });

                  return (
                    <tr key={item.taxon.id} className="align-top">
                      <td className="px-4 py-3">
                        <p className="font-medium text-foreground">{item.taxon.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.taxon.level} / {item.taxon.slug}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <AdminStatusBadge tone={presentation.active.tone}>
                          {presentation.active.label}
                        </AdminStatusBadge>
                      </td>
                      <td className="px-4 py-3">
                        <AdminStatusBadge tone={presentation.draft.tone}>
                          {presentation.draft.label}
                        </AdminStatusBadge>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {item.ownerTaxonName ?? "—"}
                      </td>
                      <td className="px-4 py-3">
                        <AdminStatusBadge tone={assistance.available ? "success" : "neutral"}>
                          {assistance.available ? "Disponível" : "Indisponível"}
                        </AdminStatusBadge>
                        {!assistance.available ? (
                          <p className="mt-1 max-w-xs text-xs text-muted-foreground">
                            Fluxo manual disponivel.
                          </p>
                        ) : null}
                      </td>
                      <td className="px-4 py-3">
                        <Link className="font-medium text-brand-700 hover:underline" href={presentation.action.href}>
                          {presentation.action.label}
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
