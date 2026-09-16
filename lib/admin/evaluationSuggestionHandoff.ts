import type { InputCatalogEvaluationCandidate, InputCatalogEvaluationTaxonomicLayer } from "@/conversion-content/landing-page/taxon-preparation";
import type { ResolvedFactualCoverage } from "@/conversion-content/landing-page/input-catalog";

export type EvaluationSuggestionHandoff = Readonly<{
  name: string;
  description: string;
  layer: InputCatalogEvaluationTaxonomicLayer | null;
}>;

const layers = new Set<string>(["universal", "segment", "niche", "ultra_niche"]);

export function buildEvaluationSuggestionHref(taxonId: string, candidate: InputCatalogEvaluationCandidate): string {
  const query = new URLSearchParams({
    view: "entradas",
    taxon: taxonId,
    suggestionName: candidate.name,
    suggestionDescription: candidate.shortDescription,
    suggestionLayer: candidate.suggestedTaxonomyLayer ?? "",
  });
  return `/admin/estrutura-lp?${query.toString()}#adicionar-field-factual`;
}

export function parseEvaluationSuggestionHandoff(query: Record<string, string | undefined>): EvaluationSuggestionHandoff | null {
  const name = query.suggestionName?.trim() ?? "";
  const description = query.suggestionDescription?.trim() ?? "";
  const layer = query.suggestionLayer ?? "";
  if (!name || name.length > 120 || !description || description.length > 300 || (layer && !layers.has(layer))) return null;
  return { name, description, layer: layer ? layer as InputCatalogEvaluationTaxonomicLayer : null };
}

export function resolveSuggestedResidence(layer: InputCatalogEvaluationTaxonomicLayer | null, appliedLayers: ResolvedFactualCoverage["appliedLayers"]): string | null {
  if (!layer) return null;
  const applied = appliedLayers.find((candidate) => candidate.level === layer);
  if (!applied) return null;
  return layer === "universal" ? "universal" : applied.taxon?.id ?? null;
}

export function buildEvaluationRefinementHref(taxonId: string, fieldKey: string): string {
  const query = new URLSearchParams({ view: "entradas", taxon: taxonId, refineFieldKey: fieldKey });
  return `/admin/estrutura-lp?${query.toString()}#field-${encodeURIComponent(fieldKey)}`;
}

export function parseEvaluationRefinementHandoff(query: Record<string, string | undefined>): string | null {
  const fieldKey = query.refineFieldKey?.trim() ?? "";
  return fieldKey && fieldKey.length <= 100 ? fieldKey : null;
}

export function resolveRefinementTarget(fieldKey: string | null, fields: ResolvedFactualCoverage["fields"]): ResolvedFactualCoverage["fields"][number] | null {
  if (!fieldKey) return null;
  const matches = fields.filter((field) => field.fieldKey === fieldKey);
  return matches.length === 1 ? matches[0] : null;
}
