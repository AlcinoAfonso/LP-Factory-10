import { EmptyState } from '@/components/ui/empty-state';
import type { AdminArea } from '@/components/admin/adminNavigation';

type AdminPlaceholderPageProps = {
  area: AdminArea;
};

export function AdminPlaceholderPage({ area }: AdminPlaceholderPageProps) {
  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase text-muted-foreground">
              Área administrativa
            </p>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              {area.title}
            </h1>
            <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
              {area.description}
            </p>
          </div>

          <span className="inline-flex w-fit shrink-0 whitespace-nowrap rounded-md border border-border bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
            {area.status}
          </span>
        </div>
      </section>

      <EmptyState
        title={`${area.title} ainda não tem dados conectados`}
        description="Esta área está preparada no shell do Admin, mas a leitura com dados reais fica para a etapa read-only."
        className="text-left"
      />

      <section className="rounded-lg border border-border bg-card p-5 shadow-card">
        <h2 className="text-sm font-semibold text-card-foreground">
          Escopo previsto
        </h2>
        <ul className="mt-4 space-y-3">
          {area.scope.map((item) => (
            <li key={item} className="flex gap-3 text-sm text-muted-foreground">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-600" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
