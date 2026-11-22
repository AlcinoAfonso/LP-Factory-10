import type { OpenAiActiveCostReadModel, OpenAiActiveCostExecution, OpenAiCostActionKind } from "./active-contracts";
import { addDecimal, decimalFromNonNegativeString, decimalZero, formatDecimal } from "./decimal";
import { buildOccurrenceCostDetail } from "./occurrence-costs";

export type ProductLifetimeCost = Readonly<{
  calculatedUsd: string | null;
  pendingCount: number;
  unavailableCount: number;
  openOccurrenceCount: number;
}>;

export const costActionLabels: Record<OpenAiCostActionKind, string> = {
  category_3_generate: "Gerar Categoria 3",
  communication_base_generate: "Gerar inteligência da Base",
  communication_base_adjust: "Ajustar seção da Base",
  niche_resolution: "Resolver nicho",
  initial_attendance: "Atendimento inicial",
};

export function summarizeOccurrencePeriod(active: OpenAiActiveCostReadModel) {
  const groups = new Map<string, OpenAiActiveCostExecution[]>();
  for (const execution of active.executions) {
    if (!execution.occurrence) continue;
    const id = execution.occurrence.id;
    const group = groups.get(id) ?? [];
    group.push(execution);
    groups.set(id, group);
  }

  const rows = [...groups].map(([id, executions]) => {
    const first = executions[0];
    const dimensions = first.occurrence?.dimensions;
    const closedAt = executions.every(execution => execution.occurrence?.closedAt)
      ? first.occurrence?.closedAt ?? null : null;
    const detail = buildOccurrenceCostDetail(id, closedAt, executions, "period");
    const startedAt = executions.reduce<string | null>((earliest, execution) => {
      for (const operation of execution.operations) {
        if (earliest === null || operation.startedAt < earliest) earliest = operation.startedAt;
      }
      return earliest;
    }, null);
    return {
      id, startedAt: startedAt ?? first.startedAt,
      accountName: first.accountName, universe: first.universe,
      action: dimensions?.action ?? null, product: dimensions?.product ?? null,
      status: detail.status, cost: detail.calculatedCostUsd,
      pending: detail.pendingCount, unavailable: detail.unavailableCount,
    };
  }).sort((a, b) => b.startedAt.localeCompare(a.startedAt) || a.id.localeCompare(b.id));

  const actionAmounts = new Map<OpenAiCostActionKind | null, { total: ReturnType<typeof decimalZero> | null; incomplete: boolean }>();
  for (const row of rows) {
    const amount = decimalFromNonNegativeString(row.cost);
    const group = actionAmounts.get(row.action) ?? { total: null, incomplete: false };
    if (amount) group.total = addDecimal(group.total ?? decimalZero(), amount);
    group.incomplete ||= row.cost === null || row.pending > 0 || row.unavailable > 0;
    actionAmounts.set(row.action, group);
  }
  const byAction = [...actionAmounts].map(([action, group]) => ({
    action, cost: group.total ? formatDecimal(group.total) : null, incomplete: group.incomplete,
  }));
  const hasCalculated = active.modelGroups.some(group => group.calculatedCostUsd !== null);
  return { rows, byAction, subtotal: hasCalculated ? active.totalCalculatedUsd : null };
}
