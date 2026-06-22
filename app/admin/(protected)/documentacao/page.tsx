import { adminDocsCatalog } from '@/lib/admin/docsCatalog';
import { readRepoDoc } from '@/lib/admin/readRepoDoc';

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
  const matchingDocs = normalizedQuery
    ? adminDocsCatalog.filter((doc) => {
        const searchable = `${doc.title} ${doc.path} ${doc.description}`.toLowerCase();

        return searchable.includes(normalizedQuery);
      })
    : adminDocsCatalog;
  const selectableDocs = [...matchingDocs].sort((a, b) => a.title.localeCompare(b.title, 'pt-BR'));

  return (
    <div className="w-full min-w-0 space-y-4">
      <section className="flex w-full min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="min-w-0 text-2xl font-semibold tracking-tight text-foreground">Documentação</h1>
        <span className="inline-flex w-fit shrink-0 whitespace-nowrap rounded-md border border-border bg-card px-2.5 py-1 text-xs font-medium text-muted-foreground">
          {adminDocsCatalog.length} documentos
        </span>
      </section>

      <section className="w-full min-w-0 rounded-lg border border-border bg-card shadow-card">
        <div className="px-3 py-3 sm:px-4">
          <form
            action="/admin/documentacao"
            className="grid w-full min-w-0 grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,320px)_auto]"
          >
            <label className="min-w-0 space-y-1">
              <span className="text-xs font-medium text-muted-foreground">Filtrar documentos</span>
              <input
                className="h-10 w-full min-w-0 rounded-md border border-border bg-background px-3 text-sm outline-none ring-brand-600/20 transition placeholder:text-muted-foreground focus:ring-4"
                name="q"
                placeholder="Buscar por nome, path ou descricao"
                defaultValue={query}
              />
            </label>

            <label className="min-w-0 space-y-1">
              <span className="text-xs font-medium text-muted-foreground">Documento</span>
              <select
                className="h-10 w-full min-w-0 rounded-md border border-border bg-background px-3 text-sm outline-none ring-brand-600/20 transition focus:ring-4"
                name="doc"
                defaultValue={activeId ?? ''}
              >
                <option value="">Primeiro documento da lista</option>
                {selectableDocs.map((doc) => (
                  <option key={doc.id} value={doc.id}>
                    {doc.title}
                  </option>
                ))}
              </select>
            </label>

            <div className="flex w-full min-w-0 items-end">
              <button className="h-10 w-full rounded-md bg-brand-600 px-4 text-sm font-medium text-white transition hover:bg-brand-700 lg:w-auto">
                Abrir
              </button>
            </div>
          </form>
        </div>
      </section>

      <section className="w-full min-w-0 rounded-lg border border-border bg-card shadow-card">
        <div className="min-w-0 border-b border-border px-3 py-3 sm:px-4 sm:py-4">
          {result.status === 'ok' || result.status === 'error' ? (
            <>
              <h2 className="min-w-0 break-words text-xl font-semibold tracking-tight text-foreground">
                {result.doc.title}
              </h2>
              <p className="mt-2 break-all font-mono text-xs text-muted-foreground">{result.doc.path}</p>
            </>
          ) : (
            <>
              <h2 className="min-w-0 break-words text-xl font-semibold tracking-tight text-foreground">
                Leitura nao autorizada
              </h2>
              <p className="mt-2 break-all font-mono text-xs text-muted-foreground">
                {result.requestedId || 'sem identificador'}
              </p>
            </>
          )}
        </div>

        <div className="min-w-0 p-3 sm:p-6">
          {result.status === 'ok' ? (
            <pre className="w-full max-w-full min-w-0 overflow-x-auto whitespace-pre-wrap break-words rounded-md bg-muted/40 p-3 font-mono text-xs leading-6 text-foreground sm:p-6 sm:text-sm sm:leading-7">
              {result.content}
            </pre>
          ) : (
            <div className="min-w-0 rounded-md border border-border bg-muted/30 p-4">
              <p className="text-sm font-medium text-foreground">Leitura indisponivel</p>
              <p className="mt-1 text-sm text-muted-foreground">{result.message}</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
