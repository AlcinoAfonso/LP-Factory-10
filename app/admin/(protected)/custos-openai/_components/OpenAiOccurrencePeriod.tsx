"use client";

import { useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import type { OpenAiCostsFinancialComposition } from "@/openai-costs/dashboard";
import { costActionLabels, summarizeOccurrencePeriod } from "@/openai-costs/occurrence-period";
import type { OccurrenceCostResult } from "@/openai-costs/occurrence-costs";
import { readOccurrenceCostAction } from "../actions";
import { formatUsd, universeLabel, workloadLabel } from "./OpenAiEconomicHierarchy";
import { OccurrenceCostDetailView } from "./OpenAiOccurrenceCosts";

const periodStatus = {
  complete: "Parcela calculada",
  accumulated: "Ocorrência aberta",
  partial: "Parcela com pendências",
  unavailable: "Custo indisponível",
};
const cell = "px-2 py-1 align-middle sm:px-3";
const dateUtc = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "UTC" });
type OccurrenceRow = ReturnType<typeof summarizeOccurrencePeriod>["rows"][number];

export function OpenAiOccurrencePeriod({ dashboard, showActionSubtotals = true }: Readonly<{
  dashboard: OpenAiCostsFinancialComposition;
  showActionSubtotals?: boolean;
}>) {
  const dialog = useRef<HTMLDialogElement>(null);
  const requestId = useRef(0);
  const [selected, setSelected] = useState<OccurrenceRow | null>(null);
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
  const workload = dashboard.activeFilters.workload ? workloadLabel(dashboard.activeFilters.workload) : null;
  const period = `${dashboard.selection.startDate.split("-").reverse().join("/")} a ${dashboard.selection.endDate.split("-").reverse().join("/")}`;
  const incomplete = active.pendingOperationCount > 0 || active.unavailableOperationCount > 0;

  async function openOccurrence(row: OccurrenceRow) {
    const request = ++requestId.current;
    setSelected(row);
    setDetail(null);
    dialog.current?.showModal();
    const result = await readOccurrenceCostAction({ by: "occurrence", id: row.id })
      .catch((): OccurrenceCostResult => ({ ok: false, code: "READ_FAILED" }));
    if (request === requestId.current) setDetail(result);
  }

  return (
    <section aria-labelledby="occurrence-period-title" className="space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-2">
        <div>
          <h2 id="occurrence-period-title" className="text-base font-semibold">{workload ? `Eventos · ${workload}` : "Ocorrências do período"}</h2>
          <p className="text-sm text-muted-foreground">{period} · {rows.length} {rows.length === 1 ? "evento" : "eventos"} · UTC</p>
        </div>
        <dl className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
          <div><dt>{incomplete ? "Subtotal parcial" : "Subtotal do período"}</dt><dd className="font-semibold">{subtotal === null ? "Sem valor calculado" : formatUsd(subtotal)}</dd></div>
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
      {incomplete ? (
        <p className="text-sm text-muted-foreground">{active.pendingOperationCount} operações pendentes · {active.unavailableOperationCount} com custo indisponível</p>
      ) : null}
      {active.executions.some(execution => !execution.occurrence) ? (
        <p className="text-sm text-muted-foreground">As execuções sem vínculo de ocorrência aparecem no controle ativo.</p>
      ) : null}
        <div className="overflow-x-auto rounded-lg border border-border bg-card">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted text-muted-foreground">
              <tr>
                <th scope="col" className={cell}>Evento</th>
                <th scope="col" className={cell + " text-right"}>Custo no período</th>
                <th scope="col"><span className="sr-only">Detalhe</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.length === 0 ? <tr><td colSpan={3} className={cell + " text-muted-foreground"}>Nenhuma ocorrência vinculada para esta seleção.</td></tr> : rows.map(row => {
                const account = occurrenceAccount(row);
                const action = occurrenceAction(row);
                return (
                  <tr key={row.id}>
                    <th scope="row" className={cell + " font-medium [overflow-wrap:anywhere]"}>
                      {action}
                      <span className="block text-xs font-normal text-muted-foreground">{account} · {dateUtc.format(new Date(row.startedAt))}</span>
                    </th>
                    <td className={cell + " text-right"}>
                      <span className="whitespace-nowrap font-semibold tabular-nums">{row.cost === null ? "—" : formatUsd(row.cost)}</span>
                      {row.status !== "complete" ? <span className="block text-xs text-muted-foreground">{occurrenceStatus(row)}</span> : null}
                    </td>
                    <td className={cell + " w-px"}><Button type="button" variant="secondary" className="min-h-11 min-w-11 px-2" aria-label={`Abrir ${action} de ${account}, ${dateUtc.format(new Date(row.startedAt))} UTC`} onClick={() => void openOccurrence(row)}>Abrir</Button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      {showActionSubtotals && byAction.length > 0 ? (
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
      <dialog ref={dialog} aria-labelledby="period-occurrence-detail" onClose={() => { requestId.current++; }}
        className="fixed inset-0 m-auto h-fit max-h-[90dvh] w-[94vw] max-w-4xl overflow-auto rounded-lg border border-border bg-card p-4 text-foreground backdrop:bg-black/50 sm:p-5">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <h2 id="period-occurrence-detail" className="text-lg font-semibold">{selected ? occurrenceAction(selected) : "Detalhe do evento"}</h2>
          <form method="dialog"><Button type="submit" variant="secondary" className="min-h-11">Fechar</Button></form>
        </div>
        {selected ? <>
          <p className="text-sm text-muted-foreground">{occurrenceAccount(selected)} · {dateUtc.format(new Date(selected.startedAt))} UTC</p>
          <p className="text-sm text-muted-foreground">{occurrenceProduct(selected)}</p>
          <dl className="my-2 flex flex-wrap items-start justify-between gap-x-3 gap-y-1 border-t border-border pt-2 text-sm">
            <div><dt className="font-semibold">{workload ? `${workload} no período` : "Custo no período"}</dt><dd className="text-muted-foreground">{period}</dd></div>
            <div className="text-right"><dd className="font-semibold">{selected.cost === null ? "Sem valor calculado" : formatUsd(selected.cost)}</dd>
              {selected.status !== "complete" ? <dd className="text-muted-foreground">{occurrenceStatus(selected)}</dd> : null}</div>
          </dl>
        </> : null}
        {!detail ? <p role="status" className="text-sm text-muted-foreground">Consultando todos os períodos…</p> :
          detail.ok ? <OccurrenceCostDetailView detail={detail.value} compact /> : <p role="alert" className="text-sm">Não foi possível consultar o custo integral. Tente novamente.</p>}
      </dialog>
    </section>
  );
}

function occurrenceAccount(row: OccurrenceRow) {
  return row.accountName ?? (row.universe === "client" ? "Conta não identificada" : universeLabel(row.universe));
}

function occurrenceAction(row: OccurrenceRow) {
  return row.action ? costActionLabels[row.action] : "Ação sem identificação";
}

function occurrenceProduct(row: OccurrenceRow) {
  return row.product ? "Base de Comunicação" : row.action ? "Sem produto vinculado" : "Vínculo não comprovado";
}

function occurrenceStatus(row: OccurrenceRow) {
  return row.cost === null && row.pending > 0 ? "Em apuração" : periodStatus[row.status];
}
