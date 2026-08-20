export const openAiProductWorkloadIds = [
  "niche_resolution",
  "commercial_activation_draft_generation",
  "landing_page_draft_generation",
] as const;

export const openAiImageWorkloadIds = [
  "landing_page_draft_image_generation",
] as const;

export const openAiOperationalWorkloadIds = ["supabase_inspect"] as const;

export const openAiReasoningEfforts = [
  "none",
  "low",
  "medium",
  "high",
  "xhigh",
  "max",
] as const;

export const openAiImageQualities = ["low", "medium", "high"] as const;

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
export type OpenAiImageWorkloadId = (typeof openAiImageWorkloadIds)[number];
export type OpenAiOperationalWorkloadId =
  (typeof openAiOperationalWorkloadIds)[number];
export type OpenAiWorkloadId =
  | OpenAiProductWorkloadId
  | OpenAiImageWorkloadId
  | OpenAiOperationalWorkloadId;
export type OpenAiReasoningEffort = (typeof openAiReasoningEfforts)[number];
export type OpenAiImageQuality = (typeof openAiImageQualities)[number];
export type OpenAiConfigurationSource =
  | "repo_catalog"
  | "supabase_operational";
export type OpenAiManagedWorkloadEnvironment = "production" | "preview";
export type OpenAiWorkloadFailureCategory =
  (typeof openAiWorkloadFailureCategories)[number];
export type OpenAiWorkloadEnvironment =
  | "production"
  | "preview"
  | "development"
  | "unknown";

export type OpenAiEffectiveConfiguration = Readonly<{
  apiKind: "responses_text";
  model: string;
  reasoningEffort: OpenAiReasoningEffort;
  source: "repo_catalog";
  revision: string;
}>;

export type OpenAiImageGenerationConfiguration = Readonly<{
  apiKind: "image_generation";
  model: string;
  size: "1536x1024";
  quality: OpenAiImageQuality;
  format: "webp";
  compression: 80;
  moderation: "auto";
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
  allowedConfigurations: readonly Readonly<{
    model: string;
    reasoningEffort: OpenAiReasoningEffort;
  }>[];
}>;

export type OpenAiImageWorkloadDefinition = Readonly<{
  id: OpenAiImageWorkloadId;
  displayName: string;
  classification: "product_runtime";
  configurationKind: "effective";
  consumer: string;
  fallback: string;
  configuration: OpenAiImageGenerationConfiguration;
  allowedConfigurations: readonly Readonly<{
    model: string;
    quality: OpenAiImageQuality;
  }>[];
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
  | OpenAiImageWorkloadDefinition
  | OpenAiOperationalWorkloadDefinition;

export type ResolvedOpenAiProductWorkload = Readonly<{
  id: OpenAiProductWorkloadId;
  displayName: string;
  classification: "product_runtime";
  configurationKind: "effective";
  apiKind: "responses_text";
  consumer: string;
  fallback: string;
  model: string;
  reasoningEffort: OpenAiReasoningEffort;
  source: OpenAiConfigurationSource;
  revision: string;
  effectiveConfigurationVerified: true;
}>;

export type ResolvedOpenAiImageWorkload = Readonly<{
  id: OpenAiImageWorkloadId;
  displayName: string;
  classification: "product_runtime";
  configurationKind: "effective";
  apiKind: "image_generation";
  consumer: string;
  fallback: string;
  model: string;
  size: "1536x1024";
  quality: OpenAiImageQuality;
  format: "webp";
  compression: 80;
  moderation: "auto";
  reasoningEffort: "not_applicable";
  source: OpenAiConfigurationSource;
  revision: string;
  effectiveConfigurationVerified: true;
}>;

export type OpenAiWorkloadInventoryItem =
  | (Omit<ResolvedOpenAiProductWorkload, "source"> &
      Readonly<{ source: "repo_catalog" }>)
  | (Omit<ResolvedOpenAiImageWorkload, "source"> &
      Readonly<{ source: "repo_catalog" }>)
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
  | "NOT_PRODUCT_RUNTIME_WORKLOAD"
  | "NOT_TEXT_PRODUCT_WORKLOAD"
  | "NOT_IMAGE_GENERATION_WORKLOAD"
  | "UNKNOWN_ENVIRONMENT"
  | "OPERATIONAL_CONFIGURATION_READ_FAILED"
  | "OPERATIONAL_CONFIGURATION_INVALID";

export type OpenAiOperationalConfiguration =
  | Readonly<{
      environment: OpenAiManagedWorkloadEnvironment;
      workload: OpenAiProductWorkloadId;
      apiKind: "responses_text";
      model: string;
      reasoningEffort: OpenAiReasoningEffort;
      revision: string;
    }>
  | Readonly<{
      environment: OpenAiManagedWorkloadEnvironment;
      workload: OpenAiImageWorkloadId;
      apiKind: "image_generation";
      model: string;
      quality: OpenAiImageQuality;
      revision: string;
    }>;

export type OpenAiOperationalConfigurationReadResult =
  | Readonly<{ ok: true; value: OpenAiOperationalConfiguration }>
  | Readonly<{
      ok: false;
      error: Readonly<{
        code: "READ_FAILED" | "ACTIVE_CONFIGURATION_INVALID";
        message: string;
      }>;
    }>;

export type OpenAiOperationalConfigurationReader = (input: Readonly<{
  environment: OpenAiManagedWorkloadEnvironment;
  workload: OpenAiProductWorkloadId | OpenAiImageWorkloadId;
}>) => Promise<OpenAiOperationalConfigurationReadResult>;

export type ResolveOpenAiProductWorkloadResult =
  | Readonly<{ ok: true; value: ResolvedOpenAiProductWorkload }>
  | Readonly<{
      ok: false;
      error: Readonly<{
        code: OpenAiWorkloadResolveErrorCode;
        message: string;
      }>;
    }>;

export type ResolveOpenAiImageWorkloadResult =
  | Readonly<{ ok: true; value: ResolvedOpenAiImageWorkload }>
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
  configurationSource: OpenAiConfigurationSource;
  configurationRevision: string;
  model: string;
  reasoningEffort: OpenAiReasoningEffort;
}>;

type OpenAiWorkloadEventBase = OpenAiWorkloadEventContext &
  OpenAiWorkloadUsage &
  Readonly<{
    apiKind: "responses_text";
    environment: OpenAiWorkloadEnvironment;
    attemptId: string | null;
    requestId: string | null;
    promptVersion: string | null;
    contractVersion: number | null;
    responseId: string | null;
    httpStatus: number | null;
    providerRequestId: string | null;
    providerErrorCode: string | null;
    providerErrorType: string | null;
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

export type OpenAiImageWorkloadEvent = Readonly<{
  workload: OpenAiImageWorkloadId;
  apiKind: "image_generation";
  environment: OpenAiWorkloadEnvironment;
  configurationSource: OpenAiConfigurationSource;
  configurationRevision: string;
  model: string;
  size: "1536x1024";
  quality: OpenAiImageQuality;
  format: "webp";
  compression: 80;
  moderation: "auto";
  visualBriefVersion: string | null;
  attemptId: string | null;
  requestId: string | null;
  providerRequestId: string | null;
  latencyMs: number | null;
  imageCount: number | null;
  width: number | null;
  height: number | null;
  estimatedCost: number | null;
  costStatus: "dated" | "unavailable";
  result: "success" | "failure";
  failureCategory: OpenAiWorkloadFailureCategory | null;
}>;
