import { createHash } from "node:crypto";
import type { Viewport } from "next";
import { agentBasePilotCatalogState } from "../../../../lib/communication-base/agent-base/pilot";
import { readCommunicationDefinitions } from "../../../../lib/communication-base/adapters/communicationCatalogAdapter";
import { isCommunicationResourcesEnabled, resolveAgentBaseEnvironment } from "../../../../lib/communication-base/config";
import { CommunicationMaterials } from "./_components/CommunicationMaterials";
import Link from "next/link";
import { notFound } from "next/navigation";

import { requireCommunicationBaseAccess } from "../../../../lib/communication-base/access";
import { readCommunicationBase, readPendingSetupInitialContext } from "../../../../lib/communication-base/adapters/communicationBaseAdapter";
import { stageTwoInputStateKey } from "../../../../lib/communication-base/ui-state-keys";
import { readOfficialNicheContext } from "../../../../lib/onboarding/niche-resolution/adapters/accountOfficialNicheAdapter";
import { FeedbackMessage } from "@/components/ui/feedback-message";
import { EmptyState } from "@/components/ui/empty-state";
import { CommunicationBaseTabs, CommunicationBaseIntroduction } from "./CommunicationBaseTabs";
import styles from "./CommunicationBase.module.css";
import { AccountNicheConversation } from "../_components/AccountNicheConversation";
import { loadBaseNicheConversationAction } from "../niche-resolution-actions";
import { CommunicationStageOne, CommunicationStageTwo, StartCommunicationBaseForm } from "./CommunicationSectionEditor";

export const viewport: Viewport = { colorScheme: "only light" };

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
  const [result, taxonomy, nicheConversation] = await Promise.all([
    definitions.ok ? readCommunicationBase(access.value.accountId, definitions.value) : Promise.resolve({ok:false as const,error:"read_failed" as const}),
    readOfficialNicheContext({ accountId: access.value.accountId }),
    access.value.canEdit ? loadBaseNicheConversationAction(access.value.accountSubdomain) : null,
  ]);
  const base = result.ok ? result.value : null;
  const pendingSetupCandidate = result.ok && !base && access.value.canEdit
    ? await readPendingSetupInitialContext(access.value.accountId)
    : null;

  const showIntroduction = result.ok && (Boolean(base) || (access.value.canEdit && (!structured || taxonomy.ok)));
  const canGenerate = Boolean(taxonomy.ok && taxonomy.niche?.confirmed);
  const pilotCatalogKey = createHash("sha256").update(agentBasePilotCatalogState(definitions.ok ? definitions.value : [])).digest("hex");

  return (
    <main className={`${styles.surface} mx-auto max-w-5xl px-4 py-4 sm:px-6 sm:py-6`}>
      <div className="space-y-1">
        <div>
          <header className="flex flex-wrap items-start justify-between gap-x-1 sm:gap-x-2">
            <div className="flex min-w-min max-w-fit flex-[4_1_0%] flex-wrap items-start gap-x-1 sm:gap-x-2">
              <h1 className="min-w-min max-w-fit flex-1 break-normal py-2 text-lg font-semibold tracking-tight text-foreground sm:text-xl">
                Base de Comunicação
              </h1>
              {showIntroduction ? <CommunicationBaseIntroduction /> : null}
            </div>
            <Link
              href={`/a/${encodeURIComponent(access.value.accountSubdomain)}`}
              className="ml-auto inline-flex min-h-11 max-w-full shrink-0 items-center justify-end whitespace-nowrap text-right text-sm font-medium text-brand-700 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700"
            >
              Voltar à conta
            </Link>
          </header>
          {nicheConversation ? <AccountNicheConversation account={access.value.accountSubdomain} state={nicheConversation} /> : access.value.canEdit ? (
            <FeedbackMessage tone="error">Não foi possível carregar a conversa de nicho. Atualize a página para tentar novamente.</FeedbackMessage>
          ) : null}
        </div>
        {!result.ok ? (
          <FeedbackMessage tone="error">
            Não foi possível carregar a Base agora. Atualize a página e tente novamente.
          </FeedbackMessage>
        ) : !base ? (
          access.value.canEdit ? (
            structured && !taxonomy.ok ? (
              <FeedbackMessage tone="error">
                Não foi possível consultar o nicho agora. Atualize a página e tente novamente.
              </FeedbackMessage>
            ) : (
              <StartCommunicationBaseForm
                account={access.value.accountSubdomain}
                candidate={pendingSetupCandidate?.ok ? pendingSetupCandidate.value : null}
                structured={structured}
                niche={taxonomy.ok ? taxonomy.niche : null}
                candidateReadFailed={pendingSetupCandidate !== null && !pendingSetupCandidate.ok}
              />
            )
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
              stageTwo={<CommunicationStageTwo key={`${stageTwoInputStateKey(base)}:${taxonomy.ok ? taxonomy.niche?.taxonId ?? "" : "error"}:${taxonomy.ok ? taxonomy.niche?.revision ?? "" : ""}`} account={access.value.accountSubdomain}
                base={base} canEdit={access.value.canEdit} canGenerate={canGenerate}
                structured={structured} definitions={definitions.ok ? definitions.value : []} pilotEnabled={resolveAgentBaseEnvironment() !== null} pilotCatalogKey={pilotCatalogKey} />}
              materials={structured ? <CommunicationMaterials account={access.value.accountSubdomain} base={base} canEdit={access.value.canEdit} definitions={definitions.ok ? definitions.value : []} /> : undefined} />
          </div>
        )}
      </div>
    </main>
  );
}
