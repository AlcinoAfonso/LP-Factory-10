import type {
  GenerationProfileEditorContent,
  GenerationProfileProposal,
  GenerationProfileProposalCorrelation,
  GenerationProfileProposalResult,
  GenerationProfileRecommendationInput,
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

export type GenerationProfileRecommendationDiff = Readonly<{
  moduleKey: string;
  status: "kept" | "added" | "changed" | "removed";
  changes: readonly ("module_version" | "variant" | "priority" | "order")[];
}>;

export function diffGenerationProfileRecommendations(input: {
  editor: GenerationProfileEditorContent;
  candidate: GenerationProfileProposal;
}): readonly GenerationProfileRecommendationDiff[] {
  const current = new Map(input.editor.recommendations.map((item) => [item.moduleKey, stripGuidance(item)]));
  const proposed = new Map(input.candidate.recommendations.map((item) => [item.moduleKey, item]));
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
  candidate: GenerationProfileProposal;
}) {
  const currentByOrder = new Map(input.editor.recommendations.map((item) => [item.recommendedOrder, item.moduleKey]));
  return input.candidate.recommendations.flatMap((item) => {
    const previousModuleKey = currentByOrder.get(item.recommendedOrder);
    return previousModuleKey && previousModuleKey !== item.moduleKey
      ? [{ fromModuleKey: previousModuleKey, toModuleKey: item.moduleKey, recommendedOrder: item.recommendedOrder }]
      : [];
  });
}

export function diffGenerationProfileGaps(input: {
  previousCandidate: GenerationProfileProposal | null;
  candidate: GenerationProfileProposal;
}) {
  const previous = new Map((input.previousCandidate?.gaps ?? []).map((gap) => [`${gap.audienceScope}:${gap.itemKey}`, gap]));
  const current = new Map(input.candidate.gaps.map((gap) => [`${gap.audienceScope}:${gap.itemKey}`, gap]));
  return {
    added: [...current.entries()].filter(([key]) => !previous.has(key)).map(([, gap]) => gap),
    resolved: [...previous.entries()].filter(([key]) => !current.has(key)).map(([, gap]) => gap),
  } as const;
}

function stripGuidance(item: GenerationProfileRecommendationInput) {
  const { itemGuidance: _itemGuidance, ...structural } = item;
  return structural;
}
