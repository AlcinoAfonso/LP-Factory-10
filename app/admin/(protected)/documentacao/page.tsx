import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
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
  const selectableDocs = normalizedQuery
    ? adminDocsCatalog.filter((doc) => {
        const searchable = `${doc.title} ${doc.path} ${doc.description}`.toLowerCase();

        return searchable.includes(normalizedQuery);
      })
    : adminDocsCatalog;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Documentacao"
        description="Leitura read-only dos documentos operacionais do projeto."
        meta={`${adminDocsCatalog.length} documentos`}
      />

      <section className="rounded-lg border border-border bg-card shadow-card">
        <div className="px-4 py-4">
          <form action="/admin/documentacao" className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_320px_auto]">
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
                {selectableDocs.map((doc) => (
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
            <span>{selectableDocs.length} de {adminDocsCatalog.length} documentos na whitelist.</span>
            <span aria-hidden="true">-</span>
            <span>Sem edicao, salvamento, publicacao, banco ou GitHub API.</span>
          </div>
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
