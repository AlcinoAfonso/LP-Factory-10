"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { NicheConversation } from "../../_components/NicheConversation";
import { converseBaseNicheAction, type loadBaseNicheConversationAction } from "../../niche-resolution-actions";

export function BaseNicheConversation({
  account, defined, state,
}: {
  account: string;
  defined: boolean;
  state: NonNullable<Awaited<ReturnType<typeof loadBaseNicheConversationAction>>>;
}) {
  const [hiddenDialogue, setHiddenDialogue] = useState<string | null>(null);
  const [opened, setOpened] = useState(Boolean(state.dialogue && !state.dialogue.ended));
  const dialogue = state.dialogue?.id === hiddenDialogue ? null : state.dialogue;
  if (state.blocked && !dialogue) return (
    <p className="text-sm text-muted-foreground">A redefinição está indisponível porque a conta tem um produto cadastrado.</p>
  );

  return (
    <div className="space-y-3">
      {!opened ? <Button variant="secondary" className="min-h-11" type="button" onClick={() => setOpened(true)}>
        {dialogue?.ended ? "Ver conversa de nicho" : defined ? "Redefinir nicho" : "Definir nicho"}
      </Button> : (
        <section aria-label="Conversa sobre o nicho" className="space-y-3 rounded-xl border border-border bg-card p-4 sm:p-6">
          <NicheConversation key={dialogue?.ended ? "ended" : "open"} account={account} dialogueId={dialogue?.id ?? null}
            version={dialogue?.version ?? 0} messages={dialogue?.messages ?? []} retry={dialogue?.retry}
            ended={state.blocked || dialogue?.ended} introductoryMessage="Conte o que seu negócio oferece e para quem."
            label="Sua mensagem" submit={converseBaseNicheAction} />
          {state.blocked ? <p className="text-sm text-muted-foreground">
            A redefinição está indisponível porque a conta tem um produto cadastrado.
          </p> : dialogue?.ended ? (
            <Button variant="secondary" className="min-h-11" type="button" onClick={() => setHiddenDialogue(dialogue.id)}>Redefinir nicho</Button>
          ) : null}
        </section>
      )}
    </div>
  );
}
