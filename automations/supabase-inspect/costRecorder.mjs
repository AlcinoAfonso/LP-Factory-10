import { createHmac, randomUUID } from "node:crypto";

const VERSION = "e21.5.3-v1";
const TIMEOUT_MS = 1_500;

export function createCostRecorder(env = process.env, fetchImpl = fetch) {
  const enabled = env.OPENAI_COST_INGESTION_ENABLED?.trim().toLowerCase() === "true";
  const url = env.OPENAI_COST_INGESTION_URL?.trim();
  const secret = env.OPENAI_COST_INGESTION_HMAC_SECRET?.trim();
  const environment = env.OPENAI_COST_INGESTION_ENVIRONMENT?.trim();
  const protocolVersion = env.OPENAI_COST_INGESTION_PROTOCOL_VERSION?.trim();
  const executionId = randomUUID();
  let sequence = 0;

  async function send(action, payload) {
    if (!enabled) return;
    if (!url || !secret || protocolVersion !== VERSION || !["production", "preview", "development"].includes(environment)) {
      console.warn(JSON.stringify({ event: "openai_cost_recording_failed", phase: action, code: "configuration_invalid", executionId }));
      return;
    }
    const body = JSON.stringify({ version: VERSION, action, payload });
    const timestamp = Date.now().toString();
    const signature = createHmac("sha256", secret).update(`${timestamp}.${body}`).digest("hex");
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const response = await fetchImpl(url, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-openai-cost-protocol": VERSION,
          "x-openai-cost-timestamp": timestamp,
          "x-openai-cost-signature": signature,
        },
        body,
        signal: controller.signal,
      });
      if (!response.ok) throw new Error(`http_${response.status}`);
    } catch (error) {
      console.warn(JSON.stringify({
        event: "openai_cost_recording_failed",
        phase: action,
        code: error?.name === "AbortError" ? "timeout" : "ingress_error",
        executionId,
        operationId: payload.operationId ?? null,
      }));
    } finally {
      clearTimeout(timer);
    }
  }

  return Object.freeze({
    executionId,
    async start(model) {
      const startedAt = new Date().toISOString();
      await send("startExecution", {
        executionId,
        workload: "supabase_inspect",
        environment,
        executionOrigin: "runtime",
        economicContext: { universe: "lp_factory", attributionStatus: "attributed", accountId: null },
        startedAt,
      });
      return model;
    },
    async startOperation(model) {
      sequence += 1;
      const operationId = randomUUID();
      await send("startOperation", {
        operationId,
        executionId,
        sequence,
        model,
        reasoningEffort: "not_applicable",
        configurationSource: "github_actions_default_reference",
        configurationRevision: "v2",
        startedAt: new Date().toISOString(),
      });
      return operationId;
    },
    finishOperation(operationId, result, details = {}) {
      return send("finishOperation", {
        operationId,
        result,
        failureCategory: result === "failure" ? (details.failureCategory ?? "provider_error") : null,
        providerResponseId: details.responseId ?? null,
        providerRequestId: details.providerRequestId ?? null,
        httpStatus: details.httpStatus ?? null,
        usage: normalizeUsage(details.usage),
        finishedAt: new Date().toISOString(),
      });
    },
    finish(result, failureCategory = null) {
      return send("finishExecution", {
        executionId,
        result,
        failureCategory,
        finishedAt: new Date().toISOString(),
      });
    },
  });
}

function normalizeUsage(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const inputDetails = value.input_tokens_details && typeof value.input_tokens_details === "object"
    ? value.input_tokens_details
    : {};
  const outputDetails = value.output_tokens_details && typeof value.output_tokens_details === "object"
    ? value.output_tokens_details
    : {};
  return {
    inputTokens: token(value.input_tokens),
    cachedInputTokens: token(inputDetails.cached_tokens),
    cacheWriteTokens: token(inputDetails.cache_write_tokens),
    outputTokens: token(value.output_tokens),
    reasoningTokens: token(outputDetails.reasoning_tokens),
    totalTokens: token(value.total_tokens),
  };
}

function token(value) {
  return Number.isSafeInteger(value) && value >= 0 ? value : null;
}
