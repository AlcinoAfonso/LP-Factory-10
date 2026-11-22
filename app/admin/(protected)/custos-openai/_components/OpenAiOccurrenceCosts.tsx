"use client";

import { useActionState, useState } from "react";
import { AdminStatusBadge } from "@/components/admin/AdminStatusBadge";
import { Button } from "@/components/ui/button";
import { FeedbackMessage } from "@/components/ui/feedback-message";
import { Input } from "@/components/ui/input";
import type { OccurrenceCostDetail, OccurrenceCostResult } from "@/openai-costs/occurrence-costs";
import { readOccurrenceCostAction } from "../actions";
import {
  environmentLabel,
  formatTimestamp,
  formatUsd,
  OpenAiCostExecutionDetails,
  universeLabel,
  workloadLabel,
} from "./OpenAiEconomicHierarchy";

const errors = {
  INVALID_ID: "Informe um UUID válido.",
  NOT_FOUND: "Nenhuma ocorrência com vínculo financeiro foi encontrada para esse UUID.",
  READ_FAILED: "Não foi possível consultar o ledger da ocorrência. Tente novamente.",
  UNAUTHORIZED: "Acesso administrativo não autorizado.",
};

export function OpenAiOccurrenceCosts() {
  const [id, setId] = useState("");
  const [by, setBy] = useState("occurrence");
  const [result, submit, pending] = useActionState<OccurrenceCostResult | null, FormData>(
    async (_previous, data) => {
      try {
        return await readOccurrenceCostAction({ by: data.get("by"), id: String(data.get("id") ?? "").trim() });
      } catch {
        return { ok: false, code: "READ_FAILED" };
      }
    },
    null,
  );
  return (
    <section aria-labelledby="occurrence-title" className="space-y-3 rounded-lg border border-border bg-card p-4 shadow-card sm:p-5">
      <div>
        <h2 id="occurrence-title" className="text-base font-semibold text-foreground">Custo por ocorrência</h2>
        <p className="mt-1 text-sm text-muted-foreground">Consulte por UUID da ocorrência ou de uma execução vinculada. O detalhe reúne todos os períodos.</p>
      </div>
      <form action={submit}>
        <fieldset disabled={pending} className="grid gap-3 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-end">
          <label className="grid gap-1 text-sm font-medium">
            Identificador
            <select name="by" className="min-h-11 rounded-md border border-input bg-background px-3 text-sm focus-visible:ring-2 focus-visible:ring-ring" value={by} onChange={event => setBy(event.target.value)}>
              <option value="occurrence">Ocorrência</option>
              <option value="execution">Execução</option>
            </select>
          </label>
          <label className="grid gap-1 text-sm font-medium">
            UUID
            <Input name="id" required maxLength={36} autoComplete="off" spellCheck={false} className="min-h-11" value={id} onChange={event => setId(event.target.value)} />
          </label>
          <Button type="submit" className="min-h-11">{pending ? "Consultando…" : "Consultar ocorrência"}</Button>
        </fieldset>
      </form>
      {pending ? <p role="status" className="text-sm text-muted-foreground">Consultando operações no ledger…</p> : null}
      {result?.ok ? <OccurrenceCostDetailView detail={result.value} />
        : result && !pending ? <FeedbackMessage tone="error">{errors[result.code]}</FeedbackMessage> : null}
    </section>
  );
}

const costLabels = {
  complete: "Custo total calculado",
  accumulated: "Custo acumulado",
  partial: "Custo parcial",
  unavailable: "Custo indisponível",
};

export function OccurrenceCostDetailView({ detail }: Readonly<{ detail: OccurrenceCostDetail }>) {
  const scope = detail.executions[0];
  const workloads = [...new Set(detail.executions.map(execution => execution.workload))];
  const retryCount = detail.executions.reduce((count, execution) =>
    count + execution.operations.filter(operation => operation.retryOfOperationId !== null).length, 0);
  const tone = detail.status === "complete" ? "success" : detail.status === "accumulated" ? "neutral" : "warning";
  return (
    <div className="space-y-3 border-t border-border pt-3">
      <div role="status" className="flex flex-wrap items-center gap-2">
        <AdminStatusBadge tone={tone}>{costLabels[detail.status]}</AdminStatusBadge>
        {detail.calculatedCostUsd === null ? null : <strong className="text-lg">{formatUsd(detail.calculatedCostUsd)}</strong>}
      </div>
      {detail.operationCount === 0 ? <p className="text-sm text-muted-foreground">Nenhuma operação admitida consta no ledger desta ocorrência.</p> : null}
      {detail.pendingCount > 0 ? <p className="text-sm text-muted-foreground">Operações aguardando finalização financeira ({detail.pendingCount}).</p> : null}
      {detail.unavailableCount > 0 ? <p className="text-sm text-muted-foreground">Operações com custo indisponível ({detail.unavailableCount}). Consulte o motivo nos detalhes.</p> : null}
      <dl className="grid gap-x-4 gap-y-2 text-sm sm:grid-cols-2 xl:grid-cols-3">
        <Datum label="Ocorrência financeira" value={detail.closedAt ? "Encerrada em " + formatTimestamp(detail.closedAt) : "Aberta"} />
        <Datum label="Responsável econômico" value={scope.accountId ? scope.accountName ?? scope.accountId : universeLabel(scope.universe)} />
        <Datum label="Ambiente" value={environmentLabel(scope.environment)} />
        <Datum label="Universo" value={universeLabel(scope.universe)} />
        <Datum label="Workloads" value={workloads.map(workloadLabel).join(", ")} />
        <Datum label="UUID da ocorrência" value={detail.occurrenceId} />
        {scope.accountId ? <Datum label="UUID da conta" value={scope.accountId} /> : null}
      </dl>
      <p className="text-sm text-muted-foreground">Execuções {detail.executions.length} · Operações {detail.operationCount} · Retries {retryCount}</p>
      {detail.executions.map(execution => <OpenAiCostExecutionDetails key={execution.executionId} execution={execution} hideUnprovenAmount />)}
    </div>
  );
}

function Datum({ label, value }: Readonly<{ label: string; value: string }>) {
  return <div><dt className="text-xs font-medium text-muted-foreground">{label}</dt><dd className="break-words">{value}</dd></div>;
}
