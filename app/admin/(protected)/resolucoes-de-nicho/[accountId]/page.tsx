import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminStatusBadge } from "@/components/admin/AdminStatusBadge";
import { formatAdminDate, formatPercent } from "@/lib/admin/adminFormat";
import { getAdminNicheResolutionDetail } from "@/lib/admin/adapters/adminReadOnlyAdapter";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type AdminNicheResolutionDetailPageProps = {
  params: Promise<{ accountId: string }>;
};

export default async function AdminNicheResolutionDetailPage({ params }: AdminNicheResolutionDetailPageProps) {
  const { accountId } = await params;
  const resolution = await getAdminNicheResolutionDetail(accountId);

  if (!resolution) notFound();

  return (
    <div className="space-y-6">
      <Link className="text-sm font-medium text-brand-700 hover:underline" href="/admin/resolucoes-de-nicho">
        Voltar para resolucoes
      </Link>

      <AdminPageHeader
        title={resolution.accountName ?? "Resolucao de nicho"}
        description="Detalhe read-only da classificacao de nicho registrada para a conta."
        meta={resolution.accountId}
      />

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-lg border border-border bg-card p-5 shadow-card">
          <h2 className="text-sm font-semibold text-card-foreground">Entrada e decisao</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <Detail label="Entrada" value={resolution.rawInput} />
            <Detail label="Status" value={resolution.resolutionStatus} />
            <Detail label="Confianca">
              <AdminStatusBadge tone={resolution.confidence === "high" ? "success" : resolution.confidence === "medium" ? "warning" : "neutral"}>
                {resolution.confidence || "-"}
              </AdminStatusBadge>
            </Detail>
            <Detail label="Score" value={formatPercent(resolution.score)} />
            <Detail label="Fonte do match" value={resolution.matchSource ?? "-"} />
          </dl>
        </div>

        <div className="rounded-lg border border-border bg-card p-5 shadow-card">
          <h2 className="text-sm font-semibold text-card-foreground">Taxonomia</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <Detail label="Taxon selecionado" value={resolution.selectedTaxonName ?? "-"} />
            <Detail label="Taxon sugerido pela IA" value={resolution.aiSuggestedTaxonName ?? "-"} />
            <Detail label="Novo label sugerido" value={resolution.aiSuggestedNewTaxonLabel ?? "-"} />
          </dl>
        </div>

        <div className="rounded-lg border border-border bg-card p-5 shadow-card">
          <h2 className="text-sm font-semibold text-card-foreground">IA</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <Detail label="Status IA" value={resolution.aiStatus ?? "-"} />
            <Detail label="Modo UX IA" value={resolution.aiUxMode ?? "-"} />
            <Detail label="Modelo" value={resolution.aiModel ?? "-"} />
            <Detail label="Erro IA" value={resolution.aiErrorCode ?? "-"} />
            <Detail label="Atualizado em" value={formatAdminDate(resolution.updatedAt)} />
          </dl>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-border bg-card p-5 shadow-card">
          <h2 className="text-sm font-semibold text-card-foreground">Razao deterministica</h2>
          <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
            {resolution.reason || "Sem razao registrada."}
          </p>
        </div>

        <div className="rounded-lg border border-border bg-card p-5 shadow-card">
          <h2 className="text-sm font-semibold text-card-foreground">Razao IA</h2>
          <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
            {resolution.aiReason || "Sem razao de IA registrada."}
          </p>
        </div>
      </section>
    </div>
  );
}

function Detail({ label, value, children }: { label: string; value?: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-xs font-medium uppercase text-muted-foreground">{label}</dt>
      <dd className="break-words text-foreground">{children ?? value}</dd>
    </div>
  );
}
