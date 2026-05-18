import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminStatusBadge } from "@/components/admin/AdminStatusBadge";
import { EmptyState } from "@/components/ui/empty-state";
import { getAdminTaxonDetail } from "@/lib/admin/adapters/adminReadOnlyAdapter";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type AdminTaxonDetailPageProps = {
  params: Promise<{ taxonId: string }>;
};

export default async function AdminTaxonDetailPage({ params }: AdminTaxonDetailPageProps) {
  const { taxonId } = await params;
  const taxon = await getAdminTaxonDetail(taxonId);

  if (!taxon) notFound();

  return (
    <div className="space-y-6">
      <Link className="text-sm font-medium text-brand-700 hover:underline" href="/admin/taxonomia">
        Voltar para taxonomia
      </Link>

      <AdminPageHeader
        title={taxon.name}
        description="Detalhe read-only do taxon, incluindo hierarquia imediata e aliases cadastrados."
        meta={taxon.id}
      />

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-lg border border-border bg-card p-5 shadow-card">
          <h2 className="text-sm font-semibold text-card-foreground">Taxon</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <Detail label="Nivel" value={taxon.level} />
            <Detail label="Slug" value={taxon.slug} />
            <Detail label="Pai" value={taxon.parentName ?? "-"} />
            <Detail label="Aliases" value={String(taxon.aliasCount)} />
            <Detail label="Status">
              <AdminStatusBadge tone={taxon.isActive ? "success" : "neutral"}>
                {taxon.isActive ? "Ativo" : "Inativo"}
              </AdminStatusBadge>
            </Detail>
          </dl>
        </div>

        <div className="rounded-lg border border-border bg-card p-5 shadow-card lg:col-span-2">
          <h2 className="text-sm font-semibold text-card-foreground">Aliases</h2>
          {taxon.aliases.length === 0 ? (
            <EmptyState className="mt-4 text-left" title="Nenhum alias cadastrado" />
          ) : (
            <div className="mt-4 flex flex-wrap gap-2">
              {taxon.aliases.map((alias) => (
                <span
                  className="inline-flex rounded-md border border-border bg-muted px-2.5 py-1 text-xs text-muted-foreground"
                  key={alias.id}
                >
                  {alias.aliasText}
                </span>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="rounded-lg border border-border bg-card p-5 shadow-card">
        <h2 className="text-sm font-semibold text-card-foreground">Filhos diretos</h2>
        {taxon.children.length === 0 ? (
          <EmptyState className="mt-4 text-left" title="Nenhum taxon filho direto" />
        ) : (
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {taxon.children.map((child) => (
              <Link
                className="rounded-md border border-border p-3 transition hover:border-brand-500 hover:bg-muted/60"
                href={`/admin/taxonomia/${child.id}`}
                key={child.id}
              >
                <div className="font-medium text-foreground">{child.name}</div>
                <div className="mt-1 text-xs text-muted-foreground">{child.level} / {child.slug}</div>
              </Link>
            ))}
          </div>
        )}
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
