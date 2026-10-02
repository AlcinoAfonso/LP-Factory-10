"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { FeedbackMessage } from "@/components/ui/feedback-message";
import type { CommunicationBase } from "../../../../../lib/communication-base/contracts";
import type { CommunicationSectionDefinition } from "../../../../../lib/communication-base/registry";
import { hasSectionContent } from "./section-edit-state";

export type SectionDetailControls = Readonly<{
  resetRevision: number;
  onEditorStateChange: (dirty: boolean, saving: boolean) => void;
  onCancel: () => void;
}>;
type DetailRenderer = (definition: CommunicationSectionDefinition, controls: SectionDetailControls) => ReactNode;

export function CommunicationSectionCollection({ definitions, base, suggestedKeys = [], renderDetail }: Readonly<{
  definitions: readonly CommunicationSectionDefinition[];
  base: CommunicationBase;
  suggestedKeys?: readonly string[];
  renderDetail: DetailRenderer;
}>) {
  return <table className="w-full table-fixed text-left text-sm">
    <caption className="sr-only">Seções da {definitions[0]?.stage === 1 ? "Verdade da empresa" : "Inteligência de comunicação"}</caption>
    <thead className="border-b border-border text-xs text-muted-foreground"><tr>
      <th scope="col" className="w-[48%] py-2 pr-2 font-medium sm:w-auto">Seção</th>
      <th scope="col" className="py-2 pr-2 font-medium sm:w-48">Estado</th>
      <th scope="col" className="w-20 py-2 text-right font-medium sm:w-24">Ação</th>
    </tr></thead>
    <tbody className="divide-y divide-border">{definitions.map((definition) => <SectionRow key={definition.key}
      definition={definition} hasContent={hasSectionContent(base.sections[definition.key as keyof typeof base.sections]?.value)}
      hasSuggestion={suggestedKeys.includes(definition.key)} renderDetail={renderDetail} />)}</tbody>
  </table>;
}

function SectionRow({ definition, hasContent, hasSuggestion, renderDetail }: Readonly<{
  definition: CommunicationSectionDefinition; hasContent: boolean; hasSuggestion: boolean; renderDetail: DetailRenderer;
}>) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const discardRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const historyEntryRef = useRef(false);
  const editorStateRef = useRef({ dirty: false, saving: false });
  const closeRequestRef = useRef<() => void>(() => undefined);
  const [resetRevision, setResetRevision] = useState(0);
  const [closingMessage, setClosingMessage] = useState("");
  const titleId = `section-detail-${definition.key}`;
  const discardTitleId = `section-discard-${definition.key}`;

  function closeDetail() {
    discardRef.current?.close();
    dialogRef.current?.close();
    editorStateRef.current = { dirty: false, saving: false };
    setResetRevision((revision) => revision + 1);
    setClosingMessage("");
    if (historyEntryRef.current) { historyEntryRef.current = false; window.history.back(); }
    triggerRef.current?.focus({ preventScroll: true });
  }
  function requestClose() {
    if (editorStateRef.current.saving) setClosingMessage("Aguarde o salvamento terminar antes de fechar esta seção.");
    else if (editorStateRef.current.dirty) { if (!discardRef.current?.open) discardRef.current?.showModal(); }
    else closeDetail();
  }
  useLayoutEffect(() => { closeRequestRef.current = requestClose; });
  const onEditorStateChange = useCallback((dirty: boolean, saving: boolean) => {
    editorStateRef.current = { dirty, saving };
  }, []);
  useEffect(() => {
    function beforeUnload(event: BeforeUnloadEvent) {
      if (dialogRef.current?.open && (editorStateRef.current.dirty || editorStateRef.current.saving)) {
        event.preventDefault(); event.returnValue = "";
      }
    }
    function onBack() {
      if (!dialogRef.current?.open) return;
      // The preceding entry is the same collection, so resolve exit before leaving that context.
      window.history.pushState({ ...window.history.state }, "", window.location.href);
      historyEntryRef.current = true;
      closeRequestRef.current();
    }
    window.addEventListener("beforeunload", beforeUnload);
    window.addEventListener("popstate", onBack);
    return () => { window.removeEventListener("beforeunload", beforeUnload); window.removeEventListener("popstate", onBack); };
  }, []);

  return <tr>
    <th scope="row" className="break-words py-1 pr-3 font-medium leading-5">{definition.label}</th>
    <td className="py-1 pr-2 text-xs leading-5 text-muted-foreground">{hasSuggestion ? "Sugestão disponível" : hasContent ? "Com conteúdo" : "Ainda não preenchida"}</td>
    <td className="py-0 text-right">
      <Button ref={triggerRef} variant="secondary" className="min-h-11 px-3 !text-brand-700" aria-label={`Abrir ${definition.label}`}
        onClick={() => {
          window.history.pushState({ ...window.history.state }, "", window.location.href); historyEntryRef.current = true;
          dialogRef.current?.showModal(); dialogRef.current?.querySelector<HTMLTextAreaElement>("textarea")?.focus({ preventScroll: true });
        }}>Abrir</Button>
      <dialog ref={dialogRef} aria-labelledby={titleId}
        className="m-auto max-h-[calc(100dvh-1rem)] w-[calc(100%-1rem)] max-w-2xl overflow-y-auto overscroll-contain rounded-xl border border-border bg-background p-0 text-left text-foreground shadow-xl backdrop:bg-black/40"
        onCancel={(event) => { event.preventDefault(); requestClose(); }}
        onClick={(event) => {
          if (event.target !== event.currentTarget) return;
          const rect = event.currentTarget.getBoundingClientRect();
          if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) requestClose();
        }}>
        <header className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-border bg-background px-4 py-3 sm:px-6">
          <div><p className="text-xs text-muted-foreground">{definition.stage === 1 ? "Verdade da empresa" : "Inteligência de comunicação"}</p>
            <h2 id={titleId} className="mt-1 text-lg font-semibold leading-6">{definition.label}</h2></div>
          <Button variant="secondary" className="min-h-11 shrink-0 px-3" aria-label={`Fechar ${definition.label}`} onClick={requestClose}>Fechar</Button>
        </header>
        <div className="px-4 py-5 sm:px-6">
          {closingMessage ? <FeedbackMessage tone="warning" className="mb-4">{closingMessage}</FeedbackMessage> : null}
          <SectionDetailContent definition={definition} controls={{ resetRevision, onCancel: requestClose, onEditorStateChange }} renderDetail={renderDetail} />
        </div>
      </dialog>
      <dialog ref={discardRef} aria-labelledby={discardTitleId}
        className="m-auto w-[calc(100%-2rem)] max-w-md rounded-xl border border-border bg-background p-5 text-left text-foreground shadow-xl backdrop:bg-black/40"
        onCancel={(event) => { event.preventDefault(); discardRef.current?.close(); }}>
        <h2 id={discardTitleId} className="text-lg font-semibold">Descartar alterações?</h2>
        <p className="mt-2 text-sm text-muted-foreground">O texto não salvo desta seção será perdido.</p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Button className="min-h-11 !bg-brand-700 hover:!bg-brand-700/95" onClick={() => discardRef.current?.close()}>Continuar editando</Button>
          <Button variant="secondary" className="min-h-11" onClick={closeDetail}>Descartar alterações</Button>
        </div>
      </dialog>
    </td>
  </tr>;
}

function SectionDetailContent({ definition, controls, renderDetail }: Readonly<{
  definition: CommunicationSectionDefinition; controls: SectionDetailControls; renderDetail: DetailRenderer;
}>) {
  return renderDetail(definition, controls);
}
