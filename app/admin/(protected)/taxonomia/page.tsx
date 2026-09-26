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
  ["", "Todos os níveis"],
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
          description="Encontre e gerencie categorias usadas para classificar contas, resoluções de nicho e páginas comerciais."
          meta={`${result.total} taxon${result.total === 1 ? "" : "s"}`}
        />
        <Link
          className="inline-flex min-h-11 w-fit items-center justify-center rounded-md bg-brand-600 px-4 text-sm font-medium text-white outline-none transition hover:bg-brand-700 focus-visible:ring-4 focus-visible:ring-brand-600/30"
          href="/admin/taxonomia/novo"
        >
          Adicionar taxon
        </Link>
      </div>

      <form className="rounded-lg border border-border bg-card p-4 shadow-card" action="/admin/taxonomia">
        <input name="level" type="hidden" value={level} />
        <input name="status" type="hidden" value={status} />
        <div className="flex flex-wrap items-end gap-3">
          <label className="space-y-1">
            <span className="text-xs font-medium text-muted-foreground">Buscar</span>
            <input
              className="min-h-11 w-full min-w-48 rounded-md border border-border bg-background px-3 text-sm outline-none focus-visible:ring-4 focus-visible:ring-brand-600/20"
              name="q"
              placeholder="Nome da categoria"
              defaultValue={search}
            />
          </label>
          <div className="flex items-center gap-2">
            <button className="min-h-11 rounded-md bg-brand-600 px-4 text-sm font-medium text-white outline-none transition hover:bg-brand-700 focus-visible:ring-4 focus-visible:ring-brand-600/30">
              Buscar
            </button>
            <Link
              className="inline-flex min-h-11 items-center rounded-md border border-border px-4 text-sm font-medium text-muted-foreground outline-none transition hover:bg-muted focus-visible:ring-4 focus-visible:ring-brand-600/30"
              href="/admin/taxonomia"
            >
              Limpar
            </Link>
          </div>
        </div>
      </form>

      <form action="/admin/taxonomia" className="flex flex-wrap items-end gap-3 rounded-lg border border-border bg-card p-3 shadow-card md:hidden">
        <input name="q" type="hidden" value={search} />
        <TaxonomyFilter label="Nível" name="level" options={levelOptions} value={level} />
        <TaxonomyFilter label="Estado" name="status" options={statusOptions} value={status} />
        <button className="min-h-11 rounded-md border border-brand-300 px-3 text-sm font-medium text-brand-700 outline-none focus-visible:ring-4 focus-visible:ring-brand-600/30" type="submit">Aplicar filtros</button>
      </form>

      <form action="/admin/taxonomia" className="overflow-hidden rounded-lg border border-border bg-card shadow-card">
        <input name="q" type="hidden" value={search} />
        <p className="border-b border-border px-3 py-2 text-xs text-muted-foreground md:hidden">Deslize para ver todas as colunas.</p>
        <div className="max-h-[70vh] overflow-auto">
            <table className="w-full min-w-[680px] table-fixed divide-y divide-border text-sm">
              <colgroup>
                <col className="w-[37%]" />
                <col className="w-[19%]" />
                <col className="w-[14%]" />
                <col className="w-[18%]" />
                <col className="w-[12%]" />
              </colgroup>
              <thead className="sticky top-0 z-10 bg-muted text-left text-xs font-medium text-muted-foreground">
                <tr>
                  <th className="px-3 py-2" scope="col">Taxon</th>
                  <th className="px-3 py-2" scope="col"><span className="md:hidden">Nível</span><span className="hidden md:block"><TaxonomyFilter label="Nível" name="level" options={levelOptions} value={level} /></span></th>
                  <th className="px-3 py-2" scope="col"><span className="md:hidden">Estado</span><span className="hidden md:block"><TaxonomyFilter label="Estado" name="status" options={statusOptions} value={status} /></span></th>
                  <th className="px-3 py-2" scope="col">Página comercial</th>
                  <th className="px-3 py-2 text-right" scope="col"><span className="md:hidden">Ação</span><button className="hidden min-h-11 rounded-md px-2 font-medium text-brand-700 underline outline-none focus-visible:ring-4 focus-visible:ring-brand-600/30 md:inline-flex md:items-center" type="submit">Filtrar</button></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {result.items.length === 0 ? (
                  <tr><td className="px-3 py-4" colSpan={5}><EmptyState title="Nenhum taxon encontrado" description="Ajuste a busca ou os filtros para encontrar outra categoria." /></td></tr>
                ) : null}
                {result.items.map((taxon) => (
                  <tr key={taxon.id} className="align-middle">
                    <td className="px-3 py-2">
                      <div className="font-medium text-foreground">{taxon.name}</div>
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">{levelOptions.find(([value]) => value === taxon.level)?.[1] ?? taxon.level}{taxon.parentName ? <span className="block text-xs">em {taxon.parentName}</span> : null}</td>
                    <td className="px-3 py-2">
                      <AdminStatusBadge tone={taxon.isActive ? "success" : "neutral"}>
                        {taxon.isActive ? "Ativo" : "Inativo"}
                      </AdminStatusBadge>
                    </td>
                    <DiagnosticCell item={taxon.diagnostic.commercialPage} />
                    <td className="px-3 py-2 text-right">
                      <Link className="inline-flex min-h-11 items-center font-medium text-brand-700 outline-none hover:underline focus-visible:ring-4 focus-visible:ring-brand-600/30" href={`/admin/taxonomia/${taxon.id}`}>
                        Abrir
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
        </div>
      </form>
    </div>
  );
}

function DiagnosticCell({
  item,
  label,
}: {
  item: AdminOperationalDiagnosticItem;
  label?: string;
}) {
  return (
    <td className="px-3 py-2">
      <AdminStatusBadge tone={item.tone}>{label ?? item.label}</AdminStatusBadge>
    </td>
  );
}

function TaxonomyFilter({ label, name, options, value }: {
  label: string;
  name: string;
  options: string[][];
  value: string;
}) {
  return (
    <label className="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
      {label}
      <select className="min-h-11 min-w-28 rounded-md border border-border bg-background px-2 text-sm text-foreground outline-none focus-visible:ring-4 focus-visible:ring-brand-600/30" name={name} defaultValue={value}>
        {options.map(([optionValue, optionLabel]) => <option key={optionValue} value={optionValue}>{optionLabel}</option>)}
      </select>
    </label>
  );
}
