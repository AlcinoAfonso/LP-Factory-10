"use client";

import { useActionState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { FeedbackMessage } from "@/components/ui/feedback-message";
import { FormField, FormFieldError, FormFieldHint, FormFieldLabel } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import type { PendingSetupConversation as PendingSetupConversationContract } from "../../../../lib/onboarding/pending-setup";
import {
  savePendingSetupPreferredNameAction,
  type PendingSetupActionState,
} from "../pending-setup-actions";

export function PendingSetupConversation({
  accountSubdomain,
  conversation,
}: {
  accountSubdomain: string;
  conversation: PendingSetupConversationContract | null;
}) {
  const [state, action, isPending] = useActionState<
    PendingSetupActionState,
    FormData
  >(savePendingSetupPreferredNameAction, { ok: true });
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (state.fieldError) inputRef.current?.focus();
  }, [state.fieldError]);

  if (!conversation) {
    return (
      <main className="mx-auto flex min-h-[60vh] max-w-3xl items-center px-4 py-10 sm:px-6">
        <FeedbackMessage tone="error">
          Não foi possível carregar sua conversa agora. Atualize a página para tentar novamente.
        </FeedbackMessage>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
      <section
        aria-labelledby="pending-setup-title"
        className="overflow-hidden rounded-2xl border border-surface-border bg-white shadow-card"
      >
        <header className="border-b border-surface-border bg-surface-muted px-5 py-5 sm:px-8">
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-brand-700">
            Primeiros passos
          </p>
          <h1
            id="pending-setup-title"
            className="mt-2 text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl"
          >
            Vamos entender seu negócio
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-graytech-600">
            Uma pergunta por vez. Você poderá revisar o entendimento antes de continuar.
          </p>
        </header>

        <div className="space-y-4 px-5 py-6 sm:px-8" aria-live="polite">
          {conversation.messages.map((message) => (
            <div
              key={message.id}
              className={message.role === "user" ? "flex justify-end" : "flex justify-start"}
            >
              <div
                className={
                  message.role === "user"
                    ? "max-w-[88%] rounded-2xl rounded-br-md bg-brand-700 px-4 py-3 text-sm leading-6 text-white sm:max-w-[75%]"
                    : "max-w-[88%] rounded-2xl rounded-bl-md bg-surface-muted px-4 py-3 text-sm leading-6 text-ink-900 sm:max-w-[75%]"
                }
              >
                {message.content}
              </div>
            </div>
          ))}
        </div>

        {conversation.stage === "identity" ? (
          <form action={action} className="border-t border-surface-border px-5 py-5 sm:px-8">
            <input type="hidden" name="account_subdomain" value={accountSubdomain} />
            <input type="hidden" name="conversation_id" value={conversation.id} />
            <input type="hidden" name="expected_version" value={conversation.version} />

            {state.formError ? (
              <FeedbackMessage tone="error" className="mb-4">
                {state.formError}
              </FeedbackMessage>
            ) : null}

            <FormField>
              <FormFieldLabel htmlFor="preferred_name">Como prefere ser chamado?</FormFieldLabel>
              <Input
                ref={inputRef}
                id="preferred_name"
                name="preferred_name"
                maxLength={80}
                autoComplete="name"
                disabled={isPending}
                aria-invalid={Boolean(state.fieldError)}
                aria-describedby={state.fieldError ? "preferred-name-error" : "preferred-name-hint"}
                className="h-11"
              />
              {state.fieldError ? (
                <FormFieldError id="preferred-name-error">{state.fieldError}</FormFieldError>
              ) : (
                <FormFieldHint id="preferred-name-hint">
                  Pode ser seu primeiro nome ou a forma como gosta de ser chamado.
                </FormFieldHint>
              )}
            </FormField>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button type="submit" name="intent" value="save" disabled={isPending} className="min-h-11">
                {isPending ? "Continuando…" : "Continuar"}
              </Button>
              <Button
                type="submit"
                name="intent"
                value="skip"
                disabled={isPending}
                className="min-h-11 bg-transparent text-ink-700 shadow-none hover:bg-surface-muted"
              >
                Prefiro não informar
              </Button>
            </div>
          </form>
        ) : null}
      </section>
    </main>
  );
}
