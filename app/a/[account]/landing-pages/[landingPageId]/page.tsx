import Link from "next/link";
import { notFound } from "next/navigation";
import { getAccessContext } from "@/lib/access/getAccessContext";
import { getAccountLandingPageWorkspaceDetail, landingPageWorkspaceStateLabels } from "@/lp-builder";
import { OnboardingConfigurationJourney } from "../../_components/OnboardingConfigurationJourney";
import { WorkspaceSubmitButton } from "../../_components/WorkspaceSubmitButton";
import { setLandingPageArchivedAction } from "../../workspace-actions";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type PageProps = Readonly<{
  params: Promise<{ account:string; landingPageId:string }>;
}>;

export default async function LandingPageWorkspaceDetail({params}:PageProps) {
  const {account,landingPageId}=await params;
  const accountSubdomain=account.trim().toLowerCase();
  const ctx=await getAccessContext({params:{account:accountSubdomain},route:`/a/${accountSubdomain}/landing-pages/${landingPageId}`});
  const accountId=(ctx?.account?.id ?? ctx?.account_id ?? null) as string|null;
  if (!ctx || ctx.blocked || !accountId) notFound();
  const detail=await getAccountLandingPageWorkspaceDetail({accountId,landingPageId});
  if (!detail.ok) {
    if (detail.error === "not_found") notFound();
    return <Unavailable account={accountSubdomain}/>;
  }
  const archived=detail.landingPage.status === "archived";
  return (
    <>
      <main className="mx-auto max-w-6xl px-4 pb-2 pt-6 sm:px-6 sm:pt-10">
        <Link href={`/a/${accountSubdomain}`} className="inline-flex min-h-11 items-center text-sm font-semibold text-brand-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600">← Voltar ao workspace</Link>
        <section className="mt-4 rounded-2xl border border-surface-border bg-white p-5 shadow-card sm:p-7">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div><p className="text-sm font-semibold uppercase tracking-[0.16em] text-brand-700">{accountSubdomain} · Landing page</p><h1 className="mt-2 text-3xl font-bold tracking-tight text-ink-900">{detail.landingPage.name}</h1><p className="mt-2 text-sm text-graytech-600">/{detail.landingPage.slug} · {landingPageWorkspaceStateLabels[detail.landingPage.state]}</p></div>
            <form action={setLandingPageArchivedAction}><input type="hidden" name="account" value={accountSubdomain}/><input type="hidden" name="landing_page_id" value={landingPageId}/><input type="hidden" name="archived" value={archived?"0":"1"}/><WorkspaceSubmitButton idleLabel={archived?"Restaurar página":"Arquivar página"} pendingLabel={archived?"Restaurando...":"Arquivando..."} className="min-h-11 rounded-lg border border-surface-border bg-white px-4 text-sm font-semibold text-ink-900 disabled:cursor-wait disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600" /></form>
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-surface-border bg-white p-5 shadow-card sm:p-7">
          <div className="flex items-center justify-between gap-4"><div><h2 className="text-xl font-bold text-ink-900">Histórico de versões</h2><p className="mt-1 text-sm text-graytech-600">A versão mais recente e a aprovada podem ser diferentes.</p></div>{!archived?<Link href={`/a/${accountSubdomain}/landing-pages/${landingPageId}/preview`} className="inline-flex min-h-11 items-center rounded-lg bg-brand-700 px-4 text-sm font-semibold text-white">Gerar ou ver versão atual</Link>:null}</div>
          <div className="mt-5 grid gap-3">
            {detail.revisions.length===0?<p className="rounded-lg border border-dashed border-surface-border p-5 text-sm text-graytech-600">Nenhuma versão gerada.</p>:detail.revisions.map((revision)=><article key={revision.id} className="flex flex-col gap-3 rounded-xl border border-surface-border p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-semibold text-ink-900">Versão {revision.number}{revision.latest?" · mais recente":""}{revision.approved?" · aprovada":""}</p><p className="mt-1 text-xs text-graytech-600">{new Date(revision.createdAt).toLocaleString("pt-BR")}</p></div><Link href={`/a/${accountSubdomain}/landing-pages/${landingPageId}/preview?revision=${revision.id}`} className="inline-flex min-h-11 items-center rounded-lg border border-surface-border px-4 text-sm font-semibold text-ink-900">Visualizar</Link></article>)}
          </div>
        </section>
      </main>
      {archived ? (
        <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
          <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
            <h2 className="font-bold text-amber-950">Página arquivada</h2>
            <p className="mt-2 text-sm text-amber-900">
              O histórico e a aprovação permanecem visíveis. Restaure a página para salvar configuração, gerar ou aprovar.
            </p>
          </section>
        </main>
      ) : (
        <OnboardingConfigurationJourney
          accountSubdomain={accountSubdomain}
          configuration={detail.configuration.resolved}
          workspaceMode
          sharedRevision={detail.configuration.sharedRevision}
        />
      )}
    </>
  );
}

function Unavailable({account}:{account:string}) { return <main className="mx-auto max-w-5xl px-6 py-10"><section className="rounded-2xl border border-amber-200 bg-amber-50 p-6"><h1 className="text-2xl font-bold text-ink-900">Workspace indisponível</h1><p className="mt-3 text-sm text-graytech-700">O contrato operacional ainda não foi validado. Nenhuma lista parcial foi exibida.</p><Link href={`/a/${account}`} className="mt-5 inline-flex min-h-11 items-center font-semibold text-brand-800">Voltar</Link></section></main>; }
