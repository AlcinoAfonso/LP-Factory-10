import Link from "next/link";
import { notFound } from "next/navigation";

import { LandingPageRenderer } from "@/components/lp-builder/LandingPageRenderer";
import { getAccessContext } from "@/lib/access/getAccessContext";
import { loadLandingPagePreview } from "@/lp-builder/adapters/landingPagePreviewAdapter";
import { isLandingPageWorkspaceEnabled } from "@/lp-builder/landingPageWorkspace";

import { WorkspaceSubmitButton } from "../../../_components/WorkspaceSubmitButton";
import { approveLandingPageRevisionAction } from "../actions";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const maxDuration = 300;

type PageProps = Readonly<{
  params: Promise<{ account: string; landingPageId: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}>;

export default async function LandingPagePreview({ params, searchParams }: PageProps) {
  const { account, landingPageId } = await params;
  const query = searchParams ? await searchParams : {};
  const accountSlug = account.trim().toLowerCase();
  const revisionId = typeof query.revision === "string" ? query.revision : undefined;
  const preview = await loadLandingPagePreview({ accountSlug, landingPageId, revisionId });
  if (preview.status === "denied" || preview.status === "not_found") notFound();
  const access = await getAccessContext({
    params: { account: accountSlug },
    route: `/a/${accountSlug}/landing-pages/${landingPageId}/preview`,
  });
  const canMutate =
    !access?.blocked &&
    access?.account?.status === "active" &&
    ["owner", "admin"].includes(String(access.role));
  const workspaceEnabled = isLandingPageWorkspaceEnabled();

  return (
    <main className="min-w-0 bg-surface-app px-3 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="mx-auto w-full max-w-[90rem] space-y-5">
        <section aria-label="Controles do preview" className="rounded-2xl border border-surface-border bg-white p-5 shadow-card sm:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              {preview.status === "ready" ? (
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-700">{preview.model.landingPageName} → Versão {preview.model.revision.number}</p>
              ) : null}
              <p className="mt-2 text-xl font-bold tracking-tight text-ink-900 sm:text-2xl">
                Preview privado
              </p>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-graytech-600">
                Esta superfície reproduz somente a versão persistida selecionada.
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Link href={`/a/${accountSlug}/landing-pages/${landingPageId}`} className="inline-flex min-h-11 items-center justify-center rounded-lg border border-surface-border bg-white px-4 text-sm font-semibold text-ink-900">Voltar para {preview.status === "ready" ? preview.model.landingPageName : "a landing page"}</Link>
              {workspaceEnabled && preview.status === "ready" && canMutate && !preview.model.isAccepted ? (
                <form action={approveLandingPageRevisionAction}>
                  <input type="hidden" name="account" value={accountSlug} />
                  <input type="hidden" name="landing_page_id" value={landingPageId} />
                  <input type="hidden" name="materialization_id" value={preview.model.revision.id} />
                  <WorkspaceSubmitButton
                    idleLabel="Aceitar esta versão"
                    pendingLabel="Aceitando..."
                    className="min-h-11 rounded-lg border border-brand-700 bg-white px-4 text-sm font-semibold text-brand-800 disabled:cursor-wait disabled:opacity-60"
                  />
                </form>
              ) : null}
            </div>
          </div>
          {preview.status === "ready" && preview.model.isAccepted ? <p className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm font-medium text-emerald-800">Esta é a versão aceita desta landing page.</p> : null}
          {workspaceEnabled && preview.status === "ready" && canMutate && !preview.model.isAccepted ? <p className="mt-4 text-sm text-graytech-600">Confirma que esta é a versão aceita desta landing page. Isso não publica a página.</p> : null}
          {typeof query.action_error === "string" ? (
            <p role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
              O aceite não foi concluído. A versão anteriormente aceita foi preservada.
            </p>
          ) : null}
        </section>

        {preview.status === "ready" ? (
          <LandingPageRenderer model={preview.model} />
        ) : preview.status === "empty" ? (
          <PreviewState
            title="Ainda não há uma revisão para visualizar"
            description="Volte ao detalhe da landing page para gerar a primeira versão."
          />
        ) : preview.status === "invalid_cta" ? (
          <PreviewState
            title="O destino de conversão não é seguro para exibição"
            description="A revisão foi preservada, mas o preview permanece bloqueado até que uma nova revisão tenha um binding válido."
          />
        ) : (
          <PreviewState
            title="Preview temporariamente indisponível"
            description="A revisão não foi exposta porque uma leitura ou a mídia privada não pôde ser validada com segurança."
          />
        )}
      </div>
    </main>
  );
}

function PreviewState({
  title,
  description,
}: Readonly<{ title: string; description: string }>) {
  return (
    <section className="flex min-h-[28rem] items-center justify-center rounded-[1.75rem] border border-surface-border bg-white p-6 text-center shadow-card sm:p-10">
      <div className="max-w-xl">
        <h1 className="text-balance text-3xl font-bold tracking-tight text-ink-900 sm:text-4xl">
          {title}
        </h1>
        <p className="mt-4 text-sm leading-6 text-graytech-600 sm:text-base sm:leading-7">
          {description}
        </p>
      </div>
    </section>
  );
}
