import { readCommunicationDefinitions } from "../../../../lib/communication-base/adapters/communicationCatalogAdapter";
import { isCommunicationResourcesEnabled } from "../../../../lib/communication-base/config";
import { CommunicationMaterials } from "./_components/CommunicationMaterials";
import Link from "next/link";
import { notFound } from "next/navigation";

import { requireCommunicationBaseAccess } from "../../../../lib/communication-base/access";
import { readCommunicationBase, readPendingSetupInitialContext } from "../../../../lib/communication-base/adapters/communicationBaseAdapter";
import { stageOneStateKey } from "../../../../lib/communication-base/ui-state-keys";
import { readActivePrimaryAccountTaxon } from "../../../../lib/onboarding/niche-resolution/adapters/accountTaxonomyAdapter";
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

  const definitions = await readCommunicationDefinitions();
  const structured = isCommunicationResourcesEnabled();
  const [result, taxonomy] = await Promise.all([
    definitions.ok ? readCommunicationBase(access.value.accountId, definitions.value) : Promise.resolve({ok:false as const,error:"read_failed" as const}),
    readActivePrimaryAccountTaxon({ accountId: access.value.accountId }),
  ]);
  const base = result.ok ? result.value : null;
  const savedBusinessName = base?.sections.business_name?.value;
  const businessName = typeof savedBusinessName === "string" ? savedBusinessName.trim() : "";
  const nicheLabel = !taxonomy.ok
    ? "Não foi possível carregar o nicho agora."
    : taxonomy.taxon?.name ?? "Nicho ainda não definido";
  const pendingSetupCandidate = result.ok && !base && access.value.canEdit
    ? await readPendingSetupInitialContext(access.value.accountId)
    : null;

  return (
    <main className="mx-auto max-w-5xl px-4 py-4 sm:px-6 sm:py-6">
      <div className="space-y-3">
        <header className="space-y-1">
          <Link
            href={`/a/${encodeURIComponent(access.value.accountSubdomain)}`}
            className="inline-flex min-h-11 items-center text-sm font-medium text-brand-700 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700"
          >
            Voltar à conta
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight text-ink-900 [overflow-wrap:anywhere]">
            {businessName || "Base de Comunicação"}
          </h1>
          {businessName ? <p className="text-sm font-medium text-ink-900">Base de Comunicação</p> : null}
          <p className="text-sm text-muted-foreground [overflow-wrap:anywhere]">
            {taxonomy.ok && taxonomy.taxon ? `Nicho: ${nicheLabel}` : nicheLabel}
          </p>
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
          <div className="space-y-4">
            {!access.value.canEdit ? (
              <p role="status" className="text-sm text-muted-foreground">
                Seu acesso é somente leitura.
              </p>
            ) : null}
            <CommunicationBaseTabs stageOne={<CommunicationStageOne account={access.value.accountSubdomain}
              base={base} canEdit={access.value.canEdit} structured={structured} definitions={definitions.ok ? definitions.value : []} />}
              stageTwo={<CommunicationStageTwo key={stageOneStateKey(base)} account={access.value.accountSubdomain}
                base={base} canEdit={access.value.canEdit} structured={structured} definitions={definitions.ok ? definitions.value : []} />}
              materials={structured ? <CommunicationMaterials account={access.value.accountSubdomain} base={base} canEdit={access.value.canEdit} definitions={definitions.ok ? definitions.value : []} /> : undefined} />
          </div>
        )}
      </div>
    </main>
  );
}
