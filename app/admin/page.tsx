import Link from 'next/link';
import { EmptyState } from '@/components/ui/empty-state';
import { adminAreas } from '@/components/admin/adminNavigation';

const operationalAreas = adminAreas.filter((area) => area.href !== '/admin');

export default function AdminPage() {
  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase text-muted-foreground">
              LP Factory Administrativo
            </p>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Admin Dashboard
            </h1>
            <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
              Operação interna da plataforma em uma estrutura separada do
              dashboard de contas, pronta para receber módulos administrativos
              read-only.
            </p>
          </div>

          <span className="inline-flex w-fit shrink-0 whitespace-nowrap items-center rounded-md border border-brand-600/20 bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700">
            Acesso restrito
          </span>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {operationalAreas.map((area) => (
          <Link
            key={area.href}
            href={area.href}
            className="rounded-lg border border-border bg-card p-5 shadow-card transition-colors hover:border-brand-600/35"
          >
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-sm font-semibold text-card-foreground">
                {area.title}
              </h2>
              <span className="shrink-0 rounded-md border border-border bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                {area.status}
              </span>
            </div>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {area.description}
            </p>
          </Link>
        ))}
      </section>

      <EmptyState
        title="Nenhuma funcionalidade administrativa conectada nesta etapa"
        description="A estrutura visual e de navegação está pronta; consultas reais, filtros e detalhes ficam reservados para a etapa read-only."
        className="text-left"
      />
    </div>
  );
}
