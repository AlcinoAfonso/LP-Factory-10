import type {
  OpenAiActiveCostFilters,
  OpenAiActiveCostReadModel,
  OpenAiActiveCostReadResult,
} from "./active-contracts";
import type {
  OpenAiCostsPeriod,
  OpenAiLpCostReadModel,
  OpenAiLpCostReadResult,
  OpenAiOfficialCostsReadResult,
} from "./contracts";
import { filterOpenAiActiveCosts } from "./adapters/activeCostReadModelAdapterCore";
import {
  decimalFromNonNegativeString,
  formatDecimal,
  subtractDecimal,
} from "./decimal";

const MAX_CUSTOM_PERIOD_DAYS = 180;

export type OpenAiCostsPeriodSelection = Readonly<{
  mode: "current_month" | "custom";
  startDate: string;
  endDate: string;
  period: OpenAiCostsPeriod;
  provisional: boolean;
}>;

export type OpenAiCostsDashboard = Readonly<{
  selection: OpenAiCostsPeriodSelection;
  officialTotalUsd: string;
  officialUpdatedAt: string;
  internal: OpenAiLpCostReadModel | null;
  internalErrorCode: string | null;
  reconciliationUsd: string | null;
  reconciliationAnomalous: boolean;
}>;

export type OpenAiCostsFinancialComposition = Readonly<{
  selection: OpenAiCostsPeriodSelection;
  officialTotalUsd: string;
  officialUpdatedAt: string;
  active: OpenAiActiveCostReadModel | null;
  activeErrorCode: string | null;
  filteredActive: OpenAiActiveCostReadModel | null;
  activeFilters: OpenAiActiveCostFilters;
  legacy: OpenAiLpCostReadModel | null;
  legacyErrorCode: string | null;
  globalReconciliationUsd: string | null;
  globalReconciliationAnomalous: boolean;
}>;

export function parseOpenAiCostsPeriodSelection(
  input: Readonly<{
    mode: unknown;
    startDate: unknown;
    endDate: unknown;
  }>,
  now = new Date(),
): OpenAiCostsPeriodSelection | null {
  if (Number.isNaN(now.getTime())) return null;
  const nowSeconds = Math.floor(now.getTime() / 1_000);
  const today = utcDate(now);
  const mode = input.mode === "current_month"
    ? "current_month"
    : input.mode === "custom"
      ? "custom"
      : null;
  if (!mode) return null;

  const startDate = mode === "current_month"
    ? `${today.slice(0, 7)}-01`
    : validDateText(input.startDate);
  const endDate = mode === "current_month" ? today : validDateText(input.endDate);
  if (!startDate || !endDate || endDate < startDate) return null;

  const startTime = utcDateStartSeconds(startDate);
  const endExclusive = utcDateStartSeconds(nextDate(endDate));
  const endTime = Math.min(endExclusive, nowSeconds);
  if (
    !Number.isSafeInteger(startTime) ||
    !Number.isSafeInteger(endTime) ||
    endTime <= startTime ||
    endTime - startTime > MAX_CUSTOM_PERIOD_DAYS * 86_400
  ) {
    return null;
  }

  return {
    mode,
    startDate,
    endDate,
    period: { startTime, endTime },
    provisional: endExclusive > nowSeconds,
  };
}

export function buildOpenAiCostsDashboard(input: Readonly<{
  selection: OpenAiCostsPeriodSelection;
  official: OpenAiOfficialCostsReadResult;
  internal: OpenAiLpCostReadResult;
}>): OpenAiCostsDashboard | null {
  if (!input.official.ok) return null;
  const official = decimalFromNonNegativeString(input.official.value.totalUsd);
  if (!official) return null;
  if (!input.internal.ok) {
    return {
      selection: input.selection,
      officialTotalUsd: input.official.value.totalUsd,
      officialUpdatedAt: input.official.value.fetchedAt,
      internal: null,
      internalErrorCode: input.internal.error.code,
      reconciliationUsd: null,
      reconciliationAnomalous: false,
    };
  }
  const internal = decimalFromNonNegativeString(input.internal.value.totalUsd);
  if (!internal) return null;
  const reconciliation = subtractDecimal(official, internal);
  return {
    selection: input.selection,
    officialTotalUsd: input.official.value.totalUsd,
    officialUpdatedAt: input.official.value.fetchedAt,
    internal: input.internal.value,
    internalErrorCode: null,
    reconciliationUsd: formatDecimal(reconciliation),
    reconciliationAnomalous: reconciliation.coefficient < 0n,
  };
}

export function buildOpenAiCostsFinancialComposition(input: Readonly<{
  selection: OpenAiCostsPeriodSelection;
  official: OpenAiOfficialCostsReadResult;
  active: OpenAiActiveCostReadResult;
  legacy: OpenAiLpCostReadResult;
  activeFilters?: OpenAiActiveCostFilters;
}>): OpenAiCostsFinancialComposition | null {
  if (!input.official.ok) return null;
  const official = decimalFromNonNegativeString(input.official.value.totalUsd);
  if (!official) return null;
  const activeFilters = Object.freeze({ ...(input.activeFilters ?? {}) });
  const active = input.active.ok ? input.active.value : null;
  const legacy = input.legacy.ok ? input.legacy.value : null;
  let reconciliationUsd: string | null = null;
  let anomalous = false;
  if (active && legacy) {
    const activeTotal = decimalFromNonNegativeString(active.totalCalculatedUsd);
    const legacyTotal = decimalFromNonNegativeString(legacy.totalUsd);
    if (!activeTotal || !legacyTotal) return null;
    const reconciliation = subtractDecimal(subtractDecimal(official, activeTotal), legacyTotal);
    reconciliationUsd = formatDecimal(reconciliation);
    anomalous = reconciliation.coefficient < 0n;
  }
  return Object.freeze({
    selection: input.selection,
    officialTotalUsd: input.official.value.totalUsd,
    officialUpdatedAt: input.official.value.fetchedAt,
    active,
    activeErrorCode: input.active.ok ? null : input.active.error.code,
    filteredActive: active ? filterOpenAiActiveCosts(active, activeFilters) : null,
    activeFilters,
    legacy,
    legacyErrorCode: input.legacy.ok ? null : input.legacy.error.code,
    globalReconciliationUsd: reconciliationUsd,
    globalReconciliationAnomalous: anomalous,
  });
}

export function defaultOpenAiCostsDates(now = new Date()) {
  const today = utcDate(now);
  return { startDate: `${today.slice(0, 7)}-01`, endDate: today };
}

function utcDate(value: Date) {
  return value.toISOString().slice(0, 10);
}

function validDateText(value: unknown) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split("-").map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  return parsed.getUTCFullYear() === year &&
      parsed.getUTCMonth() === month - 1 &&
      parsed.getUTCDate() === day
    ? value
    : null;
}

function utcDateStartSeconds(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return Math.floor(Date.UTC(year, month - 1, day) / 1_000);
}

function nextDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  const next = new Date(Date.UTC(year, month - 1, day + 1));
  return [
    next.getUTCFullYear(),
    String(next.getUTCMonth() + 1).padStart(2, "0"),
    String(next.getUTCDate()).padStart(2, "0"),
  ].join("-");
}
