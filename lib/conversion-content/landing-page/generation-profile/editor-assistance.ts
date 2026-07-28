import type {
  GenerationProfileEditorContent,
  GenerationProfileProposalCorrelation,
  GenerationProfileProposalResult,
} from "./admin-contracts";

export function hasGenerationProfileEditorContent(
  editor: GenerationProfileEditorContent,
): boolean {
  return Boolean(
    editor.generationGuidance.trim() || editor.recommendations.length > 0,
  );
}

export function applyGenerationProfileProposalToEditor(input: {
  currentEditor: GenerationProfileEditorContent;
  currentDirty: boolean;
  currentProposal: GenerationProfileProposalCorrelation | null;
  result: GenerationProfileProposalResult;
}) {
  if (!input.result.ok) {
    return {
      applied: false as const,
      editor: input.currentEditor,
      dirty: input.currentDirty,
      proposal: input.currentProposal,
    };
  }
  return {
    applied: true as const,
    editor: {
      generationGuidance: input.result.value.generationGuidance,
      recommendations: input.result.value.recommendations,
    },
    dirty: true,
    proposal: {
      requestId: input.result.value.requestId,
      fingerprint: input.result.value.fingerprint,
    },
  };
}
