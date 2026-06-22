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
  const query = getParamValue(params.q)?.trim() ?? '';
  const result = await readRepoDoc(selectedId);
  const activeId = result.status === 'ok' || result.status === 'error'
    ? result.doc.id
    : selectedId;
  const normalizedQuery = query.toLowerCase();
  const filteredDocs = normalizedQuery
    ? adminDocsCatalog.filter((doc) => {
        const searchable = `${doc.title} ${doc.path} ${doc.description}`.toLowerCase();

        return searchable.includes(normalizedQuery);
      })
    : adminDocsCatalog;

  function getDocHref(docId: string) {
    const nextParams = new URLSearchParams({ doc: docId });

    if (query) {
      nextParams.set('q', query);
    }

    return `/admin/documentacao?${nextParams.toString()}`;
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Documentacao"
        description="Leitura read-only dos documentos operacionais do projeto."
        meta={`${adminDocsCatalog.length} documentos`}
      />

      <section className="rounded-lg border border-border bg-card shadow-card">
        <div className="border-b border-border px-4 py-4">
          <form action="/admin/documentacao" className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_280px_auto]">
            <label className="space-y-1">
              <span className="text-xs font-medium text-muted-foreground">Filtrar documentos</span>
              <input
                className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm outline-none ring-brand-600/20 transition placeholder:text-muted-foreground focus:ring-4"
                name="q"
                placeholder="Buscar por nome, path ou descricao"
                defaultValue={query}
              />
            </label>

            <label className="space-y-1">
              <span className="text-xs font-medium text-muted-foreground">Documento</span>
              <select
                className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm outline-none ring-brand-600/20 transition focus:ring-4"
                name="doc"
                defaultValue={activeId ?? ''}
              >
                <option value="">Primeiro documento da lista</option>
                {adminDocsCatalog.map((doc) => (
                  <option key={doc.id} value={doc.id}>
                    {doc.title}
                  </option>
                ))}
              </select>
            </label>

            <div className="flex items-end">
              <button className="h-10 w-full rounded-md bg-brand-600 px-4 text-sm font-medium text-white transition hover:bg-brand-700 lg:w-auto">
                Abrir
              </button>
            </div>
          </form>

          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span>Whitelist fixa.</span>
            <span aria-hidden="true">•</span>
            <span>Sem edicao, salvamento, publicacao, banco ou GitHub API.</span>
          </div>
        </div>

        <div className="p-4">
          <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Documentos permitidos</h2>
              <p className="text-xs text-muted-foreground">
                {filteredDocs.length} de {adminDocsCatalog.length} documento{adminDocsCatalog.length === 1 ? '' : 's'}
              </p>
            </div>
            {query ? (
              <Link className="text-xs font-medium text-brand-700 hover:underline" href="/admin/documentacao">
                Limpar filtro
              </Link>
            ) : null}
          </div>

          {filteredDocs.length === 0 ? (
            <div className="rounded-md border border-border bg-muted/30 p-4">
              <p className="text-sm font-medium text-foreground">Nenhum documento encontrado</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Ajuste o filtro para voltar a selecionar um documento da whitelist.
              </p>
            </div>
          ) : (
            <nav className="grid gap-2 md:grid-cols-2 xl:grid-cols-3" aria-label="Documentos do repositorio">
              {filteredDocs.map((doc) => {
              const active = activeId === doc.id;

              return (
                <Link
                  key={doc.id}
                  href={getDocHref(doc.id)}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'rounded-md border px-3 py-3 transition-colors',
                    active
                      ? 'border-brand-600/30 bg-brand-50 text-brand-700'
                      : 'border-border bg-background hover:bg-muted/70',
                  )}
                >
                  <span className={cn('text-sm font-medium', active ? 'text-brand-700' : 'text-foreground')}>
                    {doc.title}
                  </span>
                  <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                    {doc.path}
                  </span>
                  <span className="mt-2 block text-xs leading-5 text-muted-foreground">
                    {doc.description}
                  </span>
                </Link>
              );
              })}
            </nav>
          )}
        </div>
      </section>

      <section className="min-w-0 rounded-lg border border-border bg-card shadow-card">
        <div className="border-b border-border px-4 py-4">
          {result.status === 'ok' || result.status === 'error' ? (
            <>
              <p className="text-xs font-medium uppercase text-muted-foreground">Documento aberto</p>
              <h2 className="mt-1 text-xl font-semibold tracking-tight text-foreground">{result.doc.title}</h2>
              <p className="mt-2 break-all font-mono text-xs text-muted-foreground">{result.doc.path}</p>
            </>
          ) : (
            <>
              <p className="text-xs font-medium uppercase text-muted-foreground">Documento bloqueado</p>
              <h2 className="mt-1 text-xl font-semibold tracking-tight text-foreground">Leitura nao autorizada</h2>
              <p className="mt-2 break-all font-mono text-xs text-muted-foreground">
                {result.requestedId || 'sem identificador'}
              </p>
            </>
          )}
        </div>

        <div className="p-4 sm:p-6">
          {result.status === 'ok' ? (
            <pre className="whitespace-pre-wrap rounded-md bg-muted/40 p-4 font-mono text-sm leading-7 text-foreground sm:p-6">
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
  );
}
