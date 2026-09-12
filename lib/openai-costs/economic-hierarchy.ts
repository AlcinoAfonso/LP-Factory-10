import type {
  OpenAiActiveCostExecution,
  OpenAiActiveCostReadModel,
  OpenAiCostUniverse,
  OpenAiEconomicDimensionStatus,
} from "./active-contracts";
import type {
  OpenAiLpCostReadModel,
  OpenAiLpCostWorkloadSummary,
} from "./contracts";
import {
  addDecimal,
  decimalFromNonNegativeString,
  decimalZero,
  formatDecimal,
  type DecimalValue,
} from "./decimal";
import type { OpenAiWorkloadId } from "../openai-workloads";

export type OpenAiEconomicSource = "active" | "legacy" | "active_and_legacy";

export type OpenAiEconomicWorkload = Readonly<{
  workload: OpenAiWorkloadId | OpenAiLpCostWorkloadSummary["workload"];
  label: string;
  source: "active" | "legacy";
  calculatedCostUsd: string;
  executionCount: number;
  operationCount: number;
  pendingCount: number;
  unavailableCount: number;
  executions: readonly OpenAiActiveCostExecution[];
}>;

export type OpenAiEconomicEvent = Readonly<{
  key: string;
  kind: "landing_page" | "niche_resolution" | "lp_factory_internal";
  eventId: string;
  startedAt: string | null;
  label: string;
  source: OpenAiEconomicSource;
  calculatedCostUsd: string;
  executionCount: number;
  operationCount: number;
  pendingCount: number;
  unavailableCount: number;
  workloads: readonly OpenAiEconomicWorkload[];
}>;

export type OpenAiEconomicAccount = Readonly<{
  accountId: string;
  accountName: string;
  calculatedCostUsd: string;
  executionCount: number;
  operationCount: number;
  pendingCount: number;
  unavailableCount: number;
  events: readonly OpenAiEconomicEvent[];
  uncorrelatedExecutions: readonly OpenAiActiveCostExecution[];
}>;

export type OpenAiEconomicUniverse = Readonly<{
  universe: OpenAiCostUniverse;
  calculatedCostUsd: string;
  executionCount: number;
  operationCount: number;
  pendingCount: number;
  unavailableCount: number;
  accounts: readonly OpenAiEconomicAccount[];
  events: readonly OpenAiEconomicEvent[];
  unassignedExecutions: readonly OpenAiActiveCostExecution[];
  uncorrelatedExecutions: readonly OpenAiActiveCostExecution[];
}>;

export type OpenAiEconomicHierarchy = Readonly<{
  economicDimensionStatus: OpenAiEconomicDimensionStatus | "active_unavailable";
  activeAvailable: boolean;
  legacyAvailable: boolean;
  clients: OpenAiEconomicUniverse;
  lpFactory: OpenAiEconomicUniverse;
  fallbackExecutions: readonly OpenAiActiveCostExecution[];
}>;

type MutableSummary = {
  total: DecimalValue;
  executionCount: number;
  operationCount: number;
  pendingCount: number;
  unavailableCount: number;
};

type MutableWorkload = MutableSummary & {
  workload: OpenAiEconomicWorkload["workload"];
  label: string;
  source: "active" | "legacy";
  executions: OpenAiActiveCostExecution[];
};

type MutableEvent = MutableSummary & {
  key: string;
  kind: OpenAiEconomicEvent["kind"];
  eventId: string;
  label: string;
  source: OpenAiEconomicSource;
  startedAt: string;
  workloads: Map<string, MutableWorkload>;
};

type MutableAccount = MutableSummary & {
  accountId: string;
  accountName: string;
  events: Map<string, MutableEvent>;
  uncorrelatedExecutions: OpenAiActiveCostExecution[];
};

export function buildOpenAiEconomicHierarchy(
  active: OpenAiActiveCostReadModel | null,
  legacy: OpenAiLpCostReadModel | null,
): OpenAiEconomicHierarchy {
  const accounts = new Map<string, MutableAccount>();
  const lpFactoryEvents = new Map<string, MutableEvent>();
  const clientUnassigned: OpenAiActiveCostExecution[] = [];
  const lpFactoryUncorrelated: OpenAiActiveCostExecution[] = [];
  const clientSummary = emptySummary();
  const lpFactorySummary = emptySummary();

  for (const legacyAccount of legacy?.accounts ?? []) {
    const account = getAccount(accounts, legacyAccount.accountId, legacyAccount.accountName);
    for (const landingPage of legacyAccount.landingPages) {
      const event = getEvent(account.events, {
        kind: "landing_page",
        eventId: landingPage.landingPageId,
        label: landingPage.landingPageName,
        source: "legacy",
        startedAt: "",
      });
      for (const workload of landingPage.workloads) addLegacyWorkload(event, workload);
    }
  }

  for (const execution of active?.executions ?? []) {
    addExecution(clientSummaryFor(execution.universe, clientSummary, lpFactorySummary), execution);
    if (active?.economicDimensionStatus === "v1_fallback") continue;
    if (execution.universe === "client") {
      if (!execution.accountId) {
        clientUnassigned.push(execution);
        continue;
      }
      if (execution.accountName === null) throw new Error("invalid_openai_economic_account_name");
      const account = getAccount(
        accounts,
        execution.accountId,
        execution.accountName,
      );
      addExecution(account, execution);
      if (!execution.economicEvent) {
        account.uncorrelatedExecutions.push(execution);
        continue;
      }
      addActiveExecution(account.events, execution);
      continue;
    }
    if (!execution.economicEvent) {
      lpFactoryUncorrelated.push(execution);
      continue;
    }
    addActiveExecution(lpFactoryEvents, execution);
  }

  if (legacy) {
    const legacyTotal = requiredDecimal(legacy.totalUsd);
    clientSummary.total = addDecimal(clientSummary.total, legacyTotal);
    clientSummary.executionCount += legacy.attemptCount;
    clientSummary.pendingCount += legacy.pendingAttemptCount;
    clientSummary.unavailableCount += legacy.unpricedAttemptCount;
  }

  return Object.freeze({
    economicDimensionStatus: active?.economicDimensionStatus ?? "active_unavailable",
    activeAvailable: active !== null,
    legacyAvailable: legacy !== null,
    clients: finalizeUniverse({
      universe: "client",
      summary: clientSummary,
      accounts,
      events: new Map(),
      unassignedExecutions: clientUnassigned,
      uncorrelatedExecutions: [],
    }),
    lpFactory: finalizeUniverse({
      universe: "lp_factory",
      summary: lpFactorySummary,
      accounts: new Map(),
      events: lpFactoryEvents,
      unassignedExecutions: [],
      uncorrelatedExecutions: lpFactoryUncorrelated,
    }),
    fallbackExecutions: active?.economicDimensionStatus === "v1_fallback"
      ? Object.freeze([...active.executions])
      : Object.freeze([]),
  });
}

function addActiveExecution(events: Map<string, MutableEvent>, execution: OpenAiActiveCostExecution) {
  const economicEvent = execution.economicEvent;
  if (!economicEvent) return;
  const event = getEvent(events, {
    kind: economicEvent.kind,
    eventId: economicEvent.eventId,
    label: eventLabel(execution),
    source: "active",
    startedAt: execution.startedAt,
  });
  if (!event.startedAt || execution.startedAt < event.startedAt) {
    event.startedAt = execution.startedAt;
    event.label = eventLabel(execution);
  }
  addExecution(event, execution);
  const workload = getWorkload(event, execution.workload, workloadLabel(execution.workload), "active");
  addExecution(workload, execution);
  workload.executions.push(execution);
}

function addLegacyWorkload(event: MutableEvent, workload: OpenAiLpCostWorkloadSummary) {
  const node = getWorkload(event, workload.workload, legacyWorkloadLabel(workload.workload), "legacy");
  const total = requiredDecimal(workload.totalUsd);
  node.total = addDecimal(node.total, total);
  node.executionCount += workload.attemptCount;
  node.pendingCount += workload.pendingAttemptCount;
  node.unavailableCount += workload.unpricedAttemptCount;
  event.total = addDecimal(event.total, total);
  event.executionCount += workload.attemptCount;
  event.pendingCount += workload.pendingAttemptCount;
  event.unavailableCount += workload.unpricedAttemptCount;
}

function getAccount(accounts: Map<string, MutableAccount>, accountId: string, accountName: string) {
  const existing = accounts.get(accountId);
  if (existing) {
    if (accountName !== "Conta sem nome") existing.accountName = accountName;
    return existing;
  }
  const created: MutableAccount = {
    ...emptySummary(),
    accountId,
    accountName,
    events: new Map(),
    uncorrelatedExecutions: [],
  };
  accounts.set(accountId, created);
  return created;
}

function getEvent(
  events: Map<string, MutableEvent>,
  input: Pick<MutableEvent, "kind" | "eventId" | "label" | "source" | "startedAt">,
) {
  const key = `${input.kind}:${input.eventId}`;
  const existing = events.get(key);
  if (existing) {
    if (existing.source !== input.source) existing.source = "active_and_legacy";
    if (input.source === "active" && input.label) existing.label = input.label;
    return existing;
  }
  const created: MutableEvent = {
    ...emptySummary(),
    ...input,
    key,
    workloads: new Map(),
  };
  events.set(key, created);
  return created;
}

function getWorkload(
  event: MutableEvent,
  workload: OpenAiEconomicWorkload["workload"],
  label: string,
  source: "active" | "legacy",
) {
  const key = `${source}:${workload}`;
  const existing = event.workloads.get(key);
  if (existing) return existing;
  const created: MutableWorkload = {
    ...emptySummary(),
    workload,
    label,
    source,
    executions: [],
  };
  event.workloads.set(key, created);
  return created;
}

function addExecution(summary: MutableSummary, execution: OpenAiActiveCostExecution) {
  summary.total = addDecimal(summary.total, requiredDecimal(execution.calculatedCostUsd));
  summary.executionCount += 1;
  summary.operationCount += execution.operations.length;
  summary.pendingCount += execution.pendingOperationCount;
  summary.unavailableCount += execution.unavailableOperationCount;
}

function finalizeUniverse(input: Readonly<{
  universe: OpenAiCostUniverse;
  summary: MutableSummary;
  accounts: Map<string, MutableAccount>;
  events: Map<string, MutableEvent>;
  unassignedExecutions: OpenAiActiveCostExecution[];
  uncorrelatedExecutions: OpenAiActiveCostExecution[];
}>): OpenAiEconomicUniverse {
  return Object.freeze({
    universe: input.universe,
    ...finalizeSummary(input.summary),
    accounts: Object.freeze([...input.accounts.values()].map(finalizeAccount).sort((a, b) =>
      a.accountName.localeCompare(b.accountName, "pt-BR") || a.accountId.localeCompare(b.accountId))),
    events: Object.freeze([...input.events.values()].map(finalizeEvent).sort(eventOrder)),
    unassignedExecutions: Object.freeze(sortExecutions(input.unassignedExecutions)),
    uncorrelatedExecutions: Object.freeze(sortExecutions(input.uncorrelatedExecutions)),
  });
}

function finalizeAccount(account: MutableAccount): OpenAiEconomicAccount {
  const events = [...account.events.values()].map(finalizeEvent).sort(eventOrder);
  const eventSummary = summarizeEvents(events);
  const uncorrelatedSummary = summarizeExecutions(account.uncorrelatedExecutions);
  return Object.freeze({
    accountId: account.accountId,
    accountName: account.accountName,
    calculatedCostUsd: formatDecimal(addDecimal(eventSummary.total, uncorrelatedSummary.total)),
    executionCount: eventSummary.executionCount + uncorrelatedSummary.executionCount,
    operationCount: eventSummary.operationCount + uncorrelatedSummary.operationCount,
    pendingCount: eventSummary.pendingCount + uncorrelatedSummary.pendingCount,
    unavailableCount: eventSummary.unavailableCount + uncorrelatedSummary.unavailableCount,
    events: Object.freeze(events),
    uncorrelatedExecutions: Object.freeze(sortExecutions(account.uncorrelatedExecutions)),
  });
}

function finalizeEvent(event: MutableEvent): OpenAiEconomicEvent {
  return Object.freeze({
    key: event.key,
    kind: event.kind,
    eventId: event.eventId,
    startedAt: event.startedAt || null,
    label: event.label,
    source: event.source,
    ...finalizeSummary(event),
    workloads: Object.freeze([...event.workloads.values()].map((workload) => Object.freeze({
      workload: workload.workload,
      label: workload.label,
      source: workload.source,
      ...finalizeSummary(workload),
      executions: Object.freeze(sortExecutions(workload.executions)),
    })).sort((a, b) => a.workload.localeCompare(b.workload))),
  });
}

function summarizeEvents(events: readonly OpenAiEconomicEvent[]) {
  return events.reduce((summary, event) => addFinalizedSummary(summary, event), emptySummary());
}

function summarizeExecutions(executions: readonly OpenAiActiveCostExecution[]) {
  return executions.reduce((summary, execution) => {
    addExecution(summary, execution);
    return summary;
  }, emptySummary());
}

function addFinalizedSummary(summary: MutableSummary, item: Readonly<{
  calculatedCostUsd: string;
  executionCount: number;
  operationCount: number;
  pendingCount: number;
  unavailableCount: number;
}>) {
  summary.total = addDecimal(summary.total, requiredDecimal(item.calculatedCostUsd));
  summary.executionCount += item.executionCount;
  summary.operationCount += item.operationCount;
  summary.pendingCount += item.pendingCount;
  summary.unavailableCount += item.unavailableCount;
  return summary;
}

function finalizeSummary(summary: MutableSummary) {
  return {
    calculatedCostUsd: formatDecimal(summary.total),
    executionCount: summary.executionCount,
    operationCount: summary.operationCount,
    pendingCount: summary.pendingCount,
    unavailableCount: summary.unavailableCount,
  };
}

function emptySummary(): MutableSummary {
  return {
    total: decimalZero(),
    executionCount: 0,
    operationCount: 0,
    pendingCount: 0,
    unavailableCount: 0,
  };
}

function requiredDecimal(value: string) {
  const parsed = decimalFromNonNegativeString(value);
  if (!parsed) throw new Error("invalid_openai_economic_cost");
  return parsed;
}

function clientSummaryFor(
  universe: OpenAiCostUniverse,
  client: MutableSummary,
  lpFactory: MutableSummary,
) {
  return universe === "client" ? client : lpFactory;
}

function eventLabel(execution: OpenAiActiveCostExecution) {
  const event = execution.economicEvent;
  if (!event) return "Evento sem correlação";
  if (event.kind === "landing_page") return execution.landingPageName ?? "Landing Page sem nome";
  if (event.kind === "niche_resolution") return `Resolução de nicho — ${execution.startedAt}`;
  return execution.taxonName ?? `${workloadLabel(execution.workload)} — ${execution.startedAt}`;
}

function workloadLabel(workload: OpenAiWorkloadId) {
  const labels: Record<OpenAiWorkloadId, string> = {
    niche_resolution: "Resolução de nicho",
    commercial_activation_draft_generation: "Draft de ativação comercial",
    taxon_input_catalog_sufficiency_evaluation: "Suficiência factual do catálogo",
    landing_page_dynamic_market_research: "Pesquisa dinâmica de mercado",
    supabase_inspect: "Supabase Inspect",
  };
  return labels[workload];
}

function legacyWorkloadLabel(workload: OpenAiLpCostWorkloadSummary["workload"]) {
  return workload === "landing_page_draft_generation" ? "Geração de texto" : "Geração de imagem";
}

function eventOrder(left: OpenAiEconomicEvent, right: OpenAiEconomicEvent) {
  return left.label.localeCompare(right.label, "pt-BR") ||
    (left.startedAt ?? "").localeCompare(right.startedAt ?? "") ||
    left.eventId.localeCompare(right.eventId);
}

function sortExecutions(executions: readonly OpenAiActiveCostExecution[]) {
  return [...executions].sort((a, b) =>
    a.startedAt.localeCompare(b.startedAt) || a.executionId.localeCompare(b.executionId));
}
