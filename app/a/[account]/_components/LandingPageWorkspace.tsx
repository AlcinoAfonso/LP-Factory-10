import Link from "next/link";

import type { AccountLandingPageWorkspaceItem, AccountLandingPageWorkspaceResult } from "@/lp-builder";
import { landingPageWorkspaceStateLabels } from "@/lp-builder";

const IDENTITY_LABELS = Object.freeze({
  funnelStage: "Etapa do funil",
  transactionIntent: "Intenção",
  primaryConversionGoal: "Conversão principal",
  primaryServiceOrOffer: "Serviço ou oferta",
} as const);

export function LandingPageWorkspace(props: Readonly<{
  accountSubdomain: string;
  workspace: Extract<AccountLandingPageWorkspaceResult, { ok: true }>;
  error?: string;
}>) {
  const pages = props.workspace.page.items;
  return (
    <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-brand-700">
            {props.accountSubdomain} · Workspace da conta
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-ink-900">Minhas landing pages</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-graytech-600">
            Consulte a identidade, a situação e as versões de cada trabalho comercial.
          </p>
        </div>
        {props.workspace.canMutate ? (
          <Link href={`/a/${props.accountSubdomain}/landing-pages/new`} className="inline-flex min-h-11 items-center justify-center rounded-lg bg-brand-700 px-5 text-sm font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600">
            Nova landing page
          </Link>
        ) : (
          <span className="rounded-full bg-graytech-100 px-3 py-2 text-sm font-semibold text-graytech-700">Somente leitura</span>
        )}
      </header>

      {props.error ? (
        <p role="alert" className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          A ação não foi concluída. Nenhuma configuração ou revisão foi alterada.
        </p>
      ) : null}

      <section aria-label="Landing pages da conta" className="mt-8">
        {pages.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-surface-border bg-white p-8 text-center text-sm text-graytech-600">
            {props.workspace.canMutate ? "Crie a primeira landing page quando quiser iniciar um trabalho comercial." : "Nenhuma landing page está disponível para consulta."}
          </div>
        ) : (
          <>
            <div className="hidden overflow-hidden rounded-2xl border border-surface-border bg-white shadow-card lg:block">
              <table className="w-full table-fixed text-left text-sm">
                <thead className="bg-graytech-50 text-xs font-semibold uppercase tracking-wide text-graytech-700">
                  <tr>
                    <th className="w-[15%] px-4 py-3">Landing page</th><th className="w-[28%] px-4 py-3">Identidade</th><th className="w-[14%] px-4 py-3">Situação</th><th className="w-[11%] px-4 py-3">Última</th><th className="w-[11%] px-4 py-3">Aceita</th><th className="w-[12%] px-4 py-3">Atualizada</th><th className="w-[9%] px-4 py-3"><span className="sr-only">Ação</span></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border">
                  {pages.map((page) => <WorkspaceRow key={page.id} account={props.accountSubdomain} page={page} />)}
                </tbody>
              </table>
            </div>
            <div className="grid gap-4 lg:hidden">
              {pages.map((page) => <WorkspaceCard key={page.id} account={props.accountSubdomain} page={page} />)}
            </div>
          </>
        )}
      </section>

      {props.workspace.page.nextCursor ? (
        <div className="mt-6 flex justify-center">
          <Link href={`/a/${props.accountSubdomain}?workspace_cursor=${props.workspace.page.nextCursor}`} className="inline-flex min-h-11 items-center rounded-lg border border-surface-border bg-white px-4 text-sm font-semibold text-ink-900">Próxima página</Link>
        </div>
      ) : null}
    </main>
  );
}

function WorkspaceRow({ account, page }: Readonly<{ account: string; page: AccountLandingPageWorkspaceItem }>) {
  return (
    <tr className="align-top text-graytech-700">
      <td className="px-4 py-4 font-semibold text-ink-900">{page.name}</td><td className="px-4 py-4"><Identity identity={page.identity} compact /></td><td className="px-4 py-4"><StateBadge state={page.state} /></td><td className="px-4 py-4">{revisionLabel(page.latestRevision?.number)}</td><td className="px-4 py-4">{revisionLabel(page.approvedRevision?.number)}</td><td className="px-4 py-4">{formatUpdatedAt(page.updatedAt)}</td><td className="px-4 py-4"><WorkspaceLink account={account} pageId={page.id} /></td>
    </tr>
  );
}

function WorkspaceCard({ account, page }: Readonly<{ account: string; page: AccountLandingPageWorkspaceItem }>) {
  return (
    <article className="rounded-2xl border border-surface-border bg-white p-5 shadow-card">
      <div className="flex flex-wrap items-start justify-between gap-3"><h2 className="text-lg font-bold text-ink-900">{page.name}</h2><StateBadge state={page.state} /></div>
      <Identity identity={page.identity} />
      <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-surface-border pt-4 text-sm">
        <SummaryItem label="Última" value={revisionLabel(page.latestRevision?.number)} /><SummaryItem label="Aceita" value={revisionLabel(page.approvedRevision?.number)} /><SummaryItem label="Atualizada" value={formatUpdatedAt(page.updatedAt)} />
      </dl>
      <div className="mt-5"><WorkspaceLink account={account} pageId={page.id} /></div>
    </article>
  );
}

function Identity({ identity, compact = false }: Readonly<{ identity: AccountLandingPageWorkspaceItem["identity"]; compact?: boolean }>) {
  return (
    <dl className={compact ? "space-y-1 text-xs" : "mt-4 grid gap-2 text-sm"}>
      {Object.entries(IDENTITY_LABELS).map(([key, label]) => (
        <div key={key} className={compact ? "leading-5" : "grid grid-cols-[8.5rem_1fr] gap-2"}><dt className="font-semibold text-graytech-600">{label}:</dt><dd className="min-w-0 text-ink-900">{identity[key as keyof typeof identity]}</dd></div>
      ))}
    </dl>
  );
}

function SummaryItem({ label, value }: Readonly<{ label: string; value: string }>) { return <div><dt className="font-semibold text-graytech-600">{label}</dt><dd className="mt-1 text-ink-900">{value}</dd></div>; }
function StateBadge({ state }: Readonly<{ state: AccountLandingPageWorkspaceItem["state"] }>) { return <span className="inline-flex rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-800">{landingPageWorkspaceStateLabels[state]}</span>; }
function WorkspaceLink({ account, pageId }: Readonly<{ account: string; pageId: string }>) { return <Link href={`/a/${account}/landing-pages/${pageId}`} className="inline-flex min-h-11 items-center justify-center rounded-lg border border-brand-700 px-4 text-sm font-semibold text-brand-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600">Abrir</Link>; }
function revisionLabel(number: number | undefined) { return number ? `Versão ${number}` : "—"; }
function formatUpdatedAt(value: string) { return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value)); }
