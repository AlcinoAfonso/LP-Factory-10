import {
  communicationSections,
  getCommunicationSection,
  type CommunicationSectionDefinition,
} from "./registry";
import type {
  CommunicationBase,
  CommunicationFaq,
  CommunicationSection,
  CommunicationSectionValue,
} from "./contracts";

export const COMMUNICATION_TEXT_MAX = 4000;
export const COMMUNICATION_ITEMS_MAX = 20;
export const COMMUNICATION_ITEM_MAX = 400;
export const COMMUNICATION_FAQ_MAX = 15;

export function parseSectionValue(
  section: CommunicationSectionDefinition,
  raw: unknown,
): CommunicationSectionValue | null {
  if (section.format === "text") {
    if (typeof raw !== "string") return null;
    const value = raw.trim();
    return value.length <= COMMUNICATION_TEXT_MAX ? value : null;
  }
  if (section.format === "items") {
    if (!Array.isArray(raw) || raw.length > COMMUNICATION_ITEMS_MAX) return null;
    const items: string[] = [];
    for (const item of raw) {
      if (typeof item !== "string") return null;
      const text = item.trim();
      if (text.length > COMMUNICATION_ITEM_MAX) return null;
      if (text) items.push(text);
    }
    return items;
  }
  if (!Array.isArray(raw) || raw.length > COMMUNICATION_FAQ_MAX) return null;
  const entries: CommunicationFaq[] = [];
  for (const item of raw) {
    if (!isRecord(item) || typeof item.question !== "string" || typeof item.answer !== "string") {
      return null;
    }
    const question = item.question.trim();
    const answer = item.answer.trim();
    if (question.length > COMMUNICATION_ITEM_MAX || answer.length > COMMUNICATION_TEXT_MAX) {
      return null;
    }
    if (question && answer) entries.push({ question, answer });
    else if (question || answer) return null;
  }
  return entries;
}

export function parseStoredSections(raw: unknown): Record<string, unknown> | null {
  if (!isRecord(raw)) return null;
  for (const [key, stored] of Object.entries(raw)) {
    const definition = getCommunicationSection(key);
    if (!definition) continue;
    if (!isRecord(stored) || stored.format !== definition.format ||
      (definition.stage === 1
        ? stored.origin !== "user_confirmed" &&
          (stored.origin !== "pending_setup_confirmed" || key !== "business_context")
        : stored.origin !== "user_reviewed") ||
      parseSectionValue(definition, stored.value) === null) {
      return null;
    }
  }
  return raw;
}

export function projectCommunicationBase(input: Readonly<{
  account_id: unknown;
  version: unknown;
  sections_json: unknown;
  created_at: unknown;
  updated_at: unknown;
}>): CommunicationBase | null {
  const sectionsJson = parseStoredSections(input.sections_json);
  if (typeof input.account_id !== "string" ||
      typeof input.version !== "number" ||
      !Number.isInteger(input.version) || input.version <= 0 ||
      typeof input.created_at !== "string" ||
      typeof input.updated_at !== "string" ||
      !sectionsJson) return null;
  const sections: Partial<Record<(typeof communicationSections)[number]["key"], CommunicationSection>> = {};
  for (const definition of communicationSections) {
    const entry = sectionsJson[definition.key];
    if (entry !== undefined) sections[definition.key] = entry as CommunicationSection;
  }
  return {
    accountId: input.account_id,
    version: input.version,
    sections,
    createdAt: input.created_at,
    updatedAt: input.updated_at,
  };
}

export function withSection(
  current: Record<string, unknown>,
  key: string,
  value: CommunicationSectionValue,
  origin: CommunicationSection["origin"],
): Record<string, unknown> | null {
  const definition = getCommunicationSection(key);
  if (!definition) return null;
  const normalized = parseSectionValue(definition, value);
  if (normalized === null) return null;
  if (definition.stage === 1 && origin === "user_reviewed") return null;
  if (definition.stage === 2 && origin !== "user_reviewed") return null;
  if (origin === "pending_setup_confirmed" && key !== "business_context") return null;
  return {
    ...current,
    [key]: { format: definition.format, value: normalized, origin },
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
