"use client";
import Image from "next/image";
import { useActionState, useEffect, useLayoutEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FeedbackMessage } from "@/components/ui/feedback-message";
import type { CommunicationBase, CommunicationMaterial } from "../../../../../lib/communication-base/contracts";
import type { CommunicationSectionDefinition } from "../../../../../lib/communication-base/registry";
import { parseCommunicationMaterials } from "../../../../../lib/communication-base/materials";
import { CommunicationSectionCollection, type SectionDetailControls } from "./CommunicationSectionCollection";
import { openCommunicationImageAction, saveCommunicationMaterialAction } from "../material-actions";

type Draft={id:string;kind:CommunicationMaterial["kind"];name:string;context:string;author:string;authorization:string;sourceType:string;url:string;text:string};
const emptyDraft=():Draft=>({id:crypto.randomUUID(),kind:"image",name:"",context:"",author:"",authorization:"",sourceType:"link",url:"",text:""});
const fromItem=(item:CommunicationMaterial):Draft=>({id:item.id,kind:item.kind,name:item.name,context:item.context,author:item.author,
  authorization:item.authorization,sourceType:"keep",url:item.source.type==="link"?item.source.url:"",text:item.source.type==="text"?item.source.text:""});
const kindLabels={image:"Imagem",video:"Vídeo",audio:"Áudio",testimonial:"Depoimento"};
export function CommunicationMaterials({account,base,definitions,canEdit}:Readonly<{
  account:string;base:CommunicationBase;definitions:readonly CommunicationSectionDefinition[];canEdit:boolean;
}>) {
  return <div className="space-y-3"><p className="text-sm text-muted-foreground">Guarde referências, imagens e depoimentos para usar na sua comunicação. Salvar aqui não altera produtos publicados.</p>
    <CommunicationSectionCollection definitions={definitions.filter(s=>s.stage===3)} base={base}
      renderDetail={(definition,controls)=><MaterialSection {...controls} account={account} base={base} definition={definition} canEdit={canEdit}/>} /></div>;
}
function MaterialSection({account,base,definition,canEdit,resetRevision,onEditorStateChange,onCancel}:Readonly<{
  account:string;base:CommunicationBase;definition:CommunicationSectionDefinition;canEdit:boolean;
}>&SectionDetailControls) {
  const items=parseCommunicationMaterials(base.sections[definition.key]?.value??[])??[];
  const [draft,setDraft]=useState<Draft|null>(null);
  const [file,setFile]=useState<File|null>(null);
  const [remove,setRemove]=useState(false);
  const [state,action,pending]=useActionState(saveCommunicationMaterialAction,{status:"idle" as const,message:""});
  const [submittedVersion,setSubmittedVersion]=useState<number|null>(null);
  const locked=pending||(state.status==="saved"&&submittedVersion!==null&&base.version<=submittedVersion);
  const previous=draft?items.find(i=>i.id===draft.id):null;
  const dirty=draft!==null&&(remove || file!==null || JSON.stringify(draft)!==JSON.stringify(previous?fromItem(previous):{...emptyDraft(),id:draft.id}));
  const router=useRouter();
  const reset=useRef(resetRevision);
  const saved=useRef(state);
  const formRef=useRef<HTMLFormElement>(null);
  const addRef=useRef<HTMLButtonElement>(null);
  useLayoutEffect(()=>{onEditorStateChange(dirty,locked);},[dirty,locked,onEditorStateChange]);
  useEffect(()=>{
    if(reset.current!==resetRevision || (state.status==="saved"&&state!==saved.current&&!locked)){
      setDraft(null);setFile(null);setRemove(false);saved.current=state;formRef.current?.reset();addRef.current?.focus();
    }
    reset.current=resetRevision;
  },[resetRevision,state,locked]);
  useEffect(()=>{if(state.status==="saved")router.refresh();},[state,router]);
  const update=(key:keyof Draft,value:string)=>setDraft(current=>current?{...current,[key]:value}:null);
  if(draft && canEdit) return <form ref={formRef} action={action} className="space-y-3" onSubmit={event=>{
    if(locked || !dirty){event.preventDefault();return;}setSubmittedVersion(base.version);
  }}>
    <input type="hidden" name="account" value={account}/><input type="hidden" name="section_key" value={definition.key}/>
    <input type="hidden" name="version" value={base.version}/><input type="hidden" name="item_id" value={draft.id}/>
    <input type="hidden" name="operation" value={remove?"remove":"save"}/>
    {remove?<div role="alert" className="space-y-2"><h3 className="font-semibold">Remover {draft.name}?</h3>
      <p className="text-sm">O material será removido desta Base. Os produtos publicados permanecem como estão.</p></div>:<>
      <label className="block text-sm">Nome do material<Input autoFocus name="name" required maxLength={120} value={draft.name} disabled={locked} onChange={e=>update("name",e.target.value)}/></label>
      <label className="block text-sm">Tipo<select name="kind" value={draft.kind} disabled={locked} className="mt-1 min-h-11 w-full rounded-md border border-border bg-background px-3" onChange={e=>{
        const kind=e.target.value as Draft["kind"];setDraft({...draft,kind,sourceType:kind==="testimonial"?"text":"link"});setFile(null);
      }}>{Object.entries(kindLabels).map(([kind,label])=><option key={kind} value={kind}>{label}</option>)}</select></label>
      <label className="block text-sm">Fonte<select name="source_type" value={draft.sourceType} disabled={locked} className="mt-1 min-h-11 w-full rounded-md border border-border bg-background px-3" onChange={e=>{update("sourceType",e.target.value);setFile(null);}}>
        {previous&&draft.kind===previous.kind?<option value="keep">Manter fonte atual</option>:null}
        {draft.kind==="testimonial"?<option value="text">Texto do depoimento</option>:<option value="link">Link</option>}
        {draft.kind==="image"?<option value="upload">Enviar imagem</option>:null}
      </select></label>
      {draft.sourceType==="link"?<label className="block text-sm">Link HTTP ou HTTPS<Input name="url" type="url" required maxLength={2048} value={draft.url} disabled={locked} onChange={e=>update("url",e.target.value)}/><span className="text-xs text-muted-foreground">Confira se o endereço funciona e se você tem autorização para usá-lo.</span></label>:null}
      {draft.sourceType==="text"?<label className="block text-sm">Depoimento<Textarea name="text" required maxLength={4000} value={draft.text} disabled={locked} onChange={e=>update("text",e.target.value)}/></label>:null}
      {draft.sourceType==="upload"?<label className="block text-sm">Imagem PNG, JPEG ou WebP, até 4 MiB<input type="file" name="file" accept="image/png,image/jpeg,image/webp" required disabled={locked} className="mt-1 min-h-11 w-full text-sm file:mr-3 file:min-h-11 file:rounded-md file:border file:border-border file:bg-background file:px-3" onChange={e=>setFile(e.target.files?.[0]??null)}/></label>:null}
      <label className="block text-sm">Contexto de uso (opcional)<Textarea name="context" maxLength={1000} value={draft.context} disabled={locked} onChange={e=>update("context",e.target.value)}/></label>
      <label className="block text-sm">Autoria ou identificação (opcional)<Input name="author" maxLength={160} value={draft.author} disabled={locked} onChange={e=>update("author",e.target.value)}/></label>
      <label className="block text-sm">Autorização de uso (opcional)<Textarea name="authorization" maxLength={1000} value={draft.authorization} disabled={locked} onChange={e=>update("authorization",e.target.value)}/></label>
    </>}
    <div className="sticky bottom-0 flex flex-wrap gap-2 border-t border-border bg-background py-2">
      <Button type="submit" className="min-h-11" disabled={locked||!dirty}>{locked?"Salvando...":remove?"Confirmar remoção":"Salvar material"}</Button>
      <Button variant="secondary" className="min-h-11" disabled={locked} onClick={()=>{if(remove){setRemove(false);return;}if(dirty){onCancel();return;}setDraft(null);addRef.current?.focus();}}>Cancelar</Button>
    </div>{state.message?<FeedbackMessage tone={state.status==="error"?"error":"success"}>{state.message}</FeedbackMessage>:null}
  </form>;
  return <div className="space-y-3">
    {items.length?<ul className="divide-y divide-border">{items.map(item=><li key={item.id} className="space-y-2 py-3">
      <div className="flex items-start justify-between gap-2"><div className="min-w-0"><h3 className="break-words text-sm font-semibold">{item.name}</h3>
        <p className="text-xs text-muted-foreground">{kindLabels[item.kind]}</p></div>
        {canEdit?<div className="flex shrink-0 flex-wrap gap-1"><Button variant="secondary" className="min-h-11 px-2" aria-label={"Editar "+item.name} onClick={()=>{setDraft(fromItem(item));setRemove(false);setFile(null);}}>Editar</Button>
          <Button variant="secondary" className="min-h-11 px-2" aria-label={"Remover "+item.name} onClick={()=>{setDraft(fromItem(item));setRemove(true);}}>Remover</Button></div>:null}</div>
      {item.context?<p className="whitespace-pre-wrap break-words text-sm">{item.context}</p>:null}
      {item.author?<p className="break-words text-xs">Autoria: {item.author}</p>:null}
      {item.authorization?<p className="whitespace-pre-wrap break-words text-xs">Autorização de uso: {item.authorization}</p>:null}
      {item.source.type==="text"?<blockquote className="whitespace-pre-wrap break-words text-sm">{item.source.text}</blockquote>:item.source.type==="link"?<a href={item.source.url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center break-all text-sm text-brand-700 underline">Abrir {item.name} em nova aba</a>
        :<PrivateImage account={account} sectionKey={definition.key} itemId={item.id} name={item.name}/>}
    </li>)}</ul>:<p className="text-sm text-muted-foreground">Nenhum material salvo nesta seção.</p>}
    {canEdit?<Button ref={addRef} variant="secondary" className="min-h-11" disabled={items.length>=30} onClick={()=>{setDraft(emptyDraft());setRemove(false);setFile(null);}}>Adicionar material</Button>:null}
    {items.length>=30?<p className="text-xs text-muted-foreground">Limite de 30 materiais por seção.</p>:null}
    {state.status==="saved"?<FeedbackMessage tone="success">{state.message}</FeedbackMessage>:null}
  </div>;
}
function PrivateImage({account,sectionKey,itemId,name}:Readonly<{account:string;sectionKey:string;itemId:string;name:string}>) {
  const [url,setUrl]=useState("");const [message,setMessage]=useState("");const [pending,start]=useTransition();
  useEffect(()=>{if(!url)return;const timeout=setTimeout(()=>setUrl(""),55_000);return()=>clearTimeout(timeout);},[url]);
  return <div>{url? <Image unoptimized width={320} height={192} src={url} alt={name} className="max-h-48 max-w-full rounded-md object-contain" onError={()=>{setUrl("");setMessage("A imagem está indisponível agora.");}}/>:null}
    <Button variant="secondary" className="min-h-11" disabled={pending} onClick={()=>start(async()=>{
      setMessage("");try{const result=await openCommunicationImageAction({account,sectionKey,itemId});if(result.ok)setUrl(result.url);else setMessage(result.message);}catch{setMessage("Não foi possível abrir a imagem agora.");}
    })}>{pending?"Abrindo...":url?"Renovar visualização":"Ver imagem"}</Button>{message?<p role="alert" className="text-sm text-state-error">{message}</p>:null}</div>;
}
