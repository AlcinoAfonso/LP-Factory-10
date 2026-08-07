import Link from "next/link";
import { notFound } from "next/navigation";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminStatusBadge } from "@/components/admin/AdminStatusBadge";
import { getAdminArea } from "@/components/admin/adminNavigation";
import { EmptyState } from "@/components/ui/empty-state";
import {
  readAdminCommercialActivationOverview,
  type AdminCommercialActivationListItem,
} from "@/lib/admin/adapters/adminCommercialActivationTemplatesAdapter";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminTemplatesPage() {
  const area = getAdminArea("/admin/templates");
  const overview = await readAdminCommercialActivationOverview();

  if (!area) {
    notFound();
  }

  if (!overview.ok) {
    return (
      <div className="space-y-6">
        <AdminPageHeader
          title={area.title}
          description="Lista administrativa de taxons comerciais elegiveis e nao elegiveis."
          meta="commercial_activation"
        />
        <EmptyState
          title="Templates comerciais indisponiveis"
          description={`Nao foi possivel carregar a lista administrativa: ${overview.reason}.`}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={area.title}
        description="Reconheca elegibilidade, requisitos e estado da pagina antes de entrar no fluxo operacional."
        meta="commercial_activation"
      />

      <section className="overflow-hidden rounded-lg border border-border bg-card shadow-card">
        <div className="border-b border-border px-4 py-3">
          <h2 className="text-sm font-semibold text-card-foreground">
            Taxons ativos
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Esta lista e somente leitura: nao gera draft, nao materializa
            composicao, nao publica e nao chama IA.
          </p>
        </div>
        {overview.items.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border text-sm">
              <thead className="bg-muted/60 text-left text-xs font-medium uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Taxon</th>
                  <th className="px-4 py-3">Elegibilidade</th>
                  <th className="px-4 py-3">Requisitos</th>
                  <th className="px-4 py-3">Estado da pagina</th>
                  <th className="px-4 py-3">Acao</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {overview.items.map((item) => (
                  <TaxonRow key={item.taxon.id} item={item} />
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-4">
            <EmptyState
              title="Nenhum taxon ativo"
              description="A lista sera preenchida quando houver taxons ativos."
            />
          </div>
        )}
      </section>
    </div>
  );
}

function TaxonRow({ item }: { item: AdminCommercialActivationListItem }) {
  return (
    <tr>
      <td className="px-4 py-3">
        <p className="font-medium text-foreground">{item.taxon.name}</p>
        <p className="text-xs text-muted-foreground">{item.taxon.slug}</p>
      </td>
      <td className="px-4 py-3">
        <AdminStatusBadge tone={item.eligibility === "eligible" ? "success" : "warning"}>
          {item.eligibilityLabel}
        </AdminStatusBadge>
      </td>
      <td className="px-4 py-3 text-muted-foreground">
        {item.requirementsLabel}
      </td>
      <td className="px-4 py-3">
        <AdminStatusBadge tone={pageStateTone(item.pageState)}>
          {item.pageStateLabel}
        </AdminStatusBadge>
      </td>
      <td className="px-4 py-3">
        <Link
          href={item.eligibility === "eligible"
            ? `/admin/templates/commercial-activation/${encodeURIComponent(item.taxon.slug)}`
            : `/admin/taxonomia/${item.taxon.id}`}
          className="text-sm font-medium text-brand-700 hover:underline"
        >
          {item.eligibility === "eligible" ? "Abrir fluxo" : "Ver pendências"}
        </Link>
      </td>
    </tr>
  );
}

function pageStateTone(status: AdminCommercialActivationListItem["pageState"]) {
  if (status === "published") return "success";
  if (status === "review") return "warning";
  return "neutral";
}
