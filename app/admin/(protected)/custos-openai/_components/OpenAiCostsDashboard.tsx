"use client";

import { useActionState, useEffect, useRef, useState, type ReactNode } from "react";

import { AdminStatusBadge } from "@/components/admin/AdminStatusBadge";
import type { OpenAiActiveCostExecution, OpenAiActiveCostReadModel } from "@/openai-costs/active-contracts";
import type { OpenAiLpCostWorkloadSummary } from "@/openai-costs/contracts";
import type { OpenAiCostsFinancialComposition } from "@/openai-costs/dashboard";
import type { OpenAiWorkloadId } from "@/openai-workloads";
import { refreshOpenAiCostsAction, type OpenAiCostsActionState } from "../actions";

type Props = Readonly<{ startDate: string; endDate: string }>;

const INITIAL_STATE: OpenAiCostsActionState = {
  status: "idle",
  code: null,
  message: "Selecione o período e atualize para consultar os custos.",
  dashboard: null,
};
const OPENAI_USAGE_URL = "https://platform.openai.com/usage";
const OPENAI_BILLING_URL = "https://platform.openai.com/settings/organization/billing/overview";
const WORKLOAD_OPTIONS = [
  "niche_resolution",
  "commercial_activation_draft_generation",
  "taxon_input_catalog_sufficiency_evaluation",
  "landing_page_dynamic_market_research",
  "supabase_inspect",
] as const satisfies readonly OpenAiWorkloadId[];
const controlClassName = "min-h-11 rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-4 focus-visible:ring-brand-600/30 disabled:cursor-not-allowed disabled:opacity-60";

export function OpenAiCostsDashboard({ startDate, endDate }: Props) {
  const [periodMode, setPeriodMode] = useState<"current_month" | "custom">("current_month");
  const [universe, setUniverse] = useState<"" | "lp_factory" | "client">("");
  const [accountId, setAccountId] = useState("");
  const [state, formAction, pending] = useActionState(refreshOpenAiCostsAction, INITIAL_STATE);
  const resultRef = useRef<HTMLDivElement>(null);
  const dashboard = state.dashboard;

  useEffect(() => {
    if (!pending && state.status !== "idle") resultRef.current?.focus();
  }, [pending, state.status]);

  return (
    <div className="space-y-6">
      <form action={formAction} className="rounded-lg border border-border bg-card p-4 shadow-card sm:p-6">
        <fieldset disabled={pending} className="space-y-5">
          <legend className="text-base font-semibold text-foreground">Período e filtros da consulta</legend>
          <p id="cost-query-help" className="text-sm leading-6 text-muted-foreground">
            A consulta ocorre somente ao selecionar Atualizar. Períodos personalizados aceitam até 180 dias. Os filtros alteram apenas o controle ativo; o total oficial e a reconciliação permanecem globais.
          </p>
          <div className="grid gap-4 sm:grid-cols-3 sm:items-end">
            <FormLabel label="Período">
              <select name="periodMode" value={periodMode} onChange={(event) => setPeriodMode(event.target.value as typeof periodMode)} aria-describedby="cost-query-help" className={controlClassName}>
                <option value="current_month">Mês atual</option><option value="custom">Personalizado</option>
              </select>
            </FormLabel>
            <FormLabel label="Data inicial">
              <input type="date" name="startDate" defaultValue={startDate} disabled={periodMode === "current_month" || pending} required={periodMode === "custom"} className={controlClassName} />
            </FormLabel>
            <FormLabel label="Data final">
              <input type="date" name="endDate" defaultValue={endDate} max={endDate} disabled={periodMode === "current_month" || pending} required={periodMode === "custom"} className={controlClassName} />
            </FormLabel>
          </div>
          <div className="grid gap-4 sm:grid-cols-3 sm:items-end">
            <FormLabel label="Universo">
              <select name="universe" value={universe} onChange={(event) => { const next = event.target.value as typeof universe; setUniverse(next); if (next === "lp_factory") setAccountId(""); }} className={controlClassName}>
                <option value="">Todos os universos</option><option value="client">Cliente</option><option value="lp_factory">LP Factory</option>
              </select>
            </FormLabel>
            <FormLabel label="Conta (UUID)">
              <input type="text" name="accountId" value={accountId} onChange={(event) => setAccountId(event.target.value.trim())} disabled={universe === "lp_factory" || pending} autoComplete="off" placeholder="Todas as contas" aria-describedby="account-filter-help" className={controlClassName} />
              <span id="account-filter-help" className="text-xs font-normal text-muted-foreground">Opcional; disponível para execuções de Cliente.</span>
            </FormLabel>
            <FormLabel label="Workload">
              <select name="workload" defaultValue="" className={controlClassName}>
                <option value="">Todos os workloads</option>
                {WORKLOAD_OPTIONS.map((workload) => <option key={workload} value={workload}>{workloadLabel(workload)}</option>)}
              </select>
            </FormLabel>
          </div>
          <button type="submit" className="inline-flex min-h-11 items-center justify-center rounded-md bg-brand-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/30 disabled:cursor-not-allowed disabled:opacity-60">
            {pending ? "Atualizando…" : "Atualizar custos"}
          </button>
        </fieldset>
      </form>

      <section className="rounded-lg border border-border bg-card p-4 shadow-card sm:p-6" aria-labelledby="openai-external-links-title">
        <h2 id="openai-external-links-title" className="text-base font-semibold text-foreground">Visão global na OpenAI</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">Usage, faturamento e créditos permanecem na plataforma OpenAI. Os acessos abaixo saem da LP Factory e abrem em nova aba conforme as permissões da sua organização.</p>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <ExternalLink href={OPENAI_USAGE_URL}>Abrir Usage na OpenAI</ExternalLink>
          <ExternalLink href={OPENAI_BILLING_URL}>Abrir faturamento e créditos na OpenAI</ExternalLink>
        </div>
      </section>

      <div ref={resultRef} tabIndex={-1} className="rounded-lg outline-none focus-visible:ring-4 focus-visible:ring-brand-600/30" aria-live="polite" aria-atomic="true">
        {pending ? <StatusPanel tone="neutral" title="Consultando custos">Buscando o total oficial, o controle ativo e o histórico congelado do mesmo período.</StatusPanel>
          : state.status === "error" ? <StatusPanel tone="danger" title="Consulta indisponível" role="alert">{state.message} {state.code ? `Código: ${state.code}.` : ""}</StatusPanel>
            : state.status === "idle" ? <StatusPanel tone="neutral" title="Nenhuma consulta executada">{state.message}</StatusPanel>
              : <StatusPanel tone={dashboard?.active && dashboard.legacy ? "success" : "warning"} title={dashboard?.active && dashboard.legacy ? "Consulta atualizada" : "Consulta parcialmente disponível"}>{state.message} {state.code ? `Código: ${state.code}.` : ""}</StatusPanel>}
      </div>

      {dashboard && !pending ? <DashboardResult dashboard={dashboard} /> : null}
    </div>
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
        <p className="text-sm text-muted-foreground">{formatDate(dashboard.selection.startDate)} a {formatDate(dashboard.selection.endDate)}. As fronteiras do período usam UTC.</p>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Gasto oficial OpenAI" value={formatUsd(dashboard.officialTotalUsd)} detail="Fonte oficial · Costs API" />
          <MetricCard label="Controle ativo calculável" value={dashboard.active ? formatUsd(dashboard.active.totalCalculatedUsd) : "Indisponível"} detail="Todas as execuções ativas do período, sem aplicar os filtros" />
          <MetricCard label="Histórico congelado" value={dashboard.legacy ? formatUsd(dashboard.legacy.totalUsd) : "Indisponível"} detail="Série histórica de Landing Pages · E21.4" />
          <MetricCard label="Outros gastos / reconciliação" value={dashboard.globalReconciliationUsd === null ? "Indisponível" : formatUsd(dashboard.globalReconciliationUsd)} detail="Oficial menos controle ativo e histórico, sem ajuste" />
        </div>
        <p className="rounded-md border border-border bg-muted p-3 text-sm leading-6 text-foreground">Os filtros internos não alteram o gasto oficial nem a reconciliação global. O subtotal filtrado aparece na seção Controle ativo.</p>
      </section>

      <CoverageSection dashboard={dashboard} />
      {dashboard.legacy && dashboard.legacy.providerCreditFailureCount > 0 ? (
        <StatusPanel tone="danger" title="Crédito ou limite OpenAI requer atenção" role="alert">
          O período contém {dashboard.legacy.providerCreditFailureCount} ocorrência de provider associada a crédito ou limite insuficiente. Consulte a administração da OpenAI; nenhum detalhe financeiro interno é exibido ao cliente.
        </StatusPanel>
      ) : null}
      {dashboard.filteredActive ? <ActiveCostSection active={dashboard.filteredActive} filters={dashboard.activeFilters} />
        : <StatusPanel tone="danger" title="Controle ativo indisponível" role="alert">O total oficial e o histórico disponíveis foram preservados, mas o ledger ativo não pôde ser consultado. Código: {dashboard.activeErrorCode ?? "READ_FAILED"}.</StatusPanel>}
      {dashboard.legacy ? <LegacyAccountBreakdown accounts={dashboard.legacy.accounts} />
        : <StatusPanel tone="warning" title="Histórico congelado indisponível">O total oficial e o controle ativo disponíveis foram preservados. Código: {dashboard.legacyErrorCode ?? "READ_FAILED"}.</StatusPanel>}
    </div>
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
  const filtered = Boolean(filters.universe || filters.accountId || filters.workload);
  return (
    <section className="space-y-4" aria-labelledby="active-costs-title">
      <div className="flex flex-wrap items-end justify-between gap-3"><div><h2 id="active-costs-title" className="text-lg font-semibold text-foreground">Controle ativo</h2><p className="mt-1 text-sm text-muted-foreground">{filtered ? "Subtotal e detalhes com os filtros informados." : "Subtotal e detalhes de todas as execuções ativas do período."}</p></div><strong className="text-xl text-foreground">{formatUsd(active.totalCalculatedUsd)}</strong></div>
      <dl className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <CountCard label="Execuções" value={active.executionCount} /><CountCard label="Operações" value={active.operationCount} /><CountCard label="Retries" value={countRetries(active)} /><CountCard label="Custos indisponíveis" value={active.unavailableOperationCount} warning /><CountCard label="Não atribuídas" value={active.unassignedExecutionCount} warning />
      </dl>
      {active.pendingOperationCount > 0 ? <StatusPanel tone="warning" title="Operações pendentes">Há {active.pendingOperationCount} operação(ões) sem término; elas não entram no subtotal calculável.</StatusPanel> : null}
      {active.groups.length > 0 ? (
        <div className="overflow-x-auto rounded-lg border border-border bg-card shadow-card"><table className="w-full min-w-[52rem] text-left text-sm"><caption className="sr-only">Subtotal ativo por universo, conta e workload</caption><thead className="bg-muted text-foreground"><tr><TableHeader>Universo</TableHeader><TableHeader>Conta</TableHeader><TableHeader>Workload</TableHeader><TableHeader>Execuções</TableHeader><TableHeader>Operações</TableHeader><TableHeader>Indisponíveis</TableHeader><TableHeader>Subtotal</TableHeader></tr></thead><tbody className="divide-y divide-border">
          {active.groups.map((group) => <tr key={`${group.universe}:${group.accountId ?? "-"}:${group.workload}`}><TableCell>{universeLabel(group.universe)}</TableCell><TableCell>{group.attributionStatus === "unassigned" ? "Não atribuída" : group.accountId ?? "LP Factory"}</TableCell><TableCell>{workloadLabel(group.workload)}</TableCell><TableCell>{group.executionCount}</TableCell><TableCell>{group.operationCount}</TableCell><TableCell>{group.unavailableOperationCount}</TableCell><TableCell><strong>{formatUsd(group.calculatedCostUsd)}</strong></TableCell></tr>)}
        </tbody></table></div>
      ) : <StatusPanel tone="neutral" title="Nenhuma execução ativa encontrada">Não há execuções compatíveis com o período e os filtros selecionados.</StatusPanel>}
      {active.executions.length > 0 ? <div className="space-y-3"><h3 className="text-base font-semibold text-foreground">Execuções e operações</h3>{active.executions.map((execution) => <ExecutionDetails key={execution.executionId} execution={execution} />)}</div> : null}
    </section>
  );
}

function ExecutionDetails({ execution }: Readonly<{ execution: OpenAiActiveCostExecution }>) {
  return (
    <details className="rounded-lg border border-border bg-card shadow-card">
      <summary className="min-h-11 cursor-pointer list-none rounded-lg px-4 py-3 outline-none focus-visible:ring-4 focus-visible:ring-brand-600/30 sm:px-5">
        <span className="flex flex-wrap items-center justify-between gap-2"><span className="min-w-0"><span className="block text-sm font-semibold text-foreground">{workloadLabel(execution.workload)}</span><span className="block break-all text-xs text-muted-foreground">Execução {execution.executionId}</span><span className="mt-1 block text-xs font-medium text-brand-700">Abrir detalhes</span></span><span className="flex flex-wrap items-center gap-2">{execution.attributionStatus === "unassigned" ? <AdminStatusBadge tone="warning">Não atribuída</AdminStatusBadge> : null}{execution.unavailableOperationCount > 0 ? <AdminStatusBadge tone="danger">Custo indisponível</AdminStatusBadge> : null}<strong className="text-sm text-foreground">{formatUsd(execution.calculatedCostUsd)}</strong></span></span>
      </summary>
      <div className="space-y-4 border-t border-border p-4 sm:p-5">
        <dl className="grid gap-3 text-sm sm:grid-cols-2 xl:grid-cols-4">
          <Detail label="Universo" value={universeLabel(execution.universe)} /><Detail label="Conta" value={execution.accountId ?? (execution.attributionStatus === "unassigned" ? "Não atribuída" : "LP Factory")} code={Boolean(execution.accountId)} /><Detail label="Ambiente" value={environmentLabel(execution.environment)} /><Detail label="Origem" value={execution.executionOrigin === "runtime" ? "Runtime" : "Prova administrativa"} /><Detail label="Resultado" value={execution.result ? resultLabel(execution.result) : "Pendente"} /><Detail label="Início" value={formatTimestamp(execution.startedAt)} /><Detail label="Término" value={execution.finishedAt ? formatTimestamp(execution.finishedAt) : "Pendente"} /><Detail label="Baseline" value={baselineLabel(execution)} />
        </dl>
        {execution.operations.length === 0 ? <StatusPanel tone="warning" title="Execução sem operação registrada">A execução está preservada no ledger, mas ainda não possui operação cobrável vinculada.</StatusPanel> : (
          <div className="space-y-3">{execution.operations.map((operation) => (
            <article key={operation.operationId} className="rounded-md border border-border bg-background p-4">
              <div className="flex flex-wrap items-start justify-between gap-2"><div><h4 className="text-sm font-semibold text-foreground">Operação {operation.sequence}</h4><p className="mt-1 break-all text-xs text-muted-foreground">{operation.operationId}</p></div>{!operation.finishedAt ? <AdminStatusBadge tone="warning">Pendente</AdminStatusBadge> : operation.costStatus === "calculated" && operation.costUsd !== null ? <AdminStatusBadge tone="success">{formatUsd(operation.costUsd)}</AdminStatusBadge> : <AdminStatusBadge tone="danger">Custo indisponível</AdminStatusBadge>}</div>
              <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2 xl:grid-cols-4"><Detail label="Modelo" value={operation.model} code /><Detail label="Effort" value={operation.reasoningEffort} code /><Detail label="Retry" value={operation.retryOfOperationId ? `Sim · ${operation.retryOfOperationId}` : "Não"} code={Boolean(operation.retryOfOperationId)} /><Detail label="Resultado" value={operation.result ? resultLabel(operation.result) : "Pendente"} /><Detail label="Input tokens" value={numberOrUnavailable(operation.inputTokens)} /><Detail label="Cached input" value={numberOrUnavailable(operation.cachedInputTokens)} /><Detail label="Cache write" value={numberOrUnavailable(operation.cacheWriteTokens)} /><Detail label="Output tokens" value={numberOrUnavailable(operation.outputTokens)} /><Detail label="Reasoning tokens" value={numberOrUnavailable(operation.reasoningTokens)} /><Detail label="Total tokens" value={numberOrUnavailable(operation.totalTokens)} /><Detail label="Web Search" value={numberOrUnavailable(operation.webSearchCallCount)} /><Detail label="Versão de preço" value={operation.pricingVersion ?? "Indisponível"} code={Boolean(operation.pricingVersion)} /></dl>
              {operation.costUnavailableReason ? <p className="mt-3 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-950">Motivo da indisponibilidade: <code className="break-all text-xs">{operation.costUnavailableReason}</code></p> : null}
            </article>
          ))}</div>
        )}
      </div>
    </details>
  );
}

function LegacyAccountBreakdown({ accounts }: Readonly<{ accounts: NonNullable<OpenAiCostsFinancialComposition["legacy"]>["accounts"] }>) {
  return (
    <section className="space-y-3" aria-labelledby="legacy-breakdown-title">
      <div><h2 id="legacy-breakdown-title" className="text-lg font-semibold text-foreground">Histórico congelado de Landing Pages</h2><p className="mt-1 text-sm text-muted-foreground">Leitura preservada da E21.4; não recebe os filtros do controle ativo.</p></div>
      {accounts.length === 0 ? <StatusPanel tone="neutral" title="Nenhuma Landing Page no período">Não há eventos históricos atribuídos ao período selecionado.</StatusPanel> : accounts.map((account) => (
        <details key={account.accountId} className="rounded-lg border border-border bg-card shadow-card"><summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 rounded-lg px-4 py-3 outline-none focus-visible:ring-4 focus-visible:ring-brand-600/30 sm:px-5"><span className="min-w-0"><span className="block truncate text-sm font-semibold text-foreground">{account.accountName}</span><span className="block text-xs text-muted-foreground">{account.landingPages.length} Landing Pages · {account.attemptCount} tentativas</span></span><strong className="shrink-0 text-sm text-foreground">{formatUsd(account.totalUsd)}</strong></summary><div className="space-y-3 border-t border-border p-4 sm:p-5">
          {account.landingPages.map((landingPage) => <article key={landingPage.landingPageId} className="rounded-md border border-border bg-background p-4"><div className="flex flex-wrap items-start justify-between gap-2"><div><h3 className="text-sm font-semibold text-foreground">{landingPage.landingPageName}</h3><p className="mt-1 text-xs text-muted-foreground">{landingPage.attemptCount} tentativas</p></div><strong className="text-sm text-foreground">{formatUsd(landingPage.totalUsd)}</strong></div><dl className="mt-3 grid gap-2 sm:grid-cols-2">{landingPage.workloads.map((workload) => <div key={workload.workload} className="rounded-md bg-muted p-3"><dt className="text-xs font-medium text-muted-foreground">{legacyWorkloadLabel(workload.workload)}</dt><dd className="mt-1 text-sm font-semibold text-foreground">{formatUsd(workload.totalUsd)}</dd><dd className="mt-1 text-xs text-muted-foreground">{workload.attemptCount} tentativas · {workload.unpricedAttemptCount} sem preço · {workload.pendingAttemptCount} pendentes</dd></div>)}</dl></article>)}
        </div></details>
      ))}
    </section>
  );
}

function FormLabel({ label, children }: Readonly<{ label: string; children: ReactNode }>) { return <label className="grid gap-1.5 text-sm font-medium text-foreground">{label}{children}</label>; }
function ExternalLink({ href, children }: Readonly<{ href: string; children: ReactNode }>) { return <a href={href} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-muted focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/30">{children}<span className="sr-only"> (abre em nova aba)</span></a>; }
function MetricCard({ label, value, detail }: Readonly<{ label: string; value: string; detail: string }>) { return <article className="rounded-lg border border-border bg-card p-4 shadow-card sm:p-5"><p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p><p className="mt-2 break-words text-2xl font-semibold text-foreground">{value}</p><p className="mt-2 text-xs leading-5 text-muted-foreground">{detail}</p></article>; }
function CountCard({ label, value, warning = false }: Readonly<{ label: string; value: number; warning?: boolean }>) { return <div className={`rounded-md border p-3 ${warning && value > 0 ? "border-amber-200 bg-amber-50 text-amber-950" : "border-border bg-card text-foreground"}`}><dt className="text-xs font-medium">{label}</dt><dd className="mt-1 text-xl font-semibold">{value}</dd></div>; }
function StatusPanel({ tone, title, children, role }: Readonly<{ tone: "neutral" | "success" | "warning" | "danger"; title: string; children: ReactNode; role?: "alert" }>) { const classes = tone === "danger" ? "border-red-200 bg-red-50 text-red-950" : tone === "warning" ? "border-amber-200 bg-amber-50 text-amber-950" : tone === "success" ? "border-green-200 bg-green-50 text-green-950" : "border-border bg-card text-foreground"; return <section className={`rounded-lg border p-4 shadow-card sm:p-5 ${classes}`} role={role}><h2 className="text-sm font-semibold">{title}</h2><p className="mt-2 text-sm leading-6">{children}</p></section>; }
function CoverageBadge({ status }: Readonly<{ status: "complete" | "partial" | "degraded" | "not_activated" }>) { return status === "complete" ? <AdminStatusBadge tone="success">Cobertura completa</AdminStatusBadge> : status === "partial" ? <AdminStatusBadge tone="warning">Cobertura parcial</AdminStatusBadge> : status === "degraded" ? <AdminStatusBadge tone="warning">Cobertura degradada</AdminStatusBadge> : <AdminStatusBadge tone="danger">Cobertura não ativada</AdminStatusBadge>; }
function Timestamp({ label, value }: Readonly<{ label: string; value: string | null }>) { return <div><dt className="font-medium text-foreground">{label}</dt><dd className="mt-1 text-muted-foreground">{value ? formatTimestamp(value) : "Sem registro"}</dd></div>; }
function Detail({ label, value, code = false }: Readonly<{ label: string; value: string; code?: boolean }>) { return <div><dt className="text-xs font-medium text-muted-foreground">{label}</dt><dd className="mt-1 break-all text-sm text-foreground">{code ? <code className="text-xs">{value}</code> : value}</dd></div>; }
function TableHeader({ children }: Readonly<{ children: ReactNode }>) { return <th scope="col" className="px-3 py-3 text-xs font-semibold uppercase tracking-wide">{children}</th>; }
function TableCell({ children }: Readonly<{ children: ReactNode }>) { return <td className="px-3 py-3 align-top text-foreground">{children}</td>; }
function countRetries(model: OpenAiActiveCostReadModel) { return model.executions.reduce((total, execution) => total + execution.operations.filter((operation) => operation.retryOfOperationId !== null).length, 0); }
function baselineLabel(execution: OpenAiActiveCostExecution) { if (!execution.baselineReference && !execution.baselineVersion) return "Não informado"; return [execution.baselineReference, execution.baselineVersion].filter(Boolean).join(" · "); }
function resultLabel(result: "success" | "failure") { return result === "success" ? "Sucesso" : "Falha"; }
function universeLabel(universe: "client" | "lp_factory") { return universe === "client" ? "Cliente" : "LP Factory"; }
function environmentLabel(environment: "production" | "preview" | "development") { return environment === "production" ? "Produção" : environment === "preview" ? "Preview" : "Desenvolvimento"; }
function workloadLabel(workload: OpenAiWorkloadId) { const labels: Record<OpenAiWorkloadId, string> = { niche_resolution: "Resolução de nicho", commercial_activation_draft_generation: "Draft de ativação comercial", taxon_input_catalog_sufficiency_evaluation: "Suficiência factual do catálogo", landing_page_dynamic_market_research: "Pesquisa dinâmica de mercado", supabase_inspect: "Supabase Inspect" }; return labels[workload]; }
function legacyWorkloadLabel(workload: OpenAiLpCostWorkloadSummary["workload"]) { return workload === "landing_page_draft_generation" ? "Geração de texto" : "Geração de imagem"; }
function numberOrUnavailable(value: number | null) { return value === null ? "Indisponível" : new Intl.NumberFormat("pt-BR").format(value); }
function formatTimestamp(value: string) { return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "medium", timeZone: "America/Sao_Paulo" }).format(new Date(value)); }
function formatUsd(value: string) { const negative = value.startsWith("-"); const unsigned = negative ? value.slice(1) : value; const [integer, fraction = ""] = unsigned.split("."); const grouped = integer.replace(/\B(?=(\d{3})+(?!\d))/g, "."); return `US$ ${negative ? "−" : ""}${grouped}${fraction ? `,${fraction}` : ",00"}`; }
function formatDate(value: string) { const [year, month, day] = value.split("-"); return `${day}/${month}/${year}`; }
