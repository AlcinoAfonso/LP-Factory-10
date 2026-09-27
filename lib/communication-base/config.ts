import "server-only";

export function isCommunicationBaseEnabled(): boolean {
  return process.env.E25_1_COMMUNICATION_BASE_ENABLED === "true";
}
