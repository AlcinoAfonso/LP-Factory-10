"use client";
import { useRef, useState, type ReactNode } from "react";
export function CommunicationBaseTabs({stageOne,stageTwo,materials}:Readonly<{stageOne:ReactNode;stageTwo:ReactNode;materials?:ReactNode}>) {
  const [selected,setSelected]=useState(0);
  const tabs=useRef<(HTMLButtonElement|null)[]>([]);
  const labels=materials?["Dados do negócio","Materiais de comunicação","Inteligência e copy"]:["Verdade da empresa","Inteligência de comunicação"];
  const panels=materials?[stageOne,materials,stageTwo]:[stageOne,stageTwo];
  return <div><div role="tablist" aria-label="Categorias da Base de Comunicação" className={materials?"grid grid-cols-3 border-b border-border":"grid grid-cols-2 border-b border-border"}>
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
