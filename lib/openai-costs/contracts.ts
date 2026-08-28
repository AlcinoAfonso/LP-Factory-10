export type OpenAiCostsPeriod = Readonly<{
  startTime: number;
  endTime: number;
}>;

export type OpenAiOfficialCosts = Readonly<{
  currency: "usd";
  totalUsd: string;
  startTime: number;
  endTime: number;
  bucketCount: number;
  pageCount: number;
  fetchedAt: string;
}>;

export type OpenAiOfficialCostsErrorCode =
  | "INVALID_PERIOD"
  | "ADMIN_KEY_MISSING"
  | "REQUEST_FAILED"
  | "TIMEOUT"
  | "HTTP_ERROR"
  | "INVALID_RESPONSE"
  | "NON_USD"
  | "PAGINATION_INCOMPLETE";

export type OpenAiOfficialCostsReadResult =
  | Readonly<{ ok: true; value: OpenAiOfficialCosts }>
  | Readonly<{
      ok: false;
      error: Readonly<{
        code: OpenAiOfficialCostsErrorCode;
        message: string;
        httpStatus: number | null;
      }>;
    }>;

export type OpenAiOfficialCostsReader = (
  period: OpenAiCostsPeriod,
) => Promise<OpenAiOfficialCostsReadResult>;
