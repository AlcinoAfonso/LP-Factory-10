import Link from "next/link";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminStatusBadge, accountStatusTone } from "@/components/admin/AdminStatusBadge";
import { EmptyState } from "@/components/ui/empty-state";
import { formatAdminDate, getParamValue } from "@/lib/admin/adminFormat";
import { listAdminAccounts } from "@/lib/admin/adapters/adminReadOnlyAdapter";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type AdminAccountsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const accountStatusOptions = [
  ["", "Todos os status"],
  ["active", "Ativas"],
  ["pending_setup", "Em setup"],
  ["inactive", "Inativas"],
  ["suspended", "Suspensas"],
];

export default async function AdminAccountsPage({ searchParams }: AdminAccountsPageProps) {
  const params = (await searchParams) ?? {};
  const search = getParamValue(params.q);
  const status = getParamValue(params.status);
  const result = await listAdminAccounts({ search, status });

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Contas"
        description="Leitura operacional das contas reais da plataforma, sem mutacoes administrativas nesta etapa."
        meta={`${result.total} registro${result.total === 1 ? "" : "s"}`}
      />

      <form className="rounded-lg border border-border bg-card p-4 shadow-card" action="/admin/contas">
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_180px_auto]">
          <label className="space-y-1">
            <span className="text-xs font-medium text-muted-foreground">Buscar</span>
            <input
              className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm outline-none ring-brand-600/20 transition focus:ring-4"
              name="q"
              placeholder="Nome, subdominio ou dominio"
              defaultValue={search}
            />
          </label>

          <label className="space-y-1">
            <span className="text-xs font-medium text-muted-foreground">Status</span>
            <select
              className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm outline-none ring-brand-600/20 transition focus:ring-4"
              name="status"
              defaultValue={status}
            >
              {accountStatusOptions.map(([value, label]) => (
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
              href="/admin/contas"
            >
              Limpar
            </Link>
          </div>
        </div>
      </form>

      {result.items.length === 0 ? (
        <EmptyState
          title="Nenhuma conta encontrada"
          description="A leitura real esta conectada, mas os filtros atuais nao retornaram registros."
        />
      ) : (
        <div className="overflow-hidden rounded-lg border border-border bg-card shadow-card">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border text-sm">
              <thead className="bg-muted/60 text-left text-xs font-medium uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Conta</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Dominio</th>
                  <th className="px-4 py-3">Criada em</th>
                  <th className="px-4 py-3 text-right">Detalhes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {result.items.map((account) => (
                  <tr key={account.id} className="align-top">
                    <td className="px-4 py-3">
                      <div className="font-medium text-foreground">{account.name}</div>
                      <div className="mt-1 text-xs text-muted-foreground">{account.subdomain ?? "Sem subdominio"}</div>
                    </td>
                    <td className="px-4 py-3">
                      <AdminStatusBadge tone={accountStatusTone(account.status)}>{account.status}</AdminStatusBadge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{account.domain ?? "-"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{formatAdminDate(account.createdAt)}</td>
                    <td className="px-4 py-3 text-right">
                      <Link className="font-medium text-brand-700 hover:underline" href={`/admin/contas/${account.id}`}>
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
