"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { NicheConversation } from "./NicheConversation";
import { converseBaseNicheAction, converseHomeNicheAction, type loadBaseNicheConversationAction } from "../niche-resolution-actions";

const blockedMessage = "A redefinição está indisponível porque a conta tem um produto cadastrado.";

export function AccountNicheConversation({ account, state, home }: {
  account: string;
  state: NonNullable<Awaited<ReturnType<typeof loadBaseNicheConversationAction>>>;
  home?: boolean;
}) {
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

  return (
    <div className="space-y-3">
      {!opened ? <><Button variant="secondary" className={home ? "min-h-11" : "min-h-11 !items-start !px-0 !py-0 text-left"} type="button" onClick={() => {
        if (startNewFromBase && dialogue && !state.blocked) setHiddenDialogue(dialogue.id);
        setFocus(true);
        setOpened(true);
      }}>{label}</Button>{state.blocked && !home ? <p className="text-sm text-muted-foreground">{blockedMessage}</p> : null}</> : (
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
      )}
    </div>
  );
}
