import Link from "next/link";
import { notFound } from "next/navigation";

import { requireCommunicationBaseAccess } from "../../../../lib/communication-base/access";
import { readCommunicationBase, readPendingSetupBusinessContext } from "../../../../lib/communication-base/adapters/communicationBaseAdapter";
import { hasStageTwoContent } from "../../../../lib/communication-base/ai-core";
import { communicationSections } from "../../../../lib/communication-base/registry";
import { CommunicationSectionEditor, StartCommunicationBaseForm } from "./CommunicationSectionEditor";

type PageProps = Readonly<{ params: Promise<{ account: string }> }>;

export default async function CommunicationBasePage({ params }: PageProps) {
  const { account } = await params;
  const access = await requireCommunicationBaseAccess(account);
  if (!access.ok) {
    if (access.error === "unavailable") {
      return (
        <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
          <h1 className="text-2xl font-semibold">Base de Comunicação</h1>
          <p role="status" className="mt-4 text-sm text-muted-foreground">
            A Base de Comunicação ainda não está disponível. Tente novamente mais tarde.
          </p>
        </main>
      );
    }
    notFound();
  }

  const result = await readCommunicationBase(access.value.accountId);
  const base = result.ok ? result.value : null;
  const pendingSetupCandidate = result.ok && !base && access.value.canEdit
    ? await readPendingSetupBusinessContext(access.value.accountId)
    : null;

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="space-y-7">
        <header className="space-y-3">
          <Link
            href={`/a/${encodeURIComponent(access.value.accountSubdomain)}`}
            className="inline-flex min-h-11 items-center text-sm font-medium text-brand-700 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700"
          >
            Voltar à conta
          </Link>
          <h1 className="text-3xl font-semibold tracking-tight text-ink-900">Base de Comunicação</h1>
          <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
            Reúna a verdade da empresa e desenvolva sua inteligência de comunicação no seu ritmo.
          </p>
        </header>
        {!result.ok ? (
          <p role="alert" className="rounded-lg border border-state-error/30 bg-state-error/5 p-4 text-sm">
            Não foi possível carregar a Base agora. Atualize a página e tente novamente.
          </p>
        ) : !base ? (
          access.value.canEdit ? (
            <StartCommunicationBaseForm
              account={access.value.accountSubdomain}
              candidate={pendingSetupCandidate?.ok ? pendingSetupCandidate.value : null}
              candidateReadFailed={pendingSetupCandidate !== null && !pendingSetupCandidate.ok}
            />
          ) : (
            <p role="status" className="text-sm text-muted-foreground">
              A Base ainda não foi iniciada por um membro com permissão de edição.
            </p>
          )
        ) : (
          <div className="space-y-8">
            {!access.value.canEdit ? (
              <p role="status" className="text-sm text-muted-foreground">
                Seu acesso é somente leitura.
              </p>
            ) : null}
            {([1, 2] as const).map((stage) => (
              <section key={stage} aria-labelledby={`communication-stage-${stage}`} className="space-y-4">
                <div className="space-y-3">
                  <p className="text-sm font-semibold text-brand-700">Etapa {stage}</p>
                  <h2 id={`communication-stage-${stage}`} className="text-xl font-semibold">
                    {stage === 1 ? "Verdade da empresa" : "Inteligência de comunicação"}
                  </h2>
                  {stage === 2 && access.value.canEdit ? (
                    <div className="rounded-lg border border-border bg-white p-4">
                      <p className="text-sm text-muted-foreground">
                        {hasStageTwoContent(base)
                          ? "Quando disponível, esta ação atualizará sugestões para as sete seções da Etapa 2. Revise cada sugestão antes de salvar."
                          : "Quando disponível, esta ação gerará sugestões para as sete seções da Etapa 2. Revise cada sugestão antes de salvar."}
                      </p>
                      <button type="button" disabled aria-describedby="communication-ai-unavailable"
                        className="mt-3 inline-flex min-h-11 items-center justify-center rounded-lg border border-border px-5 py-2 text-sm font-semibold text-muted-foreground disabled:cursor-not-allowed disabled:opacity-70">
                        {hasStageTwoContent(base) ? "Atualizar Etapa 2 com IA" : "Gerar Etapa 2 com IA"}
                      </button>
                      <p id="communication-ai-unavailable" role="status" className="mt-2 text-xs text-muted-foreground">
                        A revisão por IA ainda não está disponível. Você pode editar e salvar cada seção manualmente.
                      </p>
                    </div>
                  ) : null}
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {communicationSections.filter((section) => section.stage === stage).map((section) => (
                    <CommunicationSectionEditor
                      key={`${section.key}-${base.version}`}
                      account={access.value.accountSubdomain}
                      version={base.version}
                      definition={section}
                      current={base.sections[section.key]}
                      canEdit={access.value.canEdit}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
