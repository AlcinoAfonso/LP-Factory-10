import type { JSONContent } from "@tiptap/core";
import { z } from "zod";

import { getCommunicationSection, isBusinessLongTextSection, type CommunicationSectionDefinition } from "./registry";

export const MAX_TEXT_INDENT = 6;
export const MAX_LIST_DEPTH = 8;
export const MAX_ORDERED_LIST_START = Number.MAX_SAFE_INTEGER - 30_000;

const offset = z.number().int().nonnegative();
const inlineStyle = z.enum(["bold", "italic", "boldItalic"]);
const spanSchema = z.tuple([offset, offset, inlineStyle.optional()]);
const listStart = z.number().int().min(Number.MIN_SAFE_INTEGER).max(MAX_ORDERED_LIST_START);
const textBlockSchema = z.strictObject({
  kind: z.enum(["paragraph", "title", "subtitle"]),
  indent: offset.max(MAX_TEXT_INDENT).optional(),
  spans: z.array(z.union([spanSchema, offset])),
});
const listSchema = z.strictObject({
  kind: z.enum(["bullets", "numbered"]),
  start: listStart.optional(),
  items: z.array(z.array(z.unknown()).min(1)).min(1),
});

type InlineStyle = z.infer<typeof inlineStyle>;
type TextBlock = z.infer<typeof textBlockSchema>;
type ListBlock = Omit<z.infer<typeof listSchema>, "items"> & { items: Block[][] };
type Block = TextBlock | ListBlock;

export type CommunicationTextFormatting = Readonly<{ version: 1; blocks: Block[] }>;
export type CommunicationTextDraft = Readonly<{ text: string; formatting?: CommunicationTextFormatting }>;

export function supportsCommunicationTextFormatting(section: CommunicationSectionDefinition): boolean {
  return isBusinessLongTextSection(section) ||
    (section.stage === 2 && getCommunicationSection(section.key)?.stage === 2);
}

export function plainTextDocument(text: string): JSONContent {
  return {
    type: "doc",
    content: text.replace(/\r\n?/g, "\n").split("\n").map(line => ({
      type: "paragraph",
      ...(line ? { content: [{ type: "text", text: line }] } : {}),
    })),
  };
}

function styleOf(node: JSONContent): InlineStyle | undefined {
  const bold = node.marks?.some(mark => mark.type === "bold");
  const italic = node.marks?.some(mark => mark.type === "italic");
  return bold && italic ? "boldItalic" : bold ? "bold" : italic ? "italic" : undefined;
}

// All written words live in value. The layout only points into that string.
export function serializeCommunicationText(document: JSONContent): CommunicationTextDraft {
  return serializeDocument(document, false);
}

function serializeDocument(document: JSONContent, showListStructure: boolean): CommunicationTextDraft {
  let text = "";
  let hasFormatting = false;
  let hasWrittenText = false;
  let lineStarted = false;
  const appendLine = (prefix: string) => {
    if (lineStarted) text += "\n";
    lineStarted = true;
    if (showListStructure) text += prefix;
  };

  function serializeBlocks(nodes: JSONContent[], depth = 0, itemPrefix?: string): Block[] {
    return nodes.map((node, index) => {
      if (node.type === "bulletList" || node.type === "orderedList") {
        hasFormatting = true;
        const numbered = node.type === "orderedList";
        const start = numbered ? node.attrs?.start ?? 1 : 1;
        return {
          kind: numbered ? "numbered" : "bullets",
          ...(start !== 1 ? { start } : {}),
          items: (node.content ?? []).map((item, itemIndex) =>
            serializeBlocks(item.content ?? [], depth + 1, numbered ? `${start + itemIndex}. ` : "• ")),
        };
      }
      const kind = node.type === "heading" ? (node.attrs?.level === 2 ? "title" : "subtitle") : "paragraph";
      const indent = node.attrs?.indent ?? 0;
      const prefix = index === 0 ? itemPrefix : undefined;
      appendLine("   ".repeat(Math.max(0, depth - Number(Boolean(prefix)))) + (prefix ?? "") + "   ".repeat(indent));
      if (kind !== "paragraph" || indent) hasFormatting = true;
      const spans: TextBlock["spans"] = [];
      for (const child of node.content ?? []) {
        const from = text.length;
        if (child.type === "hardBreak") {
          text += "\n";
          spans.push(from);
          hasFormatting = true;
          continue;
        }
        const content = child.text ?? "";
        if (!content) continue;
        const style = styleOf(child);
        text += content;
        if (content.trim()) hasWrittenText = true;
        if (style) hasFormatting = true;
        spans.push(style ? [from, text.length, style] : [from, text.length]);
      }
      return { kind, ...(indent ? { indent } : {}), spans };
    });
  }

  const blocks = serializeBlocks(document.content ?? []);
  if (!hasFormatting) return { text };
  if (!hasWrittenText) return { text: "" };

  // The existing save policy trims the section as a whole.
  const start = text.length - text.trimStart().length;
  const end = text.trimEnd().length;
  function trimOffsets(items: Block[]) {
    for (const block of items) {
      if ("items" in block) {
        block.items.forEach(trimOffsets);
      } else {
        block.spans = block.spans.flatMap((span): TextBlock["spans"] => {
          if (typeof span === "number") return span >= start && span < end ? [span - start] : [];
          const from = Math.max(span[0], start);
          const to = Math.min(span[1], end);
          return from < to ? [span[2] ? [from - start, to - start, span[2]] : [from - start, to - start]] : [];
        });
      }
    }
  }
  trimOffsets(blocks);
  return { text, formatting: { version: 1, blocks } };
}

export function communicationTextDocument(value: string, formatting?: CommunicationTextFormatting): JSONContent {
  if (!formatting) return plainTextDocument(value);

  function toNodes(blocks: Block[]): JSONContent[] {
    return blocks.map(block => {
      if ("items" in block) {
        return {
          type: block.kind === "bullets" ? "bulletList" : "orderedList",
          ...(block.start === undefined ? {} : { attrs: { start: block.start } }),
          content: block.items.map(item => ({ type: "listItem", content: toNodes(item) })),
        };
      }
      const level = block.kind === "title" ? 2 : block.kind === "subtitle" ? 3 : undefined;
      return {
        type: level ? "heading" : "paragraph",
        attrs: { ...(level ? { level } : {}), ...(block.indent ? { indent: block.indent } : {}) },
        content: block.spans.map(span => {
          if (typeof span === "number") return { type: "hardBreak" };
          const [start, end, style] = span;
          const marks = [];
          if (style === "bold" || style === "boldItalic") marks.push({ type: "bold" });
          if (style === "italic" || style === "boldItalic") marks.push({ type: "italic" });
          return { type: "text", text: value.slice(start, end), ...(marks.length ? { marks } : {}) };
        }),
      };
    });
  }

  return { type: "doc", content: toNodes(formatting.blocks) };
}

export function communicationTextForReading(value: string, formatting: CommunicationTextFormatting | undefined, limit: number): string {
  if (!formatting) return value;
  const structured = serializeDocument(communicationTextDocument(value, formatting), true).text.trim();
  // Keep all written text when adding list labels or indentation would exceed an existing input limit.
  return structured.length <= limit ? structured : value;
}

function readBlocks(input: unknown[], depth: number, budget: { remaining: number }): Block[] | null {
  if (depth > MAX_LIST_DEPTH || (budget.remaining -= input.length) < 0) return null;
  const blocks: Block[] = [];
  for (const item of input) {
    const text = textBlockSchema.safeParse(item);
    if (text.success) {
      if ((budget.remaining -= text.data.spans.length) < 0) return null;
      blocks.push(text.data);
      continue;
    }
    const list = listSchema.safeParse(item);
    if (!list.success || (list.data.kind === "bullets" && list.data.start !== undefined) ||
        list.data.items.length > budget.remaining) return null;
    const items: Block[][] = [];
    for (const children of list.data.items) {
      const child = readBlocks(children, depth + 1, budget);
      if (!child || child[0]?.kind !== "paragraph") return null;
      items.push(child);
    }
    blocks.push({ ...list.data, items });
  }
  return blocks;
}

export function parseCommunicationTextFormatting(value: string, input: unknown): CommunicationTextFormatting | null {
  if (!value || typeof input !== "object" || input === null ||
      !("version" in input) || input.version !== 1 || !("blocks" in input) || !Array.isArray(input.blocks)) return null;
  const blocks = readBlocks(input.blocks, 0, { remaining: 60_064 });
  if (!blocks?.length) return null;

  let lastOffset = 0;
  function validOffsets(items: Block[]): boolean {
    return items.every(block => "items" in block ? block.items.every(validOffsets) : block.spans.every(span => {
      const [from, to] = typeof span === "number" ? [span, span + 1] : span;
      if (from < lastOffset || to <= from || to > value.length ||
          (typeof span === "number" ? value[from] !== "\n" : value.slice(from, to).includes("\n"))) return false;
      lastOffset = to;
      return true;
    }));
  }
  if (!validOffsets(blocks)) return null;
  const canonical = serializeCommunicationText(communicationTextDocument(value, { version: 1, blocks }));
  return canonical.text.trim() === value ? canonical.formatting ?? null : null;
}
