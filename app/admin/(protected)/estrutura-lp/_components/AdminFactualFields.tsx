"use client";

import { useActionState } from "react";

import { factualFieldObligations, factualFieldValueScopes, factualFieldValueTypes, type ResolvedFactualCoverage, type ResolvedFactualField } from "@/conversion-content/landing-page/input-catalog";
import { resolveRefinementTarget, resolveSuggestedResidence, type EvaluationSuggestionHandoff } from "@/lib/admin/evaluationSuggestionHandoff";
import { mutateFactualFieldAction, type FactualFieldActionState } from "../actions";

type Taxon = Readonly<{ id: string; name: string; level: string; parentName: string | null; isActive: boolean }>;
type Props = Readonly<{ suggestion: EvaluationSuggestionHandoff | null; refineFieldKey: string | null; data: Readonly<{
  taxons: readonly Taxon[]; taxonError: string | null; selectedTaxon: Taxon | null;
  result: Readonly<{ ok: true; value: ResolvedFactualCoverage }> | Readonly<{ ok: false; error: Readonly<{ message: string }> }> | null;
}> }>;
const initialState: FactualFieldActionState = { error: null, message: null, revision: 0 };
const validationKinds = ["type_only", "enum", "string_list", "number_range", "e164", "email", "https_url", "keyword_map", "asset_reference", "color_palette", "offering_scope"] as const;

export function AdminFactualFields({ data, suggestion, refineFieldKey }: Props) {
  const [state, action, pending] = useActionState(mutateFactualFieldAction, initialState);
  const coverage = data.result?.ok ? data.result.value : null;
  const targetFieldId = coverage ? resolveRefinementTarget(refineFieldKey, coverage.fields)?.id ?? null : null;
  return (
    <div className="space-y-4">
      <form action="/admin/estrutura-lp" className="rounded-lg border border-border bg-card p-4">
        <input type="hidden" name="view" value="entradas" />
        <label className="block space-y-1"><span className="text-sm font-medium">Taxon consultado</span>
          <select className="min-h-11 w-full rounded-md border border-border bg-background px-3 outline-none focus-visible:ring-4 focus-visible:ring-brand-600/20" name="taxon" defaultValue={data.selectedTaxon?.id ?? ""}>
            {data.taxons.map((taxon) => <option key={taxon.id} value={taxon.id}>{taxon.name} · {layerLabel(taxon.level)} · {taxon.isActive ? "ativo" : "inativo"}</option>)}
          </select>
        </label>
        <button className="mt-3 min-h-11 rounded-md bg-brand-600 px-4 text-sm font-medium text-white outline-none focus-visible:ring-4 focus-visible:ring-brand-600/30" type="submit">Consultar cobertura</button>
      </form>

      <div aria-live="polite">
        {state.error ? <p role="alert" className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">{state.error}</p> : null}
        {state.message ? <p role="status" className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">{state.message}</p> : null}
      </div>

      {data.taxonError ? <Failure message={data.taxonError} /> : null}
      {data.result && !data.result.ok ? <Failure message={data.result.error.message} /> : null}
      {!data.selectedTaxon && !data.taxonError ? <p className="rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">Nenhum taxon disponível.</p> : null}

      {coverage ? (
        <>
          <section className="rounded-lg border border-border bg-card p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Autoridade única · Supabase corrente</p>
            <h2 className="mt-1 text-lg font-semibold">Cobertura de {coverage.servedTaxon.name}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{coverage.fields.filter((field) => field.isActive).length} fields ativos de {coverage.fields.length}. Próprios e herdados são identificados sem versões ou planos.</p>
            <ol className="mt-3 flex flex-wrap gap-2" aria-label="Cadeia factual aplicada">
              {coverage.appliedLayers.map((layer) => <li key={`${layer.level}:${layer.taxon?.id ?? "universal"}`} className="rounded-full border border-border bg-background px-3 py-1.5 text-sm">{layerLabel(layer.level)}{layer.taxon ? ` · ${layer.taxon.name}` : ""}</li>)}
            </ol>
          </section>

          <CreateForm action={action} pending={pending} taxons={data.taxons} selectedTaxonId={data.selectedTaxon?.id ?? ""} coverage={coverage} suggestion={suggestion} />

          {refineFieldKey && !targetFieldId ? <p role="alert" className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">O field relacionado {refineFieldKey} não foi encontrado de forma única nesta cobertura. Nenhum editor foi selecionado; escolha manualmente o field correto.</p> : null}

          <div className="space-y-4">
            {coverage.appliedLayers.map((layer) => {
              const fields = coverage.fields.filter((field) => field.originLayer === layer.level && field.originTaxon?.id === layer.taxon?.id);
              return (
                <section key={`${layer.level}:${layer.taxon?.id ?? "universal"}`} className="rounded-lg border border-border bg-card p-4" aria-labelledby={`layer-${layer.level}`}>
                  <div className="flex flex-wrap items-center justify-between gap-2"><h2 id={`layer-${layer.level}`} className="font-semibold">{layerLabel(layer.level)}{layer.taxon ? ` · ${layer.taxon.name}` : ""}</h2><span className="text-sm text-muted-foreground">{fields.length} fields</span></div>
                  {fields.length ? <ul className="mt-3 grid gap-3">{fields.map((field) => <FieldCard key={field.id} action={action} field={field} pending={pending} targeted={field.id === targetFieldId} />)}</ul> : <p className="mt-3 text-sm text-muted-foreground">Nenhum field ativo nesta camada.</p>}
                </section>
              );
            })}
          </div>
        </>
      ) : null}
    </div>
  );
}

function CreateForm({ action, pending, taxons, selectedTaxonId, coverage, suggestion }: { action: (payload: FormData) => void; pending: boolean; taxons: readonly Taxon[]; selectedTaxonId: string; coverage: ResolvedFactualCoverage; suggestion: EvaluationSuggestionHandoff | null }) {
  const suggestedTaxonId = resolveSuggestedResidence(suggestion?.layer ?? null, coverage.appliedLayers);
  const unresolvedLayer = Boolean(suggestion?.layer && !suggestedTaxonId);
  const residence = unresolvedLayer ? "" : suggestedTaxonId ?? (selectedTaxonId || "universal");
  return (
    <details className="rounded-lg border border-border bg-card p-4" id="adicionar-field-factual" open={Boolean(suggestion)}>
      <summary className="flex min-h-11 cursor-pointer items-center font-semibold outline-none focus-visible:ring-4 focus-visible:ring-brand-600/20">Adicionar field factual</summary>
      {suggestion ? <div className="mt-3 rounded-md border border-brand-200 bg-brand-50 p-3 text-sm text-brand-900"><p className="font-medium">Sugestão consultiva: {suggestion.name}</p><p className="mt-1">{suggestion.description}</p><p className="mt-2">Camada sugerida: {suggestion.layer ? layerLabel(suggestion.layer) : "não definida"}. Revise a residência e todos os demais dados.</p><p className="mt-2">Nada foi criado pela IA; somente “Criar field” envia sua decisão.</p></div> : null}
      {unresolvedLayer ? <p role="alert" className="mt-3 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">A camada sugerida não existe na cadeia deste taxon. Selecione uma residência válida antes de criar o field.</p> : null}
      <form action={action} className="mt-4 space-y-4"><input type="hidden" name="operation" value="create" />
        <div className="grid gap-3 sm:grid-cols-2"><Text name="fieldKey" label="fieldKey novo" required /><label className="space-y-1"><span className="text-sm font-medium">Residência</span><select name="taxonId" defaultValue={residence} className={control} required>{unresolvedLayer ? <option disabled value="">Selecione uma residência válida</option> : null}<option value="universal">Universal</option>{taxons.map((taxon) => <option key={taxon.id} value={taxon.id}>{layerLabel(taxon.level)} · {taxon.name}</option>)}</select></label></div>
        <DefinitionFields suggestedPurpose={suggestion?.description} />
        <ActionButton pending={pending}>Criar field</ActionButton>
      </form>
    </details>
  );
}

function FieldCard({ action, field, pending, targeted }: { action: (payload: FormData) => void; field: ResolvedFactualField; pending: boolean; targeted: boolean }) {
  return (
    <li className="rounded-md border border-border bg-background p-4 [overflow-wrap:anywhere]" id={targeted ? `field-${field.fieldKey}` : undefined}>
      <div className="flex flex-wrap items-start justify-between gap-2"><div><p className="font-semibold">{field.fieldKey}</p><p className="mt-1 text-sm text-muted-foreground">{field.purpose}</p></div><div className="flex gap-2"><span className={field.ownership === "own" ? "rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-800" : "rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground"}>{field.ownership === "own" ? "Próprio" : "Herdado"}</span><span className={field.isActive ? "rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-800" : "rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-900"}>{field.isActive ? "Ativo" : "Inativo"}</span></div></div>
      <p className="mt-2 text-sm text-muted-foreground">Próxima ação: {field.isActive ? "editar o mesmo fato ou inativar este field" : "reativar este field"}.</p>
      <details className="mt-3" open={targeted}><summary className="flex min-h-11 cursor-pointer items-center text-sm font-medium outline-none focus-visible:ring-4 focus-visible:ring-brand-600/20">Detalhes e edição</summary>
        <dl className="grid gap-2 text-sm sm:grid-cols-2"><Detail label="Tipo" value={field.valueType} /><Detail label="Escopo" value={field.valueScope} /><Detail label="Obrigação" value={field.obligation} /><Detail label="Validação" value={field.validation.kind} /></dl>
        <form action={action} className="mt-4 space-y-4"><input type="hidden" name="operation" value="update" /><input type="hidden" name="id" value={field.id} /><input type="hidden" name="expectedUpdatedAt" value={field.updatedAt} /><DefinitionFields field={field} />
          <label className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm"><input className="mt-1 size-5" type="checkbox" name="sameFactConfirmed" /><span>Confirmo que finalidade, residência, escopo e significado material continuam representando o mesmo fato.</span></label>
          <ActionButton pending={pending}>Salvar edição</ActionButton>
        </form>
      </details>
      <form action={action} className="mt-3"><input type="hidden" name="operation" value="toggle" /><input type="hidden" name="id" value={field.id} /><input type="hidden" name="expectedUpdatedAt" value={field.updatedAt} /><input type="hidden" name="nextActive" value={String(!field.isActive)} /><button disabled={pending} className="min-h-11 rounded-md border border-brand-300 px-4 text-sm font-medium text-brand-700 outline-none focus-visible:ring-4 focus-visible:ring-brand-300/40 disabled:opacity-60" type="submit">{field.isActive ? "Inativar" : "Reativar"}</button></form>
    </li>
  );
}

function DefinitionFields({ field, suggestedPurpose }: { field?: ResolvedFactualField; suggestedPurpose?: string }) {
  const validation = field?.validation;
  return <div className="grid gap-3 sm:grid-cols-2">
    <Text name="purpose" label="Finalidade" required defaultValue={field?.purpose ?? suggestedPurpose} className="sm:col-span-2" />
    <Choice name="valueType" label="Tipo" defaultValue={field?.valueType ?? "string"} values={factualFieldValueTypes} />
    <Choice name="valueScope" label="Escopo" defaultValue={field?.valueScope ?? "business"} values={factualFieldValueScopes} />
    <Choice name="obligation" label="Obrigação" defaultValue={field?.obligation ?? "required"} values={factualFieldObligations} />
    <Choice name="validationKind" label="Validação" defaultValue={validation?.kind ?? "type_only"} values={validationKinds} />
    <Text name="allowedValues" label="Opções, separadas por vírgula" defaultValue={validation && "allowedValues" in validation ? validation.allowedValues?.join(", ") : ""} />
    <Text name="minimum" label="Mínimo numérico" type="number" defaultValue={validation?.kind === "number_range" ? validation.minimum : undefined} />
    <Text name="maximum" label="Máximo numérico" type="number" defaultValue={validation?.kind === "number_range" ? validation.maximum : undefined} />
    <Text name="minItems" label="Mínimo de itens" type="number" defaultValue={validation?.kind === "string_list" ? validation.minItems : undefined} />
    <Text name="maxItems" label="Máximo de itens" type="number" defaultValue={validation?.kind === "string_list" ? validation.maxItems : undefined} />
    <ConditionFields label="Obrigatoriedade condicional" name="requiredWhen" condition={field?.requiredWhen} />
    <ConditionFields label="Aplicabilidade" name="applicableWhen" condition={field?.applicableWhen} />
  </div>;
}

function ConditionFields({ label, name, condition }: { label: string; name: "requiredWhen" | "applicableWhen"; condition?: ResolvedFactualField["requiredWhen"] }) {
  return <fieldset className="grid gap-3 rounded-md border border-border p-3 sm:col-span-2 sm:grid-cols-3"><legend className="px-1 text-sm font-medium">{label}</legend><Text name={`${name}FieldKey`} label="fieldKey relacionado" defaultValue={condition?.fieldKey} /><Choice name={`${name}Operator`} label="Operador" defaultValue={condition?.operator ?? "equals"} values={["equals", "in"] as const} /><Text name={`${name}Value`} label="Valor" defaultValue={condition ? Array.isArray(condition.value) ? condition.value.join(", ") : String(condition.value) : ""} /></fieldset>;
}

const control = "min-h-11 w-full rounded-md border border-border bg-background px-3 text-sm outline-none focus-visible:ring-4 focus-visible:ring-brand-600/20";
function Text({ name, label, defaultValue, required, type = "text", className = "" }: { name: string; label: string; defaultValue?: string | number; required?: boolean; type?: string; className?: string }) { return <label className={`space-y-1 ${className}`}><span className="text-sm font-medium">{label}</span><input className={control} name={name} defaultValue={defaultValue} required={required} type={type} /></label>; }
function Choice<T extends string>({ name, label, defaultValue, values }: { name: string; label: string; defaultValue: T; values: readonly T[] }) { return <label className="space-y-1"><span className="text-sm font-medium">{label}</span><select className={control} name={name} defaultValue={defaultValue}>{values.map((value) => <option key={value} value={value}>{humanize(value)}</option>)}</select></label>; }
function ActionButton({ children, pending }: { children: string; pending: boolean }) { return <button disabled={pending} className="min-h-11 rounded-md bg-brand-600 px-4 text-sm font-medium text-white outline-none focus-visible:ring-4 focus-visible:ring-brand-600/30 disabled:opacity-60" type="submit">{pending ? "Salvando…" : children}</button>; }
function Detail({ label, value }: { label: string; value: string }) { return <div><dt className="font-medium">{label}</dt><dd className="text-muted-foreground">{humanize(value)}</dd></div>; }
function Failure({ message }: { message: string }) { return <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">{message} Nenhum fallback foi aplicado.</p>; }
function layerLabel(value: string) { return ({ universal: "Universal", segment: "Segmento", niche: "Nicho", ultra_niche: "Ultranicho" } as Record<string, string>)[value] ?? humanize(value); }
function humanize(value: string) { return value.replace(/[._-]/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase()); }
