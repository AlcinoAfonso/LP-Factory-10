"use client";

import { useActionState, useState } from "react";

import { AdminStatusBadge } from "@/components/admin/AdminStatusBadge";
import {
  openAiImageQualities,
  openAiReasoningEfforts,
  type OpenAiModelCatalogModel,
  type OpenAiModelCatalogParameter,
} from "@/openai-workloads/contracts";
import {
  addOpenAiModelCatalogModelAction,
  setOpenAiModelCatalogModelAvailabilityAction,
  setOpenAiModelCatalogParameterAvailabilityAction,
  type OpenAiModelCatalogActionState,
} from "../catalogActions";

type Props = Readonly<{
  models: readonly OpenAiModelCatalogModel[] | null;
  readErrorCode?: string | null;
}>;

const initialState: OpenAiModelCatalogActionState = {
  status: "idle",
  code: null,
  message: "",
};

const buttonClassName =
  "inline-flex min-h-11 items-center justify-center rounded-md border border-border bg-background px-3 py-2 text-sm font-medium text-foreground outline-none transition hover:bg-muted focus-visible:ring-4 focus-visible:ring-brand-600/30 disabled:cursor-not-allowed disabled:opacity-60";
const primaryButtonClassName =
  "inline-flex min-h-11 items-center justify-center rounded-md bg-brand-700 px-4 py-2 text-sm font-medium text-white outline-none transition hover:bg-brand-dark-800 focus-visible:ring-4 focus-visible:ring-brand-600/30 disabled:cursor-not-allowed disabled:opacity-60";
const fieldClassName =
  "mt-1 min-h-11 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus-visible:ring-4 focus-visible:ring-brand-600/30 disabled:cursor-not-allowed disabled:opacity-60";

export function OpenAiModelCatalogManager({ models, readErrorCode = null }: Props) {
  const [openModelKey, setOpenModelKey] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  return (
    <section className="rounded-lg border border-border bg-card shadow-card" aria-labelledby="model-catalog-title">
      <header className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-start sm:justify-between sm:p-5">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Catálogo global</p>
          <h2 id="model-catalog-title" className="mt-1 text-lg font-semibold text-foreground">Modelos disponíveis para novas candidatas</h2>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-muted-foreground">
            A disponibilidade afeta somente novas escolhas. Revisões ativas, histórico e rollback permanecem preservados.
          </p>
        </div>
        <button
          type="button"
          className={primaryButtonClassName}
          disabled={models === null}
          aria-expanded={adding}
          aria-controls="new-catalog-model-form"
          onClick={() => {
            setAdding((current) => !current);
            setOpenModelKey(null);
          }}
        >
          {adding ? "Cancelar adição" : "Adicionar modelo"}
        </button>
      </header>

      {models === null ? (
        <div className="m-4 rounded-md border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-900 sm:m-5" role="alert">
          <p className="font-semibold">Catálogo indisponível</p>
          <p className="mt-1">A gestão e as novas candidatas permanecem bloqueadas. A configuração ativa dos workloads não foi alterada.</p>
          {readErrorCode ? <p className="mt-2 font-mono text-xs">Código: {readErrorCode}</p> : null}
        </div>
      ) : (
        <div className="space-y-4 p-4 sm:p-5">
          {adding ? <CreateModelForm /> : null}

          {models.length === 0 ? (
            <p className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950" role="status">
              Nenhum modelo foi retornado pelo catálogo.
            </p>
          ) : (
            <div className="grid gap-4 xl:grid-cols-2">
              {(["responses_text", "image_generation"] as const).map((apiKind) => {
                const modalityModels = models.filter((model) => model.apiKind === apiKind);
                if (modalityModels.length === 0) return null;
                return (
                  <section key={apiKind} aria-labelledby={`catalog-${apiKind}-title`} className="min-w-0 rounded-lg border border-border bg-background">
                    <div className="sticky top-0 z-[1] border-b border-border bg-muted px-4 py-3">
                      <h3 id={`catalog-${apiKind}-title`} className="text-sm font-semibold text-foreground">
                        {apiKind === "responses_text" ? "Texto" : "Imagem"}
                      </h3>
                    </div>
                    <ul className="divide-y divide-border">
                      {modalityModels.map((model) => {
                        const key = `${model.apiKind}:${model.model}`;
                        const open = openModelKey === key;
                        return (
                          <li key={key}>
                            <div className="flex min-w-0 flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                              <div className="min-w-0">
                                <p className="truncate font-mono text-sm font-semibold text-foreground">{model.model}</p>
                                <p className="mt-1 truncate text-xs text-muted-foreground">{parameterSummary(model)}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <AdminStatusBadge tone={model.availableForSelection ? "success" : "neutral"}>
                                  {model.availableForSelection ? "Disponível" : "Indisponível"}
                                </AdminStatusBadge>
                                <button
                                  type="button"
                                  className={buttonClassName}
                                  aria-expanded={open}
                                  aria-controls={`catalog-model-${safeId(key)}`}
                                  onClick={() => {
                                    setOpenModelKey(open ? null : key);
                                    setAdding(false);
                                  }}
                                >
                                  {open ? "Fechar" : "Configurar"}
                                </button>
                              </div>
                            </div>
                            {open ? <ModelConfiguration id={`catalog-model-${safeId(key)}`} model={model} /> : null}
                          </li>
                        );
                      })}
                    </ul>
                  </section>
                );
              })}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function CreateModelForm() {
  const [apiKind, setApiKind] = useState<"responses_text" | "image_generation">("responses_text");
  const [state, formAction, pending] = useActionState(addOpenAiModelCatalogModelAction, initialState);
  const values = apiKind === "responses_text" ? openAiReasoningEfforts : openAiImageQualities;
  const kind = apiKind === "responses_text" ? "reasoning_effort" : "quality";
  return (
    <form id="new-catalog-model-form" action={formAction} className="rounded-lg border border-brand-600/30 bg-brand-50/40 p-4 sm:p-5">
      <h3 className="text-sm font-semibold text-foreground">Adicionar modelo indisponível</h3>
      <p className="mt-1 text-sm leading-6 text-muted-foreground">Informe o identificador técnico e ao menos um parâmetro já suportado. O modelo nasce indisponível para seleção.</p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="catalog-new-api-kind" className="text-sm font-medium text-foreground">Modalidade</label>
          <select id="catalog-new-api-kind" name="apiKind" value={apiKind} disabled={pending} className={fieldClassName} onChange={(event) => setApiKind(event.target.value as typeof apiKind)}>
            <option value="responses_text">Texto</option>
            <option value="image_generation">Imagem</option>
          </select>
        </div>
        <div>
          <label htmlFor="catalog-new-model" className="text-sm font-medium text-foreground">Identificador do modelo</label>
          <input id="catalog-new-model" name="model" required maxLength={128} autoComplete="off" spellCheck={false} disabled={pending} className={fieldClassName} placeholder="identificador-tecnico" />
        </div>
      </div>
      <fieldset className="mt-4">
        <legend className="text-sm font-medium text-foreground">Parâmetros suportados</legend>
        <div className="mt-2 grid gap-2 sm:grid-cols-3">
          {values.map((value) => (
            <label key={`${apiKind}:${value}`} className="flex min-h-11 cursor-pointer items-center gap-3 rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus-within:ring-4 focus-within:ring-brand-600/30">
              <input type="checkbox" name="parameterValues" value={value} disabled={pending} className="size-4 accent-brand-600" />
              {parameterLabel(kind, value)}
            </label>
          ))}
        </div>
      </fieldset>
      <input type="hidden" name="parameterKind" value={kind} />
      <button type="submit" className={`${primaryButtonClassName} mt-4`} disabled={pending}>
        {pending ? "Adicionando…" : "Adicionar ao catálogo"}
      </button>
      <CatalogActionFeedback state={state} successTitle="Modelo adicionado indisponível" />
    </form>
  );
}

function ModelConfiguration({ id, model }: Readonly<{ id: string; model: OpenAiModelCatalogModel }>) {
  return (
    <div id={id} className="space-y-4 border-t border-border bg-card p-4">
      <ModelAvailabilityForm model={model} />
      <div>
        <h4 className="text-sm font-semibold text-foreground">Parâmetros suportados</h4>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">Uma combinação só é elegível quando modelo e parâmetro estão disponíveis.</p>
        <ul className="mt-3 space-y-2">
          {model.parameters.map((parameter) => (
            <li key={`${parameter.kind}:${parameter.value}`}>
              <ParameterAvailabilityForm model={model} parameter={parameter} />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function ModelAvailabilityForm({ model }: Readonly<{ model: OpenAiModelCatalogModel }>) {
  const [state, formAction, pending] = useActionState(setOpenAiModelCatalogModelAvailabilityAction, initialState);
  const next = !model.availableForSelection;
  return (
    <form action={formAction} className="rounded-md border border-border bg-background p-3">
      <input type="hidden" name="apiKind" value={model.apiKind} />
      <input type="hidden" name="model" value={model.model} />
      <input type="hidden" name="expectedVersion" value={model.version} />
      <input type="hidden" name="availableForSelection" value={String(next)} />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-foreground">Disponibilidade do modelo</p>
          <p className="mt-1 text-xs text-muted-foreground">{model.availableForSelection ? "Disponível para novas candidatas." : "Indisponível para novas candidatas."}</p>
        </div>
        <button type="submit" className={buttonClassName} disabled={pending}>
          {pending ? "Atualizando…" : next ? "Disponibilizar modelo" : "Indisponibilizar modelo"}
        </button>
      </div>
      <CatalogActionFeedback state={state} successTitle="Disponibilidade atualizada" />
    </form>
  );
}

function ParameterAvailabilityForm({ model, parameter }: Readonly<{ model: OpenAiModelCatalogModel; parameter: OpenAiModelCatalogParameter }>) {
  const [state, formAction, pending] = useActionState(setOpenAiModelCatalogParameterAvailabilityAction, initialState);
  const next = !parameter.availableForSelection;
  return (
    <form action={formAction} className="rounded-md border border-border bg-background p-3">
      <input type="hidden" name="apiKind" value={model.apiKind} />
      <input type="hidden" name="model" value={model.model} />
      <input type="hidden" name="parameterKind" value={parameter.kind} />
      <input type="hidden" name="parameterValue" value={parameter.value} />
      <input type="hidden" name="expectedVersion" value={parameter.version} />
      <input type="hidden" name="availableForSelection" value={String(next)} />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground">{parameterLabel(parameter.kind, parameter.value)}</span>
          <AdminStatusBadge tone={parameter.availableForSelection ? "success" : "neutral"}>
            {parameter.availableForSelection ? "Disponível" : "Indisponível"}
          </AdminStatusBadge>
        </div>
        <button type="submit" className={buttonClassName} disabled={pending}>
          {pending ? "Atualizando…" : next ? "Disponibilizar" : "Indisponibilizar"}
        </button>
      </div>
      <CatalogActionFeedback state={state} successTitle="Parâmetro atualizado" />
    </form>
  );
}

function CatalogActionFeedback({ state, successTitle }: Readonly<{ state: OpenAiModelCatalogActionState; successTitle: string }>) {
  if (state.status === "idle") return null;
  const error = state.status === "error";
  return (
    <div className={`mt-3 rounded-md border p-3 text-sm leading-5 ${error ? "border-red-200 bg-red-50 text-red-900" : "border-green-200 bg-green-50 text-green-900"}`} role={error ? "alert" : "status"} aria-live={error ? "assertive" : "polite"}>
      <p className="font-semibold">{error ? catalogErrorTitle(state.code) : successTitle}</p>
      <p className="mt-1">{state.message}</p>
      {state.code ? <p className="mt-1 font-mono text-xs">Código: {state.code}</p> : null}
    </div>
  );
}

function catalogErrorTitle(code: string | null) {
  if (code === "validation") return "Dados inválidos";
  if (code === "concurrency") return "Alteração concorrente";
  if (code === "unauthorized") return "Acesso não autorizado";
  if (code === "read") return "Leitura do catálogo falhou";
  return "Alteração do catálogo não concluída";
}

function parameterSummary(model: OpenAiModelCatalogModel) {
  const available = model.parameters.filter((parameter) => parameter.availableForSelection).length;
  const label = model.apiKind === "responses_text" ? "efforts" : "qualities";
  return `${available}/${model.parameters.length} ${label} disponíveis`;
}

function parameterLabel(kind: "reasoning_effort" | "quality", value: string) {
  const labels: Record<string, string> = {
    none: "Nenhum",
    low: kind === "quality" ? "Baixa" : "Baixo",
    medium: kind === "quality" ? "Média" : "Médio",
    high: kind === "quality" ? "Alta" : "Alto",
    xhigh: "Extra-alto",
    max: "Máximo",
  };
  return labels[value] ?? value;
}

function safeId(value: string) {
  return value.replace(/[^a-z0-9_-]+/gi, "-").replace(/^-|-$/g, "").toLowerCase();
}
