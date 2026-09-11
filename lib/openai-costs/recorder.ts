import {
  type OpenAiCostExecutionContext,
  type OpenAiCostExecutionTerminal,
  type OpenAiCostOperationContext,
  type OpenAiCostOperationTerminal,
  type OpenAiCostRecorder,
  type OpenAiCostTrackingAdapter,
} from "./active-contracts";
import { isOpenAiActiveCostTrackingEnabled } from "./active-gate";

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
    if (environment && !enabled(environment)) return;
    if (!environment && !customEnabled && process.env.OPENAI_ACTIVE_COST_TRACKING_ENABLED?.trim().toLowerCase() !== "true") return;

    const operationId = "operationId" in input ? input.operationId : null;
    const executionId = "executionId" in input ? input.executionId : "unknown";
    const budget = Math.max(25, Math.min(dependencies.timeoutMs ?? DEFAULT_BUDGET_MS, 2_000));
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      await Promise.race([
        adapter().then((value) => value[phase](input as never)),
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
    } finally {
      if (timer) clearTimeout(timer);
    }
  }

  return Object.freeze({
    startExecution: (input) => attempt("startExecution", input),
    startOperation: (input) => attempt("startOperation", input),
    finishOperation: (input) => attempt("finishOperation", input),
    finishExecution: (input) => attempt("finishExecution", input),
  });
}

export const openAiCostRecorder = createOpenAiCostRecorder();

export function newOpenAiCostId() {
  return crypto.randomUUID();
}
