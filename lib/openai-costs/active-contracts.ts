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

export function clientOpenAiCostContext(accountId: string): OpenAiCostEconomicContext {
  return { universe: "client", attributionStatus: "attributed", accountId };
}

export const lpFactoryOpenAiCostContext: OpenAiCostEconomicContext = Object.freeze({
  universe: "lp_factory",
  attributionStatus: "attributed",
  accountId: null,
});
