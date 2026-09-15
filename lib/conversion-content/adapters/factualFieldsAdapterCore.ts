import { resolveFactualCoverage, type FactualFieldRow, type FactualTaxonChain, type ResolveFactualCoverageResult } from "../landing-page/input-catalog";

export const FACTUAL_FIELDS_PAGE_SIZE = 500;

export type FactualFieldsReadErrorCode = "READ_FAILED" | "INVALID_RESPONSE" | "RESOLUTION_FAILED";
export type ReadFactualFieldsPage = (offset: number, limit: number) => PromiseLike<Readonly<{ data: unknown; error: unknown; status?: number }>>;
export type ReadCompleteFactualCoverageResult = ResolveFactualCoverageResult | Readonly<{ ok: false; error: Readonly<{ code: FactualFieldsReadErrorCode; message: string }> }>;

export async function readCompleteFactualCoverageFromPages(
  taxonChain: FactualTaxonChain,
  readPage: ReadFactualFieldsPage,
  options: Readonly<{ includeInactive?: boolean }> = {},
): Promise<ReadCompleteFactualCoverageResult> {
  const rows: FactualFieldRow[] = [];
  let offset = 0;
  while (true) {
    let response: Awaited<ReturnType<ReadFactualFieldsPage>>;
    try { response = await readPage(offset, FACTUAL_FIELDS_PAGE_SIZE); }
    catch { return failure("READ_FAILED", "A cobertura factual não pôde ser lida integralmente."); }
    if (offset > 0 && isRangeTermination(response.error, response.status)) break;
    if (response.error || !Array.isArray(response.data) || response.data.length > FACTUAL_FIELDS_PAGE_SIZE) return failure("READ_FAILED", "A cobertura factual não pôde ser lida integralmente.");
    for (const value of response.data) {
      const row = normalizeFactualFieldRow(value);
      if (!row) return failure("INVALID_RESPONSE", "A autoridade factual devolveu uma row inválida.");
      rows.push(row);
    }
    if (response.data.length < FACTUAL_FIELDS_PAGE_SIZE) break;
    offset += response.data.length;
  }
  const resolved = resolveFactualCoverage({ taxonChain, rows, includeInactive: options.includeInactive });
  return resolved.ok ? resolved : failure("RESOLUTION_FAILED", resolved.error.message);
}

function normalizeFactualFieldRow(value: unknown): FactualFieldRow | null {
  if (!isRecord(value) || typeof value.id !== "string" || typeof value.field_key !== "string" || (value.taxon_id !== null && typeof value.taxon_id !== "string") || !isRecord(value.definition) || typeof value.is_active !== "boolean" || (value.created_by !== null && typeof value.created_by !== "string") || (value.updated_by !== null && typeof value.updated_by !== "string") || typeof value.created_at !== "string" || typeof value.updated_at !== "string") return null;
  return { id: value.id, fieldKey: value.field_key, taxonId: value.taxon_id, definition: value.definition as FactualFieldRow["definition"], isActive: value.is_active, createdBy: value.created_by, updatedBy: value.updated_by, createdAt: value.created_at, updatedAt: value.updated_at };
}
function isRangeTermination(error: unknown, status?: number): boolean { return status === 416 || (isRecord(error) && error.code === "PGRST103"); }
function isRecord(value: unknown): value is Record<string, unknown> { return typeof value === "object" && value !== null && !Array.isArray(value); }
function failure(code: FactualFieldsReadErrorCode, message: string): ReadCompleteFactualCoverageResult { return { ok: false, error: { code, message } }; }
