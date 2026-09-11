import { createHmac, timingSafeEqual } from "node:crypto";
import type { OpenAiWorkloadInventoryItem } from "../openai-workloads";

export const OPENAI_COST_INGESTION_PROTOCOL_VERSION = "e21.5.3-v1";
export const OPENAI_COST_INGESTION_MAX_CLOCK_SKEW_MS = 5 * 60_000;

type Action = "startExecution" | "startOperation" | "finishOperation" | "finishExecution";

export function validateOpenAiCostIngestion(input: Readonly<{
  body: string;
  timestamp: string;
  signature: string;
  protocol: string;
  secret: string;
  expectedEnvironment: string;
  inventory: OpenAiWorkloadInventoryItem;
  now?: number;
}>):
  | { ok: true; value: { action: Action; payload: Record<string, unknown> } }
  | { ok: false; code: string } {
  const parsedTimestamp = Number(input.timestamp);
  const now = input.now ?? Date.now();
  if (!["production", "preview", "development"].includes(input.expectedEnvironment)) {
    return { ok: false, code: "configuration_invalid" };
  }
  if (input.protocol !== OPENAI_COST_INGESTION_PROTOCOL_VERSION ||
      !Number.isSafeInteger(parsedTimestamp) || parsedTimestamp > now ||
      now - parsedTimestamp > OPENAI_COST_INGESTION_MAX_CLOCK_SKEW_MS) {
    return { ok: false, code: "request_expired" };
  }
  if (!validSignature(input.timestamp, input.body, input.signature, input.secret)) {
    return { ok: false, code: "signature_invalid" };
  }
  let envelope: unknown;
  try { envelope = JSON.parse(input.body); } catch { return { ok: false, code: "json_invalid" }; }
  return validateEnvelope(envelope, input.expectedEnvironment, input.inventory);
}

function validSignature(timestamp: string, body: string, supplied: string, secret: string) {
  if (!secret || !/^[a-f0-9]{64}$/i.test(supplied)) return false;
  const expected = createHmac("sha256", secret).update(`${timestamp}.${body}`).digest();
  const actual = Buffer.from(supplied, "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

function validateEnvelope(value: unknown, expectedEnvironment: string, inventory: OpenAiWorkloadInventoryItem):
  | { ok: true; value: { action: Action; payload: Record<string, unknown> } }
  | { ok: false; code: string } {
  const root = record(value);
  const payload = record(root?.payload);
  const action = root?.action;
  if (root?.version !== OPENAI_COST_INGESTION_PROTOCOL_VERSION || !payload ||
      !["startExecution", "startOperation", "finishOperation", "finishExecution"].includes(String(action))) {
    return { ok: false, code: "envelope_invalid" };
  }
  const needsExecutionId = action !== "finishOperation";
  const needsOperationId = action === "startOperation" || action === "finishOperation";
  if ((needsExecutionId && !uuid(payload.executionId)) || (needsOperationId && !uuid(payload.operationId))) {
    return { ok: false, code: "identity_invalid" };
  }
  if (action === "startExecution") {
    if (!exactKeys(payload, ["executionId", "workload", "environment", "executionOrigin", "economicContext", "startedAt"]) ||
        payload.workload !== "supabase_inspect" || payload.executionOrigin !== "runtime" || !iso(payload.startedAt) ||
        payload.environment !== expectedEnvironment ||
        !exactKeys(record(payload.economicContext) ?? {}, ["universe", "attributionStatus", "accountId"]) ||
        record(payload.economicContext)?.universe !== "lp_factory" ||
        record(payload.economicContext)?.attributionStatus !== "attributed" || record(payload.economicContext)?.accountId !== null) {
      return { ok: false, code: "execution_context_invalid" };
    }
  }
  if (action === "startOperation") {
    if (!exactKeys(payload, ["operationId", "executionId", "sequence", "model", "reasoningEffort", "configurationSource", "configurationRevision", "startedAt"]) ||
        !Number.isSafeInteger(payload.sequence) || Number(payload.sequence) < 1 || Number(payload.sequence) > 1000 || !iso(payload.startedAt) ||
        payload.model !== inventory.model || payload.reasoningEffort !== inventory.reasoningEffort ||
        payload.configurationSource !== inventory.source || payload.configurationRevision !== inventory.revision) {
      return { ok: false, code: "operation_context_invalid" };
    }
  }
  if (action === "finishOperation") {
    if (!exactKeys(payload, ["operationId", "result", "failureCategory", "providerResponseId", "providerRequestId", "httpStatus", "usage", "finishedAt"]) ||
        !terminal(payload) || !iso(payload.finishedAt) || !usage(payload.usage) ||
        !nullableIdentifier(payload.providerResponseId) || !nullableIdentifier(payload.providerRequestId) ||
        !(payload.httpStatus === null || (Number.isInteger(payload.httpStatus) && Number(payload.httpStatus) >= 100 && Number(payload.httpStatus) <= 599))) {
      return { ok: false, code: "operation_terminal_invalid" };
    }
  }
  if (action === "finishExecution") {
    if (!exactKeys(payload, ["executionId", "result", "failureCategory", "finishedAt"]) || !terminal(payload) || !iso(payload.finishedAt)) {
      return { ok: false, code: "execution_terminal_invalid" };
    }
  }
  return { ok: true, value: { action: action as Action, payload } };
}

function record(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;
}
function uuid(value: unknown) {
  return typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}
function exactKeys(value: Record<string, unknown>, expected: readonly string[]) {
  const actual = Object.keys(value);
  return actual.length === expected.length && expected.every((key) => Object.hasOwn(value, key));
}
function iso(value: unknown) {
  if (typeof value !== "string" || value.length > 32) return false;
  const date = new Date(value);
  return !Number.isNaN(date.getTime()) && date.toISOString() === value;
}
function terminal(value: Record<string, unknown>) {
  return (value.result === "success" && value.failureCategory === null) ||
    (value.result === "failure" && [
      "configuration_invalid", "transport_error", "http_error", "provider_error",
      "timeout", "invalid_response", "refusal", "unknown_error",
    ].includes(String(value.failureCategory)));
}
function usage(value: unknown) {
  if (value === null) return true;
  const row = record(value);
  const keys = ["inputTokens", "cachedInputTokens", "cacheWriteTokens", "outputTokens", "reasoningTokens", "totalTokens"];
  return Boolean(row) && exactKeys(row!, keys) && keys.every((key) => row![key] === null || (Number.isSafeInteger(row![key]) && Number(row![key]) >= 0));
}
function nullableIdentifier(value: unknown) {
  return value === null || (typeof value === "string" && value.length >= 1 && value.length <= 128 && /^[A-Za-z0-9._:-]+$/.test(value));
}
