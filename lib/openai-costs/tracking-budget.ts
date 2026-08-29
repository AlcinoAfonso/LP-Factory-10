import type {
  OpenAiLpCostTrackingDiagnostic,
  OpenAiLpCostWorkload,
} from "./tracking-contracts";

export const OPENAI_LP_COST_TRACKING_BUDGET_MS = 1_000;

type OpenAiLpCostTrackingSettled<T> =
  | Readonly<{ ok: true; value: T }>
  | Readonly<{ ok: false; reason: "failed" }>;

export type OpenAiLpCostTrackingOperationResult<T> =
  | OpenAiLpCostTrackingSettled<T>
  | Readonly<{
      ok: false;
      reason: "timeout";
      completion: Promise<OpenAiLpCostTrackingSettled<T>>;
    }>;

export async function runOpenAiLpCostTrackingOperation<T>(
  operation: () => Promise<T>,
  budgetMs = OPENAI_LP_COST_TRACKING_BUDGET_MS,
): Promise<OpenAiLpCostTrackingOperationResult<T>> {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  const boundedBudget = Number.isFinite(budgetMs)
    ? Math.max(1, Math.min(OPENAI_LP_COST_TRACKING_BUDGET_MS, Math.floor(budgetMs)))
    : OPENAI_LP_COST_TRACKING_BUDGET_MS;
  const completion: Promise<OpenAiLpCostTrackingSettled<T>> = operation().then(
    (value) => ({ ok: true, value }) as const,
    () => ({ ok: false, reason: "failed" }) as const,
  );
  try {
    const result = await Promise.race([
      completion,
      new Promise<Readonly<{ ok: false; reason: "timeout" }>>((resolve) => {
        timeout = setTimeout(
          () => resolve({ ok: false, reason: "timeout" }),
          boundedBudget,
        );
      }),
    ]);
    return !result.ok && result.reason === "timeout"
      ? { ...result, completion }
      : result;
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

export function retainOpenAiLpCostTrackingValue<T>(
  result: OpenAiLpCostTrackingOperationResult<T>,
): Promise<T | undefined> | undefined {
  if (result.ok) return Promise.resolve(result.value);
  if (result.reason === "failed") return undefined;
  return result.completion.then((settled) =>
    settled.ok ? settled.value : undefined,
  );
}

export function emitOpenAiLpCostTrackingDiagnostic(
  input: Readonly<{
    attemptId?: string;
    workload: OpenAiLpCostWorkload;
    stage: "start" | "terminal";
    reason: "failed" | "timeout";
  }>,
  emit?: (event: OpenAiLpCostTrackingDiagnostic) => void,
) {
  const event: OpenAiLpCostTrackingDiagnostic = {
    attemptId: uuid(input.attemptId) ? input.attemptId! : null,
    workload: input.workload,
    stage: input.stage,
    reason: input.reason,
  };
  if (emit) {
    emit(event);
    return;
  }
  console.error("openai_lp_cost_tracking_degraded", event);
}

function uuid(value: unknown) {
  return typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}
