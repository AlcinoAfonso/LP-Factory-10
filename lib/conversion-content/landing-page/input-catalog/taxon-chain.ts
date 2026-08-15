import type {
  LandingPageInputCatalogTaxonChain,
  LandingPageInputCatalogTaxonIdentity,
} from "./contracts";

export type BuildLandingPageInputCatalogTaxonChainResult =
  | Readonly<{ ok: true; value: LandingPageInputCatalogTaxonChain }>
  | Readonly<{
      ok: false;
      error: Readonly<{
        code: "INVALID_TAXON_CHAIN";
        message: string;
      }>;
    }>;

export function buildLandingPageInputCatalogTaxonChain(
  selected: LandingPageInputCatalogTaxonIdentity,
  taxons: readonly LandingPageInputCatalogTaxonIdentity[],
): BuildLandingPageInputCatalogTaxonChainResult {
  const byId = new Map(taxons.map((taxon) => [taxon.id, taxon]));

  if (!selected.isActive) return invalid("O taxon selecionado precisa estar ativo.");
  if (selected.level === "segment") {
    return selected.parentId === null
      ? { ok: true, value: { segment: selected } }
      : invalid("O segmento não pode possuir taxon pai.");
  }

  const parent = selected.parentId ? byId.get(selected.parentId) : undefined;
  if (!parent?.isActive) return invalid("O taxon pai ativo não foi encontrado.");

  if (selected.level === "niche") {
    return parent.level === "segment" && parent.parentId === null
      ? { ok: true, value: { segment: parent, niche: selected } }
      : invalid("A cadeia taxonômica do nicho é inválida.");
  }

  const segment = parent.parentId ? byId.get(parent.parentId) : undefined;
  if (
    parent.level !== "niche" ||
    !segment?.isActive ||
    segment.level !== "segment" ||
    segment.parentId !== null ||
    new Set([selected.id, parent.id, segment.id]).size !== 3
  ) {
    return invalid("A cadeia taxonômica do ultranicho é inválida.");
  }

  return {
    ok: true,
    value: { segment, niche: parent, ultraNiche: selected },
  };
}

function invalid(message: string): BuildLandingPageInputCatalogTaxonChainResult {
  return { ok: false, error: { code: "INVALID_TAXON_CHAIN", message } };
}
