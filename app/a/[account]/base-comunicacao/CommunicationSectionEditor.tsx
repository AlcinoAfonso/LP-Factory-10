"use client";

import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";

import type { CommunicationSection } from "../../../../lib/communication-base/contracts";
import type { CommunicationSectionDefinition } from "../../../../lib/communication-base/registry";
import {
  saveCommunicationSectionAction,
  startCommunicationBaseAction,
  type CommunicationActionState,
} from "./actions";

const INITIAL_STATE: CommunicationActionState = { status: "idle", message: "" };

export function StartCommunicationBaseForm({ account }: Readonly<{ account: string }>) {
  const [state, action] = useActionState(startCommunicationBaseAction, INITIAL_STATE);
  const router = useRouter();
  useEffect(() => {
    if (state.status === "saved") router.refresh();
  }, [router, state.status]);

  return (
    <form action={action} className="rounded-xl border border-border bg-white p-5 shadow-sm">
      <input type="hidden" name="account" value={account} />
      <p className="text-sm text-muted-foreground">
        Comece com o que já sabe sobre seu negócio. As demais seções podem ser preenchidas depois.
      </p>
      <div className="mt-4"><SubmitButton label="Iniciar minha Base" pendingLabel="Iniciando..." /></div>
      <ActionFeedback state={state} />
    </form>
  );
}

export function CommunicationSectionEditor(props: Readonly<{
  account: string;
  version: number;
  definition: CommunicationSectionDefinition;
  current: CommunicationSection | undefined;
  canEdit: boolean;
}>) {
  const { account, version, definition, current, canEdit } = props;
  const [state, action] = useActionState(saveCommunicationSectionAction, INITIAL_STATE);
  const router = useRouter();
  useEffect(() => {
    if (state.status === "saved") router.refresh();
  }, [router, state.status]);

  const value = editorText(current);
  if (!canEdit) {
    return (
      <article className="rounded-xl border border-border bg-white p-5 shadow-sm">
        <h3 className="font-medium">{definition.label}</h3>
        <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">
          {value || "Ainda não preenchido."}
        </p>
      </article>
    );
  }

  const fieldId = `communication-${definition.key}`;
  const hintId = `${fieldId}-hint`;
  return (
    <article className="rounded-xl border border-border bg-white p-5 shadow-sm">
      <form action={action} className="space-y-3">
        <input type="hidden" name="account" value={account} />
        <input type="hidden" name="section_key" value={definition.key} />
        <input type="hidden" name="version" value={version} />
        <label htmlFor={fieldId} className="block font-medium">{definition.label}</label>
        <p id={hintId} className="text-xs leading-5 text-muted-foreground">
          {definition.format === "items"
            ? "Escreva um item por linha, até 20 itens de 400 caracteres."
            : definition.format === "faq"
              ? "Escreva uma pergunta e resposta por linha, separadas por |. Até 15 pares."
              : "Até 4.000 caracteres. Você pode voltar e complementar depois."}
        </p>
        <textarea
          id={fieldId}
          name="value"
          rows={definition.format === "text" ? 5 : 6}
          defaultValue={value}
          maxLength={definition.format === "text" ? 4000 : undefined}
          aria-describedby={hintId}
          className="min-h-32 w-full rounded-lg border border-border bg-white px-3 py-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700"
        />
        <SubmitButton label="Salvar seção" pendingLabel="Salvando..." />
        <ActionFeedback state={state} />
      </form>
    </article>
  );
}

function SubmitButton({ label, pendingLabel }: Readonly<{ label: string; pendingLabel: string }>) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex min-h-11 items-center justify-center rounded-lg bg-brand-700 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700 focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-60"
    >
      {pending ? pendingLabel : label}
    </button>
  );
}

function ActionFeedback({ state }: Readonly<{ state: CommunicationActionState }>) {
  if (state.status === "idle") return null;
  return (
    <p role={state.status === "error" ? "alert" : "status"}
      className={`text-sm ${state.status === "error" ? "text-state-error" : "text-state-success"}`}>
      {state.message}
    </p>
  );
}

function editorText(section: CommunicationSection | undefined): string {
  if (!section) return "";
  if (section.format === "text") return typeof section.value === "string" ? section.value : "";
  if (section.format === "items") {
    return Array.isArray(section.value) ? section.value.join("\n") : "";
  }
  return Array.isArray(section.value)
    ? section.value.map((item) => typeof item === "object" && item !== null && "question" in item
      ? `${item.question} | ${item.answer}`
      : "").join("\n")
    : "";
}