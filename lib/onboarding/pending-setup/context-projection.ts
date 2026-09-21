import type { PendingSetupMessage } from "./contracts";
import { redactPotentialContactDetails } from "../text-redaction";

const MAX_PROJECTED_MESSAGES = 6;
const MAX_PROJECTED_MESSAGE_LENGTH = 320;
const MAX_PROJECTION_LENGTH = 1600;

export function buildPendingSetupAiProjection(input: {
  messages: readonly Pick<PendingSetupMessage, "role" | "content">[];
  currentAnswer: string;
}): string {
  const recentMessages = input.messages.slice(-MAX_PROJECTED_MESSAGES);
  const entries = [
    ...recentMessages.map((message) => ({
      role: message.role,
      content: sanitizeProjectedText(message.content),
    })),
    { role: "user" as const, content: sanitizeProjectedText(input.currentAnswer) },
  ].filter((entry) => entry.content.length > 0);

  const lines = entries.map(
    (entry) => `${entry.role === "assistant" ? "assistant" : "user"}: ${entry.content}`,
  );
  const selected: string[] = [];
  let length = 0;
  for (let index = lines.length - 1; index >= 0; index -= 1) {
    const line = lines[index];
    const nextLength = length + line.length + (selected.length > 0 ? 1 : 0);
    if (nextLength > MAX_PROJECTION_LENGTH) break;
    selected.unshift(line);
    length = nextLength;
  }
  return selected.join("\n");
}

function sanitizeProjectedText(value: string): string {
  return redactPotentialContactDetails(value)
    .replace(/[\u0000-\u001f\u007f]/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_PROJECTED_MESSAGE_LENGTH);
}

export const pendingSetupAiProjectionPolicy = Object.freeze({
  maxMessages: MAX_PROJECTED_MESSAGES,
  maxMessageLength: MAX_PROJECTED_MESSAGE_LENGTH,
  maxProjectionLength: MAX_PROJECTION_LENGTH,
});
