import type { CommunicationSectionValue } from "./contracts";
import type { CommunicationSectionFormat } from "./registry";
import { formatEditorValue, parseEditorValue } from "./editor-value";

// Manual fields round-trip structured values. The legacy AI/editor transport stays unchanged.
export function formatManualEditorValue(value: CommunicationSectionValue, format: CommunicationSectionFormat): string {
  return format === "text" ? formatEditorValue(value, format) : JSON.stringify(value);
}

export function parseManualEditorValue(format: CommunicationSectionFormat, raw: string): unknown {
  if (format === "text") return raw;
  try { return JSON.parse(raw || "[]"); } catch { return null; }
}

export function editorDraftValue(value: CommunicationSectionValue, format: CommunicationSectionFormat, structured: boolean): string {
  return structured ? formatManualEditorValue(value, format) : formatEditorValue(value, format);
}

export function parseEditorDraft(format: CommunicationSectionFormat, raw: string, structured: boolean): unknown {
  return structured ? parseManualEditorValue(format, raw) : parseEditorValue(format, raw);
}
