import type { CommunicationSection, CommunicationSectionValue } from "../../../../../lib/communication-base/contracts";
import type { CommunicationSectionDefinition } from "../../../../../lib/communication-base/registry";
import { formatEditorValue, parseEditorValue } from "../../../../../lib/communication-base/editor-value";
import { parseSectionValue } from "../../../../../lib/communication-base/policy";

export function sectionEditState(definition: CommunicationSectionDefinition, current: CommunicationSection | undefined, draft: string) {
  const persistedText = current ? formatEditorValue(current.value, definition.format) : "";
  const parsed = parseSectionValue(definition, parseEditorValue(definition.format, draft));
  const persisted = parseSectionValue(definition, parseEditorValue(definition.format, persistedText));
  return { valid: parsed !== null,
    dirty: parsed === null ? draft !== persistedText : JSON.stringify(parsed) !== JSON.stringify(persisted) };
}

export function hasSectionContent(value: CommunicationSectionValue | undefined): boolean {
  return typeof value === "string" ? Boolean(value.trim()) : Boolean(value?.length);
}
