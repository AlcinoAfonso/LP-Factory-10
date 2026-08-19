import { notFound } from "next/navigation";

import { LandingPageRenderer } from "@/components/lp-builder/LandingPageRenderer";
import { loadLandingPagePreview } from "@/lp-builder/adapters/landingPagePreviewAdapter";

import { GenerationTrigger } from "./GenerationTrigger";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const maxDuration = 300;

type PageProps = Readonly<{
  params: Promise<{ account: string; landingPageId: string }>;
}>;

export default async function LandingPagePreview({ params }: PageProps) {
  const { account, landingPageId } = await params;
  const accountSlug = account.trim().toLowerCase();
  const preview = await loadLandingPagePreview({ accountSlug, landingPageId });
  if (preview.status === "denied" || preview.status === "not_found") notFound();

  return (
    <main className="min-w-0 bg-surface-app px-3 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="mx-auto w-full max-w-[90rem] space-y-5">
        <section aria-label="Controles do preview" className="rounded-2xl border border-surface-border bg-white p-5 shadow-card sm:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-700">
                Landing page em draft
              </p>
              <p className="mt-2 text-xl font-bold tracking-tight text-ink-900 sm:text-2xl">
                Preview privado
              </p>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-graytech-600">
                Esta superfície reproduz somente a revisão persistida atual. Gerar uma nova revisão continua sendo uma ação humana explícita.
              </p>
            </div>
            <GenerationTrigger accountSlug={accountSlug} landingPageId={landingPageId} />
          </div>
          {preview.status === "ready" ? (
            <RevisionEvidence model={preview.model} />
          ) : null}
        </section>

        {preview.status === "ready" ? (
          <LandingPageRenderer model={preview.model} />
        ) : preview.status === "empty" ? (
          <PreviewState
            title="Ainda não há uma revisão para visualizar"
            description="Use o gatilho acima quando quiser gerar a primeira revisão desta landing page."
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

function RevisionEvidence({
  model,
}: Readonly<{
  model: Extract<Awaited<ReturnType<typeof loadLandingPagePreview>>, { status: "ready" }>["model"];
}>) {
  return (
    <details className="mt-5 border-t border-surface-border pt-4 text-sm text-graytech-600">
      <summary className="min-h-11 cursor-pointer rounded-md py-3 font-semibold text-ink-800 outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2">
        Metadados da revisão {model.revision.number}
      </summary>
      <dl className="grid gap-x-6 gap-y-3 pb-2 pt-3 sm:grid-cols-2 lg:grid-cols-3">
        <EvidenceItem label="Revision ID" value={model.revision.id} />
        <EvidenceItem label="Attempt ID" value={model.revision.attemptId} />
        <EvidenceItem label="Request ID" value={model.revision.requestId} />
        <EvidenceItem label="Prompt" value={model.revision.promptVersion} />
        <EvidenceItem label="Contrato" value={`v${model.revision.presentationContractVersion}`} />
        <EvidenceItem label="Texto" value={`${model.revision.textWorkload.model} · ${model.revision.textWorkload.reasoningEffort}`} />
        <EvidenceItem label="Imagem" value={`${model.revision.imageWorkload.model} · ${model.revision.imageWorkload.size}`} />
      </dl>
    </details>
  );
}

function EvidenceItem({ label, value }: Readonly<{ label: string; value: string }>) {
  return (
    <div className="min-w-0">
      <dt className="font-semibold text-ink-800">{label}</dt>
      <dd className="mt-1 break-all font-mono text-xs leading-5">{value}</dd>
    </div>
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
