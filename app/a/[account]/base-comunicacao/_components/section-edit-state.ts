import type { CommunicationSection, CommunicationSectionValue } from "../../../../../lib/communication-base/contracts";
import type { CommunicationSectionDefinition } from "../../../../../lib/communication-base/registry";
import { editorDraftValue, parseEditorDraft } from "../../../../../lib/communication-base/manual-editor-value";
import { parseCommunicationFacts, parseReviewedSectionValue, parseSectionValue } from "../../../../../lib/communication-base/policy";

export function sectionEditState(definition: CommunicationSectionDefinition, current: CommunicationSection | undefined, draft: string, structured = false, factsDraft?: string) {
  const freeText = definition.stage === 2;
  const parseManual = freeText ? parseReviewedSectionValue : parseSectionValue;
  const persistedText = current ? editorDraftValue(current.value, definition.format, structured, freeText) : "";
  const parsed = parseManual(definition, parseEditorDraft(definition.format, draft, structured, freeText));
  const persisted = parseManual(definition, parseEditorDraft(definition.format, persistedText, structured, freeText));
  let facts: unknown = current?.facts ?? [];
  if (factsDraft !== undefined) { try { facts = JSON.parse(factsDraft); } catch { facts = null; } }
  const normalizedFacts = parseCommunicationFacts(facts);
  const factsDirty = normalizedFacts === null ? factsDraft !== JSON.stringify(current?.facts ?? []) : JSON.stringify(normalizedFacts) !== JSON.stringify(current?.facts ?? []);
  // Legacy separators can put the display above the text ceiling; never truncate on open.
  const untouchedLegacy = freeText && current && draft === persistedText && parseReviewedSectionValue(definition, current.value) !== null;
  return { valid: (parsed !== null || Boolean(untouchedLegacy)) && normalizedFacts !== null,
    dirty: factsDirty || (!untouchedLegacy && (parsed === null ? draft !== persistedText : JSON.stringify(parsed) !== JSON.stringify(persisted))) };
}

export function hasSectionContent(value: CommunicationSectionValue | undefined): boolean {
  return typeof value === "string" ? Boolean(value.trim()) : Boolean(value?.length);
}
