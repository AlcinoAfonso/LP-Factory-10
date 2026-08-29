import type { OpenAiWorkloadEnvironment } from "../openai-workloads";

export function isOpenAiLpCostTrackingEnabled(input: Readonly<{
  flag?: string;
  environment: OpenAiWorkloadEnvironment;
}>) {
  return input.environment === "production" && input.flag === "true";
}
