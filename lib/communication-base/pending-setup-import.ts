import { getCommunicationSection } from "./registry";
import { parseSectionValue } from "./policy";

type CandidateRow = Readonly<{
  business_context_text: unknown;
  stage: unknown;
  completed_at: unknown;
}>;

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
