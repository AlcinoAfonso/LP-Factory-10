"use client";
import styles from "../CommunicationBase.module.css";

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { FeedbackMessage } from "@/components/ui/feedback-message";
import type { CommunicationBase } from "../../../../../lib/communication-base/contracts";
import { type CommunicationSectionDefinition } from "../../../../../lib/communication-base/registry";
import { SectionGuidance } from "./SectionGuidance";
import { getSectionGuidance } from "../../../../../lib/communication-base/section-guidance";
import { supportsCommunicationTextFormatting } from "../../../../../lib/communication-base/text-formatting";
import { hasSectionContent } from "./section-edit-state";

export type SectionDetailControls = Readonly<{
  detailOpen: boolean;
  resetRevision: number;
  onEditorStateChange: (dirty: boolean, saving: boolean) => void;
  onCancel: () => void;
  onSaved: () => void;
}>;
type DetailRenderer = (definition: CommunicationSectionDefinition, controls: SectionDetailControls) => ReactNode;

export function CommunicationSectionCollection({ definitions, base, suggestedKeys = [], pilotKeys = [], renderDetail, showGuidance = false, hideEditorClose = false }: Readonly<{
  definitions: readonly CommunicationSectionDefinition[];
  base: CommunicationBase;
  suggestedKeys?: readonly string[];
  pilotKeys?: readonly string[];
  showGuidance?: boolean;
  hideEditorClose?: boolean;
  renderDetail: DetailRenderer;
}>) {
  return <table className="w-full table-fixed text-left text-sm">
    <caption className="sr-only">Seções da {definitions[0]?.group ?? "Base de Comunicação"}</caption>
    <thead className="sr-only border-b border-border text-xs text-muted-foreground sm:not-sr-only"><tr>
      <th scope="col" className="py-2 pr-3 font-medium">Seção</th>
      <th scope="col" className="w-44 py-2 font-medium sm:w-48">Estado</th>
    </tr></thead>
    <tbody className="divide-y divide-border">{definitions.map((definition) => <SectionRow key={definition.key}
      definition={definition} hasContent={hasSectionContent(base.sections[definition.key]?.value) || Boolean(base.sections[definition.key]?.facts?.length)}
      hasSuggestion={suggestedKeys.includes(definition.key)} hasPilot={pilotKeys.includes(definition.key)} renderDetail={renderDetail}
      showGuidance={showGuidance}
      showCloseButton={!hideEditorClose || (definition.key !== "business_name" && !supportsCommunicationTextFormatting(definition))} />)}</tbody>
  </table>;
}

function SectionRow({ definition, hasContent, hasSuggestion, hasPilot, renderDetail, showGuidance, showCloseButton }: Readonly<{
  definition: CommunicationSectionDefinition; hasContent: boolean; hasSuggestion: boolean; hasPilot: boolean; renderDetail: DetailRenderer;
  showGuidance: boolean; showCloseButton: boolean;
}>) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const discardRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const historyEntryRef = useRef(false);
  const editorStateRef = useRef({ dirty: false, saving: false });
  const closeRequestRef = useRef<() => void>(() => undefined);
  const [resetRevision, setResetRevision] = useState(0);
  const [detailOpen, setDetailOpen] = useState(false);
  const [closingMessage, setClosingMessage] = useState("");
  const [guidanceOpen, setGuidanceOpen] = useState(false);
  const guidanceVisible = guidanceOpen;
  const guidanceId = `section-guidance-${definition.key}`;
  const hasGuidance = showGuidance && Boolean(getSectionGuidance(definition.key));
  const sectionGuidance = hasGuidance ? <SectionGuidance sectionKey={definition.key} id={guidanceId} open={guidanceVisible} showDescription={false} /> : null;
  const titleId = `section-detail-${definition.key}`;
  const discardTitleId = `section-discard-${definition.key}`;

  function closeDetail() {
    discardRef.current?.close();
    dialogRef.current?.close();
    editorStateRef.current = { dirty: false, saving: false };
    setDetailOpen(false);
    setResetRevision((revision) => revision + 1);
    setClosingMessage("");
    setGuidanceOpen(false);

    if (historyEntryRef.current) { historyEntryRef.current = false; window.history.back(); }
    triggerRef.current?.focus({ preventScroll: true });
  }
  function requestClose() {
    if (editorStateRef.current.saving) setClosingMessage("Aguarde o salvamento terminar antes de fechar esta seção.");
    else if (editorStateRef.current.dirty) { if (!discardRef.current?.open) discardRef.current?.showModal(); }
    else closeDetail();
  }
  function closeWithEscape() {
    if (guidanceVisible) setGuidanceOpen(false);
    else requestClose();
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
    <th scope="row" className="py-1 font-normal leading-5 sm:pr-3">
      <button ref={triggerRef} type="button" className="flex min-h-11 w-full flex-col justify-center py-1 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
        onClick={() => {
          window.history.pushState({ ...window.history.state }, "", window.location.href); historyEntryRef.current = true;
          const focusSelector = showCloseButton ? "button[data-section-close],input:not([type=hidden]),textarea" : "header h2";
          dialogRef.current?.showModal();
          dialogRef.current?.querySelector<HTMLElement>(focusSelector)?.focus({ preventScroll: true });
          setDetailOpen(true);
        }}><span className="break-words font-medium text-brand-700 hover:underline dark:text-primary">{definition.label}</span>
        <span className="text-xs leading-5 text-muted-foreground sm:hidden">{hasSuggestion ? "Sugestão disponível" : hasContent ? "Com conteúdo" : "Ainda não preenchida"}{hasPilot ? <span className="block text-xs text-muted-foreground">Gerado pelo Agente Base</span> : null}</span>
      </button>
      <dialog ref={dialogRef} aria-labelledby={titleId}
        className="m-auto h-[min(42rem,calc(100dvh-1rem))] max-h-[calc(100dvh-1rem)] w-[calc(100dvw-1rem)] max-w-3xl overflow-hidden rounded-xl border border-border bg-background p-0 text-left text-foreground shadow-xl backdrop:bg-black/40 open:flex open:flex-col"
        onKeyDownCapture={event => {
          if (showCloseButton || event.key !== "Escape" || event.nativeEvent.isComposing ||
              !(event.target instanceof HTMLElement) || !event.target.isContentEditable) return;
          event.preventDefault();
          event.stopPropagation();
          closeWithEscape();
        }}
        onCancel={(event) => {
          event.preventDefault();
          closeWithEscape();
        }}
        onClick={(event) => {
          if (event.target !== event.currentTarget) return;
          const rect = event.currentTarget.getBoundingClientRect();
          if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) requestClose();
        }}>
        <header className="shrink-0 border-b border-border bg-background px-3 py-2 sm:px-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex min-w-0 items-start gap-1">
              <h2 id={titleId} tabIndex={showCloseButton ? undefined : -1} className="min-w-0 py-2 text-base font-semibold leading-6 [overflow-wrap:anywhere] sm:text-lg">{definition.label}</h2>
              {hasGuidance ? <Button type="button" variant="secondary" aria-label={`Exemplos: ${definition.label}`} title="Exemplos de preenchimento"
                aria-expanded={guidanceVisible} aria-controls={guidanceId} className="h-11 w-11 shrink-0 !p-0 !text-brand-700 dark:!text-primary"
                onClick={() => { if (!guidanceOpen) bodyRef.current?.scrollTo({ top: 0 }); setGuidanceOpen(!guidanceOpen);  }}>
                <svg aria-hidden="true" viewBox="0 0 24 24" className="h-7 w-7 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 5c-3-2-6-2-9-1v15c3-1 6-1 9 1 3-2 6-2 9-1V4c-3-1-6-1-9 1Zm0 0v15M6 8h3m-3 4h3m6-4h3m-3 4h3" />
                </svg>
              </Button> : null}
            </div>
            {showCloseButton && <Button data-section-close variant="secondary" className="min-h-11 shrink-0 px-2 font-normal !text-foreground" aria-label={`Fechar ${definition.label}`} onClick={requestClose}>Fechar</Button>}
          </div>
        </header>
        <div ref={bodyRef} className={`${styles.sectionBody} min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-3 sm:px-4}`}>
          {sectionGuidance}
          {closingMessage ? <FeedbackMessage tone="warning" className="mb-4">{closingMessage}</FeedbackMessage> : null}
          <SectionDetailContent definition={definition} controls={{ detailOpen, resetRevision, onCancel: requestClose, onSaved: closeDetail, onEditorStateChange }} renderDetail={renderDetail} />
        </div>
      </dialog>
      <dialog ref={discardRef} aria-labelledby={discardTitleId}
        className="m-auto w-[calc(100%-2rem)] max-w-md rounded-xl border border-border bg-background p-4 text-left text-foreground shadow-xl backdrop:bg-black/40"
        onCancel={(event) => { event.preventDefault(); discardRef.current?.close(); }}>
        <h2 id={discardTitleId} className="text-lg font-semibold">Descartar alterações?</h2>
        <p className="mt-2 text-sm text-muted-foreground">As alterações não salvas desta seção serão perdidas.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button className="min-h-11 !bg-brand-700 hover:!bg-brand-700/95" onClick={() => discardRef.current?.close()}>Continuar editando</Button>
          <Button variant="secondary" className="min-h-11" onClick={closeDetail}>Descartar alterações</Button>
        </div>
      </dialog>
    </th>
    <td className="hidden py-1 text-xs leading-5 text-muted-foreground sm:table-cell">{hasSuggestion ? "Sugestão disponível" : hasContent ? "Com conteúdo" : "Ainda não preenchida"}{hasPilot ? <span className="block text-xs text-muted-foreground">Gerado pelo Agente Base</span> : null}</td>
  </tr>;
}

function SectionDetailContent({ definition, controls, renderDetail }: Readonly<{
  definition: CommunicationSectionDefinition; controls: SectionDetailControls; renderDetail: DetailRenderer;
}>) {
  return renderDetail(definition, controls);
}
