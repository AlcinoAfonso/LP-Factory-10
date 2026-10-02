import Link from "next/link";
import { notFound } from "next/navigation";

import { requireCommunicationBaseAccess } from "../../../../lib/communication-base/access";
import { readCommunicationBase, readPendingSetupInitialContext } from "../../../../lib/communication-base/adapters/communicationBaseAdapter";
import { stageOneStateKey } from "../../../../lib/communication-base/ui-state-keys";
import { FeedbackMessage } from "@/components/ui/feedback-message";
import { EmptyState } from "@/components/ui/empty-state";
import { CommunicationBaseTabs } from "./CommunicationBaseTabs";
import { CommunicationStageOne, CommunicationStageTwo, StartCommunicationBaseForm } from "./CommunicationSectionEditor";

type PageProps = Readonly<{ params: Promise<{ account: string }> }>;

export default async function CommunicationBasePage({ params }: PageProps) {
  const { account } = await params;
  const access = await requireCommunicationBaseAccess(account);
  if (!access.ok) {
    if (access.error === "forbidden") notFound();
    return (
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <h1 className="text-2xl font-semibold">Base de Comunicação</h1>
        <p role={access.error === "read_failed" ? "alert" : "status"}
          className="mt-4 text-sm text-muted-foreground">
          {access.error === "read_failed"
            ? "Não foi possível verificar seu acesso agora. Atualize a página e tente novamente."
            : "A Base de Comunicação ainda não está disponível. Tente novamente mais tarde."}
        </p>
      </main>
    );
  }

  const result = await readCommunicationBase(access.value.accountId);
  const base = result.ok ? result.value : null;
  const pendingSetupCandidate = result.ok && !base && access.value.canEdit
    ? await readPendingSetupInitialContext(access.value.accountId)
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
          <FeedbackMessage tone="error">
            Não foi possível carregar a Base agora. Atualize a página e tente novamente.
          </FeedbackMessage>
        ) : !base ? (
          access.value.canEdit ? (
            <StartCommunicationBaseForm
              account={access.value.accountSubdomain}
              candidate={pendingSetupCandidate?.ok ? pendingSetupCandidate.value : null}
              candidateReadFailed={pendingSetupCandidate !== null && !pendingSetupCandidate.ok}
            />
          ) : (
            <EmptyState title="A Base ainda não foi iniciada." description="Um membro com permissão de edição pode iniciar a Base desta conta." />
          )
        ) : (
          <div className="space-y-8">
            {!access.value.canEdit ? (
              <p role="status" className="text-sm text-muted-foreground">
                Seu acesso é somente leitura.
              </p>
            ) : null}
            <CommunicationBaseTabs stageOne={<CommunicationStageOne account={access.value.accountSubdomain}
              base={base} canEdit={access.value.canEdit} />}
              stageTwo={<CommunicationStageTwo key={stageOneStateKey(base)} account={access.value.accountSubdomain}
                base={base} canEdit={access.value.canEdit} />} />
          </div>
        )}
      </div>
    </main>
  );
}
