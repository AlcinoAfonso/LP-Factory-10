"use client";

import { useActionState, useEffect, useLayoutEffect, useRef, useState, useTransition } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";

import type { CommunicationBase, CommunicationSection, CommunicationSectionValue } from "../../../../lib/communication-base/contracts";
import { hasStageTwoContent, type CommunicationSuggestion, type WebSource } from "../../../../lib/communication-base/ai-core";
import { selectStageTwoSectionPresentation, stageTwoBasisLabel, type LocalStageTwoResult } from "../../../../lib/communication-base/stage-two-presentation";
import { communicationSections, type CommunicationSectionKey } from "../../../../lib/communication-base/registry";
import type { CommunicationSectionDefinition } from "../../../../lib/communication-base/registry";
import { formatEditorValue } from "../../../../lib/communication-base/editor-value";
import { canInstallGeneralSuggestion, canStartGeneralGeneration } from "../../../../lib/communication-base/generation-guard";
import {
  saveCommunicationSectionAction,
  startCommunicationBaseAction,
  assistCommunicationSectionAction,
  generateCommunicationIntelligenceAction,
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
  suggestedSuggestion?: CommunicationSuggestion;
  generalRevision?: number;
  onStageTwoSaveStarted?: () => void;
  onStageTwoSaveFinished?: () => void;
}>) {
  const { account, version, definition, current, canEdit, suggestedSuggestion, generalRevision = 0,
    onStageTwoSaveStarted, onStageTwoSaveFinished } = props;
  const [state, action] = useActionState(saveCommunicationSectionAction, INITIAL_STATE);
  const lastHandledSaveStateRef = useRef(state);
  const startedSavesRef = useRef(0);
  const [draft, setDraft] = useState(editorText(current));
  const [aiPending, startAiTransition] = useTransition();
  const [aiMessage, setAiMessage] = useState("");
  const [localSuggestion, setLocalSuggestion] = useState<CommunicationSectionValue | null>(null);
  const [localStageTwoResult, setLocalStageTwoResult] = useState<LocalStageTwoResult | null>(null);
  const [missingQuestion, setMissingQuestion] = useState("");
  const [requiresResearch, setRequiresResearch] = useState(false);
  const router = useRouter();
  useEffect(() => {
    if (state === lastHandledSaveStateRef.current) return;
    lastHandledSaveStateRef.current = state;
    if (startedSavesRef.current > 0) {
      startedSavesRef.current -= 1;
      onStageTwoSaveFinished?.();
    }
    if (state.status === "saved") router.refresh();
  }, [router, state, onStageTwoSaveFinished]);

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
  const stageTwoPresentation = selectStageTwoSectionPresentation(localStageTwoResult, generalRevision, suggestedSuggestion);
  const stageTwoSuggestion = stageTwoPresentation.suggestion;
  return (
    <article className="rounded-xl border border-border bg-white p-5 shadow-sm">
      <form action={action} onSubmit={definition.stage === 2 ? () => {
        startedSavesRef.current += 1;
        onStageTwoSaveStarted?.();
      } : undefined} className="space-y-3">
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
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder={guidance ?? undefined}
          maxLength={definition.format === "text" ? 4000 : undefined}
          aria-describedby={hintId}
          className="min-h-32 w-full rounded-lg border border-border bg-white px-3 py-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700"
        />
        <SubmitButton label="Salvar seção" pendingLabel="Salvando..." />
        <ActionFeedback state={state} />
      </form>
      {definition.stage === 1 ? (
        <div className="mt-4 border-t border-border pt-4">
          <p className="text-xs leading-5 text-muted-foreground">
            A IA trabalha apenas com o texto desta seção que você enviar. Confira a sugestão antes de usá-la; salvar continua sendo sua decisão.
          </p>
          <button type="button" disabled={aiPending || !draft.trim()}
            onClick={() => startAiTransition(async () => {
              setAiMessage("");
              setLocalSuggestion(null);
              setMissingQuestion("");
              try {
                const result = await assistCommunicationSectionAction({ account, key: definition.key, userText: draft, version });
                if (result.ok) {
                  setLocalSuggestion(result.suggestion);
                  setMissingQuestion(result.missingQuestion);
                } else setAiMessage(result.message);
              } catch {
                setAiMessage("A assistência está indisponível agora. Continue a edição manual.");
              }
            })}
            className="mt-3 inline-flex min-h-11 items-center justify-center rounded-lg border border-border px-5 py-2 text-sm font-semibold text-foreground disabled:cursor-not-allowed disabled:opacity-60">
            {aiPending ? "Preparando sugestão..." : "Ajudar com este texto usando IA"}
          </button>
          {missingQuestion ? <p className="mt-3 text-sm">Informação a confirmar: {missingQuestion}</p> : null}
          {localSuggestion !== null ? <Suggestion value={localSuggestion} format={definition.format}
            onUse={() => setDraft(formatEditorValue(localSuggestion, definition.format))} /> : null}
          {aiMessage ? <p role="alert" className="mt-2 text-sm text-state-error">{aiMessage}</p> : null}
        </div>
      ) : (
        <div className="mt-4 border-t border-border pt-4">
          <p className="text-xs leading-5 text-muted-foreground">
            A IA revisa apenas {definition.label} usando os dados confirmados pertinentes e o texto salvo desta seção. As demais seções permanecem como estão.
          </p>
          <label className="mt-3 flex min-h-11 items-center gap-3 text-sm">
            <input type="checkbox" checked={requiresResearch} onChange={(event) => setRequiresResearch(event.target.checked)}
              className="h-5 w-5 accent-brand-700" />
            Preciso de pesquisa atual ou local para esta seção
          </label>
          <button type="button" disabled={aiPending}
            onClick={() => startAiTransition(async () => {
              setAiMessage("");
              setLocalStageTwoResult(null);
              try {
                const result = await generateCommunicationIntelligenceAction({
                  account, target: { kind: "section", key: definition.key as CommunicationSectionKey }, version,
                  requiresCurrentResearch: requiresResearch,
                });
                if (result.ok) {
                  setLocalStageTwoResult({
                    generalRevision,
                    suggestion: result.draft.suggestions[0] ?? null,
                    sources: result.draft.sources,
                  });
                } else setAiMessage(result.message);
              } catch {
                setAiMessage("A revisão está indisponível agora. Continue a edição manual.");
              }
            })}
            className="mt-3 inline-flex min-h-11 items-center justify-center rounded-lg border border-border px-5 py-2 text-sm font-semibold text-foreground disabled:cursor-wait disabled:opacity-60">
            {aiPending ? "Preparando sugestão..." : "Revisar esta seção com IA"}
          </button>
          {stageTwoSuggestion !== null ? <Suggestion value={stageTwoSuggestion.value} format={definition.format}
            basis={stageTwoSuggestion.basis}
            onUse={() => setDraft(formatEditorValue(stageTwoSuggestion.value, definition.format))} /> : null}
          <Sources sources={stageTwoPresentation.sources} />
          {aiMessage ? <p role="alert" className="mt-2 text-sm text-state-error">{aiMessage}</p> : null}
        </div>
      )}
    </article>
  );
}

export function CommunicationStageTwo({ account, base, canEdit, sectionKeys }: Readonly<{
  account: string;
  base: CommunicationBase;
  canEdit: boolean;
  sectionKeys: Readonly<Record<string, string>>;
}>) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  const [messageIsError, setMessageIsError] = useState(false);
  const [requiresResearch, setRequiresResearch] = useState(false);
  const [suggestions, setSuggestions] = useState<Partial<Record<string, CommunicationSuggestion>>>({});
  const [generalRevision, setGeneralRevision] = useState(0);
  const [sources, setSources] = useState<readonly WebSource[]>([]);
  const [saveInFlightCount, setSaveInFlightCount] = useState(0);
  const currentVersionRef = useRef(base.version);
  const saveRevisionRef = useRef(0);
  const pendingSavesRef = useRef(0);
  useLayoutEffect(() => { currentVersionRef.current = base.version; }, [base.version]);
  const stageTwo = communicationSections.filter((section) => section.stage === 2);
  return (
    <section aria-labelledby="communication-stage-2" className="space-y-4">
      <div className="space-y-3">
        <p className="text-sm font-semibold text-brand-700">Etapa 2</p>
        <h2 id="communication-stage-2" className="text-xl font-semibold">Inteligência de comunicação</h2>
        {canEdit ? <div className="rounded-lg border border-border bg-white p-4">
          <p className="text-sm text-muted-foreground">
            A ação geral prepara sugestões para as sete seções da Etapa 2. Confira cada uma antes de usá-la ou salvar.
          </p>
          <label className="mt-3 flex min-h-11 items-center gap-3 text-sm">
            <input type="checkbox" checked={requiresResearch} onChange={(event) => setRequiresResearch(event.target.checked)}
              className="h-5 w-5 accent-brand-700" />
            Preciso de pesquisa atual ou local para esta geração
          </label>
          <button type="button" disabled={pending || saveInFlightCount > 0}
            onClick={() => {
              if (!canStartGeneralGeneration(pendingSavesRef.current)) return;
              const requestedVersion = base.version;
              const requestSaveRevision = saveRevisionRef.current;
              startTransition(async () => {
                setMessage("");
                setMessageIsError(false);
                setSuggestions({});
                setSources([]);
                try {
                  const result = await generateCommunicationIntelligenceAction({
                    account, target: { kind: "general" }, version: requestedVersion, requiresCurrentResearch: requiresResearch,
                  });
                  if (!canInstallGeneralSuggestion(requestedVersion, currentVersionRef.current,
                      requestSaveRevision, saveRevisionRef.current)) {
                    setMessageIsError(true);
                    setMessage("A Base mudou durante a geração. Atualize a página antes de gerar sugestões.");
                    return;
                  }
                  if (result.ok) {
                    setSuggestions(Object.fromEntries(result.draft.suggestions.map((item) => [item.key, item])));
                    setSources(result.draft.sources);
                    setGeneralRevision((current) => current + 1);
                    setMessage("Sugestões prontas para revisão. Nenhuma seção foi salva automaticamente.");
                  } else {
                    setMessageIsError(true);
                    setMessage(result.message);
                  }
                } catch {
                  setMessageIsError(true);
                  setMessage("A geração está indisponível agora. Continue a edição manual.");
                }
              });
            }}
            className="mt-3 inline-flex min-h-11 items-center justify-center rounded-lg border border-border px-5 py-2 text-sm font-semibold text-foreground disabled:cursor-wait disabled:opacity-60">
            {pending ? "Preparando sugestões..." : hasStageTwoContent(base) ? "Atualizar inteligência com IA" : "Gerar inteligência com IA"}
          </button>
          {message ? <p role={messageIsError ? "alert" : "status"} className="mt-2 text-sm">{message}</p> : null}
          <Sources sources={sources} />
        </div> : null}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {stageTwo.map((section) => <CommunicationSectionEditor key={`${section.key}-${sectionKeys[section.key]}`}
          account={account} version={base.version} definition={section} current={base.sections[section.key]}
          canEdit={canEdit} suggestedSuggestion={suggestions[section.key]} generalRevision={generalRevision}
          onStageTwoSaveStarted={() => {
            saveRevisionRef.current += 1;
            pendingSavesRef.current += 1;
            setSaveInFlightCount(pendingSavesRef.current);
          }}
          onStageTwoSaveFinished={() => {
            pendingSavesRef.current = Math.max(0, pendingSavesRef.current - 1);
            setSaveInFlightCount(pendingSavesRef.current);
          }} />)}
      </div>
    </section>
  );
}

function Suggestion({ value, format, basis, onUse }: Readonly<{
  value: CommunicationSectionValue;
  format: CommunicationSectionDefinition["format"];
  basis?: CommunicationSuggestion["basis"];
  onUse: () => void;
}>) {
  return <div className="mt-3 rounded-lg border border-border bg-surface-50 p-3">
    <p className="text-xs font-semibold">Sugestão da IA para revisar</p>
    {basis ? <p className="mt-2 text-xs font-semibold text-brand-700">{stageTwoBasisLabel(basis)}</p> : null}
    <p className="mt-2 whitespace-pre-wrap text-sm">{formatEditorValue(value, format) || "Sem conteúdo suficiente para sugerir."}</p>
    {formatEditorValue(value, format).trim() ? <button type="button" onClick={onUse}
      className="mt-3 inline-flex min-h-11 items-center rounded-lg border border-border px-4 text-sm font-semibold">
      Usar no editor
    </button> : null}
  </div>;
}

function Sources({ sources }: Readonly<{ sources: readonly WebSource[] }>) {
  if (!sources.length) return null;
  return <div className="mt-3 text-xs"><p className="font-semibold">Fontes consultadas</p><ul className="mt-1 list-disc pl-5">
    {sources.map((source) => <li key={source.url}><a href={source.url} target="_blank" rel="noopener noreferrer"
      className="text-brand-700 underline">{source.title || source.url}</a></li>)}
  </ul></div>;
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
  return formatEditorValue(section.value, section.format);
}
