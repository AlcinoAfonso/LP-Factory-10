import "server-only";

import { resolveOpenAiWorkloadEnvironment } from "../openai-workloads";

export function isCommunicationBaseEnabled(): boolean {
  return process.env.E25_1_COMMUNICATION_BASE_ENABLED === "true";
}

export function isCommunicationResourcesEnabled(): boolean {
  return process.env.E25_3_COMMUNICATION_RESOURCES_ENABLED === "true";
}

export type AgentBaseEnvironment = "preview" | "production";

export function resolveAgentBaseEnvironment(): AgentBaseEnvironment | null {
  const environment = resolveOpenAiWorkloadEnvironment();
  if (environment !== "preview" && environment !== "production") return null;
  return isCommunicationResourcesEnabled() ? environment : null;
}
