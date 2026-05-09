export type TaxonLevel = "segment" | "niche" | "ultra_niche";

export type TaxonMatchCandidate = {
  taxonId: string;
  name: string;
  slug: string;
  level: TaxonLevel;
  parentId: string | null;
  parentName: string | null;
  matchedAliases: string[];
  matchSource: string;
  score: number;
};
