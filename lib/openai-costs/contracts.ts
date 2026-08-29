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

export type OpenAiLpCostWorkloadSummary = Readonly<{
  workload:
    | "landing_page_draft_generation"
    | "landing_page_draft_image_generation";
  totalUsd: string;
  attemptCount: number;
  unpricedAttemptCount: number;
  pendingAttemptCount: number;
}>;

export type OpenAiLpCostLandingPageSummary = Readonly<{
  landingPageId: string;
  landingPageName: string;
  totalUsd: string;
  attemptCount: number;
  unpricedAttemptCount: number;
  pendingAttemptCount: number;
  workloads: readonly OpenAiLpCostWorkloadSummary[];
}>;

export type OpenAiLpCostAccountSummary = Readonly<{
  accountId: string;
  accountName: string;
  totalUsd: string;
  attemptCount: number;
  unpricedAttemptCount: number;
  pendingAttemptCount: number;
  landingPages: readonly OpenAiLpCostLandingPageSummary[];
}>;

export type OpenAiLpCostReadModel = Readonly<{
  totalUsd: string;
  coverageActivatedAt: string | null;
  coverageStatus: "complete" | "partial" | "degraded" | "not_activated";
  internalUpdatedAt: string | null;
  attemptCount: number;
  unpricedAttemptCount: number;
  pendingAttemptCount: number;
  providerCreditFailureCount: number;
  accounts: readonly OpenAiLpCostAccountSummary[];
}>;

export type OpenAiLpCostReadResult =
  | Readonly<{ ok: true; value: OpenAiLpCostReadModel }>
  | Readonly<{
      ok: false;
      error: Readonly<{
        code: "READ_FAILED" | "INVALID_RESPONSE" | "PAGINATION_INCOMPLETE";
        message: string;
      }>;
    }>;
