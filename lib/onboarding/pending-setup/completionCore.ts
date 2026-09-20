import type { PendingSetupCompletionMode } from "./contracts";

export function resolveCompletedAccountPresentation(input: {
  completionMode: PendingSetupCompletionMode | null;
  hasActionableNicheResolution: boolean;
  hasPrimaryTaxon: boolean;
  personalizedBundleReady: boolean;
}): {
  commercialMode: "generic" | "personalized";
  showHistoricalNicheResolution: boolean;
} {
  return {
    commercialMode:
      input.hasPrimaryTaxon && input.personalizedBundleReady ? "personalized" : "generic",
    showHistoricalNicheResolution:
      input.completionMode === null && input.hasActionableNicheResolution,
  };
}
