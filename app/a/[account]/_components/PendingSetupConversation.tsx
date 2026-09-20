"use client";

import { useActionState, useEffect, useRef } from "react";

import { Button } from "@/components/ui/button";
import { FormField, FormFieldError, FormFieldLabel } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import {
  savePreferredNameAction,
  type PreferredNameState,
} from "../pending-setup-actions";

export function PendingSetupConversation({
  accountSubdomain,
  preferredName,
}: {
  accountSubdomain: string;
  preferredName: string | null;
}) {
  const initialState: PreferredNameState = preferredName
    ? { ok: true, preferredName }
    : { ok: false };
  const [state, action, pending] = useActionState(
    savePreferredNameAction,
    initialState,
  );
  const inputRef = useRef<HTMLInputElement>(null);
  const resolvedName = state.preferredName ?? preferredName;

  useEffect(() => {
    if (state.error) inputRef.current?.focus();
  }, [state.error]);

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-3xl items-center px-4 py-10 sm:px-6">
      <section
        aria-labelledby="pending-setup-title"
        className="w-full rounded-2xl border border-surface-border bg-white p-6 shadow-card sm:p-10"
      >
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-brand-700">
          Boas-vindas
        </p>
        <h1
          className="mt-3 text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl"
          id="pending-setup-title"
        >
          {resolvedName ? `Olá, ${resolvedName}.` : "Como você prefere ser chamado?"}
        </h1>
        <p className="mt-3 text-sm leading-6 text-graytech-600 sm:text-base">
          {resolvedName
            ? "Seu nome está salvo. Agora podemos entender seu negócio com uma pergunta de cada vez."
            : "Vamos começar por você. O nome fica ligado à sua identidade e pode ser reutilizado nas próximas conversas."}
        </p>

        {resolvedName ? (
          <div
            aria-live="polite"
            className="mt-6 rounded-xl border border-brand-200 bg-brand-50 p-4 text-sm text-brand-900"
          >
            A conversa sobre o negócio será liberada na próxima etapa desta implementação.
          </div>
        ) : (
          <form action={action} className="mt-6 space-y-5">
            <input name="account_subdomain" type="hidden" value={accountSubdomain} />
            <FormField>
              <FormFieldLabel htmlFor="preferred_name">Seu nome</FormFieldLabel>
              <Input
                aria-describedby={state.error ? "preferred-name-error" : undefined}
                aria-invalid={Boolean(state.error)}
                autoComplete="name"
                id="preferred_name"
                maxLength={80}
                name="preferred_name"
                ref={inputRef}
                required
              />
            </FormField>
            {state.error ? (
              <FormFieldError id="preferred-name-error">
                {state.error}
              </FormFieldError>
            ) : null}
            <Button disabled={pending} type="submit">
              {pending ? "Salvando..." : "Continuar"}
            </Button>
          </form>
        )}
      </section>
    </main>
  );
}
