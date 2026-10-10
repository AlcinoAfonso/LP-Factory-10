import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { FeedbackMessage } from "@/components/ui/feedback-message";
import { requirePlatformAdmin } from "@/lib/access/guards";
import { redirect } from "next/navigation";
import { readCommunicationCatalog } from "../../../../lib/communication-base/adapters/communicationCatalogAdapter";
import { isCommunicationResourcesEnabled } from "../../../../lib/communication-base/config";
import { CommunicationCatalogEditor } from "./CommunicationCatalogEditor";
export const dynamic = "force-dynamic";
export default async function CommunicationCatalogPage() {
  const access=await requirePlatformAdmin();if(!access.allowed)redirect(access.redirect);
  const enabled=isCommunicationResourcesEnabled();
  const result=enabled?await readCommunicationCatalog():null;
  return <div className="space-y-6"><AdminPageHeader title="Seções da Base de Comunicação" description="Organize as seções disponíveis nas três categorias."/>
    <p className="text-sm text-muted-foreground">Os títulos e a ordem valem para todas as contas. Novas seções começam vazias e opcionais; os conteúdos salvos são preservados.</p>
    {result?.ok?<CommunicationCatalogEditor sections={result.value}/>:<FeedbackMessage tone={enabled?"error":"warning"}>{enabled?"Não foi possível carregar as seções. Atualize a página e tente novamente.":"A gestão de seções ainda não está disponível."}</FeedbackMessage>}
  </div>;
}
