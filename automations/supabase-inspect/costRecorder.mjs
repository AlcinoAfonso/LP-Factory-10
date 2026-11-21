import { createHmac, randomUUID } from "node:crypto";

const VERSION = "e21.5.3-v1";
// Covers the runner-to-ingress round trip, function startup and the Supabase RPC.
const ADMISSION_TIMEOUT_MS = 5_000;
const FINALIZATION_TIMEOUT_MS = 1_500;

export function createCostRecorder(env = process.env, fetchImpl = fetch) {
  const enabled = env.OPENAI_COST_INGESTION_ENABLED?.trim().toLowerCase() === "true";
  const url = env.OPENAI_COST_INGESTION_URL?.trim();
  const secret = env.OPENAI_COST_INGESTION_HMAC_SECRET?.trim();
  const environment = env.OPENAI_COST_INGESTION_ENVIRONMENT?.trim();
  const protocolVersion = env.OPENAI_COST_INGESTION_PROTOCOL_VERSION?.trim();
  const executionId = randomUUID();
  const occurrenceId = randomUUID();
  let sequence = 0;
  let executionRecorded = false;

  async function send(action, payload) {
    if (!enabled) return false;
    if (!url || !secret || protocolVersion !== VERSION || !["production", "preview", "development"].includes(environment)) {
      console.warn(JSON.stringify({ event: "openai_cost_recording_failed", phase: action, code: "configuration_invalid", executionId }));
      return false;
    }
    const body = JSON.stringify({ version: VERSION, action, payload });
    const timestamp = Date.now().toString();
    const signature = createHmac("sha256", secret).update(`${timestamp}.${body}`).digest("hex");
    const controller = new AbortController();
    const admission = action === "startExecution" || action === "startOperation";
    const budget = admission ? ADMISSION_TIMEOUT_MS : FINALIZATION_TIMEOUT_MS;
    const deadline = performance.now() + budget;
    async function requestReceipt() {
      const response = await fetchImpl(url, {
        method: "POST",
        redirect: "error",
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
      if (admission) {
        const receipt = await response.json();
        return !controller.signal.aborted && receipt?.ok === true && (action === "startExecution"
          ? receipt.recorded === true && receipt.executionId === executionId
          : receipt.admitted === true && receipt.operationId === payload.operationId);
      }
      return true;
    }
    let timer;
    try {
      const confirmed = await Promise.race([
        requestReceipt(),
        new Promise((_, reject) => {
          timer = setTimeout(() => {
            controller.abort();
            reject(new DOMException("Financial ingress timed out", "AbortError"));
          }, budget);
        }),
      ]);
      if (performance.now() >= deadline) throw new DOMException("Financial ingress timed out", "AbortError");
      return confirmed;
    } catch (error) {
      console.warn(JSON.stringify({
        event: "openai_cost_recording_failed",
        phase: action,
        code: error?.name === "AbortError" ? "timeout" : "ingress_error",
        executionId,
        operationId: payload.operationId ?? null,
      }));
      return false;
    } finally {
      clearTimeout(timer);
    }
  }

  return Object.freeze({
    executionId,
    async start() {
      const startedAt = new Date().toISOString();
      executionRecorded = await send("startExecution", {
        occurrenceId,
        executionId,
        workload: "supabase_inspect",
        environment,
        executionOrigin: "runtime",
        economicContext: { universe: "lp_factory", attributionStatus: "attributed", accountId: null },
        startedAt,
      });
      return executionRecorded;
    },
    async startOperation(model) {
      if (!executionRecorded) return null;
      sequence += 1;
      const operationId = randomUUID();
      const admitted = await send("startOperation", {
        requireAdmission: true,
        operationId,
        executionId,
        sequence,
        model,
        reasoningEffort: "not_applicable",
        configurationSource: "github_actions_default_reference",
        configurationRevision: "v2",
        startedAt: new Date().toISOString(),
      });
      return admitted ? operationId : null;
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
        requestedServiceTier: null,
        appliedServiceTier: ["default", "fast", "priority", "ultrafast", "auto", "flex", "scale"].includes(details.appliedServiceTier)
          ? details.appliedServiceTier : null,
        appliedModel: typeof details.appliedModel === "string" && /^[a-zA-Z0-9._-]{1,128}$/.test(details.appliedModel) ? details.appliedModel : null,
        modality: "responses_text",
        cacheWriteTokens30m: token(details.usage?.input_tokens_details?.cache_write_tokens_details?.ttl_30m_tokens),
        cacheWriteTokens12h: token(details.usage?.input_tokens_details?.cache_write_tokens_details?.ttl_12h_tokens),
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
