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
import { isGenerationProfileAssistanceConfigured } from "@/conversion-content/landing-page/generation-profile";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminGenerationProfilesPage() {
  const area = getAdminArea("/admin/perfis-de-orientacao");
  const result = await listAdminGenerationProfiles();
  if (!area) notFound();

  const research = result.ok
    ? await resolveLandingPageResearchForTaxons({
        taxonIds: result.items.map((item) => item.taxon.id),
      })
    : new Map();
  const aiConfigured = isGenerationProfileAssistanceConfigured({
    apiKey: process.env.OPENAI_API_KEY,
    model: process.env.OPENAI_LANDING_PAGE_GENERATION_PROFILE_MODEL,
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
                  <th className="px-4 py-3">Perfil</th>
                  <th className="px-4 py-3">Origem</th>
                  <th className="px-4 py-3">Assistência por IA</th>
                  <th className="px-4 py-3">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {result.items.map((item) => {
                  const assistance = getGenerationProfileAssistanceAvailability({
                    aiConfigured,
                    research: research.get(item.taxon.id),
                  });
                  const href = item.ownerTaxonId
                    ? `/admin/perfis-de-orientacao/${item.ownerTaxonId}`
                    : `/admin/perfis-de-orientacao/${item.taxon.id}`;

                  return (
                    <tr key={item.taxon.id} className="align-top">
                      <td className="px-4 py-3">
                        <p className="font-medium text-foreground">{item.taxon.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.taxon.level} / {item.taxon.slug}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <AdminStatusBadge tone={profileStateTone(item.profileState)}>
                          {profileStateLabel(item.profileState)}
                          {item.profileVersion ? ` v${item.profileVersion}` : ""}
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
                        <Link className="font-medium text-brand-700 hover:underline" href={href}>
                          {profileActionLabel(item.profileState)}
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

function profileStateLabel(state: "active_own" | "active_inherited" | "draft_own" | "absent" | "unavailable") {
  if (state === "active_own") return "Ativo — próprio";
  if (state === "active_inherited") return "Ativo — herdado";
  if (state === "draft_own") return "Rascunho — próprio";
  if (state === "unavailable") return "Indisponível";
  return "Ausente";
}

function profileStateTone(state: "active_own" | "active_inherited" | "draft_own" | "absent" | "unavailable") {
  if (state === "active_own" || state === "active_inherited") return "success";
  if (state === "draft_own") return "warning";
  if (state === "unavailable") return "danger";
  return "neutral";
}

function profileActionLabel(state: "active_own" | "active_inherited" | "draft_own" | "absent" | "unavailable") {
  if (state === "draft_own") return "Continuar";
  if (state === "active_own") return "Gerenciar";
  if (state === "active_inherited") return "Ver perfil";
  if (state === "absent") return "Criar perfil";
  return "Revisar";
}
