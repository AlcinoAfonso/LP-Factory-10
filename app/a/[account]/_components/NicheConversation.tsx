"use client";

import { useEffect, useRef, useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { FeedbackMessage } from "@/components/ui/feedback-message";
import { FormField, FormFieldHint, FormFieldLabel } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AssistantMessageText } from "./AssistantMessageText";

type Message = Readonly<{ id: string; role: "user" | "assistant"; content: string }>;
type Submission = Readonly<{ account: string; dialogueId: string | null; version: number; requestId: string; content: string }>;

function formatWhatsApp(raw: string) {
  const digits = raw.replace(/\D/g, "").slice(0, 11);
  if (!digits) return "";
  if (digits.length <= 2) return "(" + digits;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}${digits.length > 7 ? "-" + digits.slice(7) : ""}`;
}

export function NicheConversation({
  account, dialogueId, version, messages, retry, introductoryMessage, label, ended, whatsappMode, focusOnOpen, submit,
}: {
  account: string;
  dialogueId: string | null;
  version: number;
  messages: readonly Message[];
  retry?: Message | null;
  introductoryMessage: string;
  label: string;
  ended?: boolean;
  whatsappMode?: "first-synthesis" | "correction";
  focusOnOpen?: boolean;
  submit: (input: Submission) => Promise<{ ok: true } | { ok: false; message: string }>;
}) {
  const router = useRouter();
  const input = useRef<HTMLTextAreaElement>(null);
  const contactInput = useRef<HTMLInputElement>(null);
  const retryButton = useRef<HTMLButtonElement>(null);
  const log = useRef<HTMLDivElement>(null);
  const follow = useRef(true);
  const restoreFocus = useRef(false);
  const [draft, setDraft] = useState("");
  const [whatsApp, setWhatsApp] = useState("");
  const [correctingWhatsApp, setCorrectingWhatsApp] = useState(false);
  const [failed, setFailed] = useState<Pick<Submission, "requestId" | "content"> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  useEffect(() => {
    if (focusOnOpen) (input.current ?? retryButton.current)?.focus();
  }, [focusOnOpen]);

  useEffect(() => {
    if (correctingWhatsApp) contactInput.current?.focus();
  }, [correctingWhatsApp]);

  useEffect(() => {
    if (!draft.trim() && !whatsApp) return;
    const here = window.location.href;
    const entry = window.history.state;
    const discard = () => window.confirm("Sair desta conversa e descartar a mensagem ainda não enviada?");
    const keepDraft = (event: BeforeUnloadEvent) => event.preventDefault();
    function onBack(event: PopStateEvent) {
      if (window.location.href === here || discard()) return;
      event.stopImmediatePropagation();
      window.history.pushState(entry, "", here);
    }
    function onNavigate(event: MouseEvent) {
      if (event.button !== 0 || event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return;
      const link = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>("a[href]") : null;
      if (!link || (link.target && link.target !== "_self") || link.hasAttribute("download")) return;
      const destination = new URL(link.href);
      const current = new URL(here);
      if (destination.origin === current.origin && destination.href.split("#")[0] !== current.href.split("#")[0] && !discard()) {
        event.preventDefault();
        event.stopPropagation();
      }
    }
    window.addEventListener("beforeunload", keepDraft);
    window.addEventListener("popstate", onBack, true);
    document.addEventListener("click", onNavigate, true);
    return () => {
      window.removeEventListener("beforeunload", keepDraft);
      window.removeEventListener("popstate", onBack, true);
      document.removeEventListener("click", onNavigate, true);
    };
  }, [draft, whatsApp]);

  useEffect(() => {
    if (follow.current && log.current) log.current.scrollTop = log.current.scrollHeight;
  }, [messages]);

  const showWhatsApp = whatsappMode === "first-synthesis" || (whatsappMode === "correction" && correctingWhatsApp);
  const whatsAppComplete = showWhatsApp && /^\(\d{2}\) 9\d{4}-\d{4}$/u.test(whatsApp);
  const pendingMessage = retry ? { requestId: retry.id, content: retry.content } : failed;
  const composing = !pendingMessage && !ended;
  useEffect(() => {
    if (composing && restoreFocus.current) {
      input.current?.focus();
      restoreFocus.current = false;
    }
  }, [composing]);

  function send(event: FormEvent) {
    event.preventDefault();
    if (pending || ended || (!pendingMessage && !draft.trim() && !whatsAppComplete)) return;
    const content = [draft.trim(), whatsAppComplete && "WhatsApp para contato: " + whatsApp].filter(Boolean).join("\n");
    if (!pendingMessage && content.length > 4000) {
      setError("Reduza a mensagem para continuar.");
      return;
    }
    const submission = pendingMessage ?? { requestId: crypto.randomUUID(), content };
    setError(null);
    startTransition(async () => {
      try {
        const result = await submit({ ...submission, account, dialogueId, version });
        if (result.ok) {
          restoreFocus.current = input.current === null;
          setDraft("");
          setWhatsApp("");
          setCorrectingWhatsApp(false);
          setFailed(null);
          input.current?.focus();
        } else {
          setFailed(submission);
          setError(result.message);
        }
      } catch {
        setFailed(submission);
        setError("Não foi possível continuar agora. Tente novamente.");
      }
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <div ref={log} className="max-h-[55vh] space-y-4 overflow-y-auto pr-1" role="log"
        aria-label="Histórico da conversa" tabIndex={0}
        onScroll={event => {
          const view = event.currentTarget;
          follow.current = view.scrollHeight - view.scrollTop - view.clientHeight < 60;
        }}>
        {!messages.length ? <p className="text-sm text-foreground">{introductoryMessage}</p> : null}
        {messages.map(message => (
          <div key={message.id} className={message.role === "user"
            ? "ml-auto max-w-[92%] rounded-xl bg-muted px-4 py-3 sm:max-w-[85%]"
            : "max-w-[92%] rounded-xl border border-border px-4 py-3 sm:max-w-[85%]"}>
            <p className="mb-1 text-xs font-semibold text-muted-foreground">{message.role === "user" ? "Você" : "LP Factory"}</p>
            <p className="whitespace-pre-wrap break-words text-sm text-foreground [overflow-wrap:anywhere]">
              {message.role === "assistant" ? <AssistantMessageText text={message.content} /> : message.content}
            </p>
          </div>
        ))}
      </div>
      {ended ? null : (
        <form onSubmit={send} className="space-y-3">
          {error ? <FeedbackMessage tone="error">{error}</FeedbackMessage> : null}
          {pendingMessage && !error && !pending ? <p role="status" className="text-sm text-muted-foreground">
            A conversa tem uma mensagem aguardando resposta.
          </p> : null}
          {pending ? <p role="status" className="text-sm text-muted-foreground">Preparando a resposta…</p> : null}
          {!pendingMessage ? <FormField>
            <FormFieldLabel htmlFor="niche-message">{label}</FormFieldLabel>
            <Textarea ref={input} id="niche-message" value={draft} onChange={event => setDraft(event.target.value)}
              maxLength={4000} rows={3} readOnly={pending} />
          </FormField> : null}
          {showWhatsApp && !pendingMessage ? <FormField>
            <FormFieldLabel htmlFor="niche-whatsapp">WhatsApp para contato com a LP Factory (opcional)</FormFieldLabel>
            <Input ref={contactInput} id="niche-whatsapp" type="tel" inputMode="numeric" autoComplete="tel"
              placeholder="(99) 99999-9999" maxLength={15} value={whatsApp}
              aria-describedby={whatsApp && !whatsAppComplete ? "niche-whatsapp-hint" : undefined}
              onChange={event => setWhatsApp(formatWhatsApp(event.target.value))} disabled={pending} />
            {whatsApp && !whatsAppComplete ? <FormFieldHint id="niche-whatsapp-hint">
              Número incompleto. A conversa pode continuar sem ele.
            </FormFieldHint> : null}
          </FormField> : null}
          <Button ref={retryButton} className="min-h-11" type="submit" disabled={pending || (!pendingMessage && !draft.trim() && !whatsAppComplete)}>
            {pendingMessage ? "Tentar novamente" : "Enviar mensagem"}
          </Button>
          {whatsappMode === "correction" && !showWhatsApp && !pendingMessage ? (
            <Button variant="secondary" className="ml-2 min-h-11" disabled={pending} onClick={() => setCorrectingWhatsApp(true)}>
              Corrigir WhatsApp
            </Button>
          ) : null}
        </form>
      )}
    </div>
  );
}
