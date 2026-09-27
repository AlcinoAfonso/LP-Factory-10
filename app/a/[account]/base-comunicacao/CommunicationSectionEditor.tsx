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
const STAGE_ONE_GUIDANCE: Record<string, string> = {
  business_name: "Que nome seus clientes devem ver?",
  business_context: "O que você faz, para quem e onde? Exemplo de formato: [atividade] para [público] em [localidade].",
  offers: "Quais ofertas reais você quer comunicar? Escreva uma por linha.",
  service: "Como funcionam atendimento, horários, contatos e agendamento?",
  proof: "Quais credenciais ou resultados você pode comprovar? Escreva um por linha.",
  materials: "Quais materiais ou referências textuais de identidade você já possui?",
  preferences: "Que linguagem, temas ou promessas devem ser usados ou evitados?",
};

export function StartCommunicationBaseForm({ account, candidate, candidateReadFailed }: Readonly<{
  account: string;
  candidate: string | null;
  candidateReadFailed: boolean;
}>) {
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
      {candidate ? (
        <div className="mt-4 rounded-lg border border-border p-4">
          <p className="text-sm font-medium">Contexto da conversa anterior</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Confira se esse texto descreve sua atuação. Ele só será copiado se você confirmar.
          </p>
          <blockquote className="mt-3 whitespace-pre-wrap text-sm">{candidate}</blockquote>
          <label className="mt-3 flex min-h-11 items-center gap-3 text-sm">
            <input type="checkbox" name="import_pending_setup" className="h-5 w-5 accent-brand-700" />
            Confirmo que este contexto representa meu negócio e quero copiá-lo.
          </label>
        </div>
      ) : candidateReadFailed ? (
        <p role="alert" className="mt-4 text-sm text-state-error">
          Não foi possível consultar a conversa anterior. Você pode iniciar sem importar.
        </p>
      ) : null}
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
  const guidance = definition.stage === 1 ? STAGE_ONE_GUIDANCE[definition.key] : null;
  return (
    <article className="rounded-xl border border-border bg-white p-5 shadow-sm">
      <form action={action} className="space-y-3">
        <input type="hidden" name="account" value={account} />
        <input type="hidden" name="section_key" value={definition.key} />
        <input type="hidden" name="version" value={version} />
        <label htmlFor={fieldId} className="block font-medium">{definition.label}</label>
        {guidance ? <p className="text-sm text-muted-foreground">{guidance}</p> : null}
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
          placeholder={guidance ?? undefined}
          maxLength={definition.format === "text" ? 4000 : undefined}
          aria-describedby={hintId}
          className="min-h-32 w-full rounded-lg border border-border bg-white px-3 py-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700"
        />
        <SubmitButton label="Salvar seção" pendingLabel="Salvando..." />
        <ActionFeedback state={state} />
      </form>
      {definition.stage === 2 ? (
        <div className="mt-4 border-t border-border pt-4">
          <p className="text-xs leading-5 text-muted-foreground">
            Quando disponível, esta ação revisará somente a sugestão de {definition.label}; as outras seções permanecerão como estão.
          </p>
          <button type="button" disabled aria-describedby={`${fieldId}-ai-unavailable`}
            className="mt-3 inline-flex min-h-11 items-center justify-center rounded-lg border border-border px-5 py-2 text-sm font-semibold text-muted-foreground disabled:cursor-not-allowed disabled:opacity-70">
            Revisar esta seção com IA
          </button>
          <p id={`${fieldId}-ai-unavailable`} role="status" className="mt-2 text-xs text-muted-foreground">
            A revisão por IA ainda não está disponível. A edição manual acima continua disponível.
          </p>
        </div>
      ) : null}
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
