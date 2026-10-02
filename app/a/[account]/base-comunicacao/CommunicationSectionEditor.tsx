"use client";

import { useActionState, useEffect, useLayoutEffect, useRef, useState, useTransition } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { FormField, FormFieldLabel, FormFieldHint, FormFieldError } from "@/components/ui/form-field";
import { FeedbackMessage } from "@/components/ui/feedback-message";
import { EmptyState } from "@/components/ui/empty-state";
import { CommunicationSectionCollection, type SectionDetailControls } from "./_components/CommunicationSectionCollection";
import { sectionEditState } from "./_components/section-edit-state";

import type { CommunicationBase, CommunicationSection, CommunicationSectionValue } from "../../../../lib/communication-base/contracts";
import { hasStageTwoContent, type CommunicationSuggestion, type WebSource } from "../../../../lib/communication-base/ai-core";
import { selectStageTwoSectionPresentation, stageTwoBasisLabel, type LocalStageTwoResult } from "../../../../lib/communication-base/stage-two-presentation";
import { communicationSections, type CommunicationSectionKey } from "../../../../lib/communication-base/registry";
import type { CommunicationSectionDefinition } from "../../../../lib/communication-base/registry";
import { formatEditorValue } from "../../../../lib/communication-base/editor-value";
import { isCommunicationSectionSaveLocked } from "../../../../lib/communication-base/editor-save-guard";
import { canInstallGeneralSuggestion, canStartGeneralGeneration, createStageTwoGenerationGate } from "../../../../lib/communication-base/generation-guard";
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
  candidate: { businessName: string | null; businessContext: string | null } | null;
  candidateReadFailed: boolean;
}>) {
  const [state, action] = useActionState(startCommunicationBaseAction, INITIAL_STATE);
  const router = useRouter();
  useEffect(() => {
    if (state.status === "saved") router.refresh();
  }, [router, state.status]);

  return (
    <form action={action} className="rounded-xl border border-border bg-background p-5">
      <input type="hidden" name="account" value={account} />
      <p className="text-sm text-muted-foreground">
        Comece com o que já sabe sobre seu negócio. As demais seções podem ser preenchidas depois.
      </p>
      {candidate?.businessName ? (
        <p className="mt-4 rounded-lg border border-border p-4 text-sm">
          Nome público confirmado: <strong>{candidate.businessName}</strong>. Ele será copiado ao iniciar a Base e poderá ser editado depois.
        </p>
      ) : null}
      {candidate?.businessContext ? (
        <div className="mt-4 rounded-lg border border-border p-4">
          <p className="text-sm font-medium">Contexto da conversa anterior</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Confira se esse texto descreve sua atuação. Ele só será copiado se você confirmar.
          </p>
          <blockquote className="mt-3 whitespace-pre-wrap text-sm">{candidate.businessContext}</blockquote>
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
  stageTwoGenerationInFlight?: boolean;
  onStageTwoGenerationStart?: () => boolean;
  onStageTwoGenerationFinished?: () => void;
  onStageTwoSaveStarted?: () => void;
  onStageTwoSaveFinished?: () => void;
}> & SectionDetailControls) {
  const { account, version, definition, current, canEdit, suggestedSuggestion, generalRevision = 0,
    stageTwoGenerationInFlight = false, onStageTwoGenerationStart, onStageTwoGenerationFinished,
    onStageTwoSaveStarted, onStageTwoSaveFinished, resetRevision, onEditorStateChange, onCancel } = props;
  const [state, action, savePending] = useActionState(saveCommunicationSectionAction, INITIAL_STATE);
  const lastHandledSaveStateRef = useRef(state);
  const startedSavesRef = useRef(0);
  const [submittedVersion, setSubmittedVersion] = useState<number | null>(null);
  const [draft, setDraft] = useState(editorText(current));
  const [dismissedState, setDismissedState] = useState(INITIAL_STATE);
  const priorResetRef = useRef(resetRevision);
  const priorPersistedRef = useRef(editorText(current));
  const lastSyncedSaveRef = useRef(INITIAL_STATE);
  const localRequestRevisionRef = useRef(0);
  const localVersionRef = useRef(version);
  const [aiPending, startAiTransition] = useTransition();
  const [aiMessage, setAiMessage] = useState("");
  const [localSuggestion, setLocalSuggestion] = useState<CommunicationSectionValue | null>(null);
  const [localStageTwoResult, setLocalStageTwoResult] = useState<LocalStageTwoResult | null>(null);
  const [missingQuestion, setMissingQuestion] = useState("");
  const [requiresResearch, setRequiresResearch] = useState(false);
  const router = useRouter();
  const saveLocked = isCommunicationSectionSaveLocked(savePending, state.status, submittedVersion, version);
  const editState = sectionEditState(definition, current, draft);
  useLayoutEffect(() => {
    onEditorStateChange(canEdit && editState.dirty, saveLocked);
  }, [canEdit, editState.dirty, saveLocked, onEditorStateChange]);
  useLayoutEffect(() => {
    localVersionRef.current = version;
    const persisted = editorText(current);
    const reset = priorResetRef.current !== resetRevision;
    const savedRefresh = state.status === "saved" && state !== lastSyncedSaveRef.current &&
      !savePending && submittedVersion !== null && version > submittedVersion;
    const previouslyClean = !sectionEditState(definition, { format: definition.format,
      value: priorPersistedRef.current, origin: "user_reviewed" }, draft).dirty;
    if (reset || savedRefresh || (persisted !== priorPersistedRef.current && previouslyClean)) setDraft(persisted);
    if (reset) setDismissedState(state);
    if (savedRefresh) lastSyncedSaveRef.current = state;
    if (reset || savedRefresh) {
      localRequestRevisionRef.current += 1;
      setLocalSuggestion(null);
      setLocalStageTwoResult(null);
      setMissingQuestion("");
      setAiMessage("");
    }
    priorResetRef.current = resetRevision;
    priorPersistedRef.current = persisted;
  }, [current, definition, draft, resetRevision, savePending, state, submittedVersion, version]);
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
      <article>
        {value ? <p className="whitespace-pre-wrap break-words text-sm leading-6">{value}</p>
          : <EmptyState title="Esta seção ainda não foi preenchida." />}
      </article>
    );
  }

  const fieldId = `communication-${definition.key}`;
  const hintId = `${fieldId}-hint`;
  const saveLockHintId = `${fieldId}-save-lock`;
  const guidance = definition.stage === 1 ? STAGE_ONE_GUIDANCE[definition.key] : null;
  const stageTwoPresentation = selectStageTwoSectionPresentation(localStageTwoResult, generalRevision, suggestedSuggestion);
  const stageTwoSuggestion = stageTwoPresentation.suggestion;
  return (
    <article>
      <form action={action} onSubmit={(event) => {
        if (saveLocked || !editState.valid || !editState.dirty) { event.preventDefault(); return; }
        localRequestRevisionRef.current += 1;
        setSubmittedVersion(version);
        if (definition.stage === 2) {
          startedSavesRef.current += 1;
          onStageTwoSaveStarted?.();
        }
      }} className="space-y-2">
        <input type="hidden" name="account" value={account} />
        <input type="hidden" name="section_key" value={definition.key} />
        <input type="hidden" name="version" value={version} />
        <FormField className="gap-1.5">
        <FormFieldLabel htmlFor={fieldId}>Conteúdo da seção</FormFieldLabel>
        {guidance ? <p className="text-sm text-muted-foreground">{guidance}</p> : null}
        <FormFieldHint id={hintId} className="leading-5">
          {definition.format === "items"
            ? "Escreva um item por linha, até 20 itens de 400 caracteres."
            : definition.format === "faq"
              ? "Escreva uma pergunta e resposta por linha, separadas por |. Até 15 pares."
              : "Até 4.000 caracteres. Você pode voltar e complementar depois."}
        </FormFieldHint>
        <Textarea
          id={fieldId}
          name="value"
          rows={definition.format === "text" ? 5 : 6}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          readOnly={saveLocked}
          placeholder={guidance ?? undefined}
          maxLength={definition.format === "text" ? 4000 : undefined}
          aria-invalid={!editState.valid}
          aria-describedby={`${hintId}${!editState.valid ? ` ${fieldId}-error` : ""}${saveLocked ? ` ${saveLockHintId}` : ""}`}
          className="min-h-40 resize-y text-sm"
        />
        {!editState.valid ? <FormFieldError id={`${fieldId}-error`}>Confira o formato e os limites indicados antes de salvar.</FormFieldError> : null}
        </FormField>
        {saveLocked ? <p id={saveLockHintId} role="status" className="text-xs text-muted-foreground">
          Salvando esta seção. Aguarde para continuar a edição.
        </p> : null}
        <div className="sticky bottom-0 flex flex-wrap gap-2 border-t border-border bg-background py-2 [&>button]:px-3 [&>button]:py-1">
          <SubmitButton label="Salvar" pendingLabel="Salvando..." disabled={saveLocked || !editState.dirty || !editState.valid} busy={saveLocked} />
          <Button variant="secondary" className="min-h-11" disabled={saveLocked} onClick={onCancel}>Cancelar</Button>
        </div>
        {!savePending && state !== dismissedState ? <ActionFeedback state={state} /> : null}
      </form>
      {definition.stage === 1 ? (
        <div className="mt-3 border-t border-border pt-3">
          <p className="text-xs leading-5 text-muted-foreground">
            A IA trabalha apenas com o texto desta seção que você enviar. Confira a sugestão antes de usá-la; salvar continua sendo sua decisão.
          </p>
          <button type="button" disabled={saveLocked || aiPending || !draft.trim()}
            onClick={() => startAiTransition(async () => {
              const requestRevision = ++localRequestRevisionRef.current;
              const isCurrent = () => canInstallGeneralSuggestion(version, localVersionRef.current,
                requestRevision, localRequestRevisionRef.current);
              setAiMessage("");
              setLocalSuggestion(null);
              setMissingQuestion("");
              try {
                const result = await assistCommunicationSectionAction({ account, key: definition.key, userText: draft, version });
                if (!isCurrent()) return;
                if (result.ok) {
                  setLocalSuggestion(result.suggestion);
                  setMissingQuestion(result.missingQuestion);
                } else setAiMessage(result.message);
              } catch {
                if (isCurrent()) setAiMessage("A assistência está indisponível agora. Continue a edição manual.");
              }
            })}
            className="mt-2 inline-flex min-h-11 items-center justify-center rounded-lg border border-border px-3 py-1 text-sm font-medium text-foreground disabled:cursor-not-allowed disabled:opacity-60">
            {aiPending ? "Preparando sugestão..." : "Ajudar com este texto usando IA"}
          </button>
          {missingQuestion ? <p className="mt-3 text-sm">Informação a confirmar: {missingQuestion}</p> : null}
          {localSuggestion !== null ? <Suggestion value={localSuggestion} format={definition.format}
            disabled={saveLocked} onUse={() => setDraft(formatEditorValue(localSuggestion, definition.format))} /> : null}
          {aiMessage ? <p role="alert" className="mt-2 text-sm text-state-error">{aiMessage}</p> : null}
        </div>
      ) : (
        <div className="mt-3 border-t border-border pt-3">
          <p className="text-xs leading-5 text-muted-foreground">
            A IA revisa apenas {definition.label} usando os dados confirmados pertinentes e o texto salvo desta seção. As demais seções permanecem como estão.
          </p>
          <label className="mt-2 flex min-h-11 items-center gap-2 text-sm">
            <input type="checkbox" checked={requiresResearch} disabled={saveLocked}
              onChange={(event) => setRequiresResearch(event.target.checked)}
              className="h-5 w-5 accent-brand-700" />
            Preciso de pesquisa atual ou local para esta seção
          </label>
          <button type="button" disabled={saveLocked || aiPending || stageTwoGenerationInFlight}
            onClick={() => {
              if (!onStageTwoGenerationStart?.()) {
                setAiMessage("Aguarde a geração em andamento antes de revisar esta seção.");
                return;
              }
              startAiTransition(async () => {
                const requestRevision = ++localRequestRevisionRef.current;
                const isCurrent = () => canInstallGeneralSuggestion(version, localVersionRef.current,
                  requestRevision, localRequestRevisionRef.current);
                setAiMessage("");
                setLocalStageTwoResult(null);
                try {
                  const result = await generateCommunicationIntelligenceAction({
                    account, target: { kind: "section", key: definition.key as CommunicationSectionKey }, version,
                    requiresCurrentResearch: requiresResearch,
                  });
                  if (!isCurrent()) return;
                  if (result.ok) {
                    setLocalStageTwoResult({
                      generalRevision,
                      suggestion: result.draft.suggestions[0] ?? null,
                      sources: result.draft.sources,
                    });
                  } else setAiMessage(result.message);
                } catch {
                  if (isCurrent()) setAiMessage("A revisão está indisponível agora. Continue a edição manual.");
                } finally {
                  onStageTwoGenerationFinished?.();
                }
              });
            }}
            className="mt-2 inline-flex min-h-11 items-center justify-center rounded-lg border border-border px-3 py-1 text-sm font-medium text-foreground disabled:cursor-wait disabled:opacity-60">
            {aiPending ? "Preparando sugestão..." : "Revisar esta seção com IA"}
          </button>
          {stageTwoGenerationInFlight && !aiPending ? <p role="status" className="mt-2 text-xs text-muted-foreground">
            Aguarde a geração em andamento antes de revisar esta seção.
          </p> : null}
          {stageTwoSuggestion !== null ? <Suggestion value={stageTwoSuggestion.value} format={definition.format}
            basis={stageTwoSuggestion.basis}
            disabled={saveLocked} onUse={() => setDraft(formatEditorValue(stageTwoSuggestion.value, definition.format))} /> : null}
          <Sources sources={stageTwoPresentation.sources} />
          {aiMessage ? <p role="alert" className="mt-2 text-sm text-state-error">{aiMessage}</p> : null}
        </div>
      )}
    </article>
  );
}

export function CommunicationStageOne({ account, base, canEdit }: Readonly<{
  account: string; base: CommunicationBase; canEdit: boolean;
}>) {
  return <CommunicationSectionCollection definitions={communicationSections.filter((section) => section.stage === 1)} base={base}
    renderDetail={(definition, controls) => <CommunicationSectionEditor {...controls}
      account={account} version={base.version} definition={definition}
      current={base.sections[definition.key as CommunicationSectionKey]} canEdit={canEdit} />} />;
}

export function CommunicationStageTwo({ account, base, canEdit }: Readonly<{
  account: string;
  base: CommunicationBase;
  canEdit: boolean;
}>) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  const [messageIsError, setMessageIsError] = useState(false);
  const [requiresResearch, setRequiresResearch] = useState(false);
  const [suggestions, setSuggestions] = useState<Partial<Record<string, CommunicationSuggestion>>>({});
  const [generalRevision, setGeneralRevision] = useState(0);
  const [sources, setSources] = useState<readonly WebSource[]>([]);
  const [saveInFlightCount, setSaveInFlightCount] = useState(0);
  const [generationInFlight, setGenerationInFlight] = useState(false);
  const generationGateRef = useRef(createStageTwoGenerationGate());
  const currentVersionRef = useRef(base.version);
  const saveRevisionRef = useRef(0);
  const pendingSavesRef = useRef(0);
  const tryStartStageTwoGeneration = () => {
    if (!generationGateRef.current.tryStart()) return false;
    setGenerationInFlight(true);
    return true;
  };
  const finishStageTwoGeneration = () => {
    generationGateRef.current.finish();
    setGenerationInFlight(false);
  };
  useLayoutEffect(() => { currentVersionRef.current = base.version; }, [base.version]);
  const stageTwo = communicationSections.filter((section) => section.stage === 2);
  return (
    <section aria-label="Inteligência de comunicação" className="space-y-3">
      <div className="space-y-2">
        {canEdit ? <div className="rounded-lg border border-border bg-background p-3">
          <p className="text-sm text-muted-foreground">
            A ação geral prepara sugestões para as sete seções da Etapa 2. Confira cada uma antes de usá-la ou salvar.
          </p>
          <label className="mt-2 flex min-h-11 items-center gap-2 text-sm">
            <input type="checkbox" checked={requiresResearch} onChange={(event) => setRequiresResearch(event.target.checked)}
              className="h-5 w-5 accent-brand-700" />
            Preciso de pesquisa atual ou local para esta geração
          </label>
          <button type="button" disabled={pending || generationInFlight || saveInFlightCount > 0}
            onClick={() => {
              if (!canStartGeneralGeneration(pendingSavesRef.current)) return;
              if (!tryStartStageTwoGeneration()) {
                setMessageIsError(true);
                setMessage("Aguarde a revisão em andamento antes de gerar sugestões para toda a Etapa 2.");
                return;
              }
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
                } finally {
                  finishStageTwoGeneration();
                }
              });
            }}
            className="mt-2 inline-flex min-h-11 items-center justify-center rounded-lg border border-border px-3 py-1 text-sm font-medium text-foreground disabled:cursor-wait disabled:opacity-60">
            {pending ? "Preparando sugestões..." : hasStageTwoContent(base) ? "Atualizar inteligência com IA" : "Gerar inteligência com IA"}
          </button>
          {generationInFlight && !pending ? <p role="status" className="mt-2 text-xs text-muted-foreground">
            Aguarde a revisão em andamento antes de gerar sugestões para toda a Etapa 2.
          </p> : null}
          {message ? <p role={messageIsError ? "alert" : "status"} className="mt-2 text-sm">{message}</p> : null}
          <Sources sources={sources} />
        </div> : null}
      </div>
      <CommunicationSectionCollection definitions={stageTwo} base={base} suggestedKeys={Object.keys(suggestions)}
        renderDetail={(section, controls) => <CommunicationSectionEditor {...controls}
          account={account} version={base.version} definition={section} current={base.sections[section.key as CommunicationSectionKey]}
          canEdit={canEdit} suggestedSuggestion={suggestions[section.key]} generalRevision={generalRevision}
          stageTwoGenerationInFlight={generationInFlight}
          onStageTwoGenerationStart={tryStartStageTwoGeneration}
          onStageTwoGenerationFinished={finishStageTwoGeneration}
          onStageTwoSaveStarted={() => {
            saveRevisionRef.current += 1;
            pendingSavesRef.current += 1;
            setSaveInFlightCount(pendingSavesRef.current);
          }}
          onStageTwoSaveFinished={() => {
            pendingSavesRef.current = Math.max(0, pendingSavesRef.current - 1);
            setSaveInFlightCount(pendingSavesRef.current);
          }} />} />
    </section>
  );
}

function Suggestion({ value, format, basis, disabled = false, onUse }: Readonly<{
  value: CommunicationSectionValue;
  format: CommunicationSectionDefinition["format"];
  basis?: CommunicationSuggestion["basis"];
  disabled?: boolean;
  onUse: () => void;
}>) {
  return <div className="mt-3 rounded-lg border border-border bg-muted/30 p-3">
    <p className="text-xs font-semibold">Sugestão da IA para revisar</p>
    {basis ? <p className="mt-2 text-xs font-semibold text-brand-700">{stageTwoBasisLabel(basis)}</p> : null}
    <p className="mt-2 whitespace-pre-wrap text-sm">{formatEditorValue(value, format) || "Sem conteúdo suficiente para sugerir."}</p>
    {formatEditorValue(value, format).trim() ? <button type="button" onClick={onUse} disabled={disabled}
      className="mt-3 inline-flex min-h-11 items-center rounded-lg border border-border px-4 text-sm font-semibold disabled:cursor-wait disabled:opacity-60">
      Usar no editor
    </button> : null}
  </div>;
}

function Sources({ sources }: Readonly<{ sources: readonly WebSource[] }>) {
  if (!sources.length) return null;
  return <details className="mt-3 text-xs"><summary className="flex min-h-11 cursor-pointer items-center font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Fontes consultadas ({sources.length})</summary><ul className="mt-1 list-disc pl-5">
    {sources.map((source) => <li key={source.url}><a href={source.url} target="_blank" rel="noopener noreferrer"
      className="inline-block min-h-11 break-all py-2 text-brand-700 underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">{source.title || source.url}</a></li>)}
  </ul></details>;
}

function SubmitButton({ label, pendingLabel, disabled = false, busy = false }: Readonly<{
  label: string; pendingLabel: string; disabled?: boolean; busy?: boolean;
}>) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      disabled={pending || disabled}
      className="min-h-11 !bg-brand-700 hover:!bg-brand-700/95"
    >
      {pending || busy ? pendingLabel : label}
    </Button>
  );
}

function ActionFeedback({ state }: Readonly<{ state: CommunicationActionState }>) {
  if (state.status === "idle") return null;
  return (
    <FeedbackMessage tone={state.status === "error" ? "error" : "success"}>
      {state.message}
    </FeedbackMessage>
  );
}

function editorText(section: CommunicationSection | undefined): string {
  if (!section) return "";
  return formatEditorValue(section.value, section.format);
}
