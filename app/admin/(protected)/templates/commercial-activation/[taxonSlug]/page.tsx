import Link from "next/link";
import { notFound } from "next/navigation";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminStatusBadge } from "@/components/admin/AdminStatusBadge";
import { EmptyState } from "@/components/ui/empty-state";
import { CommercialActivationRenderer } from "@/conversion-content/commercial-activation/renderer";
import {
  readAdminCommercialActivationState,
  type AdminCommercialActivationArtifact,
} from "@/lib/admin/adapters/adminCommercialActivationTemplatesAdapter";
import {
  generateOrRegenerateCommercialActivationDraftAction,
  publishCommercialActivationDraftAction,
} from "../../actions";
import { PendingSubmitButton } from "../../_components/PendingSubmitButton";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type AdminCommercialActivationTaxonPageProps = {
  params: Promise<{ taxonSlug: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminCommercialActivationTaxonPage({
  params,
  searchParams,
}: AdminCommercialActivationTaxonPageProps) {
  const { taxonSlug } = await params;
  const query = (await searchParams) ?? {};
  const state = await readAdminCommercialActivationState({ taxonSlug });
  const message = getActionMessage(query);

  if (!state.ok) {
    if (state.reason === "taxon_not_found") {
      notFound();
    }

    return (
      <div className="space-y-6">
        <BackLink />
        <AdminPageHeader
          title="Operacao commercial_activation"
          description="Nao foi possivel carregar o taxon selecionado."
          meta="commercial_activation"
        />
        <EmptyState
          title="Operacao indisponivel"
          description={`Falha segura na leitura administrativa: ${state.reason}.`}
        />
      </div>
    );
  }

  const reviewDraft = state.publishableDraft;
  const previewArtifact = reviewDraft ?? state.published ?? state.latestDraft;
  const shouldRegenerate = Boolean(reviewDraft || state.published);
  const generationLabel = shouldRegenerate ? "Regenerar draft" : "Gerar draft";
  const generationPendingLabel = shouldRegenerate
    ? "Regenerando..."
    : "Gerando...";
  const primaryAction = reviewDraft ? "Publicar draft" : generationLabel;

  return (
    <div className="space-y-6">
      <BackLink />

      <AdminPageHeader
        title={state.taxon.name}
        description="Operacao administrativa por taxon: draft, publicacao, preview, historico e diagnostico tecnico minimo."
        meta={state.taxon.slug}
      />

      {message ? (
        <section className={message.className}>
          <p className="text-sm font-medium">{message.title}</p>
          <p className="mt-1 text-sm">{message.description}</p>
        </section>
      ) : null}

      <section className="rounded-lg border border-border bg-card p-5 shadow-card">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3">
            <div>
              <p className="text-xs font-medium uppercase text-muted-foreground">
                Taxon operacional
              </p>
              <h2 className="mt-1 text-lg font-semibold text-card-foreground">
                {state.taxon.name}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {state.taxon.slug}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <AdminStatusBadge tone={reviewDraft ? "warning" : "neutral"}>
                {reviewDraft ? "Em revisao" : "Sem draft em revisao"}
              </AdminStatusBadge>
              <AdminStatusBadge tone={state.published ? "success" : "neutral"}>
                {state.published ? "Publicado" : "Sem published"}
              </AdminStatusBadge>
              <AdminStatusBadge tone={state.composition ? "success" : "neutral"}>
                {state.composition ? "Composicao pronta" : "Composicao sob demanda"}
              </AdminStatusBadge>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <form action={generateOrRegenerateCommercialActivationDraftAction}>
              <input name="taxonSlug" type="hidden" value={state.taxon.slug} />
              <PendingSubmitButton pendingLabel={generationPendingLabel}>
                {generationLabel}
              </PendingSubmitButton>
            </form>

            <form action={publishCommercialActivationDraftAction}>
              <input name="taxonSlug" type="hidden" value={state.taxon.slug} />
              <input
                name="artifactId"
                type="hidden"
                value={reviewDraft?.id ?? ""}
              />
              <PendingSubmitButton
                disabled={!reviewDraft}
                pendingLabel="Publicando..."
                variant="secondary"
              >
                Publicar draft
              </PendingSubmitButton>
            </form>
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-4">
        <StatusCard
          label="Estado atual"
          value={stateLabel({ reviewDraft, published: state.published })}
          detail={`Proximo passo: ${primaryAction}`}
        />
        <StatusCard
          label="Draft atual"
          value={reviewDraft ? `v${reviewDraft.artifactVersion}` : "Nenhum"}
          detail={
            reviewDraft
              ? `${reviewDraft.sourceCount} fontes business_buyer`
              : state.latestDraft
                ? "Draft antigo mantido apenas no historico"
                : "Gere um draft para revisar"
          }
        />
        <StatusCard
          label="Published atual"
          value={state.published ? `v${state.published.artifactVersion}` : "Nenhum"}
          detail={
            state.published?.publishedAt
              ? formatDate(state.published.publishedAt)
              : "A publicacao usa RPC transacional"
          }
        />
        <StatusCard
          label="Historico"
          value={String(state.artifacts.length)}
          detail="draft, published e archived"
        />
      </section>

      <section className="rounded-lg border border-border bg-card p-5 shadow-card">
        <h2 className="text-sm font-semibold text-card-foreground">
          Diagnostico tecnico minimo
        </h2>
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <DiagnosticItem
            label="Composicao"
            value={state.composition ? "ready" : "sob demanda"}
          />
          <DiagnosticItem
            label="Draft publicavel"
            value={reviewDraft ? `v${reviewDraft.artifactVersion}` : "nao"}
          />
          <DiagnosticItem
            label="Published valido"
            value={state.published ? `v${state.published.artifactVersion}` : "nao"}
          />
          <DiagnosticItem
            label="Fontes do draft"
            value={reviewDraft ? String(reviewDraft.sourceCount) : "-"}
          />
        </dl>
      </section>

      {previewArtifact && state.composition ? (
        <section className="space-y-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                Preview do{" "}
                {previewArtifact.status === "draft" ? "draft" : "published"}
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
                composition={state.composition}
                contentJson={previewArtifact.contentJson}
              />
            </div>
          </div>
        </section>
      ) : (
        <EmptyState
          title="Nenhum artefato para visualizar"
          description="Gere o primeiro draft administrativo para habilitar o preview."
        />
      )}

      <section className="overflow-hidden rounded-lg border border-border bg-card shadow-card">
        <div className="border-b border-border px-4 py-3">
          <h2 className="text-sm font-semibold text-card-foreground">
            Historico de artefatos
          </h2>
        </div>
        {state.artifacts.length > 0 ? (
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
                {state.artifacts.map((artifact) => (
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
        ) : (
          <div className="p-4">
            <EmptyState
              title="Sem historico"
              description="Os artefatos aparecerao aqui apos a primeira geracao."
            />
          </div>
        )}
      </section>
    </div>
  );
}

function BackLink() {
  return (
    <Link
      className="text-sm font-medium text-brand-700 hover:underline"
      href="/admin/templates"
    >
      Voltar para templates
    </Link>
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
      <p className="mt-2 text-xl font-semibold text-card-foreground">{value}</p>
      <p className="mt-1 text-sm text-muted-foreground">{detail}</p>
    </section>
  );
}

function DiagnosticItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-1 font-medium text-foreground">{value}</dd>
    </div>
  );
}

function stateLabel(input: {
  reviewDraft: AdminCommercialActivationArtifact | null;
  published: AdminCommercialActivationArtifact | null;
}) {
  if (input.reviewDraft) return "Em revisao";
  if (input.published) return "Publicado";
  return "Elegivel para gerar";
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
      description:
        previousArchived === "true"
          ? "Draft publicado com sucesso. A versao anterior publicada foi arquivada."
          : `Draft publicado com sucesso. Published ativo: ${publishedCount ?? "1"}.`,
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
