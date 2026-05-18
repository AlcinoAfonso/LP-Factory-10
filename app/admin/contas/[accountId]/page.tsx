import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminStatusBadge, accountStatusTone } from "@/components/admin/AdminStatusBadge";
import { EmptyState } from "@/components/ui/empty-state";
import { formatAdminDate, formatPercent } from "@/lib/admin/adminFormat";
import { getAdminAccountDetail } from "@/lib/admin/adapters/adminReadOnlyAdapter";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type AdminAccountDetailPageProps = {
  params: Promise<{ accountId: string }>;
};

export default async function AdminAccountDetailPage({ params }: AdminAccountDetailPageProps) {
  const { accountId } = await params;
  const account = await getAdminAccountDetail(accountId);

  if (!account) notFound();

  return (
    <div className="space-y-6">
      <Link className="text-sm font-medium text-brand-700 hover:underline" href="/admin/contas">
        Voltar para contas
      </Link>

      <AdminPageHeader
        title={account.name}
        description="Detalhe read-only da conta, com perfil, membros, taxonomia e resolucao de nicho quando existirem."
        meta={account.id}
      />

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-lg border border-border bg-card p-5 shadow-card">
          <h2 className="text-sm font-semibold text-card-foreground">Conta</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <Detail label="Status">
              <AdminStatusBadge tone={accountStatusTone(account.status)}>{account.status}</AdminStatusBadge>
            </Detail>
            <Detail label="E-mail do proprietario" value={account.ownerEmail ?? "E-mail nao disponivel"} />
            <Detail label="Subdominio" value={account.subdomain ?? "-"} />
            <Detail label="Dominio" value={account.domain ?? "-"} />
            <Detail label="Criada em" value={formatAdminDate(account.createdAt)} />
            <Detail label="Setup concluido" value={formatAdminDate(account.setupCompletedAt)} />
          </dl>
        </div>

        <div className="rounded-lg border border-border bg-card p-5 shadow-card">
          <h2 className="text-sm font-semibold text-card-foreground">Perfil</h2>
          {account.profile ? (
            <dl className="mt-4 space-y-3 text-sm">
              <Detail label="Nicho informado" value={account.profile.niche ?? "-"} />
              <Detail label="Canal preferido" value={account.profile.preferredChannel ?? "-"} />
              <Detail label="WhatsApp" value={account.profile.whatsapp ?? "-"} />
              <Detail label="Site" value={account.profile.siteUrl ?? "-"} />
            </dl>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">Perfil ainda nao preenchido.</p>
          )}
        </div>

        <div className="rounded-lg border border-border bg-card p-5 shadow-card">
          <h2 className="text-sm font-semibold text-card-foreground">Resolucao de nicho</h2>
          {account.nicheResolution ? (
            <dl className="mt-4 space-y-3 text-sm">
              <Detail label="Entrada" value={account.nicheResolution.rawInput} />
              <Detail label="Status" value={account.nicheResolution.resolutionStatus} />
              <Detail label="Confianca" value={account.nicheResolution.confidence} />
              <Detail label="Score" value={formatPercent(account.nicheResolution.score)} />
            </dl>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">Sem resolucao registrada para esta conta.</p>
          )}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-border bg-card p-5 shadow-card">
          <h2 className="text-sm font-semibold text-card-foreground">Membros</h2>
          {account.members.length === 0 ? (
            <EmptyState className="mt-4 text-left" title="Nenhum membro listado" />
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full divide-y divide-border text-sm">
                <thead className="text-left text-xs font-medium uppercase text-muted-foreground">
                <tr>
                    <th className="py-2 pr-3">E-mail</th>
                    <th className="py-2 pr-3">Role</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="py-2 pl-3">Criado em</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {account.members.map((member) => (
                    <tr key={member.id}>
                      <td className="py-2 pr-3">{member.email ?? "E-mail nao disponivel"}</td>
                      <td className="py-2 pr-3 text-muted-foreground">{member.role ?? "-"}</td>
                      <td className="px-3 py-2 text-muted-foreground">{member.status ?? "-"}</td>
                      <td className="py-2 pl-3 text-muted-foreground">{formatAdminDate(member.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="rounded-lg border border-border bg-card p-5 shadow-card">
          <h2 className="text-sm font-semibold text-card-foreground">Taxonomia vinculada</h2>
          {account.taxonomy.length === 0 ? (
            <EmptyState className="mt-4 text-left" title="Nenhum taxon vinculado" />
          ) : (
            <div className="mt-4 space-y-3">
              {account.taxonomy.map((item) => (
                <div key={item.taxonId} className="rounded-md border border-border p-3">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="font-medium text-foreground">{item.name}</div>
                      <div className="mt-1 text-xs text-muted-foreground">{item.level} / {item.slug}</div>
                    </div>
                    {item.isPrimary ? <AdminStatusBadge tone="success">Primario</AdminStatusBadge> : null}
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">
                    {item.status} · {item.sourceType}
                  </div>
                </div>
              ))}
            </div>
          )}
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
