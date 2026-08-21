import Link from "next/link";
import type { AccountLandingPageWorkspaceResult } from "@/lp-builder";
import { landingPageWorkspaceStateLabels } from "@/lp-builder";
import { createLandingPageWorkspaceAction, setLandingPageArchivedAction } from "../workspace-actions";

export function LandingPageWorkspace(props: Readonly<{
  accountSubdomain: string;
  workspace: Extract<AccountLandingPageWorkspaceResult, { ok: true }>;
  showArchived?: boolean;
  error?: string;
}>) {
  const pages = props.showArchived ? props.workspace.archived : props.workspace.active;
  return (
    <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-brand-700">Workspace da conta</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-ink-900">Landing pages</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-graytech-600">Cada página mantém uma identidade, seu histórico de versões e a escolha aprovada.</p>
        </div>
        <Link href={`/a/${props.accountSubdomain}${props.showArchived ? "" : "?archived=1"}`} className="inline-flex min-h-11 items-center justify-center rounded-lg border border-surface-border bg-white px-4 text-sm font-semibold text-ink-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600">
          {props.showArchived ? "Ver páginas em andamento" : `Arquivadas (${props.workspace.archived.length})`}
        </Link>
      </header>

      {props.error ? <p role="alert" className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">A ação não foi concluída. Nenhum conteúdo ou histórico foi removido.</p> : null}

      {!props.showArchived ? (
        <details className="mt-8 rounded-2xl border border-surface-border bg-white p-5 shadow-card sm:p-6">
          <summary className="min-h-11 cursor-pointer py-2 text-base font-semibold text-brand-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600">Nova página</summary>
          <form action={createLandingPageWorkspaceAction} className="mt-5 grid gap-4 sm:grid-cols-[1fr_1fr_auto]">
            <input type="hidden" name="account" value={props.accountSubdomain} />
            <label className="text-sm font-semibold text-ink-900">Nome<input name="name" required maxLength={120} className="mt-2 min-h-11 w-full rounded-lg border border-surface-border px-3 font-normal" /></label>
            <label className="text-sm font-semibold text-ink-900">Endereço curto<input name="slug" required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" className="mt-2 min-h-11 w-full rounded-lg border border-surface-border px-3 font-normal" /></label>
            <button className="min-h-11 self-end rounded-lg bg-brand-700 px-5 text-sm font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2">Criar página</button>
          </form>
        </details>
      ) : null}

      <section aria-label={props.showArchived ? "Landing pages arquivadas" : "Landing pages em andamento"} className="mt-8 grid gap-4">
        {pages.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-surface-border bg-white p-8 text-center text-sm text-graytech-600">{props.showArchived ? "Nenhuma página arquivada." : "Crie a primeira página operacional quando estiver pronto."}</div>
        ) : pages.map((page) => (
          <article key={page.id} className="rounded-2xl border border-surface-border bg-white p-5 shadow-card sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2"><h2 className="truncate text-lg font-bold text-ink-900">{page.name}</h2><span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-800">{landingPageWorkspaceStateLabels[page.state]}</span></div>
                <p className="mt-2 text-sm text-graytech-600">{page.latestRevision ? `Versão mais recente: ${page.latestRevision.number}` : "Ainda sem versão gerada"}{page.approvedRevision ? ` · Aprovada: ${page.approvedRevision.number}` : " · Nenhuma aprovada"}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link href={`/a/${props.accountSubdomain}/landing-pages/${page.id}`} className="inline-flex min-h-11 items-center rounded-lg bg-brand-700 px-4 text-sm font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600">Abrir página</Link>
                <form action={setLandingPageArchivedAction}>
                  <input type="hidden" name="account" value={props.accountSubdomain} /><input type="hidden" name="landing_page_id" value={page.id} /><input type="hidden" name="archived" value={page.status === "archived" ? "0" : "1"} />
                  <button className="min-h-11 rounded-lg border border-surface-border bg-white px-4 text-sm font-semibold text-ink-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600">{page.status === "archived" ? "Restaurar" : "Arquivar"}</button>
                </form>
              </div>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
