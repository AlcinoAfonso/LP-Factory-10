"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";

import type { AdminInputCatalogLifecycleState } from "@/lib/admin/adapters/adminInputCatalogLifecycleAdapter";
import {
  applyInputCatalogDraftOperationAction,
  initializeInputCatalogDraftAction,
  prepareInputCatalogPublicationAction,
  reconcileInputCatalogPublishedDraftAction,
  validateInputCatalogDraftAction,
  type InputCatalogLifecycleActionState,
} from "../actions";

const initialState: InputCatalogLifecycleActionState = { error: null, message: null, handoff: null, revision: 0 };
type SubmittedAction = "initialize" | "operation" | "validation" | "publication" | "reconciliation";

export function AdminInputCatalogLifecycle({ state }: Readonly<{ state: AdminInputCatalogLifecycleState }>) {
  const feedbackRef = useRef<HTMLParagraphElement>(null);
  const [operationKind, setOperationKind] = useState<"add" | "change" | "retire">("add");
  const [lastAction, setLastAction] = useState<SubmittedAction | null>(null);
  const [initializeState, initializeAction, initializePending] = useActionState(initializeInputCatalogDraftAction, initialState);
  const [operationState, operationAction, operationPending] = useActionState(applyInputCatalogDraftOperationAction, initialState);
  const [validationState, validationAction, validationPending] = useActionState(validateInputCatalogDraftAction, initialState);
  const [publicationState, publicationAction, publicationPending] = useActionState(prepareInputCatalogPublicationAction, initialState);
  const [reconciliationState, reconciliationAction, reconciliationPending] = useActionState(reconcileInputCatalogPublishedDraftAction, initialState);
  const actionStates: Record<SubmittedAction, InputCatalogLifecycleActionState> = {
    initialize: initializeState,
    operation: operationState,
    validation: validationState,
    publication: publicationState,
    reconciliation: reconciliationState,
  };
  const feedback = lastAction ? actionStates[lastAction] : null;
  const draft = state.draft;
  const taxonLayers = draft?.editorLayers.filter((layer) => layer.target.kind === "taxon_layer") ?? [];

  useEffect(() => {
    if (state.error || (feedback && feedback.revision > 0)) feedbackRef.current?.focus();
  }, [feedback, state.error]);

  return (
    <section aria-labelledby="catalog-lifecycle-title" className="min-w-0 space-y-4 rounded-lg border border-border bg-card p-4">
      <div className="flex min-w-0 flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Lifecycle repo-only</p>
          <h2 id="catalog-lifecycle-title" className="mt-1 text-lg font-semibold text-foreground">Catálogo de entradas</h2>
          <p className="mt-1 break-words text-sm leading-6 text-muted-foreground">O editor aplica uma operação discriminada ao próximo draft. Ele não publica, ativa taxon nem edita o registry implantado.</p>
        </div>
        <span className="rounded-full bg-brand-50 px-3 py-1 text-sm font-semibold text-brand-700">Atual v{state.currentVersion}</span>
      </div>
      <dl className="grid gap-2 text-sm sm:grid-cols-2">
        <Metric label="Versões publicadas" value={state.publishedVersions.join(", ")} />
        <Metric label="Taxons ativos" value={String(state.totalActiveTaxons)} />
      </dl>
      {state.error ? <Status focusRef={feedbackRef} tone="error">{state.error}</Status> : null}
      {feedback?.error ? <Status focusRef={feedbackRef} tone="error">{feedback.error}</Status> : null}
      {feedback?.message ? <Status focusRef={feedbackRef} tone="success">{feedback.message}</Status> : null}

      {!state.error && !draft ? (
        <form action={initializeAction} onSubmit={() => setLastAction("initialize")}>
          <ActionButton pending={initializePending}>Criar próximo draft v{state.currentVersion + 1}</ActionButton>
        </form>
      ) : null}

      {draft ? (
        <div className="min-w-0 space-y-4">
          <dl className="grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-4">
            <Metric label="Draft" value={`v${draft.targetVersion}`} />
            <Metric label="Revisão" value={String(draft.revision)} />
            <Metric label="Validação" value={draft.validationCurrent ? "Atual" : "Pendente"} />
            <Metric label="Publicação" value={draft.publicationPrepared ? "Preparada" : "Pendente"} />
          </dl>

          {draft.publishedReconciliationRequired ? (
            <div className="rounded-md border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
              <p className="font-semibold">Registry implantado e fingerprint comprovado</p>
              <p className="mt-1">{draft.publishedReconciliationAllowed ? "Encerre a residência temporária." : "A reconciliação só pode ocorrer em Production."}</p>
              <form action={reconciliationAction} className="mt-3" onSubmit={() => setLastAction("reconciliation")}>
                <input type="hidden" name="expectedRevision" value={draft.revision} />
                <ActionButton disabled={!draft.publishedReconciliationAllowed} pending={reconciliationPending}>Reconciliar draft já implantado</ActionButton>
              </form>
            </div>
          ) : (
            <>
              <dl className="grid gap-2 text-sm sm:grid-cols-3">
                <Metric label="Sem mudança material" value={String(draft.totals.noMaterialChange)} />
                <Metric label="Evolução compatível" value={String(draft.totals.compatibleEvolution)} />
                <Metric label="Revisão necessária" value={String(draft.totals.reviewRequired)} />
              </dl>
              <ImpactList draft={draft} />
              <EditorLayerList layers={draft.editorLayers} />

              <form action={operationAction} className="min-w-0 space-y-4 rounded-md border border-border bg-background p-4" onSubmit={() => setLastAction("operation")}>
                <input type="hidden" name="expectedRevision" value={draft.revision} />
                <fieldset>
                  <legend className="text-sm font-semibold text-foreground">Operação no draft</legend>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {(["add", "change", "retire"] as const).map((kind) => (
                      <label key={kind} className="flex min-h-11 items-center gap-2 rounded-md border border-border px-3 py-2 text-sm">
                        <input checked={operationKind === kind} name="operationKind" onChange={() => setOperationKind(kind)} type="radio" value={kind} />
                        {kind === "add" ? "Adicionar" : kind === "change" ? "Alterar" : "Retirar"}
                      </label>
                    ))}
                  </div>
                </fieldset>
                <div className="grid min-w-0 gap-4 sm:grid-cols-2">
                  <SelectField id="target-kind" label="Camada alvo" name="targetKind"><option value="universal">Universal</option><option value="taxon_layer">Taxon explícito</option></SelectField>
                  <SelectField id="target-taxon" label="Taxon da camada" name="taxonId">
                    <option value="">Selecione quando aplicável</option>
                    {taxonLayers.map((layer) => layer.target.kind === "taxon_layer" ? <option key={layer.target.taxonId} value={layer.target.taxonId}>{layer.label} · {layer.level}</option> : null)}
                  </SelectField>
                </div>
                <TextField id="field-key" label="Chave do field" hint="Para alterar ou retirar, use uma chave existente na camada." name="fieldKey" required />
                {operationKind !== "retire" ? <FieldContractEditor /> : null}
                <ActionButton pending={operationPending}>{operationKind === "add" ? "Adicionar ao draft" : operationKind === "change" ? "Aplicar alteração" : "Retirar no draft"}</ActionButton>
              </form>

              <div className="flex flex-wrap gap-3">
                <form action={validationAction} onSubmit={() => setLastAction("validation")}><input type="hidden" name="expectedRevision" value={draft.revision} /><ActionButton pending={validationPending} secondary>Revalidar conteúdo e impactos</ActionButton></form>
                <form action={publicationAction} onSubmit={() => setLastAction("publication")}><input type="hidden" name="expectedRevision" value={draft.revision} /><ActionButton disabled={!draft.validationCurrent} pending={publicationPending}>Preparar publicação repo-only</ActionButton></form>
              </div>
              {publicationState.handoff ? <label className="block min-w-0 space-y-2"><span className="text-sm font-medium text-foreground">Instruções congeladas de publicação</span><textarea aria-label="Instruções congeladas de publicação" className="min-h-56 w-full rounded-md border border-border bg-muted/30 p-3 font-mono text-xs leading-5 text-foreground" readOnly value={publicationState.handoff} /></label> : null}
            </>
          )}
        </div>
      ) : null}
    </section>
  );
}

function FieldContractEditor() {
  const [valueType, setValueType] = useState("string");
  const [obligation, setObligation] = useState("required");
  const [applicableWhenEnabled, setApplicableWhenEnabled] = useState(false);
  return (
    <fieldset className="min-w-0 rounded-md border border-border p-4">
      <legend className="px-1 text-sm font-semibold text-foreground">Contrato completo do field</legend>
      <TextField id="field-purpose" label="Finalidade" hint="Descreva o uso factual do field." name="purpose" required />
      <div className="grid min-w-0 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <SelectField id="value-type" label="Tipo" name="valueType" value={valueType} onChange={setValueType}>{["string", "phone", "email", "url", "enum", "string_list", "boolean", "number_range", "keyword_map", "asset_reference", "color_palette", "offering_scope"].map((value) => <option key={value} value={value}>{value}</option>)}</SelectField>
        <SelectField id="value-scope" label="Escopo" name="valueScope">{["account", "business", "offer", "campaign", "landing_page"].map((value) => <option key={value} value={value}>{value}</option>)}</SelectField>
        <SelectField id="expected-origin" label="Origem esperada" name="expectedValueOrigin">{["account_provided", "business_provided", "offer_provided", "campaign_provided", "landing_page_provided"].map((value) => <option key={value} value={value}>{value}</option>)}</SelectField>
        <SelectField id="obligation" label="Obrigação" name="obligation" value={obligation} onChange={setObligation}>{["required", "optional", "conditional"].map((value) => <option key={value} value={value}>{value}</option>)}</SelectField>
        <SelectField id="substitution" label="Substituição" name="substitutionPolicy">{["not_applicable", "forbidden", "explicit_allowed"].map((value) => <option key={value} value={value}>{value}</option>)}</SelectField>
      </div>
      <TextField id="allowed-values" label="Valores permitidos" hint="Separe por vírgulas para enum ou lista; deixe vazio nos demais tipos." name="allowedValues" />
      {valueType === "number_range" ? <div className="grid min-w-0 gap-4 sm:grid-cols-2"><TextField id="minimum" label="Mínimo" hint="Opcional; ao alterar, vazio preserva o limite atual." name="minimum" step="any" type="number" /><TextField id="maximum" label="Máximo" hint="Opcional; ao alterar, vazio preserva o limite atual." name="maximum" step="any" type="number" /></div> : null}
      {obligation === "conditional" ? <ConditionEditor legend="Condição obrigatória" prefix="requiredWhen" /> : null}
      <fieldset className="mt-4 min-w-0 rounded-md border border-border p-3">
        <legend className="px-1 text-sm font-semibold text-foreground">Aplicabilidade opcional</legend>
        <label className="flex min-h-11 items-center gap-2 text-sm"><input checked={applicableWhenEnabled} name="applicableWhenEnabled" onChange={(event) => setApplicableWhenEnabled(event.currentTarget.checked)} type="checkbox" value="true" />Declarar applicableWhen</label>
        {applicableWhenEnabled ? <ConditionEditor legend="Condição de aplicabilidade" prefix="applicableWhen" /> : null}
      </fieldset>
      {valueType === "boolean" ? <fieldset className="mt-4 min-w-0 rounded-md border border-border p-3"><legend className="px-1 text-sm font-semibold text-foreground">Capability binding opcional</legend><label className="flex min-h-11 items-center gap-2 text-sm"><input name="capabilityBindingEnabled" type="checkbox" value="true" />Vincular true ao slot applicable_capabilities</label></fieldset> : null}
      <fieldset className="mt-4"><legend className="text-sm font-semibold text-foreground">Planos permitidos</legend><div className="mt-2 flex flex-wrap gap-2">{["starter", "lite", "pro", "ultra"].map((plan) => <label key={plan} className="flex min-h-11 items-center gap-2 rounded-md border border-border px-3 py-2 text-sm"><input defaultChecked name="allowedPlans" type="checkbox" value={plan} />{plan}</label>)}</div></fieldset>
      <TextField id="evidence-summary" label="Evidência da decisão" hint="A referência persistida será decision:e20-2-human." name="evidenceSummary" required />
    </fieldset>
  );
}

function ConditionEditor({ legend, prefix }: Readonly<{ legend: string; prefix: "requiredWhen" | "applicableWhen" }>) {
  const [operator, setOperator] = useState("equals");
  const [valueKind, setValueKind] = useState("text");
  return <fieldset className="mt-4 min-w-0 rounded-md border border-border p-3"><legend className="px-1 text-sm font-semibold text-foreground">{legend}</legend><div className="grid min-w-0 gap-4 sm:grid-cols-2 lg:grid-cols-4">
    <TextField id={`${prefix}-field-key`} label="Field observado" name={`${prefix}FieldKey`} required />
    <SelectField id={`${prefix}-operator`} label="Operador" name={`${prefix}Operator`} value={operator} onChange={(next) => { setOperator(next); setValueKind(next === "in" ? "list" : valueKind === "list" ? "text" : valueKind); }}><option value="equals">equals</option><option value="in">in</option></SelectField>
    <SelectField id={`${prefix}-value-kind`} label="Formato do valor" name={`${prefix}ValueKind`} value={valueKind} onChange={setValueKind}>{operator === "in" ? <option value="list">Lista</option> : <><option value="text">Texto</option><option value="boolean">Booleano</option></>}</SelectField>
    {valueKind === "boolean" ? <SelectField id={`${prefix}-value`} label="Valor" name={`${prefix}Value`}><option value="true">true</option><option value="false">false</option></SelectField> : <TextField id={`${prefix}-value`} label="Valor" hint={operator === "in" || valueKind === "list" ? "Separe os itens por vírgulas." : "Valor escalar comparado."} name={`${prefix}Value`} required />}
  </div></fieldset>;
}

function EditorLayerList({ layers }: Readonly<{ layers: NonNullable<AdminInputCatalogLifecycleState["draft"]>["editorLayers"] }>) {
  return <details className="min-w-0 rounded-md border border-border bg-background p-3"><summary className="min-h-11 cursor-pointer py-2 font-medium text-foreground">Camadas editáveis ({layers.length})</summary><ul className="mt-3 grid gap-2 text-sm">{layers.map((layer) => <li key={layer.target.kind === "universal" ? "universal" : layer.target.taxonId} className="min-w-0 rounded border border-border px-3 py-2"><span className="break-words font-medium">{layer.label} · {layer.level}</span><p className="mt-1 break-words text-xs text-muted-foreground">Fields próprios: {layer.ownFields.map((field) => `${field.fieldKey}${field.retiredInVersion === null ? "" : " (retirado)"}`).join(", ") || "nenhum"}</p></li>)}</ul></details>;
}

function ImpactList({ draft }: Readonly<{ draft: NonNullable<AdminInputCatalogLifecycleState["draft"]> }>) {
  return <details open className="min-w-0 rounded-md border border-border bg-background p-3"><summary className="min-h-11 cursor-pointer py-2 font-medium text-foreground">Impactos em todos os taxons ({draft.impacts.length})</summary><ul className="mt-3 grid min-w-0 gap-2 text-sm">{draft.impacts.map((impact) => <li key={impact.taxon.id} className="min-w-0 rounded border border-border px-3 py-2"><div className="flex min-w-0 flex-wrap justify-between gap-2"><span className="min-w-0 break-words font-medium">{impact.taxon.name} · {impact.taxon.level}</span><span>{impact.classification}</span></div><p className="mt-1 break-words text-xs text-muted-foreground">Adicionados: {impact.addedFieldKeys.join(", ") || "nenhum"} · Expandidos: {impact.expandedAllowedValueFieldKeys.join(", ") || "nenhum"} · Revisão: {impact.reviewRequiredFieldKeys.join(", ") || "nenhum"}</p>{impact.classification === "review_required" ? <Link className="mt-2 inline-flex min-h-11 items-center font-medium text-brand-700 underline" href={`/admin/taxonomia/${impact.taxon.id}?catalogDraftRevision=${draft.revision}`}>{draft.reviewedTaxonIds.includes(impact.taxon.id) ? "Reavaliar decisão" : "Abrir decisão factual"}</Link> : null}</li>)}</ul></details>;
}

function TextField({ hint = "", id, label, name, required = false, step, type = "text" }: Readonly<{ hint?: string; id: string; label: string; name: string; required?: boolean; step?: string; type?: "number" | "text" }>) {
  return <div className="mt-4 min-w-0"><label htmlFor={id} className="text-sm font-semibold text-foreground">{label}</label>{hint ? <p id={`${id}-hint`} className="mt-1 break-words text-xs text-muted-foreground">{hint}</p> : null}<input aria-describedby={hint ? `${id}-hint` : undefined} id={id} name={name} required={required} step={step} type={type} className="mt-2 min-h-11 w-full min-w-0 rounded-md border border-border bg-background px-3 text-sm outline-none focus-visible:ring-4 focus-visible:ring-brand-600/20" /></div>;
}

function SelectField({ children, id, label, name, onChange, value }: Readonly<{ children: React.ReactNode; id: string; label: string; name: string; onChange?: (value: string) => void; value?: string }>) {
  return <label className="mt-4 min-w-0 text-sm font-semibold text-foreground" htmlFor={id}>{label}<select id={id} name={name} value={value} onChange={onChange ? (event) => onChange(event.currentTarget.value) : undefined} className="mt-2 min-h-11 w-full min-w-0 rounded-md border border-border bg-background px-3 text-sm font-normal outline-none focus-visible:ring-4 focus-visible:ring-brand-600/20">{children}</select></label>;
}

function Metric({ label, value }: Readonly<{ label: string; value: string }>) { return <div className="min-w-0 rounded-md border border-border bg-background px-3 py-2"><dt className="text-xs text-muted-foreground">{label}</dt><dd className="mt-1 break-words font-semibold text-foreground">{value}</dd></div>; }
function Status({ children, focusRef, tone }: Readonly<{ children: string; focusRef: React.Ref<HTMLParagraphElement>; tone: "error" | "success" }>) { return <p ref={focusRef} tabIndex={-1} aria-live="polite" role={tone === "error" ? "alert" : "status"} className={`break-words rounded-md border px-3 py-2 text-sm outline-none ${tone === "error" ? "border-red-200 bg-red-50 text-red-800" : "border-emerald-200 bg-emerald-50 text-emerald-800"}`}>{children}</p>; }
function ActionButton({ children, disabled = false, pending, secondary = false }: Readonly<{ children: React.ReactNode; disabled?: boolean; pending: boolean; secondary?: boolean }>) { return <button type="submit" disabled={pending || disabled} className={secondary ? "min-h-11 rounded-md border border-border bg-background px-4 py-2 text-sm font-medium outline-none hover:bg-muted focus-visible:ring-4 focus-visible:ring-brand-600/20 disabled:opacity-50" : "min-h-11 rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white outline-none hover:bg-brand-700 focus-visible:ring-4 focus-visible:ring-brand-600/20 disabled:opacity-50"}>{pending ? "Processando…" : children}</button>; }
