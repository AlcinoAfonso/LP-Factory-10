import type { OpenAiCostEnvironment } from "./active-contracts";

export function isOpenAiActiveCostTrackingEnabled(
  environment: OpenAiCostEnvironment,
  value = process.env.OPENAI_ACTIVE_COST_TRACKING_ENABLED,
) {
  if (value?.trim().toLowerCase() !== "true") return false;
  return environment === "production" || environment === "preview" || environment === "development";
}
