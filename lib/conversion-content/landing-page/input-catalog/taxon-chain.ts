import type { BuildFactualTaxonChainResult, FactualTaxonChain, FactualTaxonIdentity } from "./contracts";
import { factualTaxonIdentitySchema } from "./schema";

export function buildFactualTaxonChain(selected: FactualTaxonIdentity, taxons: readonly FactualTaxonIdentity[]): BuildFactualTaxonChainResult {
  if (!factualTaxonIdentitySchema.safeParse(selected).success) return invalid("O taxon selecionado é inválido.");
  if (new Set(taxons.map((taxon) => taxon.id)).size !== taxons.length || taxons.some((taxon) => !factualTaxonIdentitySchema.safeParse(taxon).success)) return invalid("A taxonomia contém identidades inválidas ou duplicadas.");
  const byId = new Map(taxons.map((taxon) => [taxon.id, taxon]));
  byId.set(selected.id, selected);
  let segment: FactualTaxonIdentity | undefined;
  let niche: FactualTaxonIdentity | undefined;
  let ultraNiche: FactualTaxonIdentity | undefined;
  let cursor: FactualTaxonIdentity | undefined = selected;
  const visited = new Set<string>();
  while (cursor) {
    if (visited.has(cursor.id)) return invalid("A cadeia taxonômica contém ciclo.");
    visited.add(cursor.id);
    if (cursor.level === "segment") segment = cursor;
    else if (cursor.level === "niche") niche = cursor;
    else ultraNiche = cursor;
    cursor = cursor.parentId ? byId.get(cursor.parentId) : undefined;
  }
  if (!segment || segment.parentId !== null || (niche && niche.parentId !== segment.id) || (ultraNiche && ultraNiche.parentId !== niche?.id)) return invalid("A hierarquia esperada Segmento → Nicho → Ultranicho não foi comprovada.");
  if (selected.level === "segment" && (niche || ultraNiche)) return invalid("A cadeia excede o taxon selecionado.");
  if (selected.level === "niche" && (!niche || ultraNiche)) return invalid("A cadeia não corresponde ao Nicho selecionado.");
  if (selected.level === "ultra_niche" && !ultraNiche) return invalid("A cadeia não corresponde ao Ultranicho selecionado.");
  return { ok: true, value: Object.freeze({ segment, niche, ultraNiche }) };
}

function invalid(message: string): BuildFactualTaxonChainResult { return { ok: false, error: { code: "INVALID_TAXON_CHAIN", message } }; }
