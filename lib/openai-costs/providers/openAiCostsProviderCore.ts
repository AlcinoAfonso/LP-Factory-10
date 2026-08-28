import type {
  OpenAiCostsPeriod,
  OpenAiOfficialCostsErrorCode,
  OpenAiOfficialCostsReadResult,
} from "../contracts";

const OPENAI_COSTS_URL = "https://api.openai.com/v1/organization/costs";
const COSTS_BUCKET_LIMIT = 180;
const DEFAULT_TIMEOUT_MS = 15_000;
const DEFAULT_MAX_PAGES = 32;

type FetchLike = (
  input: string | URL | Request,
  init?: RequestInit,
) => Promise<Response>;

export type OpenAiCostsProviderDependencies = Readonly<{
  fetchImpl?: FetchLike;
  now?: () => Date;
  timeoutMs?: number;
  maxPages?: number;
}>;

export async function readOfficialOpenAiCostsWithKey(
  input: Readonly<{
    period: OpenAiCostsPeriod;
    adminKey: string | null | undefined;
  }>,
  dependencies: OpenAiCostsProviderDependencies = {},
): Promise<OpenAiOfficialCostsReadResult> {
  const timeoutMs = positiveInteger(dependencies.timeoutMs) ?? DEFAULT_TIMEOUT_MS;
  const maxPages = positiveInteger(dependencies.maxPages) ?? DEFAULT_MAX_PAGES;
  const now = dependencies.now ?? (() => new Date());
  const validationNow = now();
  if (Number.isNaN(validationNow.getTime())) {
    return failure("INVALID_RESPONSE", "OpenAI Costs clock is invalid");
  }
  if (!isValidPeriod(input.period, validationNow, maxPages)) {
    return failure("INVALID_PERIOD", "OpenAI Costs period is invalid");
  }

  const adminKey = normalizeSecret(input.adminKey);
  if (!adminKey) {
    return failure("ADMIN_KEY_MISSING", "OpenAI Admin API key is unavailable");
  }

  const fetchImpl = dependencies.fetchImpl ?? fetch;
  const seenCursors = new Set<string>();
  let nextPage: string | null = null;
  let pageCount = 0;
  let bucketCount = 0;
  let lastBucketEnd: number | null = null;
  let total = decimalZero();

  while (true) {
    if (pageCount >= maxPages) {
      return failure(
        "PAGINATION_INCOMPLETE",
        "OpenAI Costs pagination exceeded the configured page limit",
      );
    }

    const url = buildCostsUrl(input.period, nextPage);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    let response: Response;
    let payload: unknown;
    try {
      response = await fetchImpl(url, {
        method: "GET",
        headers: { Authorization: `Bearer ${adminKey}` },
        cache: "no-store",
        signal: controller.signal,
      });

      if (!response.ok) {
        return failure(
          "HTTP_ERROR",
          "OpenAI Costs returned a non-success status",
          response.status,
        );
      }

      try {
        payload = await response.json();
      } catch {
        return controller.signal.aborted
          ? failure("TIMEOUT", "OpenAI Costs request timed out")
          : failure("INVALID_RESPONSE", "OpenAI Costs returned invalid JSON");
      }
    } catch {
      return controller.signal.aborted
        ? failure("TIMEOUT", "OpenAI Costs request timed out")
        : failure("REQUEST_FAILED", "OpenAI Costs request failed");
    } finally {
      clearTimeout(timeout);
    }

    const parsed = parseCostsPage(payload, input.period, lastBucketEnd);
    if (!parsed.ok) return failure(parsed.code, parsed.message);

    for (const amount of parsed.amounts) {
      total = addDecimal(total, amount);
    }
    pageCount += 1;
    bucketCount += parsed.bucketCount;
    lastBucketEnd = parsed.lastBucketEnd ?? lastBucketEnd;

    if (!parsed.hasMore) break;
    const cursor = parsed.nextPage;
    if (!cursor || seenCursors.has(cursor)) {
      return failure(
        "PAGINATION_INCOMPLETE",
        "OpenAI Costs pagination cursor is missing or repeated",
      );
    }
    seenCursors.add(cursor);
    nextPage = cursor;
  }

  const fetchedAt = now();
  if (Number.isNaN(fetchedAt.getTime())) {
    return failure("INVALID_RESPONSE", "OpenAI Costs fetch timestamp is invalid");
  }

  return Object.freeze({
    ok: true,
    value: Object.freeze({
      currency: "usd",
      totalUsd: formatDecimal(total),
      startTime: input.period.startTime,
      endTime: input.period.endTime,
      bucketCount,
      pageCount,
      fetchedAt: fetchedAt.toISOString(),
    }),
  });
}

function buildCostsUrl(period: OpenAiCostsPeriod, page: string | null): URL {
  const url = new URL(OPENAI_COSTS_URL);
  url.searchParams.set("start_time", String(period.startTime));
  url.searchParams.set("end_time", String(period.endTime));
  url.searchParams.set("bucket_width", "1d");
  url.searchParams.set("limit", String(COSTS_BUCKET_LIMIT));
  if (page) url.searchParams.set("page", page);
  return url;
}

type ParsedCostsPage =
  | Readonly<{
      ok: true;
      amounts: readonly DecimalValue[];
      bucketCount: number;
      lastBucketEnd: number | null;
      hasMore: boolean;
      nextPage: string | null;
    }>
  | Readonly<{
      ok: false;
      code: Extract<
        OpenAiOfficialCostsErrorCode,
        "INVALID_RESPONSE" | "NON_USD" | "PAGINATION_INCOMPLETE"
      >;
      message: string;
    }>;

function parseCostsPage(
  payload: unknown,
  period: OpenAiCostsPeriod,
  priorBucketEnd: number | null,
): ParsedCostsPage {
  if (!isRecord(payload) || payload.object !== "page" || !Array.isArray(payload.data)) {
    return invalidPage("OpenAI Costs page shape is invalid");
  }
  if (typeof payload.has_more !== "boolean") {
    return invalidPage("OpenAI Costs pagination flag is invalid");
  }

  const nextPage = normalizeCursor(payload.next_page);
  if (payload.has_more && !nextPage) {
    return paginationFailure("OpenAI Costs next page cursor is missing");
  }
  if (!payload.has_more && payload.next_page !== null && payload.next_page !== undefined) {
    return paginationFailure("OpenAI Costs returned an unexpected final cursor");
  }

  const amounts: DecimalValue[] = [];
  let lastBucketEnd = priorBucketEnd;
  for (const rawBucket of payload.data) {
    if (
      !isRecord(rawBucket) ||
      rawBucket.object !== "bucket" ||
      !isInteger(rawBucket.start_time) ||
      !isInteger(rawBucket.end_time) ||
      rawBucket.start_time < period.startTime ||
      rawBucket.end_time > period.endTime ||
      rawBucket.start_time >= rawBucket.end_time ||
      (lastBucketEnd !== null && rawBucket.start_time < lastBucketEnd) ||
      !Array.isArray(rawBucket.results)
    ) {
      return invalidPage("OpenAI Costs bucket shape or ordering is invalid");
    }

    for (const rawResult of rawBucket.results) {
      if (
        !isRecord(rawResult) ||
        rawResult.object !== "organization.costs.result" ||
        !isRecord(rawResult.amount)
      ) {
        return invalidPage("OpenAI Costs result shape is invalid");
      }
      if (rawResult.amount.currency !== "usd") {
        return Object.freeze({
          ok: false,
          code: "NON_USD",
          message: "OpenAI Costs returned a non-USD amount",
        });
      }
      const amount = decimalFromNumber(rawResult.amount.value);
      if (!amount) return invalidPage("OpenAI Costs amount is invalid");
      amounts.push(amount);
    }
    lastBucketEnd = rawBucket.end_time;
  }

  return Object.freeze({
    ok: true,
    amounts: Object.freeze(amounts),
    bucketCount: payload.data.length,
    lastBucketEnd,
    hasMore: payload.has_more,
    nextPage,
  });
}

type DecimalValue = Readonly<{ coefficient: bigint; scale: number }>;

function decimalZero(): DecimalValue {
  return { coefficient: 0n, scale: 0 };
}

function decimalFromNumber(value: unknown): DecimalValue | null {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) return null;
  const match = /^(\d+)(?:\.(\d+))?(?:e([+-]?\d+))?$/i.exec(String(value));
  if (!match) return null;
  const fraction = match[2] ?? "";
  const exponent = Number(match[3] ?? "0");
  if (!Number.isSafeInteger(exponent)) return null;
  let coefficient = BigInt(`${match[1]}${fraction}`);
  let scale = fraction.length - exponent;
  if (scale < 0) {
    coefficient *= 10n ** BigInt(-scale);
    scale = 0;
  }
  while (scale > 0 && coefficient % 10n === 0n) {
    coefficient /= 10n;
    scale -= 1;
  }
  return { coefficient, scale };
}

function addDecimal(left: DecimalValue, right: DecimalValue): DecimalValue {
  const scale = Math.max(left.scale, right.scale);
  return {
    coefficient:
      left.coefficient * 10n ** BigInt(scale - left.scale) +
      right.coefficient * 10n ** BigInt(scale - right.scale),
    scale,
  };
}

function formatDecimal(value: DecimalValue): string {
  if (value.scale === 0) return value.coefficient.toString();
  const digits = value.coefficient.toString().padStart(value.scale + 1, "0");
  const integer = digits.slice(0, -value.scale);
  const fraction = digits.slice(-value.scale).replace(/0+$/, "");
  return fraction ? `${integer}.${fraction}` : integer;
}

function isValidPeriod(
  period: OpenAiCostsPeriod,
  now: Date,
  maxPages: number,
): boolean {
  const maximumSeconds = COSTS_BUCKET_LIMIT * maxPages * 86_400;
  return (
    isInteger(period.startTime) &&
    isInteger(period.endTime) &&
    period.startTime >= 0 &&
    period.endTime > period.startTime &&
    period.endTime <= Math.floor(now.getTime() / 1_000) &&
    period.endTime - period.startTime <= maximumSeconds
  );
}

function normalizeSecret(value: string | null | undefined): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

function normalizeCursor(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

function positiveInteger(value: unknown): number | null {
  return typeof value === "number" && Number.isSafeInteger(value) && value > 0
    ? value
    : null;
}

function isInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function invalidPage(message: string): ParsedCostsPage {
  return Object.freeze({ ok: false, code: "INVALID_RESPONSE", message });
}

function paginationFailure(message: string): ParsedCostsPage {
  return Object.freeze({ ok: false, code: "PAGINATION_INCOMPLETE", message });
}

function failure(
  code: OpenAiOfficialCostsErrorCode,
  message: string,
  httpStatus: number | null = null,
): OpenAiOfficialCostsReadResult {
  return Object.freeze({
    ok: false,
    error: Object.freeze({ code, message, httpStatus }),
  });
}
