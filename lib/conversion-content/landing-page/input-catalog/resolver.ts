import type { FactualCoverageErrorCode, FactualFieldRow, FactualTaxonChain, FactualTaxonIdentity, ResolveFactualCoverageResult, ResolvedFactualField } from "./contracts";
import { factualFieldDefinitionSchema, factualFieldKeySchema, factualFieldRowSchema } from "./schema";

export function resolveFactualCoverage(input: Readonly<{ taxonChain: FactualTaxonChain; rows: readonly FactualFieldRow[]; includeInactive?: boolean }>): ResolveFactualCoverageResult {
  const orderedTaxons = [input.taxonChain.segment, input.taxonChain.niche, input.taxonChain.ultraNiche].filter((taxon): taxon is FactualTaxonIdentity => Boolean(taxon));
  const servedTaxon = orderedTaxons.at(-1);
  if (!servedTaxon || !validChain(orderedTaxons)) return invalid("INVALID_TAXON_CHAIN", "A cadeia taxonômica é inválida.");
  if (new Set(input.rows.map((row) => row.fieldKey)).size !== input.rows.length) return invalid("DUPLICATE_FIELD_KEY", "A cobertura contém fieldKey duplicado.");
  const taxonsById = new Map(orderedTaxons.map((taxon) => [taxon.id, taxon]));
  const fields: ResolvedFactualField[] = [];
  for (const row of input.rows) {
    if (!factualFieldRowSchema.safeParse(row).success || !factualFieldKeySchema.safeParse(row.fieldKey).success) return invalid("INVALID_FIELD_ROW", `A row ${row.fieldKey || "desconhecida"} é inválida.`);
    if (!row.isActive && !input.includeInactive) continue;
    if (!factualFieldDefinitionSchema.safeParse(row.definition).success) return invalid("INVALID_FIELD_DEFINITION", `A definição de ${row.fieldKey} é inválida.`);
    const originTaxon = row.taxonId ? taxonsById.get(row.taxonId) : null;
    if (row.taxonId && !originTaxon) return invalid("FIELD_OUTSIDE_CHAIN", `O field ${row.fieldKey} reside fora da cadeia selecionada.`);
    fields.push(Object.freeze({ ...row.definition, id: row.id, fieldKey: row.fieldKey, taxonId: row.taxonId, originLayer: originTaxon?.level ?? "universal", originTaxon: originTaxon ?? null, ownership: row.taxonId === servedTaxon.id ? "own" : "inherited", isActive: row.isActive, updatedAt: row.updatedAt }));
  }
  const keys = new Set(fields.map((field) => field.fieldKey));
  for (const field of fields) for (const condition of [field.requiredWhen, field.applicableWhen]) {
    if (condition && !keys.has(condition.fieldKey)) return invalid("MISSING_CONDITION_REFERENCE", `A condição de ${field.fieldKey} referencia ${condition.fieldKey}, que não está na cobertura ativa.`);
  }
  fields.sort((a, b) => layerRank(a.originLayer) - layerRank(b.originLayer) || a.fieldKey.localeCompare(b.fieldKey));
  return { ok: true, value: Object.freeze({ servedTaxon, appliedLayers: Object.freeze([{ level: "universal" as const, taxon: null }, ...orderedTaxons.map((taxon) => ({ level: taxon.level, taxon }))]), fields: Object.freeze(fields) }) };
}

function validChain(taxons: readonly FactualTaxonIdentity[]): boolean {
  return taxons[0]?.level === "segment" && taxons.every((taxon, index) => index === 0 || taxon.parentId === taxons[index - 1].id) && taxons.map((taxon) => taxon.level).join(",") === ["segment", "niche", "ultra_niche"].slice(0, taxons.length).join(",");
}
function layerRank(level: ResolvedFactualField["originLayer"]): number { return level === "universal" ? 0 : level === "segment" ? 1 : level === "niche" ? 2 : 3; }
function invalid(code: FactualCoverageErrorCode, message: string): ResolveFactualCoverageResult { return { ok: false, error: { code, message } }; }
