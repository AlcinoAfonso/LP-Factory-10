import "server-only";

export function isCommunicationBaseEnabled(): boolean {
  return process.env.E25_1_COMMUNICATION_BASE_ENABLED === "true";
}

export function isCommunicationResourcesEnabled(): boolean {
  return process.env.E25_3_COMMUNICATION_RESOURCES_ENABLED === "true";
}
