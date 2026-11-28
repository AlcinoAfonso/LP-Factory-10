"use client";

import { startTransition, useActionState, useEffect, useRef, useState, useSyncExternalStore, type KeyboardEvent, type ReactNode } from "react";

import { OpenAiDialogueCosts } from "./OpenAiDialogueCosts";
import { OpenAiCostAccountFilter } from "./OpenAiCostAccountFilter";
import { OpenAiCostAccountPeriod } from "./OpenAiCostAccountPeriod";
import { OpenAiOccurrenceCosts } from "./OpenAiOccurrenceCosts";
import { OpenAiOccurrencePeriod } from "./OpenAiOccurrencePeriod";
import { AdminStatusBadge } from "@/components/admin/AdminStatusBadge";
import type { OpenAiActiveCostReadModel, OpenAiCostReadWorkloadId } from "@/openai-costs/active-contracts";
import type { OpenAiCostsFinancialComposition } from "@/openai-costs/dashboard";
import { refreshOpenAiCostsAction, type OpenAiCostsActionState } from "../actions";
import type { OpenAiCostAccountOption } from "../action-core";
import {
  OpenAiCostExecutionDetails,
  OpenAiEconomicHierarchyView,
  workloadLabel,
} from "./OpenAiEconomicHierarchy";

type Props = Readonly<{ startDate: string; endDate: string }>;

const INITIAL_STATE: OpenAiCostsActionState = {
  status: "idle",
  code: null,
  message: "Escolha os filtros e selecione Consultar.",
  dashboard: null,
};
const OPENAI_USAGE_URL = "https://platform.openai.com/usage";
const OPENAI_BILLING_URL = "https://platform.openai.com/settings/organization/billing/overview";
const WORKLOAD_OPTIONS = [
  "niche_resolution",
  "pending_setup_conversation",
  "commercial_activation_draft_generation",
  "taxon_input_catalog_sufficiency_evaluation",
  "communication_base_stage1_assistance",
  "communication_base_stage2_intelligence",
  "communication_base_agent",
  "landing_page_dynamic_market_research",
  "supabase_inspect",
] as const satisfies readonly OpenAiCostReadWorkloadId[];
const controlClassName = "min-h-11 min-w-0 w-full rounded-md border border-input bg-background px-1.5 text-sm outline-none focus-visible:ring-4 focus-visible:ring-brand-600/30 disabled:cursor-not-allowed disabled:opacity-60 sm:px-3";

export function OpenAiCostsDashboard({ startDate, endDate }: Props) {
  const [periodMode, setPeriodMode] = useState<"current_month" | "custom">("current_month");
  const [universe, setUniverse] = useState<"" | "lp_factory" | "client">("");
  const [account, setAccount] = useState<OpenAiCostAccountOption | null>(null);
  const [product, setProduct] = useState("");
  const [workload, setWorkload] = useState("");
  const [start, setStart] = useState(startDate);
  const [end, setEnd] = useState(endDate);
  const [state, formAction, pending] = useActionState(async (previous: OpenAiCostsActionState, formData: FormData) => {
    const result = await refreshOpenAiCostsAction(previous, formData);
    return result.dashboard ? result : { ...result, dashboard: previous.dashboard };
  }, INITIAL_STATE);
  const resultRef = useRef<HTMLDivElement>(null);
  const dashboard = state.dashboard;
  const showEvents = dashboard && (dashboard.activeFilters.workload || dashboard.activeFilters.product || dashboard.activeFilters.universe === "lp_factory");
  const allSourcesAvailable = dashboard && !dashboard.officialErrorCode && dashboard.active && dashboard.legacy;

  useEffect(() => {
    if (!pending && state.status !== "idle") resultRef.current?.focus();
  }, [pending, state.status]);

  const query = (
    <>
      <form onSubmit={event => {
        event.preventDefault();
        if (pending) return;
        const selection = new FormData(event.currentTarget);
        startTransition(() => formAction(selection));
      }} className="rounded-lg border border-border bg-card p-2 sm:p-3">
        <input type="hidden" name="accountId" value={account?.id ?? ""} />
        <input type="hidden" name="product" value={product} />
        <fieldset disabled={pending} className="min-w-0 space-y-2">
          <legend className="sr-only">Período e filtros da consulta</legend>
          <div className="grid grid-cols-2 items-end gap-1.5 min-[420px]:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)_minmax(0,1fr)] sm:gap-3 [&>label:last-child]:col-span-2 min-[420px]:[&>label:last-child]:col-span-1">
            <FormLabel label="Período">
              <select name="periodMode" value={periodMode} onChange={(event) => setPeriodMode(event.target.value as typeof periodMode)} className={controlClassName}>
                <option value="current_month">Mês atual</option><option value="custom">Personalizado</option>
              </select>
            </FormLabel>
            <OpenAiCostAccountFilter value={account} onChange={setAccount} disabled={universe === "lp_factory" || pending} />
            <FormLabel label="Workload">
              <select name="workload" value={workload} onChange={event => setWorkload(event.target.value)} className={controlClassName}>
                <option value="">Todos</option>
                {WORKLOAD_OPTIONS.map((workload) => <option key={workload} value={workload}>{workloadLabel(workload)}</option>)}
              </select>
            </FormLabel>
          </div>
          {periodMode === "custom" ? <div className="grid grid-cols-2 gap-2">
            <FormLabel label="Data inicial">
              <input type="date" name="startDate" value={start} onChange={event => setStart(event.target.value)} max={endDate} required className={controlClassName} />
            </FormLabel>
            <FormLabel label="Data final">
              <input type="date" name="endDate" value={end} onChange={event => setEnd(event.target.value)} max={endDate} required className={controlClassName} />
            </FormLabel>
          </div> : null}
          <div className="flex flex-wrap items-start justify-between gap-x-2">
            <details className="min-w-0 flex-1">
              <summary className="min-h-11 cursor-pointer py-3 text-sm font-medium text-muted-foreground">
                Mais filtros{universe || product ? " · ativos" : ""}
              </summary>
              <div className="grid gap-2 pb-2 sm:grid-cols-2">
                <FormLabel label="Universo">
                  <select name="universe" value={universe} onChange={event => {
                    const next = event.target.value as typeof universe;
                    setUniverse(next);
                    if (next === "lp_factory") { setAccount(null); setProduct(""); }
                  }} className={controlClassName}>
                    <option value="">Todos os universos</option><option value="client">Cliente</option><option value="lp_factory">LP Factory</option>
                  </select>
                </FormLabel>
                <FormLabel label="Produto/serviço">
                  <select value={product} onChange={event => setProduct(event.target.value)} className={controlClassName} disabled={universe === "lp_factory"}>
                    <option value="">Todos</option><option value="communication_base">Base de Comunicação</option><option value="unlinked">Sem produto identificado</option>
                  </select>
                </FormLabel>
              </div>
            </details>
            <button type="submit" disabled={pending} className="inline-flex min-h-11 items-center justify-center rounded-md bg-brand-700 px-3 py-2 text-sm font-semibold text-white transition hover:bg-brand-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/30 disabled:opacity-60">
              {pending ? "Consultando…" : "Consultar"}
            </button>
          </div>
        </fieldset>
      </form>

      <div ref={resultRef} tabIndex={-1} className="rounded-lg outline-none focus-visible:ring-4 focus-visible:ring-brand-600/30" aria-live="polite" aria-atomic="true">
        {pending ? <p className="text-sm text-muted-foreground">{dashboard ? "Consultando. Os resultados anteriores permanecem visíveis." : "Consultando custos…"}</p>
          : state.status === "error" ? <StatusPanel tone="danger" title="Consulta indisponível" role="alert">{state.message} {dashboard ? "Os resultados anteriores permanecem visíveis." : null}</StatusPanel>
            : state.status === "idle" ? <p className="text-sm text-muted-foreground">{state.message}</p>
              : <p className={allSourcesAvailable ? "sr-only" : "text-sm text-muted-foreground"}>{allSourcesAvailable ? "Consulta atualizada." : "Há fontes indisponíveis. Consulte a Visão global."}</p>}
      </div>

      {dashboard?.filteredActive ? showEvents ? <OpenAiOccurrencePeriod dashboard={dashboard} showActionSubtotals={false} /> :
        <OpenAiCostAccountPeriod active={dashboard.filteredActive} period={`${formatDate(dashboard.selection.startDate)} a ${formatDate(dashboard.selection.endDate)}`} />
        : dashboard ? <p className="text-sm text-muted-foreground">Custos ativos indisponíveis para esta consulta.</p> : null}

    </>
  );

  const global = (
    <>
      {dashboard ? <>
        <DashboardResult dashboard={dashboard} />
        {dashboard.filteredActive ? <DiagnosticDisclosure title="Ocorrências e subtotais por ação">
          <OpenAiOccurrencePeriod dashboard={dashboard} />
        </DiagnosticDisclosure> : null}
      </> : <p className="text-sm text-muted-foreground">Selecione um período na aba Consulta para ver os totais globais.</p>}
      <ExternalLink href={OPENAI_USAGE_URL}>Abrir Usage na OpenAI</ExternalLink>
      <DiagnosticDisclosure title="Consulta técnica por identificador">
        <OpenAiOccurrenceCosts />
      </DiagnosticDisclosure>
    </>
  );

  return (
    <div className="min-w-0 space-y-3">
      <header className="flex flex-wrap items-center justify-between gap-x-3">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Custos OpenAI</h1>
        <ExternalLink href={OPENAI_BILLING_URL}>Consultar saldo OpenAI ↗</ExternalLink>
      </header>
      <CostTabs query={query} global={global} />
    </div>
  );
}

const COST_TABS = [{ id: "consulta", label: "Consulta" }, { id: "global", label: "Visão global" }] as const;
type CostTab = typeof COST_TABS[number]["id"];
const desktopQuery = "(min-width: 768px)";

function subscribeToDesktop(onChange: () => void) {
  const media = window.matchMedia(desktopQuery);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

function desktopSnapshot() {
  return window.matchMedia(desktopQuery).matches;
}

function CostTabs({ query, global }: Readonly<{ query: ReactNode; global: ReactNode }>) {
  const [active, setActive] = useState<CostTab>("consulta");
  const desktop = useSyncExternalStore(subscribeToDesktop, desktopSnapshot, () => false);

  function selectWithKeyboard(event: KeyboardEvent<HTMLButtonElement>, tab: CostTab) {
    const directional = desktop
      ? event.key === "ArrowLeft" || event.key === "ArrowRight"
      : event.key === "ArrowUp" || event.key === "ArrowDown";
    const next = event.key === "Home" ? "consulta" : event.key === "End" ? "global" :
      directional ? tab === "consulta" ? "global" : "consulta" : null;
    if (!next) return;
    event.preventDefault();
    setActive(next);
    document.getElementById(`custos-tab-${next}`)?.focus();
  }

  return (
    <div className="min-w-0 space-y-3">
      <div role="tablist" aria-label="Visões de custos" aria-orientation={desktop ? "horizontal" : "vertical"}
        className="grid gap-1 md:flex md:border-b md:border-border">
        {COST_TABS.map(tab => (
          <button key={tab.id} id={`custos-tab-${tab.id}`} type="button" role="tab" aria-selected={active === tab.id}
            aria-controls={`custos-panel-${tab.id}`} tabIndex={active === tab.id ? 0 : -1}
            onClick={() => setActive(tab.id)} onKeyDown={event => selectWithKeyboard(event, tab.id)}
            className={`flex min-h-11 items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-left text-sm font-semibold outline-none focus-visible:ring-2 focus-visible:ring-ring md:rounded-none md:border-x-0 md:border-t-0 md:border-b-2 md:bg-transparent ${active === tab.id ? "border-l-2 border-l-green-600 text-foreground md:border-b-brand-700 md:border-l-0" : "text-muted-foreground md:border-b-transparent"}`}>
            <span aria-hidden="true" className={`w-3 md:hidden ${active === tab.id ? "text-green-700" : ""}`}>{active === tab.id ? "⌄" : "›"}</span>
            {tab.label}
          </button>
        ))}
      </div>
      {COST_TABS.map(tab => (
        <div key={tab.id} id={`custos-panel-${tab.id}`} role="tabpanel" aria-labelledby={`custos-tab-${tab.id}`}
          hidden={active !== tab.id} className="min-w-0 space-y-3">
          {active === tab.id ? tab.id === "consulta" ? query : global : null}
        </div>
      ))}
    </div>
  );
}

function DiagnosticDisclosure({ title, children }: Readonly<{ title: string; children: ReactNode }>) {
  return (
    <details className="rounded-lg border border-border bg-card px-3">
      <summary className="min-h-11 cursor-pointer py-3 text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring">{title}</summary>
      <div className="min-w-0 pb-3">{children}</div>
    </details>
  );
}

function DashboardResult({ dashboard }: Readonly<{ dashboard: OpenAiCostsFinancialComposition }>) {
  return (
    <div className="space-y-6">
      <section className="space-y-3" aria-labelledby="cost-summary-title">
        <div className="flex flex-wrap items-center gap-2">
          <h2 id="cost-summary-title" className="text-lg font-semibold text-foreground">Resumo global em USD</h2>
          <AdminStatusBadge tone={dashboard.selection.provisional ? "warning" : "success"}>{dashboard.selection.provisional ? "Provisório" : "Período encerrado"}</AdminStatusBadge>
          {dashboard.globalReconciliationAnomalous ? <AdminStatusBadge tone="danger">Reconciliação anômala</AdminStatusBadge> : null}
        </div>
        <p className="text-sm text-muted-foreground">{formatDate(dashboard.selection.startDate)} a {formatDate(dashboard.selection.endDate)}. O controle ativo usa {dashboard.active?.economicDimensionStatus === "v3_operation_period" ? "o início da operação" : "o início da execução na leitura disponível"}. As fronteiras do período usam UTC.</p>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Gasto oficial OpenAI" value={dashboard.officialTotalUsd === null ? "Indisponível" : formatUsd(dashboard.officialTotalUsd)} detail="Fonte oficial · Costs API" />
          <MetricCard label="Clientes" value={dashboard.economicHierarchy?.activeAvailable && dashboard.economicHierarchy.legacyAvailable ? formatUsd(dashboard.economicHierarchy.clients.calculatedCostUsd) : "Indisponível"} detail="Controle ativo de clientes + histórico E21.4 calculáveis" />
          <MetricCard label="LP Factory" value={dashboard.economicHierarchy?.activeAvailable ? formatUsd(dashboard.economicHierarchy.lpFactory.calculatedCostUsd) : "Indisponível"} detail="Controle ativo interno calculável" />
          <MetricCard label="Outros gastos / reconciliação" value={dashboard.globalReconciliationUsd === null ? "Indisponível" : formatUsd(dashboard.globalReconciliationUsd)} detail="Oficial menos controle ativo e histórico, sem ajuste" />
        </div>
        <p className="rounded-md border border-border bg-muted p-3 text-sm leading-6 text-foreground">Os filtros internos não alteram o gasto oficial nem a reconciliação global. O subtotal filtrado aparece na seção Controle ativo.</p>
      </section>

      {dashboard.legacy && dashboard.legacy.providerCreditFailureCount > 0 ? (
        <StatusPanel tone="danger" title="Crédito ou limite OpenAI requer atenção" role="alert">
          O período contém {dashboard.legacy.providerCreditFailureCount} ocorrência de provider associada a crédito ou limite insuficiente. Consulte a administração da OpenAI; nenhum detalhe financeiro interno é exibido ao cliente.
        </StatusPanel>
      ) : null}
      {dashboard.officialErrorCode ? <StatusPanel tone="warning" title="Costs API indisponível">Os valores internos disponíveis continuam consultáveis. Motivo ({dashboard.officialErrorCode}).</StatusPanel> : null}
      {!dashboard.active ? <StatusPanel tone="danger" title="Controle ativo indisponível" role="alert">Não foi possível ler as execuções do período. Motivo ({dashboard.activeErrorCode ?? "READ_FAILED"}).</StatusPanel> : null}
      {!dashboard.legacy ? <StatusPanel tone="warning" title="Histórico congelado indisponível">Não foi possível ler o histórico do período. Motivo ({dashboard.legacyErrorCode ?? "READ_FAILED"}).</StatusPanel> : null}
      <DiagnosticDisclosure title="Cobertura e atualização"><CoverageSection dashboard={dashboard} /></DiagnosticDisclosure>
      <DiagnosticDisclosure title="Diálogos do Agente Nicho">
        <OpenAiDialogueCosts result={dashboard.dialogues} active={dashboard.active} filters={dashboard.activeFilters} />
      </DiagnosticDisclosure>
      {dashboard.economicHierarchy ? <DiagnosticDisclosure title="Visão econômica por evento">
        <OpenAiEconomicHierarchyView hierarchy={dashboard.economicHierarchy} />
      </DiagnosticDisclosure> : null}
      {dashboard.filteredActive ? <DiagnosticDisclosure title="Custos por modelo">
        <OpenAiCostModelTotals groups={dashboard.filteredActive.modelGroups} />
      </DiagnosticDisclosure> : null}
      {dashboard.filteredActive && (dashboard.activeFilters.universe || dashboard.activeFilters.accountId || dashboard.activeFilters.workload || dashboard.activeFilters.product)
        ? <DiagnosticDisclosure title="Controle ativo">
          <ActiveCostSection active={dashboard.filteredActive} filters={dashboard.activeFilters} />
        </DiagnosticDisclosure>
        : null}
    </div>
  );
}

export function OpenAiCostModelTotals({ groups }: Readonly<{ groups: OpenAiActiveCostReadModel["modelGroups"] }>) {
  return (
    <section className="space-y-3" aria-labelledby="cost-model-totals-title">
      <div>
        <h2 id="cost-model-totals-title" className="text-lg font-semibold text-foreground">Custos do controle ativo por modelo</h2>
        <p className="mt-1 text-sm text-muted-foreground">Segue os filtros do controle ativo. Usa o modelo aplicado quando registrado e o modelo do cálculo nos snapshots antigos. O histórico congelado é exibido separadamente.</p>
      </div>
      {groups.length === 0 ? <p className="text-sm text-muted-foreground">Nenhuma operação encontrada para esta seleção.</p> :
        <div className="overflow-x-auto rounded-md border border-border bg-card">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted text-foreground">
              <tr><TableHeader>Modelo</TableHeader><TableHeader>Operações</TableHeader><TableHeader>Subtotal USD</TableHeader></tr>
            </thead>
            <tbody className="divide-y divide-border">
              {groups.map(group => (
                <tr key={group.model ?? ""}>
                  <th scope="row" className="px-3 py-3 text-sm font-medium [overflow-wrap:anywhere]">{group.model ?? "Sem modelo comprovado"}</th>
                  <TableCell>
                    {group.operationCount}
                    {group.pendingOperationCount > 0 ? <span className="block text-xs text-muted-foreground">Pendentes {group.pendingOperationCount}</span> : null}
                    {group.unavailableOperationCount > 0 ? <span className="block text-xs text-muted-foreground">Indisponíveis {group.unavailableOperationCount}</span> : null}
                  </TableCell>
                  <TableCell>{group.calculatedCostUsd === null ? "Indisponível" : <strong className="whitespace-nowrap">{formatUsd(group.calculatedCostUsd)}</strong>}</TableCell>
                </tr>
              ))}
            </tbody>
          </table>
        </div>}
    </section>
  );
}

function CoverageSection({ dashboard }: Readonly<{ dashboard: OpenAiCostsFinancialComposition }>) {
  return (
    <section className="rounded-lg border border-border bg-card p-4 shadow-card sm:p-6" aria-labelledby="coverage-title">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="coverage-title" className="text-base font-semibold text-foreground">Cobertura e atualização</h2>
        <span className="flex flex-wrap gap-2">
          {dashboard.active ? <AdminStatusBadge tone={dashboard.active.coverage.length > 0 ? "success" : "warning"}>{dashboard.active.coverage.length > 0 ? "Cobertura ativa registrada" : "Cobertura ativa não registrada"}</AdminStatusBadge> : <AdminStatusBadge tone="danger">Controle ativo indisponível</AdminStatusBadge>}
          {dashboard.legacy ? <CoverageBadge status={dashboard.legacy.coverageStatus} /> : <AdminStatusBadge tone="danger">Histórico indisponível</AdminStatusBadge>}
        </span>
      </div>
      <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2 xl:grid-cols-3">
        <Timestamp label="Atualizado na OpenAI" value={dashboard.officialUpdatedAt} />
        <Timestamp label="Último evento ativo" value={dashboard.active?.internalUpdatedAt ?? null} />
        <Timestamp label="Último evento do histórico interno" value={dashboard.legacy?.internalUpdatedAt ?? null} />
      </dl>
      {dashboard.active && dashboard.active.coverage.length > 0 ? (
        <div className="mt-5 overflow-x-auto rounded-md border border-border">
          <table className="w-full min-w-[38rem] text-left text-sm">
            <caption className="sr-only">Cobertura ativa por ambiente e workload</caption>
            <thead className="bg-muted text-foreground"><tr><TableHeader>Ambiente</TableHeader><TableHeader>Workload</TableHeader><TableHeader>Ativa desde</TableHeader><TableHeader>Contrato</TableHeader></tr></thead>
            <tbody className="divide-y divide-border">
              {dashboard.active.coverage.map((item) => <tr key={`${item.environment}:${item.workload}`}><TableCell>{environmentLabel(item.environment)}</TableCell><TableCell>{workloadLabel(item.workload)}</TableCell><TableCell>{formatTimestamp(item.activatedAt)}</TableCell><TableCell><code className="break-all text-xs">{item.contractVersion}</code></TableCell></tr>)}
            </tbody>
          </table>
        </div>
      ) : null}
      <p className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-950">A cobertura é prospectiva por ambiente e workload. Ausência de registro não significa custo zero. A série histórica congelada de Landing Pages permanece separada, e seu write-side prospectivo foi retirado.</p>
    </section>
  );
}

function ActiveCostSection({ active, filters }: Readonly<{ active: OpenAiActiveCostReadModel; filters: OpenAiCostsFinancialComposition["activeFilters"] }>) {
  const filtered = Boolean(filters.universe || filters.accountId || filters.workload || filters.product);
  return (
    <section className="space-y-4" aria-labelledby="active-costs-title">
      <div className="flex flex-wrap items-end justify-between gap-3"><div><h2 id="active-costs-title" className="text-lg font-semibold text-foreground">Controle ativo</h2><p className="mt-1 text-sm text-muted-foreground">{filtered ? "Subtotal e detalhes com os filtros disponíveis." : "Subtotal e detalhes de todas as execuções ativas do período."}</p></div><strong className="text-xl text-foreground">{formatUsd(active.totalCalculatedUsd)}</strong></div>
      <dl className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <CountCard label="Execuções" value={active.executionCount} /><CountCard label="Operações" value={active.operationCount} /><CountCard label="Retries" value={countRetries(active)} /><CountCard label="Custos indisponíveis" value={active.unavailableOperationCount} warning /><CountCard label="Não atribuídas" value={active.unassignedExecutionCount} warning />
      </dl>
      {active.unavailableOperationCount > 0 ? <StatusPanel tone="warning" title="Subtotal calculável incompleto">Há {active.unavailableOperationCount} operação(ões) com custo indisponível. Os subtotais incluem somente componentes calculáveis; a diferença permanece na reconciliação oficial.</StatusPanel> : null}
      {active.pendingOperationCount > 0 ? <StatusPanel tone="warning" title="Operações pendentes">Há {active.pendingOperationCount} operação(ões) sem término; elas não entram no subtotal calculável.</StatusPanel> : null}
      {active.groups.length > 0 ? (
        <div className="overflow-x-auto rounded-lg border border-border bg-card shadow-card"><table className="w-full min-w-[52rem] text-left text-sm"><caption className="sr-only">Subtotal ativo por universo, conta e workload</caption><thead className="bg-muted text-foreground"><tr><TableHeader>Universo</TableHeader><TableHeader>Conta</TableHeader><TableHeader>Workload</TableHeader><TableHeader>Execuções</TableHeader><TableHeader>Operações</TableHeader><TableHeader>Indisponíveis</TableHeader><TableHeader>Subtotal</TableHeader></tr></thead><tbody className="divide-y divide-border">
          {active.groups.map((group) => <tr key={`${group.universe}:${group.accountId ?? "-"}:${group.workload}`}><TableCell>{universeLabel(group.universe)}</TableCell><TableCell>{group.attributionStatus === "unassigned" ? "Não atribuída" : group.accountId ?? "LP Factory"}</TableCell><TableCell>{workloadLabel(group.workload)}</TableCell><TableCell>{group.executionCount}</TableCell><TableCell>{group.operationCount}</TableCell><TableCell>{group.unavailableOperationCount}</TableCell><TableCell><strong>{formatUsd(group.calculatedCostUsd)}</strong></TableCell></tr>)}
        </tbody></table></div>
      ) : <StatusPanel tone="neutral" title="Nenhuma execução ativa encontrada">Não há execuções compatíveis com o período e os filtros selecionados.</StatusPanel>}
      {active.executions.length > 0 ? <div className="space-y-3"><h3 className="text-base font-semibold text-foreground">Execuções e operações</h3>{active.executions.map((execution) => <OpenAiCostExecutionDetails key={execution.executionId} execution={execution} />)}</div> : null}
    </section>
  );
}

function FormLabel({ label, children }: Readonly<{ label: string; children: ReactNode }>) { return <label className="grid min-w-0 gap-1 text-sm font-medium text-foreground">{label}{children}</label>; }
function ExternalLink({ href, children }: Readonly<{ href: string; children: ReactNode }>) { return <a href={href} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center justify-center rounded-md border border-input bg-background px-2 py-2 text-xs font-semibold text-foreground transition hover:bg-muted focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/30 sm:px-3 sm:text-sm">{children}<span className="sr-only"> (abre em nova aba)</span></a>; }
function MetricCard({ label, value, detail }: Readonly<{ label: string; value: string; detail: string }>) { return <article className="rounded-lg border border-border bg-card p-4 shadow-card sm:p-5"><p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p><p className="mt-2 break-words text-2xl font-semibold text-foreground">{value}</p><p className="mt-2 text-xs leading-5 text-muted-foreground">{detail}</p></article>; }
function CountCard({ label, value, warning = false }: Readonly<{ label: string; value: number; warning?: boolean }>) { return <div className={`rounded-md border p-3 ${warning && value > 0 ? "border-amber-200 bg-amber-50 text-amber-950" : "border-border bg-card text-foreground"}`}><dt className="text-xs font-medium">{label}</dt><dd className="mt-1 text-xl font-semibold">{value}</dd></div>; }
function StatusPanel({ tone, title, children, role }: Readonly<{ tone: "neutral" | "success" | "warning" | "danger"; title: string; children: ReactNode; role?: "alert" }>) { const classes = tone === "danger" ? "border-red-200 bg-red-50 text-red-950" : tone === "warning" ? "border-amber-200 bg-amber-50 text-amber-950" : tone === "success" ? "border-green-200 bg-green-50 text-green-950" : "border-border bg-card text-foreground"; return <section className={`rounded-lg border p-4 shadow-card sm:p-5 ${classes}`} role={role}><h2 className="text-sm font-semibold">{title}</h2><p className="mt-2 text-sm leading-6">{children}</p></section>; }
function CoverageBadge({ status }: Readonly<{ status: "complete" | "partial" | "degraded" | "not_activated" }>) { return status === "complete" ? <AdminStatusBadge tone="success">Cobertura completa</AdminStatusBadge> : status === "partial" ? <AdminStatusBadge tone="warning">Cobertura parcial</AdminStatusBadge> : status === "degraded" ? <AdminStatusBadge tone="warning">Cobertura degradada</AdminStatusBadge> : <AdminStatusBadge tone="danger">Cobertura não ativada</AdminStatusBadge>; }
function Timestamp({ label, value }: Readonly<{ label: string; value: string | null }>) { return <div><dt className="font-medium text-foreground">{label}</dt><dd className="mt-1 text-muted-foreground">{value ? formatTimestamp(value) : "Sem registro"}</dd></div>; }
function Detail({ label, value, code = false }: Readonly<{ label: string; value: string; code?: boolean }>) { return <div><dt className="text-xs font-medium text-muted-foreground">{label}</dt><dd className="mt-1 break-all text-sm text-foreground">{code ? <code className="text-xs">{value}</code> : value}</dd></div>; }
function TableHeader({ children }: Readonly<{ children: ReactNode }>) { return <th scope="col" className="px-3 py-3 text-xs font-semibold uppercase tracking-wide">{children}</th>; }
function TableCell({ children }: Readonly<{ children: ReactNode }>) { return <td className="px-3 py-3 align-top text-foreground">{children}</td>; }
function countRetries(model: OpenAiActiveCostReadModel) { return model.executions.reduce((total, execution) => total + execution.operations.filter((operation) => operation.retryOfOperationId !== null).length, 0); }
function universeLabel(universe: "client" | "lp_factory") { return universe === "client" ? "Cliente" : "LP Factory"; }
function environmentLabel(environment: "production" | "preview" | "development") { return environment === "production" ? "Produção" : environment === "preview" ? "Preview" : "Desenvolvimento"; }
function formatTimestamp(value: string) { return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "medium", timeZone: "America/Sao_Paulo" }).format(new Date(value)); }
function formatUsd(value: string) { const negative = value.startsWith("-"); const unsigned = negative ? value.slice(1) : value; const [integer, fraction = ""] = unsigned.split("."); const grouped = integer.replace(/\B(?=(\d{3})+(?!\d))/g, "."); return `US$ ${negative ? "−" : ""}${grouped}${fraction ? `,${fraction}` : ",00"}`; }
function formatDate(value: string) { const [year, month, day] = value.split("-"); return `${day}/${month}/${year}`; }
