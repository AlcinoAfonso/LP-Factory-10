"use client";

import { startTransition, useActionState, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { FeedbackMessage } from "@/components/ui/feedback-message";
import { FormField, FormFieldError, FormFieldHint, FormFieldLabel } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  hasPendingSetupTerminalFallback,
  type PendingSetupConversation as PendingSetupConversationContract,
} from "../../../../lib/onboarding/pending-setup";
import {
  completePendingSetupAction,
  continuePendingSetupConversationAction,
  savePendingSetupPreferredNameAction,
  savePendingSetupBusinessDisplayNameAction,
  type PendingSetupActionState,
} from "../pending-setup-actions";

export function PendingSetupConversation({
  accountSubdomain,
  conversation,
  passageEnabled,
}: {
  accountSubdomain: string;
  conversation: PendingSetupConversationContract | null;
  passageEnabled: boolean;
}) {
  const [state, action, isPending] = useActionState<
    PendingSetupActionState,
    FormData
  >(savePendingSetupPreferredNameAction, { ok: true });
  const [turnState, turnAction, isTurnPending] = useActionState<
    PendingSetupActionState,
    FormData
  >(continuePendingSetupConversationAction, { ok: true });
  const [completionState, completionAction, isCompletionPending] = useActionState<
    PendingSetupActionState,
    FormData
  >(completePendingSetupAction, { ok: true });
  const [nameState, nameAction, isNamePending] = useActionState<
    PendingSetupActionState,
    FormData
  >(savePendingSetupBusinessDisplayNameAction, { ok: true });
  const attendanceButtonClass = conversation?.attendanceEnabled ? "!bg-brand-700 !text-white hover:!bg-brand-700/90" : "";
  const needsAttendanceProposal = conversation?.attendanceEnabled && conversation.stage === "niche_confirmation" && !conversation.attendanceProposal;
  const hasPrimaryConflict = Boolean(conversation?.attendanceEnabled && conversation.attendancePrimaryConflictTaxonId);
  const [clarificationText, setClarificationText] = useState("");
  const initializedRef = useRef(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const businessNameRef = useRef<HTMLInputElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const isTerminalFallback = conversation
    ? hasPendingSetupTerminalFallback({
        confirmationKind: conversation.confirmationKind,
        assistantContents: conversation.messages
          .filter((message) => message.role === "assistant")
          .map((message) => message.content),
      })
    : false;

  useEffect(() => {
    if (state.fieldError) inputRef.current?.focus();
  }, [state.fieldError]);

  useEffect(() => {
    if (turnState.fieldError) textareaRef.current?.focus();
  }, [turnState.fieldError]);

  useEffect(() => {
    if (nameState.fieldError) businessNameRef.current?.focus();
  }, [nameState.fieldError]);

  useEffect(() => {
    if (!conversation?.attendanceEnabled || conversation.messages.length || initializedRef.current) return;
    initializedRef.current = true;
    const formData = new FormData();
    formData.set("account_subdomain", accountSubdomain);
    formData.set("conversation_id", conversation.id);
    formData.set("expected_version", String(conversation.version));
    formData.set("intent", conversation.attendanceTurnIntent ? "resume" : "initialize");
    startTransition(() => turnAction(formData));
  }, [accountSubdomain, conversation, turnAction]);

  useEffect(() => {
    if (turnState.ok && !isTurnPending) setClarificationText("");
  }, [turnState.ok, isTurnPending]);

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

        {conversation.attendanceEnabled && !hasPrimaryConflict && (!conversation.messages.length || conversation.attendanceTurnIntent) ? (
          <form action={turnAction} className="border-t border-surface-border px-5 py-5 sm:px-8">
            <ConversationHiddenFields accountSubdomain={accountSubdomain} conversationId={conversation.id} version={conversation.version} />
            <input type="hidden" name="intent" value={conversation.attendanceTurnIntent ? "resume" : "initialize"} />
            {turnState.formError ? <FeedbackMessage tone="error" className="mb-4">{turnState.formError}</FeedbackMessage> : null}
            <p className="mb-4 text-sm text-graytech-600" role="status">
              {isTurnPending ? "Preparando sua resposta…" : conversation.messages.length ? "Sua resposta está preservada." : "Vamos começar seu atendimento."}
            </p>
            <Button type="submit" disabled={isTurnPending} className={cn("min-h-11", attendanceButtonClass)}>
              {isTurnPending ? "Atendendo…" : "Retomar atendimento"}
            </Button>
          </form>
        ) : null}

        {conversation.attendanceEnabled && conversation.attendanceProposal && !hasPrimaryConflict ? (
          <div className="space-y-3 px-5 pb-5 sm:px-8">
            {conversation.attendanceProposal.kind === "operational_fallback" ? (
              <FeedbackMessage tone="warning" className="!text-ink-900">
                Seu negócio foi compreendido. A classificação oficial permanece pendente; você pode confirmar sua descrição para continuar.
              </FeedbackMessage>
            ) : null}
            {conversation.attendanceProposal.sources.length ? (
              <div className="text-sm text-graytech-600">
                <p className="font-medium">Referências da classificação de mercado</p>
                <ul className="mt-2 space-y-1">
                  {conversation.attendanceProposal.sources.map((source) => (
                    <li key={source}><a href={source} target="_blank" rel="noopener noreferrer"
                      className="inline-flex min-h-11 items-center break-all text-brand-700 underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">{new URL(source).hostname}</a></li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        ) : null}

        {hasPrimaryConflict ? (
          <form action={turnAction} className="border-t border-surface-border px-5 py-5 sm:px-8">
            <ConversationHiddenFields accountSubdomain={accountSubdomain} conversationId={conversation.id} version={conversation.version} />
            <FeedbackMessage tone="warning" className="mb-4 !text-ink-900">
              A categoria da conta mudou durante o atendimento. Seu contexto está preservado. A classificação precisa ser reavaliada.
            </FeedbackMessage>
            <p className="mb-4 text-sm text-graytech-600" role="status">
              {isTurnPending ? "Reavaliando…" : "A classificação permanece pendente."}
            </p>
            {turnState.formError ? <FeedbackMessage tone="error" className="mb-4">{turnState.formError}</FeedbackMessage> : null}
            <FormField className="mb-5">
              <FormFieldLabel htmlFor="business_context">Complementar entendimento (opcional)</FormFieldLabel>
              <Textarea ref={textareaRef} id="business_context" name="business_context" maxLength={4000}
                value={clarificationText} onChange={(event) => setClarificationText(event.target.value)}
                disabled={isTurnPending || Boolean(conversation.attendanceTurnIntent)}
                aria-invalid={Boolean(turnState.fieldError)}
                aria-describedby={turnState.fieldError ? "business-context-error" : "business-context-hint"}
                className="min-h-28" />
              {turnState.fieldError ? <FormFieldError id="business-context-error">{turnState.fieldError}</FormFieldError> : (
                <FormFieldHint id="business-context-hint">
                  Você não precisa repetir sua descrição. Acrescente apenas algo necessário para esclarecer sua atividade.
                  {" "}Não inclua telefone, e-mail ou endereço.
                </FormFieldHint>
              )}
            </FormField>
            <Button type="submit" name="intent" value={conversation.attendanceTurnIntent ? "resume" : "clarify"}
              disabled={isTurnPending} className={cn("min-h-11", attendanceButtonClass)}>
              {isTurnPending ? "Reavaliando…" : "Reavaliar classificação"}
            </Button>
          </form>
        ) : null}

        {conversation.stage === "identity" && !conversation.attendanceEnabled ? (
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
              <Button type="submit" name="intent" value="save" disabled={isPending} className={cn("min-h-11", attendanceButtonClass)}>
                {isPending ? "Continuando…" : "Continuar"}
              </Button>
              <Button
                type="submit"
                variant="secondary"
                name="intent"
                value="skip"
                disabled={isPending}
                className="min-h-11"
              >
                Prefiro não informar
              </Button>
            </div>
          </form>
        ) : null}

        {(conversation.stage === "business_understanding" || (conversation.attendanceEnabled && conversation.stage === "identity")) && !conversation.attendanceTurnIntent && !hasPrimaryConflict && (!conversation.attendanceEnabled || conversation.messages.length > 0) ? (
          <form action={turnAction} className="border-t border-surface-border px-5 py-5 sm:px-8">
            <ConversationHiddenFields
              accountSubdomain={accountSubdomain}
              conversationId={conversation.id}
              version={conversation.version}
            />

            {turnState.formError ? (
              <FeedbackMessage tone="error" className="mb-4">
                {turnState.formError}
              </FeedbackMessage>
            ) : null}

            <FormField>
              <FormFieldLabel htmlFor="business_context">Sua resposta</FormFieldLabel>
              <Textarea
                ref={textareaRef}
                id="business_context"
                name="business_context"
                maxLength={4000}
                disabled={isTurnPending}
                aria-invalid={Boolean(turnState.fieldError)}
                aria-describedby={turnState.fieldError ? "business-context-error" : "business-context-hint"}
                placeholder="Ex.: faço consultoria financeira para pequenos restaurantes"
                className="min-h-28"
              />
              {turnState.fieldError ? (
                <FormFieldError id="business-context-error">{turnState.fieldError}</FormFieldError>
              ) : (
                <FormFieldHint id="business-context-hint">
                  Não inclua telefone, e-mail ou endereço. Uma frase costuma bastar.
                </FormFieldHint>
              )}
            </FormField>

            <Button type="submit" disabled={isTurnPending} className={cn("mt-5 min-h-11", attendanceButtonClass)}>
              {isTurnPending ? "Entendendo…" : "Continuar"}
            </Button>
          </form>
        ) : null}

        {conversation.stage === "niche_confirmation" && !conversation.attendanceTurnIntent && !hasPrimaryConflict ? (
          <form action={turnAction} className="border-t border-surface-border px-5 py-5 sm:px-8">
            <ConversationHiddenFields
              accountSubdomain={accountSubdomain}
              conversationId={conversation.id}
              version={conversation.version}
            />

            {turnState.formError ? (
              <FeedbackMessage tone="error" className="mb-4">
                {turnState.formError}
              </FeedbackMessage>
            ) : null}

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button
                type="submit"
                name="intent"
                value={needsAttendanceProposal ? "clarify" : "confirm"}
                disabled={isTurnPending}
                className={cn("min-h-11", attendanceButtonClass)}
              >
                {isTurnPending
                  ? needsAttendanceProposal ? "Atendendo…" : "Confirmando…"
                  : needsAttendanceProposal ? "Retomar atendimento" : conversation.confirmationKind === "operational_fallback"
                    ? "Usar minha descrição"
                    : "Sim, está correto"}
              </Button>
              {!isTerminalFallback && !needsAttendanceProposal ? (
                <Button
                  type="submit"
                  variant="secondary"
                  name="intent"
                  value="clarify"
                  disabled={isTurnPending}
                  className="min-h-11"
                >
                  Não, quero explicar melhor
                </Button>
              ) : null}
            </div>
          </form>
        ) : null}

        {conversation.stage === "ready_to_complete" && !hasPrimaryConflict && passageEnabled && !conversation.businessDisplayName ? (
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

        {conversation.stage === "ready_to_complete" && !hasPrimaryConflict && (!passageEnabled || conversation.businessDisplayName) ? (
          <form action={completionAction} className="border-t border-surface-border px-5 py-5 sm:px-8">
            <ConversationHiddenFields
              accountSubdomain={accountSubdomain}
              conversationId={conversation.id}
              version={conversation.version}
            />
            <FeedbackMessage tone="success">
              Entendimento concluído. Falta apenas confirmar a passagem para a próxima etapa.
            </FeedbackMessage>
            {completionState.formError ? (
              <FeedbackMessage tone="error" className="mt-4">
                {completionState.formError}
              </FeedbackMessage>
            ) : null}
            <Button type="submit" disabled={isCompletionPending} className={cn("mt-5 min-h-11", attendanceButtonClass)}>
              {isCompletionPending ? "Concluindo…" : "Continuar para a próxima etapa"}
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
