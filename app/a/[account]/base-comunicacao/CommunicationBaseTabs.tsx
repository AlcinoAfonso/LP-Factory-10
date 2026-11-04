"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
export function CommunicationBaseTabs({stageOne,stageTwo,materials}:Readonly<{stageOne:ReactNode;stageTwo:ReactNode;materials?:ReactNode}>) {
  const [selected,setSelected]=useState(0);
  const tabs=useRef<(HTMLButtonElement|null)[]>([]);
  const labels=materials?["Dados do negócio","Materiais de comunicação","Inteligência e copy"]:["Verdade da empresa","Inteligência de comunicação"];
  const shortLabels=materials?["Negócio","Materiais","Inteligência e copy"]:labels;
  const panels=materials?[stageOne,materials,stageTwo]:[stageOne,stageTwo];
  return <div><CommunicationBaseIntroduction /><div role="tablist" aria-label="Categorias da Base de Comunicação" className="flex flex-wrap border-b border-border">
    {labels.map((label,i)=><button key={label} ref={el=>{tabs.current[i]=el;}} type="button" role="tab" id={"communication-tab-"+i}
      aria-controls={"communication-panel-"+i} aria-label={label} aria-selected={selected===i} tabIndex={selected===i?0:-1}
      onClick={()=>setSelected(i)} onKeyDown={event=>{
        const next=event.key==="Home"?0:event.key==="End"?labels.length-1:event.key==="ArrowRight"?(i+1)%labels.length:event.key==="ArrowLeft"?(i+labels.length-1)%labels.length:null;
        if(next!==null){event.preventDefault();setSelected(next);tabs.current[next]?.focus();}
      }}
      className={"min-h-11 min-w-0 border-b-2 px-2 py-2 text-center text-sm font-medium leading-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset sm:px-4 "+(selected===i?"border-brand-700 text-brand-700 dark:border-primary dark:text-primary":"border-transparent text-muted-foreground hover:text-foreground")}><span className="sm:hidden">{shortLabels[i]}</span><span className="hidden sm:inline">{label}</span></button>)}
  </div>{panels.map((panel,i)=><div key={i} id={"communication-panel-"+i} role="tabpanel" aria-labelledby={"communication-tab-"+i}
    tabIndex={0} hidden={selected!==i} className="pt-3">{materials ? <p className="mb-2 text-sm font-medium sm:hidden">{labels[i]}</p> : null}{panel}</div>)}</div>;
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
    <Button ref={trigger} type="button" variant="secondary" className="mb-2 min-h-11 border border-border px-3 text-sm !text-foreground" onClick={() => dialog.current?.showModal()}>Como funciona</Button>
    <dialog ref={dialog} aria-labelledby="communication-introduction-title" onCancel={(event) => { event.preventDefault(); dismiss(); }}
      className="m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-3xl overflow-y-auto rounded-xl border border-border bg-background p-5 text-foreground shadow-xl backdrop:bg-black/40 sm:p-8">
      <p className="mb-4 text-base font-bold text-brand-700 dark:text-primary">LP Factory</p>
      <div className="grid gap-4 sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] sm:gap-x-6">
        <h2 id="communication-introduction-title" className="text-xl font-semibold leading-tight sm:col-span-2 sm:mb-3 sm:text-2xl">Sua comunicação começa aqui</h2>
        <p className="text-sm leading-6 text-muted-foreground sm:col-start-2 sm:row-start-2">A Base de Comunicação reúne as informações, os materiais e os diferenciais do seu negócio para orientar uma comunicação mais clara e consistente.</p>
        <div className="flex items-center justify-center sm:col-start-1 sm:row-start-2 sm:row-span-2 sm:border-r sm:border-border sm:pr-6">
          <svg viewBox="0 0 240 160" aria-hidden="true" className="h-36 w-60 max-w-full text-primary" fill="none">
            <circle cx="114" cy="83" r="64" fill="currentColor" opacity=".07" />
            <g stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round">
              <rect x="20" y="65" width="45" height="65" rx="4" transform="rotate(-14 20 65)" className="fill-background" />
              <path d="m32 81 22-5m-19 16 22-5m-19 16 15-4" opacity=".35" />
              <rect x="46" y="37" width="46" height="65" rx="4" transform="rotate(-8 46 37)" className="fill-background" />
              <path d="m58 53 22-3m-20 14 22-3m-21 14 17-2m-16 13 22-3" opacity=".35" />
              <rect x="142" y="55" width="80" height="75" rx="6" className="fill-background" />
              <path d="M148 55h68a6 6 0 0 1 6 6v8h-80v-8a6 6 0 0 1 6-6Z" fill="currentColor" />
              <path d="M154 107h54m-54 10h34m-2-37h23m-23 10h18" opacity=".3" strokeWidth="3" strokeLinecap="round" />
              <path d="M152 79h26v20h-26Z" fill="currentColor" opacity=".1" stroke="none" />
              <path d="m152 99 9-12 6 7 5-5 6 10" fill="currentColor" opacity=".35" stroke="none" />
              <path d="M95 108c12-18 22-18 39-18m-9-8 9 8-9 8m69-56-1-11m12 14 5-10m4 17 8-7" strokeWidth="3" strokeLinecap="round" />
            </g>
            <g className="fill-background"><circle cx="149" cy="62" r="1.5" /><circle cx="155" cy="62" r="1.5" /><circle cx="161" cy="62" r="1.5" /></g>
          </svg>
        </div>
        <p className="text-sm leading-6 text-muted-foreground sm:col-start-2 sm:row-start-3">Comece com o que já tem. Você pode preencher aos poucos, revisar e complementar quando quiser. Cada seção é salva por você.</p>
      </div>
      <Button type="button" className="mt-6 min-h-11 w-full !bg-brand-700 !text-surface-base hover:!bg-brand-700/95 sm:mx-auto sm:flex sm:w-56" onClick={dismiss}>Entendi</Button>
    </dialog>
  </>;
}
