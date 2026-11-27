"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Editor, Extension } from "@tiptap/core";
import type { Node as EditorNode } from "@tiptap/pm/model";
import { Plugin } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import StarterKit from "@tiptap/starter-kit";

import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { communicationTextLinks, isHttpAddress } from "../../../../../lib/communication-base/text-links";
import {
  communicationTextDocument, MAX_LIST_DEPTH, MAX_ORDERED_LIST_START, MAX_TEXT_INDENT, serializeCommunicationText,
  type CommunicationTextDraft, type CommunicationTextFormatting,
} from "../../../../../lib/communication-base/text-formatting";
import styles from "../CommunicationBase.module.css";

const blocks = ["paragraph", "heading"];
const textKit = StarterKit.configure({
  blockquote: false,
  code: false,
  codeBlock: false,
  horizontalRule: false,
  heading: { levels: [2, 3] },
  link: false,
  strike: false,
  underline: false,
  trailingNode: false,
});

const ParagraphIndent = Extension.create({
  name: "paragraphIndent",
  addGlobalAttributes() {
    return [{
      types: blocks,
      attributes: {
        indent: {
          default: 0,
          parseHTML: element => Math.min(MAX_TEXT_INDENT, Math.max(0, Number.parseInt(element.dataset.indent ?? "", 10) || 0)),
          renderHTML: attributes => attributes.indent ? { "data-indent": attributes.indent } : {},
        },
      },
    }];
  },
});

function linksInBlock(block: EditorNode, start: number) {
  const links: { from: number; to: number; address: string }[] = [];
  let text = "";
  let chunkStart = start;
  function flush() {
    if (!text) return;
    for (const link of communicationTextLinks(text)) {
      links.push({ from: chunkStart + link.start, to: chunkStart + link.end, address: link.value });
    }
    text = "";
  }
  block.forEach((child, offset) => {
    if (child.isText) {
      text += child.text;
    } else {
      flush();
      chunkStart = start + offset + child.nodeSize;
    }
  });
  flush();
  return links;
}

function linkDecorations(doc: EditorNode, readOnly: boolean): DecorationSet {
  const decorations: Decoration[] = [];
  doc.descendants((node, pos) => {
    if (!node.isTextblock) return;
    for (const { from, to, address } of linksInBlock(node, pos + 1)) {
      decorations.push(Decoration.inline(from, to, readOnly
        ? { nodeName: "a", href: address, target: "_blank", rel: "noopener noreferrer", class: styles.textEditorLink }
        : { nodeName: "span", class: styles.textEditorLink }));
    }
    return false;
  });
  return DecorationSet.create(doc, decorations);
}

function preservePastedAddresses(html: string): string {
  const template = document.createElement("template");
  template.innerHTML = html;
  for (const link of template.content.querySelectorAll("a[href]")) {
    const address = link.getAttribute("href")?.trim();
    if (address && isHttpAddress(address) && !link.textContent?.includes(address)) {
      link.after(document.createTextNode(link.textContent?.trim() ? ` (${address})` : address));
    }
  }
  for (const list of template.content.querySelectorAll("ol[start]")) {
    const start = Number.parseInt(list.getAttribute("start") ?? "", 10);
    if (!Number.isSafeInteger(start) || start > MAX_ORDERED_LIST_START) list.removeAttribute("start");
  }
  return template.innerHTML;
}

function canIndentParagraph(editor: Editor, direction: number) {
  const { $from } = editor.state.selection;
  const indent = $from.parent.attrs.indent ?? 0;
  return blocks.includes($from.parent.type.name) && indent + direction >= 0 && indent + direction <= MAX_TEXT_INDENT;
}

function changeIndent(editor: Editor, direction: number) {
  if (editor.isActive("listItem")) {
    const chain = editor.chain().focus();
    return (direction > 0 ? chain.sinkListItem("listItem") : chain.liftListItem("listItem")).run();
  }
  return editor.chain().focus().command(({ tr, dispatch }) => {
    if (!dispatch) return canIndentParagraph(editor, direction);
    const { from, to } = tr.selection;
    tr.doc.nodesBetween(from, to, (node, pos) => {
      if (!blocks.includes(node.type.name)) return;
      const indent = Math.min(MAX_TEXT_INDENT, Math.max(0, (node.attrs.indent ?? 0) + direction));
      if (indent !== node.attrs.indent) tr.setNodeMarkup(pos, undefined, { ...node.attrs, indent });
      return false;
    });
    return true;
  }).run();
}

type Props = Readonly<{
  id?: string;
  label: string;
  describedBy?: string;
  invalid?: boolean;
  locked?: boolean;
  limit?: number;
  text: string;
  formatting?: CommunicationTextFormatting;
  onChange?: (draft: CommunicationTextDraft) => void;
}>;

const toolClass = "min-h-11 shrink-0 !px-2 !py-1 !text-xs !font-normal !text-foreground aria-pressed:bg-accent hover:!bg-accent";

export function CommunicationTextEditor({
  id, label, describedBy, invalid = false, locked = false, limit = 30_000, text, formatting, onChange,
}: Props) {
  const mount = useRef<HTMLDivElement>(null);
  const moreButton = useRef<HTMLButtonElement>(null);
  const [initial] = useState(() => communicationTextDocument(text, formatting));
  const [editor, setEditor] = useState<Editor | null>(null);
  const [, renderToolbar] = useState(0);
  const [more, setMore] = useState(false);
  const [limitReached, setLimitReached] = useState(false);
  const readOnly = onChange === undefined;

  useEffect(() => {
    if (!mount.current) return;
    const snapshots = new WeakMap<EditorNode, CommunicationTextDraft>();
    const snapshot = (doc: EditorNode) => {
      const cached = snapshots.get(doc);
      if (cached) return cached;
      const draft = serializeCommunicationText(doc.toJSON());
      snapshots.set(doc, draft);
      return draft;
    };

    const editorRules = Extension.create({
      name: "communicationTextRules",
      addProseMirrorPlugins() {
        return [new Plugin<DecorationSet>({
          state: {
            init: (_, state) => linkDecorations(state.doc, readOnly),
            apply: (transaction, old) => transaction.docChanged ? linkDecorations(transaction.doc, readOnly) : old,
          },
          props: {
            decorations(state) { return this.getState(state); },
          },
          filterTransaction(transaction, state) {
            if (!transaction.docChanged) return true;
            let depthAllowed = true;
            transaction.doc.descendants((node, pos) => {
              if (node.type.name === "listItem" && transaction.doc.resolve(pos).depth >= MAX_LIST_DEPTH * 2) {
                depthAllowed = false;
              }
              return depthAllowed;
            });
            if (!depthAllowed) return false;
            const previousLength = snapshot(state.doc).text.length;
            const length = snapshot(transaction.doc).text.length;
            const blocked = length > limit && length > previousLength;
            if (blocked) queueMicrotask(() => setLimitReached(true));
            return !blocked;
          },
        })];
      },
    });
    const instance = new Editor({
      element: mount.current,
      content: initial,
      extensions: [textKit, ParagraphIndent, editorRules],
      editable: !readOnly,
      enableInputRules: false,
      enablePasteRules: false,
      editorProps: {
        attributes: { class: styles.textEditorContent },
        handleDOMEvents: { keydown: (_view, event) => event.key === "Tab" },
        transformPastedHTML: preservePastedAddresses,
      },
      onCreate: ({ editor }) => setEditor(editor),
      onTransaction: () => {
        if (!readOnly) renderToolbar(revision => revision + 1);
      },
      onUpdate: ({ editor }) => {
        setLimitReached(false);
        onChange?.(snapshot(editor.state.doc));
      },
    });
    return () => instance.destroy();
  }, [initial, limit, onChange, readOnly]);

  useLayoutEffect(() => {
    if (!editor) return;
    editor.setEditable(!readOnly && !locked, false);
    const attributes = { class: styles.textEditorContent, ...(id ? { id } : {}) };
    editor.setOptions({ editorProps: {
      ...editor.options.editorProps,
      attributes: readOnly ? attributes : {
        ...attributes,
        role: "textbox",
        "aria-label": label,
        "aria-multiline": "true",
        "aria-readonly": String(locked),
        "aria-invalid": String(invalid),
        ...(describedBy ? { "aria-describedby": describedBy } : {}),
      },
    } });
  }, [describedBy, editor, id, invalid, label, locked, readOnly]);

  const selection = editor?.state.selection;
  const $from = selection?.$from;
  let list = "none";
  if ($from) {
    for (let depth = $from.depth; depth > 0; depth -= 1) {
      const name = $from.node(depth).type.name;
      if (name === "orderedList" || name === "bulletList") {
        list = name === "orderedList" ? "numbered" : "bullets";
        break;
      }
    }
  }
  const activeLink = $from?.parent.isTextblock
    ? linksInBlock($from.parent, $from.start()).find(({ from, to }) => $from.pos >= from && (selection?.to ?? 0) <= to)
    : undefined;
  const toolsDisabled = locked || !editor;
  const canIndent = (direction: number) => editor?.isActive("listItem")
    ? (direction > 0 ? editor.can().sinkListItem("listItem") : editor.can().liftListItem("listItem"))
    : Boolean(editor && canIndentParagraph(editor, direction));
  const keepSelection = (event: React.MouseEvent<HTMLButtonElement>) => event.preventDefault();

  return <div className={readOnly ? styles.textEditorReadOnly : styles.textEditor}
    onKeyDownCapture={event => {
      if (event.key !== "Escape" || !more) return;
      event.preventDefault();
      event.stopPropagation();
      setMore(false);
      moreButton.current?.focus();
    }}>
    {!readOnly && <div className="shrink-0 border-b border-border px-1.5" aria-label="Formatação do texto" role="group">
      <div className="flex flex-wrap items-center gap-x-1">
        <Button variant="secondary" className={toolClass} aria-pressed={editor?.isActive("heading", { level: 2 }) ?? false}
          disabled={toolsDisabled} onMouseDown={keepSelection} onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}>Título</Button>
        <Select aria-label="Lista" className="!h-11 !w-auto max-w-full shrink-0 !border-transparent !bg-transparent !px-1 !text-xs"
          value={list} disabled={toolsDisabled} onChange={event => {
            const value = event.target.value;
            const chain = editor?.chain().focus();
            if (!chain) return;
            if (value === "bullets" || (value === "none" && list === "bullets")) chain.toggleBulletList().run();
            if (value === "numbered" || (value === "none" && list === "numbered")) chain.toggleOrderedList().run();
          }}>
          <option value="none">{list === "none" ? "Lista" : "Sem lista"}</option>
          <option value="bullets">Com marcadores</option>
          <option value="numbered">Numerada</option>
        </Select>
        <Button variant="secondary" className={toolClass} aria-pressed={editor?.isActive("bold") ?? false}
          disabled={toolsDisabled} onMouseDown={keepSelection} onClick={() => editor?.chain().focus().toggleBold().run()}>Negrito</Button>
        <Button ref={moreButton} variant="secondary" className={toolClass} aria-expanded={more} aria-controls={`${id}-tools`}
          disabled={toolsDisabled} onMouseDown={keepSelection} onClick={() => setMore(open => !open)}>Mais</Button>
        {activeLink && <a href={activeLink.address} target="_blank" rel="noopener noreferrer"
          className="inline-flex min-h-11 max-w-full items-center rounded-md px-2 text-xs text-primary underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          onMouseDown={event => event.preventDefault()}>Abrir link em nova aba</a>}
      </div>
      <div id={`${id}-tools`} hidden={!more} className={more ? "flex flex-wrap items-center gap-x-1 border-t border-border" : undefined}>
        <Button variant="secondary" className={toolClass} aria-pressed={editor?.isActive("heading", { level: 3 }) ?? false}
          disabled={toolsDisabled} onMouseDown={keepSelection} onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}>Subtítulo</Button>
        <Button variant="secondary" className={toolClass} aria-pressed={editor?.isActive("italic") ?? false}
          disabled={toolsDisabled} onMouseDown={keepSelection} onClick={() => editor?.chain().focus().toggleItalic().run()}>Itálico</Button>
        <Button variant="secondary" className={toolClass} disabled={toolsDisabled || !canIndent(1)}
          onMouseDown={keepSelection} onClick={() => editor && changeIndent(editor, 1)}>Aumentar recuo</Button>
        <Button variant="secondary" className={toolClass} disabled={toolsDisabled || !canIndent(-1)}
          onMouseDown={keepSelection} onClick={() => editor && changeIndent(editor, -1)}>Diminuir recuo</Button>
        <Button variant="secondary" className={toolClass} disabled={toolsDisabled || !editor?.can().undo()}
          onMouseDown={keepSelection} onClick={() => editor?.chain().focus().undo().run()}>Desfazer</Button>
        <Button variant="secondary" className={toolClass} disabled={toolsDisabled || !editor?.can().redo()}
          onMouseDown={keepSelection} onClick={() => editor?.chain().focus().redo().run()}>Refazer</Button>
      </div>
    </div>}
    <div ref={mount} className={styles.textEditorMount} />
    {limitReached && <span className="sr-only" role="status">Limite de {limit.toLocaleString("pt-BR")} caracteres atingido.</span>}
  </div>;
}
