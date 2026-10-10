"use server";
import { revalidatePath } from "next/cache";
import { requireCommunicationBaseAccess } from "../../../../lib/communication-base/access";
import { isCommunicationResourcesEnabled } from "../../../../lib/communication-base/config";
import { readCommunicationDefinitions } from "../../../../lib/communication-base/adapters/communicationCatalogAdapter";
import { readCommunicationBase, saveCommunicationSection } from "../../../../lib/communication-base/adapters/communicationBaseAdapter";
import { uploadCommunicationImage, cleanupUncommittedCommunicationImage, signCommunicationImage } from "../../../../lib/communication-base/adapters/communicationMaterialAdapter";
import { isMaterialId, parseCommunicationMaterials } from "../../../../lib/communication-base/materials";
import type { CommunicationMaterial } from "../../../../lib/communication-base/contracts";
import type { CommunicationActionState } from "./actions";

const failure = (message: string): CommunicationActionState => ({ status: "error", message });
export async function saveCommunicationMaterialAction(_previous: CommunicationActionState, data: FormData): Promise<CommunicationActionState> {
  if (!isCommunicationResourcesEnabled()) return failure("O acervo está indisponível agora.");
  const account=String(data.get("account")??"");
  const access=await requireCommunicationBaseAccess(account,true);
  if (!access.ok) return failure("Não foi possível autorizar esta edição.");
  const definitions=await readCommunicationDefinitions();
  const key=String(data.get("section_key")??"");
  const definition=definitions.ok ? definitions.value.find(s=>s.key===key && s.stage===3) : null;
  if (!definition) return failure("Não foi possível carregar a seção.");
  const base=await readCommunicationBase(access.value.accountId,definitions.ok?definitions.value:[]);
  const version=Number(data.get("version"));
  if (!base.ok || !base.value) return failure("Não foi possível carregar a Base.");
  if (!Number.isSafeInteger(version) || base.value.version!==version) return failure("A Base mudou em outra edição. Atualize a página antes de salvar.");
  const items=parseCommunicationMaterials(base.value.sections[key]?.value??[]);
  if (!items) return failure("Não foi possível validar os materiais salvos.");
  const id=String(data.get("item_id")??"");
  if (!isMaterialId(id)) return failure("Material inválido.");
  const previous=items.find(item=>item.id===id);
  const remove=data.get("operation")==="remove";
  if (remove && !previous) return failure("O material não está mais disponível.");
  let uploaded: Extract<CommunicationMaterial["source"],{type:"private"}> | null=null;
  let next: readonly CommunicationMaterial[] = items;
  if (remove) next=items.filter(item=>item.id!==id);
  else {
    const kind=String(data.get("kind")??"");
    const mode=String(data.get("source_type")??"");
    let source: unknown;
    if (mode==="keep") {
      if (!previous || kind!==previous.kind) return failure("Escolha uma nova fonte para este tipo de material.");
      source=previous.source;
    } else if (mode==="upload") {
      const file=data.get("file");
      if (kind!=="image" || !(file instanceof File)) return failure("Escolha uma imagem PNG, JPEG ou WebP de até 4 MiB.");
      const result=await uploadCommunicationImage(access.value.accountId,id,file);
      if (!result.ok) return failure(result.error==="invalid" ? "Escolha uma imagem PNG, JPEG ou WebP válida de até 4 MiB." : "Não foi possível enviar a imagem. Tente novamente.");
      uploaded=result.value; source=uploaded;
    } else if (mode==="text") source={type:"text",text:String(data.get("text")??"")};
    else if (mode==="link") source={type:"link",url:String(data.get("url")??"")};
    const parsed=parseCommunicationMaterials([{id,kind,name:String(data.get("name")??""),context:String(data.get("context")??""),
      author:String(data.get("author")??""),authorization:String(data.get("authorization")??""),source}]);
    if (!parsed) {
      if (uploaded) await cleanupUncommittedCommunicationImage(access.value.accountId,id,uploaded.path);
      return failure("Revise nome, fonte e limites do material.");
    }
    next=previous ? items.map(item=>item.id===id?parsed[0]:item) : [...items,parsed[0]];
  }
  const result=await saveCommunicationSection({accountId:access.value.accountId,key,value:next,expectedVersion:version,
    origin:"user_confirmed",definitions:definitions.ok?definitions.value:[]});
  if (!result.ok) {
    const cleaned=!uploaded || await cleanupUncommittedCommunicationImage(access.value.accountId,id,uploaded.path);
    return failure((result.error==="conflict" ? "A Base mudou em outra edição. Atualize a página; este rascunho não foi salvo." : "Não foi possível salvar o material. Tente novamente.")+
      (cleaned?"":" O envio não foi vinculado à Base; tente novamente mais tarde."));
  }
  revalidatePath("/a/"+access.value.accountSubdomain+"/base-comunicacao");
  return {status:"saved",message:remove?"Material removido da Base.":"Material salvo."};
}

export async function openCommunicationImageAction(input: Readonly<{account:string;sectionKey:string;itemId:string}>): Promise<Readonly<{ok:true;url:string}>|Readonly<{ok:false;message:string}>> {
  const unavailable={ok:false as const,message:"Não foi possível abrir a imagem. Ela pode estar indisponível; tente novamente."};
  if (!isCommunicationResourcesEnabled() || !input || !isMaterialId(input.itemId)) return unavailable;
  const access=await requireCommunicationBaseAccess(input.account);
  if (!access.ok) return unavailable;
  const definitions=await readCommunicationDefinitions();
  if (!definitions.ok || !definitions.value.some(s=>s.key===input.sectionKey && s.stage===3)) return unavailable;
  const base=await readCommunicationBase(access.value.accountId,definitions.value);
  if (!base.ok || !base.value) return unavailable;
  const item=parseCommunicationMaterials(base.value.sections[input.sectionKey]?.value)?.find(item=>item.id===input.itemId);
  if (!item) return unavailable;
  const result=await signCommunicationImage(access.value.accountId,item);
  return result.ok?{ok:true,url:result.value}:unavailable;
}
