import type {
  OpenAiCostsPeriod,
  OpenAiLpCostAccountSummary,
  OpenAiLpCostLandingPageSummary,
  OpenAiLpCostReadResult,
  OpenAiLpCostWorkloadSummary,
} from "../contracts";
import {
  addDecimal,
  decimalFromNonNegativeString,
  decimalZero,
  formatDecimal,
  type DecimalValue,
} from "../decimal";
import {
  boundedOpenAiProviderErrorMetadata,
  boundedOpenAiProviderHttpStatus,
  isOpenAiCreditFailure,
} from "../provider-error-metadata";

export const OPENAI_LP_COST_PAGE_SIZE = 500;
const OPENAI_LP_COST_MAX_PAGES = 200;

export type OpenAiLpCostPage = Readonly<{
  data: unknown;
  error: unknown;
  status?: number;
}>;

export async function readCompleteOpenAiLpCostPages(
  readPage: (from: number, to: number) => Promise<OpenAiLpCostPage>,
  pageSize = OPENAI_LP_COST_PAGE_SIZE,
): Promise<Readonly<{ data: readonly unknown[]; error: unknown }>> {
  const accumulated: unknown[] = [];
  for (let pageNumber = 0; pageNumber < OPENAI_LP_COST_MAX_PAGES; pageNumber += 1) {
    const from = pageNumber * pageSize;
    const page = await readPage(from, from + pageSize - 1);
    if (page.error) {
      const code = asRecord(page.error)?.code ?? null;
      if (
        accumulated.length > 0 &&
        (page.status === 416 || code === "PGRST103")
      ) {
        return { data: accumulated, error: null };
      }
      return { data: accumulated, error: page.error };
    }
    if (!Array.isArray(page.data)) {
      return { data: accumulated, error: new Error("partial_page") };
    }
    accumulated.push(...page.data);
    if (page.data.length < pageSize) return { data: accumulated, error: null };
  }
  return { data: accumulated, error: new Error("pagination_incomplete") };
}

export function translateOpenAiLpCostRows(input: Readonly<{
  period: OpenAiCostsPeriod;
  eventRows: unknown;
  coverageRows: unknown;
}>): OpenAiLpCostReadResult {
  if (!Array.isArray(input.eventRows) || !Array.isArray(input.coverageRows)) {
    return invalidResponse();
  }
  if (input.coverageRows.length > 1) return invalidResponse();
  const coverageActivatedAt = input.coverageRows.length === 0
    ? null
    : timestamp(asRecord(input.coverageRows[0])?.activated_at);
  if (input.coverageRows.length === 1 && !coverageActivatedAt) {
    return invalidResponse();
  }

  const accounts = new Map<string, MutableAccount>();
  const keys = new Set<string>();
  let total = decimalZero();
  let attemptCount = 0;
  let unpricedAttemptCount = 0;
  let pendingAttemptCount = 0;
  let providerCreditFailureCount = 0;
  let internalUpdatedAt: string | null = null;

  for (const raw of input.eventRows) {
    const row = parseRow(raw, input.period);
    if (!row) return invalidResponse();
    const key = `${row.attemptId}:${row.workload}`;
    if (keys.has(key)) return invalidResponse();
    keys.add(key);
    attemptCount += 1;
    if (!row.terminalAt) pendingAttemptCount += 1;
    else if (!row.cost) unpricedAttemptCount += 1;
    if (row.providerCreditFailure) providerCreditFailureCount += 1;
    if (row.cost) total = addDecimal(total, row.cost);
    internalUpdatedAt = latestTimestamp(
      internalUpdatedAt,
      row.terminalAt ?? row.startedAt,
    );

    const account = getAccount(accounts, row.accountId, row.accountName);
    if (!account || !addAttempt(account, row)) return invalidResponse();
  }

  const startMs = input.period.startTime * 1_000;
  const coverageStatus = !coverageActivatedAt
    ? "not_activated"
    : pendingAttemptCount > 0 || unpricedAttemptCount > 0
      ? "degraded"
      : startMs < Date.parse(coverageActivatedAt)
        ? "partial"
        : "complete";

  return {
    ok: true,
    value: {
      totalUsd: formatDecimal(total),
      coverageActivatedAt,
      coverageStatus,
      internalUpdatedAt,
      attemptCount,
      unpricedAttemptCount,
      pendingAttemptCount,
      providerCreditFailureCount,
      accounts: [...accounts.values()]
        .sort(byNameThenId)
        .map(finalizeAccount),
    },
  };
}

type ParsedRow = Readonly<{
  attemptId: string;
  accountId: string;
  accountName: string;
  landingPageId: string;
  landingPageName: string;
  workload: OpenAiLpCostWorkloadSummary["workload"];
  startedAt: string;
  terminalAt: string | null;
  result: "success" | "failure" | null;
  cost: DecimalValue | null;
  providerCreditFailure: boolean;
}>;

type MutableSummary = {
  total: DecimalValue;
  attemptCount: number;
  unpricedAttemptCount: number;
  pendingAttemptCount: number;
};

type MutableWorkload = MutableSummary & {
  workload: OpenAiLpCostWorkloadSummary["workload"];
};

type MutableLandingPage = MutableSummary & {
  id: string;
  name: string;
  workloads: Map<string, MutableWorkload>;
};

type MutableAccount = MutableSummary & {
  id: string;
  name: string;
  landingPages: Map<string, MutableLandingPage>;
};

function parseRow(raw: unknown, period: OpenAiCostsPeriod): ParsedRow | null {
  const row = asRecord(raw);
  const attemptId = uuid(row?.attempt_id);
  const accountId = uuid(row?.account_id);
  const landingPageId = uuid(row?.landing_page_id);
  const accountName = nonEmptyText(row?.account_name, 240);
  const landingPageName = nonEmptyText(row?.landing_page_name, 240);
  const workload = row?.workload === "landing_page_draft_generation" ||
      row?.workload === "landing_page_draft_image_generation"
    ? row.workload
    : null;
  const startedAt = timestamp(row?.started_at);
  const terminalAt = row?.terminal_at === null
    ? null
    : timestamp(row?.terminal_at);
  const result = row?.result === null
    ? null
    : row?.result === "success" || row?.result === "failure"
      ? row.result
      : undefined;
  const cost = row?.cost_usd === null
    ? null
    : decimalFromNonNegativeString(row?.cost_usd);
  const httpStatus = row?.http_status === null
    ? null
    : boundedOpenAiProviderHttpStatus(row?.http_status);
  const providerErrorCode = row?.provider_error_code === null
    ? null
    : boundedOpenAiProviderErrorMetadata(row?.provider_error_code);
  const providerErrorType = row?.provider_error_type === null
    ? null
    : boundedOpenAiProviderErrorMetadata(row?.provider_error_type);
  if (
    !attemptId ||
    !accountId ||
    !landingPageId ||
    !accountName ||
    !landingPageName ||
    !workload ||
    !startedAt ||
    terminalAt === undefined ||
    result === undefined ||
    (row?.cost_usd !== null && !cost) ||
    (row?.http_status !== null && httpStatus === null) ||
    (row?.provider_error_code !== null && providerErrorCode === null) ||
    (row?.provider_error_type !== null && providerErrorType === null) ||
    (terminalAt === null) !== (result === null) ||
    (terminalAt === null && (
      cost !== null ||
      httpStatus !== null ||
      providerErrorCode !== null ||
      providerErrorType !== null
    )) ||
    (result === "success" && (
      httpStatus !== null ||
      providerErrorCode !== null ||
      providerErrorType !== null
    ))
  ) {
    return null;
  }
  const startedSeconds = Math.floor(Date.parse(startedAt) / 1_000);
  if (startedSeconds < period.startTime || startedSeconds >= period.endTime) {
    return null;
  }
  return {
    attemptId,
    accountId,
    accountName,
    landingPageId,
    landingPageName,
    workload,
    startedAt,
    terminalAt,
    result,
    cost,
    providerCreditFailure: result === "failure" && isOpenAiCreditFailure({
      providerErrorCode,
      providerErrorType,
    }),
  };
}

function getAccount(
  accounts: Map<string, MutableAccount>,
  id: string,
  name: string,
) {
  const existing = accounts.get(id);
  if (existing) {
    return existing.name === name ? existing : null;
  }
  const created: MutableAccount = {
    ...emptySummary(),
    id,
    name,
    landingPages: new Map(),
  };
  accounts.set(id, created);
  return created;
}

function addAttempt(account: MutableAccount, row: ParsedRow) {
  let landingPage = account.landingPages.get(row.landingPageId);
  if (!landingPage) {
    landingPage = {
      ...emptySummary(),
      id: row.landingPageId,
      name: row.landingPageName,
      workloads: new Map(),
    };
    account.landingPages.set(row.landingPageId, landingPage);
  } else if (landingPage.name !== row.landingPageName) {
    return false;
  }
  let workload = landingPage.workloads.get(row.workload);
  if (!workload) {
    workload = { ...emptySummary(), workload: row.workload };
    landingPage.workloads.set(row.workload, workload);
  }
  for (const summary of [account, landingPage, workload]) {
    summary.attemptCount += 1;
    if (!row.terminalAt) summary.pendingAttemptCount += 1;
    else if (!row.cost) summary.unpricedAttemptCount += 1;
    if (row.cost) summary.total = addDecimal(summary.total, row.cost);
  }
  return true;
}

function finalizeAccount(account: MutableAccount): OpenAiLpCostAccountSummary {
  return {
    accountId: account.id,
    accountName: account.name,
    ...finalizeSummary(account),
    landingPages: [...account.landingPages.values()]
      .sort(byNameThenId)
      .map(finalizeLandingPage),
  };
}

function finalizeLandingPage(
  landingPage: MutableLandingPage,
): OpenAiLpCostLandingPageSummary {
  return {
    landingPageId: landingPage.id,
    landingPageName: landingPage.name,
    ...finalizeSummary(landingPage),
    workloads: [...landingPage.workloads.values()]
      .sort((left, right) => left.workload.localeCompare(right.workload))
      .map((workload) => ({
        workload: workload.workload,
        ...finalizeSummary(workload),
      })),
  };
}

function finalizeSummary(summary: MutableSummary) {
  return {
    totalUsd: formatDecimal(summary.total),
    attemptCount: summary.attemptCount,
    unpricedAttemptCount: summary.unpricedAttemptCount,
    pendingAttemptCount: summary.pendingAttemptCount,
  };
}

function emptySummary(): MutableSummary {
  return {
    total: decimalZero(),
    attemptCount: 0,
    unpricedAttemptCount: 0,
    pendingAttemptCount: 0,
  };
}

function byNameThenId(
  left: Readonly<{ name: string; id: string }>,
  right: Readonly<{ name: string; id: string }>,
) {
  return left.name.localeCompare(right.name, "pt-BR") ||
    left.id.localeCompare(right.id);
}

function latestTimestamp(left: string | null, right: string) {
  return !left || Date.parse(right) > Date.parse(left) ? right : left;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function uuid(value: unknown) {
  return typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
    ? value
    : null;
}

function nonEmptyText(value: unknown, maximum: number) {
  return typeof value === "string" && value.trim() && value.length <= maximum
    ? value.trim()
    : null;
}

function timestamp(value: unknown) {
  if (typeof value !== "string") return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function invalidResponse(): OpenAiLpCostReadResult {
  return {
    ok: false,
    error: {
      code: "INVALID_RESPONSE",
      message: "OpenAI LP cost read model is invalid",
    },
  };
}
