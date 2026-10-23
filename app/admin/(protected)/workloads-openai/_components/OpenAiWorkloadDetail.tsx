"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Select } from "@/components/ui/select";
import { FormField, FormFieldLabel, FormFieldHint } from "@/components/ui/form-field";
import { listOpenAiServiceTiers, isEligibleOpenAiServiceTier, isValidOpenAiServiceTierSnapshot, openAiServiceTierLabel } from "@/openai-workloads/service-tier";

import { AdminStatusBadge } from "@/components/admin/AdminStatusBadge";
import type {
  OpenAiAdministrativeConfigurationUnit,
  OpenAiAdministrativeConfigurationValue,
  OpenAiAdministrativeRevision,
  OpenAiReasoningEffort,
  OpenAiServiceTier,
  OpenAiWorkloadConfigurationOptions,
} from "@/openai-workloads";
import {
  activateOpenAiConfigurationRevisionAction,
  discardOpenAiConfigurationCandidateAction,
  proveAndPromoteOpenAiConfigurationCandidateAction,
  rollbackOpenAiConfigurationRevisionAction,
  saveOpenAiConfigurationCandidateAction,
  type OpenAiOperationalActionState,
} from "../actions";

type ActionContext = "save" | "discard" | "proof" | "activation" | "rollback";
type OperationalAction = (
  state: OpenAiOperationalActionState,
  formData: FormData,
) => Promise<OpenAiOperationalActionState>;

const initialState: OpenAiOperationalActionState = {
  status: "idle",
  code: null,
  message: "",
  configurationVersion: null,
};

const effortLabels: Record<string, string> = {
  none: "Nenhum",
  low: "Baixo",
  medium: "Médio",
  high: "Alto",
  xhigh: "Extra-alto",
  max: "Máximo",
};

const eventLabels = {
  bootstrap: "Configuração inicial",
  activate: "Ativação",
  rollback: "Rollback",
} as const;

const selectClassName =
  "mt-1 min-h-11 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus-visible:ring-4 focus-visible:ring-brand-600/30 disabled:cursor-not-allowed disabled:opacity-60";
const primaryButtonClassName =
  "inline-flex min-h-11 items-center justify-center rounded-md bg-brand-700 px-4 py-2 text-sm font-medium text-white outline-none transition hover:bg-brand-dark-800 focus-visible:ring-4 focus-visible:ring-brand-600/30 disabled:cursor-not-allowed disabled:opacity-60";
const secondaryButtonClassName =
  "inline-flex min-h-11 items-center justify-center rounded-md border border-border bg-background px-4 py-2 text-sm font-medium text-foreground outline-none transition hover:bg-muted focus-visible:ring-4 focus-visible:ring-brand-600/30 disabled:cursor-not-allowed disabled:opacity-60";

export function OpenAiWorkloadDetail({
  unit,
  label,
  options,
  catalogAvailable,
  onDirtyChange,
}: Readonly<{
  unit: OpenAiAdministrativeConfigurationUnit;
  label: string;
  options: OpenAiWorkloadConfigurationOptions | undefined;
  catalogAvailable: boolean;
  onDirtyChange?: (dirty: boolean) => void;
}>) {
  const candidateEligible = unit.candidate && options
    ? configurationIsEligible(options, unit.candidate)
    : false;

  return (
    <article className="min-w-0 rounded-lg border border-border bg-card p-4 shadow-card sm:p-5">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
          <h4 className="mt-1 break-all font-mono text-xs font-semibold text-foreground">{unit.workload}</h4>
        </div>
        <AdminStatusBadge tone={unit.pendingRevision ? "warning" : unit.candidate ? "neutral" : "success"}>
          {unit.pendingRevision ? "Aguardando ativação" : unit.candidate ? "Candidata salva" : "Ativa estável"}
        </AdminStatusBadge>
      </header>

      <ActiveRevision revision={unit.activeRevision} />

      <section className="mt-5 border-t border-border pt-5" aria-label="Candidata editável">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h5 className="text-sm font-semibold text-foreground">Candidata editável</h5>
            <p className="mt-1 text-sm text-muted-foreground">Salvar não altera a configuração ativa.</p>
          </div>
          <AdminStatusBadge tone={unit.candidate ? "warning" : "neutral"}>
            {unit.candidate ? "Salva" : "Não criada"}
          </AdminStatusBadge>
        </div>

        {unit.candidate ? (
          <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
            <ConfigurationValue value={unit.candidate} />
            <ActorDate actor={unit.candidate.savedByUserId} date={unit.candidate.savedAt} verb="Salva" />
          </div>
        ) : null}

        {unit.pendingRevision ? (
          <p className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
            Existe uma revisão validada aguardando decisão. Ative-a antes de preparar outra candidata.
          </p>
        ) : catalogAvailable && options && options.apiKind === unit.apiKind && options.options.length > 0 ? (
          <CandidateForm key={unit.configurationVersion} unit={unit} options={options} onDirtyChange={onDirtyChange} />
        ) : (
          <p className="mt-4 rounded-md border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-900" role="alert">
            {catalogAvailable
              ? "Nenhuma combinação do catálogo está disponível para esta unidade. Salvar uma nova candidata permanece bloqueado."
              : "O catálogo não pôde ser confirmado. Salvar e provar novas candidatas permanecem bloqueados, sem alterar a revisão ativa."}
          </p>
        )}

        {unit.candidate ? (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <SimpleActionForm
              action={discardOpenAiConfigurationCandidateAction}
              unit={unit}
              context="discard"
              label="Descartar candidata"
              pendingLabel="Descartando…"
            />
            <SimpleActionForm
              action={proveAndPromoteOpenAiConfigurationCandidateAction}
              unit={unit}
              context="proof"
              label="Executar prova e validar"
              pendingLabel="Executando prova…"
              disabled={!catalogAvailable || !candidateEligible}
              disabledReason="A combinação da candidata não está elegível no catálogo vigente."
              primary
            />
          </div>
        ) : null}
      </section>

      <PendingRevision unit={unit} />
      <RevisionHistory unit={unit} />
      <ActivationEvents unit={unit} />
    </article>
  );
}

function ActiveRevision({ revision }: Readonly<{ revision: OpenAiAdministrativeRevision }>) {
  return (
    <section className="mt-5 rounded-md border border-green-200 bg-green-50 p-4" aria-label="Configuração ativa">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h5 className="text-sm font-semibold text-green-950">Configuração ativa</h5>
        <AdminStatusBadge tone="success">Em uso • revisão {revision.number}</AdminStatusBadge>
      </div>
      <div className="mt-3 text-sm text-green-950">
        <ConfigurationValue value={revision} />
        <ActorDate actor={revision.validatedByUserId} date={revision.validatedAt} verb="Validada" />
      </div>
    </section>
  );
}

function CandidateForm({
  unit, options, onDirtyChange,
}: Readonly<{
  unit: OpenAiAdministrativeConfigurationUnit;
  options: OpenAiWorkloadConfigurationOptions;
  onDirtyChange?: (dirty: boolean) => void;
}>) {
  const [state, formAction, pending] = useActionState(saveOpenAiConfigurationCandidateAction, initialState);
  const initialValue = unit.candidate ?? unit.activeRevision;
  const [draft, setDraft] = useState<OpenAiAdministrativeConfigurationValue>(initialValue);
  const [discardTarget, setDiscardTarget] = useState<string | null>(null);
  const router = useRouter();
  const dirty = draft.model !== initialValue.model || draft.reasoningEffort !== initialValue.reasoningEffort ||
    (draft.serviceTier ?? null) !== (initialValue.serviceTier ?? null);
  const valid = configurationIsEligible(options, draft);
  useEffect(() => { onDirtyChange?.(dirty); return () => onDirtyChange?.(false); }, [dirty, onDirtyChange]);
  useEffect(() => {
    if (!dirty) return;
    const beforeUnload = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
    const navigate = (event: MouseEvent) => {
      const anchor = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>("a[href]") : null;
      if (anchor && anchor.href !== window.location.href) {
        event.preventDefault(); event.stopPropagation(); setDiscardTarget(anchor.href);
      }
    };
    window.addEventListener("beforeunload", beforeUnload);
    document.addEventListener("click", navigate, true);
    return () => { window.removeEventListener("beforeunload", beforeUnload); document.removeEventListener("click", navigate, true); };
  }, [dirty]);
  return (
    <form action={formAction} className="mt-4 space-y-4">
      <UnitFields unit={unit} />
      <TextFields idPrefix={unit.environment + "-" + unit.workload} options={options}
        value={draft} onChange={setDraft} disabled={pending} tierSupported={unit.serviceTierSupported === true} />
      <div className="flex flex-wrap gap-3">
        <button type="submit" className={primaryButtonClassName} disabled={pending || !dirty || !valid}>
          {pending ? "Salvando candidata…" : unit.candidate ? "Salvar edição da candidata" : "Salvar candidata"}
        </button>
        <button type="button" className={secondaryButtonClassName} disabled={pending || !dirty}
          onClick={() => setDiscardTarget("cancel")}>
          Cancelar
        </button>
      </div>
      <ConfirmDraftDiscard open={discardTarget !== null} onKeep={() => setDiscardTarget(null)} onDiscard={() => {
        const target = discardTarget; setDiscardTarget(null); setDraft(initialValue);
        if (target && target !== "cancel") {
          const url = new URL(target);
          if (url.origin === window.location.origin) router.push(url.pathname + url.search + url.hash);
          else window.location.assign(url.href);
        }
      }} />
      <ActionFeedback state={state} context="save" />
    </form>
  );
}

function TextFields({
  idPrefix, options, value, onChange, disabled, tierSupported,
}: Readonly<{
  idPrefix: string;
  options: OpenAiWorkloadConfigurationOptions;
  value: OpenAiAdministrativeConfigurationValue;
  onChange: (value: OpenAiAdministrativeConfigurationValue) => void;
  disabled: boolean;
  tierSupported: boolean;
}>) {
  const models = useMemo(() => Array.from(new Set(options.options.map((option) => option.model))), [options]);
  const efforts = useMemo(() => Array.from(new Set(options.options.filter((option) => option.model === value.model)
    .map((option) => option.reasoningEffort))), [options, value.model]);
  const tiers = listOpenAiServiceTiers(value.model);
  const tier = value.serviceTier ?? "";
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div>
        <label htmlFor={idPrefix + "-model"} className="text-sm font-medium text-foreground">Modelo</label>
        <select id={idPrefix + "-model"} name="model" value={value.model} disabled={disabled} className={selectClassName}
          onChange={(event) => {
            const model = event.target.value;
            onChange({ ...value, model, reasoningEffort: options.options.find((option) => option.model === model)?.reasoningEffort ?? value.reasoningEffort,
              serviceTier: value.serviceTier });
          }}>
          {!models.includes(value.model) ? <option value={value.model}>{value.model} (indisponível)</option> : null}
          {models.map((model) => <option key={model} value={model}>{model}</option>)}
        </select>
      </div>
      <div>
        <label htmlFor={idPrefix + "-effort"} className="text-sm font-medium text-foreground">Esforço de raciocínio</label>
        <select id={idPrefix + "-effort"} name="reasoningEffort" value={value.reasoningEffort} disabled={disabled} className={selectClassName}
          onChange={(event) => onChange({ ...value, reasoningEffort: event.target.value as OpenAiReasoningEffort })}>
          {!efforts.includes(value.reasoningEffort) ? <option value={value.reasoningEffort}>{effortLabels[value.reasoningEffort]} (indisponível)</option> : null}
          {efforts.map((effort) => <option key={effort} value={effort}>{effortLabels[effort] ?? effort}</option>)}
        </select>
      </div>
      <FormField>
        <FormFieldLabel htmlFor={idPrefix + "-tier"}>Nível de serviço</FormFieldLabel>
        <Select id={idPrefix + "-tier"} name="serviceTier" value={tier}
          disabled={disabled || !tierSupported || (tiers.length === 0 && tier === "")}
          className="min-h-11" aria-describedby={idPrefix + "-tier-hint"}
          onChange={(event) => onChange({ ...value, serviceTier: event.target.value === "" ? null : event.target.value as OpenAiServiceTier })}>
          <option value="">Legado — sem nível explícito</option>
          {tier && !isEligibleOpenAiServiceTier(value.model, tier) ? <option value={tier} disabled>{openAiServiceTierLabel(value.serviceTier)} (incompatível)</option> : null}
          {tiers.map((choice) => <option key={choice} value={choice}>{openAiServiceTierLabel(choice)}</option>)}
        </Select>
        <FormFieldHint id={idPrefix + "-tier-hint"}>
          {!tierSupported ? "Novos níveis de serviço estão temporariamente indisponíveis. A configuração ativa continua em uso." :
            tier && !isEligibleOpenAiServiceTier(value.model, tier) ? "Selecione um nível compatível." :
            tiers.length === 0 ? "Este modelo mantém o processamento atual." :
            "A escolha será validada por prova e só entrará em uso após ativação humana."}
        </FormFieldHint>
      </FormField>
    </div>
  );
}

function SimpleActionForm({
  action,
  unit,
  context,
  label,
  pendingLabel,
  primary = false,
  disabled = false,
  disabledReason,
}: Readonly<{
  action: OperationalAction;
  unit: OpenAiAdministrativeConfigurationUnit;
  context: ActionContext;
  label: string;
  pendingLabel: string;
  primary?: boolean;
  disabled?: boolean;
  disabledReason?: string;
}>) {
  const [state, formAction, pending] = useActionState(action, initialState);
  return (
    <form action={formAction} className="space-y-2">
      <UnitFields unit={unit} />
      <button type="submit" className={`${primary ? primaryButtonClassName : secondaryButtonClassName} w-full`} disabled={pending || disabled}>
        {pending ? pendingLabel : label}
      </button>
      {disabled && disabledReason ? <p className="text-xs leading-5 text-amber-800">{disabledReason}</p> : null}
      <ActionFeedback state={state} context={context} />
    </form>
  );
}

function PendingRevision({ unit }: Readonly<{ unit: OpenAiAdministrativeConfigurationUnit }>) {
  const [state, formAction, pending] = useActionState(activateOpenAiConfigurationRevisionAction, initialState);
  const revision = unit.pendingRevision;
  return (
    <section className="mt-5 border-t border-border pt-5" aria-label="Revisão validada pendente">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h5 className="text-sm font-semibold text-foreground">Revisão validada pendente</h5>
          <p className="mt-1 text-sm text-muted-foreground">Permanece sem efeito até a ativação humana.</p>
        </div>
        <AdminStatusBadge tone={revision ? "warning" : "neutral"}>{revision ? "Pronta para decisão" : "Nenhuma"}</AdminStatusBadge>
      </div>
      {revision ? (
        <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
          <p className="font-semibold">Revisão {revision.number}</p>
          <div className="mt-2"><ConfigurationValue value={revision} /></div>
          <ActorDate actor={revision.validatedByUserId} date={revision.validatedAt} verb="Validada" />
          <form action={formAction} className="mt-4 space-y-2">
            <UnitFields unit={unit} />
            <input type="hidden" name="targetRevisionId" value={revision.id} />
            <button type="submit" className={primaryButtonClassName} disabled={pending}>
              {pending ? "Ativando revisão…" : `Ativar revisão ${revision.number}`}
            </button>
            <ActionFeedback state={state} context="activation" />
          </form>
        </div>
      ) : null}
    </section>
  );
}

function RevisionHistory({ unit }: Readonly<{ unit: OpenAiAdministrativeConfigurationUnit }>) {
  return (
    <details className="mt-5 border-t border-border pt-5">
      <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 rounded-md text-sm font-semibold text-foreground outline-none focus-visible:ring-4 focus-visible:ring-brand-600/30">
        <span>Histórico de revisões</span><AdminStatusBadge>{unit.historicalRevisions.length}</AdminStatusBadge>
      </summary>
      {unit.historicalRevisions.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">Nenhuma revisão histórica disponível.</p>
      ) : (
        <ul className="mt-3 space-y-3">
          {unit.historicalRevisions.map((revision) => <HistoryItem key={revision.id} unit={unit} revision={revision} />)}
        </ul>
      )}
    </details>
  );
}

function HistoryItem({ unit, revision }: Readonly<{ unit: OpenAiAdministrativeConfigurationUnit; revision: OpenAiAdministrativeRevision }>) {
  const [state, formAction, pending] = useActionState(rollbackOpenAiConfigurationRevisionAction, initialState);
  const rollbackAllowed = unit.activations.some((event) => event.targetRevisionId === revision.id);
  return (
    <li className="rounded-md border border-border bg-background p-4 text-sm">
      <p className="font-semibold text-foreground">Revisão {revision.number}</p>
      <div className="mt-2"><ConfigurationValue value={revision} /></div>
      <ActorDate actor={revision.validatedByUserId} date={revision.validatedAt} verb="Validada" />
      {rollbackAllowed ? (
        <form action={formAction} className="mt-3 space-y-2">
          <UnitFields unit={unit} />
          <input type="hidden" name="targetRevisionId" value={revision.id} />
          <button type="submit" className={secondaryButtonClassName} disabled={pending}>
            {pending ? "Restaurando…" : `Restaurar revisão ${revision.number}`}
          </button>
          <ActionFeedback state={state} context="rollback" />
        </form>
      ) : (
        <p className="mt-3 text-xs text-muted-foreground">Esta revisão foi validada, mas nunca esteve ativa; não é alvo de rollback.</p>
      )}
    </li>
  );
}

function ActivationEvents({ unit }: Readonly<{ unit: OpenAiAdministrativeConfigurationUnit }>) {
  return (
    <details className="mt-5 border-t border-border pt-5">
      <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 rounded-md text-sm font-semibold text-foreground outline-none focus-visible:ring-4 focus-visible:ring-brand-600/30">
        <span>Eventos de ativação</span><AdminStatusBadge>{unit.activations.length}</AdminStatusBadge>
      </summary>
      <ol className="mt-3 space-y-3">
        {unit.activations.map((event) => (
          <li key={event.id} className="rounded-md border border-border bg-background p-4 text-sm text-foreground">
            <p className="font-semibold">{eventLabels[event.eventType]} • revisão {event.targetRevisionNumber}</p>
            {event.previousRevisionNumber ? <p className="mt-1 text-muted-foreground">Revisão anterior: {event.previousRevisionNumber}</p> : null}
            <ActorDate actor={event.actorUserId} date={event.createdAt} verb="Executada" />
          </li>
        ))}
      </ol>
    </details>
  );
}

function ConfigurationValue({ value }: Readonly<{ value: OpenAiAdministrativeConfigurationValue }>) {
  return (
    <dl className="grid gap-2 sm:grid-cols-2">
      <div><dt className="text-xs font-medium uppercase opacity-70">Modelo</dt><dd className="mt-1 break-all font-mono text-xs">{value.model}</dd></div>
      <div>
        <dt className="text-xs font-medium uppercase opacity-70">Esforço</dt>
        <dd className="mt-1">{effortLabels[value.reasoningEffort] ?? value.reasoningEffort}</dd>
      </div>
      <div><dt className="text-xs font-medium uppercase opacity-70">Nível de serviço</dt><dd className="mt-1">{openAiServiceTierLabel(value.serviceTier)}</dd></div>
    </dl>
  );
}

function ActorDate({ actor, date, verb }: Readonly<{ actor: string | null; date: string; verb: string }>) {
  return <p className="mt-3 text-xs leading-5 opacity-80">{verb} por <span className="break-all font-mono">{actor ?? "sistema"}</span> em {formatDate(date)}.</p>;
}

function UnitFields({ unit }: Readonly<{ unit: OpenAiAdministrativeConfigurationUnit }>) {
  return (
    <>
      <input type="hidden" name="environment" value={unit.environment} />
      <input type="hidden" name="workload" value={unit.workload} />
      <input type="hidden" name="expectedVersion" value={unit.configurationVersion} />
    </>
  );
}

function ActionFeedback({ state, context }: Readonly<{ state: OpenAiOperationalActionState; context: ActionContext }>) {
  if (state.status === "idle") return null;
  const error = state.status === "error";
  return (
    <div className={`rounded-md border p-3 text-sm leading-5 ${error ? "border-red-200 bg-red-50 text-red-900" : "border-green-200 bg-green-50 text-green-900"}`} role={error ? "alert" : "status"} aria-live={error ? "assertive" : "polite"}>
      <p className="font-semibold">{actionTitle(state, context)}</p>
      <p className="mt-1">{state.message}</p>
      {state.code ? <p className="mt-1 font-mono text-xs">Código: {state.code}</p> : null}
    </div>
  );
}

function actionTitle(state: OpenAiOperationalActionState, context: ActionContext) {
  if (state.status === "success") return { save: "Candidata salva", discard: "Candidata descartada", proof: "Prova aprovada", activation: "Ativação concluída", rollback: "Rollback concluído" }[context];
  if (state.code === "validation") return "Dados inválidos";
  if (state.code === "concurrency") return "Alteração concorrente";
  if (state.code === "proof") return "Prova operacional não aprovada";
  if (state.code === "read") return "Leitura da configuração falhou";
  if (state.code === "lifecycle") return context === "activation" ? "Ativação indisponível" : "Ação incompatível com o estado atual";
  if (state.code === "unauthorized") return "Acesso não autorizado";
  return { save: "Falha ao salvar", discard: "Falha ao descartar", proof: "Falha na prova", activation: "Falha de ativação", rollback: "Falha de rollback" }[context];
}

function configurationIsEligible(
  options: OpenAiWorkloadConfigurationOptions,
  value: OpenAiAdministrativeConfigurationValue,
) {
  return isValidOpenAiServiceTierSnapshot(value.model, value.serviceTier) && options.options.some(
    (option) => option.model === value.model && option.reasoningEffort === value.reasoningEffort,
  );
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "data não disponível";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Sao_Paulo" }).format(date);
}

export function ConfirmDraftDiscard({ open, onDiscard, onKeep }: Readonly<{
  open: boolean; onDiscard: () => void; onKeep: () => void;
}>) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (open && !dialog.current?.open) dialog.current?.showModal();
    if (!open && dialog.current?.open) dialog.current.close();
  }, [open]);
  return <dialog ref={dialog} aria-label="Descartar alterações locais?"
    className="m-auto w-[calc(100%-2rem)] max-w-md rounded-lg border border-border bg-background p-5 text-foreground shadow-lg backdrop:bg-black/30"
    onCancel={event => { event.preventDefault(); onKeep(); }}>
    <h2 className="font-semibold">Descartar alterações locais?</h2>
    <p className="mt-2 text-sm text-muted-foreground">A candidata salva e a configuração ativa serão preservadas.</p>
    <div className="mt-4 flex flex-wrap gap-3">
      <button type="button" className={secondaryButtonClassName} onClick={onKeep} autoFocus>Continuar editando</button>
      <button type="button" className={primaryButtonClassName} onClick={onDiscard}>Descartar alterações locais</button>
    </div>
  </dialog>;
}
