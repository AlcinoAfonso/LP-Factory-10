import type {
  OpenAiActiveCostCoverage,
  OpenAiActiveCostExecution,
  OpenAiActiveCostFilters,
  OpenAiActiveCostGroup,
  OpenAiActiveCostOperation,
  OpenAiActiveCostReadModel,
  OpenAiActiveCostReadResult,
  OpenAiCostAttributionStatus,
  OpenAiCostEnvironment,
  OpenAiCostExecutionOrigin,
  OpenAiCostResult,
  OpenAiCostUniverse,
} from "../active-contracts";
import type { OpenAiCostsPeriod } from "../contracts";
import {
  addDecimal,
  decimalFromNonNegativeString,
  decimalZero,
  formatDecimal,
  type DecimalValue,
} from "../decimal";
import {
  openAiOperationalWorkloadIds,
  openAiProductWorkloadIds,
  openAiReasoningEfforts,
  type OpenAiWorkloadId,
} from "../../openai-workloads";

const openAiWorkloadIds = [...openAiProductWorkloadIds, ...openAiOperationalWorkloadIds] as const;
const openAiConfigurationSources = ["repo_catalog", "supabase_operational"] as const;

export const OPENAI_ACTIVE_COST_PAGE_SIZE = 500;
const MAX_PAGES = 10_000;

export type OpenAiActiveCostCursor = Readonly<{
  startedAt: string;
  executionId: string;
  operationSequence: number;
}>;

type Page = Readonly<{ data: unknown; error: unknown }>;

export async function readOpenAiActiveCostPages(input: Readonly<{
  period: OpenAiCostsPeriod;
  readPage: (cursor: OpenAiActiveCostCursor | null, limit: number) => Promise<Page>;
  readCoverage: () => Promise<Page>;
}>, pageSize = OPENAI_ACTIVE_COST_PAGE_SIZE): Promise<OpenAiActiveCostReadResult> {
  if (!validPeriod(input.period) || !Number.isSafeInteger(pageSize) || pageSize < 1 || pageSize > OPENAI_ACTIVE_COST_PAGE_SIZE) {
    return invalidResponse();
  }
  try {
    const coveragePage = await input.readCoverage();
    if (coveragePage.error) return readFailure();
    const coverage = parseCoverage(coveragePage.data);
    if (!coverage) return invalidResponse();
    const accumulator = createAccumulator(input.period, coverage);
    let cursor: OpenAiActiveCostCursor | null = null;
    for (let pageNumber = 0; pageNumber < MAX_PAGES; pageNumber += 1) {
      const page = await input.readPage(cursor, pageSize);
      if (page.error) return readFailure();
      if (!Array.isArray(page.data)) return readFailure();
      if (page.data.length > pageSize) return invalidResponse();
      if (page.data.length === 0) return accumulator.finish();
      const next = accumulator.add(page.data);
      if (!next) return invalidResponse();
      cursor = next;
    }
    return paginationFailure();
  } catch {
    return readFailure();
  }
}

export function translateOpenAiActiveCostRows(input: Readonly<{
  period: OpenAiCostsPeriod;
  rows: unknown;
  coverageRows: unknown;
}>): OpenAiActiveCostReadResult {
  const coverage = parseCoverage(input.coverageRows);
  if (!validPeriod(input.period) || !coverage || !Array.isArray(input.rows)) return invalidResponse();
  const accumulator = createAccumulator(input.period, coverage);
  return accumulator.add(input.rows) || input.rows.length === 0
    ? accumulator.finish()
    : invalidResponse();
}

export function filterOpenAiActiveCosts(
  model: OpenAiActiveCostReadModel,
  filters: OpenAiActiveCostFilters,
): OpenAiActiveCostReadModel {
  const executions = model.executions.filter((execution) =>
    (!filters.universe || execution.universe === filters.universe) &&
    (!filters.accountId || execution.accountId === filters.accountId) &&
    (!filters.workload || execution.workload === filters.workload));
  return aggregateExecutions(executions, model.coverage);
}

function createAccumulator(period: OpenAiCostsPeriod, coverage: readonly OpenAiActiveCostCoverage[]) {
  const executions = new Map<string, MutableExecution>();
  let previousKey: string | null = null;

  function add(rows: readonly unknown[]): OpenAiActiveCostCursor | null {
    let cursor: OpenAiActiveCostCursor | null = null;
    for (const raw of rows) {
      const row = parseRow(raw, period);
      if (!row) return null;
      const key = cursorKey(row.cursor);
      if (previousKey !== null && key <= previousKey) return null;
      previousKey = key;
      cursor = row.cursor;
      let execution = executions.get(row.execution.executionId);
      if (!execution) {
        execution = { ...row.execution, operations: [] };
        executions.set(row.execution.executionId, execution);
      } else if (!sameExecution(execution, row.execution)) {
        return null;
      }
      if (row.operation) execution.operations.push(row.operation);
    }
    return cursor;
  }

  function finish(): OpenAiActiveCostReadResult {
    return { ok: true, value: aggregateExecutions([...executions.values()], coverage) };
  }
  return { add, finish };
}

type MutableExecution = Omit<OpenAiActiveCostExecution,
  "calculatedCostUsd" | "pendingOperationCount" | "unavailableOperationCount" | "operations"> & {
  operations: OpenAiActiveCostOperation[];
};

function aggregateExecutions(
  input: readonly (OpenAiActiveCostExecution | MutableExecution)[],
  coverage: readonly OpenAiActiveCostCoverage[],
): OpenAiActiveCostReadModel {
  let total = decimalZero();
  let operationCount = 0;
  let pendingOperationCount = 0;
  let unavailableOperationCount = 0;
  let unassignedExecutionCount = 0;
  let internalUpdatedAt: string | null = null;
  const groups = new Map<string, MutableGroup>();
  const executions = input.map((raw) => {
    let executionTotal = decimalZero();
    let pending = 0;
    let unavailable = 0;
    const operations = [...raw.operations].sort((left, right) => left.sequence - right.sequence);
    for (const operation of operations) {
      operationCount += 1;
      if (!operation.finishedAt) pending += 1;
      else if (operation.costStatus === "unavailable") unavailable += 1;
      if (operation.costUsd !== null) {
        const cost = decimalFromNonNegativeString(operation.costUsd);
        if (cost) executionTotal = addDecimal(executionTotal, cost);
      }
      internalUpdatedAt = latest(internalUpdatedAt, operation.finishedAt ?? operation.startedAt);
    }
    if (raw.attributionStatus === "unassigned") unassignedExecutionCount += 1;
    pendingOperationCount += pending;
    unavailableOperationCount += unavailable;
    total = addDecimal(total, executionTotal);
    internalUpdatedAt = latest(internalUpdatedAt, raw.finishedAt ?? raw.startedAt);
    const groupKey = `${raw.universe}:${raw.attributionStatus}:${raw.accountId ?? "-"}:${raw.workload}`;
    const group = groups.get(groupKey) ?? {
      universe: raw.universe,
      attributionStatus: raw.attributionStatus,
      accountId: raw.accountId,
      workload: raw.workload,
      total: decimalZero(),
      executionCount: 0,
      operationCount: 0,
      pendingOperationCount: 0,
      unavailableOperationCount: 0,
    };
    group.total = addDecimal(group.total, executionTotal);
    group.executionCount += 1;
    group.operationCount += operations.length;
    group.pendingOperationCount += pending;
    group.unavailableOperationCount += unavailable;
    groups.set(groupKey, group);
    return Object.freeze({
      ...raw,
      calculatedCostUsd: formatDecimal(executionTotal),
      pendingOperationCount: pending,
      unavailableOperationCount: unavailable,
      operations: Object.freeze(operations),
    });
  });
  return Object.freeze({
    totalCalculatedUsd: formatDecimal(total),
    executionCount: executions.length,
    operationCount,
    pendingOperationCount,
    unavailableOperationCount,
    unassignedExecutionCount,
    internalUpdatedAt,
    coverage: Object.freeze([...coverage]),
    groups: Object.freeze([...groups.values()].map(finalizeGroup).sort(groupOrder)),
    executions: Object.freeze(executions),
  });
}

type MutableGroup = {
  universe: OpenAiCostUniverse;
  attributionStatus: OpenAiCostAttributionStatus;
  accountId: string | null;
  workload: OpenAiWorkloadId;
  total: DecimalValue;
  executionCount: number;
  operationCount: number;
  pendingOperationCount: number;
  unavailableOperationCount: number;
};

function finalizeGroup(group: MutableGroup): OpenAiActiveCostGroup {
  return Object.freeze({
    universe: group.universe,
    attributionStatus: group.attributionStatus,
    accountId: group.accountId,
    workload: group.workload,
    calculatedCostUsd: formatDecimal(group.total),
    executionCount: group.executionCount,
    operationCount: group.operationCount,
    pendingOperationCount: group.pendingOperationCount,
    unavailableOperationCount: group.unavailableOperationCount,
  });
}

function groupOrder(left: OpenAiActiveCostGroup, right: OpenAiActiveCostGroup) {
  return left.universe.localeCompare(right.universe) ||
    (left.accountId ?? "").localeCompare(right.accountId ?? "") ||
    left.workload.localeCompare(right.workload);
}

type ParsedRow = Readonly<{
  cursor: OpenAiActiveCostCursor;
  execution: MutableExecution;
  operation: OpenAiActiveCostOperation | null;
}>;

function parseRow(raw: unknown, period: OpenAiCostsPeriod): ParsedRow | null {
  const row = record(raw);
  if (!row) return null;
  const startedAt = timestamp(row?.cursor_started_at);
  const executionId = uuid(row?.execution_id);
  const sequence = nonNegativeInteger(row?.operation_sequence);
  const workload = workloadId(row?.workload);
  const environment = oneOf(row?.environment, ["production", "preview", "development"] as const);
  const executionOrigin = oneOf(row?.execution_origin, ["runtime", "administrative_proof"] as const);
  const universe = oneOf(row?.universe, ["lp_factory", "client"] as const);
  const attributionStatus = oneOf(row?.attribution_status, ["attributed", "unassigned"] as const);
  const accountId = row?.account_id === null ? null : uuid(row?.account_id);
  const executionFinishedAt = row?.execution_finished_at === null ? null : timestamp(row?.execution_finished_at);
  const executionResult = nullableResult(row?.execution_result);
  const executionFailure = nullableText(row?.execution_failure_category, 64);
  const baselineReference = nullableText(row?.baseline_reference, 128);
  const baselineVersion = nullableText(row?.baseline_version, 128);
  if (!startedAt || !executionId || sequence === null || !workload || !environment || !executionOrigin ||
      !universe || !attributionStatus || accountId === undefined || executionFinishedAt === undefined ||
      executionResult === undefined || executionFailure === undefined || baselineReference === undefined || baselineVersion === undefined ||
      Math.floor(Date.parse(startedAt) / 1000) < period.startTime || Math.floor(Date.parse(startedAt) / 1000) >= period.endTime ||
      (universe === "lp_factory" && (attributionStatus !== "attributed" || accountId !== null)) ||
      (universe === "client" && attributionStatus === "attributed" && accountId === null) ||
      (universe === "client" && attributionStatus === "unassigned" && accountId !== null) ||
      !validTerminal(executionFinishedAt, executionResult, executionFailure)) return null;

  const operation = row?.operation_id === null ? null : parseOperation(row, sequence);
  if ((sequence === 0) !== (operation === null)) return null;
  return {
    cursor: { startedAt, executionId, operationSequence: sequence },
    execution: {
      executionId,
      workload,
      environment,
      executionOrigin,
      universe,
      attributionStatus,
      accountId,
      baselineReference,
      baselineVersion,
      startedAt,
      finishedAt: executionFinishedAt,
      result: executionResult,
      failureCategory: executionFailure,
      operations: [],
    },
    operation,
  };
}

function parseOperation(row: Record<string, unknown>, sequence: number): OpenAiActiveCostOperation | null {
  const operationId = uuid(row.operation_id);
  const retry = row.retry_of_operation_id === null ? null : uuid(row.retry_of_operation_id);
  const model = technicalText(row.model);
  const effort = oneOf(row.reasoning_effort, [...openAiReasoningEfforts, "not_applicable"] as const);
  const source = oneOf(row.configuration_source, [...openAiConfigurationSources, "github_actions_default_reference"] as const);
  const revision = technicalText(row.configuration_revision);
  const startedAt = timestamp(row.operation_started_at);
  const finishedAt = row.operation_finished_at === null ? null : timestamp(row.operation_finished_at);
  const result = nullableResult(row.operation_result);
  const failure = nullableText(row.operation_failure_category, 64);
  const costStatus = oneOf(row.cost_status, ["calculated", "unavailable"] as const);
  const cost = row.cost_usd === null ? null : decimal(row.cost_usd);
  const unavailableReason = nullableText(row.cost_unavailable_reason, 128);
  const pricingVersion = nullableText(row.pricing_version, 128);
  const pricingEffectiveAt = row.pricing_effective_at === null ? null : timestamp(row.pricing_effective_at);
  const searchPrice = row.web_search_price_per_call_usd === null ? null : decimal(row.web_search_price_per_call_usd);
  const promptVersion = nullableText(row.prompt_version, 128);
  const contractVersion = nullableText(row.contract_version, 128);
  const webSearchToolVersion = nullableText(row.web_search_tool_version, 128);
  const tokens = ["input_tokens", "cached_input_tokens", "cache_write_tokens", "output_tokens", "reasoning_tokens", "total_tokens"]
    .map((key) => nullableNonNegativeInteger(row[key]));
  const searchCount = nullableNonNegativeInteger(row.web_search_call_count);
  if (!operationId || retry === undefined || !model || !effort || !source || !revision || !startedAt ||
      finishedAt === undefined || result === undefined || failure === undefined || !costStatus ||
      cost === undefined || unavailableReason === undefined || pricingVersion === undefined ||
      pricingEffectiveAt === undefined || searchPrice === undefined || promptVersion === undefined ||
      contractVersion === undefined || webSearchToolVersion === undefined || tokens.some((item) => item === undefined) ||
      searchCount === undefined || !validTerminal(finishedAt, result, failure) ||
      (costStatus === "calculated" && (cost === null || unavailableReason !== null || !pricingVersion || !pricingEffectiveAt || !record(row.pricing_snapshot))) ||
      (costStatus === "unavailable" && (cost !== null || !unavailableReason))) return null;
  return Object.freeze({
    operationId, sequence, retryOfOperationId: retry, model, reasoningEffort: effort,
    configurationSource: source, configurationRevision: revision,
    promptVersion,
    contractVersion,
    startedAt, finishedAt, result, failureCategory: failure,
    inputTokens: tokens[0] ?? null, cachedInputTokens: tokens[1] ?? null,
    cacheWriteTokens: tokens[2] ?? null, outputTokens: tokens[3] ?? null,
    reasoningTokens: tokens[4] ?? null, totalTokens: tokens[5] ?? null,
    webSearchCallCount: searchCount ?? null,
    webSearchToolVersion,
    webSearchPricePerCallUsd: searchPrice ?? null,
    pricingVersion: pricingVersion ?? null, pricingEffectiveAt: pricingEffectiveAt ?? null,
    costStatus, costUnavailableReason: unavailableReason ?? null, costUsd: cost ?? null,
  });
}

function parseCoverage(value: unknown): readonly OpenAiActiveCostCoverage[] | null {
  if (!Array.isArray(value) || value.length > 15) return null;
  const seen = new Set<string>();
  const output: OpenAiActiveCostCoverage[] = [];
  for (const raw of value) {
    const row = record(raw);
    const environment = oneOf(row?.environment, ["production", "preview", "development"] as const);
    const workload = workloadId(row?.workload);
    const activatedAt = timestamp(row?.activated_at);
    const contractVersion = technicalText(row?.contract_version);
    if (!environment || !workload || !activatedAt || !contractVersion) return null;
    const key = `${environment}:${workload}`;
    if (seen.has(key)) return null;
    seen.add(key);
    output.push(Object.freeze({ environment, workload, activatedAt, contractVersion }));
  }
  return Object.freeze(output.sort((a, b) => a.environment.localeCompare(b.environment) || a.workload.localeCompare(b.workload)));
}

function sameExecution(left: MutableExecution, right: MutableExecution) {
  return JSON.stringify({ ...left, operations: [] }) === JSON.stringify({ ...right, operations: [] });
}

function cursorKey(cursor: OpenAiActiveCostCursor) {
  return `${cursor.startedAt}:${cursor.executionId.toLowerCase()}:${String(cursor.operationSequence).padStart(10, "0")}`;
}

function validPeriod(period: OpenAiCostsPeriod) {
  return Number.isSafeInteger(period.startTime) && Number.isSafeInteger(period.endTime) && period.startTime < period.endTime;
}

function validTerminal(finishedAt: string | null, result: OpenAiCostResult | null, failure: string | null) {
  return finishedAt === null ? result === null && failure === null :
    result === "success" ? failure === null : result === "failure" && failure !== null;
}

function latest(left: string | null, right: string) {
  return !left || Date.parse(right) > Date.parse(left) ? right : left;
}

function record(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;
}
function uuid(value: unknown): string | null | undefined {
  return typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value) ? value : undefined;
}
function timestamp(value: unknown): string | null | undefined {
  if (typeof value !== "string") return undefined;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
}
function technicalText(value: unknown) {
  return typeof value === "string" && value.length > 0 && value.length <= 128 && /^[A-Za-z0-9][A-Za-z0-9._:-]*$/.test(value) ? value : null;
}
function nullableText(value: unknown, maximum: number): string | null | undefined {
  if (value === null) return null;
  return typeof value === "string" && value.length > 0 && value.length <= maximum && !/[\u0000-\u001f]/.test(value) ? value : undefined;
}
function nonNegativeInteger(value: unknown) {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0 ? value : null;
}
function nullableNonNegativeInteger(value: unknown): number | null | undefined {
  return value === null ? null : nonNegativeInteger(value) ?? undefined;
}
function decimal(value: unknown): string | null | undefined {
  const parsed = decimalFromNonNegativeString(value);
  return parsed ? formatDecimal(parsed) : undefined;
}
function nullableResult(value: unknown): OpenAiCostResult | null | undefined {
  return value === null ? null : value === "success" || value === "failure" ? value : undefined;
}
function workloadId(value: unknown): OpenAiWorkloadId | null {
  return typeof value === "string" && (openAiWorkloadIds as readonly string[]).includes(value) ? value as OpenAiWorkloadId : null;
}
function oneOf<const T extends readonly string[]>(value: unknown, values: T): T[number] | null {
  return typeof value === "string" && (values as readonly string[]).includes(value) ? value as T[number] : null;
}

function readFailure(): OpenAiActiveCostReadResult {
  return { ok: false, error: { code: "READ_FAILED", message: "OpenAI active costs could not be read" } };
}
function invalidResponse(): OpenAiActiveCostReadResult {
  return { ok: false, error: { code: "INVALID_RESPONSE", message: "OpenAI active cost read model is invalid" } };
}
function paginationFailure(): OpenAiActiveCostReadResult {
  return { ok: false, error: { code: "PAGINATION_INCOMPLETE", message: "OpenAI active cost pagination is incomplete" } };
}
