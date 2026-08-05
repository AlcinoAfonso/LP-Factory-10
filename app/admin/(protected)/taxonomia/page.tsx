import Link from "next/link";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminStatusBadge } from "@/components/admin/AdminStatusBadge";
import { EmptyState } from "@/components/ui/empty-state";
import { getParamValue } from "@/lib/admin/adminFormat";
import { listAdminTaxons } from "@/lib/admin/adapters/adminReadOnlyAdapter";
import type { AdminOperationalDiagnosticItem } from "@/lib/admin/adapters/adminReadOnlyTypes";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type AdminTaxonomyPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const levelOptions = [
  ["", "Todos os niveis"],
  ["segment", "Segmento"],
  ["niche", "Nicho"],
  ["ultra_niche", "Ultra nicho"],
];

const statusOptions = [
  ["", "Todos"],
  ["active", "Ativos"],
  ["inactive", "Inativos"],
];

export default async function AdminTaxonomyPage({ searchParams }: AdminTaxonomyPageProps) {
  const params = (await searchParams) ?? {};
  const search = getParamValue(params.q);
  const level = getParamValue(params.level);
  const status = getParamValue(params.status);
  const result = await listAdminTaxons({ search, level, status });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <AdminPageHeader
          title="Taxonomia"
          description="Consulta e cadastro da estrutura de taxons usada para classificar contas, resolucoes de nicho e templates."
          meta={`${result.total} taxon${result.total === 1 ? "" : "s"}`}
        />
        <Link
          className="inline-flex h-10 w-fit items-center justify-center rounded-md bg-brand-600 px-4 text-sm font-medium text-white transition hover:bg-brand-700"
          href="/admin/taxonomia/novo"
        >
          Novo taxon
        </Link>
      </div>

      <form className="rounded-lg border border-border bg-card p-4 shadow-card" action="/admin/taxonomia">
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_160px_140px_auto]">
          <label className="space-y-1">
            <span className="text-xs font-medium text-muted-foreground">Buscar</span>
            <input
              className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm outline-none ring-brand-600/20 transition focus:ring-4"
              name="q"
              placeholder="Nome ou identificador"
              defaultValue={search}
            />
          </label>

          <label className="space-y-1">
            <span className="text-xs font-medium text-muted-foreground">Nivel</span>
            <select
              className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm outline-none ring-brand-600/20 transition focus:ring-4"
              name="level"
              defaultValue={level}
            >
              {levelOptions.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1">
            <span className="text-xs font-medium text-muted-foreground">Status</span>
            <select
              className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm outline-none ring-brand-600/20 transition focus:ring-4"
              name="status"
              defaultValue={status}
            >
              {statusOptions.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          <div className="flex items-end gap-2">
            <button className="h-10 rounded-md bg-brand-600 px-4 text-sm font-medium text-white transition hover:bg-brand-700">
              Filtrar
            </button>
            <Link
              className="inline-flex h-10 items-center rounded-md border border-border px-4 text-sm font-medium text-muted-foreground transition hover:bg-muted"
              href="/admin/taxonomia"
            >
              Limpar
            </Link>
          </div>
        </div>
      </form>

      {result.items.length === 0 ? (
        <EmptyState
          title="Nenhum taxon encontrado"
          description="A leitura real esta conectada, mas os filtros atuais nao retornaram registros."
        />
      ) : (
        <div className="overflow-hidden rounded-lg border border-border bg-card shadow-card">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border text-sm">
              <thead className="bg-muted/60 text-left text-xs font-medium uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Taxon</th>
                  <th className="px-4 py-3">Pesquisa BB</th>
                  <th className="px-4 py-3">Pesquisa EC</th>
                  <th className="px-4 py-3">Página comercial</th>
                  <th className="px-4 py-3">Perfil</th>
                  <th className="px-4 py-3">IA</th>
                  <th className="px-4 py-3 text-right">Acao</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {result.items.map((taxon) => (
                  <tr key={taxon.id} className="align-top">
                    <td className="px-4 py-3">
                      <div className="font-medium text-foreground">{taxon.name}</div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {taxon.level} / pai: {taxon.parentName ?? "—"}
                      </div>
                      <AdminStatusBadge tone={taxon.isActive ? "success" : "neutral"}>
                        {taxon.isActive ? "Ativo" : "Inativo"}
                      </AdminStatusBadge>
                    </td>
                    <DiagnosticCell item={taxon.diagnostic.businessBuyer} />
                    <DiagnosticCell item={taxon.diagnostic.endCustomer} />
                    <DiagnosticCell item={taxon.diagnostic.commercialPage} />
                    <DiagnosticCell item={taxon.diagnostic.profile} />
                    <DiagnosticCell item={taxon.diagnostic.aiAssistance} />
                    <td className="px-4 py-3 text-right">
                      <Link className="font-medium text-brand-700 hover:underline" href={`/admin/taxonomia/${taxon.id}`}>
                        Abrir diagnóstico
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

function DiagnosticCell({ item }: { item: AdminOperationalDiagnosticItem }) {
  return (
    <td className="px-4 py-3">
      <AdminStatusBadge tone={item.tone}>{item.label}</AdminStatusBadge>
      {item.origin ? (
        <div className="mt-1 text-xs text-muted-foreground">Origem: {item.origin}</div>
      ) : null}
    </td>
  );
}
