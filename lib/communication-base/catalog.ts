import { communicationSections, type CommunicationSectionDefinition } from "./registry";
export const COMMUNICATION_CATEGORIES = ["business", "materials", "intelligence"] as const;
export type CommunicationCategory = typeof COMMUNICATION_CATEGORIES[number];
export const communicationCategoryLabels: Record<CommunicationCategory, string> = {
  business: "Dados do negócio", materials: "Materiais de comunicação", intelligence: "Inteligência e copy",
};
export type CommunicationCatalogSection = CommunicationSectionDefinition & Readonly<{
  id: string; category: CommunicationCategory; position: number; updatedAt: string;
}>;
export function parseCommunicationCatalog(raw: unknown): readonly CommunicationCatalogSection[] | null {
  if (!Array.isArray(raw) || raw.length < 17 || raw.length > 150) return null;
  const result: CommunicationCatalogSection[] = []; const keys = new Set<string>();
  for (const row of raw) {
    if (!row || typeof row !== "object" || typeof row.id !== "string" ||
      typeof row.section_key !== "string" || keys.has(row.section_key) ||
      typeof row.label !== "string" || !row.label.trim() || row.label.length > 120 ||
      !COMMUNICATION_CATEGORIES.includes(row.category) || !Number.isInteger(row.sort_order) || row.sort_order < 1 ||
      typeof row.updated_at !== "string") return null;
    const fixed = communicationSections.find(s => s.key === row.section_key);
    const stage = row.category === "business" ? 1 : row.category === "intelligence" ? 2 : 3;
    if (fixed ? fixed.stage !== stage || fixed.format !== row.format
      : row.format !== (stage === 3 ? "material_items" : "text")) return null;
    keys.add(row.section_key);
    result.push({ id: row.id, key: row.section_key, label: row.label, format: row.format, stage,
      group: communicationCategoryLabels[row.category as CommunicationCategory], category: row.category,
      position: row.sort_order, updatedAt: row.updated_at });
  }
  if (communicationSections.some(s => !keys.has(s.key)) ||
    ["visual_identity", "media_library", "testimonials"].some(key => !keys.has(key))) return null;
  return result.sort((a,b)=>COMMUNICATION_CATEGORIES.indexOf(a.category)-COMMUNICATION_CATEGORIES.indexOf(b.category) || a.position-b.position || a.key.localeCompare(b.key));
}
