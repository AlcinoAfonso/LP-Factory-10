import type { InputCatalogEvaluationCandidate, InputCatalogEvaluationTaxonomicLayer } from "@/conversion-content/landing-page/taxon-preparation";

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
