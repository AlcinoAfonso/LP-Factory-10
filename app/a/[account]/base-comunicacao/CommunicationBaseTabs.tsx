"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
export function CommunicationBaseTabs({stageOne,stageTwo,materials}:Readonly<{stageOne:ReactNode;stageTwo:ReactNode;materials?:ReactNode}>) {
  const [selected,setSelected]=useState(0);
  const tabs=useRef<(HTMLButtonElement|null)[]>([]);
  const labels=materials?["Dados do negócio","Materiais de comunicação","Inteligência e copy"]:["Verdade da empresa","Inteligência de comunicação"];
  const panels=materials?[stageOne,materials,stageTwo]:[stageOne,stageTwo];
  return <div><CommunicationBaseIntroduction /><div role="tablist" aria-label="Categorias da Base de Comunicação" className={materials?"grid grid-cols-3 border-b border-border":"grid grid-cols-2 border-b border-border"}>
    {labels.map((label,i)=><button key={label} ref={el=>{tabs.current[i]=el;}} type="button" role="tab" id={"communication-tab-"+i}
      aria-controls={"communication-panel-"+i} aria-selected={selected===i} tabIndex={selected===i?0:-1}
      onClick={()=>setSelected(i)} onKeyDown={event=>{
        const next=event.key==="Home"?0:event.key==="End"?labels.length-1:event.key==="ArrowRight"?(i+1)%labels.length:event.key==="ArrowLeft"?(i+labels.length-1)%labels.length:null;
        if(next!==null){event.preventDefault();setSelected(next);tabs.current[next]?.focus();}
      }}
      className={"min-h-11 min-w-0 border-b-2 px-2 py-2 text-center text-sm font-semibold leading-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700 focus-visible:ring-inset "+(selected===i?"border-brand-700 text-brand-700":"border-transparent text-muted-foreground hover:text-foreground")}>{label}</button>)}
  </div>{panels.map((panel,i)=><div key={i} id={"communication-panel-"+i} role="tabpanel" aria-labelledby={"communication-tab-"+i}
    tabIndex={0} hidden={selected!==i} className="pt-3">{panel}</div>)}</div>;
}

export function CommunicationBaseIntroduction() {
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const storageKey = "communication-base:introduction-dismissed";
  useEffect(() => {
    try { if (window.localStorage.getItem(storageKey) === "true") return; } catch { /* Keep guidance usable when browser storage is unavailable. */ }
    if (!dialog.current?.open) dialog.current?.showModal();
  }, []);
  function dismiss() {
    try { window.localStorage.setItem(storageKey, "true"); } catch { /* Dismissal still works without storage. */ }
    dialog.current?.close();
    trigger.current?.focus({ preventScroll: true });
  }
  return <>
    <Button ref={trigger} type="button" variant="secondary" className="mb-2 min-h-11 px-3 text-sm" onClick={() => dialog.current?.showModal()}>Como funciona</Button>
    <dialog ref={dialog} aria-labelledby="communication-introduction-title" onCancel={(event) => { event.preventDefault(); dismiss(); }}
      className="m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-md overflow-y-auto rounded-xl border border-border bg-background p-5 text-foreground shadow-xl backdrop:bg-black/40">
      <h2 id="communication-introduction-title" className="text-lg font-semibold">Sua comunicação começa aqui</h2>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">A Base de Comunicação reúne as informações, os materiais e os diferenciais do seu negócio para orientar uma comunicação mais clara e consistente.</p>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">Comece com o que já tem. Você pode preencher aos poucos, revisar e complementar quando quiser. Cada seção é salva por você.</p>
      <Button type="button" className="mt-4 min-h-11" onClick={dismiss}>Entendi</Button>
    </dialog>
  </>;
}
