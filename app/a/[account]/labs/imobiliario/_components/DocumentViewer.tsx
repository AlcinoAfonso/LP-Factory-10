export function DocumentViewer({ title, content }: { title: string; content: string | null }) {
  return <section className="rounded-xl border bg-white p-5 shadow-sm"><h2 className="text-lg font-semibold">{title}</h2>{content ? <pre className="mt-3 max-h-96 overflow-auto whitespace-pre-wrap rounded-lg bg-gray-50 p-4 text-sm text-gray-700">{content}</pre> : <p className="mt-2 text-sm text-gray-500">Documento não encontrado.</p>}</section>;
}
