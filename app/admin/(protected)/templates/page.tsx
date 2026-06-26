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
          description="Lista administrativa de taxons comerciais elegiveis."
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
        description="Lista limpa de taxons comerciais. Selecione um taxon para operar draft, preview, publicacao e historico."
        meta="commercial_activation"
      />

      <section className="overflow-hidden rounded-lg border border-border bg-card shadow-card">
        <div className="border-b border-border px-4 py-3">
          <h2 className="text-sm font-semibold text-card-foreground">
            Taxons comerciais
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
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3">Pesquisa</th>
                  <th className="px-4 py-3">Composicao</th>
                  <th className="px-4 py-3">Artefatos</th>
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
              title="Nenhum taxon elegivel"
              description="A lista sera preenchida quando houver pesquisa estruturada completa."
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
        <AdminStatusBadge tone={listStateTone(item.state)}>
          {item.stateLabel}
        </AdminStatusBadge>
      </td>
      <td className="px-4 py-3 text-muted-foreground">
        <span className="whitespace-nowrap">
          BB {item.research.businessBuyerBlocks}/4 (
          {item.research.businessBuyerItems})
        </span>
        <span className="ml-0 block whitespace-nowrap sm:ml-2 sm:inline">
          EC {item.research.endCustomerBlocks}/4 (
          {item.research.endCustomerItems})
        </span>
      </td>
      <td className="px-4 py-3 text-muted-foreground">
        {item.hasActiveComposition ? "Pronta" : "Sob demanda"}
      </td>
      <td className="px-4 py-3 text-muted-foreground">
        <span className="whitespace-nowrap">
          {item.publishedVersion
            ? `published v${item.publishedVersion}`
            : "sem published"}
        </span>
        <span className="ml-0 block whitespace-nowrap sm:ml-2 sm:inline">
          {item.latestDraftVersion ? `draft v${item.latestDraftVersion}` : "sem draft"}
        </span>
      </td>
      <td className="px-4 py-3">
        <Link
          href={`/admin/templates/commercial-activation/${encodeURIComponent(
            item.taxon.slug,
          )}`}
          className="text-sm font-medium text-brand-700 hover:underline"
        >
          Selecionar
        </Link>
      </td>
    </tr>
  );
}

function listStateTone(status: AdminCommercialActivationListItem["state"]) {
  if (status === "published") return "success";
  if (status === "review") return "warning";
  return "neutral";
}
