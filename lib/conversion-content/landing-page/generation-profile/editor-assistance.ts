import type {
  GenerationProfileEditorContent,
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
  result: GenerationProfileProposalResult;
}) {
  if (!input.result.ok) {
    return {
      applied: false as const,
      editor: input.currentEditor,
      dirty: input.currentDirty,
    };
  }
  return {
    applied: true as const,
    editor: {
      generationGuidance: input.result.value.generationGuidance,
      recommendations: input.result.value.recommendations,
    },
    dirty: true,
  };
}
