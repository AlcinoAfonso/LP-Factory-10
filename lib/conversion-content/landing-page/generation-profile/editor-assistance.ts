import type {
  GenerationProfileEditorContent,
  GenerationProfileProposal,
  GenerationProfileProposalCorrelation,
  GenerationProfileProposalDiff,
  GenerationProfileProposalResult,
  GenerationProfileRecommendationDiff,
  GenerationProfileRecommendationInput,
  GenerationProfileStructuralRecommendation,
  GenerationProfileGap,
} from "./admin-contracts";

export function hasGenerationProfileEditorContent(editor: GenerationProfileEditorContent): boolean {
  return Boolean(editor.generationGuidance.trim() || editor.recommendations.length > 0);
}

export function receiveGenerationProfileProposal(input: {
  currentEditor: GenerationProfileEditorContent;
  currentDirty: boolean;
  currentCandidate: GenerationProfileProposal | null;
  result: GenerationProfileProposalResult;
}) {
  if (!input.result.ok) {
    return {
      received: false as const,
      editor: input.currentEditor,
      dirty: input.currentDirty,
      candidate: input.currentCandidate,
    };
  }
  return {
    received: true as const,
    editor: input.currentEditor,
    dirty: input.currentDirty,
    candidate: input.result.value,
  };
}

export function applyGenerationProfileCandidate(input: {
  currentEditor: GenerationProfileEditorContent;
  candidate: GenerationProfileProposal;
}) {
  const guidanceByModule = new Map(
    input.currentEditor.recommendations
      .filter((item) => item.itemGuidance !== undefined)
      .map((item) => [item.moduleKey, item.itemGuidance] as const),
  );
  const recommendations: GenerationProfileRecommendationInput[] = input.candidate.recommendations.map((item) => ({
    ...item,
    ...(guidanceByModule.has(item.moduleKey) ? { itemGuidance: guidanceByModule.get(item.moduleKey) } : {}),
  }));
  return {
    editor: {
      generationGuidance: input.currentEditor.generationGuidance,
      recommendations,
    },
    dirty: true as const,
    proposal: {
      requestId: input.candidate.requestId,
      fingerprint: input.candidate.fingerprint,
    } satisfies GenerationProfileProposalCorrelation,
  };
}

export function diffGenerationProfileRecommendations(input: {
  editor: GenerationProfileEditorContent;
  recommendations: readonly GenerationProfileStructuralRecommendation[];
}): readonly GenerationProfileRecommendationDiff[] {
  const current = new Map(input.editor.recommendations.map((item) => [item.moduleKey, stripGuidance(item)]));
  const proposed = new Map(input.recommendations.map((item) => [item.moduleKey, item]));
  const keys = [...new Set([...current.keys(), ...proposed.keys()])].sort();
  return keys.map((moduleKey) => {
    const before = current.get(moduleKey);
    const after = proposed.get(moduleKey);
    if (!before) return { moduleKey, status: "added" as const, changes: [] };
    if (!after) return { moduleKey, status: "removed" as const, changes: [] };
    const changes: ("module_version" | "variant" | "priority" | "order")[] = [];
    if (before.moduleVersion !== after.moduleVersion) changes.push("module_version");
    if (before.variantKey !== after.variantKey || before.variantVersion !== after.variantVersion) changes.push("variant");
    if (before.priority !== after.priority) changes.push("priority");
    if (before.recommendedOrder !== after.recommendedOrder) changes.push("order");
    return {
      moduleKey,
      status: changes.length === 0 ? "kept" as const : "changed" as const,
      changes,
    };
  });
}

export function findGenerationProfileReplacements(input: {
  editor: GenerationProfileEditorContent;
  recommendations: readonly GenerationProfileStructuralRecommendation[];
}) {
  const currentModuleKeys = new Set(input.editor.recommendations.map((item) => item.moduleKey));
  const candidateModuleKeys = new Set(input.recommendations.map((item) => item.moduleKey));
  const removedByOrder = new Map(
    input.editor.recommendations
      .filter((item) => !candidateModuleKeys.has(item.moduleKey))
      .map((item) => [item.recommendedOrder, item.moduleKey]),
  );
  return input.recommendations.filter((item) => !currentModuleKeys.has(item.moduleKey)).flatMap((item) => {
    const previousModuleKey = removedByOrder.get(item.recommendedOrder);
    return previousModuleKey
      ? [{ fromModuleKey: previousModuleKey, toModuleKey: item.moduleKey, recommendedOrder: item.recommendedOrder }]
      : [];
  });
}

export function diffGenerationProfileGaps(input: {
  previousCandidate: GenerationProfileProposal | null;
  gaps: readonly GenerationProfileGap[];
}) {
  const previous = new Map((input.previousCandidate?.gaps ?? []).map((gap) => [`${gap.audienceScope}:${gap.itemKey}`, gap]));
  const current = new Map(input.gaps.map((gap) => [`${gap.audienceScope}:${gap.itemKey}`, gap]));
  return {
    added: [...current.entries()].filter(([key]) => !previous.has(key)).map(([, gap]) => gap),
    resolved: [...previous.entries()].filter(([key]) => !current.has(key)).map(([, gap]) => gap),
  } as const;
}

export function deriveGenerationProfileProposalDiff(input: {
  editor: GenerationProfileEditorContent;
  previousCandidate: GenerationProfileProposal | null;
  recommendations: readonly GenerationProfileStructuralRecommendation[];
  gaps: readonly GenerationProfileGap[];
}): GenerationProfileProposalDiff {
  return {
    recommendations: diffGenerationProfileRecommendations({ editor: input.editor, recommendations: input.recommendations }),
    replacements: findGenerationProfileReplacements({ editor: input.editor, recommendations: input.recommendations }),
    gaps: diffGenerationProfileGaps({ previousCandidate: input.previousCandidate, gaps: input.gaps }),
  };
}

function stripGuidance(item: GenerationProfileRecommendationInput) {
  const { itemGuidance: _itemGuidance, ...structural } = item;
  return structural;
}
