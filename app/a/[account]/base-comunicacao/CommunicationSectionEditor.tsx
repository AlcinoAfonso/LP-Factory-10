"use client";

import { useActionState, useEffect, useLayoutEffect, useRef, useState, useTransition, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { FormField, FormFieldLabel, FormFieldHint, FormFieldError } from "@/components/ui/form-field";
import { FeedbackMessage } from "@/components/ui/feedback-message";
import { EmptyState } from "@/components/ui/empty-state";
import { CommunicationSectionCollection, type SectionDetailControls } from "./_components/CommunicationSectionCollection";
import { getSectionGuidance } from "../../../../lib/communication-base/section-guidance";
import { BusinessFactsFields } from "./_components/BusinessFactsFields";
import { StructuredSectionFields, StructuredSectionContent } from "./_components/StructuredSectionFields";
import { editorDraftValue } from "../../../../lib/communication-base/manual-editor-value";
import { sectionEditState } from "./_components/section-edit-state";

import type { CommunicationBase, CommunicationSection, CommunicationSectionValue } from "../../../../lib/communication-base/contracts";
import { hasStageTwoContent, type CommunicationSuggestion, type WebSource } from "../../../../lib/communication-base/ai-core";
import { selectStageTwoSectionPresentation, stageTwoBasisLabel, type LocalStageTwoResult } from "../../../../lib/communication-base/stage-two-presentation";
import { communicationSections, getCommunicationSection, isBusinessLongTextSection, type CommunicationSectionKey } from "../../../../lib/communication-base/registry";
import { communicationTextLimit } from "../../../../lib/communication-base/policy";
import type { CommunicationSectionDefinition } from "../../../../lib/communication-base/registry";
import { formatEditorValue } from "../../../../lib/communication-base/editor-value";
import { isCommunicationSectionSaveLocked } from "../../../../lib/communication-base/editor-save-guard";
import { canInstallGeneralSuggestion, canStartGeneralGeneration, createStageTwoGenerationGate } from "../../../../lib/communication-base/generation-guard";
import {
  saveCommunicationSectionAction,
  startCommunicationBaseAction,
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

export function StartCommunicationBaseForm({ account, candidate, candidateReadFailed, niche, structured = false }: Readonly<{
  account: string;
  candidate: { businessName: string | null; businessContext: string | null } | null;
  candidateReadFailed: boolean;
  niche: { taxonId: string | null; name: string; revision: string } | null;
  structured?: boolean;
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
      {structured ? <div className="mt-4 space-y-2 rounded-lg border border-border p-4">
        <input type="hidden" name="base_niche" value={niche?.revision ?? ""} />
        <p className="text-sm">{niche ? <>Nicho identificado: <strong>{niche.name}</strong>. Ele aparece apenas para consulta e não poderá ser alterado na seção Atuação.</> : "Nenhum nicho oficial foi identificado. Você pode iniciar a Base com o entendimento disponível do negócio e complementá-la depois."}</p>
        <label className="flex min-h-11 items-center gap-3 text-sm">
          <input type="checkbox" name="confirm_base_context" required className="h-5 w-5 shrink-0 accent-brand-700" />
          {niche ? "Confirmo o nicho apresentado para iniciar minha Base." : "Confirmo o entendimento disponível do meu negócio para iniciar minha Base."}
        </label>
      </div> : null}
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
  canGenerate?: boolean;
  structured?: boolean;
  suggestedSuggestion?: CommunicationSuggestion;
  generalRevision?: number;
  stageTwoGenerationInFlight?: boolean;
  onStageTwoGenerationStart?: () => boolean;
  onStageTwoGenerationFinished?: () => void;
  onStageTwoSaveStarted?: () => void;
  onStageTwoSaveFinished?: () => void;
  nicheLabel?: string;
}> & SectionDetailControls) {
  const { account, version, definition, current, canEdit, structured = false, suggestedSuggestion, generalRevision = 0,
    stageTwoGenerationInFlight = false, onStageTwoGenerationStart, onStageTwoGenerationFinished,
    onStageTwoSaveStarted, onStageTwoSaveFinished, nicheLabel, canGenerate = false, resetRevision, onEditorStateChange, onCancel, onSaved } = props;
  const [state, action, savePending] = useActionState(saveCommunicationSectionAction, INITIAL_STATE);
  const lastHandledSaveStateRef = useRef(state);
  const lastClosedSaveRef = useRef(state);
  const startedSavesRef = useRef(0);
  const [submittedVersion, setSubmittedVersion] = useState<number | null>(null);
  const [draft, setDraft] = useState(editorText(current, structured));
  const [factsDraft, setFactsDraft] = useState(JSON.stringify(current?.facts ?? []));
  const priorSectionRef = useRef(current);
  const [dismissedState, setDismissedState] = useState(INITIAL_STATE);
  const priorResetRef = useRef(resetRevision);
  const priorPersistedRef = useRef(editorText(current, structured));
  const lastSyncedSaveRef = useRef(INITIAL_STATE);
  const localRequestRevisionRef = useRef(0);
  const localVersionRef = useRef(version);
  const [aiPending, startAiTransition] = useTransition();
  const [aiMessage, setAiMessage] = useState("");
  const [assistanceUsed, setAssistanceUsed] = useState(false);
  const [aiNotice, setAiNotice] = useState("");
  const [localStageTwoResult, setLocalStageTwoResult] = useState<LocalStageTwoResult | null>(null);
  const [requiresResearch, setRequiresResearch] = useState(false);
  const router = useRouter();
  const saveLocked = isCommunicationSectionSaveLocked(savePending, state.status, submittedVersion, version);
  const editState = sectionEditState(definition, current, draft, structured, structured && definition.stage === 1 ? factsDraft : undefined);
  useLayoutEffect(() => {
    onEditorStateChange(canEdit && editState.dirty, saveLocked);
  }, [canEdit, editState.dirty, saveLocked, onEditorStateChange]);
  useLayoutEffect(() => {
    localVersionRef.current = version;
    const persisted = editorText(current, structured);
    const reset = priorResetRef.current !== resetRevision;
    const savedRefresh = state.status === "saved" && state !== lastSyncedSaveRef.current &&
      !savePending && submittedVersion !== null && version > submittedVersion;
    const previouslyClean = !sectionEditState(definition, priorSectionRef.current, draft, structured, structured && definition.stage === 1 ? factsDraft : undefined).dirty;
    if (reset || savedRefresh || (current !== priorSectionRef.current && previouslyClean)) {
      setDraft(persisted); setFactsDraft(JSON.stringify(current?.facts ?? []));
    }
    priorSectionRef.current = current;
    if (reset) setDismissedState(state);
    if (savedRefresh) lastSyncedSaveRef.current = state;
    if (reset || savedRefresh) {
      localRequestRevisionRef.current += 1;
      setLocalStageTwoResult(null);
      setAiMessage("");
      setAiNotice("");
      setAssistanceUsed(false);
    }
    priorResetRef.current = resetRevision;
    priorPersistedRef.current = persisted;
  }, [current, definition, draft, factsDraft, resetRevision, savePending, state, structured, submittedVersion, version]);
  useEffect(() => {
    if (state === lastHandledSaveStateRef.current) return;
    lastHandledSaveStateRef.current = state;
    if (startedSavesRef.current > 0) {
      startedSavesRef.current -= 1;
      onStageTwoSaveFinished?.();
    }
    if (state.status === "saved") router.refresh();
  }, [router, state, onStageTwoSaveFinished]);
  useEffect(() => {
    if (state.status !== "saved" || state === lastClosedSaveRef.current || savePending || submittedVersion === null || version <= submittedVersion) return;
    lastClosedSaveRef.current = state;
    onSaved();
  }, [state, savePending, submittedVersion, version, onSaved]);

  const longText = isBusinessLongTextSection(definition);
  const value = editorText(current, structured);
  if (!canEdit) {
    return (
      <article>
        {structured && definition.key === "business_context" ? <p className="mb-3 text-sm text-muted-foreground">Nicho: {nicheLabel}. Apenas para consulta nesta seção.</p> : null}
        {current && (typeof current.value === "string" ? current.value.trim() : current.value.length) ? (structured ? <StructuredSectionContent value={current.value} /> : <p className="whitespace-pre-wrap break-words text-sm leading-6">{value}</p>)
          : <EmptyState title="Esta seção ainda não foi preenchida." />}
        {current?.facts?.length ? <dl className="mt-3 space-y-2">{current.facts.map((fact, i) => <div key={i}><dt className="text-sm font-medium">{fact.label}</dt><dd className="whitespace-pre-wrap break-words text-sm">{fact.value}</dd></div>)}</dl> : null}
      </article>
    );
  }

  const fieldId = `communication-${definition.key}`;
  const hintId = `${fieldId}-hint`;
  const saveLockHintId = `${fieldId}-save-lock`;
  const guidance = structured && longText ? getSectionGuidance(definition.key)?.description
    : !structured && definition.stage === 1 ? STAGE_ONE_GUIDANCE[definition.key] : null;
  const stageTwoPresentation = selectStageTwoSectionPresentation(localStageTwoResult, generalRevision, suggestedSuggestion);
  const stageTwoSuggestion = stageTwoPresentation.suggestion;
  return (
    <article>
      {structured && definition.key === "business_context" ? <p className="mb-3 text-sm text-muted-foreground">Nicho: {nicheLabel}. Apenas para consulta nesta seção.</p> : null}
      <form action={action} onSubmit={(event) => {
        if (saveLocked || !editState.valid || !editState.dirty) { event.preventDefault(); return; }
        localRequestRevisionRef.current += 1;
        setSubmittedVersion(version);
        if (definition.stage === 2) {
          startedSavesRef.current += 1;
          onStageTwoSaveStarted?.();
        }
      }} className={structured && definition.key === "business_name" ? "space-y-0.5" : "space-y-2"}>
        <input type="hidden" name="account" value={account} />
        <input type="hidden" name="section_key" value={definition.key} />
        <input type="hidden" name="version" value={version} />
        <input type="hidden" name="structured_value" value={String(structured)} />
        <FormField className={structured && definition.key === "business_name" ? "grid-cols-[repeat(auto-fit,minmax(min(100%,8rem),1fr))] items-center gap-2 sm:grid-cols-[minmax(0,2fr)_minmax(0,5fr)]" : "gap-1.5"}>
        <FormFieldLabel htmlFor={fieldId} className={longText ? "sr-only" : "font-normal"}>{longText ? definition.label : structured && definition.key === "business_name" ? "Nome público" : "Conteúdo da seção"}</FormFieldLabel>
        {guidance && (!longText || !structured) ? <p className="text-sm text-muted-foreground">{guidance}</p> : null}
        {!longText ? <FormFieldHint id={hintId} className={structured && definition.key === "business_name" ? "sr-only" : "leading-5"}>
          {definition.format === "items"
            ? structured ? "Até 20 itens de 400 caracteres. Preserve parágrafos e subtítulos dentro de cada item." : "Escreva um item por linha, até 20 itens de 400 caracteres."
            : definition.format === "faq"
              ? structured ? "Até 15 pares. Preencha a pergunta e a resposta nos campos correspondentes." : "Escreva uma pergunta e resposta por linha, separadas por |. Até 15 pares."
              : "Até 4.000 caracteres. Você pode voltar e complementar depois."}
        </FormFieldHint> : null}
        {structured && definition.key === "business_name" ? <Textarea id={fieldId} name="value" rows={1} value={draft} maxLength={4000} readOnly={saveLocked} className="!min-h-11 resize-y" aria-describedby={hintId} onChange={(event) => setDraft(event.target.value)} /> : structured && (definition.format === "items" || definition.format === "faq") ? <StructuredSectionFields format={definition.format} draft={draft} onChange={setDraft} disabled={saveLocked} id={fieldId} /> : <Textarea
          id={fieldId}
          name="value"
          rows={definition.format === "text" ? 5 : 6}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          readOnly={saveLocked}
          placeholder={guidance ?? undefined}
          maxLength={definition.format === "text" ? communicationTextLimit(definition) : undefined}
          aria-invalid={!editState.valid}
          aria-describedby={`${hintId}${!editState.valid ? ` ${fieldId}-error` : ""}${saveLocked ? ` ${saveLockHintId}` : ""}`}
          className={longText ? "min-h-[min(24rem,50dvh)] resize-y text-sm font-normal leading-6 placeholder:font-normal placeholder:text-muted-foreground" : "min-h-40 resize-y text-sm"}
        />}
        {longText ? <FormFieldHint id={hintId} className="text-right font-normal tabular-nums">{draft.length.toLocaleString("pt-BR")} / {communicationTextLimit(definition).toLocaleString("pt-BR")}</FormFieldHint> : null}
        {!editState.valid ? <FormFieldError id={`${fieldId}-error`}>Confira o formato e os limites indicados antes de salvar.</FormFieldError> : null}
        </FormField>
        {structured && definition.stage === 1 && definition.key === "business_name" ? <BusinessFactsFields draft={factsDraft} onChange={setFactsDraft} disabled={saveLocked} id={fieldId + "-facts"} identification /> : null}
        {saveLocked ? <p id={saveLockHintId} role="status" className="text-xs text-muted-foreground">
          Salvando esta seção. Aguarde para continuar a edição.
        </p> : null}
      {canGenerate && getCommunicationSection(definition.key) && definition.stage === 2 ? (
        <div className="mt-3 border-t border-border pt-3">
          {assistanceUsed ? <p className="text-xs font-normal leading-5 text-muted-foreground">
            A IA revisa apenas {definition.label} usando os dados confirmados pertinentes e o texto salvo desta seção. As demais seções permanecem como estão.
          </p> : null}
          <label className="mt-2 flex min-h-11 items-center gap-2 text-sm">
            <input type="checkbox" checked={requiresResearch} disabled={saveLocked}
              onChange={(event) => setRequiresResearch(event.target.checked)}
              className="h-5 w-5 accent-brand-700" />
            Preciso de pesquisa atual ou local para esta seção
          </label>
          <button type="button" disabled={saveLocked || aiPending || stageTwoGenerationInFlight}
            onClick={() => {
              setAssistanceUsed(true);
              if (!onStageTwoGenerationStart?.()) {
                setAiMessage("Aguarde a geração em andamento antes de revisar esta seção.");
                return;
              }
              startAiTransition(async () => {
                const requestRevision = ++localRequestRevisionRef.current;
                const isCurrent = () => canInstallGeneralSuggestion(version, localVersionRef.current,
                  requestRevision, localRequestRevisionRef.current);
                setAiMessage("");
                setAiNotice("");
                setLocalStageTwoResult(null);
                try {
                  const result = await generateCommunicationIntelligenceAction({
                    account, target: { kind: "section", key: definition.key as CommunicationSectionKey }, version,
                    requiresCurrentResearch: requiresResearch,
                  });
                  if (!isCurrent()) return;
                  if (result.ok) {
                    setAiNotice(result.notice ?? "");
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
          {stageTwoSuggestion !== null ? <Suggestion value={stageTwoSuggestion.value} original={draft} structured={structured} format={definition.format}
            basis={stageTwoSuggestion.basis}
            disabled={saveLocked} onUse={() => setDraft(editorDraftValue(stageTwoSuggestion.value, definition.format, structured))} /> : null}
          <Sources sources={stageTwoPresentation.sources} />
          {aiNotice && localStageTwoResult?.generalRevision === generalRevision ? <FeedbackMessage tone="warning" className="mt-2">{aiNotice}</FeedbackMessage> : null}
          {aiMessage ? <p role="alert" className="mt-2 text-sm text-state-error">{aiMessage}</p> : null}
        </div>
      ) : null}
        <div className="sticky bottom-0 flex flex-wrap items-center justify-between gap-2 border-t border-border bg-background py-2 [&>button]:px-3 [&>button]:py-1">
          <Button variant="secondary" className="min-h-11 px-0 font-normal !text-foreground underline underline-offset-4" disabled={saveLocked} onClick={onCancel}>Cancelar</Button>
          <SubmitButton label="Salvar" pendingLabel="Salvando..." disabled={saveLocked || !editState.dirty || !editState.valid} busy={saveLocked} />
        </div>
        {!savePending && state !== dismissedState ? <ActionFeedback state={state} /> : null}
      </form>
    </article>
  );
}

export function CommunicationStageOne({ account, base, canEdit, structured = false, definitions = communicationSections, nicheLabel }: Readonly<{
  account: string; base: CommunicationBase; canEdit: boolean; structured?: boolean; definitions?: readonly CommunicationSectionDefinition[]; nicheLabel?: string;
}>) {
  return <CommunicationSectionCollection definitions={definitions.filter((section) => section.stage === 1)} base={base} showGuidance={structured}
    renderDetail={(definition, controls) => <CommunicationSectionEditor {...controls}
      account={account} version={base.version} definition={definition}
      current={base.sections[definition.key as CommunicationSectionKey]} canEdit={canEdit} structured={structured} nicheLabel={nicheLabel} />} />;
}

export function CommunicationStageTwo({ account, base, canEdit, canGenerate = false, nicheControl, structured = false, definitions = communicationSections }: Readonly<{
  account: string;
  base: CommunicationBase;
  canEdit: boolean;
  canGenerate?: boolean;
  nicheControl?: ReactNode;
  structured?: boolean;
  definitions?: readonly CommunicationSectionDefinition[];
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
  const stageTwo = definitions.filter((section) => section.stage === 2);
  return (
    <section aria-label="Inteligência de comunicação" className="space-y-2">
      <div className="space-y-2">
        {canEdit && !canGenerate ? <div className="rounded-lg border border-border px-3 py-2">
          <p className="text-sm text-muted-foreground">Defina e confirme um nicho oficial para gerar sugestões com IA. A edição manual continua disponível.</p>
          {nicheControl}
        </div> : null}
        {canEdit && canGenerate ? <div className="rounded-lg border border-border bg-background px-3 py-2">
          <p className="text-xs leading-5 text-muted-foreground">
            Sugestões para as sete seções da Etapa 2. Revise cada uma antes de usar ou salvar.
          </p>
          <label className="mt-0.5 flex min-h-11 items-center gap-2 text-sm sm:inline-flex">
            <input type="checkbox" checked={requiresResearch} onChange={(event) => setRequiresResearch(event.target.checked)}
              className="h-5 w-5 shrink-0 accent-brand-700" />
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
                    setMessage(["Sugestões prontas para revisão. Nenhuma seção foi salva automaticamente.", result.notice].filter(Boolean).join(" "));
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
            className="mt-0.5 inline-flex min-h-11 items-center justify-center rounded-lg border border-border px-2 py-1 text-xs font-medium leading-4 text-foreground disabled:cursor-wait disabled:opacity-60 sm:ml-3 sm:mt-0">
            {pending ? "Preparando sugestões..." : hasStageTwoContent(base) ? "Atualizar inteligência com IA" : "Gerar inteligência com IA"}
          </button>
          {generationInFlight && !pending ? <p role="status" className="mt-2 text-xs text-muted-foreground">
            Aguarde a revisão em andamento antes de gerar sugestões para toda a Etapa 2.
          </p> : null}
          {message ? <p role={messageIsError ? "alert" : "status"} className="mt-2 text-sm">{message}</p> : null}
          <Sources sources={sources} />
        </div> : null}
      </div>
      <CommunicationSectionCollection definitions={stageTwo} base={base} showGuidance={structured} suggestedKeys={Object.keys(suggestions)}
        renderDetail={(section, controls) => <CommunicationSectionEditor {...controls}
          account={account} version={base.version} definition={section} current={base.sections[section.key as CommunicationSectionKey]}
          canEdit={canEdit} canGenerate={canGenerate} structured={structured} suggestedSuggestion={suggestions[section.key]} generalRevision={generalRevision}
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

function Suggestion({ value, original, structured, format, basis, disabled = false, onUse }: Readonly<{
  value: CommunicationSectionValue;
  original: string;
  structured: boolean;
  format: CommunicationSectionDefinition["format"];
  basis?: CommunicationSuggestion["basis"];
  disabled?: boolean;
  onUse: () => void;
}>) {
  const unchanged = editorDraftValue(value, format, structured).trim() === original.trim();
  if (unchanged) return <p role="status" className="mt-3 text-sm text-muted-foreground">A versão sugerida é igual ao texto atual. Nenhuma melhoria foi identificada.</p>;
  return <div className="mt-3 border-t border-border pt-3">
    <p className="text-sm font-normal">Versão sugerida</p>
    <p className="mt-1 text-xs text-muted-foreground">Revise antes de usar. A sugestão só será salva quando você clicar em Salvar.</p>
    {basis ? <p className="mt-2 text-xs font-normal text-muted-foreground">{stageTwoBasisLabel(basis)}</p> : null}
    <p className="mt-2 whitespace-pre-wrap text-sm">{formatEditorValue(value, format) || "Sem conteúdo suficiente para sugerir."}</p>
    {formatEditorValue(value, format).trim() ? <button type="button" onClick={onUse} disabled={disabled}
      className="mt-3 inline-flex min-h-11 items-center text-sm font-normal text-brand-700 underline dark:text-primary underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-wait disabled:opacity-60">
      Usar esta versão
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
      className="min-h-11 !bg-brand-700 !text-surface-base hover:!bg-brand-700/95"
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

function editorText(section: CommunicationSection | undefined, structured = false): string {
  if (!section) return "";
  return editorDraftValue(section.value, section.format, structured);
}
