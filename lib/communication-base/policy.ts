import { parseCommunicationMaterials } from "./materials";
import {
  communicationSections,
  type CommunicationSectionDefinition,
} from "./registry";
import type {
  CommunicationBase,
  CommunicationFaq,
  CommunicationFact,
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
  if (section.format === "material_items") return parseCommunicationMaterials(raw);
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

export function parseStoredSections(raw: unknown, definitions: readonly CommunicationSectionDefinition[] = communicationSections): Record<string, unknown> | null {
  if (!isRecord(raw)) return null;
  for (const [key, stored] of Object.entries(raw)) {
    const definition = definitions.find((section) => section.key === key);
    if (!definition) continue;
    if (!isRecord(stored) || stored.format !== definition.format ||
      (definition.stage !== 2
        ? stored.origin !== "user_confirmed" &&
          (stored.origin !== "pending_setup_confirmed" ||
            (key !== "business_context" && key !== "business_name"))
        : stored.origin !== "user_reviewed") ||
      parseSectionValue(definition, stored.value) === null ||
      (stored.facts !== undefined && (definition.stage !== 1 || parseCommunicationFacts(stored.facts) === null))) {
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
}>, definitions: readonly CommunicationSectionDefinition[] = communicationSections): CommunicationBase | null {
  const sectionsJson = parseStoredSections(input.sections_json, definitions);
  if (typeof input.account_id !== "string" ||
      typeof input.version !== "number" ||
      !Number.isInteger(input.version) || input.version <= 0 ||
      typeof input.created_at !== "string" ||
      typeof input.updated_at !== "string" ||
      !sectionsJson) return null;
  const sections: Partial<Record<string, CommunicationSection>> = {};
  for (const definition of definitions) {
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
  definitions: readonly CommunicationSectionDefinition[] = communicationSections,
  rawFacts?: unknown,
): Record<string, unknown> | null {
  const definition = definitions.find((section) => section.key === key);
  if (!definition) return null;
  const normalized = parseSectionValue(definition, value);
  if (normalized === null) return null;
  if (definition.stage !== 2 && origin === "user_reviewed") return null;
  if (definition.stage === 2 && origin !== "user_reviewed") return null;
  if (origin === "pending_setup_confirmed" &&
      key !== "business_context" && key !== "business_name") return null;
  const previous = isRecord(current[key]) ? current[key] : {};
  const facts = rawFacts === undefined ? previous.facts : rawFacts;
  const parsedFacts = facts === undefined ? undefined : parseCommunicationFacts(facts);
  if (parsedFacts === null || (parsedFacts !== undefined && definition.stage !== 1)) return null;
  return {
    ...current,
    [key]: { ...previous, format: definition.format, value: normalized, origin,
      ...(parsedFacts === undefined ? {} : { facts: parsedFacts }) },
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

export function parseCommunicationFacts(raw: unknown): readonly CommunicationFact[] | null {
  if (!Array.isArray(raw) || raw.length > 30) return null;
  const rows: CommunicationFact[] = [];
  for (const row of raw) {
    if (!isRecord(row) || typeof row.label !== "string" || typeof row.value !== "string") return null;
    const label = row.label.trim(); const value = row.value.trim();
    if (label.length > 100 || value.length > 1000 || Boolean(label) !== Boolean(value)) return null;
    if (label && value) rows.push({ label, value });
  }
  return rows;
}
