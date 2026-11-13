"use client";
import { AssistantMessageText } from "./AssistantMessageText";

import { useActionState, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FeedbackMessage } from "@/components/ui/feedback-message";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormField, FormFieldLabel } from "@/components/ui/form-field";
import type { ActionableNicheResolution } from "../../../../lib/onboarding/niche-resolution/contracts";
import {
  confirmOptionNicheResolutionAction,
  confirmSuggestedNicheResolutionAction,
  rewriteNicheResolutionAction,
  type NicheResolutionActionState,
  type AccountNicheEditorState,
  converseAccountNicheAction,
  saveAccountNicheAction,
} from "../niche-resolution-actions";

type NicheMessage = Readonly<{ role: "user" | "assistant"; content: string }>;
type NicheChoice = Readonly<{ taxonId: string | null; name: string }>;

export function AccountNicheEditor({ account, state, hasIntelligence = false }: Readonly<{
  account: string; state: AccountNicheEditorState; hasIntelligence?: boolean;
}>) {
  const id = useId();
  const router = useRouter();
  const dialog = useRef<HTMLDialogElement>(null);
  const discard = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const dialogueId = useRef("");
  const dialogueVersion = useRef(0);
  const request = useRef<{ id: string; content: string | null } | null>(null);
  const expectedRevision = useRef<string | null>(null);
  const turnRevision = useRef(0);
  const historyEntry = useRef(false);
  const closeRequest = useRef<() => void>(() => undefined);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<readonly NicheMessage[]>([]);
  const [chosen, setChosen] = useState<NicheChoice | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [pending, setPending] = useState<"conversation" | "save" | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const dirty = Boolean(message.trim() || chosen);
  useLayoutEffect(() => { closeRequest.current = requestClose; });
  useEffect(() => {
    function beforeUnload(event: BeforeUnloadEvent) {
      if (dialog.current?.open && (dirty || pending === "save")) { event.preventDefault(); event.returnValue = ""; }
    }
    function onBack() {
      if (!dialog.current?.open) return;
      window.history.pushState({ ...window.history.state }, "", window.location.href);
      historyEntry.current = true;
      closeRequest.current();
    }
    window.addEventListener("beforeunload", beforeUnload);
    window.addEventListener("popstate", onBack);
    return () => { window.removeEventListener("beforeunload", beforeUnload); window.removeEventListener("popstate", onBack); };
  }, [dirty, pending]);
  if (!state.ok) return <FeedbackMessage tone="error">{state.message}</FeedbackMessage>;
  if (!state.canEdit) return null;
  const taxon = state.taxon;
  const label = !taxon ? "Definir nicho" : !taxon.confirmed ? "Confirmar nicho" : "Redefinir nicho";
  const changed = Boolean(chosen && (chosen.taxonId !== taxon?.taxonId || chosen.name !== taxon?.name));
  function close() {
    turnRevision.current += 1; setPending(null); discard.current?.close(); dialog.current?.close();
    if (historyEntry.current) { historyEntry.current = false; window.history.back(); }
    trigger.current?.focus();
  }
  function requestClose() {
    if (pending === "save") return;
    if (dirty) { if (!discard.current?.open) discard.current?.showModal(); } else close();
  }
  async function converse(content: string | null) {
    const revision = ++turnRevision.current;
    setPending("conversation"); setError(""); setChosen(null); setConfirmed(false);
    if (!request.current || request.current.content !== content) request.current = { id: crypto.randomUUID(), content };
    try {
      const result = await converseAccountNicheAction({ account, dialogueId: dialogueId.current,
        requestId: request.current.id, expectedVersion: dialogueVersion.current,
        expectedRevision: expectedRevision.current, content });
      if (revision !== turnRevision.current) return;
      if ("version" in result && result.version !== undefined) dialogueVersion.current = result.version;
      if (!result.ok) { setError(result.message); return; }
      setMessages(previous => [...previous, ...(content ? [{ role: "user" as const, content }] : []),
        { role: "assistant", content: result.reply }]);
      setChosen(result.proposal); setMessage(""); request.current = null;
    } catch { if (revision === turnRevision.current) setError("Não foi possível concluir a resposta. O texto continua disponível para tentar novamente."); }
    finally { if (revision === turnRevision.current) setPending(null); }
  }
  return <div className="text-sm">
    {taxon?.confirmed && state.hasProducts ? <p className="text-xs text-muted-foreground">A redefinição não está disponível porque esta conta já possui produto desenvolvido.</p> : <Button
      ref={trigger} variant="secondary" className="min-h-11 px-0 underline underline-offset-4" onClick={() => {
        dialogueId.current = crypto.randomUUID(); dialogueVersion.current = 0; request.current = null;
        expectedRevision.current = taxon?.revision ?? null;
        setMessage(""); setMessages([]); setConfirmed(false); setError(""); setChosen(null);
        window.history.pushState({ ...window.history.state }, "", window.location.href); historyEntry.current = true;
        dialog.current?.showModal();
        void converse(null);
      }}>{label}</Button>}
    {notice ? <FeedbackMessage tone="success">{notice}</FeedbackMessage> : null}
    <dialog ref={dialog} aria-labelledby={id + "-title"} onCancel={event => { event.preventDefault(); requestClose(); }}
      onClick={event => { if (event.target === event.currentTarget) requestClose(); }}
      className="m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-lg overflow-y-auto rounded-xl border border-border bg-background p-4 text-foreground shadow-xl backdrop:bg-black/40">
      <h2 id={id + "-title"} className="text-lg font-semibold">{label}</h2>
      {taxon ? <p className="mt-2 break-words text-sm">Nicho atual: <strong>{taxon.name}</strong></p> : null}
      {taxon && state.hasProducts ? <p className="mt-2 text-sm text-muted-foreground">Você pode confirmar o nicho atual. A redefinição não está disponível porque esta conta já possui produto desenvolvido.</p> : <>
        <p className="mt-2 text-xs text-muted-foreground">As mensagens enviadas ficam no histórico e ajudam a atualizar o contexto do negócio. O nicho só muda após sua confirmação em Salvar; a Base de Comunicação permanece preservada.</p>
        <div role="log" aria-label="Conversa sobre o nicho" aria-live="polite" className="mt-3 space-y-3">
          {messages.map((entry, index) => <div key={index} className="rounded-lg border border-border bg-muted/30 p-3">
            <p className="text-xs font-medium text-muted-foreground">{entry.role === "user" ? "Você" : "LP Factory"}</p>
            <p className="mt-1 whitespace-pre-wrap break-words text-sm">{entry.role === "assistant" ? <AssistantMessageText text={entry.content} /> : entry.content}</p>
          </div>)}
        </div>
        {pending === "conversation" ? <p role="status" className="mt-3 text-sm text-muted-foreground">Consultando o contexto e preparando a resposta...</p> : null}
        <form className="mt-3 space-y-2" onSubmit={event => {
          event.preventDefault(); if (pending || !message.trim()) return;
          void converse(message.trim());
        }}>
          <FormField><FormFieldLabel htmlFor={id + "-message"}>Conte sobre seu negócio ou o que mudou</FormFieldLabel>
            <Textarea id={id + "-message"} autoFocus maxLength={4000} rows={3} value={message} disabled={pending !== null}
              onChange={event => { setMessage(event.target.value); setConfirmed(false); }} /></FormField>
          <Button type="submit" className="min-h-11" disabled={pending !== null || !message.trim()}>Enviar mensagem</Button>
          {error && !message.trim() && !messages.length ? <Button variant="secondary" className="min-h-11 ml-2" disabled={pending !== null} onClick={() => void converse(null)}>Tentar novamente</Button> : null}
        </form>
      </>}
      {chosen ? <label className="mt-3 flex min-h-11 items-start gap-2 text-sm">
        <input type="checkbox" className="mt-1 h-5 w-5 shrink-0" checked={confirmed} disabled={pending !== null || Boolean(message.trim())} onChange={event => setConfirmed(event.target.checked)} />
        <span className="break-words">Confirmo que <strong>{chosen.name}</strong> representa o nicho do meu negócio.</span>
      </label> : null}
      {hasIntelligence && changed ? <FeedbackMessage tone="warning" className="mt-3">Os conteúdos de Inteligência e copy serão preservados. Revise-os para adequá-los ao novo nicho antes de reutilizá-los.</FeedbackMessage> : null}
      {error ? <FeedbackMessage tone="error" className="mt-3">{error}</FeedbackMessage> : null}
      <div className="mt-4 flex flex-wrap justify-end gap-2">
        <Button variant="secondary" className="min-h-11" disabled={pending === "save"} onClick={requestClose}>Cancelar</Button>
        <Button className="min-h-11" disabled={pending !== null || !chosen || !confirmed || Boolean(message.trim()) || (!changed && Boolean(taxon?.confirmed))} onClick={async () => {
          if (!chosen || !confirmed || pending || message.trim()) return;
          setPending("save"); setError("");
          try {
            const result = await saveAccountNicheAction({ account, dialogueId: dialogueId.current, expectedVersion: dialogueVersion.current, confirmed: true });
            if (!result.ok) { setError(result.message); return; }
            setNotice(hasIntelligence && changed ? "Nicho confirmado e contexto atualizado. Revise os conteúdos de Inteligência e copy antes de reutilizá-los." : "Nicho confirmado e contexto do negócio atualizado.");
            close(); router.refresh();
          } catch { setError("Não foi possível salvar o nicho agora. Tente novamente."); }
          finally { setPending(null); }
        }}>{pending === "save" ? "Salvando..." : "Salvar"}</Button>
      </div>
    </dialog>
    <dialog ref={discard} aria-labelledby={id + "-discard"} onCancel={event => { event.preventDefault(); discard.current?.close(); }}
      className="m-auto w-[calc(100%-2rem)] max-w-md rounded-xl border border-border bg-background p-4 text-foreground shadow-xl backdrop:bg-black/40">
      <h2 id={id + "-discard"} className="font-semibold">Encerrar sem confirmar o nicho?</h2>
      <p className="mt-2 text-sm">As mensagens já enviadas permanecem no histórico. {message.trim() ? "O texto não enviado e a escolha pendente serão descartados;" : "A escolha pendente será descartada;"} o nicho atual será mantido.</p>
      <div className="mt-3 flex flex-wrap gap-2"><Button className="min-h-11" onClick={() => discard.current?.close()}>Continuar conversa</Button>
        <Button className="min-h-11" variant="secondary" onClick={close}>Encerrar sem confirmar</Button></div>
    </dialog>
  </div>;
}

type NicheResolutionCardProps = {
  accountSubdomain: string;
  resolution: ActionableNicheResolution;
};

const INITIAL_STATE: NicheResolutionActionState = { ok: true };

export function NicheResolutionCard({
  accountSubdomain,
  resolution,
}: NicheResolutionCardProps) {
  const [showRewrite, setShowRewrite] = useState(false);
  const [confirmSuggestedState, confirmSuggestedAction, isConfirmingSuggested] = useActionState(
    confirmSuggestedNicheResolutionAction,
    INITIAL_STATE,
  );
  const [confirmOptionState, confirmOptionAction, isConfirmingOption] = useActionState(
    confirmOptionNicheResolutionAction,
    INITIAL_STATE,
  );
  const [rewriteState, rewriteAction, isRewriting] = useActionState(
    rewriteNicheResolutionAction,
    INITIAL_STATE,
  );

  const formError =
    confirmSuggestedState.formError ??
    confirmOptionState.formError ??
    rewriteState.formError ??
    null;
  const isPending = isConfirmingSuggested || isConfirmingOption || isRewriting;

  if (resolution.uxMode === "fallback_review") {
    return (
      <Card className="border-amber-200 bg-amber-50/60 shadow-sm">
        <CardHeader>
          <CardTitle>Informe seu nicho</CardTitle>
          <CardDescription>Nao encontramos uma opcao segura. Salve o texto que melhor descreve sua conta.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {formError ? <FeedbackMessage tone="error">{formError}</FeedbackMessage> : null}
          <RewriteForm
            accountSubdomain={accountSubdomain}
            action={rewriteAction}
            disabled={isPending}
          />
        </CardContent>
      </Card>
    );
  }

  if (resolution.uxMode === "choose_from_options" && resolution.options.length === 1) {
    const [singleOption] = resolution.options;

    return (
      <Card className="border-blue-200 bg-blue-50/50 shadow-sm">
        <CardHeader>
          <CardTitle>Confirma seu nicho?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {formError ? <FeedbackMessage tone="error">{formError}</FeedbackMessage> : null}
          <div className="rounded-lg border border-blue-100 bg-white px-4 py-3">
            <p className="text-base font-semibold text-gray-950">{singleOption.name}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <OptionActionForm
              option={singleOption}
              accountSubdomain={accountSubdomain}
              confirmAction={confirmOptionAction}
              disabled={isPending}
              label="Sim, confirmar"
            />
            <Button
              type="button"
              className="bg-white text-gray-800 ring-1 ring-gray-300 hover:bg-gray-50"
              disabled={isPending}
              onClick={() => setShowRewrite(true)}
            >
              Outro
            </Button>
          </div>
          {showRewrite ? (
            <RewriteForm
              accountSubdomain={accountSubdomain}
              action={rewriteAction}
              disabled={isPending}
            />
          ) : null}
        </CardContent>
      </Card>
    );
  }

  if (resolution.uxMode === "choose_from_options") {
    return (
      <Card className="border-blue-200 bg-blue-50/50 shadow-sm">
        <CardHeader>
          <CardTitle>Escolha o nicho mais proximo</CardTitle>
          <CardDescription>Encontramos algumas opcoes possiveis para personalizar melhor seu dashboard.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {formError ? <FeedbackMessage tone="error">{formError}</FeedbackMessage> : null}
          <div className="flex flex-wrap gap-2">
            {resolution.options.map((option) => (
              <OptionActionForm
                key={option.taxonId ?? option.name}
                option={option}
                accountSubdomain={accountSubdomain}
                confirmAction={confirmOptionAction}
                disabled={isPending}
                label={option.name}
              />
            ))}
            <Button
              type="button"
              className="bg-white text-gray-800 ring-1 ring-gray-300 hover:bg-gray-50"
              disabled={isPending}
              onClick={() => setShowRewrite(true)}
            >
              Outro
            </Button>
          </div>
          {showRewrite ? (
            <RewriteForm
              accountSubdomain={accountSubdomain}
              action={rewriteAction}
              disabled={isPending}
            />
          ) : null}
        </CardContent>
      </Card>
    );
  }

  const suggestedName = resolution.suggestedTaxon?.name ?? "seu nicho";

  return (
    <Card className="border-blue-200 bg-blue-50/50 shadow-sm">
      <CardHeader>
        <CardTitle>Confirme seu nicho</CardTitle>
        <CardDescription>Isso ajuda a personalizar melhor seu dashboard.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {formError ? <FeedbackMessage tone="error">{formError}</FeedbackMessage> : null}
        <div className="rounded-lg border border-blue-100 bg-white px-4 py-3">
          <p className="text-sm text-gray-600">Identificamos que seu nicho provavelmente e:</p>
          <p className="mt-1 text-base font-semibold text-gray-950">{suggestedName}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <form action={confirmSuggestedAction}>
            <input type="hidden" name="account_subdomain" value={accountSubdomain} />
            <Button type="submit" disabled={isPending}>
              Sim, confirmar
            </Button>
          </form>
          <Button
            type="button"
            className="bg-white text-gray-800 ring-1 ring-gray-300 hover:bg-gray-50"
            disabled={isPending}
            onClick={() => setShowRewrite(true)}
          >
            Outro
          </Button>
        </div>
        {showRewrite ? (
          <RewriteForm
            accountSubdomain={accountSubdomain}
            action={rewriteAction}
            disabled={isPending}
          />
        ) : null}
      </CardContent>
    </Card>
  );
}

function OptionActionForm({
  option,
  accountSubdomain,
  confirmAction,
  disabled,
  label,
}: {
  option: ActionableNicheResolution["options"][number];
  accountSubdomain: string;
  confirmAction: (payload: FormData) => void;
  disabled: boolean;
  label: string;
}) {
  if (option.isOfficial && option.taxonId) {
    return (
      <form action={confirmAction}>
        <input type="hidden" name="account_subdomain" value={accountSubdomain} />
        <input type="hidden" name="taxon_id" value={option.taxonId} />
        <Button type="submit" disabled={disabled}>
          {label}
        </Button>
      </form>
    );
  }

  return (
    <form action={confirmAction}>
      <input type="hidden" name="account_subdomain" value={accountSubdomain} />
      <input type="hidden" name="option_name" value={option.name} />
      <Button type="submit" disabled={disabled}>
        {label}
      </Button>
    </form>
  );
}

function RewriteForm({
  accountSubdomain,
  action,
  disabled,
}: {
  accountSubdomain: string;
  action: (payload: FormData) => void;
  disabled: boolean;
}) {
  return (
    <form action={action} className="space-y-3 rounded-lg border bg-white p-4">
      <input type="hidden" name="account_subdomain" value={accountSubdomain} />
      <label htmlFor="rewrite_input" className="text-sm font-medium text-gray-900">
        Qual nicho descreve melhor sua conta?
      </label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          id="rewrite_input"
          name="rewrite_input"
          maxLength={120}
          required
          disabled={disabled}
          placeholder="Ex.: Clinica de estetica para noivas"
          autoComplete="off"
        />
        <Button type="submit" disabled={disabled}>
          Salvar
        </Button>
      </div>
      <p className="text-xs text-gray-500">Use ate 120 caracteres. Essa escolha encerra a confirmacao.</p>
    </form>
  );
}
