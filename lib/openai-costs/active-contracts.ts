import type {
  OpenAiConfigurationSource,
  OpenAiReasoningEffort,
  OpenAiWorkloadEnvironment,
  OpenAiWorkloadFailureCategory,
  OpenAiWorkloadId,
  OpenAiWorkloadUsage,
} from "../openai-workloads";

export const OPENAI_ACTIVE_COST_CONTRACT_VERSION = "e21.5.3-v1";

export type OpenAiCostEnvironment = Exclude<OpenAiWorkloadEnvironment, "unknown">;
export type OpenAiCostExecutionOrigin = "runtime" | "administrative_proof";
export type OpenAiCostUniverse = "lp_factory" | "client";
export type OpenAiCostAttributionStatus = "attributed" | "unassigned";
export type OpenAiCostResult = "success" | "failure";

export type OpenAiCostEconomicContext = Readonly<{
  universe: OpenAiCostUniverse;
  attributionStatus: OpenAiCostAttributionStatus;
  accountId: string | null;
}>;

export type OpenAiCostExecutionContext = Readonly<{
  executionId: string;
  workload: OpenAiWorkloadId;
  environment: OpenAiCostEnvironment;
  executionOrigin: OpenAiCostExecutionOrigin;
  economicContext: OpenAiCostEconomicContext;
  baselineReference?: string | null;
  baselineVersion?: string | null;
  startedAt: string;
}>;

export type OpenAiCostOperationContext = Readonly<{
  operationId: string;
  executionId: string;
  sequence: number;
  retryOfOperationId?: string | null;
  model: string;
  reasoningEffort: OpenAiReasoningEffort | "not_applicable";
  configurationSource: OpenAiConfigurationSource | "github_actions_default_reference";
  configurationRevision: string;
  promptVersion?: string | null;
  contractVersion?: string | null;
  requestId?: string | null;
  startedAt: string;
}>;

export type OpenAiCostOperationTerminal = Readonly<{
  operationId: string;
  result: OpenAiCostResult;
  failureCategory?: OpenAiWorkloadFailureCategory | null;
  httpStatus?: number | null;
  providerResponseId?: string | null;
  providerRequestId?: string | null;
  providerErrorCode?: string | null;
  providerErrorType?: string | null;
  usage?: OpenAiWorkloadUsage | null;
  webSearchCallCount?: number | null;
  finishedAt: string;
}>;

export type OpenAiCostExecutionTerminal = Readonly<{
  executionId: string;
  result: OpenAiCostResult;
  failureCategory?: OpenAiWorkloadFailureCategory | null;
  finishedAt: string;
}>;

export type OpenAiCostTrackingAdapter = Readonly<{
  startExecution(input: OpenAiCostExecutionContext): Promise<void>;
  startOperation(input: OpenAiCostOperationContext): Promise<void>;
  finishOperation(input: OpenAiCostOperationTerminal): Promise<void>;
  finishExecution(input: OpenAiCostExecutionTerminal): Promise<void>;
}>;

export type OpenAiCostRecorder = OpenAiCostTrackingAdapter;

export type OpenAiActiveCostOperation = Readonly<{
  operationId: string;
  sequence: number;
  retryOfOperationId: string | null;
  model: string;
  reasoningEffort: OpenAiReasoningEffort | "not_applicable";
  configurationSource: OpenAiConfigurationSource | "github_actions_default_reference";
  configurationRevision: string;
  promptVersion: string | null;
  contractVersion: string | null;
  startedAt: string;
  finishedAt: string | null;
  result: OpenAiCostResult | null;
  failureCategory: string | null;
  inputTokens: number | null;
  cachedInputTokens: number | null;
  cacheWriteTokens: number | null;
  outputTokens: number | null;
  reasoningTokens: number | null;
  totalTokens: number | null;
  webSearchCallCount: number | null;
  webSearchToolVersion: string | null;
  webSearchPricePerCallUsd: string | null;
  pricingVersion: string | null;
  pricingEffectiveAt: string | null;
  costStatus: "calculated" | "unavailable";
  costUnavailableReason: string | null;
  costUsd: string | null;
}>;

export type OpenAiActiveCostExecution = Readonly<{
  executionId: string;
  workload: OpenAiWorkloadId;
  environment: OpenAiCostEnvironment;
  executionOrigin: OpenAiCostExecutionOrigin;
  universe: OpenAiCostUniverse;
  attributionStatus: OpenAiCostAttributionStatus;
  accountId: string | null;
  baselineReference: string | null;
  baselineVersion: string | null;
  startedAt: string;
  finishedAt: string | null;
  result: OpenAiCostResult | null;
  failureCategory: string | null;
  calculatedCostUsd: string;
  pendingOperationCount: number;
  unavailableOperationCount: number;
  operations: readonly OpenAiActiveCostOperation[];
}>;

export type OpenAiActiveCostGroup = Readonly<{
  universe: OpenAiCostUniverse;
  attributionStatus: OpenAiCostAttributionStatus;
  accountId: string | null;
  workload: OpenAiWorkloadId;
  calculatedCostUsd: string;
  executionCount: number;
  operationCount: number;
  pendingOperationCount: number;
  unavailableOperationCount: number;
}>;

export type OpenAiActiveCostCoverage = Readonly<{
  environment: OpenAiCostEnvironment;
  workload: OpenAiWorkloadId;
  activatedAt: string;
  contractVersion: string;
}>;

export type OpenAiActiveCostReadModel = Readonly<{
  totalCalculatedUsd: string;
  executionCount: number;
  operationCount: number;
  pendingOperationCount: number;
  unavailableOperationCount: number;
  unassignedExecutionCount: number;
  internalUpdatedAt: string | null;
  coverage: readonly OpenAiActiveCostCoverage[];
  groups: readonly OpenAiActiveCostGroup[];
  executions: readonly OpenAiActiveCostExecution[];
}>;

export type OpenAiActiveCostReadResult =
  | Readonly<{ ok: true; value: OpenAiActiveCostReadModel }>
  | Readonly<{
      ok: false;
      error: Readonly<{
        code: "READ_FAILED" | "INVALID_RESPONSE" | "PAGINATION_INCOMPLETE";
        message: string;
      }>;
    }>;

export type OpenAiActiveCostFilters = Readonly<{
  universe?: OpenAiCostUniverse | null;
  accountId?: string | null;
  workload?: OpenAiWorkloadId | null;
}>;

export function clientOpenAiCostContext(accountId: string): OpenAiCostEconomicContext {
  return { universe: "client", attributionStatus: "attributed", accountId };
}

export const lpFactoryOpenAiCostContext: OpenAiCostEconomicContext = Object.freeze({
  universe: "lp_factory",
  attributionStatus: "attributed",
  accountId: null,
});
