"use client";
import { useActionState, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FeedbackMessage } from "@/components/ui/feedback-message";
import { COMMUNICATION_CATEGORIES,communicationCategoryLabels,type CommunicationCategory,type CommunicationCatalogSection } from "../../../../lib/communication-base/catalog";
import { saveCatalogSectionAction,type CatalogActionState } from "./actions";
const initial:CatalogActionState={status:"idle",message:""};
export function CommunicationCatalogEditor({sections}:Readonly<{sections:readonly CommunicationCatalogSection[]}>) {
  const [category,setCategory]=useState<CommunicationCategory>("business");
  const [selection,setSelection]=useState<CommunicationCatalogSection|null|undefined>(undefined);
  const [label,setLabel]=useState("");const [position,setPosition]=useState(1);
  const [state,action,pending]=useActionState(saveCatalogSectionAction,initial);
  const [submitted,setSubmitted]=useState(false);
  const [submittedSections,setSubmittedSections]=useState<readonly CommunicationCatalogSection[]|null>(null);
  const [hiddenState,setHiddenState]=useState(initial);
  const dialog=useRef<HTMLDialogElement>(null);const discard=useRef<HTMLDialogElement>(null);
  const trigger=useRef<HTMLElement|null>(null);const historyEntry=useRef(false);
  const closeRef=useRef<()=>void>(()=>undefined);
  const router=useRouter();const priorSections=useRef(sections);
  const current=sections.filter(s=>s.category===category);
  const dirty=selection!==undefined&&(label!==(selection?.label??"")||position!==(selection?.position??current.length+1));
  const locked=pending||(submitted&&state.status==="saved"&&submittedSections===sections);
  function close(){dialog.current?.close();discard.current?.close();setSelection(undefined);setSubmitted(false);
    if(historyEntry.current){historyEntry.current=false;window.history.back();}trigger.current?.focus();}
  function requestClose(){if(locked)return;if(dirty)discard.current?.showModal();else close();}
  useLayoutEffect(()=>{closeRef.current=requestClose;});
  function open(section:CommunicationCatalogSection|null,element:HTMLElement){
    trigger.current=element;setSelection(section);setLabel(section?.label??"");setPosition(section?.position??current.length+1);
    setHiddenState(state);setSubmitted(false);window.history.pushState({...window.history.state},"",window.location.href);historyEntry.current=true;
    dialog.current?.showModal();dialog.current?.querySelector<HTMLInputElement>("input:not([type=hidden])")?.focus();
  }
  useEffect(()=>{
    if(state.status==="saved"&&submitted)router.refresh();
  },[state,submitted,router]);
  useEffect(()=>{
    if(priorSections.current!==sections&&submitted&&state.status==="saved"){close();}priorSections.current=sections;
  });
  useEffect(()=>{
    function beforeUnload(e:BeforeUnloadEvent){if(dialog.current?.open&&(dirty||locked)){e.preventDefault();e.returnValue="";}}
    function back(){if(dialog.current?.open){window.history.pushState({...window.history.state},"",window.location.href);historyEntry.current=true;closeRef.current();}}
    window.addEventListener("beforeunload",beforeUnload);window.addEventListener("popstate",back);
    return()=>{window.removeEventListener("beforeunload",beforeUnload);window.removeEventListener("popstate",back);};
  },[dirty,locked]);
  const tabs=useRef<(HTMLButtonElement|null)[]>([]);
  return <div className="space-y-3">
    <div role="tablist" aria-label="Categorias de seções" className="grid grid-cols-3 border-b border-border">
      {COMMUNICATION_CATEGORIES.map((key,i)=><button key={key} ref={el=>{tabs.current[i]=el;}} type="button" role="tab" id={"catalog-tab-"+key}
        aria-controls="catalog-panel" aria-selected={category===key} tabIndex={category===key?0:-1}
        className={"min-h-11 min-w-0 border-b-2 px-2 py-2 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700 "+(category===key?"border-brand-700 text-brand-700":"border-transparent text-muted-foreground")}
        onClick={()=>setCategory(key)} onKeyDown={e=>{
          const next=e.key==="Home"?0:e.key==="End"?2:e.key==="ArrowRight"?(i+1)%3:e.key==="ArrowLeft"?(i+2)%3:null;
          if(next!==null){e.preventDefault();setCategory(COMMUNICATION_CATEGORIES[next]);tabs.current[next]?.focus();}
        }}>{communicationCategoryLabels[key]}</button>)}
    </div>
    <div role="tabpanel" id="catalog-panel" aria-labelledby={"catalog-tab-"+category} className="space-y-3">
      <Button variant="secondary" className="min-h-11" disabled={sections.length>=150} onClick={e=>open(null,e.currentTarget)}>Adicionar seção</Button>
      <table className="w-full table-fixed text-left text-sm"><caption className="sr-only">{communicationCategoryLabels[category]}</caption>
        <thead className="border-b border-border text-xs text-muted-foreground"><tr><th scope="col" className="py-2 pr-2">Seção</th><th scope="col" className="w-16 py-2">Posição</th><th scope="col" className="w-20 py-2 text-right">Ação</th></tr></thead>
        <tbody className="divide-y divide-border">{current.map(s=><tr key={s.id}><th scope="row" className="break-words py-2 pr-2 font-medium">{s.label}</th><td>{s.position}</td><td className="text-right"><Button variant="secondary" className="min-h-11 px-3" aria-label={"Editar "+s.label} onClick={e=>open(s,e.currentTarget)}>Abrir</Button></td></tr>)}</tbody>
      </table>
    </div>
    {state.status==="saved"&&selection===undefined?<FeedbackMessage tone="success">{state.message}</FeedbackMessage>:null}
    <dialog ref={dialog} aria-labelledby="catalog-editor-title" className="m-auto max-h-[calc(100dvh-1rem)] w-[calc(100%-1rem)] max-w-xl overflow-y-auto rounded-xl border border-border bg-background p-4 text-foreground shadow-xl backdrop:bg-black/40"
      onCancel={e=>{e.preventDefault();requestClose();}} onClick={e=>{
        if(e.target!==e.currentTarget)return;const r=e.currentTarget.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)requestClose();
      }}>
      <div className="flex items-center justify-between gap-2"><h2 id="catalog-editor-title" className="text-lg font-semibold">{selection?"Editar seção":"Adicionar seção"}</h2><Button variant="secondary" className="min-h-11" disabled={locked} onClick={requestClose}>Fechar</Button></div>
      <p className="mt-2 text-sm text-muted-foreground">{communicationCategoryLabels[category]}</p>
      <form action={action} onSubmit={e=>{if(locked||!dirty){e.preventDefault();return;}setSubmittedSections(sections);setSubmitted(true);}} className="mt-3 space-y-3">
        <input type="hidden" name="id" value={selection?.id??""}/><input type="hidden" name="category" value={category}/><input type="hidden" name="updated_at" value={selection?.updatedAt??""}/>
        <label className="block text-sm">Título<Input name="label" required maxLength={120} value={label} disabled={locked} onChange={e=>setLabel(e.target.value)}/></label>
        <label className="block text-sm">Posição<select name="position" value={position} disabled={locked} onChange={e=>setPosition(Number(e.target.value))} className="mt-1 min-h-11 w-full rounded-md border border-border bg-background px-3">
          {Array.from({length:current.length+(selection?0:1)},(_,i)=><option key={i} value={i+1}>{i+1}</option>)}
        </select></label>
        <div className="flex flex-wrap gap-2"><Button type="submit" className="min-h-11" disabled={locked||!dirty||!label.trim()}>{locked?"Salvando...":"Salvar"}</Button><Button variant="secondary" className="min-h-11" disabled={locked} onClick={requestClose}>Cancelar</Button></div>
        {state!==hiddenState&&state.message?<FeedbackMessage tone={state.status==="error"?"error":"success"}>{state.message}</FeedbackMessage>:null}
      </form>
    </dialog>
    <dialog ref={discard} aria-labelledby="catalog-discard-title" className="m-auto w-[calc(100%-2rem)] max-w-md rounded-xl border border-border bg-background p-4 text-foreground shadow-xl backdrop:bg-black/40" onCancel={e=>{e.preventDefault();discard.current?.close();}}>
      <h2 id="catalog-discard-title" className="text-lg font-semibold">Descartar alterações?</h2><p className="mt-2 text-sm">As alterações não salvas desta seção serão perdidas.</p>
      <div className="mt-3 flex flex-wrap gap-2"><Button className="min-h-11" onClick={()=>discard.current?.close()}>Continuar editando</Button><Button variant="secondary" className="min-h-11" onClick={close}>Descartar alterações</Button></div>
    </dialog>
  </div>;
}
