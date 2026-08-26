import Link from "next/link";
import { notFound } from "next/navigation";

import { getAccessContext } from "@/lib/access/getAccessContext";
import {
  getAccountLandingPageWorkspaceDetail,
  landingPageWorkspaceStateLabels,
} from "@/lp-builder";

import { OnboardingConfigurationJourney } from "../../_components/OnboardingConfigurationJourney";
import { GenerationTrigger } from "./GenerationTrigger";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const maxDuration = 300;

type PageProps = Readonly<{
  params: Promise<{ account: string; landingPageId: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}>;

export default async function LandingPageWorkspaceDetail({ params, searchParams }: PageProps) {
  const { account, landingPageId } = await params;
  const query = searchParams ? await searchParams : {};
  const accountSubdomain = account.trim().toLowerCase();
  const ctx = await getAccessContext({
    params: { account: accountSubdomain },
    route: `/a/${accountSubdomain}/landing-pages/${landingPageId}`,
  });
  const accountId = (ctx?.account?.id ?? ctx?.account_id ?? null) as string | null;
  if (!ctx || ctx.blocked || !accountId) notFound();
  const detail = await getAccountLandingPageWorkspaceDetail({
    accountId,
    landingPageId,
    historyCursor:
      typeof query.history_cursor === "string" ? query.history_cursor : undefined,
  });
  if (!detail.ok) {
    if (detail.error === "not_found") notFound();
    return <Unavailable account={accountSubdomain} />;
  }

  return (
    <main>
      <div className="mx-auto max-w-6xl px-4 pb-2 pt-6 sm:px-6 sm:pt-10">
        <nav aria-label="Contexto da página" className="text-sm font-semibold text-brand-800">
          <Link href={`/a/${accountSubdomain}`} className="min-h-11 py-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600">
            Minhas landing pages
          </Link>
          <span aria-hidden="true"> → </span>
          <span>{detail.landingPage.name}</span>
        </nav>
        <section className="mt-4 rounded-2xl border border-surface-border bg-white p-5 shadow-card sm:p-7">
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-ink-900">
            {detail.landingPage.name}
          </h1>
          <p className="mt-2 text-sm font-semibold text-brand-800">{landingPageWorkspaceStateLabels[detail.landingPage.state]}</p>
          <h2 className="mt-6 text-lg font-bold text-ink-900">Identidade da LP</h2>
          <dl className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <IdentityItem label="Etapa do funil" value={detail.landingPage.identity.funnelStage} />
            <IdentityItem label="Intenção" value={detail.landingPage.identity.transactionIntent} />
            <IdentityItem label="Conversão principal" value={detail.landingPage.identity.primaryConversionGoal} />
            <IdentityItem label="Serviço ou oferta" value={detail.landingPage.identity.primaryServiceOrOffer} />
          </dl>
          <dl className="mt-6 grid gap-3 border-t border-surface-border pt-5 sm:grid-cols-3">
            <IdentityItem label="Mais recente" value={revisionLabel(detail.landingPage.latestRevision?.number)} />
            <IdentityItem label="Aceita" value={revisionLabel(detail.landingPage.approvedRevision?.number)} />
            <IdentityItem label="Atualizada" value={new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(detail.landingPage.updatedAt))} />
          </dl>
          {!detail.canMutate ? (
            <p className="mt-4 rounded-lg bg-graytech-100 p-3 text-sm font-medium text-graytech-700">
              Você pode consultar configuração, histórico e previews. Alterações exigem owner ou admin ativo.
            </p>
          ) : null}
        </section>

        {detail.canMutate ? (
          <section className="mt-6 rounded-2xl border border-surface-border bg-white p-5 shadow-card sm:p-7">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-brand-700">Nova versão</p>
            <h2 className="mt-2 text-xl font-bold text-ink-900">Gerar uma nova versão</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-graytech-600">A geração usa a configuração atual. Versões anteriores e a versão aceita permanecem preservadas.</p>
            <div className="mt-5"><GenerationTrigger accountSlug={accountSubdomain} landingPageId={landingPageId} /></div>
          </section>
        ) : null}

        <section className="mt-6 rounded-2xl border border-surface-border bg-white p-5 shadow-card sm:p-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-brand-700">Conta → LP → Histórico</p>
              <h2 className="mt-2 text-xl font-bold text-ink-900">Versões</h2>
              <p className="mt-1 text-sm text-graytech-600">A versão mais recente e a aceita podem ser diferentes.</p>
            </div>
            {detail.landingPage.latestRevision ? (
              <Link href={`/a/${accountSubdomain}/landing-pages/${landingPageId}/preview`} className="inline-flex min-h-11 items-center justify-center rounded-lg bg-brand-700 px-4 text-sm font-semibold text-white">
                Ver versão mais recente
              </Link>
            ) : null}
          </div>
          <div className="mt-5 grid gap-3">
            {detail.revisions.items.length === 0 ? (
              <p className="rounded-lg border border-dashed border-surface-border p-5 text-sm text-graytech-600">Nenhuma versão gerada.</p>
            ) : detail.revisions.items.map((revision) => (
              <article key={revision.id} className="flex flex-col gap-3 rounded-xl border border-surface-border p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-semibold text-ink-900">
                    Versão {revision.number}{revision.latest ? " · mais recente" : ""}{revision.approved ? " · aceita" : ""}
                  </p>
                  <p className="mt-1 text-xs text-graytech-600">{new Date(revision.createdAt).toLocaleString("pt-BR")}</p>
                </div>
                <Link href={`/a/${accountSubdomain}/landing-pages/${landingPageId}/preview?revision=${revision.id}`} className="inline-flex min-h-11 items-center justify-center rounded-lg border border-surface-border px-4 text-sm font-semibold text-ink-900">
                  Visualizar
                </Link>
              </article>
            ))}
          </div>
          {detail.revisions.nextCursor ? (
            <Link href={`/a/${accountSubdomain}/landing-pages/${landingPageId}?history_cursor=${detail.revisions.nextCursor}`} className="mt-5 inline-flex min-h-11 items-center font-semibold text-brand-800">
              Próxima página do histórico
            </Link>
          ) : null}
        </section>
      </div>

      {detail.canMutate ? (
        <OnboardingConfigurationJourney
          accountSubdomain={accountSubdomain}
          configuration={detail.configuration.resolved}
          workspaceMode
          sharedRevision={detail.configuration.sharedRevision}
          landingPageRevision={detail.configuration.landingPageRevision}
        />
      ) : (
        <section
          aria-labelledby="landing-page-readonly-configuration-title"
          className="mx-auto max-w-6xl px-4 py-6 sm:px-6"
        >
          <section className="rounded-2xl border border-surface-border bg-white p-6 shadow-card">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-brand-700">Conta → LP → Configurações</p>
            <h2 id="landing-page-readonly-configuration-title" className="mt-2 text-xl font-bold text-ink-900">Configuração em modo somente leitura</h2>
            <p className="mt-3 text-sm text-graytech-600">
              {detail.configuration.resolved.complete
                ? "Todos os dados obrigatórios estão válidos para a versão operacional autorizada."
                : `Ainda faltam ${detail.configuration.resolved.missingRequiredFieldKeys.length} campos obrigatórios.`}
            </p>
          </section>
        </section>
      )}
    </main>
  );
}

function IdentityItem({ label, value }: Readonly<{ label: string; value: string }>) {
  return <div><dt className="text-xs font-semibold uppercase tracking-wide text-graytech-600">{label}</dt><dd className="mt-1 text-sm font-medium text-ink-900">{value}</dd></div>;
}

function revisionLabel(number: number | undefined) {
  return number ? `Versão ${number}` : "—";
}

function Unavailable({ account }: { account: string }) {
  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
        <h1 className="text-2xl font-bold text-ink-900">Workspace indisponível</h1>
        <p className="mt-3 text-sm text-graytech-700">O contrato operacional não pôde ser validado. Nenhuma coleção parcial foi exibida.</p>
        <Link href={`/a/${account}`} className="mt-5 inline-flex min-h-11 items-center font-semibold text-brand-800">Voltar</Link>
      </section>
    </main>
  );
}
