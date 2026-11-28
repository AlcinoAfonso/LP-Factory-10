"use client";

import { useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import type { OpenAiActiveCostReadModel, OpenAiCostReadWorkloadId } from "@/openai-costs/active-contracts";
import { decimalFromNonNegativeString, subtractDecimal } from "@/openai-costs/decimal";
import { buildOpenAiEconomicHierarchy, type OpenAiEconomicAccount } from "@/openai-costs/economic-hierarchy";
import { formatUsd, workloadLabel } from "./OpenAiEconomicHierarchy";

export function OpenAiCostAccountPeriod({ active, period }: Readonly<{ active: OpenAiActiveCostReadModel; period: string }>) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [selected, setSelected] = useState<OpenAiEconomicAccount | null>(null);
  const accounts = useMemo(() => {
    const priced = new Map<string, Set<OpenAiCostReadWorkloadId>>();
    for (const execution of active.executions) {
      if (!execution.accountId || !execution.operations.some(operation => operation.costUsd !== null)) continue;
      const workloads = priced.get(execution.accountId) ?? new Set<OpenAiCostReadWorkloadId>();
      workloads.add(execution.workload);
      priced.set(execution.accountId, workloads);
    }
    const rows = [...buildOpenAiEconomicHierarchy(active, null).clients.accounts].sort((a, b) => {
      const left = decimalFromNonNegativeString(a.calculatedCostUsd);
      const right = decimalFromNonNegativeString(b.calculatedCostUsd);
      const difference = left && right ? subtractDecimal(right, left).coefficient : 0n;
      return difference > 0n ? 1 : difference < 0n ? -1 : a.accountName.localeCompare(b.accountName, "pt-BR");
    });
    return { rows, priced };
  }, [active]);

  if (active.economicDimensionStatus === "v1_fallback") {
    return <p className="text-sm text-muted-foreground">A consulta por conta está indisponível nesta versão da leitura.</p>;
  }

  return (
    <section aria-labelledby="cost-account-period-title" className="space-y-2">
      <h2 id="cost-account-period-title" className="text-base font-semibold">Custos por conta</h2>
      <p className="text-sm text-muted-foreground">{period} · {accounts.rows.length} {accounts.rows.length === 1 ? "conta" : "contas"} · Controle ativo</p>
      <div className="overflow-x-auto rounded-lg border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted text-muted-foreground">
            <tr><th scope="col" className="px-2 py-2 text-left sm:px-3">Conta</th><th scope="col" className="px-2 py-2 text-right sm:px-3">Custo no período</th><th scope="col"><span className="sr-only">Detalhe</span></th></tr>
          </thead>
          <tbody className="divide-y divide-border">
            {accounts.rows.length === 0 ? <tr><td colSpan={3} className="px-2 py-3 text-muted-foreground">Nenhum custo ativo para as contas desta seleção.</td></tr> : accounts.rows.map(account => (
              <tr key={account.accountId}>
                <th scope="row" className="px-2 py-1 text-left font-medium [overflow-wrap:anywhere] sm:px-3">
                  {account.accountName}
                  {account.pendingCount > 0 || account.unavailableCount > 0
                    ? <span className="block text-xs font-normal text-muted-foreground">{accounts.priced.has(account.accountId) ? "Custo parcial" : "Em apuração ou indisponível"}</span> : null}
                </th>
                <td className="whitespace-nowrap px-2 py-1 text-right font-semibold tabular-nums sm:px-3">
                  {accounts.priced.has(account.accountId) ? formatUsd(account.calculatedCostUsd) : "—"}
                </td>
                <td className="w-px px-2 py-1 sm:px-3">
                  <Button type="button" variant="secondary" className="min-h-11 min-w-11 px-2"
                    aria-label={`Abrir ${account.accountName}`} onClick={() => { setSelected(account); dialog.current?.showModal(); }}>Abrir</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <dialog ref={dialog} aria-labelledby="cost-account-detail-title"
        className="fixed inset-0 m-auto h-fit max-h-[90dvh] w-[94vw] max-w-lg overflow-auto rounded-lg border border-border bg-card p-4 text-foreground backdrop:bg-black/50">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <h2 id="cost-account-detail-title" className="min-w-0 text-lg font-semibold [overflow-wrap:anywhere]">{selected?.accountName ?? "Detalhe da conta"}</h2>
          <form method="dialog"><Button type="submit" variant="secondary" className="min-h-11">Fechar</Button></form>
        </div>
        {selected ? <>
          <p className="text-sm text-muted-foreground">{period}</p>
          <dl className="mb-3 mt-2 flex flex-wrap justify-between gap-2 border-b border-border pb-2 text-sm">
            <dt>{selected.pendingCount || selected.unavailableCount ? "Subtotal calculável no período" : "Custo no período"}</dt>
            <dd className="font-semibold">{accounts.priced.has(selected.accountId) ? formatUsd(selected.calculatedCostUsd) : "Sem valor calculado"}</dd>
          </dl>
          <h3 className="text-sm font-semibold">Custos por workload</h3>
          <ul className="divide-y divide-border text-sm">
            {active.groups.filter(group => group.accountId === selected.accountId).map(group => (
              <li key={group.workload} className="flex flex-wrap items-baseline justify-between gap-x-3 py-2">
                <span>{workloadLabel(group.workload)}
                  {group.pendingOperationCount || group.unavailableOperationCount
                    ? <span className="block text-xs text-muted-foreground">Pendentes {group.pendingOperationCount} · Indisponíveis {group.unavailableOperationCount}</span> : null}
                </span>
                <strong className="whitespace-nowrap">{accounts.priced.get(selected.accountId)?.has(group.workload) ? formatUsd(group.calculatedCostUsd) : "—"}</strong>
              </li>
            ))}
          </ul>
        </> : null}
      </dialog>
    </section>
  );
}
