"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { NicheConversation } from "./NicheConversation";
import { converseBaseNicheAction, converseHomeNicheAction, type loadBaseNicheConversationAction } from "../niche-resolution-actions";

const blockedMessage = "A redefinição está indisponível porque a conta tem um produto cadastrado.";

export function AccountNicheConversation({ account, state, home }: {
  account: string;
  state: NonNullable<Awaited<ReturnType<typeof loadBaseNicheConversationAction>>>;
  home?: boolean;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [hiddenDialogue, setHiddenDialogue] = useState<string | null>(null);
  const [opened, setOpened] = useState(Boolean(home && state.dialogue && !state.dialogue.ended));
  const [focus, setFocus] = useState(false);
  const dialogue = state.dialogue?.id === hiddenDialogue ? null : state.dialogue;
  if (state.blocked && !dialogue) return <p className="text-sm text-muted-foreground">{blockedMessage}</p>;

  const startNewFromBase = !home && Boolean(dialogue?.ended);
  const baseLabel = state.blocked ? "Consultar conversa de nicho" : state.hasNiche ? "Redefinir nicho" : "Definir nicho";
  const label = !home ? baseLabel : dialogue?.ended ? "Ver conversa de nicho" : state.confirmed ? "Redefinir nicho"
    : state.hasNiche && home ? "Confirmar nicho" : "Definir nicho";
  const greeting = state.interlocutorName ? `Olá, ${state.interlocutorName}. ` : "";
  const introduction = state.existingOnly
    ? greeting + "Vamos conferir o nicho cadastrado. Com um produto na conta, só é possível confirmar a descrição atual."
    : state.confirmed
      ? greeting + (state.nicheName ? `Seu nicho atual é ${state.nicheName}. ` : "") + "O que você gostaria de corrigir ou atualizar?"
      : greeting + "O que você gostaria de destacar sobre seu negócio para definirmos o nicho?";

  function openConversation() {
    if (startNewFromBase && dialogue && !state.blocked) setHiddenDialogue(dialogue.id);
    if (!home && !dialogRef.current?.open) dialogRef.current?.showModal();
    setFocus(true);
    setOpened(true);
  }

  function closeConversation() {
    dialogRef.current?.close();
    setFocus(false);
    triggerRef.current?.focus();
  }

  const conversation = (
    <section aria-label="Conversa sobre o nicho" className="space-y-3 rounded-xl border border-border bg-card p-4 sm:p-6">
      <NicheConversation key={dialogue?.ended ? "ended" : "open"} account={account} dialogueId={dialogue?.id ?? null}
        version={dialogue?.version ?? 0} messages={dialogue?.messages ?? []} retry={dialogue?.retry}
        ended={state.blocked || dialogue?.ended} introductoryMessage={introduction} focusOnOpen={focus}
        label="Sua mensagem" submit={home ? converseHomeNicheAction : converseBaseNicheAction} />
      {state.blocked ? <p className="text-sm text-muted-foreground">{blockedMessage}</p> : dialogue?.ended ? (
        <Button variant="secondary" className="min-h-11" type="button" onClick={() => {
          setFocus(true);
          setHiddenDialogue(dialogue.id);
        }}>Redefinir nicho</Button>
      ) : null}
    </section>
  );

  if (home) return (
    <div className="space-y-3">
      {!opened ? <Button variant="secondary" className="min-h-11" type="button" onClick={openConversation}>
        {label}
      </Button> : conversation}
    </div>
  );

  return (
    <div className="space-y-3">
      <Button ref={triggerRef} variant="secondary" className="min-h-11 !items-start !px-0 !py-0 text-left"
        type="button" onClick={openConversation}>{label}</Button>
      {state.blocked ? <p className="text-sm text-muted-foreground">{blockedMessage}</p> : null}
      <dialog ref={dialogRef} aria-labelledby="niche-dialog-title" onCancel={event => {
        event.preventDefault();
        closeConversation();
      }} onClick={event => { if (event.target === event.currentTarget) closeConversation(); }}
        className="fixed inset-0 m-auto max-h-[calc(100dvh-1rem)] w-[calc(100%-2rem)] max-w-2xl overflow-hidden rounded-xl border border-border bg-card p-0 text-foreground shadow-xl backdrop:bg-black/40 open:flex open:flex-col">
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-4 py-3 sm:px-6">
          <h2 id="niche-dialog-title" className="text-base font-semibold">{label}</h2>
          <Button variant="secondary" className="min-h-11 shrink-0" type="button" onClick={closeConversation}>
            Fechar
          </Button>
        </header>
        <div className="min-h-0 overflow-y-auto p-3 sm:p-6">{opened ? conversation : null}</div>
      </dialog>
    </div>
  );
}
