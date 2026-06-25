import Link from "next/link";
import { notFound } from "next/navigation";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminStatusBadge } from "@/components/admin/AdminStatusBadge";
import { getAdminArea } from "@/components/admin/adminNavigation";
import { EmptyState } from "@/components/ui/empty-state";
import { CommercialActivationRenderer } from "@/conversion-content/commercial-activation/renderer";
import {
  readAdminCommercialActivationOverview,
  type AdminCommercialActivationListItem,
} from "@/lib/admin/adapters/adminCommercialActivationTemplatesAdapter";
import {
  generateOrRegenerateCommercialActivationDraftAction,
  publishCommercialActivationDraftAction,
} from "./actions";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type AdminTemplatesPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminTemplatesPage({
  searchParams,
}: AdminTemplatesPageProps) {
  const area = getAdminArea("/admin/templates");
  const params = (await searchParams) ?? {};
  const selectedTaxonSlug = getFirstParam(params.taxon);
  const overview = await readAdminCommercialActivationOverview({
    selectedTaxonSlug,
  });
  const message = getActionMessage(params);

  if (!area) {
    notFound();
  }

  if (!overview.ok) {
    return (
      <div className="space-y-6">
        <AdminPageHeader
          title={area.title}
          description="Operacao administrativa minima para drafts comerciais por taxon."
          meta="commercial_activation"
        />
        <EmptyState
          title="Templates comerciais indisponiveis"
          description={`Nao foi possivel carregar a lista administrativa: ${overview.reason}.`}
        />
      </div>
    );
  }

  const selected = overview.selected?.ok ? overview.selected : null;
  const reviewDraft = selected?.publishableDraft ?? null;
  const previewArtifact =
    reviewDraft ?? selected?.published ?? selected?.latestDraft ?? null;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={area.title}
        description="Operacao minima para taxons elegiveis por pesquisa estruturada completa."
        meta="commercial_activation"
      />

      {message ? (
        <section className={message.className}>
          <p className="text-sm font-medium">{message.title}</p>
          <p className="mt-1 text-sm">{message.description}</p>
        </section>
      ) : null}

      <section className="overflow-hidden rounded-lg border border-border bg-card shadow-card">
        <div className="border-b border-border px-4 py-3">
          <h2 className="text-sm font-semibold text-card-foreground">
            Taxons elegiveis
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            A lista usa pesquisa completa; nao cria composicao nem draft.
          </p>
        </div>
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
                <TaxonRow
                  key={item.taxon.id}
                  item={item}
                  selected={selected?.taxon.id === item.taxon.id}
                />
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {selected ? (
        <section className="rounded-lg border border-border bg-card p-5 shadow-card">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-3">
              <div>
                <p className="text-xs font-medium uppercase text-muted-foreground">
                  Taxon selecionado
                </p>
                <h2 className="mt-1 text-lg font-semibold text-card-foreground">
                  {selected.taxon.name}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {selected.taxon.slug}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <AdminStatusBadge tone={reviewDraft ? "warning" : "neutral"}>
                  {reviewDraft ? "Em revisao" : "Sem draft em revisao"}
                </AdminStatusBadge>
                <AdminStatusBadge tone={selected.published ? "success" : "neutral"}>
                  {selected.published ? "Publicado" : "Sem published"}
                </AdminStatusBadge>
                <AdminStatusBadge tone={selected.composition ? "success" : "neutral"}>
                  {selected.composition ? "Composicao pronta" : "Composicao sob demanda"}
                </AdminStatusBadge>
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <form action={generateOrRegenerateCommercialActivationDraftAction}>
                <input name="taxonSlug" type="hidden" value={selected.taxon.slug} />
                <button className="inline-flex h-10 w-full items-center justify-center rounded-md bg-brand-600 px-4 text-sm font-medium text-white transition hover:bg-brand-700 sm:w-auto">
                  {reviewDraft ? "Regenerar draft" : "Gerar draft"}
                </button>
              </form>

              <form action={publishCommercialActivationDraftAction}>
                <input
                  name="artifactId"
                  type="hidden"
                  value={reviewDraft?.id ?? ""}
                />
                <button
                  className="inline-flex h-10 w-full items-center justify-center rounded-md border border-border px-4 text-sm font-medium text-muted-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                  disabled={!reviewDraft}
                >
                  Publicar draft
                </button>
              </form>
            </div>
          </div>
        </section>
      ) : (
        <EmptyState
          title="Nenhum taxon elegivel"
          description="A lista sera preenchida quando houver pesquisa estruturada completa."
        />
      )}

      {selected ? (
        <section className="grid gap-4 lg:grid-cols-3">
          <StatusCard
            label="Draft atual"
            value={reviewDraft ? `v${reviewDraft.artifactVersion}` : "Nenhum"}
            detail={
              reviewDraft
                ? `${reviewDraft.sourceCount} fontes business_buyer`
                : selected.latestDraft
                  ? "Draft antigo mantido apenas no historico"
                  : "Gere um draft para revisar"
            }
          />
          <StatusCard
            label="Published atual"
            value={
              selected.published ? `v${selected.published.artifactVersion}` : "Nenhum"
            }
            detail={
              selected.published?.publishedAt
                ? formatDate(selected.published.publishedAt)
                : "A publicacao usa RPC transacional"
            }
          />
          <StatusCard
            label="Historico carregado"
            value={String(selected.artifacts.length)}
            detail="draft, published e archived"
          />
        </section>
      ) : null}

      {previewArtifact && selected?.composition ? (
        <section className="space-y-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                Preview do {previewArtifact.status === "draft" ? "draft" : "published"}
              </h2>
              <p className="text-sm text-muted-foreground">
                Artifact {previewArtifact.id} - versao{" "}
                {previewArtifact.artifactVersion}
              </p>
            </div>
            <AdminStatusBadge tone={statusTone(previewArtifact.status)}>
              {previewArtifact.status}
            </AdminStatusBadge>
          </div>
          <div className="overflow-hidden rounded-lg border border-border bg-muted/40 p-3 shadow-card">
            <div className="max-h-[900px] overflow-auto rounded-lg">
              <CommercialActivationRenderer
                composition={selected.composition}
                contentJson={previewArtifact.contentJson}
              />
            </div>
          </div>
        </section>
      ) : selected ? (
        <EmptyState
          title="Nenhum artefato para visualizar"
          description="Gere o primeiro draft administrativo para habilitar o preview."
        />
      ) : null}

      {selected ? (
        <section className="overflow-hidden rounded-lg border border-border bg-card shadow-card">
          <div className="border-b border-border px-4 py-3">
            <h2 className="text-sm font-semibold text-card-foreground">
              Historico de artefatos
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border text-sm">
              <thead className="bg-muted/60 text-left text-xs font-medium uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Versao</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Fontes</th>
                  <th className="px-4 py-3">Criado</th>
                  <th className="px-4 py-3">Publicado</th>
                  <th className="px-4 py-3">Arquivado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {selected.artifacts.map((artifact) => (
                  <tr key={artifact.id}>
                    <td className="px-4 py-3 font-medium text-foreground">
                      v{artifact.artifactVersion}
                    </td>
                    <td className="px-4 py-3">
                      <AdminStatusBadge tone={statusTone(artifact.status)}>
                        {artifact.status}
                      </AdminStatusBadge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {artifact.sourceCount}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatDate(artifact.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {artifact.publishedAt ? formatDate(artifact.publishedAt) : "-"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {artifact.archivedAt ? formatDate(artifact.archivedAt) : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
    </div>
  );
}

function TaxonRow({
  item,
  selected,
}: {
  item: AdminCommercialActivationListItem;
  selected: boolean;
}) {
  return (
    <tr className={selected ? "bg-brand-50/60" : undefined}>
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
        BB {item.research.businessBuyerBlocks}/4 ({item.research.businessBuyerItems}) - EC{" "}
        {item.research.endCustomerBlocks}/4 ({item.research.endCustomerItems})
      </td>
      <td className="px-4 py-3 text-muted-foreground">
        {item.hasActiveComposition ? "Pronta" : "Sob demanda"}
      </td>
      <td className="px-4 py-3 text-muted-foreground">
        {item.publishedVersion ? `published v${item.publishedVersion}` : "sem published"}
        {item.latestDraftVersion ? ` - draft v${item.latestDraftVersion}` : ""}
      </td>
      <td className="px-4 py-3">
        <Link
          href={`/admin/templates?taxon=${encodeURIComponent(item.taxon.slug)}`}
          className="text-sm font-medium text-brand-700 hover:underline"
        >
          Selecionar
        </Link>
      </td>
    </tr>
  );
}

function StatusCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <section className="rounded-lg border border-border bg-card p-4 shadow-card">
      <p className="text-xs font-medium uppercase text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold text-card-foreground">{value}</p>
      <p className="mt-1 text-sm text-muted-foreground">{detail}</p>
    </section>
  );
}

function listStateTone(status: AdminCommercialActivationListItem["state"]) {
  if (status === "published") return "success";
  if (status === "review") return "warning";
  return "neutral";
}

function statusTone(status: string) {
  if (status === "published") return "success";
  if (status === "draft") return "warning";
  if (status === "archived") return "neutral";
  return "neutral";
}

function getActionMessage(params: Record<string, string | string[] | undefined>) {
  const event = getFirstParam(params.event);
  const reason = getFirstParam(params.reason);
  const artifactVersion = getFirstParam(params.artifactVersion);
  const publishedCount = getFirstParam(params.publishedCount);
  const previousArchived = getFirstParam(params.previousArchived);

  if (event === "draft_generated") {
    return {
      title: "Draft gerado",
      description: artifactVersion
        ? `Artifact version ${artifactVersion} criado como draft.`
        : "Novo draft criado para revisao.",
      className:
        "rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-green-800",
    };
  }

  if (event === "published") {
    return {
      title: "Draft publicado",
      description: `Validacao pos-publicacao concluida: published_count=${publishedCount ?? "1"}, previous_archived=${previousArchived ?? "null"}.`,
      className:
        "rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-green-800",
    };
  }

  if (event === "generation_failed" || event === "publish_failed") {
    return {
      title: event === "generation_failed" ? "Geracao bloqueada" : "Publicacao bloqueada",
      description: reason ?? "Erro seguro retornado pela operacao.",
      className:
        "rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-800",
    };
  }

  return null;
}

function getFirstParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0];
  return value;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}
