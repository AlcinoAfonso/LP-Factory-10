import Link from "next/link";

import { getAccessContext } from "@/lib/access/getAccessContext";
import {
  LandingPageMaterializedRenderer,
  LandingPagePreviewFrame,
  resolveLandingPageMaterializedRendererModel,
} from "@/conversion-content/landing-page";
import { getLandingPageDraftExperienceState } from "@/lp-builder";

type PreviewPageProps = {
  params: Promise<{ account: string; landingPageId: string }>;
};

export default async function LandingPageDraftPreviewPage({ params }: PreviewPageProps) {
  const resolvedParams = await params;
  const accountSubdomain = (resolvedParams.account ?? "").trim().toLowerCase();
  const landingPageId = (resolvedParams.landingPageId ?? "").trim();
  const route = `/a/${accountSubdomain}/landing-pages/${landingPageId}/preview`;
  const ctx = await getAccessContext({
    params: { account: accountSubdomain },
    route,
  });

  if (!ctx || ctx.blocked || ctx.account?.status !== "active") {
    return <PreviewUnavailable title="Visualização privada indisponível" description="Esta conta ou landing page não está disponível para sua sessão." />;
  }

  const accountId = (ctx.account?.id ?? ctx.account_id ?? null) as string | null;
  if (!accountId) {
    return <PreviewUnavailable title="Visualização privada indisponível" description="Não foi possível confirmar a conta desta landing page." />;
  }

  const experience = await getLandingPageDraftExperienceState({
    accountId,
    landingPageId,
  });
  if (experience.status === "unavailable") {
    return <PreviewUnavailable title="Preview ainda indisponível" description="O armazenamento da materialização ainda não está pronto neste ambiente." />;
  }
  if (experience.status === "empty") {
    return <PreviewUnavailable title="Landing page ainda não materializada" description="Volte à conta e gere a primeira candidata antes de abrir a visualização privada." accountSubdomain={accountSubdomain} />;
  }
  if (experience.status === "invalid") {
    return <PreviewUnavailable title="Conteúdo materializado inválido" description="A página não pode ser reproduzida com segurança e permanece privada e não publicada." accountSubdomain={accountSubdomain} />;
  }

  const rendererModel = resolveLandingPageMaterializedRendererModel(
    experience.materialization.content,
  );
  if (!rendererModel.ok) {
    return <PreviewUnavailable title="Versão não suportada" description="A identidade ou a versão desta materialização não é suportada pelo renderer atual." accountSubdomain={accountSubdomain} />;
  }

  return (
    <main className="min-w-0 bg-surface-app px-3 py-5 sm:px-6 sm:py-8">
      <header className="mx-auto mb-5 max-w-7xl rounded-2xl border border-surface-border bg-white p-5 shadow-card sm:p-6">
        <div className="flex flex-wrap items-center gap-2" aria-label="Estado da landing page">
          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-amber-900">
            Draft
          </span>
          <span className="rounded-full bg-graytech-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-graytech-700">
            Visualização privada
          </span>
          <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-red-900">
            Não publicada
          </span>
        </div>
        <p className="mt-4 break-words text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl">
          Primeira landing page materializada
        </p>
        <p className="mt-3 max-w-3xl break-words text-sm leading-6 text-graytech-700 sm:text-base">
          Revise a página real abaixo. O próximo passo é registrar os findings desta avaliação; publicação, edição e regeneração não fazem parte deste recorte.
        </p>
        <Link
          href={`/a/${accountSubdomain}`}
          className="mt-5 inline-flex min-h-11 items-center rounded-lg border border-surface-border bg-white px-4 text-sm font-semibold text-ink-900 hover:bg-graytech-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
        >
          Voltar à conta
        </Link>
      </header>

      <LandingPagePreviewFrame>
        <LandingPageMaterializedRenderer content={rendererModel.value} />
      </LandingPagePreviewFrame>
    </main>
  );
}

function PreviewUnavailable({
  title,
  description,
  accountSubdomain,
}: {
  title: string;
  description: string;
  accountSubdomain?: string;
}) {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-4xl items-center px-4 py-10 sm:px-6">
      <section role="alert" className="w-full rounded-2xl border border-amber-200 bg-amber-50 p-6 shadow-card sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-amber-800">Draft não publicado</p>
        <h1 className="mt-3 break-words text-2xl font-bold tracking-tight text-ink-900">{title}</h1>
        <p className="mt-3 max-w-2xl break-words text-sm leading-6 text-graytech-700">{description}</p>
        {accountSubdomain ? (
          <Link
            href={`/a/${accountSubdomain}`}
            className="mt-5 inline-flex min-h-11 items-center rounded-lg border border-amber-300 bg-white px-4 text-sm font-semibold text-ink-900 hover:bg-amber-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-700"
          >
            Voltar à conta
          </Link>
        ) : null}
      </section>
    </main>
  );
}
