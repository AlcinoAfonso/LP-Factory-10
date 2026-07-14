export const LANDING_PAGE_RESEARCH_BLOCKS = [
  "strategic_core",
  "lp_overview",
  "lp_sections",
  "seo",
] as const;

export type LandingPageResearchBlock =
  (typeof LANDING_PAGE_RESEARCH_BLOCKS)[number];
export type LandingPageResearchAudienceScope =
  | "business_buyer"
  | "end_customer";
export type LandingPageResearchSourceRelation = "own" | "direct_parent";

export type LandingPageResearchTaxonDto = Readonly<{
  id: string;
  parentId: string | null;
  isActive: boolean;
}>;

export type LandingPageResearchParentDto = Readonly<{
  id: string;
  taxonId: string;
  researchBlock: string;
  audienceScope: string;
  version: number;
  status: string;
}>;

export type LandingPageResearchItemDto = Readonly<{
  id: string;
  researchId: string;
  itemKey: string | null;
  itemText: string | null;
  priority: number | null;
  sortOrder: number | null;
  isActive: boolean;
}>;

export type LandingPageResearchNormalizedSource =
  | Readonly<{
      status: "ready";
      taxons: readonly LandingPageResearchTaxonDto[];
      researches: readonly LandingPageResearchParentDto[];
      items: readonly LandingPageResearchItemDto[];
    }>
  | Readonly<{ status: "read_failed" }>
  | Readonly<{ status: "not_normalizable" }>;

export type ResolveLandingPageResearchInput = Readonly<{
  taxonId: string;
  source: LandingPageResearchNormalizedSource;
}>;

export type ResolvedLandingPageResearchItem = Readonly<{
  itemId: string;
  researchId: string;
  itemKey: string;
  itemText: string;
  priority: number;
  sortOrder: number;
  servedTaxonId: string;
  sourceTaxonId: string;
  sourceRelation: LandingPageResearchSourceRelation;
  audienceScope: LandingPageResearchAudienceScope;
  researchVersion: number;
}>;

export type ResolvedLandingPageResearchParent = Readonly<{
  researchId: string;
  researchBlock: LandingPageResearchBlock;
  audienceScope: LandingPageResearchAudienceScope;
  version: number;
  sourceTaxonId: string;
  items: readonly ResolvedLandingPageResearchItem[];
}>;

export type ResolvedLandingPageResearchAudience = Readonly<{
  audienceScope: LandingPageResearchAudienceScope;
  sourceTaxonId: string;
  sourceRelation: LandingPageResearchSourceRelation;
  version: number;
  researches: readonly ResolvedLandingPageResearchParent[];
}>;

export type ResolvedLandingPageResearch = Readonly<{
  servedTaxonId: string;
  endCustomer: ResolvedLandingPageResearchAudience;
  businessBuyer: ResolvedLandingPageResearchAudience;
  versions: Readonly<{
    endCustomer: number;
    businessBuyer: number;
  }>;
}>;

export type LandingPageResearchResolutionErrorCode =
  | "INVALID_TAXON_ID"
  | "READ_FAILED"
  | "SOURCE_NOT_NORMALIZABLE"
  | "TAXON_NOT_FOUND"
  | "TAXON_INACTIVE"
  | "DIRECT_PARENT_NOT_FOUND"
  | "DIRECT_PARENT_INACTIVE"
  | "RESEARCH_MISSING"
  | "RESEARCH_INCOMPLETE"
  | "RESEARCH_INVALID"
  | "RESEARCH_AMBIGUOUS";

export type LandingPageResearchResolutionError = Readonly<{
  code: LandingPageResearchResolutionErrorCode;
  message: string;
  audienceScope?: LandingPageResearchAudienceScope;
  sourceTaxonId?: string;
  sourceRelation?: LandingPageResearchSourceRelation;
}>;

export type LandingPageResearchResolutionResult =
  | Readonly<{ ok: true; value: ResolvedLandingPageResearch }>
  | Readonly<{ ok: false; error: LandingPageResearchResolutionError }>;
