"use client";

import { useActionState, useMemo, useState } from "react";

import { AdminStatusBadge } from "@/components/admin/AdminStatusBadge";
import type {
  OpenAiAdministrativeConfigurationUnit,
  OpenAiAdministrativeConfigurationValue,
  OpenAiAdministrativeRevision,
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

type Props = Readonly<{
  units: readonly OpenAiAdministrativeConfigurationUnit[];
  configurationOptions: readonly OpenAiWorkloadConfigurationOptions[];
}>;

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

const qualityLabels: Record<string, string> = {
  low: "Baixa",
  medium: "Média",
  high: "Alta",
};

const eventLabels = {
  bootstrap: "Configuração inicial",
  activate: "Ativação",
  rollback: "Rollback",
} as const;

const landingWorkloads = new Set([
  "landing_page_draft_generation",
  "landing_page_draft_image_generation",
]);

const selectClassName =
  "mt-1 min-h-11 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus-visible:ring-4 focus-visible:ring-brand-600/30 disabled:opacity-60";
const primaryButtonClassName =
  "inline-flex min-h-11 items-center justify-center rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/30 disabled:cursor-not-allowed disabled:opacity-60";
const secondaryButtonClassName =
  "inline-flex min-h-11 items-center justify-center rounded-md border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition hover:bg-muted focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/30 disabled:cursor-not-allowed disabled:opacity-60";

export function OpenAiConfigurationManager({ units, configurationOptions }: Props) {
  return (
    <div className="space-y-8">
      <LifecycleGuide />
      {(["production", "preview"] as const).map((environment) => (
        <EnvironmentSection
          key={environment}
          environment={environment}
          units={units.filter((unit) => unit.environment === environment)}
          configurationOptions={configurationOptions}
        />
      ))}
    </div>
  );
}

function LifecycleGuide() {
  const steps = [
    ["1", "Configuração ativa", "Permanece em uso durante a preparação."],
    ["2", "Candidata editável", "Pode ser salva ou descartada sem efeito no runtime."],
    ["3", "Prova operacional", "Uma prova aprovada cria a revisão validada pendente."],
    ["4", "Ativação humana", "Somente esta decisão coloca a revisão em uso."],
  ] as const;

  return (
    <section className="rounded-lg border border-border bg-card p-5 shadow-card sm:p-6" aria-labelledby="lifecycle-title">
      <h2 id="lifecycle-title" className="text-base font-semibold text-foreground">
        Lifecycle da configuração
      </h2>
      <ol className="mt-4 grid gap-3 text-sm md:grid-cols-4">
        {steps.map(([number, title, description]) => (
          <li key={number} className="rounded-md border border-border bg-background p-4">
            <span className="flex size-7 items-center justify-center rounded-full bg-brand-50 text-xs font-semibold text-brand-700">
              {number}
            </span>
            <p className="mt-3 font-semibold text-foreground">{title}</p>
            <p className="mt-1 leading-6 text-muted-foreground">{description}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

function EnvironmentSection({
  environment,
  units,
  configurationOptions,
}: Readonly<{
  environment: "production" | "preview";
  units: readonly OpenAiAdministrativeConfigurationUnit[];
  configurationOptions: readonly OpenAiWorkloadConfigurationOptions[];
}>) {
  const title = environment === "production" ? "Production" : "Preview";
  const regular = units.filter((unit) => !landingWorkloads.has(unit.workload));
  const landing = units.filter((unit) => landingWorkloads.has(unit.workload));

  return (
    <section className="space-y-5" aria-labelledby={`${environment}-configuration-title`}>
      <div className="flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 id={`${environment}-configuration-title`} className="text-xl font-semibold text-foreground">
            {title}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Ambiente independente: alterações aqui não modificam {environment === "production" ? "Preview" : "Production"}.
          </p>
        </div>
        <AdminStatusBadge tone={environment === "production" ? "danger" : "warning"}>
          Ambiente independente
        </AdminStatusBadge>
      </div>

      {units.length === 0 ? (
        <p className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900" role="alert">
          Nenhuma unidade administrativa foi retornada para {title}.
        </p>
      ) : (
        <>
          <div className="grid gap-5 xl:grid-cols-2">
            {regular.map((unit) => (
              <UnitCard
                key={`${unit.environment}-${unit.workload}-${unit.configurationVersion}`}
                unit={unit}
                options={configurationOptions.find((candidate) => candidate.workload === unit.workload)}
              />
            ))}
          </div>
          {landing.length > 0 ? (
            <section className="rounded-xl border-2 border-brand-600/20 bg-brand-50/30 p-4 sm:p-5" aria-labelledby={`${environment}-landing-title`}>
              <h3 id={`${environment}-landing-title`} className="text-lg font-semibold text-foreground">
                Geração da Landing Page
              </h3>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Texto e imagem estão agrupados visualmente, mas têm lifecycle e controles independentes.
              </p>
              <div className="mt-5 grid gap-5 xl:grid-cols-2">
                {landing.map((unit) => (
                  <UnitCard
                    key={`${unit.environment}-${unit.workload}-${unit.configurationVersion}`}
                    unit={unit}
                    options={configurationOptions.find((candidate) => candidate.workload === unit.workload)}
                  />
                ))}
              </div>
            </section>
          ) : null}
        </>
      )}
    </section>
  );
}

function UnitCard({
  unit,
  options,
}: Readonly<{
  unit: OpenAiAdministrativeConfigurationUnit;
  options: OpenAiWorkloadConfigurationOptions | undefined;
}>) {
  const titleId = `${unit.environment}-${unit.workload}-title`;
  return (
    <article className="min-w-0 rounded-lg border border-border bg-card p-4 shadow-card sm:p-5" aria-labelledby={titleId}>
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase text-muted-foreground">
            {unit.apiKind === "responses_text" ? "Texto" : "Imagem"}
          </p>
          <h3 id={titleId} className="mt-1 text-base font-semibold text-foreground">{unit.displayName}</h3>
          <p className="mt-1 break-all font-mono text-xs text-muted-foreground">{unit.workload}</p>
        </div>
        <AdminStatusBadge tone={unit.pendingRevision ? "warning" : unit.candidate ? "neutral" : "success"}>
          {unit.pendingRevision ? "Aguardando ativação" : unit.candidate ? "Candidata salva" : "Ativa estável"}
        </AdminStatusBadge>
      </header>

      <ActiveRevision revision={unit.activeRevision} />

      <section className="mt-5 border-t border-border pt-5" aria-label="Candidata editável">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h4 className="text-sm font-semibold text-foreground">Candidata editável</h4>
            <p className="mt-1 text-sm text-muted-foreground">Salvar não altera a configuração ativa.</p>
          </div>
          <AdminStatusBadge tone={unit.candidate ? "warning" : "neutral"}>{unit.candidate ? "Salva" : "Não criada"}</AdminStatusBadge>
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
        ) : options && options.apiKind === unit.apiKind ? (
          <CandidateForm unit={unit} options={options} />
        ) : (
          <p className="mt-4 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-900" role="alert">
            Opções públicas indisponíveis. Os controles desta unidade estão desabilitados.
          </p>
        )}
        {unit.candidate ? (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <SimpleActionForm action={discardOpenAiConfigurationCandidateAction} unit={unit} context="discard" label="Descartar candidata" pendingLabel="Descartando…" />
            <SimpleActionForm action={proveAndPromoteOpenAiConfigurationCandidateAction} unit={unit} context="proof" label="Executar prova e validar" pendingLabel="Executando prova…" primary />
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
        <h4 className="text-sm font-semibold text-green-950">Configuração ativa</h4>
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
  unit,
  options,
}: Readonly<{
  unit: OpenAiAdministrativeConfigurationUnit;
  options: OpenAiWorkloadConfigurationOptions;
}>) {
  const [state, formAction, pending] = useActionState(saveOpenAiConfigurationCandidateAction, initialState);
  const initialValue = unit.candidate ?? unit.activeRevision;
  return (
    <form action={formAction} className="mt-4 space-y-4">
      <UnitFields unit={unit} />
      {options.apiKind === "responses_text" ? (
        <TextFields idPrefix={`${unit.environment}-${unit.workload}`} options={options} initialValue={initialValue} disabled={pending} />
      ) : (
        <ImageFields idPrefix={`${unit.environment}-${unit.workload}`} options={options} initialValue={initialValue} disabled={pending} />
      )}
      <button type="submit" className={primaryButtonClassName} disabled={pending || options.options.length === 0}>
        {pending ? "Salvando candidata…" : unit.candidate ? "Salvar edição da candidata" : "Salvar candidata"}
      </button>
      <ActionFeedback state={state} context="save" />
    </form>
  );
}

function TextFields({
  idPrefix,
  options,
  initialValue,
  disabled,
}: Readonly<{
  idPrefix: string;
  options: Extract<OpenAiWorkloadConfigurationOptions, { apiKind: "responses_text" }>;
  initialValue: OpenAiAdministrativeConfigurationValue;
  disabled: boolean;
}>) {
  const selected = options.options.find(
    (option) => initialValue.apiKind === "responses_text" && option.model === initialValue.model && option.reasoningEffort === initialValue.reasoningEffort,
  ) ?? options.options[0];
  const [model, setModel] = useState(selected?.model ?? "");
  const [effort, setEffort] = useState<string>(selected?.reasoningEffort ?? "");
  const models = useMemo(() => Array.from(new Set(options.options.map((option) => option.model))), [options]);
  const efforts = useMemo(
    () => Array.from(new Set(options.options.filter((option) => option.model === model).map((option) => option.reasoningEffort))),
    [model, options],
  );
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div>
        <label htmlFor={`${idPrefix}-model`} className="text-sm font-medium text-foreground">Modelo</label>
        <select id={`${idPrefix}-model`} name="model" value={model} disabled={disabled} className={selectClassName} onChange={(event) => {
          const next = event.target.value;
          setModel(next);
          setEffort(options.options.find((option) => option.model === next)?.reasoningEffort ?? "");
        }}>
          {models.map((value) => <option key={value} value={value}>{value}</option>)}
        </select>
      </div>
      <div>
        <label htmlFor={`${idPrefix}-effort`} className="text-sm font-medium text-foreground">Esforço de raciocínio</label>
        <select id={`${idPrefix}-effort`} name="reasoningEffort" value={effort} disabled={disabled} className={selectClassName} onChange={(event) => setEffort(event.target.value)}>
          {efforts.map((value) => <option key={value} value={value}>{effortLabels[value] ?? value}</option>)}
        </select>
      </div>
    </div>
  );
}

function ImageFields({
  idPrefix,
  options,
  initialValue,
  disabled,
}: Readonly<{
  idPrefix: string;
  options: Extract<OpenAiWorkloadConfigurationOptions, { apiKind: "image_generation" }>;
  initialValue: OpenAiAdministrativeConfigurationValue;
  disabled: boolean;
}>) {
  const selected = options.options.find(
    (option) => initialValue.apiKind === "image_generation" && option.model === initialValue.model && option.quality === initialValue.quality,
  ) ?? options.options[0];
  const [model, setModel] = useState(selected?.model ?? "");
  const [quality, setQuality] = useState<string>(selected?.quality ?? "");
  const models = useMemo(() => Array.from(new Set(options.options.map((option) => option.model))), [options]);
  const qualities = useMemo(
    () => Array.from(new Set(options.options.filter((option) => option.model === model).map((option) => option.quality))),
    [model, options],
  );
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div>
        <label htmlFor={`${idPrefix}-model`} className="text-sm font-medium text-foreground">Modelo</label>
        <select id={`${idPrefix}-model`} name="model" value={model} disabled={disabled} className={selectClassName} onChange={(event) => {
          const next = event.target.value;
          setModel(next);
          setQuality(options.options.find((option) => option.model === next)?.quality ?? "");
        }}>
          {models.map((value) => <option key={value} value={value}>{value}</option>)}
        </select>
      </div>
      <div>
        <label htmlFor={`${idPrefix}-quality`} className="text-sm font-medium text-foreground">Qualidade da imagem</label>
        <select id={`${idPrefix}-quality`} name="quality" value={quality} disabled={disabled} className={selectClassName} onChange={(event) => setQuality(event.target.value)}>
          {qualities.map((value) => <option key={value} value={value}>{qualityLabels[value] ?? value}</option>)}
        </select>
      </div>
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
}: Readonly<{
  action: OperationalAction;
  unit: OpenAiAdministrativeConfigurationUnit;
  context: ActionContext;
  label: string;
  pendingLabel: string;
  primary?: boolean;
}>) {
  const [state, formAction, pending] = useActionState(action, initialState);
  return (
    <form action={formAction} className="space-y-2">
      <UnitFields unit={unit} />
      <button type="submit" className={`${primary ? primaryButtonClassName : secondaryButtonClassName} w-full`} disabled={pending}>
        {pending ? pendingLabel : label}
      </button>
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
          <h4 className="text-sm font-semibold text-foreground">Revisão validada pendente</h4>
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
  const rollbackAllowed = unit.activations.some(
    (event) => event.targetRevisionId === revision.id,
  );
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
        <p className="mt-3 text-xs text-muted-foreground">
          Esta revisão foi validada, mas nunca esteve ativa; não é alvo de rollback.
        </p>
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
        <dt className="text-xs font-medium uppercase opacity-70">{value.apiKind === "responses_text" ? "Esforço" : "Qualidade"}</dt>
        <dd className="mt-1">{value.apiKind === "responses_text" ? effortLabels[value.reasoningEffort] ?? value.reasoningEffort : qualityLabels[value.quality] ?? value.quality}</dd>
      </div>
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

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "data não disponível";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Sao_Paulo" }).format(date);
}
