import type { PendingSetupCompletionMode } from "../../../lib/onboarding/pending-setup/contracts";

export type PendingSetupCompletionState =
  | { status: "known"; mode: PendingSetupCompletionMode | null }
  | { status: "unknown"; mode: null };

export async function loadPendingSetupCompletionState(
  readCompletion: () => Promise<PendingSetupCompletionMode | null>,
): Promise<PendingSetupCompletionState> {
  try {
    return { status: "known", mode: await readCompletion() };
  } catch {
    return { status: "unknown", mode: null };
  }
}

export function canShowHistoricalNicheResolution(
  completion: PendingSetupCompletionState,
  hasActionableNicheResolution: boolean,
): boolean {
  return completion.status === "known" && hasActionableNicheResolution;
}
