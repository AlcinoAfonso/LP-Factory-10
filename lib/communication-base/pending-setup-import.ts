import { getCommunicationSection } from "./registry";
import { parseSectionValue } from "./policy";

type CandidateRow = Readonly<{
  business_display_name?: unknown;
  business_context_text: unknown;
  stage: unknown;
  completed_at: unknown;
}>;

export type PendingSetupInitialContext = Readonly<{
  businessName: string | null;
  businessContext: string | null;
}>;

export function selectPendingSetupInitialContext(rawRows: unknown): PendingSetupInitialContext | null {
  if (!Array.isArray(rawRows) || rawRows.length !== 1) return null;
  const row = rawRows[0] as CandidateRow | null;
  if (!row || row.stage !== "completed" || typeof row.completed_at !== "string" ||
      !Number.isFinite(Date.parse(row.completed_at))) return null;
  const businessName = getCommunicationSection("business_name");
  const businessContext = getCommunicationSection("business_context");
  if (!businessName || !businessContext) return null;
  const name = parseSectionValue(businessName, row.business_display_name);
  const context = parseSectionValue(businessContext, row.business_context_text);
  return {
    businessName: typeof name === "string" && name.length > 0 && name.length <= 120 ? name : null,
    businessContext: typeof context === "string" && context.length > 0 ? context : null,
  };
}

export function selectPendingSetupBusinessContext(rawRows: unknown): string | null {
  if (!Array.isArray(rawRows) || rawRows.length !== 1) return null;
  const row = rawRows[0] as CandidateRow | null;
  if (!row || row.stage !== "completed" ||
      typeof row.completed_at !== "string" ||
      !Number.isFinite(Date.parse(row.completed_at))) return null;

  const section = getCommunicationSection("business_context");
  if (!section) return null;
  const value = parseSectionValue(section, row.business_context_text);
  return typeof value === "string" && value.length > 0 ? value : null;
}
