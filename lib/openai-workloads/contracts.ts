export const openAiProductWorkloadIds = [
  "niche_resolution",
  "landing_page_generation_profile_proposal",
  "commercial_activation_draft_generation",
  "landing_page_draft_generation",
] as const;

export const openAiOperationalWorkloadIds = ["supabase_inspect"] as const;

export const openAiReasoningEfforts = [
  "none",
  "low",
  "medium",
  "high",
  "xhigh",
] as const;

export const openAiWorkloadFailureCategories = [
  "configuration_invalid",
  "transport_error",
  "http_error",
  "provider_error",
  "timeout",
  "invalid_response",
  "refusal",
  "unknown_error",
] as const;

export type OpenAiProductWorkloadId =
  (typeof openAiProductWorkloadIds)[number];
export type OpenAiOperationalWorkloadId =
  (typeof openAiOperationalWorkloadIds)[number];
export type OpenAiWorkloadId =
  | OpenAiProductWorkloadId
  | OpenAiOperationalWorkloadId;
export type OpenAiReasoningEffort = (typeof openAiReasoningEfforts)[number];
export type OpenAiWorkloadFailureCategory =
  (typeof openAiWorkloadFailureCategories)[number];
export type OpenAiWorkloadEnvironment =
  | "production"
  | "preview"
  | "development"
  | "unknown";

export type OpenAiEffectiveConfiguration = Readonly<{
  model: string;
  reasoningEffort: OpenAiReasoningEffort;
  source: "repo_catalog";
  revision: string;
}>;

export type OpenAiInventoryReferenceConfiguration = Readonly<{
  model: string;
  reasoningEffort: "not_applicable";
  source: "github_actions_default_reference";
  revision: string;
}>;

export type OpenAiProductWorkloadDefinition = Readonly<{
  id: OpenAiProductWorkloadId;
  displayName: string;
  classification: "product_runtime";
  configurationKind: "effective";
  consumer: string;
  fallback: string;
  configuration: OpenAiEffectiveConfiguration;
}>;

export type OpenAiOperationalWorkloadDefinition = Readonly<{
  id: OpenAiOperationalWorkloadId;
  displayName: string;
  classification: "operational";
  configurationKind: "inventory_reference";
  consumer: string;
  fallback: string;
  configuration: OpenAiInventoryReferenceConfiguration;
}>;

export type OpenAiWorkloadDefinition =
  | OpenAiProductWorkloadDefinition
  | OpenAiOperationalWorkloadDefinition;

export type ResolvedOpenAiProductWorkload = Readonly<{
  id: OpenAiProductWorkloadId;
  displayName: string;
  classification: "product_runtime";
  configurationKind: "effective";
  consumer: string;
  fallback: string;
  model: string;
  reasoningEffort: OpenAiReasoningEffort;
  source: "repo_catalog";
  revision: string;
  effectiveConfigurationVerified: true;
}>;

export type OpenAiWorkloadInventoryItem =
  | ResolvedOpenAiProductWorkload
  | Readonly<{
      id: OpenAiOperationalWorkloadId;
      displayName: string;
      classification: "operational";
      configurationKind: "inventory_reference";
      consumer: string;
      fallback: string;
      model: string;
      reasoningEffort: "not_applicable";
      source: "github_actions_default_reference";
      revision: string;
      effectiveConfigurationVerified: false;
    }>;

export type OpenAiWorkloadResolveErrorCode =
  | "UNKNOWN_WORKLOAD"
  | "NOT_PRODUCT_RUNTIME_WORKLOAD";

export type ResolveOpenAiProductWorkloadResult =
  | Readonly<{ ok: true; value: ResolvedOpenAiProductWorkload }>
  | Readonly<{
      ok: false;
      error: Readonly<{
        code: OpenAiWorkloadResolveErrorCode;
        message: string;
      }>;
    }>;

export type OpenAiWorkloadUsage = Readonly<{
  inputTokens: number | null;
  cachedInputTokens: number | null;
  cacheWriteTokens: number | null;
  outputTokens: number | null;
  reasoningTokens: number | null;
  totalTokens: number | null;
}>;

export type OpenAiWorkloadEventContext = Readonly<{
  workload: OpenAiProductWorkloadId;
  configurationSource: "repo_catalog";
  configurationRevision: string;
  model: string;
  reasoningEffort: OpenAiReasoningEffort;
}>;

type OpenAiWorkloadEventBase = OpenAiWorkloadEventContext &
  OpenAiWorkloadUsage &
  Readonly<{
    environment: OpenAiWorkloadEnvironment;
    responseId: string | null;
    latencyMs: number | null;
  }>;

export type OpenAiWorkloadSuccessEvent = OpenAiWorkloadEventBase &
  Readonly<{
    result: "success";
    failureCategory: null;
  }>;

export type OpenAiWorkloadFailureEvent = OpenAiWorkloadEventBase &
  Readonly<{
    result: "failure";
    failureCategory: OpenAiWorkloadFailureCategory;
  }>;

export type OpenAiWorkloadEvent =
  | OpenAiWorkloadSuccessEvent
  | OpenAiWorkloadFailureEvent;
