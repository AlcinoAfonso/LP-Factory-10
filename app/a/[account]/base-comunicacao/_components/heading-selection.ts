import { createChainableState, isNodeActive } from "@tiptap/core";
import type { ResolvedPos } from "@tiptap/pm/model";
import { Selection, TextSelection, type EditorState, type Transaction } from "@tiptap/pm/state";
import { canSplit } from "@tiptap/pm/transform";

function lineBoundary(position: ResolvedPos, side: "before" | "after"): number | undefined {
  let boundary: number | undefined;
  position.parent.forEach((node, offset) => {
    if (node.type.name !== "hardBreak") return;
    if (side === "before" ? offset < position.parentOffset : boundary === undefined && offset >= position.parentOffset) {
      boundary = position.start() + offset;
    }
  });
  return boundary;
}

export function isolateHeadingSelection(tr: Transaction): void {
  const { selection } = tr;
  if (!(selection instanceof TextSelection)) return;

  let { from, to } = selection;
  if (!selection.empty) {
    const { $from, $to } = selection;

    // Dragging from one line to another can include a boundary without selecting text on both sides.
    if ($from.parentOffset > 0 && $from.parentOffset === $from.parent.content.size) {
      const next = Selection.findFrom(tr.doc.resolve($from.after()), 1, true);
      if (next && next.from < to) from = next.from;
    }
    if ($to.parentOffset === 0 && $to.parent.content.size > 0) {
      const previous = Selection.findFrom(tr.doc.resolve($to.before()), -1, true);
      if (previous && previous.to > from) to = previous.to;
    }
    if (from + 1 < to && tr.doc.resolve(from).nodeAfter?.type.name === "hardBreak") from++;
    if (to - 1 > from && tr.doc.resolve(to).nodeBefore?.type.name === "hardBreak") to--;
  }

  const before = lineBoundary(tr.doc.resolve(from), "before");
  const after = lineBoundary(tr.doc.resolve(to), "after");
  const startMapping = tr.mapping.maps.length;

  // A soft line break still belongs to the same block. Split only at the selected lines' edges.
  for (const boundary of [after, before]) {
    if (boundary !== undefined && canSplit(tr.doc, boundary)) {
      tr.delete(boundary, boundary + 1).split(boundary);
    }
  }

  if (tr.mapping.maps.length === startMapping && from === selection.from && to === selection.to) return;
  const mapping = tr.mapping.slice(startMapping);
  const start = mapping.map(from, selection.empty && from === after ? -1 : 1);
  const end = selection.empty ? start : mapping.map(to, -1);
  const backwards = selection.anchor > selection.head;
  tr.setSelection(TextSelection.create(tr.doc, backwards ? end : start, backwards ? start : end));
}

export function selectedHeadingLevel(state: EditorState): 2 | 3 | null {
  const transaction = state.tr;
  isolateHeadingSelection(transaction);
  const isolated = transaction.selectionSet ? createChainableState({ state, transaction }) : state;
  if (isNodeActive(isolated, "heading", { level: 2 })) return 2;
  return isNodeActive(isolated, "heading", { level: 3 }) ? 3 : null;
}
