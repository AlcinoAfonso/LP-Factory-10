"use client";

import { AdminStatusBadge } from "@/components/admin/AdminStatusBadge";
import type {
  OpenAiActiveCostExecution,
  OpenAiActiveCostOperation,
} from "@/openai-costs/active-contracts";
import type {
  OpenAiEconomicAccount,
  OpenAiEconomicEvent,
  OpenAiEconomicHierarchy,
  OpenAiEconomicUniverse,
  OpenAiEconomicWorkload,
} from "@/openai-costs/economic-hierarchy";

export function OpenAiEconomicHierarchyView({
  hierarchy,
}: Readonly<{ hierarchy: OpenAiEconomicHierarchy }>) {
  return (
    <section className="space-y-4" aria-labelledby="economic-hierarchy-title">
      <div>
        <h2 id="economic-hierarchy-title" className="text-lg font-semibold text-foreground">
          Visão econômica por evento
        </h2>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          Abra cada nível para percorrer universo, responsável econômico, evento, workload e execução/operação.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <UniverseCard label="Clientes" universe={hierarchy.clients} complete={hierarchy.activeAvailable && hierarchy.legacyAvailable} />
        <UniverseCard label="LP Factory" universe={hierarchy.lpFactory} complete={hierarchy.activeAvailable} />
      </div>
      {hierarchy.economicDimensionStatus === "active_unavailable" ? (
        <div className="space-y-4">
          <StatusPanel title="Controle ativo indisponível na hierarquia">
            O histórico E21.4 saudável permanece navegável abaixo; subtotal de Clientes e total da LP Factory não são apresentados como completos.
          </StatusPanel>
          {hierarchy.clients.accounts.map((account) => <AccountDetails key={account.accountId} account={account} />)}
        </div>
      ) : hierarchy.economicDimensionStatus === "v1_fallback" ? (
        <div className="space-y-4">
          <StatusPanel title="Dimensão por evento ainda não ativa">
            Os totais vigentes permanecem disponíveis pela ponte v1, mas essas execuções não são apresentadas como eventos sem correlação. A hierarquia completa ficará disponível após o apply canônico selecionar v2.
          </StatusPanel>
          {hierarchy.clients.accounts.length > 0 ? (
            <div className="space-y-3">
              <h3 className="text-base font-semibold text-foreground">Landing Pages do histórico congelado</h3>
              {hierarchy.clients.accounts.map((account) => <AccountDetails key={account.accountId} account={account} />)}
            </div>
          ) : null}
          <ExecutionCollection
            title="Execuções ativas preservadas pela ponte v1"
            executions={hierarchy.fallbackExecutions}
          />
        </div>
      ) : (
        <div className="space-y-4">
          {!hierarchy.legacyAvailable ? (
            <StatusPanel title="Histórico E21.4 indisponível na hierarquia">
              O controle ativo saudável permanece navegável abaixo; o subtotal de Clientes não é apresentado como completo.
            </StatusPanel>
          ) : null}
          <UniverseDetails label="Clientes" universe={hierarchy.clients} />
          <UniverseDetails label="LP Factory" universe={hierarchy.lpFactory} />
        </div>
      )}
    </section>
  );
}

function UniverseCard({ label, universe, complete }: Readonly<{
  label: string;
  universe: OpenAiEconomicUniverse;
  complete: boolean;
}>) {
  const hasIncompleteCost = universe.pendingCount > 0 || universe.unavailableCount > 0;
  return (
    <article className="rounded-lg border border-border bg-card p-4 shadow-card sm:p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-foreground">{complete ? formatUsd(universe.calculatedCostUsd) : "Indisponível"}</p>
      <p className="mt-2 text-xs leading-5 text-muted-foreground">
        {!complete ? "Subtotal parcial das fontes saudáveis · " : hasIncompleteCost ? "Subtotal calculável · " : ""}{universe.executionCount} execuções/tentativas · {universe.operationCount} operações
        {universe.pendingCount > 0 ? ` · ${universe.pendingCount} pendentes` : ""}
        {universe.unavailableCount > 0 ? ` · ${universe.unavailableCount} custos indisponíveis` : ""}
      </p>
    </article>
  );
}

function UniverseDetails({ label, universe }: Readonly<{
  label: string;
  universe: OpenAiEconomicUniverse;
}>) {
  const empty = universe.accounts.length === 0 && universe.events.length === 0 &&
    universe.unassignedExecutions.length === 0 && universe.uncorrelatedExecutions.length === 0;
  return (
    <details className="rounded-lg border border-border bg-card shadow-card">
      <Summary label={label} detail={`${universe.executionCount} execuções/tentativas`} total={universe.calculatedCostUsd} pending={universe.pendingCount} unavailable={universe.unavailableCount} />
      <div className="space-y-4 border-t border-border p-4 sm:p-5">
        {universe.accounts.map((account) => <AccountDetails key={account.accountId} account={account} />)}
        {universe.events.map((event) => <EventDetails key={event.key} event={event} />)}
        <ExecutionCollection title="Sem conta atribuída" executions={universe.unassignedExecutions} />
        <ExecutionCollection title="Sem correlação de evento" executions={universe.uncorrelatedExecutions} />
        {empty ? <p className="text-sm text-muted-foreground">Nenhuma execução encontrada neste universo.</p> : null}
      </div>
    </details>
  );
}

function AccountDetails({ account }: Readonly<{ account: OpenAiEconomicAccount }>) {
  return (
    <details className="rounded-md border border-border bg-background">
      <Summary label={account.accountName} detail={`${account.events.length} eventos · ${account.executionCount} execuções/tentativas`} total={account.calculatedCostUsd} pending={account.pendingCount} unavailable={account.unavailableCount} />
      <div className="space-y-3 border-t border-border p-4">
        <p className="break-all text-xs text-muted-foreground">Conta {account.accountId}</p>
        {account.events.map((event) => <EventDetails key={event.key} event={event} />)}
        <ExecutionCollection title="Sem correlação de evento" executions={account.uncorrelatedExecutions} />
      </div>
    </details>
  );
}

function EventDetails({ event }: Readonly<{ event: OpenAiEconomicEvent }>) {
  return (
    <details className="rounded-md border border-border bg-card">
      <Summary label={event.label} detail={`${event.executionCount} execuções/tentativas`} total={event.calculatedCostUsd} pending={event.pendingCount} unavailable={event.unavailableCount} />
      <div className="space-y-3 border-t border-border p-4">
        <div className="flex flex-wrap items-center gap-2">
          <AdminStatusBadge tone="neutral">{sourceLabel(event.source)}</AdminStatusBadge>
          <span className="break-all text-xs text-muted-foreground">Evento {event.eventId}</span>
        </div>
        {event.workloads.map((workload) => <WorkloadDetails key={`${workload.source}:${workload.workload}`} workload={workload} />)}
      </div>
    </details>
  );
}

function WorkloadDetails({ workload }: Readonly<{ workload: OpenAiEconomicWorkload }>) {
  return (
    <details className="rounded-md border border-border bg-background">
      <Summary label={workload.label} detail={`${workload.executionCount} execuções/tentativas · ${sourceLabel(workload.source)}`} total={workload.calculatedCostUsd} pending={workload.pendingCount} unavailable={workload.unavailableCount} />
      <div className="space-y-3 border-t border-border p-4">
        {workload.executions.length > 0
          ? workload.executions.map((execution) => <OpenAiCostExecutionDetails key={execution.executionId} execution={execution} />)
          : <p className="text-sm text-muted-foreground">O histórico congelado preserva o subtotal agregado deste workload, sem detalhamento de execução ativa.</p>}
      </div>
    </details>
  );
}

function ExecutionCollection({ title, executions }: Readonly<{
  title: string;
  executions: readonly OpenAiActiveCostExecution[];
}>) {
  if (executions.length === 0) return null;
  return (
    <section className="space-y-3" aria-label={title}>
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      {executions.map((execution) => <OpenAiCostExecutionDetails key={execution.executionId} execution={execution} />)}
    </section>
  );
}

export function OpenAiCostExecutionDetails({ execution }: Readonly<{ execution: OpenAiActiveCostExecution }>) {
  return (
    <details className="rounded-md border border-border bg-card">
      <Summary label={workloadLabel(execution.workload)} detail={`Execução ${execution.executionId}`} total={execution.calculatedCostUsd} pending={execution.pendingOperationCount} unavailable={execution.unavailableOperationCount} />
      <div className="space-y-4 border-t border-border p-4">
        <dl className="grid gap-3 text-sm sm:grid-cols-2 xl:grid-cols-4">
          <Detail label="Universo" value={universeLabel(execution.universe)} />
          <Detail label="Conta" value={execution.accountName ?? execution.accountId ?? (execution.attributionStatus === "unassigned" ? "Não atribuída" : "LP Factory")} code={Boolean(execution.accountId && !execution.accountName)} />
          <Detail label="Ambiente" value={environmentLabel(execution.environment)} />
          <Detail label="Origem" value={execution.executionOrigin === "runtime" ? "Runtime" : "Prova administrativa"} />
          <Detail label="Resultado" value={execution.result ? resultLabel(execution.result) : "Pendente"} />
          <Detail label="Início" value={formatTimestamp(execution.startedAt)} />
          <Detail label="Término" value={execution.finishedAt ? formatTimestamp(execution.finishedAt) : "Pendente"} />
          <Detail label="Baseline" value={baselineLabel(execution)} />
        </dl>
        {execution.operations.length === 0 ? (
          <StatusPanel title="Execução sem operação registrada">
            A execução está preservada no ledger, mas ainda não possui operação cobrável vinculada.
          </StatusPanel>
        ) : execution.operations.map((operation) => <OperationDetails key={operation.operationId} operation={operation} />)}
      </div>
    </details>
  );
}

function OperationDetails({ operation }: Readonly<{ operation: OpenAiActiveCostOperation }>) {
  return (
    <article className="rounded-md border border-border bg-background p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h4 className="text-sm font-semibold text-foreground">Operação {operation.sequence}</h4>
          <p className="mt-1 break-all text-xs text-muted-foreground">{operation.operationId}</p>
        </div>
        {!operation.finishedAt
          ? <AdminStatusBadge tone="warning">Pendente</AdminStatusBadge>
          : operation.costStatus === "calculated" && operation.costUsd !== null
            ? <AdminStatusBadge tone="success">{formatUsd(operation.costUsd)}</AdminStatusBadge>
            : <AdminStatusBadge tone="danger">Custo indisponível</AdminStatusBadge>}
      </div>
      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2 xl:grid-cols-4">
        <Detail label="Modelo" value={operation.model} code />
        <Detail label="Effort" value={operation.reasoningEffort} code />
        <Detail label="Retry" value={operation.retryOfOperationId ? `Sim · ${operation.retryOfOperationId}` : "Não"} code={Boolean(operation.retryOfOperationId)} />
        <Detail label="Resultado" value={operation.result ? resultLabel(operation.result) : "Pendente"} />
        <Detail label="Input tokens" value={numberOrUnavailable(operation.inputTokens)} />
        <Detail label="Cached input" value={numberOrUnavailable(operation.cachedInputTokens)} />
        <Detail label="Cache write" value={numberOrUnavailable(operation.cacheWriteTokens)} />
        <Detail label="Output tokens" value={numberOrUnavailable(operation.outputTokens)} />
        <Detail label="Reasoning tokens" value={numberOrUnavailable(operation.reasoningTokens)} />
        <Detail label="Total tokens" value={numberOrUnavailable(operation.totalTokens)} />
        <Detail label="Web Search" value={numberOrUnavailable(operation.webSearchCallCount)} />
        <Detail label="Versão de preço" value={operation.pricingVersion ?? "Indisponível"} code={Boolean(operation.pricingVersion)} />
      </dl>
      {operation.costUnavailableReason ? (
        <p className="mt-3 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-950">
          Motivo da indisponibilidade: <code className="break-all text-xs">{operation.costUnavailableReason}</code>
        </p>
      ) : null}
    </article>
  );
}

function Summary({ label, detail, total, pending, unavailable }: Readonly<{
  label: string;
  detail: string;
  total: string;
  pending: number;
  unavailable: number;
}>) {
  return (
    <summary className="min-h-11 cursor-pointer list-none rounded-md px-4 py-3 outline-none focus-visible:ring-4 focus-visible:ring-brand-600/30">
      <span className="flex flex-wrap items-center justify-between gap-3">
        <span className="min-w-0">
          <span className="block text-sm font-semibold text-foreground">{label}</span>
          <span className="block text-xs text-muted-foreground">{detail}</span>
          <span className="mt-1 block text-xs font-medium text-brand-700">Abrir detalhes</span>
        </span>
        <span className="flex flex-wrap items-center gap-2">
          {pending > 0 || unavailable > 0 ? <AdminStatusBadge tone="warning">Subtotal calculável{pending > 0 ? ` · ${pending} pendentes` : ""}{unavailable > 0 ? ` · ${unavailable} indisponíveis` : ""}</AdminStatusBadge> : null}
          <strong className="text-sm text-foreground">{formatUsd(total)}</strong>
        </span>
      </span>
    </summary>
  );
}

function StatusPanel({ title, children }: Readonly<{ title: string; children: React.ReactNode }>) {
  return (
    <section className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-950 shadow-card">
      <h3 className="text-sm font-semibold">{title}</h3>
      <p className="mt-2 text-sm leading-6">{children}</p>
    </section>
  );
}

function Detail({ label, value, code = false }: Readonly<{ label: string; value: string; code?: boolean }>) {
  return <div><dt className="text-xs font-medium text-muted-foreground">{label}</dt><dd className="mt-1 break-all text-sm text-foreground">{code ? <code className="text-xs">{value}</code> : value}</dd></div>;
}

function workloadLabel(workload: OpenAiActiveCostExecution["workload"]) {
  const labels: Record<OpenAiActiveCostExecution["workload"], string> = {
    niche_resolution: "Resolução de nicho",
    commercial_activation_draft_generation: "Draft de ativação comercial",
    taxon_input_catalog_sufficiency_evaluation: "Suficiência factual do catálogo",
    landing_page_dynamic_market_research: "Pesquisa dinâmica de mercado",
    supabase_inspect: "Supabase Inspect",
  };
  return labels[workload];
}

function sourceLabel(source: OpenAiEconomicEvent["source"] | OpenAiEconomicWorkload["source"]) {
  return source === "legacy" ? "Histórico E21.4" : source === "active_and_legacy" ? "Ativo + histórico" : "Controle ativo";
}

function baselineLabel(execution: OpenAiActiveCostExecution) {
  return [execution.baselineReference, execution.baselineVersion].filter(Boolean).join(" · ") || "Não informado";
}

function resultLabel(result: "success" | "failure") {
  return result === "success" ? "Sucesso" : "Falha";
}

function environmentLabel(environment: OpenAiActiveCostExecution["environment"]) {
  return environment === "production" ? "Produção" : environment === "preview" ? "Preview" : "Desenvolvimento";
}

function universeLabel(universe: OpenAiActiveCostExecution["universe"]) {
  return universe === "client" ? "Cliente" : "LP Factory";
}

function numberOrUnavailable(value: number | null) {
  return value === null ? "Indisponível" : new Intl.NumberFormat("pt-BR").format(value);
}

function formatTimestamp(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "medium",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(value));
}

function formatUsd(value: string) {
  const negative = value.startsWith("-");
  const unsigned = negative ? value.slice(1) : value;
  const [integer, fraction = ""] = unsigned.split(".");
  const grouped = integer.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `US$ ${negative ? "−" : ""}${grouped}${fraction ? `,${fraction}` : ",00"}`;
}
