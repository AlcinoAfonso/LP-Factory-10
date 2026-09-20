import "server-only";

export function isConversationalPendingSetupEnabled(
  value = process.env.E10_9_PENDING_SETUP_CONVERSATIONAL_ENABLED,
): boolean {
  return value === "true";
}
