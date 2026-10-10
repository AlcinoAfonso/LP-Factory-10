"use server";
import { revalidatePath } from "next/cache";
import { requirePlatformAdmin } from "@/lib/access/guards";
import { isCommunicationResourcesEnabled } from "../../../../lib/communication-base/config";
import { COMMUNICATION_CATEGORIES, type CommunicationCategory } from "../../../../lib/communication-base/catalog";
import { saveCommunicationCatalogSection } from "../../../../lib/communication-base/adapters/communicationCatalogAdapter";
import { isMaterialId } from "../../../../lib/communication-base/materials";
export type CatalogActionState=Readonly<{status:"idle"|"saved"|"error";message:string}>;
export async function saveCatalogSectionAction(_previous:CatalogActionState,data:FormData):Promise<CatalogActionState>{
  const access=await requirePlatformAdmin();
  if(!access.allowed || !isCommunicationResourcesEnabled())return {status:"error",message:"Não foi possível autorizar esta alteração."};
  const id=String(data.get("id")??"")||null;
  const category=String(data.get("category")??"") as CommunicationCategory;
  const label=String(data.get("label")??"").trim();
  const position=Number(data.get("position"));
  const expectedUpdatedAt=String(data.get("updated_at")??"")||null;
  if((id&&!isMaterialId(id))||!COMMUNICATION_CATEGORIES.includes(category)||!label||label.length>120||!Number.isSafeInteger(position)||position<1||position>150||
    (id&&(!expectedUpdatedAt||!Number.isFinite(Date.parse(expectedUpdatedAt)))))return {status:"error",message:"Revise título e posição da seção."};
  const result=await saveCommunicationCatalogSection({id,category,label,position,expectedUpdatedAt});
  if(!result.ok)return {status:"error",message:result.error==="conflict"?"As seções mudaram em outra edição. Atualize a página antes de salvar.":"Não foi possível salvar agora. Tente novamente."};
  revalidatePath("/admin/base-comunicacao");
  revalidatePath("/a/[account]/base-comunicacao","page");
  return {status:"saved",message:"Seção salva para todas as contas."};
}
