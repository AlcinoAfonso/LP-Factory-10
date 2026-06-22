import Link from 'next/link';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { adminDocsCatalog } from '@/lib/admin/docsCatalog';
import { readRepoDoc } from '@/lib/admin/readRepoDoc';
import { cn } from '@/lib/utils';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type AdminDocumentationPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function getParamValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminDocumentationPage({
  searchParams,
}: AdminDocumentationPageProps) {
  const params = (await searchParams) ?? {};
  const selectedId = getParamValue(params.doc);
  const result = await readRepoDoc(selectedId);
  const activeId = result.status === 'ok' || result.status === 'error'
    ? result.doc.id
    : selectedId;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Documentacao"
        description="Leitura read-only dos documentos operacionais do projeto."
        meta={`${adminDocsCatalog.length} documentos`}
      />

      <div className="grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="rounded-lg border border-border bg-card shadow-card">
          <div className="border-b border-border px-4 py-3">
            <h2 className="text-sm font-semibold text-foreground">Documentos permitidos</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Lista fixa por whitelist. Sem edicao, salvamento ou publicacao.
            </p>
          </div>

          <nav className="divide-y divide-border" aria-label="Documentos do repositorio">
            {adminDocsCatalog.map((doc) => {
              const active = activeId === doc.id;

              return (
                <Link
                  key={doc.id}
                  href={`/admin/documentacao?doc=${doc.id}`}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'block px-4 py-3 transition-colors',
                    active ? 'bg-brand-50' : 'hover:bg-muted/70',
                  )}
                >
                  <span className={cn('text-sm font-medium', active ? 'text-brand-700' : 'text-foreground')}>
                    {doc.title}
                  </span>
                  <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                    {doc.path}
                  </span>
                </Link>
              );
            })}
          </nav>
        </aside>

        <section className="min-w-0 rounded-lg border border-border bg-card shadow-card">
          <div className="border-b border-border px-4 py-3">
            {result.status === 'ok' || result.status === 'error' ? (
              <>
                <h2 className="text-sm font-semibold text-foreground">{result.doc.title}</h2>
                <p className="mt-1 break-all font-mono text-xs text-muted-foreground">{result.doc.path}</p>
              </>
            ) : (
              <>
                <h2 className="text-sm font-semibold text-foreground">Documento bloqueado</h2>
                <p className="mt-1 break-all font-mono text-xs text-muted-foreground">
                  {result.requestedId || 'sem identificador'}
                </p>
              </>
            )}
          </div>

          <div className="p-4">
            {result.status === 'ok' ? (
              <pre className="max-h-[70vh] overflow-auto whitespace-pre-wrap rounded-md bg-muted/40 p-4 font-mono text-xs leading-6 text-foreground">
                {result.content}
              </pre>
            ) : (
              <div className="rounded-md border border-border bg-muted/30 p-4">
                <p className="text-sm font-medium text-foreground">Leitura indisponivel</p>
                <p className="mt-1 text-sm text-muted-foreground">{result.message}</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
