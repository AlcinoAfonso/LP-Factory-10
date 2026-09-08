import { ContractError, deepFreeze } from "./contracts.mjs";

const MAX_TEXT = 500;

function sanitizeText(value) {
  if (value === null || value === undefined) return null;
  if (typeof value !== "string") throw new ContractError("invalid_evidence", "evidence text must be a string or null");
  const bounded = value.slice(0, MAX_TEXT);
  if (/^\s*(?:from|to|subject|message-id):/im.test(bounded)) {
    return "[redacted-mailbox-content]";
  }
  return bounded
    .replace(/https?:\/\/[^\s)\]}]+/gi, "[redacted-url]")
    .replace(/\/[A-Za-z0-9_./-]+\?[^\s)\]}]+/g, "[redacted-url]")
    .replace(/\/auth\/confirm(?:\?[^\s)\]}]*)?/gi, "[redacted-callback]")
    .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, "[redacted-email]")
    .replace(/\bBearer\s+[A-Za-z0-9._~-]+/gi, "Bearer [redacted]")
    .replace(/\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g, "[redacted-token]")
    .replace(/([?&](?:token|code|secret|password)=)[^&\s]+/gi, "$1[redacted]")
    .replace(/\b(password|secret|token|code|otp|verification_code|cookie|set-cookie|session|authorization)\s*[:=]\s*[^\s,;]+/gi, "$1=[redacted]");
}

export function projectEvidence(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new ContractError("invalid_evidence", "evidence source must be an object");
  }
  const allowedKeys = [
    "criterion",
    "actorFunctional",
    "environment",
    "fixtureAction",
    "expected",
    "observed",
    "productResult",
    "executorResult",
    "attempt",
    "blocker",
  ];
  for (const key of Object.keys(value)) {
    if (!allowedKeys.includes(key)) {
      throw new ContractError("invalid_evidence", `evidence.${key} is not allowed`);
    }
  }
  const attempt = value.attempt;
  if (!Number.isInteger(attempt) || attempt < 1) {
    throw new ContractError("invalid_evidence", "attempt must be a positive integer");
  }
  const fixtureAction = ["created", "reused", "reconfigured", "planned", "none"].includes(value.fixtureAction)
    ? value.fixtureAction
    : "none";
  return deepFreeze({
    criterion: sanitizeText(value.criterion),
    actorFunctional: sanitizeText(value.actorFunctional),
    environment: sanitizeText(value.environment),
    fixtureAction,
    expected: sanitizeText(value.expected),
    observed: sanitizeText(value.observed),
    productResult: sanitizeText(value.productResult),
    executorResult: sanitizeText(value.executorResult),
    attempt,
    blocker: value.blocker
      ? {
          code: sanitizeText(value.blocker.code),
          reason: sanitizeText(value.blocker.reason),
        }
      : null,
  });
}
