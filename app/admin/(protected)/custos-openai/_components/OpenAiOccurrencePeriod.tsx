"use client";

import { useMemo, useRef, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { AdminStatusBadge } from "@/components/admin/AdminStatusBadge";
import type { OpenAiCostsFinancialComposition } from "@/openai-costs/dashboard";
import { costActionLabels, summarizeOccurrencePeriod } from "@/openai-costs/occurrence-period";
import type { OccurrenceCostResult } from "@/openai-costs/occurrence-costs";
import { readOccurrenceCostAction } from "../actions";
import { formatUsd, universeLabel } from "./OpenAiEconomicHierarchy";
import { OccurrenceCostDetailView } from "./OpenAiOccurrenceCosts";

const periodStatus = {
  complete: "Parcela calculada",
  accumulated: "Ocorrência aberta",
  partial: "Parcela com pendências",
  unavailable: "Custo indisponível",
};
const cell = "px-3 py-1.5 text-left align-middle";
const dateUtc = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "UTC" });

export function OpenAiOccurrencePeriod({ dashboard, filters }: Readonly<{
  dashboard: OpenAiCostsFinancialComposition;
  filters?: Readonly<{ account: ReactNode; product: ReactNode; submit: ReactNode }>;
}>) {
  const dialog = useRef<HTMLDialogElement>(null);
  const selected = useRef(0);
  const [detail, setDetail] = useState<OccurrenceCostResult | null>(null);
  const active = dashboard.filteredActive;
  const summary = useMemo(() => active?.economicDimensionStatus === "v3_operation_period"
    ? summarizeOccurrencePeriod(active) : null, [active]);
  if (!active || !summary) {
    return <p className="rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">
      Consulta por produto e por início da operação indisponível neste ambiente.
    </p>;
  }
  const { rows, byAction, subtotal } = summary;
  const productSelected = dashboard.activeFilters.product === "communication_base";
  const lifetime = dashboard.productLifetime;

  async function openOccurrence(id: string) {
    const request = ++selected.current;
    setDetail(null);
    dialog.current?.showModal();
    const result = await readOccurrenceCostAction({ by: "occurrence", id })
      .catch((): OccurrenceCostResult => ({ ok: false, code: "READ_FAILED" }));
    if (request === selected.current) setDetail(result);
  }

  return (
    <section aria-labelledby="occurrence-period-title" className="space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-2">
        <div>
          <h2 id="occurrence-period-title" className="text-lg font-semibold">Ocorrências do período</h2>
          <p className="text-sm text-muted-foreground">{dashboard.selection.startDate.split("-").reverse().join("/")} a {dashboard.selection.endDate.split("-").reverse().join("/")} · início das operações em UTC</p>
        </div>
        <dl className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
          <div><dt>Subtotal calculável do período</dt><dd className="font-semibold">{subtotal === null ? "Sem valor calculado" : formatUsd(subtotal)}</dd></div>
          {productSelected && dashboard.activeFilters.accountId ? (
            <div>
              <dt>Acumulado da Base no histórico vinculado</dt>
              <dd className="font-semibold">{!lifetime ? "Consulta indisponível" : lifetime.calculatedUsd === null ? "Sem valor calculado" : formatUsd(lifetime.calculatedUsd)}</dd>
              {lifetime && (lifetime.pendingCount > 0 || lifetime.unavailableCount > 0 || lifetime.openOccurrenceCount > 0)
                ? <dd className="text-muted-foreground">Pendentes {lifetime.pendingCount} · Indisponíveis {lifetime.unavailableCount} · Ocorrências abertas {lifetime.openOccurrenceCount}</dd> : null}
            </div>
          ) : null}
        </dl>
      </div>
      {productSelected && !dashboard.activeFilters.accountId ? <p className="text-sm text-muted-foreground">Informe a conta para consultar o acumulado da Base.</p> : null}
      {active.pendingOperationCount > 0 || active.unavailableOperationCount > 0 ? (
        <p className="text-sm text-muted-foreground">{active.pendingOperationCount} operações pendentes · {active.unavailableOperationCount} com custo indisponível</p>
      ) : null}
      {active.executions.some(execution => !execution.occurrence) ? (
        <p className="text-sm text-muted-foreground">As execuções sem vínculo de ocorrência aparecem no controle ativo.</p>
      ) : null}
      {filters ? <div className="space-y-2">
        <div className="grid gap-2 sm:grid-cols-2 lg:hidden">{filters.account}{filters.product}</div>
        {filters.submit}
      </div> : null}
        <div className="overflow-x-auto rounded-lg border border-border bg-card" role="region" aria-label="Lista de ocorrências" tabIndex={0}>
          <table className="w-full text-sm">
            <thead className="bg-muted text-muted-foreground">
              <tr>
                <th scope="col" className={cell}>Ação</th>
                <th scope="col" className={cell + " hidden lg:table-cell"}>{filters?.account ?? "Conta"}</th>
                <th scope="col" className={cell + " hidden lg:table-cell"}>{filters?.product ?? "Produto/serviço"}</th>
                <th scope="col" className={cell + " hidden lg:table-cell"}>Situação financeira</th>
                <th scope="col" className={cell}>Custo no período</th>
                <th scope="col" className={cell}>Detalhe</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.length === 0 ? <tr><td colSpan={6} className={cell + " text-muted-foreground"}>Nenhuma ocorrência vinculada para esta seleção.</td></tr> : rows.map(row => {
                const account = row.accountName ?? universeLabel(row.universe);
                const action = row.action ? costActionLabels[row.action] : "Ação sem identificação";
                const product = row.product ? "Base de Comunicação" : row.action ? "Sem produto vinculado" : "Vínculo não comprovado";
                const status = row.cost === null && row.pending > 0 ? "Em apuração" : periodStatus[row.status];
                return (
                  <tr key={row.id}>
                    <th scope="row" className={cell + " font-medium"}>
                      {action}
                      <span className="block text-xs font-normal text-muted-foreground">{dateUtc.format(new Date(row.startedAt))}</span>
                      <span className="block text-xs font-normal text-muted-foreground lg:hidden">{account} · {product}</span>
                    </th>
                    <td className={cell + " hidden lg:table-cell"}>{account}</td>
                    <td className={cell + " hidden lg:table-cell"}>{product}</td>
                    <td className={cell + " hidden lg:table-cell"}><AdminStatusBadge tone={row.status === "complete" ? "success" : row.status === "accumulated" ? "neutral" : "warning"}>{status}</AdminStatusBadge></td>
                    <td className={cell}>
                      <span className="whitespace-nowrap">{row.cost === null ? "—" : formatUsd(row.cost)}</span>
                      <span className="block text-xs text-muted-foreground lg:hidden">{status}</span>
                    </td>
                    <td className={cell + " px-1 sm:px-3"}><Button variant="secondary" className="min-h-11 px-2 sm:px-4" aria-label={`Abrir ${action} de ${account}, ${dateUtc.format(new Date(row.startedAt))} UTC`} onClick={() => void openOccurrence(row.id)}>Abrir</Button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      {byAction.length > 0 ? (
        <details className="rounded-lg border border-border bg-card px-3 text-sm">
          <summary className="min-h-11 cursor-pointer py-3 font-medium">Subtotais por tipo de ação</summary>
          <dl className="space-y-1 pb-3">
            {byAction.map(group => <div key={group.action ?? "unknown"} className="flex flex-wrap justify-between gap-2">
              <dt>{group.action ? costActionLabels[group.action] : "Ação sem identificação"}{group.incomplete ? " · apuração parcial" : ""}</dt>
              <dd>{group.cost === null ? "Sem valor calculado" : formatUsd(group.cost)}</dd>
            </div>)}
          </dl>
        </details>
      ) : null}
      <dialog ref={dialog} aria-labelledby="period-occurrence-detail" onClose={() => { selected.current++; }}
        className="m-auto max-h-[90dvh] w-[94vw] max-w-4xl overflow-auto rounded-lg border border-border bg-card p-4 text-foreground backdrop:bg-black/50 sm:p-5">
        <div className="mb-2 flex items-center justify-between gap-3">
          <h2 id="period-occurrence-detail" className="text-lg font-semibold">Custo integral da ocorrência</h2>
          <form method="dialog"><Button type="submit" variant="secondary" className="min-h-11">Fechar</Button></form>
        </div>
        {!detail ? <p role="status" className="text-sm text-muted-foreground">Consultando todos os períodos…</p> :
          detail.ok ? <OccurrenceCostDetailView detail={detail.value} /> : <p role="alert" className="text-sm">Não foi possível consultar o custo integral. Tente novamente.</p>}
      </dialog>
    </section>
  );
}
