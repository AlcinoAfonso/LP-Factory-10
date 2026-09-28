import type { CommunicationSuggestion, WebSource } from "./ai-core";

export type LocalStageTwoResult = Readonly<{
  generalRevision: number;
  suggestion: CommunicationSuggestion | null;
  sources: readonly WebSource[];
}>;

export function selectStageTwoSectionPresentation(
  local: LocalStageTwoResult | null,
  generalRevision: number,
  generalSuggestion: CommunicationSuggestion | undefined,
) {
  if (local?.generalRevision === generalRevision) {
    return { suggestion: local.suggestion, sources: local.sources };
  }
  return { suggestion: generalSuggestion ?? null, sources: [] };
}

export function stageTwoBasisLabel(basis: CommunicationSuggestion["basis"]): string {
  return basis === "strategic_hypothesis"
    ? "Hipótese estratégica — não é fato confirmado da empresa."
    : "Baseado nos dados confirmados da Etapa 1; revise antes de usar.";
}
