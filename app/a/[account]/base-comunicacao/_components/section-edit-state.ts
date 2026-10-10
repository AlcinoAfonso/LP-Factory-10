import type { CommunicationSection, CommunicationSectionValue } from "../../../../../lib/communication-base/contracts";
import type { CommunicationSectionDefinition } from "../../../../../lib/communication-base/registry";
import { editorDraftValue, parseEditorDraft } from "../../../../../lib/communication-base/manual-editor-value";
import { parseCommunicationFacts, parseSectionValue } from "../../../../../lib/communication-base/policy";

export function sectionEditState(definition: CommunicationSectionDefinition, current: CommunicationSection | undefined, draft: string, structured = false, factsDraft?: string) {
  const persistedText = current ? editorDraftValue(current.value, definition.format, structured) : "";
  const parsed = parseSectionValue(definition, parseEditorDraft(definition.format, draft, structured));
  const persisted = parseSectionValue(definition, parseEditorDraft(definition.format, persistedText, structured));
  let facts: unknown = current?.facts ?? [];
  if (factsDraft !== undefined) { try { facts = JSON.parse(factsDraft); } catch { facts = null; } }
  const normalizedFacts = parseCommunicationFacts(facts);
  const factsDirty = normalizedFacts === null ? factsDraft !== JSON.stringify(current?.facts ?? []) : JSON.stringify(normalizedFacts) !== JSON.stringify(current?.facts ?? []);
  return { valid: parsed !== null && normalizedFacts !== null,
    dirty: factsDirty || (parsed === null ? draft !== persistedText : JSON.stringify(parsed) !== JSON.stringify(persisted)) };
}

export function hasSectionContent(value: CommunicationSectionValue | undefined): boolean {
  return typeof value === "string" ? Boolean(value.trim()) : Boolean(value?.length);
}
