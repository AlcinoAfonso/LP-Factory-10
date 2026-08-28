import type {
  OpenAiConfigurationSource,
  OpenAiImageQuality,
  OpenAiReasoningEffort,
} from "../openai-workloads";

export type OpenAiLpCostWorkload =
  | "landing_page_draft_generation"
  | "landing_page_draft_image_generation";

export type OpenAiLpCostTrackingContext = Readonly<{
  accountId: string;
  landingPageId: string;
}>;

type OpenAiLpCostStartBase = OpenAiLpCostTrackingContext &
  Readonly<{
    attemptId: string;
    source: OpenAiConfigurationSource;
    revision: string;
    model: string;
  }>;

export type OpenAiLpCostStartInput =
  | (OpenAiLpCostStartBase &
      Readonly<{
        workload: "landing_page_draft_generation";
        reasoningEffort: OpenAiReasoningEffort;
      }>)
  | (OpenAiLpCostStartBase &
      Readonly<{
        workload: "landing_page_draft_image_generation";
        size: "1536x1024";
        quality: OpenAiImageQuality;
      }>);

export type OpenAiLpCostTerminalInput = Readonly<{
  result: "success" | "failure";
  usage?: unknown;
  serviceTier?: unknown;
  imageCount?: number;
}>;

export type OpenAiLpCostTrackingSession = Readonly<{
  complete(input: OpenAiLpCostTerminalInput): Promise<void>;
}>;

export type OpenAiLpCostTracker = Readonly<{
  start(input: OpenAiLpCostStartInput): Promise<OpenAiLpCostTrackingSession>;
}>;
