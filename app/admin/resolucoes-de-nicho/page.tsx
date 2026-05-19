import Link from "next/link";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminStatusBadge } from "@/components/admin/AdminStatusBadge";
import { EmptyState } from "@/components/ui/empty-state";
import { formatAdminDate, formatPercent, getParamValue } from "@/lib/admin/adminFormat";
import { listAdminNicheResolutions } from "@/lib/admin/adapters/adminReadOnlyAdapter";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type AdminNicheResolutionsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const confidenceOptions = [
  ["", "Todas"],
  ["high", "Alta"],
  ["medium", "Media"],
  ["low", "Baixa"],
];

export default async function AdminNicheResolutionsPage({ searchParams }: AdminNicheResolutionsPageProps) {
  const params = (await searchParams) ?? {};
  const search = getParamValue(params.q);
  const confidence = getParamValue(params.confidence);
  const review = getParamValue(params.review);
  const result = await listAdminNicheResolutions({ search, confidence, review });

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Resolucoes de nicho"
        description="Acompanhamento read-only das resolucoes geradas no onboarding, com sinais deterministico e IA quando existirem."
        meta={`${result.total} resolucao${result.total === 1 ? "" : "es"}`}
      />

      <form className="rounded-lg border border-border bg-card p-4 shadow-card" action="/admin/resolucoes-de-nicho">
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_160px_180px_auto]">
          <label className="space-y-1">
            <span className="text-xs font-medium text-muted-foreground">Buscar</span>
            <input
              className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm outline-none ring-brand-600/20 transition focus:ring-4"
              name="q"
              placeholder="Texto informado pela conta"
              defaultValue={search}
            />
          </label>

          <label className="space-y-1">
            <span className="text-xs font-medium text-muted-foreground">Confianca</span>
            <select
              className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm outline-none ring-brand-600/20 transition focus:ring-4"
              name="confidence"
              defaultValue={confidence}
            >
              {confidenceOptions.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1">
            <span className="text-xs font-medium text-muted-foreground">Revisao</span>
            <select
              className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm outline-none ring-brand-600/20 transition focus:ring-4"
              name="review"
              defaultValue={review}
            >
              <option value="">Todas</option>
              <option value="true">Exigem revisao</option>
            </select>
          </label>

          <div className="flex items-end gap-2">
            <button className="h-10 rounded-md bg-brand-600 px-4 text-sm font-medium text-white transition hover:bg-brand-700">
              Filtrar
            </button>
            <Link
              className="inline-flex h-10 items-center rounded-md border border-border px-4 text-sm font-medium text-muted-foreground transition hover:bg-muted"
              href="/admin/resolucoes-de-nicho"
            >
              Limpar
            </Link>
          </div>
        </div>
      </form>

      {result.items.length === 0 ? (
        <EmptyState
          title="Nenhuma resolucao encontrada"
          description="A leitura real esta conectada, mas os filtros atuais nao retornaram registros."
        />
      ) : (
        <div className="overflow-hidden rounded-lg border border-border bg-card shadow-card">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border text-sm">
              <thead className="bg-muted/60 text-left text-xs font-medium uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Conta / entrada</th>
                  <th className="px-4 py-3">Taxon</th>
                  <th className="px-4 py-3">Confianca</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Atualizada</th>
                  <th className="px-4 py-3 text-right">Detalhes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {result.items.map((resolution) => (
                  <tr key={resolution.accountId} className="align-top">
                    <td className="px-4 py-3">
                      <div className="font-medium text-foreground">{resolution.accountName ?? "Conta sem nome"}</div>
                      <div className="mt-1 max-w-md text-xs text-muted-foreground">{resolution.rawInput}</div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {resolution.selectedTaxonName ?? resolution.aiSuggestedTaxonName ?? "-"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="space-y-1">
                        <AdminStatusBadge tone={resolution.confidence === "high" ? "success" : resolution.confidence === "medium" ? "warning" : "neutral"}>
                          {resolution.confidence || "-"}
                        </AdminStatusBadge>
                        <div className="text-xs text-muted-foreground">{formatPercent(resolution.score)}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      <div>{resolution.resolutionStatus}</div>
                      {resolution.needsAdminReview || resolution.aiNeedsAdminReview ? (
                        <div className="mt-1 text-xs text-amber-700">Revisao admin</div>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{formatAdminDate(resolution.updatedAt)}</td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        className="font-medium text-brand-700 hover:underline"
                        href={`/admin/resolucoes-de-nicho/${resolution.accountId}`}
                      >
                        Abrir
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
