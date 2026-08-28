"use client";

import { useActionState, useState, type ReactNode } from "react";

import { AdminStatusBadge } from "@/components/admin/AdminStatusBadge";
import type { OpenAiLpCostWorkloadSummary } from "@/openai-costs/contracts";
import type { OpenAiCostsDashboard as OpenAiCostsDashboardValue } from "@/openai-costs/dashboard";
import {
  refreshOpenAiCostsAction,
  type OpenAiCostsActionState,
} from "../actions";

type Props = Readonly<{ startDate: string; endDate: string }>;

const INITIAL_STATE: OpenAiCostsActionState = {
  status: "idle",
  code: null,
  message: "Selecione o período e atualize para consultar os custos.",
  dashboard: null,
};

export function OpenAiCostsDashboard({ startDate, endDate }: Props) {
  const [periodMode, setPeriodMode] = useState<"current_month" | "custom">("current_month");
  const [state, formAction, pending] = useActionState(
    refreshOpenAiCostsAction,
    INITIAL_STATE,
  );
  const dashboard = state.dashboard;

  return (
    <div className="space-y-6">
      <form action={formAction} className="rounded-lg border border-border bg-card p-4 shadow-card sm:p-6">
        <fieldset disabled={pending} className="space-y-4">
          <legend className="text-base font-semibold text-foreground">Período da consulta</legend>
          <p id="cost-period-help" className="text-sm leading-6 text-muted-foreground">
            A consulta é feita somente ao selecionar Atualizar. Períodos personalizados aceitam até 180 dias.
          </p>
          <div className="grid gap-4 sm:grid-cols-3 sm:items-end">
            <label className="grid gap-1.5 text-sm font-medium text-foreground">
              Período
              <select
                name="periodMode"
                value={periodMode}
                onChange={(event) => setPeriodMode(event.target.value as typeof periodMode)}
                aria-describedby="cost-period-help"
                className="min-h-11 rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-4 focus-visible:ring-brand-600/30"
              >
                <option value="current_month">Mês atual</option>
                <option value="custom">Personalizado</option>
              </select>
            </label>
            <label className="grid gap-1.5 text-sm font-medium text-foreground">
              Data inicial
              <input
                type="date"
                name="startDate"
                defaultValue={startDate}
                disabled={periodMode === "current_month" || pending}
                required={periodMode === "custom"}
                className="min-h-11 rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-4 focus-visible:ring-brand-600/30 disabled:cursor-not-allowed disabled:opacity-60"
              />
            </label>
            <label className="grid gap-1.5 text-sm font-medium text-foreground">
              Data final
              <input
                type="date"
                name="endDate"
                defaultValue={endDate}
                max={endDate}
                disabled={periodMode === "current_month" || pending}
                required={periodMode === "custom"}
                className="min-h-11 rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-4 focus-visible:ring-brand-600/30 disabled:cursor-not-allowed disabled:opacity-60"
              />
            </label>
          </div>
          <button
            type="submit"
            className="inline-flex min-h-11 items-center justify-center rounded-md bg-brand-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/30 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending ? "Atualizando…" : "Atualizar custos"}
          </button>
        </fieldset>
      </form>

      <div aria-live="polite" aria-atomic="true">
        {pending ? (
          <StatusPanel tone="neutral" title="Consultando custos">
            Buscando o total oficial e a cobertura interna do mesmo período.
          </StatusPanel>
        ) : state.status === "error" ? (
          <StatusPanel tone="danger" title="Consulta indisponível" role="alert">
            {state.message} {state.code ? `Código: ${state.code}.` : ""}
          </StatusPanel>
        ) : state.status === "idle" ? (
          <StatusPanel tone="neutral" title="Nenhuma consulta executada">
            {state.message}
          </StatusPanel>
        ) : state.status === "success" ? (
          <StatusPanel
            tone={dashboard?.internal ? "success" : "danger"}
            title={dashboard?.internal && dashboard.internal.attemptCount === 0 && dashboard.officialTotalUsd === "0"
              ? "Período sem custos"
              : dashboard?.internal
                ? "Consulta atualizada"
                : "Cobertura interna indisponível"}
          >
            {state.message}
          </StatusPanel>
        ) : null}
      </div>

      {dashboard && !pending ? (
        <div className="space-y-6">
          <section className="space-y-3" aria-labelledby="cost-summary-title">
            <div className="flex flex-wrap items-center gap-2">
              <h2 id="cost-summary-title" className="text-lg font-semibold text-foreground">
                Resumo em USD
              </h2>
              {dashboard.selection.provisional ? (
                <AdminStatusBadge tone="warning">Provisório</AdminStatusBadge>
              ) : (
                <AdminStatusBadge tone="success">Período encerrado</AdminStatusBadge>
              )}
              {dashboard.reconciliationAnomalous ? (
                <AdminStatusBadge tone="danger">Reconciliação anômala</AdminStatusBadge>
              ) : null}
            </div>
            <p className="text-sm text-muted-foreground">
              {formatDate(dashboard.selection.startDate)} a {formatDate(dashboard.selection.endDate)}.
              As fronteiras do período usam UTC.
            </p>
            <div className="grid gap-4 md:grid-cols-3">
              <MetricCard label="Gasto oficial OpenAI" value={formatUsd(dashboard.officialTotalUsd)} detail="Fonte oficial · Costs API" />
              <MetricCard
                label="Landing Pages calculadas"
                value={dashboard.internal ? formatUsd(dashboard.internal.totalUsd) : "Indisponível"}
                detail="Prospectivo · texto e imagem"
              />
              <MetricCard
                label="Outros gastos / reconciliação"
                value={dashboard.reconciliationUsd === null ? "Indisponível" : formatUsd(dashboard.reconciliationUsd)}
                detail="Oficial menos Landing Pages, sem ajuste"
              />
            </div>
          </section>

          <section className="rounded-lg border border-border bg-card p-4 shadow-card sm:p-6" aria-labelledby="coverage-title">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 id="coverage-title" className="text-base font-semibold text-foreground">Cobertura e atualização</h2>
              {dashboard.internal ? <CoverageBadge status={dashboard.internal.coverageStatus} /> : <AdminStatusBadge tone="danger">Interno indisponível</AdminStatusBadge>}
            </div>
            <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
              <Timestamp label="Atualizado na OpenAI" value={dashboard.officialUpdatedAt} />
              <Timestamp label="Atualizado na cobertura interna" value={dashboard.internal?.internalUpdatedAt ?? null} />
              <Timestamp label="Início da cobertura prospectiva" value={dashboard.internal?.coverageActivatedAt ?? null} />
              <div>
                <dt className="font-medium text-foreground">Qualidade da atribuição</dt>
                <dd className="mt-1 text-muted-foreground">
                  {dashboard.internal
                    ? `${dashboard.internal.attemptCount} tentativas; ${dashboard.internal.unpricedAttemptCount} sem preço; ${dashboard.internal.pendingAttemptCount} pendentes.`
                    : "O total oficial foi preservado, mas a atribuição por LP não pôde ser lida."}
                </dd>
              </div>
            </dl>
            <p className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-950">
              A OpenAI e a cobertura interna podem atualizar em instantes diferentes. Períodos anteriores ou que cruzam a data de corte não representam cobertura integral das Landing Pages.
            </p>
          </section>

          {dashboard.internal ? (
            <AccountBreakdown accounts={dashboard.internal.accounts} />
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function AccountBreakdown({ accounts }: Readonly<{ accounts: NonNullable<OpenAiCostsDashboardValue["internal"]>["accounts"] }>) {
  return (
    <section className="space-y-3" aria-labelledby="account-breakdown-title">
      <h2 id="account-breakdown-title" className="text-lg font-semibold text-foreground">Custos por cliente e Landing Page</h2>
      {accounts.length === 0 ? (
        <StatusPanel tone="neutral" title="Nenhuma Landing Page no período">
          Não há tentativas prospectivas de texto ou imagem atribuídas ao período selecionado.
        </StatusPanel>
      ) : accounts.map((account) => (
        <details key={account.accountId} className="rounded-lg border border-border bg-card shadow-card">
          <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 rounded-lg px-4 py-3 outline-none focus-visible:ring-4 focus-visible:ring-brand-600/30 sm:px-5">
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold text-foreground">{account.accountName}</span>
              <span className="block text-xs text-muted-foreground">{account.landingPages.length} Landing Pages · {account.attemptCount} tentativas</span>
            </span>
            <strong className="shrink-0 text-sm text-foreground">{formatUsd(account.totalUsd)}</strong>
          </summary>
          <div className="space-y-3 border-t border-border p-4 sm:p-5">
            {account.landingPages.map((landingPage) => (
              <article key={landingPage.landingPageId} className="rounded-md border border-border bg-background p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">{landingPage.landingPageName}</h3>
                    <p className="mt-1 text-xs text-muted-foreground">{landingPage.attemptCount} tentativas</p>
                  </div>
                  <strong className="text-sm text-foreground">{formatUsd(landingPage.totalUsd)}</strong>
                </div>
                <dl className="mt-3 grid gap-2 sm:grid-cols-2">
                  {landingPage.workloads.map((workload) => (
                    <div key={workload.workload} className="rounded-md bg-muted p-3">
                      <dt className="text-xs font-medium text-muted-foreground">{workloadLabel(workload.workload)}</dt>
                      <dd className="mt-1 text-sm font-semibold text-foreground">{formatUsd(workload.totalUsd)}</dd>
                      <dd className="mt-1 text-xs text-muted-foreground">{workload.attemptCount} tentativas · {workload.unpricedAttemptCount} sem preço · {workload.pendingAttemptCount} pendentes</dd>
                    </div>
                  ))}
                </dl>
              </article>
            ))}
          </div>
        </details>
      ))}
    </section>
  );
}

function MetricCard({ label, value, detail }: Readonly<{ label: string; value: string; detail: string }>) {
  return <article className="rounded-lg border border-border bg-card p-4 shadow-card sm:p-5"><p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p><p className="mt-2 break-words text-2xl font-semibold text-foreground">{value}</p><p className="mt-2 text-xs text-muted-foreground">{detail}</p></article>;
}

function StatusPanel({ tone, title, children, role }: Readonly<{ tone: "neutral" | "success" | "danger"; title: string; children: ReactNode; role?: "alert" }>) {
  const classes = tone === "danger"
    ? "border-red-200 bg-red-50 text-red-950"
    : tone === "success"
      ? "border-green-200 bg-green-50 text-green-950"
      : "border-border bg-card text-foreground";
  return <section className={`rounded-lg border p-4 shadow-card sm:p-5 ${classes}`} role={role}><h2 className="text-sm font-semibold">{title}</h2><p className="mt-2 text-sm leading-6">{children}</p></section>;
}

function CoverageBadge({ status }: Readonly<{ status: "covered" | "partial" | "not_activated" }>) {
  return status === "covered" ? <AdminStatusBadge tone="success">Cobertura ativa</AdminStatusBadge> : status === "partial" ? <AdminStatusBadge tone="warning">Cobertura parcial</AdminStatusBadge> : <AdminStatusBadge tone="danger">Cobertura não ativada</AdminStatusBadge>;
}

function Timestamp({ label, value }: Readonly<{ label: string; value: string | null }>) {
  return <div><dt className="font-medium text-foreground">{label}</dt><dd className="mt-1 text-muted-foreground">{value ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "medium", timeZone: "America/Sao_Paulo" }).format(new Date(value)) : "Sem registro"}</dd></div>;
}

function workloadLabel(workload: OpenAiLpCostWorkloadSummary["workload"]) {
  return workload === "landing_page_draft_generation" ? "Geração de texto" : "Geração de imagem";
}

function formatUsd(value: string) {
  const negative = value.startsWith("-");
  const unsigned = negative ? value.slice(1) : value;
  const [integer, fraction = ""] = unsigned.split(".");
  const grouped = integer.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `US$ ${negative ? "−" : ""}${grouped}${fraction ? `,${fraction}` : ",00"}`;
}

function formatDate(value: string) {
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}
