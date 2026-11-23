"use client";

import { useActionState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { FeedbackMessage } from "@/components/ui/feedback-message";
import { FormField, FormFieldError, FormFieldHint, FormFieldLabel } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import type { pendingSetupWhatsApp } from "../../../../lib/onboarding/niche-agent/dialogue";
import type { PendingSetupConversation as PendingSetupConversationContract } from "../../../../lib/onboarding/pending-setup/contracts";
import { NicheConversation } from "./NicheConversation";
import {
  completePendingSetupAction,
  conversePendingSetupAction,
  savePendingSetupBusinessDisplayNameAction,
  type PendingSetupActionState,
} from "../pending-setup-actions";

export function PendingSetupConversation({
  accountSubdomain,
  conversation,
  passageEnabled,
  whatsappMode,
}: {
  accountSubdomain: string;
  conversation: Pick<PendingSetupConversationContract,
    "id" | "version" | "businessDisplayName" | "businessNameCandidate" | "attendanceEnabled" | "messages" | "stage" | "dialogueState">;
  passageEnabled: boolean;
  whatsappMode: ReturnType<typeof pendingSetupWhatsApp>;
}) {
  const [completionState, completionAction, isCompletionPending] = useActionState<
    PendingSetupActionState,
    FormData
  >(completePendingSetupAction, { ok: true });
  const [nameState, nameAction, isNamePending] = useActionState<
    PendingSetupActionState,
    FormData
  >(savePendingSetupBusinessDisplayNameAction, { ok: true });
  const attendanceButtonClass = conversation.attendanceEnabled ? "!bg-brand-700 !text-white hover:!bg-brand-700/90" : "";
  const businessNameRef = useRef<HTMLInputElement | null>(null);
  useEffect(() => {
    if (nameState.fieldError) businessNameRef.current?.focus();
  }, [nameState.fieldError]);

  const dialogue = conversation.dialogueState;
  const retry = dialogue?.requestId && dialogue.requestId !== dialogue.lastRequestId
    ? conversation.messages.find(message => message.id === dialogue.requestId && message.role === "user") : null;
  const ready = conversation.stage === "ready_to_complete" && (!passageEnabled || Boolean(conversation.businessDisplayName));

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
      <section
        className="overflow-hidden rounded-2xl border border-surface-border bg-white shadow-card"
      >
        {conversation.attendanceEnabled ? (
          <div className="space-y-4 px-5 py-5 sm:px-8">
            <h1 className="text-xl font-semibold text-foreground">Conte sobre seu negócio</h1>
            <NicheConversation account={accountSubdomain} dialogueId={conversation.id} version={conversation.version}
              messages={conversation.messages} retry={retry} ended={ready}
              whatsappMode={whatsappMode}
              introductoryMessage={conversation.businessNameCandidate
                ? "Vamos identificar o nicho de " + conversation.businessNameCandidate + ". O que você gostaria de destacar?"
                : "Vamos identificar o nicho do seu negócio. O que você gostaria de destacar sobre o que faz?"}
              label="Sua mensagem" submit={conversePendingSetupAction} />
          </div>
        ) : null}
        {!conversation.attendanceEnabled && passageEnabled && !conversation.businessDisplayName ? (
          <form action={nameAction} className="border-t border-surface-border px-5 py-5 sm:px-8">
            <ConversationHiddenFields
              accountSubdomain={accountSubdomain}
              conversationId={conversation.id}
              version={conversation.version}
            />
            <FeedbackMessage tone="success">
              Entendimento concluído. Informe o nome que seus clientes devem ver.
            </FeedbackMessage>
            {nameState.formError ? (
              <FeedbackMessage tone="error" className="mt-4">{nameState.formError}</FeedbackMessage>
            ) : null}
            <FormField className="mt-5">
              <FormFieldLabel htmlFor="business_display_name">Nome público do negócio ou profissional</FormFieldLabel>
              <Input
                ref={businessNameRef}
                id="business_display_name"
                name="business_display_name"
                maxLength={120}
                autoComplete="organization"
                required
                disabled={isNamePending}
                aria-invalid={Boolean(nameState.fieldError)}
                aria-describedby={nameState.fieldError ? "business-name-error" : "business-name-hint"}
                className="h-11"
              />
              {nameState.fieldError ? (
                <FormFieldError id="business-name-error">{nameState.fieldError}</FormFieldError>
              ) : (
                <FormFieldHint id="business-name-hint">Use o nome pelo qual você quer ser conhecido pelos clientes.</FormFieldHint>
              )}
            </FormField>
            <Button type="submit" disabled={isNamePending} className={cn("mt-5 min-h-11", attendanceButtonClass)}>
              {isNamePending ? "Salvando…" : "Salvar e continuar"}
            </Button>
          </form>
        ) : null}

        {ready ? (
          <form action={completionAction} className="border-t border-surface-border px-5 py-5 sm:px-8">
            <ConversationHiddenFields
              accountSubdomain={accountSubdomain}
              conversationId={conversation.id}
              version={conversation.version}
            />
            {!conversation.attendanceEnabled ? <FeedbackMessage tone="success">
              Entendimento concluído. Falta apenas confirmar a passagem para a próxima etapa.
            </FeedbackMessage> : null}
            {completionState.formError ? (
              <FeedbackMessage tone="error" className="mt-4">
                {completionState.formError}
              </FeedbackMessage>
            ) : null}
            <Button type="submit" disabled={isCompletionPending} className={cn("mt-5 min-h-11", attendanceButtonClass)}>
              {isCompletionPending ? "Concluindo…" : conversation.attendanceEnabled ? "Ver página comercial" : "Continuar para a próxima etapa"}
            </Button>
          </form>
        ) : null}
      </section>
    </main>
  );
}

function ConversationHiddenFields({
  accountSubdomain,
  conversationId,
  version,
}: {
  accountSubdomain: string;
  conversationId: string;
  version: number;
}) {
  return (
    <>
      <input type="hidden" name="account_subdomain" value={accountSubdomain} />
      <input type="hidden" name="conversation_id" value={conversationId} />
      <input type="hidden" name="expected_version" value={version} />
    </>
  );
}
