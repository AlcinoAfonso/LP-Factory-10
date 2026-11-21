import { createHash } from "node:crypto";
import {
  type OpenAiCostExecutionContext,
  type OpenAiCostExecutionTerminal,
  type OpenAiCostOperationContext,
  type OpenAiCostOperationTerminal,
  type OpenAiCostRecorder,
  type OpenAiCostTrackingAdapter,
} from "./active-contracts";
import { isOpenAiActiveCostTrackingEnabled } from "./active-gate";
import { normalizeOpenAiAppliedServiceTier, normalizeOpenAiResponseUsage } from "../openai-workloads";

// Financial allowlist only: never forward a provider payload into the ledger.
export function openAiCostResponseEvidence(payload: unknown) {
  const row = record(payload);
  const details = record(record(row?.usage)?.input_tokens_details);
  const writes = record(details?.cache_write_tokens_details);
  return {
    appliedModel: typeof row?.model === "string" && /^[a-zA-Z0-9._-]{1,128}$/.test(row.model) ? row.model : null,
    appliedServiceTier: normalizeOpenAiAppliedServiceTier(row?.service_tier),
    modality: "responses_text",
    usage: normalizeOpenAiResponseUsage(row?.usage),
    cacheWriteTokens30m: metric(writes?.ttl_30m_tokens),
    cacheWriteTokens12h: metric(writes?.ttl_12h_tokens),
  } as const;
}

export function openAiCostWebSearchCallCount(payload: unknown, requested: boolean): number | null {
  const row = record(payload);
  const searchUsage = record(record(row?.tool_usage)?.web_search);
  if (searchUsage && Object.hasOwn(searchUsage, "num_requests")) return metric(searchUsage.num_requests);
  if (!Array.isArray(row?.output)) return requested ? null : 0;
  let count = 0;
  for (const item of row.output) {
    const call = record(item);
    if (call?.type !== "web_search_call") continue;
    const action = record(call.action)?.type;
    if (action === "search") count += 1;
    else if (action !== "open_page" && action !== "find_in_page") return null;
  }
  return count;
}

function record(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;
}

function metric(value: unknown): number | null {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0 ? value : null;
}

type RecorderPhase = keyof OpenAiCostTrackingAdapter;
type RecorderDependencies = Readonly<{
  adapter?: OpenAiCostTrackingAdapter;
  enabled?: typeof isOpenAiActiveCostTrackingEnabled;
  timeoutMs?: number;
  emitFailure?: (event: Readonly<{
    event: "openai_cost_recording_failed";
    phase: RecorderPhase;
    executionId: string;
    operationId: string | null;
    code: "timeout" | "adapter_error";
  }>) => void;
}>;

const DEFAULT_BUDGET_MS = 350;

export function createOpenAiCostRecorder(
  dependencies: RecorderDependencies = {},
): OpenAiCostRecorder {
  const enabled = dependencies.enabled ?? isOpenAiActiveCostTrackingEnabled;
  const customEnabled = Boolean(dependencies.enabled);
  const emitFailure = dependencies.emitFailure ?? ((event) => console.warn(JSON.stringify(event)));
  let adapterPromise: Promise<OpenAiCostTrackingAdapter> | null = null;

  async function adapter() {
    if (dependencies.adapter) return dependencies.adapter;
    adapterPromise ??= import("./adapters/activeCostTrackingAdapter")
      .then((module) => module.activeCostTrackingAdapter);
    return adapterPromise;
  }

  async function attempt(
    phase: RecorderPhase,
    input: OpenAiCostExecutionContext | OpenAiCostExecutionTerminal |
      OpenAiCostOperationContext | OpenAiCostOperationTerminal,
  ) {
    const environment = "environment" in input ? input.environment : null;
    if (environment && !enabled(environment)) return false;
    if (!environment && !customEnabled && process.env.OPENAI_ACTIVE_COST_TRACKING_ENABLED?.trim().toLowerCase() !== "true") return false;

    const operationId = "operationId" in input ? input.operationId : null;
    const executionId = "executionId" in input ? input.executionId : "unknown";
    const budget = Math.max(25, Math.min(dependencies.timeoutMs ?? DEFAULT_BUDGET_MS, 2_000));
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      return await Promise.race([
        adapter().then(async (value) => (await value[phase](input as never)) === true),
        new Promise<never>((_, reject) => {
          timer = setTimeout(() => reject(new Error("timeout")), budget);
        }),
      ]);
    } catch (error) {
      emitFailure({
        event: "openai_cost_recording_failed",
        phase,
        executionId,
        operationId,
        code: error instanceof Error && error.message === "timeout" ? "timeout" : "adapter_error",
      });
      return false;
    } finally {
      if (timer) clearTimeout(timer);
    }
  }

  return Object.freeze({
    startExecution: (input) => attempt("startExecution", input),
    startOperation: (input) => attempt("startOperation", input),
    finishOperation: async (input) => { await attempt("finishOperation", input); },
    finishExecution: async (input) => { await attempt("finishExecution", input); },
  });
}

export const openAiCostRecorder = createOpenAiCostRecorder();

export function newOpenAiCostId() {
  return crypto.randomUUID();
}

export async function confirmOpenAiCostAdmission(
  recorder: OpenAiCostRecorder,
  execution: OpenAiCostExecutionContext & { occurrenceId: string },
  operation: OpenAiCostOperationContext,
) {
  try {
    return await recorder.startExecution(execution) === true &&
      await recorder.startOperation({
        ...operation, admissionScope: { environment: execution.environment, workload: execution.workload },
      }) === true;
  } catch {
    return false;
  }
}

export function resolveOpenAiOccurrenceId(
  economicContext: OpenAiCostExecutionContext["economicContext"],
  environment: OpenAiCostExecutionContext["environment"],
) {
  const event = economicContext.event;
  if (event?.kind === "lp_factory_internal") return event.eventId;
  if (event?.kind !== "niche_resolution") return crypto.randomUUID();

  // A functional dialogue can be visible in a database shared by multiple environments.
  const hex = createHash("sha256").update(JSON.stringify([
    "openai-dialogue-occurrence-v1", economicContext.accountId, environment, event.eventId,
  ])).digest("hex");
  return [hex.slice(0, 8), hex.slice(8, 12), "8" + hex.slice(13, 16), "8" + hex.slice(17, 20), hex.slice(20, 32)].join("-");
}
