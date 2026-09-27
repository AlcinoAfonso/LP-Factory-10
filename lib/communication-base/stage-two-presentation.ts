import type { CommunicationSectionValue } from "./contracts";
import type { WebSource } from "./ai-core";

export type LocalStageTwoResult = Readonly<{
  generalRevision: number;
  value: CommunicationSectionValue | null;
  sources: readonly WebSource[];
}>;

export function selectStageTwoSectionPresentation(
  local: LocalStageTwoResult | null,
  generalRevision: number,
  generalValue: CommunicationSectionValue | undefined,
) {
  if (local?.generalRevision === generalRevision) {
    return { value: local.value, sources: local.sources };
  }
  return { value: generalValue ?? null, sources: [] };
}
